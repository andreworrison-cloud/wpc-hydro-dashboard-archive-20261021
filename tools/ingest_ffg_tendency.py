#!/usr/bin/env python3
"""Exact hourly RFC-mosaic tendencies; bounded raw inputs and immutable overlays."""
import argparse, hashlib, json, re, shutil, sys, tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np
from PIL import Image
from rasterio.warp import reproject, Resampling, transform_bounds
from rasterio.transform import from_bounds
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fetch_rfc_ffg import read_fields, coverage, BASELINE, POLICY, atomic_json, digest, safe_path, dt
from tools.probe_rfc_ffg_numeric import download, validate_grib, SOURCE
UTC=timezone.utc
LAGS=(6,12,24)
HOURS=(1,3,6)
EDGES=[-2,-1,-.5,-.25,-.01,.01,.25,.5,1,2]
COLORS=['08306b','08519c','2171b5','6baed6','c6dbef','f5f4ef','f6dfba','e8b66b','ca8639','9b591e','65350f']
VIEW_POLICY={'snapshot_hours':3,'reference_hours':9,'warning_hours':2,'raw_retention_hours':72}
BOUNDS=[-126,24,-66,50]
def stamp(name):return datetime.strptime(name[7:17],'%Y%m%d%H').replace(tzinfo=UTC)
def expiry(source):return min(dt(source['snapshot_time'])+timedelta(hours=3),dt(source['reference_time'])+timedelta(hours=9))
def difference(new,old):
 if new.shape!=old.shape:raise ValueError('Native grid shape mismatch')
 a=np.ma.asarray(new).filled(np.nan).astype('float32');b=np.ma.asarray(old).filled(np.nan).astype('float32')
 return np.where(np.isfinite(a)&np.isfinite(b),(a-b)/25.4,np.nan).astype('float32')
def source(root,name,index,refetch=False):
 meta=index.get(name)
 if meta is None or refetch:
  raw,request=download(SOURCE+name);validate_grib(raw)
  sha=hashlib.sha256(raw).hexdigest();rel=f'sources/{name[:-3]}-{sha[:20]}.g2';path=root/'science'/rel
  path.parent.mkdir(parents=True,exist_ok=True)
  if not path.exists():path.write_bytes(raw)
  meta={'path':rel,'sha256':sha,'snapshot_time':stamp(name).isoformat(),'request':request}
  # Preserve first acquisition time for identical bytes.
  if index.get(name,{}).get('sha256')==sha:meta=index[name]
 path=safe_path(root/'science',meta['path'])
 if digest(path)!=meta['sha256']:raise ValueError('Retained source checksum mismatch')
 fields,crs,tr,ref,ends=read_fields(path)
 coverage(fields,crs,tr,json.loads(BASELINE.read_text()),POLICY)
 if ref>stamp(name) or stamp(name)-ref>=timedelta(hours=9):raise ValueError('Source reference outside snapshot qualification')
 meta={**meta,'reference_time':ref.isoformat(),'encoded_ends':ends}
 index[name]=meta
 return fields,crs,tr,meta

def render(delta,crs,tr,path):
 dest=np.full((2538,4000),np.nan,dtype='float32');mask=np.zeros(dest.shape,dtype='uint8')
 target=from_bounds(*transform_bounds('EPSG:4326','EPSG:3857',*BOUNDS),4000,2538)
 opts=dict(src_transform=tr,src_crs=crs,dst_transform=target,dst_crs='EPSG:3857')
 reproject(delta,dest,src_nodata=np.nan,dst_nodata=np.nan,resampling=Resampling.bilinear,**opts)
 reproject(np.isfinite(delta).astype('uint8'),mask,resampling=Resampling.nearest,**opts)
 valid=np.isfinite(dest)&(mask>0);rgba=np.zeros((*dest.shape,4),dtype='uint8')
 bins=np.searchsorted(EDGES,dest,side='right');colors=np.array([list(bytes.fromhex(c)) for c in COLORS],dtype='uint8')
 rgba[valid,:3]=colors[bins[valid]];rgba[valid,3]=255;Image.fromarray(rgba).save(path)

def verify(root):
 m=json.loads((root/'public/metadata.json').read_text())
 if m.get('schema_version')!=1 or m.get('policy')!=VIEW_POLICY:raise ValueError('Invalid tendency policy/schema')
 for lag,a in m['products'].items():
  if int(lag) not in LAGS:raise ValueError('Unknown lookback')
  if not a:continue
  if dt(a['new']['snapshot_time'])-dt(a['old']['snapshot_time'])!=timedelta(hours=int(lag)):raise ValueError('Nonexact tendency endpoints')
  if a['expires_at']!=expiry(a['new']).isoformat():raise ValueError('Changed expiry')
  if set(a['assets'])!={'1','3','6'}:raise ValueError('Incomplete duration set')
  for src in (a['new'],a['old']):
   if digest(safe_path(root/'science',src['path']))!=src['sha256']:raise ValueError('Source checksum mismatch')
  for h,asset in a['assets'].items():
   if asset['duration_hours']!=int(h) or not asset['path'].startswith('generations/'+a['generation']+'/'):raise ValueError('Invalid asset contract')
   if digest(safe_path(root/'public',asset['path']))!=asset['sha256']:raise ValueError('Image checksum mismatch')
 return m

