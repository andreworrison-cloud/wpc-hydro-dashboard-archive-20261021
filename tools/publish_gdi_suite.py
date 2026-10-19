"""Use the same atomic data-branch publisher for named RAP and guidance suites."""
import os,json,datetime as dt
from pathlib import Path
from PIL import Image
import publish_gdi as publisher
SUITE=os.environ.get('GDI_SUITE','rap')
if SUITE not in ('rap','guidance','ero'):raise ValueError('Unknown GDI suite')
publisher.BRANCH='data/'+SUITE+'-gdi';publisher.MARKER='GDI_SUITE_DATA_BRANCH.json';publisher.IDENTITY={'schema_version':1,'purpose':SUITE+' GDI dashboard suite'}
def verify(target):
 root=target/'public';m=json.loads((root/'metadata.json').read_text());dt.datetime.fromisoformat(m['cycle'])
 if m.get('schema')!='gdi_named_suite_v1' or m.get('crs')!='EPSG:3857' or [m.get('width'),m.get('height')]!=[2400,1360] or m.get('resampling')!='nearest':raise ValueError('Invalid GDI display contract')
 if SUITE=='rap' and set(m['products'])!={'analysis','change','forecast'}:raise ValueError('Incomplete RAP suite')
 if SUITE in ('guidance','ero'):
  keys={'maximum','support30','support40','support50','persistence30','persistence40','persistence50'}
  if SUITE=='guidance':keys|={f'{model}{h}' for model in ('rrfs','blend') for h in (0,3,6)}
  if set(m['products'])!=keys or m.get('member_count')!=4:raise ValueError('Incomplete window suite')
  start,end=map(dt.datetime.fromisoformat,(m['window_start'],m['window_end']))
  count=int((end-start).total_seconds()/3600)+1
  if count<2 or m['sample_count']!=count or m['expires_at']!=m['window_end']:raise ValueError('Invalid window samples')
  members=m['source_metadata']
  if sorted((x['model'],x['lag']) for x in members)!=[('hrrr',0),('hrrr',1),('rrfs',0),('rrfs',1)]:raise ValueError('Incomplete model/lag membership')
  for member in members:
   times=[dt.datetime.fromisoformat(x['valid_time']) for x in member['samples']]
   if times!=[start+dt.timedelta(hours=h) for h in range(count)]:raise ValueError('Misaligned member valid times')
   for sample in member['samples']:
    if dt.datetime.fromisoformat(sample['cycle'])+dt.timedelta(hours=sample['lead'])!=dt.datetime.fromisoformat(sample['valid_time']):raise ValueError('Lead and valid time disagree')
  if SUITE=='ero':
   e=m['ero']
   if dt.datetime.fromisoformat(e['issued_start'])>start or dt.datetime.fromisoformat(e['issued_end'])!=end:raise ValueError('Not aligned to issued ERO')
 expected={k+s for k in m['products'] for s in ('','_numbers')}
 if set(m['assets'])!=expected:raise ValueError('Incomplete image pairs')
 for key,a in m['assets'].items():
  path=Path(a['path'])
  if path.parts!=('generations',m['generation'],key+'.png') or path.is_absolute() or '..' in path.parts:raise ValueError('Unsafe path')
  p=root/path
  if publisher.sha(p)!=a['sha256']:raise ValueError('Checksum mismatch')
  with Image.open(p) as im:
   if im.size!=(2400,1360):raise ValueError('Image size mismatch')
   im.verify()
 if SUITE=='rap':
  c=dt.datetime.fromisoformat(m['cycle']);ps=m['products']
  if dt.datetime.fromisoformat(ps['analysis']['valid_time'])!=c or dt.datetime.fromisoformat(ps['forecast']['valid_time'])!=c+dt.timedelta(hours=3) or dt.datetime.fromisoformat(ps['change']['window_start'])!=c-dt.timedelta(hours=3):raise ValueError('RAP time mismatch')
publisher.verify=verify
if __name__=='__main__':publisher.main()
