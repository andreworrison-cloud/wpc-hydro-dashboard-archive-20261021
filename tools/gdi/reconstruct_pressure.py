"""Terrain-corrected HRRR GDI from the model's postprocessed pressure fields.
No locally invented below-ground profiles; no blanket surface-pressure 950 mask.
Keep q/theta850/add equations; changed input provenance is explicit.
"""
import os,json,pathlib,datetime,hashlib
import numpy as np
from scipy.ndimage import convolve
from eccodes import codes_new_from_message,codes_get_array,codes_get,codes_release
from sources import HRRRSource
from native_gdi_core import gdi_components
CYCLE=os.environ.get('GDI_CYCLE','2026101819')
OUT=pathlib.Path(os.environ.get('GDI_OUTPUT_DIR','run/terrain/'+CYCLE+'/decoded'));OUT.mkdir(parents=True,exist_ok=True)
source=HRRRSource(CYCLE,'run/provider_cache',product='prs',providers=tuple(os.environ.get('GDI_PROVIDERS','aws,nomads').split(',')))
levels=(950,850,700,500);shape=(1059,1799);yy,xx=np.mgrid[-5:6,-5:6];kernel=(xx*xx+yy*yy<=25).astype(float)
for hour in range(7):
 marker=OUT/f'F{hour:02d}_DONE.json';target=OUT/f'F{hour:02d}.npz'
 if marker.exists() and target.exists():
  old=json.loads(marker.read_text())
  if old.get('cycle')==source.cycle.replace(tzinfo=datetime.timezone.utc).isoformat() and old.get('recipe')=='pressure_terrain_v1' and old.get('output_sha256')==hashlib.sha256(target.read_bytes()).hexdigest():
   print('Reuse verified pressure F',hour,flush=True);continue
 tasks=[(hour,var,f'{p} mb') for var in ('TMP','SPFH') for p in levels]+[(hour,'PRES','surface'),(hour,'REFC','entire atmosphere')]
 fields={};provenance=[]
 for meta,raw in source.fetch_batch(tasks):
  h=codes_new_from_message(raw)
  try:
   a=codes_get_array(h,'values').reshape(shape);missing=codes_get(h,'missingValue');a=np.where(a==missing,np.nan,a)
   fields[(meta['variable'],meta['level'])]=a
   if not (OUT/'grid.npz').exists():
    lat=codes_get_array(h,'latitudes').reshape(shape);lon=(codes_get_array(h,'longitudes').reshape(shape)+180)%360-180
    inside=(lon>=-125)&(lon<=-66)&(lat>=24)&(lat<=50)
    np.savez_compressed(OUT/'grid.npz',latitude=lat,longitude=lon,domain=inside)
  finally:codes_release(h)
  provenance.append(meta);print('F%02d'%hour,meta['variable'],meta['level'],meta['provider'],flush=True)
 inside=np.load(OUT/'grid.npz')['domain'];t=np.stack([fields[('TMP',f'{p} mb')] for p in levels]);q=np.stack([fields[('SPFH',f'{p} mb')] for p in levels]);ps=fields[('PRES','surface')]/100
 result=gdi_components(t,q,ps,allow_postprocessed_terrain=True);valid=result['valid']&inside
 mask=np.where(~inside,1,np.where(valid,0,4)).astype('uint8');g=np.where(valid,result['gdi'],np.nan)
 ref=fields[('REFC','entire atmosphere')];ref=np.where(inside&np.isfinite(ref)&(ref>-100)&(ref<150),ref,np.nan)
 rh=100*np.array(levels)[:,None,None]*q/(.622+.378*q)/(6.112*np.exp(17.67*(t-273.15)/(t-29.65)))
 grids={'jose_gfs_baseline__native':g,'mask_reason':mask,'reflectivity_dbz':ref,'surface_pressure_hpa':ps,'native_temperature_k':t,'native_specific_humidity':q,'native_max_rh_water':np.max(rh,axis=0)}
 den=convolve(valid.astype(float),kernel,mode='constant',cval=0)
 for threshold in (30,40,50):
  num=convolve((valid&(g>=threshold)).astype(float),kernel,mode='constant',cval=0)
  grids[f'jose_gfs_baseline__support_ge{threshold}']=np.where(valid&(den>=.8*81),num/np.maximum(den,1),np.nan)
 np.savez_compressed(target,**{k:v.astype('float32') if k!='mask_reason' else v for k,v in grids.items()})
 stats={}
 for name,sel in [('lowland',valid&(ps>=950)),('elevated',valid&(ps<950))]:
  stats[name]={'cells':int(sel.sum()),'gdi_percentiles':np.percentile(g[sel],[0,50,95,99,100]).tolist(),'max_rh_percentiles':np.percentile(np.max(rh,axis=0)[sel],[50,95,99,100]).tolist()}
 marker.write_text(json.dumps({'recipe':'pressure_terrain_v1','cycle':source.cycle.replace(tzinfo=datetime.timezone.utc).isoformat(),'forecast_hour':hour,'shape':list(shape),'bounds':[-125,-66,24,50],'sampling_hours':1,'interpolation':'Model-postprocessed 950/850/700/500 hPa T/SPFH; additive terrain correction; no local extrapolation, clipping or smoothing','sources':provenance,'stats':stats,'output_sha256':hashlib.sha256(target.read_bytes()).hexdigest()},indent=2))
 print('SAVED',hour,stats,flush=True)
