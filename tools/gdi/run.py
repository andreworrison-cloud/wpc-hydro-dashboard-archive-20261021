"""Build a complete new cycle before replacing the publication manifest."""
import argparse,datetime as dt,json,os,pathlib,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('--data-dir',required=True);p.add_argument('--work-dir',default='run/gdi');a=p.parse_args()
root=pathlib.Path(a.data_dir)/'public';work=pathlib.Path(a.work_dir);work.mkdir(parents=True,exist_ok=True)
scripts=pathlib.Path(__file__).parent
# Isolate ecCodes from the rendering process and its projection-library runtime.
subprocess.run([sys.executable,str(scripts/'select_cycle.py'),'--output',str(work/'selection.json')],check=True)
r=json.loads((work/'selection.json').read_text());cycle=r['selected_cycle']
if not cycle:raise RuntimeError('No complete cycle; previous publication remains unchanged')
previous=root/'metadata.json'
if previous.exists() and json.loads(previous.read_text()).get('overlay_type')=='labeled_contours_v1' and json.loads(previous.read_text())['cycle']>=dt.datetime.strptime(cycle,'%Y%m%d%H').replace(tzinfo=dt.timezone.utc).isoformat():
    print('Published cycle already current');sys.exit(0)
decoded=work/cycle/'decoded'
env=dict(os.environ,GDI_CYCLE=cycle,GDI_OUTPUT_DIR=str(decoded))
subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('reconstruct_pressure.py'))],env=env,check=True)
subprocess.run([sys.executable,str(scripts/'render.py'),'--decoded',str(decoded),'--public',str(root),'--cycle',cycle],check=True)
print('Complete generation',json.loads((root/'metadata.json').read_text())['generation'])
