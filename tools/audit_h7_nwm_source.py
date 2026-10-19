import argparse,fsspec,h5netcdf,numpy as np,json,hashlib
from pathlib import Path
from datetime import datetime,timezone
parser=argparse.ArgumentParser(description='Read-only NWM source audit using HTTP range requests; no production writes.')
parser.add_argument('--url',required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();u=args.url
def plain(x):
 if isinstance(x,np.ndarray):return x.tolist()
 if isinstance(x,np.generic):return x.item()
 if isinstance(x,bytes):return x.decode()
 return x
with fsspec.open(u,'rb',block_size=1024*1024,client_kwargs={'trust_env':True}) as f:
 with h5netcdf.File(f,'r') as d:
  report={'url':u,'checked_at':datetime.now(timezone.utc).isoformat(),'global_attributes':{k:plain(v) for k,v in d.attrs.items()},'variables':{}}
  for name in ['SOILSAT_TOP','time','reference_time','x','y',str(d['SOILSAT_TOP'].attrs.get('grid_mapping','crs'))]:
   v=d[name];row={'shape':v.shape,'dimensions':v.dimensions,'dtype':str(v.dtype),'attributes':{k:plain(vv) for k,vv in v.attrs.items()}}
   if name=='SOILSAT_TOP':
    raw=v[:];valid=raw!=v.attrs.get('_FillValue',-9999);decoded=raw.astype('float64')*v.attrs.get('scale_factor',1)+v.attrs.get('add_offset',0);valid &= np.isfinite(decoded)
    row.update(valid_cells=int(valid.sum()),total_cells=int(raw.size),raw_array_sha256=hashlib.sha256(raw.tobytes()).hexdigest(),decoded_min=float(decoded[valid].min()),decoded_max=float(decoded[valid].max()),outside_fraction_range=int(((decoded[valid]<0)|(decoded[valid]>1)).sum()),decoded_quantiles=np.quantile(decoded[valid],[0,.05,.5,.95,1]).tolist())
   elif name in ['x','y']:
    a=v[:];row.update(first=float(a[0]),last=float(a[-1]),spacing=float(np.median(np.diff(a))))
   elif name in ['time','reference_time']:row['values']=plain(v[:])
   report['variables'][name]=row;print(name,row.get('shape'),flush=True)
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(report,indent=2,default=plain))
print(json.dumps(report,indent=2,default=plain))
