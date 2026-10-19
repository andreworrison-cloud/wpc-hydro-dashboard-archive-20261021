"""Valid-time-aligned two-model/two-lag GDI guidance, with complete windows only."""
import argparse,datetime as dt,hashlib,json,pathlib,subprocess,sys,urllib.request
import numpy as np
from scipy.ndimage import convolve
SCRIPTS=pathlib.Path(__file__).parent
THRESHOLDS=(30,40,50)
from render import COVERAGE as SUPPORT_COLORS

def ero_window(now):
 url='https://mapservices.weather.noaa.gov/vector/rest/services/hazards/wpc_precip_hazards/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json'
 payload=json.load(urllib.request.urlopen(url,timeout=25));rows=[x['attributes'] for x in payload.get('features',[])]
 if not rows:raise ValueError('No issued Day 1 ERO time metadata; do not invent a window')
 windows={(r['start_time'],r['end_time']) for r in rows}
 if len(windows)!=1:raise ValueError('Inconsistent Day 1 ERO periods')
 start,end=[dt.datetime.strptime(s,'%Y-%m-%d %H:%M:%S').replace(tzinfo=dt.timezone.utc) for s in windows.pop()]
 if not start<=now<end:raise ValueError('Issued Day 1 ERO is not current')
 remaining=max(start,now.replace(minute=0,second=0,microsecond=0)+dt.timedelta(hours=bool(now.minute or now.second or now.microsecond)))
 if remaining>=end:raise ValueError('No remaining complete hourly samples')
 return remaining,end,{'source':url,'issued_start':start.isoformat(),'issued_end':end.isoformat(),'issue_time':rows[0].get('issue_time')}

def frame(model,cycle,lead,cache,grids):
 path=cache/model/cycle.strftime('%Y%m%d%H')/f'F{lead:03d}.npz';meta=path.with_suffix('.json');path.parent.mkdir(parents=True,exist_ok=True)
 good=False
 if path.exists() and meta.exists():
  m=json.loads(meta.read_text());good=m.get('model')==model and m.get('cycle')==cycle.isoformat() and m.get('lead')==lead and m.get('sha256')==hashlib.sha256(path.read_bytes()).hexdigest()
 if not good:
  subprocess.run([sys.executable,str(SCRIPTS/'decode_model.py'),'--model',model,'--cycle',cycle.strftime('%Y%m%d%H'),'--lead',str(lead),'--out',str(path)],check=True)
 m=json.loads(meta.read_text());gridpath=cache/model/(m['grid_md5']+'-grid.npz')
 with np.load(path) as f:
  a=f['gdi'].copy()
  if 'latitude' in f:
   if not gridpath.exists():np.savez_compressed(gridpath,latitude=f['latitude'],longitude=f['longitude'])
   # Retain one grid per model, rather than duplicating 2 coordinate arrays/hour.
   compact=True
  else:compact=False
 if compact:
  np.savez_compressed(path,gdi=a);m['sha256']=hashlib.sha256(path.read_bytes()).hexdigest();meta.write_text(json.dumps(m,indent=2))
 if not gridpath.exists():raise ValueError('Missing cached native grid')
 if model not in grids:
  with np.load(gridpath) as f:grids[model]=(f['latitude'].copy(),f['longitude'].copy(),m['grid_md5'])
 elif grids[model][2]!=m['grid_md5']:raise ValueError('Model grid changed across members')
 return a,m

