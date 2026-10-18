import json
from pathlib import Path
import subprocess
import tempfile
import sys
import unittest
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
    def test_nonempty_restore_rejected(self):
        self.write()
        with self.assertRaises(ValueError):restore(self.repo,self.data,self.state)

if __name__=='__main__':unittest.main()
