"""Cycle-specific HRRR native records; each provider supplies its own index offsets."""
import datetime as dt, pathlib, urllib.request, urllib.error, json, hashlib, time, threading
from eccodes import codes_new_from_message,codes_get,codes_release
GRIB_LOCK=threading.RLock()
PROVIDERS=('aws','nomads')
BASES={'aws':'https://noaa-hrrr-bdp-pds.s3.amazonaws.com','nomads':'https://nomads.ncep.noaa.gov/pub/data/nccf/com/hrrr/prod'}
class HRRRSource:
 def __init__(self,cycle,cache,providers=PROVIDERS,transport=None,product="nat"):
  if product not in ("nat","prs"):raise ValueError("Unsupported HRRR product")
  self.product=product
  providers=tuple(providers)
  if not providers or len(set(providers))!=len(providers) or any(p not in PROVIDERS for p in providers):raise ValueError('Use distinct providers from aws,nomads')
  self.cycle=dt.datetime.strptime(cycle,'%Y%m%d%H');self.root=pathlib.Path(cache)/(cycle if product=='nat' else cycle+'-prs');self.providers=tuple(providers);self.transport=transport or self.request;self.indices={};self.lock=threading.Lock();self.grid=None;self.events=[]
 @staticmethod
 def request(url,start=None,end=None):
  for attempt in range(3):
   try:
    headers={} if start is None else {'Range':f'bytes={start}-{end}'}
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=25) as r:
     if start is not None:
      if r.status!=206 or not r.headers.get('Content-Range','').startswith(f'bytes {start}-{end}/'):raise ValueError('Invalid HTTP range response')
      b=r.read(end-start+2)
      if len(b)!=end-start+1:raise ValueError('Invalid range length')
     else:b=r.read(4000000)
     return b
   except urllib.error.HTTPError as e:
    if e.code not in (408,429,500,502,503,504) or attempt==2:raise
   except (TimeoutError,urllib.error.URLError,ConnectionError) as e:
    if '403 Forbidden' in str(e) or attempt==2:raise
   time.sleep(2**attempt)
 def url(self,provider,lead):return BASES[provider]+f'/hrrr.{self.cycle:%Y%m%d}/conus/hrrr.t{self.cycle:%H}z.wrf{self.product}f{lead:02d}.grib2'
 def inventory(self,provider,lead,refresh=False):
  k=(provider,lead)
  with self.lock:
   if k in self.indices and not refresh:return self.indices[k]
  u=self.url(provider,lead);b=self.transport(u+'.idx');lines=b.decode().strip().splitlines();records={}
  for a,b in zip(lines,lines[1:]):
   x=a.split(':');y=b.split(':')
   if x[3] not in ('PRES','TMP','SPFH','REFC'):continue
   key=(x[3],x[4]);start,end=int(x[1]),int(y[1])-1
   if end<start or key in records:raise ValueError('Duplicate or unordered inventory')
   if x[2]!=f'd={self.cycle:%Y%m%d%H}':raise ValueError('Wrong inventory cycle')
   records[key]={'variable':key[0],'level':key[1],'start':start,'end':end,'url':u,'provider':provider,'forecast_hour':lead}
  required=[(v,f'{l} hybrid level') for v in ('PRES','TMP','SPFH') for l in range(1,51)]+[('PRES','surface'),('REFC','entire atmosphere')]
  if self.product=='prs':required=[(v,f'{p} mb') for v in ('TMP','SPFH') for p in (950,850,700,500)]+[('PRES','surface'),('REFC','entire atmosphere')]
  if any(k not in records for k in required):raise ValueError('Incomplete native-field inventory')
  with self.lock:self.indices[(provider,lead)]=records
  return records
 def validate(self,b,rec):
  if threading.current_thread() is not threading.main_thread():raise RuntimeError('Native GRIB validation must run on the main thread')
  with GRIB_LOCK:return self._validate(b,rec)
 def _validate(self,b,rec):
  if len(b)<20 or b[:4]!=b'GRIB' or b[-4:]!=b'7777' or int.from_bytes(b[8:16],'big')!=len(b):raise ValueError('Truncated GRIB record')
  h=codes_new_from_message(b)
  try:
   if (codes_get(h,'dataDate'),codes_get(h,'dataTime'),codes_get(h,'endStep'))!=(int(self.cycle.strftime('%Y%m%d')),self.cycle.hour*100,rec['forecast_hour']):raise ValueError('Wrong decoded cycle/lead')
   if (codes_get(h,'gridType'),codes_get(h,'Nx'),codes_get(h,'Ny'))!=('lambert',1799,1059):raise ValueError('Wrong native grid')
   variable,level=rec['variable'],rec['level'];typ=codes_get(h,'typeOfLevel');lev=codes_get(h,'level');name=codes_get(h,'shortName');units=codes_get(h,'units')
   if name not in {'PRES':('pres','sp'),'TMP':('t',),'SPFH':('q',),'REFC':('refc',)}[variable]:raise ValueError('Wrong variable')
   if units not in {'PRES':('Pa',),'TMP':('K',),'SPFH':('kg kg**-1','kg kg-1'),'REFC':('dB','dBZ')}[variable]:raise ValueError('Wrong units')
   if 'hybrid' in level:
    if typ!='hybrid' or lev!=int(level.split()[0]):raise ValueError('Wrong hybrid level')
   elif level.endswith(' mb'):
    if typ!='isobaricInhPa' or lev!=int(level.split()[0]):raise ValueError('Wrong pressure level')
   elif level=='surface':
    if typ!='surface':raise ValueError('Wrong surface level')
   elif typ not in ('atmosphere','entireAtmosphere'):raise ValueError('Wrong reflectivity level')
   sig=codes_get(h,'md5Section3')
   with self.lock:
    if self.grid is not None and self.grid!=sig:raise ValueError('Mixed grid signatures')
    self.grid=sig
   return sig
  finally:codes_release(h)
 def acquire(self,provider,lead,variable,level):
  # Network/cache reads only: safe in a worker; no native calls or cache writes.
  rec=self.inventory(provider,lead)[(variable,level)]
  path=self.root/provider/f'F{lead:02d}'/(variable+'_'+level.replace(' ','_')+'.grib2')
  meta=path.with_suffix('.json');cached=False;b=None
  if path.exists() and meta.exists():
   try:
    stamp=json.loads(meta.read_text());b=path.read_bytes();cached=stamp.get('sha256')==hashlib.sha256(b).hexdigest() and all(stamp.get(k)==rec[k] for k in ('url','start','end'))
   except (OSError,ValueError):pass
  if not cached:b=self.transport(rec['url'],rec['start'],rec['end'])
  return rec,b,cached,path
 def prepare(self,task):
  lead,variable,level=task;prepared={}
  for provider in self.providers:
   try:prepared[provider]=self.acquire(provider,lead,variable,level);break
   except Exception as e:prepared[provider]=e
  return prepared
 def fetch(self,lead,variable,level,prepared=None):
  failures=[]
  for provider in self.providers:
   try:
    item=(prepared or {}).get(provider)
    if isinstance(item,Exception):raise item
    rec,b,cached,path=item if item is not None else self.acquire(provider,lead,variable,level)
    try:sig=self.validate(b,rec)
    except Exception:
     if not cached:raise
     b=self.transport(rec['url'],rec['start'],rec['end']);sig=self.validate(b,rec);cached=False
    if not cached:
     path.parent.mkdir(parents=True,exist_ok=True)
     tmp=path.with_suffix('.partial');tmp.write_bytes(b);tmp.replace(path)
     path.with_suffix('.json').write_text(json.dumps({**rec,'sha256':hashlib.sha256(b).hexdigest()}))
    result={**rec,'sha256':hashlib.sha256(b).hexdigest(),'grid_md5':sig,'cache_hit':cached,'fallback_reasons':failures}
    with self.lock:self.events.append(result)
    return result,b
   except Exception as e:failures.append({'provider':provider,'error':str(e)})
  raise RuntimeError(f'No valid source for F{lead:02d} {variable} {level}: {failures}')
 def fetch_batch(self,tasks,workers=4):
  # Batches contain at most four prefetched raw records; validation and writes stay on the caller/main thread.
  import concurrent.futures
  if threading.current_thread() is not threading.main_thread():raise RuntimeError('Batch decoding must run on the main thread')
  if not 1<=workers<=4:raise ValueError('Download workers must be 1 through 4')
  tasks=list(tasks)
  with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
   for offset in range(0,len(tasks),workers):
    batch=tasks[offset:offset+workers]
    futures=[pool.submit(self.prepare,task) for task in batch]
    for task,future in zip(batch,futures):yield self.fetch(*task,prepared=future.result())
 def preflight(self,lead):
  # Inventory presence is provisional; complete decoded ingestion is the publication gate.
  for provider in self.providers:
   try:
    inv=self.inventory(provider,lead);return {'lead':lead,'provider':provider,'records':len(inv),'status':'inventory_ready'}
   except Exception as e:reason=str(e)
  raise RuntimeError(f'F{lead:02d} unavailable: {reason}')