def main(mode,work,public,now=None):
 now=now or dt.datetime.now(dt.timezone.utc)
 if now.tzinfo is None:raise ValueError('Use a timezone-aware time')
 start=now.replace(minute=0,second=0,microsecond=0)+dt.timedelta(hours=bool(now.minute or now.second or now.microsecond));end=start+dt.timedelta(hours=6);ero=None
 if mode=='ero':start,end,ero=ero_window(now)
 times=[start+dt.timedelta(hours=h) for h in range(int((end-start).total_seconds()/3600)+1)]
 if len(times)<2:raise ValueError('Incomplete window')
 from model_source import PressureSource
 cycles={}
 for model in ('hrrr','rrfs'):
  candidates=[]
  for age in range(19):
   c=now.replace(minute=0,second=0,microsecond=0)-dt.timedelta(hours=age)
   if mode=='ero' and c.hour%6:continue
   lead0=int((start-c).total_seconds()/3600);lead1=int((end-c).total_seconds()/3600)
   if lead0<0 or lead1>(48 if model=='hrrr' and c.hour%6==0 else 18 if model=='hrrr' else 84):continue
   source=PressureSource(model,c.strftime('%Y%m%d%H'))
   try:
    # A complete last-lead inventory is the quick availability check; all
    # intermediate decoded fields remain mandatory before publication.
    source.tasks(lead1);source.tasks(lead0);candidates.append(c)
    print('Selected candidate',model,c.isoformat(),lead0,lead1,flush=True)
   except Exception as e:print('Unavailable candidate',model,c.isoformat(),str(e),flush=True)
   if len(candidates)==2:break
  if len(candidates)!=2:raise ValueError('Two complete model runs unavailable for '+model)
  cycles[model]=candidates
 anchor=max(cycles['hrrr'][0],cycles['rrfs'][0])
 work=pathlib.Path(work);cache=work/'cache';grids={};members=[];selected={};source_metadata=[]
 for model in ('hrrr','rrfs'):
  for lag,cycle in enumerate(cycles[model]):
   maximum=None;complete=None;counts={t:None for t in THRESHOLDS};records=[]
   for i,valid in enumerate(times):
    lead=int((valid-cycle).total_seconds()/3600)
    if lead<0 or lead>(48 if model=='hrrr' and cycle.hour%6==0 else 18 if model=='hrrr' else 84):raise ValueError('Requested valid time exceeds model horizon')
    a,m=frame(model,cycle,lead,cache,grids);ok=np.isfinite(a)
    if maximum is None:maximum=np.where(ok,a,-np.inf);complete=ok.copy();counts={t:(ok&(a>=t)).astype('uint8') for t in THRESHOLDS}
    else:
     maximum=np.maximum(maximum,np.where(ok,a,-np.inf));complete&=ok
     for t in THRESHOLDS:counts[t]+=(ok&(a>=t)).astype('uint8')
    if lag==0 and mode=='nowcast' and i in (0,3,6):selected[(model,i)]=a
    records.append({'valid_time':valid.isoformat(),'cycle':m['cycle'],'lead':lead,'grid_md5':m['grid_md5'],'sha256':m['sha256'],'humidity_inputs':m['humidity_inputs'],'sources':m['sources']})
   members.append({'model':model,'lag':lag,'max':np.where(complete,maximum,np.nan),'counts':{t:np.where(complete,c,np.nan) for t,c in counts.items()}})
   source_metadata.append({'model':model,'lag':lag,'cycle':cycle.isoformat(),'samples':records})
   print('Completed member',mode,model,cycle.isoformat(),len(times),'hourly samples',flush=True)
 lat,lon,_=grids['hrrr'];rlat,rlon,_=grids['rrfs']
 if lat.shape!=rlat.shape or not np.allclose(lat,rlat,atol=1e-6,rtol=0) or not np.allclose(lon,rlon,atol=1e-6,rtol=0):raise ValueError('HRRR/RRFS native grids do not align; explicit regridding required')
 arrays={'latitude':lat,'longitude':lon};products={}
 def product(key,a,label,legend,valid=end,**extra):
  arrays[key]=a;products[key]={'label':label,'legend':legend,'window_start':start.isoformat(),'valid_time':valid.isoformat(),**extra}
 if mode=='nowcast':
  for h in (0,3,6):
   product(f'rrfs{h}',selected['rrfs',h],f'RRFS GDI · +{h}h from window start','GDI · 5-unit color bins',start+dt.timedelta(hours=h),cycle=cycles['rrfs'][0].isoformat())
   products[f'rrfs{h}'].pop('window_start')
   product(f'blend{h}',.5*selected['hrrr',h]+.5*selected['rrfs',h],f'HRRR/RRFS GDI · +{h}h from window start','Equal-model mean GDI · 5-unit color bins',start+dt.timedelta(hours=h),source_label='HRRR '+cycles['hrrr'][0].strftime('%d %HZ')+' / RRFS '+cycles['rrfs'][0].strftime('%d %HZ'))
   products[f'blend{h}'].pop('window_start')
 label='Day 1 ERO remaining period' if mode=='ero' else 'Six-hour window'
 maxima=np.stack([m['max'] for m in members]);all_valid=np.isfinite(maxima).all(axis=0)
 product('maximum',np.where(all_valid,np.max(maxima,axis=0),np.nan),label+' · TLE maximum GDI','Maximum across 4 valid-time-aligned members; unsmoothed GDI')
 yy,xx=np.mgrid[-5:6,-5:6];kernel=(xx*xx+yy*yy<=25).astype('float32')
 for t in THRESHOLDS:
  # Average neighborhood coverage within each equally weighted model/lag member.
  support=[]
  for m in members:
   ok=np.isfinite(m['max']);den=convolve(ok.astype('float32'),kernel,mode='constant',cval=0);num=convolve((ok&(m['max']>=t)).astype('float32'),kernel,mode='constant',cval=0)
   support.append(np.where(ok&(den>=.8*kernel.sum()),100*num/np.maximum(den,1),np.nan))
  product(f'support{t}',np.mean(np.stack(support),axis=0),label+f' · GDI ≥{t} support','0–100% mean 15-km neighborhood coverage of member window maxima; 2 HRRR + 2 RRFS runs; not rainfall probability',colors=SUPPORT_COLORS,edges=list(np.linspace(0,100,7)),scale_labels=['0','16.7','33.3','50','66.7','83.3','100%'])
  product(f'persistence{t}',np.mean(np.stack([m['counts'][t] for m in members]),axis=0),label+f' · GDI ≥{t} persistence',f'Ensemble-mean qualifying hourly samples (0–{len(times)}); not continuous hours',colors=SUPPORT_COLORS,edges=list(np.linspace(0,len(times),7)),decimals=1)
 target=work/'render';target.mkdir(parents=True,exist_ok=True);np.savez_compressed(target/'fields.npz',**arrays)
 spec={'cycle':anchor.isoformat(),'model':'hrrr_rrfs','native_spacing_km':3,'products':products,'window_start':start.isoformat(),'window_end':end.isoformat(),'expires_at':end.isoformat(),'sample_count':len(times),'member_count':4,'weighting':'Each model 1/2; each of its two lagged runs 1/2 within model','ero':ero,'source_metadata':source_metadata}
 (target/'suite.json').write_text(json.dumps(spec,indent=2));subprocess.run([sys.executable,str(SCRIPTS/'render_suite.py'),'--input',str(target),'--public',str(public)],check=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--mode',choices=['nowcast','ero'],required=True);p.add_argument('--work',required=True);p.add_argument('--public',required=True);p.add_argument('--now');a=p.parse_args();main(a.mode,a.work,a.public,dt.datetime.fromisoformat(a.now) if a.now else None)
