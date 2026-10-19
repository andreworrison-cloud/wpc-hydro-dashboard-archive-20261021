#!/usr/bin/env python3
"""H8 review-only Pass 1 ingest; independent, optional same-window Pass 2.
No production publication. Raw inputs and numerical derivatives are hash verified.
"""
import argparse,concurrent.futures,gzip,hashlib,json,os,re,shutil,sys,tempfile,fcntl
from contextlib import contextmanager
from datetime import datetime,timedelta,timezone
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import reproject,Resampling
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from tools.audit_h8_sources import inventory,fetch,MRMS,WPC
from tools.probe_rfc_ffg_numeric import validate_grib
from fetch_rfc_ffg import read_fields,coverage,BASELINE,POLICY
UTC=timezone.utc
HOURS=(1,3,6)
FRESHNESS={1:dict(qpe_hours=3,snapshot_hours=3,reference_hours=9),2:dict(qpe_hours=6,snapshot_hours=9,reference_hours=15)}
def pair_deadline(end,snapshot,reference,number):
 policy=FRESHNESS[number]
 return min(end+timedelta(hours=policy['qpe_hours']),snapshot+timedelta(hours=policy['snapshot_hours']),reference+timedelta(hours=policy['reference_hours']))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def atomic(path,obj):
 temp=path.with_suffix('.tmp');temp.write_text(json.dumps(obj,indent=2)+'\n');os.replace(temp,path)
def select_common(inventories,now):
 common=set.intersection(*[set(r['end'] for r in x['rows']) for x in inventories])
 eligible=[datetime.fromisoformat(t) for t in common if datetime.fromisoformat(t)<=now]
 if not eligible:raise ValueError('No common nonfuture QPE ending')
 t=max(eligible)
 if now-t>=timedelta(hours=3):raise ValueError('Review QPE exceeds provisional 3-hour age gate')
 return t

def validate_qpe(d,product,end):
 tags=d.tags(1)
 if d.count!=1 or d.shape!=(3500,7000) or d.crs is None:raise ValueError('Unexpected MRMS grid')
 if tags.get('GRIB_ELEMENT')!=product or tags.get('GRIB_UNIT')!='[mm]' or tags.get('GRIB_PDS_PDTN')!='0':raise ValueError('Wrong MRMS parameter/units/template')
 if int(tags['GRIB_VALID_TIME'])!=int(end.timestamp()) or int(tags['GRIB_REF_TIME'])!=int(end.timestamp()) or int(tags['GRIB_FORECAST_SECONDS'])!=0:raise ValueError('MRMS time mismatch')
 a=d.read(1,masked=True).filled(np.nan).astype('float32');a[~np.isfinite(a)|(a<0)]=np.nan
 if not np.isfinite(a).any():raise ValueError('All QPE unavailable')
 return a,tags

def ratios(q,qt,qc,f,ft,fc):
 threshold=np.full(q.shape,np.nan,dtype='float32')
 reproject(f,threshold,src_transform=ft,src_crs=fc,src_nodata=np.nan,dst_transform=qt,dst_crs=qc,dst_nodata=np.nan,resampling=Resampling.nearest)
 fine=np.full(q.shape,np.nan,dtype='float32');valid=np.isfinite(q)&np.isfinite(threshold)&(threshold>0)
 np.divide(q,threshold,out=fine,where=valid)
 mean=np.full(f.shape,np.nan,dtype='float32');coverage=np.zeros(f.shape,dtype='float32')
 opts=dict(src_transform=qt,src_crs=qc,dst_transform=ft,dst_crs=fc)
 reproject(q,mean,src_nodata=np.nan,dst_nodata=np.nan,resampling=Resampling.average,**opts)
 reproject(np.isfinite(q).astype('float32'),coverage,resampling=Resampling.average,**opts)
 coarse=np.full(f.shape,np.nan,dtype='float32');ok=np.isfinite(f)&(f>0)&np.isfinite(mean)&(coverage>=.99)
 np.divide(mean,f,out=coarse,where=ok)
 return fine,coarse,mean,coverage

def write_tif(path,a,tr,crs):
 with rasterio.open(path,'w',driver='GTiff',height=a.shape[0],width=a.shape[1],count=1,dtype='float32',crs=crs,transform=tr,nodata=np.nan,compress='deflate',predictor=3,tiled=True) as d:d.write(a,1)
 return dict(path=path.name,sha256=digest(path),shape=list(a.shape))
def verify_generation(root,m):
 folder=root/'generations'/m['generation']
 for asset in m['files']:
  p=folder/asset['path']
  if p.parent!=folder or digest(p)!=asset['sha256']:raise ValueError('Retained asset checksum mismatch')
 return m

