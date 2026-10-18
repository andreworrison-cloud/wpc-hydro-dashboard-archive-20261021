#!/usr/bin/env python3
"""Reproducible fixed-window gauge/QPE comparison and FFG timing sensitivity.
USGS parameter 00045 interpreted as interval-ending increments.
Station-specific interval-label convention is not independently verified.
Provisional values retained and flagged; see the companion review report.
"""
import argparse,json,math,sys,hashlib
from pathlib import Path
from datetime import datetime,timezone,timedelta
import numpy as np
import rasterio
from rasterio.warp import transform
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fetch_rfc_ffg import read_fields
from tools.audit_h8_sources import fetch,WPC
UTC=timezone.utc
def distance(x,y,a,b):
 p,q=math.radians(y),math.radians(b);dl=math.radians(a-x);dp=q-p
 return 6371*2*math.asin(math.sqrt(math.sin(dp/2)**2+math.cos(p)*math.cos(q)*math.sin(dl/2)**2))
def sample(path,x,y):
 with rasterio.open(path) as d:
  xx,yy=transform('EPSG:4326',d.crs,[x],[y]);r,c=d.index(xx[0],yy[0]);v=d.read(1,window=rasterio.windows.Window(c,r,1,1))[0,0]
  a=d.read(1,window=rasterio.windows.Window(c-1,r-1,3,3));v=float(v) if np.isfinite(v) and v>=0 else None;a=a[np.isfinite(a)&(a>=0)]
  return dict(value=v,neighborhood_3x3_min=float(a.min()) if a.size else None,neighborhood_3x3_max=float(a.max()) if a.size else None)
def main():
 p=argparse.ArgumentParser();p.add_argument('--review-root',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);args=p.parse_args();out=args.output_dir;out.mkdir(parents=True,exist_ok=True)
 raw_bytes=(out/'usgs_precipitation.json').read_bytes()
 request=json.loads((out/'usgs_request.json').read_text())
 if hashlib.sha256(raw_bytes).hexdigest()!=request['sha256']:raise ValueError('Gauge response hash mismatch')
 raw=json.loads(raw_bytes);end=datetime(2026,10,18,tzinfo=UTC)
 m=json.loads((args.review_root/'pass1/metadata.json').read_text());folder=args.review_root/'pass1/generations'/m['generation'];peak=m['products']['6'];px,py=peak['fine_peak_lon'],peak['fine_peak_lat']
 if datetime.fromisoformat(m['qpe_end'])!=end:raise ValueError('This case requires QPE ending 2026-10-18 00Z')
 result=dict(window_end=end.isoformat(),peak_lon=px,peak_lat=py,gauge_source='USGS NWIS 00045, inches; provisional interval values',gauges=[],caveat='Separate instruments; whether these gauges entered MRMS adjustment is unknown, so not a proven withheld validation set.')
 for ts in raw['value']['timeSeries']:
  assert ts['variable']['variableCode'][0]['value']=='00045' and ts['variable']['unit']['unitCode']=='in'
  geo=ts['sourceInfo']['geoLocation']['geogLocation'];x,y=geo['longitude'],geo['latitude'];vals=ts['values'][0]['value'];a=sorted((datetime.fromisoformat(v['dateTime']).astimezone(UTC),float(v['value']),v['qualifiers']) for v in vals)
  station=dict(id=ts['sourceInfo']['siteCode'][0]['value'],name=ts['sourceInfo']['siteName'],lon=x,lat=y,km_from_6h_peak=distance(px,py,x,y),windows={})
  for h in (1,3,6):
   start=end-timedelta(hours=h);selected=[v for v in a if start<v[0]<=end];expected=[start+timedelta(minutes=15*i) for i in range(1,h*4+1)]
   if [v[0] for v in selected]!=expected or any(v[1]<0 for v in selected):raise ValueError('Incomplete/invalid gauge interval coverage')
   total=sum(v[1] for v in selected);maximum=max(selected,key=lambda v:v[1]);q=sample(folder/f'qpe_{h}h.grib2',x,y);ratio=sample(folder/f'{h}h_fine_ratio.tif',x,y)
   station['windows'][str(h)]=dict(start_exclusive=start.isoformat(),end_inclusive=end.isoformat(),interval_count=len(selected),gauge_inches=round(total,4),gauge_mm=total*25.4,max_15min_inches=maximum[1],max_interval_ending=maximum[0].isoformat(),qualifiers=sorted(set(q for v in selected for q in v[2])),qpe_at_gauge_mm=q,ratio_at_gauge=ratio['value'],total_excluding_largest_interval_inches=round(total-maximum[1],4),exclusion_is_sensitivity_only=True)
  result['gauges'].append(station)
 result['gauges'].sort(key=lambda s:s['km_from_6h_peak'])
 # Hold rainfall fixed. Inspect actual hourly mosaics around start/end.
 result['ffg_timing']=[]
 for stamp in ['2026101717','2026101718','2026101723','2026101800','2026101801']:
  data,meta=fetch(WPC+f'5kmffg_{stamp}.g2');path=out/f'ffg_{stamp}.g2';path.write_bytes(data);fields,crs,tr,ref,ends=read_fields(path)
  xx,yy=transform('EPSG:4326',crs,[px],[py]);r,c=rasterio.transform.rowcol(tr,xx[0],yy[0]);ffg=float(fields[6][r,c]);qpe=sample(folder/'qpe_6h.grib2',px,py)['value']
  result['ffg_timing'].append(dict(snapshot_hour=stamp,source=meta,reference=ref.isoformat(),ffg_6h_at_peak_mm=ffg,fixed_qpe_mm=qpe,ratio=qpe/ffg,individual_rfc_issue_time=None))
  print('FFG snapshot',stamp,'peak ratio',qpe/ffg,flush=True)
 (out/'gauge_timing_results.json').write_text(json.dumps(result,indent=2)+'\n')
 for s in result['gauges']:
  v=s['windows']['6'];print(s['name'],round(s['km_from_6h_peak'],2),v['gauge_inches'],v['qpe_at_gauge_mm']['value'],v['max_15min_inches'],flush=True)
if __name__=='__main__':main()
