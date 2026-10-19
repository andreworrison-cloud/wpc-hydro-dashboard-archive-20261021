"""Complete paired RAP analyses and same-cycle +3 forecast; no mixed-time substitutes."""
import argparse,datetime as dt,json,pathlib,subprocess,sys,hashlib
import numpy as np

def build(work,public):
 work=pathlib.Path(work);work.mkdir(parents=True,exist_ok=True);scripts=pathlib.Path(__file__).parent
 now=dt.datetime.now(dt.timezone.utc).replace(minute=0,second=0,microsecond=0);failures=[]
 for age in range(6):
  cycle=now-dt.timedelta(hours=age);root=work/cycle.strftime('%Y%m%d%H');root.mkdir(exist_ok=True)
  try:
   for name,c,lead in [('analysis',cycle,0),('prior',cycle-dt.timedelta(hours=3),0),('forecast',cycle,3)]:
    path=root/(name+'.npz')
    if not path.exists():subprocess.run([sys.executable,str(scripts/'decode_model.py'),'--model','rap','--cycle',c.strftime('%Y%m%d%H'),'--lead',str(lead),'--out',str(path)],check=True)
   break
  except subprocess.CalledProcessError as e:failures.append({'cycle':cycle.isoformat(),'error':str(e)})
 else:raise RuntimeError('No complete RAP analysis/change/forecast package: '+str(failures))
 previous=pathlib.Path(public)/'metadata.json'
 if previous.exists() and json.loads(previous.read_text()).get('overlay_type')=='labeled_contours_v1' and json.loads(previous.read_text())['cycle']>=cycle.isoformat():print('RAP publication already current');return
 frames={k:np.load(root/(k+'.npz')) for k in ('analysis','prior','forecast')};m={k:json.loads((root/(k+'.json')).read_text()) for k in frames}
 for name,c,lead in [('analysis',cycle,0),('prior',cycle-dt.timedelta(hours=3),0),('forecast',cycle,3)]:
  if m[name]['cycle']!=c.isoformat() or m[name]['lead']!=lead or m[name]['sha256']!=hashlib.sha256((root/(name+'.npz')).read_bytes()).hexdigest():raise ValueError('RAP cached input identity mismatch')
 if len({x['grid_md5'] for x in m.values()})!=1:raise ValueError('RAP paired grids differ')
 current=frames['analysis'];data={'analysis':current['gdi'],'change':current['gdi']-frames['prior']['gdi'],'forecast':frames['forecast']['gdi'],'latitude':current['latitude'],'longitude':current['longitude']};np.savez_compressed(root/'fields.npz',**data)
 diff=['#053061','#2166ac','#4393c3','#92c5de','#d1e5f0','#f7f7f7','#fddbc7','#f4a582','#d6604d','#b2182b','#67001f']
 products={'analysis':{'label':'RAP GDI','valid_time':cycle.isoformat(),'legend':'GDI · 5-unit color bins'},'change':{'label':'RAP GDI · 3-hour change','valid_time':cycle.isoformat(),'window_start':(cycle-dt.timedelta(hours=3)).isoformat(),'legend':'GDI change · current analysis minus analysis 3 hours earlier','colors':diff,'edges':[-30,-20,-15,-10,-5,-2,2,5,10,15,20]},'forecast':{'label':'RAP GDI · +3-hour forecast','valid_time':(cycle+dt.timedelta(hours=3)).isoformat(),'legend':'GDI · 5-unit color bins'}}
 (root/'suite.json').write_text(json.dumps({'cycle':cycle.isoformat(),'model':'rap','native_spacing_km':13,'products':products,'source_metadata':m,'selection_failures':failures},indent=2))
 subprocess.run([sys.executable,str(scripts/'render_suite.py'),'--input',str(root),'--public',str(public)],check=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--work',default='run/rap-gdi');p.add_argument('--public',required=True);a=p.parse_args();build(a.work,a.public)
