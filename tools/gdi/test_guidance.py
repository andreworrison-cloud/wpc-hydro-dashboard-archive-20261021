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

# A moving exceedance must count individual qualifying samples, not the
# window maximum repeated at every time. One missing sample invalidates it.
def evolving(model,cycle,lead,cache,grids):
 a,m=frame(model,cycle,lead,cache,grids)
 hour=int(((cycle+dt.timedelta(hours=lead))-now).total_seconds()/3600)
 a[:]=50. if hour in (1,4) else 10.
 if hour==2:a[10,10]=np.nan
 return a,m
with tempfile.TemporaryDirectory() as t,mock.patch.object(model_source,'PressureSource',Source),mock.patch.object(build,'frame',evolving),mock.patch.object(build.subprocess,'run'):
 root=pathlib.Path(t);build.main('nowcast',root,root/'public',now)
 with np.load(root/'render/fields.npz') as f:
  assert f['maximum'][8,8]==50 and f['persistence40'][8,8]==2
  assert np.isnan(f['maximum'][10,10]) and np.isnan(f['persistence40'][10,10])
  assert np.isnan(f['support40'][10,10])
 print('Intermittent exceedance and missing-hour masking pass')
