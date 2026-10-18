"""Restore verified H7 numeric versions from the newest retained GitHub artifact.
Map state is independently authoritative on data/sport-lis. No secrets are logged.
"""
import argparse,hashlib,io,json,os,re,tempfile,zipfile
from pathlib import Path
import requests
from tools.sport_change_suite import digest,parse
PREFIX='sport-h7-numeric-'

def extract_verified(raw,target):
    if target.exists() and any(target.iterdir()):raise ValueError('Numeric restore target must be empty')
    with tempfile.TemporaryDirectory() as tmp:
        stage=Path(tmp)
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            for info in z.infolist():
                if not re.fullmatch(r'(index\.json|[a-f0-9]{64}\.tif)',info.filename):raise ValueError('Unexpected numeric archive path')
                if info.file_size>32*1024*1024:raise ValueError('Oversized numeric archive member')
            z.extractall(stage)
        index=json.loads((stage/'index.json').read_text())
        if not isinstance(index,dict) or not index:raise ValueError('Empty numeric archive index')
        for sha,entry in index.items():
            if not re.fullmatch('[a-f0-9]{64}',sha) or entry['sha256']!=sha:raise ValueError('Invalid numeric hash index')
            parse(entry['last_verified_at']);parse(entry['valid_time'])
            if digest(stage/(sha+'.tif'))!=sha:raise ValueError('Corrupt numeric archive')
        if set(p.name for p in stage.iterdir()) != {'index.json'}|{sha+'.tif' for sha in index}:raise ValueError('Unindexed numeric data')
        target.mkdir(parents=True,exist_ok=True)
        for p in stage.iterdir():os.replace(p,target/p.name)
    return len(index)

def restore(target,required,repo,token):
    api=f'https://api.github.com/repos/{repo}'
    session=requests.Session();session.headers.update({'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
    candidates=[]
    # Exact producer workflow avoids unrelated review/PR artifacts with similar names.
    runs=session.get(api+'/actions/workflows/fetch_sport.yml/runs',params={'branch':'main','per_page':100},timeout=60);runs.raise_for_status()
    for run in runs.json()['workflow_runs']:
        r=session.get(api+f"/actions/runs/{run['id']}/artifacts",params={'per_page':100},timeout=60);r.raise_for_status()
        candidates.extend(a for a in r.json()['artifacts'] if a['name'].startswith(PREFIX) and not a['expired'])
        if candidates:break
    if not candidates:
        if required:raise ValueError('Existing H7 generation requires its retained numeric archive; refusing silent history reset')
        print('H7 numeric restore: first production bootstrap');return
    item=max(candidates,key=lambda x:x['created_at'])
    response=session.get(item['archive_download_url'],timeout=180);response.raise_for_status()
    expected=item.get('digest')
    if expected and expected.startswith('sha256:') and hashlib.sha256(response.content).hexdigest()!=expected[7:]:raise ValueError('Archive digest mismatch')
    count=extract_verified(response.content,target)
    print(f"H7 numeric restore: artifact {item['id']}, {count} verified source versions")

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--suite-dir',type=Path,required=True);a=p.parse_args()
    pointer=a.suite_dir/'metadata.json';required=pointer.exists() and bool(json.loads(pointer.read_text()).get('active'))
    restore(a.suite_dir/'numeric-cache',required,os.environ['GITHUB_REPOSITORY'],os.environ['GH_TOKEN'])
