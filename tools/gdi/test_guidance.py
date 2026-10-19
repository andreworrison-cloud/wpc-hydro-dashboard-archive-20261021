"""Engineering checks: model weights, exact valid-time alignment and ERO window pairing."""
import datetime as dt,json,pathlib,tempfile,unittest.mock as mock,sys
import numpy as np
import build_guidance as build
import model_source
UTC=dt.timezone.utc;now=dt.datetime(2026,10,19,16,tzinfo=UTC)
class Source:
 def __init__(self,model,cycle):self.c=dt.datetime.strptime(cycle,'%Y%m%d%H').replace(tzinfo=UTC);self.model=model
 def tasks(self,lead):
  if self.c.hour not in (12,6) if self.model=='rrfs' else self.c.hour not in (15,14,12,6):raise ValueError('not available')
  return []
calls=[]
def frame(model,cycle,lead,cache,grids):
 lat,lon=np.meshgrid(np.arange(20),np.arange(20));grids[model]=(lat,lon,'test');valid=cycle+dt.timedelta(hours=lead);calls.append((model,cycle,valid))
 a=np.full((20,20),40. if model=='hrrr' else 20.);a[0,0]=np.nan
 return a,{'cycle':cycle.isoformat(),'grid_md5':'test','sha256':'0'*64,'humidity_inputs':['test'],'sources':[]}
with tempfile.TemporaryDirectory() as t,mock.patch.object(model_source,'PressureSource',Source),mock.patch.object(build,'frame',frame),mock.patch.object(build.subprocess,'run'):
 root=pathlib.Path(t);build.main('nowcast',root,root/'public',now)
 spec=json.loads((root/'render/suite.json').read_text());f=np.load(root/'render/fields.npz')
 assert spec['member_count']==4 and spec['sample_count']==7
 assert np.isclose(f['blend0'][10,10],30)
 assert np.isclose(f['support30'][10,10],50)
 assert np.isclose(f['persistence30'][10,10],3.5)
 assert np.isnan(f['maximum'][0,0])
 assert {v for _,_,v in calls}=={now+dt.timedelta(hours=h) for h in range(7)}
 assert spec['products']['rrfs0']['cycle']=='2026-10-19T12:00:00+00:00'
 assert all(len(member['samples'])==7 for member in spec['source_metadata'])
 print('Valid-time alignment, equal-model weights, counts, missing cells, and RRFS cycle labels pass')
attrs={'start_time':'2026-10-19 12:00:00','end_time':'2026-10-20 12:00:00','issue_time':'2026-10-19 07:50:00'}
import io
with mock.patch.object(build.urllib.request,'urlopen',return_value=io.StringIO(json.dumps({'features':[{'attributes':attrs}]}))):
 start,end,meta=build.ero_window(now+dt.timedelta(minutes=10));assert start.hour==17 and end==dt.datetime(2026,10,20,12,tzinfo=UTC);assert meta['issued_start']=='2026-10-19T12:00:00+00:00'
 print('Issued ERO interval and next-complete-hour remaining window pass')