@contextmanager
def writer_lock(root):
 # One process owns discovery, generation creation and both publication pointers.
 with (root/'.writer.lock').open('a') as handle:
  try:fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise RuntimeError('Another H8 ingest owns this output directory')
  try:yield
  finally:fcntl.flock(handle,fcntl.LOCK_UN)

def window_path(root,pass_number,end,historical):
 return root/f'pass{pass_number}'/'windows'/('historical' if historical else 'live')/(end.astimezone(UTC).strftime('%Y%m%d%H%M%S')+'.json')

def read_window(root,pass_number,end,historical):
 p=window_path(root,pass_number,end,historical)
 if not p.exists():return None
 m=json.loads(p.read_text())
 if datetime.fromisoformat(m['qpe_end'])!=end or m['historical_review']!=historical or m['pass_number']!=pass_number:raise ValueError('Window binding identity mismatch')
 return verify_generation(root/f'pass{pass_number}',m)

def bind_window(root,manifest):
 end=datetime.fromisoformat(manifest['qpe_end']);number=manifest['pass_number'];historical=manifest['historical_review']
 previous=read_window(root,number,end,historical)
 if previous and previous['generation']!=manifest['generation']:raise ValueError('Source revision requires an explicit reviewed revision; frozen window preserved')
 path=window_path(root,number,end,historical);path.parent.mkdir(parents=True,exist_ok=True)
 if not previous:atomic(path,manifest)

def resolve_ffg(root,end,historical,check_time,pass_number=1):
 existing=read_window(root,1,end,historical)
 if existing:
  meta=existing['ffg'];path=root/'pass1'/'generations'/existing['generation']/'ffg.g2'
 else:
  raw,_=fetch(WPC)
  candidates=sorted(set(re.findall(r'href="(5kmffg_\d{10}\.g2)"',raw.decode())))
  eligible=[n for n in candidates if datetime.strptime(n[7:17],'%Y%m%d%H').replace(tzinfo=UTC)<=end]
  if not eligible:raise ValueError('No FFG snapshot at or before rainfall ending')
  chosen=eligible[-1];snapshot=datetime.strptime(chosen[7:17],'%Y%m%d%H').replace(tzinfo=UTC)
  data,meta=fetch(WPC+chosen);validate_grib(data);meta['snapshot_time']=snapshot.isoformat()
  meta['first_seen_at']=meta['retrieved_at']
  path=root/'selected_ffg.g2';path.write_bytes(data)
 if check_time-datetime.fromisoformat(meta['snapshot_time'])>=timedelta(hours=FRESHNESS[pass_number]['snapshot_hours']):raise ValueError('Frozen FFG snapshot exceeds review age gate')
 if digest(path)!=meta['sha256']:raise ValueError('FFG source checksum mismatch')
 return path,meta

