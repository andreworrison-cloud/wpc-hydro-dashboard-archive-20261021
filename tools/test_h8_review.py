import sys,unittest,tempfile,json,hashlib
from unittest.mock import patch
from pathlib import Path
from datetime import datetime,timedelta,timezone
import numpy as np
from rasterio.transform import from_origin
sys.path.insert(0,str(Path(__file__).resolve().parent))
from ingest_h8_review import select_common,ratios,failure_status,bind_window,read_window,resolve_ffg,writer_lock,build,select_pass2_target
class ReviewContracts(unittest.TestCase):
 def test_common_end_does_not_mix_windows(self):
  now=datetime(2026,10,18,16,30,tzinfo=timezone.utc)
  def inv(hours):return {'rows':[{'end':now.replace(hour=h,minute=0).isoformat()} for h in hours]}
  self.assertEqual(select_common([inv([14,15,16]),inv([14,15]),inv([14,15,16])],now).hour,15)
 def test_stale_or_no_common_rejected(self):
  now=datetime.now(timezone.utc)
  with self.assertRaises(ValueError):select_common([{'rows':[{'end':(now-timedelta(hours=4)).isoformat()}]}],now)
  with self.assertRaises(ValueError):select_common([{'rows':[]}],now)
 def test_narrow_peak_and_zero_preserved(self):
  q=np.zeros((4,4),dtype='float32');q[0,0]=40;f=np.full((2,2),10,dtype='float32')
  fine,coarse,mean,cov=ratios(q,from_origin(0,4,1,1),'EPSG:4326',f,from_origin(0,4,2,2),'EPSG:4326')
  self.assertEqual(fine[0,0],4);self.assertEqual(coarse[0,0],1);self.assertEqual(fine[3,3],0)
 def test_missing_does_not_become_zero_or_get_averaged_away(self):
  q=np.zeros((4,4),dtype='float32');q[0,0]=np.nan;f=np.full((2,2),10,dtype='float32');f[1,1]=np.nan
  fine,coarse,mean,cov=ratios(q,from_origin(0,4,1,1),'EPSG:4326',f,from_origin(0,4,2,2),'EPSG:4326')
  self.assertTrue(np.isnan(fine[0,0]));self.assertTrue(np.isnan(coarse[0,0]));self.assertEqual(cov[0,0],.75);self.assertTrue(np.isnan(fine[3,3]))
class RetentionContracts(unittest.TestCase):
 def test_retention_expiry_and_corruption(self):
  now=datetime.now(timezone.utc)
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);folder=root/'generations'/'test';folder.mkdir(parents=True);(folder/'input').write_bytes(b'verified source')
   m={'generation':'test','files':[{'path':'input','sha256':hashlib.sha256(b'verified source').hexdigest()}],'qpe_end':now.isoformat(),'live_age_deadline':(now+timedelta(hours=1)).isoformat()}
   (root/'metadata.json').write_text(json.dumps(m))
   self.assertEqual(failure_status(root,RuntimeError('outage'),now)['state'],'retained')
   self.assertEqual(failure_status(root,RuntimeError('outage'),now+timedelta(hours=2))['state'],'expired')
   (folder/'input').write_bytes(b'corrupt')
   self.assertEqual(failure_status(root,RuntimeError('outage'),now)['state'],'unavailable')
class PairingContracts(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.end=datetime(2026,10,18,tzinfo=timezone.utc)
 def fixture(self,number=1,generation='original',historical=False):
  folder=self.root/f'pass{number}'/'generations'/generation;folder.mkdir(parents=True,exist_ok=True)
  data=b'frozen FFG bytes';(folder/'ffg.g2').write_bytes(data);sha=hashlib.sha256(data).hexdigest()
  return dict(generation=generation,pass_number=number,qpe_end=self.end.isoformat(),historical_review=historical,files=[dict(path='ffg.g2',sha256=sha)],ffg=dict(sha256=sha,snapshot_time=(self.end-timedelta(hours=1)).isoformat()),live_age_deadline=(self.end+timedelta(hours=2)).isoformat())
 def test_later_ffg_is_not_fetched_for_bound_window(self):
  m=self.fixture();bind_window(self.root,m)
  with patch('ingest_h8_review.fetch',side_effect=AssertionError('Must not discover newer FFG')):
   path,meta=resolve_ffg(self.root,self.end,False,self.end+timedelta(minutes=50))
  self.assertEqual(path.read_bytes(),b'frozen FFG bytes');self.assertEqual(meta,m['ffg'])
 def test_source_revision_does_not_overwrite_window(self):
  m=self.fixture();bind_window(self.root,m)
  with self.assertRaisesRegex(ValueError,'explicit reviewed revision'):bind_window(self.root,self.fixture(generation='revision'))
  self.assertEqual(read_window(self.root,1,self.end,False)['generation'],'original')
 def test_corrupt_frozen_source_never_falls_back_to_new_guidance(self):
  m=self.fixture();bind_window(self.root,m)
  (self.root/'pass1/generations/original/ffg.g2').write_bytes(b'corrupt')
  with patch('ingest_h8_review.fetch',side_effect=AssertionError('No replacement')):
   with self.assertRaisesRegex(ValueError,'checksum'):resolve_ffg(self.root,self.end,False,self.end)
 def test_delayed_pass2_requires_exact_baseline(self):
  m=self.fixture();bind_window(self.root,m)
  path=self.root/'pass1/generations/original/ffg.g2'
  bad=dict(m['ffg'],sha256='different')
  with self.assertRaisesRegex(ValueError,'frozen same-window'):build(self.root,2,self.end,{},path,bad,self.end,self.end)
  # The correct delayed baseline passes the identity gate and reaches numerical validation.
  with patch('ingest_h8_review.read_fields',side_effect=RuntimeError('numerical validation reached')):
   with self.assertRaisesRegex(RuntimeError,'numerical validation reached'):build(self.root,2,self.end,{},path,m['ffg'],self.end,self.end)
 def test_pass2_without_pass1_waits(self):
  m=self.fixture(number=2)
  with self.assertRaisesRegex(ValueError,'frozen same-window'):build(self.root,2,self.end,{},self.root/'none',m['ffg'],self.end,self.end)
 def test_historical_and_live_bindings_are_separate(self):
  bind_window(self.root,self.fixture(historical=True))
  self.assertIsNone(read_window(self.root,1,self.end,False))
  self.assertIsNotNone(read_window(self.root,1,self.end,True))
 def test_expired_baseline_cannot_refresh_its_age(self):
  bind_window(self.root,self.fixture())
  with self.assertRaisesRegex(ValueError,'age gate'):resolve_ffg(self.root,self.end,False,self.end+timedelta(hours=2))
 def test_delayed_pass2_can_match_prior_archived_pass1_without_mislabeling_current(self):
  bind_window(self.root,self.fixture())
  inventories=[{'rows':[{'end':self.end.isoformat()}]}]*3
  self.assertEqual(select_pass2_target(self.root,inventories,self.end+timedelta(hours=1),False,self.end+timedelta(hours=1,minutes=10)),self.end)
  self.assertIsNone(select_pass2_target(self.root,inventories,self.end+timedelta(hours=2),False,self.end+timedelta(hours=2)))
  self.assertIsNone(select_pass2_target(self.root,[{'rows':[]}]*3,self.end,False,self.end))
 def test_writer_lock_excludes_second_writer_and_releases(self):
  with writer_lock(self.root):
   with self.assertRaisesRegex(RuntimeError,'Another H8 ingest'):
    with writer_lock(self.root):pass
  with writer_lock(self.root):pass
if __name__=='__main__':unittest.main()

