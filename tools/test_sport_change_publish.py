import io,json,hashlib,zipfile,tempfile,unittest
from pathlib import Path
from PIL import Image
from tools.test_publish_sport import PublishTests
from tools import publish_sport as p,sport_change_suite as h
from tools.restore_sport_change_cache import extract_verified

class H7PublishTests(PublishTests):
    def setUp(self):
        super().setUp();root=self.data/'public/change';root.mkdir(parents=True)
        m=json.loads(Path('review/h7/change_ingest_evidence.json').read_text());m['policy']=h.POLICY
        for product in m['active']['products'].values():
            path=root/product['image']['path'];path.parent.mkdir(parents=True,exist_ok=True);Image.new('RGBA',(4000,2538),(152,84,31,235)).save(path);product['image']['sha256']=h.digest(path)
        (root/'metadata.json').write_text(json.dumps(m));(root/'numeric-cache').mkdir();(root/'numeric-cache/source.tif').write_bytes(b'must not enter git')
    def test_atomic_roundtrip_and_source_exclusion(self):
        head=p.publish(self.repo,self.data,self.state);root,state=self.restored();p.verify(root)
        self.assertFalse(list(root.rglob('*.tif')));self.assertEqual(len(list(root.rglob('*.png'))),9);self.assertFalse((root/'public/change/numeric-cache').exists())
        self.assertEqual(p.publish(self.repo,root,state),head)
    def test_h7_failure_survives_durable_restore(self):
        p.publish(self.repo,self.data,self.state);root,state=self.restored();suite=root/'public/change';before=json.loads((suite/'metadata.json').read_text())['active']
        from datetime import datetime,timezone
        h.ingest(suite,source_dir=self.root/'missing',date='20261018',now=datetime(2026,10,18,15,tzinfo=timezone.utc))
        self.assertEqual(json.loads((suite/'metadata.json').read_text())['active'],before);p.publish(self.repo,root,state)

class ArchiveTests(unittest.TestCase):
    def archive(self,corrupt=False,unsafe=False):
        raw=b'versioned numeric bytes';sha=hashlib.sha256(raw).hexdigest();buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w') as z:
            z.writestr('index.json',json.dumps({sha:{'sha256':sha,'last_verified_at':'2026-10-18T00:00:00Z','valid_time':'2026-10-17T00:00:00Z'}}))
            z.writestr(('../' if unsafe else '')+sha+'.tif',b'corrupt' if corrupt else raw)
        return buffer.getvalue()
    def test_verified_restore(self):
        with tempfile.TemporaryDirectory() as tmp:self.assertEqual(extract_verified(self.archive(),Path(tmp)/'cache'),1)
    def test_corruption_and_unsafe_paths_fail_before_restore(self):
        for kwargs in [{'corrupt':True},{'unsafe':True}]:
            with tempfile.TemporaryDirectory() as tmp:
                target=Path(tmp)/'cache'
                with self.assertRaises(ValueError):extract_verified(self.archive(**kwargs),target)
                self.assertFalse(target.exists())
if __name__=='__main__':unittest.main()