def build(root,pass_number,end,rows,ffg_path,ffg_meta,now,check_time):
 out=root/f'pass{pass_number}';(out/'generations').mkdir(parents=True,exist_ok=True)
 historical=check_time!=now
 snapshot=datetime.fromisoformat(ffg_meta['snapshot_time'])
 if snapshot>end or check_time-snapshot>=timedelta(hours=FRESHNESS[pass_number]['snapshot_hours']):raise ValueError('FFG snapshot outside pairing gate')
 if pass_number==2:
  baseline=read_window(root,1,end,historical)
  if not baseline or baseline['ffg']['sha256']!=ffg_meta['sha256']:raise ValueError('Pass 2 requires the frozen same-window Pass 1 FFG baseline')
 if digest(ffg_path)!=ffg_meta['sha256']:raise ValueError('FFG source checksum mismatch')
 fields,fc,ft,ref,ends=read_fields(ffg_path)
 coverage(fields,fc,ft,json.loads(BASELINE.read_text()),POLICY)
 if ref>datetime.fromisoformat(ffg_meta['snapshot_time']):raise ValueError('FFG reference after snapshot')
 if check_time-ref>=timedelta(hours=FRESHNESS[pass_number]['reference_hours']) or ref>check_time:raise ValueError('FFG reference outside review age gate')
 inputs={};downloads=[]
 def get(h):
  product=f'MultiSensor_QPE_{h:02d}H_Pass{pass_number}';row=next(r for r in rows[product]['rows'] if r['end']==end.isoformat())
  raw,meta=fetch(MRMS+product+'/'+row['filename']);data=gzip.decompress(raw)
  if len(data)>100_000_000:raise ValueError('GRIB exceeds bound')
  validate_grib(data);return h,product,data,raw,meta
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:downloads=list(pool.map(get,HOURS))
 ident={'ffg':ffg_meta['sha256'],'qpe':{str(h):m['sha256'] for h,_,_,_,m in downloads},'pass':pass_number,'revision':'h8-review-v3','historical':check_time!=now}
 generation=end.strftime('%Y%m%d%H')+'-'+hashlib.sha256(json.dumps(ident,sort_keys=True).encode()).hexdigest()[:20]
 previous=read_window(root,pass_number,end,historical)
 if previous and previous['generation']!=generation:raise ValueError('Source revision requires an explicit reviewed revision; frozen window preserved')
 manifest=dict(schema_version=2,generation=generation,pass_number=pass_number,qpe_end=end.isoformat(),accepted_at=now.isoformat(),review_only=True,historical_review=(check_time!=now),live_age_deadline=pair_deadline(end,snapshot,ref,pass_number).isoformat(),freshness_policy=FRESHNESS[pass_number],pairing='window-fixed retrospective comparison' if historical else 'window-fixed operational comparison; not pre-rainfall guidance or as-issued verification',pairing_policy='h8-window-fixed-v1',paired_at=baseline['paired_at'] if pass_number==2 else datetime.now(UTC).isoformat(),ffg=ffg_meta,ffg_reference=ref.isoformat(),ffg_encoded_ends=ends,files=[],products={})
 with tempfile.TemporaryDirectory(prefix='.stage-',dir=out) as tmp:
  stage=Path(tmp);shutil.copyfile(ffg_path,stage/'ffg.g2');manifest['files'].append(dict(path='ffg.g2',sha256=digest(stage/'ffg.g2')))
  geometry=None
  for h,product,data,raw,meta in downloads:
   path=stage/f'qpe_{h}h.grib2';path.write_bytes(data);gz=stage/f'qpe_{h}h.grib2.gz';gz.write_bytes(raw)
   manifest['files'] += [dict(path=path.name,sha256=digest(path)),dict(path=gz.name,sha256=digest(gz))]
   with rasterio.open(path) as d:
    q,tags=validate_qpe(d,product,end);geo=(d.shape,d.transform,d.crs)
    if geometry and geo!=geometry:raise ValueError('Mixed QPE geometry')
    geometry=geo;f=fields[h].filled(np.nan).astype('float32');fine,coarse,mean,cov=ratios(q,d.transform,d.crs,f,ft,fc)
    if np.isfinite(coarse).sum()<.99*np.isfinite(f).sum():raise ValueError('Insufficient paired QPE/FFG coverage')
    assets={}
    for name,a,tr,crs in [('fine_ratio',fine,d.transform,d.crs),('coarse_ratio',coarse,ft,fc),('coarse_qpe_mm',mean,ft,fc),('coverage',cov,ft,fc)]:
     asset=write_tif(stage/f'{h}h_{name}.tif',a,tr,crs);manifest['files'].append(asset);assets[name]=asset
    # Select a continental US review maximum, not offshore/Canada.
    lat=d.transform.f+(np.arange(d.height)+.5)*d.transform.e;lon=d.transform.c+(np.arange(d.width)+.5)*d.transform.a
    domain=(lat[:,None]>=24)&(lat[:,None]<=50)&(lon[None,:]>=-125)&(lon[None,:]<=-66)
    v=np.where(domain,fine,np.nan);r,c=np.unravel_index(np.nanargmax(v),v.shape)
    summary=dict(window_start=(end-timedelta(hours=h)).isoformat(),window_end=end.isoformat(),qpe_source=meta,grib_tags=tags,assets=assets,ffg_cells=int(np.isfinite(f).sum()),paired_coarse_cells=int(np.isfinite(coarse).sum()),fine_ratio_max_in_view=float(v[r,c]),fine_peak_lon=float(lon[c]),fine_peak_lat=float(lat[r]),fine_peak_qpe_mm=float(q[r,c]),coarse_ratio_max=float(np.nanmax(coarse)),fine_ge1_cells=int(np.nansum(fine>=1)),coarse_ge1_cells=int(np.nansum(coarse>=1)),count_note='Fine and coarse cell counts have different spatial support; not directly comparable areas')
    manifest['products'][str(h)]=summary
   print(f'Pass {pass_number} {h}h: fine max {summary["fine_ratio_max_in_view"]:.3f}; coarse max {summary["coarse_ratio_max"]:.3f}',flush=True)
  manifest['accepted_at']=datetime.now(UTC).isoformat()
  atomic(stage/'manifest.json',manifest)
  target=out/'generations'/generation
  if target.exists():
   old=json.loads((target/'manifest.json').read_text());verify_generation(out,old);manifest=old
  else:os.replace(stage,target)
  verify_generation(out,manifest)
  if not historical and datetime.now(UTC)>=datetime.fromisoformat(manifest['live_age_deadline']):raise ValueError('Pair expired during processing; publication withheld')
  bind_window(root,manifest)
  atomic(out/'metadata.json',manifest)
 return manifest

