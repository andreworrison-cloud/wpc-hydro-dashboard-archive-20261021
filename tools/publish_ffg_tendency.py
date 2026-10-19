#!/usr/bin/env python3
"""Restore/publish durable review state using a separate atomic Git branch.

Never writes the code branch or main. Each data branch is a single snapshot.
An exact-head force-with-lease prevents concurrent writers from losing updates.
GitHub controls garbage collection of unreachable historical objects.
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
from ingest_ffg_tendency import verify,prune
from datetime import datetime,timezone,timedelta

BRANCH='data/ffg-tendency'
MARKER='FFG_TENDENCY_DATA_BRANCH.json'
MAX_SNAPSHOT_BYTES=512*1024*1024
IDENTITY={'schema_version':1,'purpose':'Exact RFC FFG tendencies and 72-hour source buffer'}

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
                if path.is_absolute() or '..' in path.parts or path.parts[0] not in ('public','science',MARKER) or item.issym() or item.islnk():raise ValueError('Unexpected data-branch entry')
            archive.extractall(target,filter='data')
        if json.loads((target/MARKER).read_text())!=IDENTITY:raise ValueError('Unrecognized durable branch')
        verify(target)
    state_file.write_text(json.dumps({'branch':BRANCH,'head':head}))
    return head

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def publish(repo,target,state_file):
    expected=json.loads(state_file.read_text())
    if expected['branch']!=BRANCH or remote_head(repo)!=expected['head']:raise ValueError('Concurrent publication; restore and retry')
    prune(target)
    verify(target)
    (target/MARKER).write_text(json.dumps(IDENTITY,indent=2)+'\n')
    files=[]
    for p in target.rglob('*'):
        rel=p.relative_to(target)
        if p.is_symlink():raise ValueError('Symlink in publication')
        if p.is_file():
            if rel.parts[0] not in ('public','science',MARKER):raise ValueError('Unexpected publication file')
            if not any(part.startswith('.') for part in rel.parts):files.append(str(rel))
    if sum((target/p).stat().st_size for p in files)>MAX_SNAPSHOT_BYTES:
        raise ValueError('Snapshot exceeds 512 MiB storage budget; prior publication preserved')
    with tempfile.TemporaryDirectory() as tmp:
        env=dict(os.environ,GIT_INDEX_FILE=str(Path(tmp)/'index'),GIT_WORK_TREE=str(target.resolve()),
                 GIT_AUTHOR_NAME='FFG tendency publisher',GIT_AUTHOR_EMAIL='rfc-ffg@users.noreply.github.com',
                 GIT_COMMITTER_NAME='FFG tendency publisher',GIT_COMMITTER_EMAIL='rfc-ffg@users.noreply.github.com')
        git(repo,'read-tree','--empty',env=env)
        git(repo,'add','--force','--',*files,env=env)
        tree=git(repo,'write-tree',env=env)
        parent=expected['head']
        if parent and tree==git(repo,'rev-parse',f'{parent}^{{tree}}') and not git(repo,'cat-file','-p',parent).startswith('tree '+tree+'\nparent '):return parent
        args=['commit-tree',tree]
        # Deliberately omit parents: operational rasters are a rolling snapshot,
        # not a permanent binary archive. Code history remains untouched.
        commit=git(repo,*args,'-m','Publish complete FFG tendency pairs and status',env=env)
        git(repo,'push',f'--force-with-lease=refs/heads/{BRANCH}:{parent or ""}',
            'origin',f'{commit}:refs/heads/{BRANCH}')
        return commit

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['restore','publish'])
    parser.add_argument('--branch',choices=['data/ffg-tendency','data/ffg-tendency-review'],default='data/ffg-tendency')
    parser.add_argument('--initialize',action='store_true',help='Explicit first creation only')
    parser.add_argument('--repo',type=Path,default=Path.cwd())
    parser.add_argument('--data-dir',type=Path,required=True)
    parser.add_argument('--state-file',type=Path,required=True)
    args=parser.parse_args()
    global BRANCH
    BRANCH=args.branch
    if args.action=='restore' and remote_head(args.repo) is None and not args.initialize:raise ValueError('Durable branch missing; explicit initialization required')
    result=(restore if args.action=='restore' else publish)(args.repo,args.data_dir,args.state_file)
    print(f'{args.action}: {result or "new data branch"}',flush=True)
if __name__=='__main__':main()
