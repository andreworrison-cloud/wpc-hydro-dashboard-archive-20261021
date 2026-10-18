import json
from pathlib import Path
import subprocess
import tempfile
import sys
import unittest
from unittest.mock import patch
import publish_h8
from publish_h8 import restore,publish,git,BRANCH

class DurablePublishTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.remote=self.root/'remote.git';self.repo=self.root/'code'
        subprocess.run(['git','init','--bare',str(self.remote)],check=True,capture_output=True)
        subprocess.run(['git','init',str(self.repo)],check=True,capture_output=True)
        git(self.repo,'remote','add','origin',str(self.remote))
        self.data=self.root/'data';self.state=self.root/'state.json'
        restore(self.repo,self.data,self.state)
    def write(self,state='unavailable'):
        for n in (1,2):
            (self.data/f'public/pass{n}').mkdir(parents=True,exist_ok=True)
            (self.data/f'public/pass{n}/metadata.json').write_text(json.dumps({'schema_version':1,'state':state,'active':None}))
    def test_atomic_restore_and_no_cache(self):
        self.write();head=publish(self.repo,self.data,self.state)
        fresh=self.root/'fresh';state=self.root/'fresh-state.json'
        self.assertEqual(restore(self.repo,fresh,state),head)
        self.assertEqual((fresh/'public/pass1/metadata.json').read_bytes(),(self.data/'public/pass1/metadata.json').read_bytes())
        self.assertEqual(git(self.repo,'ls-remote','--heads','origin').split()[1],f'refs/heads/{BRANCH}')
        self.assertEqual(publish(self.repo,fresh,state),head)
    def test_conflicting_writer_rejected(self):
        self.write();publish(self.repo,self.data,self.state)
        with self.assertRaisesRegex(ValueError,'Concurrent'):publish(self.repo,self.data,self.state)
    def test_invalid_product_keeps_remote(self):
        self.write();head=publish(self.repo,self.data,self.state)
        fresh=self.root/'fresh';state=self.root/'fresh-state.json';restore(self.repo,fresh,state)
        (fresh/'public/pass1/metadata.json').write_text('{}')
        with self.assertRaises(ValueError):publish(self.repo,fresh,state)
        self.assertEqual(git(self.repo,'ls-remote','--heads','origin').split()[0],head)
    def test_replacement_has_no_binary_history(self):
        self.write();old=publish(self.repo,self.data,self.state)
        fresh=self.root/'fresh';state=self.root/'fresh-state.json';restore(self.repo,fresh,state)
        (fresh/'public/pass1/metadata.json').write_text(json.dumps({'schema_version':1,'active':None,'state':'expired'}))
        head=publish(self.repo,fresh,state)
        self.assertNotEqual(head,old)
        self.assertNotIn('parent ',git(self.repo,'cat-file','-p',head))
        self.assertEqual(git(self.remote,'rev-list','--count',f'refs/heads/{BRANCH}'),'1')
        restored=self.root/'restored';restore(self.repo,restored,self.root/'restored-state')
        self.assertEqual(json.loads((restored/'public/pass1/metadata.json').read_text())['state'],'expired')
    def test_race_after_precheck_rejected_by_lease(self):
        self.write();old=publish(self.repo,self.data,self.state)
        fresh=self.root/'fresh';state=self.root/'fresh-state.json';restore(self.repo,fresh,state)
        (fresh/'public/pass1/metadata.json').write_text(json.dumps({'schema_version':1,'active':None,'state':'expired'}))
        other=None
        def racing_git(repo,*args,**kwargs):
            nonlocal other
            if args[0]=='push':
                # A competing writer advances after the initial remote-head check.
                env=dict(__import__('os').environ,GIT_AUTHOR_NAME='test',GIT_AUTHOR_EMAIL='test@example.com',GIT_COMMITTER_NAME='test',GIT_COMMITTER_EMAIL='test@example.com')
                other=git(self.repo,'commit-tree',git(self.repo,'rev-parse',old+'^{tree}'),'-p',old,'-m','concurrent writer',env=env)
                git(self.repo,'push','origin',f'{other}:refs/heads/{BRANCH}')
            return git(repo,*args,**kwargs)
        with patch.object(publish_h8,'git',side_effect=racing_git):
            with self.assertRaises(subprocess.CalledProcessError):publish(self.repo,fresh,state)
        self.assertEqual(git(self.repo,'ls-remote','--heads','origin').split()[0],other)
    def test_budget_failure_preserves_remote(self):
        self.write();head=publish(self.repo,self.data,self.state)
        fresh=self.root/'fresh';state=self.root/'fresh-state.json';restore(self.repo,fresh,state)
        with patch.object(publish_h8,'MAX_SNAPSHOT_BYTES',1):
            with self.assertRaisesRegex(ValueError,'storage budget'):publish(self.repo,fresh,state)
        self.assertEqual(git(self.repo,'ls-remote','--heads','origin').split()[0],head)
    def test_prune_keeps_active_and_pass2_baseline(self):
        from datetime import datetime,timezone,timedelta
        now=datetime.now(timezone.utc)
        def record(n,name,age,active=False):
            base=self.data/f'science/pass{n}'
            m={'generation':name,'qpe_end':(now-timedelta(hours=age)).isoformat()}
            folder=base/'windows/live';folder.mkdir(parents=True,exist_ok=True)
            (folder/(name+'.json')).write_text(json.dumps(m))
            for parent in (base/'generations',self.data/f'public/pass{n}/generations'):
                (parent/name).mkdir(parents=True,exist_ok=True)
            if active:(base/'metadata.json').write_text(json.dumps(m))
            return m
        record(1,'active',10,True)
        baseline=record(1,'baseline',11)
        record(2,'pass2',11,True)
        record(1,'recent',2)
        record(1,'obsolete',12)
        with patch.object(publish_h8,'read_window',return_value=baseline):publish_h8.prune(self.data)
        for name in ('active','baseline','recent'):
            self.assertTrue((self.data/f'science/pass1/generations/{name}').exists())
            self.assertTrue((self.data/f'public/pass1/generations/{name}').exists())
        self.assertFalse((self.data/'science/pass1/windows/live/obsolete.json').exists())
        self.assertFalse((self.data/'science/pass1/generations/obsolete').exists())
        self.assertFalse((self.data/'public/pass1/generations/obsolete').exists())
        self.assertTrue((self.data/'science/pass2/generations/pass2').exists())
    def test_nonempty_restore_rejected(self):
        self.write()
        with self.assertRaises(ValueError):restore(self.repo,self.data,self.state)

if __name__=='__main__':unittest.main()