def failure_status(root,error,current):
 result={'state':'unavailable','error':str(error),'review_only':True}
 try:
  m=json.loads((root/'metadata.json').read_text());verify_generation(root,m)
  expired=current>=datetime.fromisoformat(m['live_age_deadline'])
  result.update(state='expired' if expired or m.get('historical_review') else 'retained',generation=m['generation'],qpe_end=m['qpe_end'],live_age_deadline=m['live_age_deadline'])
 except Exception as e:result['retention_check']=str(e)
 return result

def select_pass2_target(root,inventories,current_end,historical,now):
 common=set.intersection(*[set(r['end'] for r in x['rows']) for x in inventories])
 for end in sorted((datetime.fromisoformat(t) for t in common),reverse=True):
  if end>current_end or (historical and end!=current_end):continue
  baseline=read_window(root,1,end,historical)
  if baseline and (historical or now<pair_deadline(end,datetime.fromisoformat(baseline['ffg']['snapshot_time']),datetime.fromisoformat(baseline['ffg_reference']),2)):
   previous=read_window(root,2,end,historical)
   # Retained immutable generations keep their originally declared deadline.
   if previous and not historical and now>=datetime.fromisoformat(previous['live_age_deadline']):continue
   return end
 return None

def run(args):
 root=args.output_dir;now=datetime.now(UTC)
 inv={};end=now.replace(minute=0,second=0,microsecond=0);check_time=now
 status=dict(freshness_by_pass=FRESHNESS,at=now.isoformat(),review_only=True,provisional_qpe_max_age_hours=3,provisional_ffg_snapshot_max_age_hours=3,provisional_ffg_reference_max_age_hours=9)
 try:
  names=[f'MultiSensor_QPE_{h:02d}H_Pass1' for h in HOURS]
  with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
   for x in pool.map(lambda k:inventory(k,root),names):inv[x['product']]=x
  end=datetime.fromisoformat(args.historical_end.replace('Z','+00:00')) if args.historical_end else select_common(list(inv.values()),now)
  if end.tzinfo is None or end>now:raise ValueError('Historical end must be timezone-aware and not future')
  if not all(end.isoformat() in {r['end'] for r in inv[k]['rows']} for k in names):raise ValueError('Requested end missing from a Pass 1 duration')
  check_time=end if args.historical_end else now
  status['historical_review']=bool(args.historical_end)
  path,meta=resolve_ffg(root,end,bool(args.historical_end),check_time)
  one=build(root,1,end,inv,path,meta,now,check_time);status['pass1']={'state':'accepted','generation':one['generation']}
 except Exception as e:
  status['pass1']=failure_status(root/'pass1',e,datetime.now(UTC));atomic(root/'attempt.json',status)
  if args.historical_end:raise
 try:
  names=[f'MultiSensor_QPE_{h:02d}H_Pass2' for h in HOURS]
  with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
   for x in pool.map(lambda k:inventory(k,root),names):inv[x['product']]=x
  target=select_pass2_target(root,[inv[k] for k in names],end,bool(args.historical_end),datetime.now(UTC))
  if target is None:status['pass2']={'state':'waiting_for_paired_window','target_end':end.isoformat(),'same_window_comparison_available':False}
  else:
   baseline_path,baseline_meta=resolve_ffg(root,target,bool(args.historical_end),check_time,pass_number=2)
   two=build(root,2,target,inv,baseline_path,baseline_meta,now,check_time)
   status['pass2']={'state':'accepted' if target==end else 'accepted_prior_window','generation':two['generation'],'qpe_end':target.isoformat(),'current_pass1_end':end.isoformat(),'matches_current_pass1_window':target==end,'comparison_pass1_generation':read_window(root,1,target,bool(args.historical_end))['generation']}

 except Exception as e:
  status['pass2']=failure_status(root/'pass2',e,datetime.now(UTC))
  status['pass2']['target_end']=end.isoformat()
  status['pass2']['same_window_comparison_available']=False
 status['finished_at']=datetime.now(UTC).isoformat();atomic(root/'attempt.json',status);print(json.dumps(status,indent=2),flush=True)
 if status['pass1']['state']!='accepted':raise RuntimeError('Pass 1 failed; independent Pass 2 attempt completed; see attempt.json')
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--historical-end',help='Explicit retrospective UTC ISO ending; never marks output current');args=p.parse_args()
 args.output_dir.mkdir(parents=True,exist_ok=True)
 with writer_lock(args.output_dir):run(args)
if __name__=='__main__':main()
