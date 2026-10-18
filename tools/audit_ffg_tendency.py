#!/usr/bin/env python3
"""Read-only FFG snapshot timing/coverage audit; no operational layer changes."""
import argparse,json,re
from pathlib import Path
from datetime import datetime,timedelta,timezone
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import rasterio
from rasterio.warp import transform
from probe_rfc_ffg_numeric import download,validate_grib,band_contract,checked_array,SOURCE
UTC=timezone.utc

def stamp(name):return datetime.strptime(name[7:17],'%Y%m%d%H').replace(tzinfo=UTC)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--cache-dir',type=Path,required=True);args=p.parse_args()
 out,cache=args.output_dir,args.cache_dir;out.mkdir(parents=True,exist_ok=True);cache.mkdir(parents=True,exist_ok=True)
 raw,meta=download(SOURCE);(cache/'listing.html').write_bytes(raw)
 current=datetime.now(UTC)
 names=sorted(set(re.findall(r'href="(5kmffg_\d{10}\.(?:g2|grb2))"',raw.decode())))
 families={ext:[n for n in names if n.endswith('.'+ext) and stamp(n)<=current] for ext in ('g2','grb2')}
 report={'checked_at':current.isoformat(),'listing':meta,'inventory':{},'sources':{},'comparisons':{},'errors':{}}
 for ext,ns in families.items():
  times={stamp(n) for n in ns};step=1 if ext=='g2' else 6
  missing=[(stamp(ns[0])+timedelta(hours=h)).isoformat() for h in range(0,int((stamp(ns[-1])-stamp(ns[0])).total_seconds()/3600)+1,step) if stamp(ns[0])+timedelta(hours=h) not in times] if ns else []
  report['inventory'][ext]={'count':len(ns),'first':ns[0] if ns else None,'last':ns[-1] if ns else None,'missing_on_nominal_cadence':missing}
 latest=families['g2'][-1];end=stamp(latest);chosen=[latest]
 for lag in (1,6,12,24):
  name=f'5kmffg_{end-timedelta(hours=lag):%Y%m%d%H}.g2'
  if name in families['g2']:chosen.append(name)
  else:report['errors'][str(lag)]='Exact hourly endpoint absent; no nearest-time substitution'
 cycle=families['grb2'][-1]
 chosen.append(cycle)
 def get(name):
  raw,source=download(SOURCE+name);validate_grib(raw);path=cache/name;path.write_bytes(raw)
  arrays={};bands={}
  with rasterio.open(path) as src:
   grid=(src.shape,src.transform,src.crs.to_wkt())
   for b in src.indexes:
    h,ref,valid=band_contract(src.tags(b))
    if h not in (1,3,6):continue
    if h in arrays:raise ValueError('Duplicate duration')
    a=checked_array(src.read(b,masked=True)).filled(np.nan).astype('float32');arrays[h]=a
    bands[str(h)]={'reference_time':datetime.fromtimestamp(ref,UTC).isoformat(),'encoded_end':datetime.fromtimestamp(valid,UTC).isoformat(),'valid_cells':int(np.isfinite(a).sum()),'min_mm':float(np.nanmin(a)),'max_mm':float(np.nanmax(a))}
   if set(arrays)!={1,3,6}:raise ValueError('Missing duration')
  return name,arrays,grid,{'source':source,'snapshot_filename_time':stamp(name).isoformat(),'shape':list(grid[0]),'affine':list(grid[1])[:6],'crs_wkt':grid[2],'bands':bands}
 decoded={}
 with ThreadPoolExecutor(max_workers=3) as pool:
  for name,arrays,grid,metadata in pool.map(get,chosen):
   decoded[name]=(arrays,grid);report['sources'][name]=metadata;print('Decoded',name,flush=True)
 new,grid=decoded[latest]
 for name in chosen[1:]:
  old,oldgrid=decoded[name]
  if grid!=oldgrid:raise ValueError('Source grid mismatch; no implicit remapping')
  lag=int((end-stamp(name)).total_seconds()/3600)
  key=f'{lag}h' if name.endswith('.g2') else 'cycle_file_comparison'
  report['comparisons'][key]={'new':latest,'old':name,'bands':{}}
  for h in (1,3,6):
   a,b=new[h],old[h];na,nb=np.isfinite(a),np.isfinite(b);both=na&nb;delta=a[both]-b[both]
   report['comparisons'][key]['bands'][str(h)]={'paired_cells':int(both.sum()),'new_only_cells':int((na&~nb).sum()),'old_only_cells':int((nb&~na).sum()),'unchanged_cells':int((delta==0).sum()),'decreased_cells':int((delta<0).sum()),'increased_cells':int((delta>0).sum()),'difference_inch_quantiles':(np.quantile(delta,[0,.01,.05,.5,.95,.99,1])/25.4).tolist(),'decrease_at_least_quarter_inch_cells':int((delta<=-6.35).sum()),'increase_at_least_quarter_inch_cells':int((delta>=6.35).sum())}
 # Investigate the largest 24-hour 3-hour-FFG drop with an hourly point trace.
 old24=f'5kmffg_{end-timedelta(hours=24):%Y%m%d%H}.g2'
 if old24 in decoded:
  delta=new[3]-decoded[old24][0][3]
  row,col=np.unravel_index(np.nanargmin(delta),delta.shape)
  with rasterio.open(cache/latest) as src:
   x,y=src.xy(row,col);lon,lat=transform(src.crs,'EPSG:4326',[x],[y])
  trace=[]
  extra=[f'5kmffg_{end-timedelta(hours=h):%Y%m%d%H}.g2' for h in range(25)]
  extra=[n for n in extra if n in families['g2']]
  for name in extra:
   if name in decoded:
    metadata=report['sources'][name]
    trace.append({'snapshot':stamp(name).isoformat(),'reference':metadata['bands']['3']['reference_time'],'ffg_3h_inches':float(decoded[name][0][3][row,col]/25.4),'source_sha256':metadata['source']['sha256']})
  extra=[n for n in extra if n not in decoded]
  with ThreadPoolExecutor(max_workers=3) as pool:
   for name,arrays,g,metadata in pool.map(get,extra):
    if g!=grid:raise ValueError('Trace grid mismatch')
    report['sources'][name]=metadata
    trace.append({'snapshot':stamp(name).isoformat(),'reference':metadata['bands']['3']['reference_time'],'ffg_3h_inches':float(arrays[3][row,col]/25.4),'source_sha256':metadata['source']['sha256']})
  report['largest_24h_drop_trace']={'lonlat':[lon[0],lat[0]],'grid_row_col':[int(row),int(col)],'samples':sorted(trace,key=lambda r:r['snapshot']),'interpretation':'Numerical trace only; hydrologic cause or source revision not established'}
 for key,c in report['comparisons'].items():
  old=decoded[c['old']][0]
  for h in (1,3,6):
   delta=new[h]-old[h]
   c['bands'][str(h)]['nonzero_but_abs_below_0_01mm_cells']=int(((delta!=0)&(np.abs(delta)<.01)).sum())
   c['bands'][str(h)]['abs_change_below_0_01inch_cells']=int((np.abs(delta)<.254).sum())
 report['policy']={'definition':'FFG duration d at snapshot t minus FFG duration d at snapshot t-L, L=6/12/24h; inches','negative':'Lower official guidance threshold','positive':'Higher official guidance threshold','mask':'Both endpoints valid; changing coverage excluded, not zero-filled','grid':'Native identical grid; numerical subtraction before display reprojection','time_semantics':'Snapshot filename time, GRIB reference cycle and retrieval time remain separate. Individual RFC issue times unavailable. A zero difference does not establish a fresh regional update.','archive_policy':'Use exact hourly g2 endpoints; do not mix cycle grb2 files into operational tendencies without separate qualification. Listing presence today is not proof of historical first availability.','status':'Source audit only; no new layer or schedule activated'}
 (out/'audit.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'inventory':report['inventory'],'errors':report['errors']},indent=2),flush=True)
if __name__=='__main__':main()