def prune(root,now=None):
 now=now or datetime.now(UTC);m=verify(root);index_path=root/'science/index.json';index=json.loads(index_path.read_text())
 keep_sources=set();keep_gen=set()
 for a in m['products'].values():
  if a:
   keep_gen.add(a['generation']);keep_sources.update(s['path'] for s in (a['new'],a['old']))
 index={k:v for k,v in index.items() if dt(v['snapshot_time'])>=now-timedelta(hours=72)}
 keep_sources.update(v['path'] for v in index.values())
 for p in (root/'science/sources').glob('*.g2'):
  if p.relative_to(root/'science').as_posix() not in keep_sources:p.unlink()
 for p in (root/'public/generations').glob('*'):
  if p.is_dir() and p.name not in keep_gen:shutil.rmtree(p)
 atomic_json(index_path,index)

def run(root):
 now=datetime.now(UTC);(root/'public/generations').mkdir(parents=True,exist_ok=True);(root/'science').mkdir(exist_ok=True)
 mp=root/'public/metadata.json';ip=root/'science/index.json'
 previous=verify(root) if mp.exists() else None
 m=previous or {'schema_version':1,'policy':VIEW_POLICY,'products':{str(x):None for x in LAGS}}
 index=json.loads(ip.read_text()) if ip.exists() else {};attempt={'at':now.isoformat(),'products':{}}
 try:
  listing,_=download(SOURCE);names=sorted(set(re.findall(r'href="(5kmffg_\d{10}\.g2)"',listing.decode())))
  names=[n for n in names if stamp(n)<=now]
  if not names:raise ValueError('No nonfuture hourly source')
  latest=names[-1];new,crs,tr,nmeta=source(root,latest,index,True)
  if now>=expiry(nmeta):raise ValueError('Latest source exceeds freshness limit')
  for lag in LAGS:
   key=str(lag)
   try:
    oldname=f'5kmffg_{stamp(latest)-timedelta(hours=lag):%Y%m%d%H}.g2'
    if oldname not in names and oldname not in index:raise ValueError('Exact earlier endpoint unavailable')
    old,ocrs,otr,ometa=source(root,oldname,index)
    if crs!=ocrs or tr!=otr:raise ValueError('Native endpoint geometry mismatch')
    identity={'revision':'ffg-tendency-v1','new':nmeta['sha256'],'old':ometa['sha256'],'lag':lag,'snapshot':nmeta['snapshot_time']}
    gen=stamp(latest).strftime('%Y%m%d%H')+f'-{lag}-'+hashlib.sha256(json.dumps(identity,sort_keys=True).encode()).hexdigest()[:20]
    current=m['products'][key]
    if current and dt(current['new']['snapshot_time'])>stamp(latest):raise ValueError('Regressing source')
    if current and current['generation']==gen:
     attempt['products'][key]={'ok':True,'state':'unchanged'};continue
    with tempfile.TemporaryDirectory(dir=root/'public',prefix='.stage-') as tmp:
     stage=Path(tmp);a={'generation':gen,'lookback_hours':lag,'new':nmeta,'old':ometa,'published_at':datetime.now(UTC).isoformat(),'expires_at':expiry(nmeta).isoformat(),'assets':{},'statistics':{}}
     for h in HOURS:
      delta=difference(new[h],old[h]);valid=np.isfinite(delta)
      if not valid.any():raise ValueError('No paired coverage')
      path=stage/f'{h}h.png';render(delta,crs,tr,path)
      a['assets'][str(h)]={'path':f'generations/{gen}/{h}h.png','sha256':digest(path),'duration_hours':h}
      a['statistics'][str(h)]={'paired_cells':int(valid.sum()),'new_only_cells':int((~np.ma.getmaskarray(new[h])&np.ma.getmaskarray(old[h])).sum()),'old_only_cells':int((np.ma.getmaskarray(new[h])&~np.ma.getmaskarray(old[h])).sum()),'min_inches':float(np.nanmin(delta)),'max_inches':float(np.nanmax(delta))}
     if datetime.now(UTC)>=expiry(nmeta):raise ValueError('Product expired during rendering')
     target=root/'public/generations'/gen
     if target.exists():shutil.rmtree(target)
     shutil.move(str(stage),target)
     m['products'][key]=a
    attempt['products'][key]={'ok':True,'state':'accepted','generation':gen}
    print(f'Accepted {lag}-hour tendency, all durations: {gen}',flush=True)
   except Exception as e:attempt['products'][key]={'ok':False,'error':str(e)}
 except Exception as e:
  attempt['error']=str(e)
  for lag in LAGS:attempt['products'][str(lag)]={'ok':False,'error':str(e)}
 m['last_attempt']=attempt;m['legend']={'crs':'EPSG:3857','bounds_wsen':BOUNDS,'pixels':[4000,2538],'units':'inches','edges':EDGES,'colors':['#'+c for c in COLORS],'resampling':'bilinear with nearest paired-valid mask'}
 atomic_json(ip,index);atomic_json(mp,m);verify(root);prune(root)
 if not all(x['ok'] for x in attempt['products'].values()):raise RuntimeError('One or more tendencies unavailable; verified prior products retained with original expiry')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--data-dir',type=Path,required=True);run(p.parse_args().data_dir)
