import sys,unittest,tempfile,json,hashlib
from pathlib import Path
from datetime import datetime,timedelta,timezone
import numpy as np
from rasterio.transform import from_origin
sys.path.insert(0,str(Path(__file__).resolve().parent))
from ingest_h8_review import select_common,ratios,failure_status
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
if __name__=='__main__':unittest.main()
