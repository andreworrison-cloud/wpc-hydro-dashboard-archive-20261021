"""Build a complete new cycle before replacing the publication manifest."""
import argparse,datetime as dt,json,os,pathlib,subprocess,sys
from select_cycle import choose_cycle
from render import render
p=argparse.ArgumentParser();p.add_argument('--data-dir',required=True);p.add_argument('--work-dir',default='run/gdi');a=p.parse_args()
root=pathlib.Path(a.data_dir)/'public';work=pathlib.Path(a.work_dir);work.mkdir(parents=True,exist_ok=True)
r=choose_cycle(dt.datetime.now(dt.timezone.utc));(work/'selection.json').write_text(json.dumps(r,indent=2));cycle=r['selected_cycle']
if not cycle:raise RuntimeError('No complete cycle; previous publication remains unchanged')
previous=root/'metadata.json'
if previous.exists() and json.loads(previous.read_text())['cycle']>=dt.datetime.strptime(cycle,'%Y%m%d%H').replace(tzinfo=dt.timezone.utc).isoformat():
    print('Published cycle already current');sys.exit(0)
decoded=work/cycle/'decoded'
env=dict(os.environ,GDI_CYCLE=cycle,GDI_OUTPUT_DIR=str(decoded))
subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('reconstruct_pressure.py'))],env=env,check=True)
m=render(decoded,root,cycle);print('Complete generation',m['generation'])
