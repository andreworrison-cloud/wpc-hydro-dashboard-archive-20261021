import json,sys,tempfile,unittest,subprocess
from pathlib import Path
from datetime import datetime,timedelta,timezone
from unittest.mock import patch
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent))
import ingest_ffg_tendency as ingest
import publish_ffg_tendency as pub
class NumericalTests(unittest.TestCase):
 def test_difference_missing_and_sign(self):
  a=np.ma.array([25.4,50.8,0,10],mask=[0,0,0,1]);b=np.ma.array([50.8,25.4,0,1],mask=[0,0,1,0])
  np.testing.assert_allclose(ingest.difference(a,b)[:2],[-1,1],atol=1e-6)
  self.assertTrue(np.isnan(ingest.difference(a,b)[2:]).all())
 def test_shape_mismatch(self):
  with self.assertRaises(ValueError):ingest.difference(np.zeros(2),np.zeros(3))
 def test_expiry_uses_source_not_retrieval(self):
  s={'snapshot_time':'2026-10-19T15:00:00Z','reference_time':'2026-10-19T06:00:00Z','request':{'retrieved_at':'2026-10-19T16:00:00Z'}}
  self.assertEqual(ingest.expiry(s),datetime(2026,10,19,15,tzinfo=timezone.utc))
 def test_missing_exact_endpoints_never_substitutes(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);now=datetime.now(timezone.utc).replace(minute=0,second=0,microsecond=0);name=f'5kmffg_{now:%Y%m%d%H}.g2'
   meta={'snapshot_time':now.isoformat(),'reference_time':now.isoformat()}
   with patch.object(ingest,'download',return_value=(f'href="{name}"'.encode(),{})),patch.object(ingest,'source',return_value=({},None,None,meta)):
    with self.assertRaises(RuntimeError):ingest.run(root)
   m=json.loads((root/'public/metadata.json').read_text())
   self.assertTrue(all(a is None for a in m['products'].values()))
   self.assertTrue(all('Exact earlier endpoint unavailable' in a['error'] for a in m['last_attempt']['products'].values()))
class StorageTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.repo=self.root/'code';self.remote=self.root/'remote.git';self.data=self.root/'data';self.state=self.root/'state'
  for args in [('init','--bare',str(self.remote)),('init',str(self.repo))]:subprocess.run(['git',*args],check=True,capture_output=True)
  pub.git(self.repo,'remote','add','origin',str(self.remote));pub.restore(self.repo,self.data,self.state)
  (self.data/'public').mkdir();(self.data/'science/sources').mkdir(parents=True)
  self.write('initial');(self.data/'science/index.json').write_text('{}')
 def write(self,note):
  (self.data/'public/metadata.json').write_text(json.dumps({'schema_version':1,'policy':ingest.VIEW_POLICY,'products':{str(l):None for l in ingest.LAGS},'note':note}))
 def test_roundtrip_parentless_and_conflict(self):
  first=pub.publish(self.repo,self.data,self.state)
  with self.assertRaisesRegex(ValueError,'Concurrent'):pub.publish(self.repo,self.data,self.state)
  fresh=self.root/'fresh';state=self.root/'fresh-state';pub.restore(self.repo,fresh,state)
  m=json.loads((fresh/'public/metadata.json').read_text());m['note']='next';(fresh/'public/metadata.json').write_text(json.dumps(m))
  second=pub.publish(self.repo,fresh,state);self.assertNotEqual(first,second);self.assertNotIn('parent ',pub.git(self.repo,'cat-file','-p',second))
  self.assertEqual(pub.git(self.remote,'rev-list','--count','refs/heads/'+pub.BRANCH),'1')
 def test_budget_preserves_remote(self):
  head=pub.publish(self.repo,self.data,self.state);fresh=self.root/'fresh';state=self.root/'fresh-state';pub.restore(self.repo,fresh,state)
  with patch.object(pub,'MAX_SNAPSHOT_BYTES',1):
   with self.assertRaisesRegex(ValueError,'storage budget'):pub.publish(self.repo,fresh,state)
  self.assertEqual(pub.remote_head(self.repo),head)
 def test_prunes_older_than_72_hours(self):
  now=datetime.now(timezone.utc);index={}
  for age in [1,71,73]:
   rel=f'sources/{age}.g2';(self.data/'science'/rel).write_bytes(b'test');index[str(age)]={'path':rel,'snapshot_time':(now-timedelta(hours=age)).isoformat()}
  (self.data/'science/index.json').write_text(json.dumps(index));ingest.prune(self.data,now)
  self.assertTrue((self.data/'science/sources/71.g2').exists());self.assertFalse((self.data/'science/sources/73.g2').exists())
 def test_bad_policy_rejected(self):
  m=json.loads((self.data/'public/metadata.json').read_text());m['policy']['snapshot_hours']=999;(self.data/'public/metadata.json').write_text(json.dumps(m))
  with self.assertRaises(ValueError):pub.publish(self.repo,self.data,self.state)
if __name__=='__main__':unittest.main()
