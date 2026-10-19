#!/usr/bin/env python3
"""Export verified H8 pairs as nearest-sampled Mercator overlays."""
import argparse,json,sys
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import transform_bounds,reproject,Resampling
from rasterio.transform import from_bounds
from PIL import Image
from ingest_h8_review import verify_generation,atomic,digest
COLORS=['#fafcfc','#dceef7','#99cee6','#48acbe','#72b76c','#e5d760','#f6a44b','#e85a46','#b53569','#713c91','#3e235f']
EDGES=[10,25,50,75,100,150,200,300,500,1000]
BOUNDS=[-126,24,-66,50]
def export(root):
 attempt=json.loads((root/'science/attempt.json').read_text())
 for number in (1,2):
  base=root/f'science/pass{number}';out=root/f'public/pass{number}';out.mkdir(parents=True,exist_ok=True)
  public=dict(schema_version=1,policy=dict(qpe_hours=3,snapshot_hours=3,reference_hours=9),last_attempt=attempt,active=None)
  source=base/'metadata.json'
  if source.exists():
   m=verify_generation(base,json.loads(source.read_text()))
   if m['historical_review']:raise ValueError('Historical pairs cannot enter production exports')
   public['policy']=m.get('freshness_policy',public['policy'])
   a={k:m[k] for k in ('generation','pass_number','qpe_end','paired_at','ffg_reference','live_age_deadline')};a['ffg']=m['ffg'];a['assets']={}
   a['legend']=dict(crs='EPSG:3857',bounds_wsen=BOUNDS,units='percent of FFG',resampling='nearest',class_upper_edges=EDGES,colors_rgb=[list(bytes.fromhex(c[1:])) for c in COLORS])
   folder=out/'generations'/m['generation'];folder.mkdir(parents=True,exist_ok=True)
   for h in (1,3,6):
    for method,source_key in [('fine','fine_ratio'),('coarse','coarse_ratio')]:
     name=f'{method}{h}';path=folder/(name+'.png')
     if not path.exists():
      native=base/'generations'/m['generation']/m['products'][str(h)]['assets'][source_key]['path']
      with rasterio.open(native) as d:
       dest=np.full((2538,4000),np.nan,dtype='float32');tr=from_bounds(*transform_bounds('EPSG:4326','EPSG:3857',*BOUNDS),4000,2538)
       reproject(rasterio.band(d,1),dest,src_transform=d.transform,src_crs=d.crs,src_nodata=np.nan,dst_transform=tr,dst_crs='EPSG:3857',dst_nodata=np.nan,resampling=Resampling.nearest)
      rgba=np.zeros((2538,4000,4),dtype='uint8');valid=np.isfinite(dest)&(dest>=0);classes=np.searchsorted(np.array(EDGES)/100,dest,side='right');colors=np.array(a['legend']['colors_rgb'],dtype='uint8');rgba[valid,:3]=colors[classes[valid]];rgba[valid,3]=255
      Image.fromarray(rgba).save(path)
     a['assets'][name]=dict(path=path.relative_to(out).as_posix(),sha256=digest(path),duration_hours=h,method=method)
   public['active']=a
  atomic(out/'metadata.json',public)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--data-dir',type=Path,required=True);export(p.parse_args().data_dir)
