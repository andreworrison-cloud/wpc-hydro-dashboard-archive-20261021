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

from PIL import Image
import shutil

BRANCH='data/gdi'
MARKER='GDI_DATA_BRANCH.json'
IDENTITY={'schema_version':1,'purpose':'HRRR GDI production map data'}

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
    root=target/'public'
    m=json.loads((root/'metadata.json').read_text())
    expected={f'{p}_{h}' for h in range(7) for p in ('gdi','numbers','coverage30','coverage40','coverage50')}|{f'{p}{t}' for p in ('persistence','longest') for t in (30,40,50)}
    if m.get('schema_version')!=1 or set(m.get('assets',{}))!=expected or m.get('crs')!='EPSG:3857' or [m.get('width'),m.get('height')]!=[2400,1360]:raise ValueError('Invalid GDI display contract')
    import datetime as dt
    cycle=dt.datetime.fromisoformat(m['cycle'])
    if m['valid_times']!=[(cycle+dt.timedelta(hours=h)).isoformat() for h in range(7)]:raise ValueError('Invalid GDI forecast window')
    for name,asset in m['assets'].items():
        rel=Path(asset['path'])
        if rel.is_absolute() or '..' in rel.parts or rel.parts!=('generations',m['generation'],name+'.png'):raise ValueError('Unsafe asset path')
        path=root/rel
        if sha(path)!=asset['sha256']:raise ValueError('Asset checksum mismatch')
        with Image.open(path) as image:
            if image.size!=(2400,1360):raise ValueError('Wrong image size')
            image.verify()

def export_public(target,destination):
    verify(target)
    source=target/'public';out=destination/'public';out.mkdir(parents=True)
    shutil.copyfile(source/'metadata.json',out/'metadata.json')
    m=json.loads((source/'metadata.json').read_text());generation=m['generation']
    candidates=sorted((source/'generations').iterdir(),key=lambda p:p.name,reverse=True)
    selected=[source/'generations'/generation]+[p for p in candidates if p.is_dir() and p.name!=generation][:1]
    for folder in selected:
        dest=out/'generations'/folder.name;dest.mkdir(parents=True)
        for p in folder.iterdir():
            if p.is_symlink() or not p.is_file() or p.suffix not in ('.png','.json'):raise ValueError('Unexpected publication file')
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
                 GIT_AUTHOR_NAME='HRRR GDI publisher',GIT_AUTHOR_EMAIL='gdi@users.noreply.github.com',
                 GIT_COMMITTER_NAME='HRRR GDI publisher',GIT_COMMITTER_EMAIL='gdi@users.noreply.github.com')
        git(repo,'read-tree','--empty',env=env)
        git(repo,'add','--force','--',*files,env=env)
        tree=git(repo,'write-tree',env=env)
        parent=expected['head']
        if parent and tree==git(repo,'rev-parse',f'{parent}^{{tree}}'):return parent
        args=['commit-tree',tree]
        if parent:args+=['-p',parent]
        commit=git(repo,*args,'-m','Publish validated HRRR GDI suites and freshness status',env=env)
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
