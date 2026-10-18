#!/usr/bin/env python3
"""Restore/publish durable production state using a separate atomic Git branch.

Never writes the code branch or main. No force push; concurrent writers fail.
Git history is retained. Directory retention does not bound historical storage. Original floats are excluded from Git history.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import io
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from tools import sport_suite, sport_rsm_suite, sport_change_suite
from PIL import Image
import shutil

BRANCH='data/sport-lis'
MARKER='SPORT_LIS_DATA_BRANCH.json'
IDENTITY={'schema_version':1,'purpose':'SPoRT-LIS production map data'}

def git(repo,*args,env=None):
    result=subprocess.run(['git','-C',str(repo),*args],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env)
    return result.stdout.decode().strip()

def remote_head(repo):
    text=git(repo,'ls-remote','--heads','origin',f'refs/heads/{BRANCH}')
    return text.split()[0] if text else None

def restore(repo,target,state_file):
    if target.exists() and any(target.iterdir()):raise ValueError('Restore target must be empty; caches are not authoritative')
    target.mkdir(parents=True,exist_ok=True)
    head=remote_head(repo)
    if head:
        git(repo,'fetch','--depth=1','origin',f'refs/heads/{BRANCH}')
        # Capture exact fetched commit, even if the remote changed after ls-remote.
        head=git(repo,'rev-parse','FETCH_HEAD')
        data=subprocess.run(['git','-C',str(repo),'archive',head],check=True,stdout=subprocess.PIPE).stdout
        with tarfile.open(fileobj=io.BytesIO(data)) as archive:
            for item in archive.getmembers():
                path=Path(item.name)
                if path.is_absolute() or '..' in path.parts or path.parts[0] not in ('public',MARKER) or item.issym() or item.islnk():raise ValueError('Unexpected data-branch entry')
            archive.extractall(target,filter='data')
        if json.loads((target/MARKER).read_text())!=IDENTITY:raise ValueError('Unrecognized durable branch')
        verify(target)
    state_file.write_text(json.dumps({'branch':BRANCH,'head':head}))
    return head

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def verify(target):
    for key,module in [('percentile',sport_suite),('rsm',sport_rsm_suite),('change',sport_change_suite)]:
        root=target/'public'/key
        if key=='change' and not (root/'metadata.json').exists():continue # H6-to-H7 bootstrap
        m=json.loads((root/'metadata.json').read_text())
        if m.get('schema_version')!=1 or m.get('policy')!=module.POLICY:raise ValueError('Invalid SPoRT policy/schema')
        a=m.get('active')
        if not a:continue
        if key=='change':module.verify(root,a)
        else:module.verify(root,a,require_sources=False)
        for p in a['products'].values():
            i=p['image']
            if i['crs']!='EPSG:3857' or i['resampling']!='bilinear' or [i['width'],i['height']]!=[4000,2538]:raise ValueError('Invalid display contract')
            with Image.open(root/i['path']) as im:
                if im.size!=(4000,2538):raise ValueError('Invalid image dimensions')
                im.verify()


def export_public(target,destination):
    """Keep active plus one preceding generation per suite; originals stay in artifacts."""
    verify(target)
    for key in ('percentile','rsm','change'):
        source=target/'public'/key
        if key=='change' and not (source/'metadata.json').exists():continue
        out=destination/'public'/key;out.mkdir(parents=True)
        shutil.copyfile(source/'metadata.json',out/'metadata.json')
        m=json.loads((source/'metadata.json').read_text());active=m.get('active')
        if not active:continue
        generation=active['generation'];candidates=sorted((source/'generations').glob('*'),key=lambda p:p.name,reverse=True)
        selected=[source/'generations'/generation]+[p for p in candidates if p.is_dir() and p.name!=generation][:1]
        for folder in selected:
            dest=out/'generations'/folder.name;dest.mkdir(parents=True)
            for p in folder.glob('*.png'):
                if p.is_symlink():raise ValueError('Symlink in publication')
                shutil.copyfile(p,dest/p.name)
    (destination/MARKER).write_text(json.dumps(IDENTITY,indent=2)+'\n')
    verify(destination)

def publish_export(repo,target,state_file):
    expected=json.loads(state_file.read_text())
    if expected['branch']!=BRANCH or remote_head(repo)!=expected['head']:raise ValueError('Concurrent publication; restore and retry')
    verify(target)
    (target/MARKER).write_text(json.dumps(IDENTITY,indent=2)+'\n')
    files=[]
    for p in target.rglob('*'):
        rel=p.relative_to(target)
        if p.is_symlink():raise ValueError('Symlink in publication')
        if p.is_file():
            if rel.parts[0] not in ('public',MARKER):raise ValueError('Unexpected publication file')
            if not any(part.startswith('.') for part in rel.parts):files.append(str(rel))
    with tempfile.TemporaryDirectory() as tmp:
        env=dict(os.environ,GIT_INDEX_FILE=str(Path(tmp)/'index'),GIT_WORK_TREE=str(target.resolve()),
                 GIT_AUTHOR_NAME='SPoRT-LIS publisher',GIT_AUTHOR_EMAIL='sport-lis@users.noreply.github.com',
                 GIT_COMMITTER_NAME='SPoRT-LIS publisher',GIT_COMMITTER_EMAIL='sport-lis@users.noreply.github.com')
        git(repo,'read-tree','--empty',env=env)
        git(repo,'add','--force','--',*files,env=env)
        tree=git(repo,'write-tree',env=env)
        parent=expected['head']
        if parent and tree==git(repo,'rev-parse',f'{parent}^{{tree}}'):return parent
        args=['commit-tree',tree]
        if parent:args+=['-p',parent]
        commit=git(repo,*args,'-m','Publish validated SPoRT-LIS suites and freshness status',env=env)
        git(repo,'push','origin',f'{commit}:refs/heads/{BRANCH}')
        return commit

def publish(repo,target,state_file):
    with tempfile.TemporaryDirectory() as tmp:
        export=Path(tmp)/'export';export.mkdir()
        export_public(target,export)
        return publish_export(repo,export,state_file)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['restore','publish'])
    parser.add_argument('--repo',type=Path,default=Path.cwd())
    parser.add_argument('--data-dir',type=Path,required=True)
    parser.add_argument('--state-file',type=Path,required=True)
    args=parser.parse_args()
    result=(restore if args.action=='restore' else publish)(args.repo,args.data_dir,args.state_file)
    print(f'{args.action}: {result or "new data branch"}',flush=True)
if __name__=='__main__':main()
