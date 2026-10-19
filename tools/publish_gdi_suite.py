"""Use the same atomic data-branch publisher for named RAP and guidance suites."""
import os,json,datetime as dt
from pathlib import Path
from PIL import Image
import publish_gdi as publisher
SUITE=os.environ.get('GDI_SUITE','rap')
if SUITE not in ('rap','guidance'):raise ValueError('Unknown GDI suite')
publisher.BRANCH='data/'+SUITE+'-gdi';publisher.MARKER='GDI_SUITE_DATA_BRANCH.json';publisher.IDENTITY={'schema_version':1,'purpose':SUITE+' GDI dashboard suite'}
def verify(target):
 root=target/'public';m=json.loads((root/'metadata.json').read_text());dt.datetime.fromisoformat(m['cycle'])
 if m.get('schema')!='gdi_named_suite_v1' or m.get('crs')!='EPSG:3857' or [m.get('width'),m.get('height')]!=[2400,1360] or m.get('resampling')!='nearest':raise ValueError('Invalid GDI display contract')
 if SUITE=='rap' and set(m['products'])!={'analysis','change','forecast'}:raise ValueError('Incomplete RAP suite')
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
