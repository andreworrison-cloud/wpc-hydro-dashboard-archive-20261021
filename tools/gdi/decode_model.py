"""Decode model inputs and calculate the selected unchanged José GDI formulation."""
import argparse,datetime as dt,json,pathlib,hashlib
import numpy as np
from eccodes import codes_new_from_message,codes_get,codes_get_array,codes_release
from model_source import PressureSource,LEVELS
from native_gdi_core import gdi_components

def decode(model,cycle,lead,out):
 source=PressureSource(model,cycle);fields={};provenance=[];lat=lon=None
 for meta,raw in source.fetch_batch(source.tasks(lead)):
  h=codes_new_from_message(raw)
  try:
   shape=(codes_get(h,'Ny'),codes_get(h,'Nx'));a=codes_get_array(h,'values').reshape(shape);a=np.where(a==codes_get(h,'missingValue'),np.nan,a)
   fields[(meta['variable'],meta['level'])]=a
   if lat is None:lat=codes_get_array(h,'latitudes').reshape(shape);lon=(codes_get_array(h,'longitudes').reshape(shape)+180)%360-180
  finally:codes_release(h)
  provenance.append(meta);print(model,cycle,lead,meta['variable'],meta['level'],meta['provider'],flush=True)
 t=np.stack([fields['TMP',f'{p} mb'] for p in LEVELS]);qs=[];humidity=[]
 for i,p in enumerate(LEVELS):
  k=('SPFH',f'{p} mb')
  if k in fields:q=fields[k];humidity.append('model specific humidity')
  else:
   rh=fields['RH',f'{p} mb'];e=(rh/100)*6.112*np.exp(17.67*(t[i]-273.15)/(t[i]-29.65))
   q=.622*e/(p-.378*e);q=np.where((rh>=0)&(rh<=200)&(e<p),q,np.nan);humidity.append('RH (%) to q: Bolton liquid-water saturation vapor pressure, q=0.622e/(p-0.378e)')
  qs.append(q)
 ps=fields['PRES','surface']/100;g=gdi_components(t,np.stack(qs),ps,allow_postprocessed_terrain=True)['gdi'];g=np.where((lon>=-125)&(lon<=-66)&(lat>=24)&(lat<=50),g,np.nan)
 out=pathlib.Path(out);out.parent.mkdir(parents=True,exist_ok=True);np.savez_compressed(out,gdi=g.astype('float32'),latitude=lat,longitude=lon)
 out.with_suffix('.json').write_text(json.dumps({'model':model,'cycle':dt.datetime.strptime(cycle,'%Y%m%d%H').replace(tzinfo=dt.timezone.utc).isoformat(),'lead':lead,'grid_md5':source.grid,'humidity_inputs':humidity,'sources':provenance,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--model',choices=['rap','rrfs','hrrr'],required=True);p.add_argument('--cycle',required=True);p.add_argument('--lead',type=int,required=True);p.add_argument('--out',required=True);a=p.parse_args();decode(a.model,a.cycle,a.lead,a.out)
