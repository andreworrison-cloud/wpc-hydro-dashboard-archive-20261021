#!/usr/bin/env python3
"""Read-only H8 numerical inventory/timing audit. No dashboard or schedule writes.
Requires numpy, rasterio. Run with --output-dir (evidence) and --cache-dir (raw).
Source modification times are observations, not first-availability measurements.
"""
import argparse, concurrent.futures, gzip, hashlib, json, re, sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling
sys.path.insert(0,str(Path(__file__).resolve().parent))
from probe_rfc_ffg_numeric import validate_grib, band_contract
UTC=timezone.utc
MRMS='https://mrms.ncep.noaa.gov/2D/'
WPC='https://ftp-wpc.ncep.noaa.gov/workoff/ffg/'
PRODUCTS=[f'MultiSensor_QPE_{h:02d}H_Pass{p}' for p in (1,2) for h in (1,3,6)]
EXTRA=[f'RadarOnly_QPE_{h:02d}H' for h in (1,3,6)]+[f'FLASH_QPE_FFG{h:02d}H' for h in (1,3,6)]
def now(): return datetime.now(UTC).isoformat()
def fetch(url,limit=100_000_000):
 with urlopen(Request(url,headers={'User-Agent':'WPC-Hydro-H8-Source-Audit/0.1'}),timeout=45) as r:
  raw=r.read(limit+1)
  if len(raw)>limit: raise ValueError('Download exceeds audit bound')
  return raw,dict(url=url,retrieved_at=now(),http_last_modified=r.headers.get('Last-Modified'),etag=r.headers.get('ETag'),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
def inventory(product,cache):
 directory=MRMS+('FLASH/'+product.removeprefix('FLASH_') if product.startswith('FLASH_') else product)+'/'
 raw,meta=fetch(directory); (cache/(product+'.html')).write_bytes(raw)
 rows=[]
 for line in raw.decode().splitlines():
  m=re.search(r'href="(MRMS_'+re.escape(product)+r'_00\.00_(\d{8}-\d{6})\.grib2\.gz)"',line)
  if m:
   t=datetime.strptime(m[2],'%Y%m%d-%H%M%S').replace(tzinfo=UTC)
   lm=re.search(r'(\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2})',line)
   mod=datetime.strptime(lm[1],'%d-%b-%Y %H:%M').replace(tzinfo=UTC) if lm else None
   rows.append(dict(filename=m[1],end=t.isoformat(),listed_modified=mod.isoformat() if mod else None,modification_lag_minutes=(mod-t).total_seconds()/60 if mod else None))
 rows=sorted({r['end']:r for r in rows}.values(),key=lambda x:x['end'])
 if not rows: raise ValueError('No timestamped sources: '+product)
 return dict(product=product,listing=meta,rows=rows,count=len(rows),first=rows[0]['end'],last=rows[-1]['end'])
def describe(path,product=None):
 with rasterio.open(path) as d:
  tags=d.tags(1)
  result=dict(shape=list(d.shape),crs_wkt=d.crs.to_wkt(),transform=list(d.transform)[:6],nodata=d.nodata,bands=d.count,tags=tags)
  if product:
   if tags.get('GRIB_ELEMENT')!=product or tags.get('GRIB_UNIT')!='[mm]':raise ValueError('Wrong QPE quantity/units')
   a=d.read(1).astype('float32'); good=np.isfinite(a)&(a>=0)
   neg,counts=np.unique(a[np.isfinite(a)&(a<0)],return_counts=True)
   result.update(valid_cells=int(good.sum()),zero_cells=int((a==0).sum()),negative_flags={str(float(k)):int(v) for k,v in zip(neg,counts)},max_mm=float(a[good].max()),percentiles_mm=np.percentile(a[good],[50,90,99,99.9]).tolist())
  return result

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--cache-dir',type=Path,required=True);args=p.parse_args()
 out,cache=args.output_dir,args.cache_dir;out.mkdir(parents=True,exist_ok=True);cache.mkdir(parents=True,exist_ok=True)
 report=dict(started_at=now(),purpose='source/timing audit, not production',inventory={},errors={})
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  jobs={pool.submit(inventory,k,cache):k for k in PRODUCTS+EXTRA}
  for future in concurrent.futures.as_completed(jobs):
   k=jobs[future]
   try:report['inventory'][k]=future.result();print('Inventory',k,report['inventory'][k]['last'],flush=True)
   except Exception as e:report['errors'][k]=str(e)
 (out/'source_audit.json').write_text(json.dumps(report,indent=2)+'\n')
 if any(k not in report['inventory'] for k in PRODUCTS):raise RuntimeError('Incomplete multi-sensor inventory')
 common=set.intersection(*[set(r['end'] for r in report['inventory'][k]['rows']) for k in PRODUCTS]);end=max(common);report['common_qpe_end']=end
 selected={k:next(r for r in report['inventory'][k]['rows'] if r['end']==end) for k in PRODUCTS}
 def getq(k):
  row=selected[k];raw,meta=fetch(MRMS+k+'/'+row['filename']);path=cache/row['filename'];path.write_bytes(raw)
  data=gzip.decompress(raw)
  if len(data)>100_000_000:raise ValueError('Decompressed source too large')
  validate_grib(data);path=path.with_suffix('');path.write_bytes(data)
  return k,path,meta
 report['qpe']={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  downloads=list(pool.map(getq,PRODUCTS))
 for k,path,meta in downloads:
  info=describe(path,k);t=datetime.fromtimestamp(int(info['tags']['GRIB_VALID_TIME']),UTC)
  if t.isoformat()!=end:raise ValueError('QPE filename/GRIB time disagreement')
  h=int(re.search(r'_(\d+)H',k)[1]);from datetime import timedelta
  report['qpe'][k]=dict(source=meta,numerical=info,window_end=end,window_start=(t-timedelta(hours=h)).isoformat(),duration_hours=h,duration_authority='NOAA named product definition; inspect encoded template separately')
  print('Decoded',k,info['shape'],info['max_mm'],flush=True)
 raw,meta=fetch(WPC);(cache/'wpc.html').write_bytes(raw)
 names=sorted(set(re.findall(r'href="(5kmffg_\d{10}\.g2)"',raw.decode())))
 report['ffg_listing']=dict(source=meta,count=len(names),first=names[0],last=names[-1])
 target=datetime.fromisoformat(end); eligible=[n for n in names if datetime.strptime(n[7:17],'%Y%m%d%H').replace(tzinfo=UTC)<=target]
 chosen=sorted(set([names[-1],eligible[-1],eligible[max(0,len(eligible)-7)]]))
 report['ffg']={};ffg_fields={};fg=None
 for name in chosen:
  data,meta=fetch(WPC+name);validate_grib(data);path=cache/name;path.write_bytes(data)
  bands={}
  with rasterio.open(path) as d:
   for b in d.indexes:
    h,ref,valid=band_contract(d.tags(b));a=d.read(b,masked=True)
    if h not in (1,3,6):continue
    bands[str(h)]=dict(tags=d.tags(b),valid_cells=int(a.count()),min_mm=float(a.min()),max_mm=float(a.max()),reference_time=datetime.fromtimestamp(ref,UTC).isoformat(),encoded_end=datetime.fromtimestamp(valid,UTC).isoformat())
    if name==eligible[-1]:ffg_fields[h]=a.filled(np.nan).astype('float32')
   if name==eligible[-1]:fg=(d.shape,d.transform,d.crs)
  report['ffg'][name]=dict(source=meta,numerical=describe(path),durations=bands)
  print('Decoded FFG',name,flush=True)
 report['aligned_diagnostics']={};aligned={}
 for k,path,_ in downloads:
  with rasterio.open(path) as d:
   a=d.read(1).astype('float32');mask=np.isfinite(a)&(a>=0);a[~mask]=np.nan
   avg=np.full(fg[0],np.nan,dtype='float32');nearest=avg.copy();coverage=np.zeros(fg[0],dtype='float32')
   opts=dict(src_transform=d.transform,src_crs=d.crs,dst_transform=fg[1],dst_crs=fg[2])
   reproject(a,avg,src_nodata=np.nan,dst_nodata=np.nan,resampling=Resampling.average,**opts)
   reproject(a,nearest,src_nodata=np.nan,dst_nodata=np.nan,resampling=Resampling.nearest,**opts)
   reproject(mask.astype('float32'),coverage,resampling=Resampling.average,**opts)
   h=report['qpe'][k]['duration_hours'];f=ffg_fields[h];valid=np.isfinite(f)&(f>0)&np.isfinite(avg)&(coverage>=.99)
   ratio=avg[valid]/f[valid];aligned[k]=(avg,valid)
   report['aligned_diagnostics'][k]=dict(ffg_snapshot=eligible[-1],method='GDAL average QPE onto native FFG cells; separate >=99% valid coverage gate; diagnostic only, not exact geodesic conservative remapping',ffg_valid_cells=int(np.isfinite(f).sum()),paired_cells=int(valid.sum()),paired_fraction_of_ffg=float(valid.sum()/np.isfinite(f).sum()),qpe_mean_max_mm=float(avg[valid].max()),ratio_max=float(ratio.max()),ratio_ge1_cells=int((ratio>=1).sum()),nearest_ratio_ge1_cells=int((nearest[valid]/f[valid]>=1).sum()))
   print('Aligned',k,report['aligned_diagnostics'][k]['paired_cells'],flush=True)
 report['pass_comparison']={}
 for h in (1,3,6):
  a,ma=aligned[f'MultiSensor_QPE_{h:02d}H_Pass1'];b,mb=aligned[f'MultiSensor_QPE_{h:02d}H_Pass2'];valid=ma&mb;dif=b[valid]-a[valid]
  report['pass_comparison'][str(h)]=dict(cells=int(valid.sum()),mean_absolute_difference_mm=float(np.mean(np.abs(dif))),max_absolute_difference_mm=float(np.max(np.abs(dif))))
 report['supplemental_samples']={}
 for k in EXTRA:
  if k not in report['inventory']:continue
  row=report['inventory'][k]['rows'][-1]
  directory=MRMS+('FLASH/'+k.removeprefix('FLASH_') if k.startswith('FLASH_') else k)+'/'
  data,meta=fetch(directory+row['filename']);path=cache/row['filename'];path.write_bytes(data)
  raw=gzip.decompress(data);validate_grib(raw);path=path.with_suffix('');path.write_bytes(raw)
  info=describe(path)
  with rasterio.open(path) as d:
   a=d.read(1);good=np.isfinite(a)&(a>=0);info.update(valid_nonnegative_cells=int(good.sum()),max_raw_value=float(a[good].max()))
  report['supplemental_samples'][k]=dict(source=meta,numerical=info)
  print('Supplemental',k,info['tags']['GRIB_UNIT'],info['max_raw_value'],flush=True)
 for inv in report['inventory'].values():
  rows=inv['rows'];times=[datetime.fromisoformat(x['end']) for x in rows]
  steps=[(b-a).total_seconds()/60 for a,b in zip(times,times[1:])]
  lags=[x['modification_lag_minutes'] for x in rows if x['modification_lag_minutes'] is not None]
  inv['observed_cadence_minutes']=sorted(set(steps))
  inv['listed_modification_lag_range_minutes']=[min(lags),max(lags)] if lags else None
  inv['rows']=rows[-30:];inv['rows_note']='Last 30 entries retained; count, range and cadence describe full listing; raw HTML SHA retained.'
 report['finished_at']=now();(out/'source_audit.json').write_text(json.dumps(report,indent=2)+'\n');print('Audit complete',flush=True)
if __name__=='__main__':main()
