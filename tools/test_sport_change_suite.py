import json
from pathlib import Path
from datetime import datetime,timezone,timedelta
import tempfile
import unittest
from unittest.mock import patch,Mock
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from tools import sport_change_suite as s

class ChangeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'out';self.source=Path(self.temp.name)/'input';self.source.mkdir()
        self.now=datetime(2026,10,18,15,tzinfo=timezone.utc)
        for date,key in [('20261017','shallow'),('20261018','shallow'),('20261018','deep7day'),('20261018','deep14day')]:
            (self.source/s.filename(date,key)).write_bytes((date+key).encode())
        def reader(path,state=False):
            data=np.array([[20.,40.],[np.nan,90.]])
            if path.name.startswith('20261018'):data+=5
            if 'diff' in path.name:data=np.array([[-12.,0.],[np.nan,30.]])
            return data,from_bounds(-124.94,25.06,-67.07,52.93,2,2),{'valid_cells':3}
        def renderer(data,tr,path):
            path.write_bytes(s.rgba(data).tobytes());return {'width':4000,'height':2538}
        self.addCleanup(patch.stopall)
        self.reader=patch.object(s,'read_source',side_effect=reader).start()
        self.renderer=patch.object(s,'render',side_effect=renderer).start()
    def run_ingest(self,**kw):return s.ingest(self.root,self.source,kw.pop('date','20261018'),kw.pop('now',self.now),**kw)
    def metadata(self):return json.loads((self.root/'metadata.json').read_text())
    def test_native_signs_and_endpoint_subtraction(self):
        self.assertEqual(self.run_ingest(),0)
        a=self.metadata()['active'];self.assertEqual(a['products']['shallow24h']['start_time'],'2026-10-17T00:00:00Z')
        self.assertEqual(a['products']['shallow24h']['coverage']['max_pp'],5)
        self.assertEqual(a['products']['deep7day']['coverage']['min_pp'],-12)
        s.verify(self.root,a)
    def test_same_date_source_revision_new_generation(self):
        self.run_ingest();old=self.metadata()['active']['generation']
        (self.source/s.filename('20261017','shallow')).write_bytes(b'revised baseline')
        self.run_ingest();self.assertNotEqual(self.metadata()['active']['generation'],old)
        self.assertEqual(len(list((self.root/'numeric-cache').glob('*.tif'))),5)
    def test_unchanged_generation_stable_metadata(self):
        self.run_ingest();old=self.metadata()['active'];self.run_ingest(now=self.now+timedelta(hours=1))
        self.assertEqual(self.metadata()['active'],old);self.assertEqual(self.metadata()['state'],'unchanged')
    def test_missing_baseline_never_uses_older_day(self):
        self.run_ingest();old=self.metadata()['active'];p=self.source/s.filename('20261017','shallow');p.rename(self.source/s.filename('20261016','shallow'))
        self.assertEqual(self.run_ingest(),1);self.assertEqual(self.metadata()['active'],old)
    def test_incomplete_native_product_retains_whole_suite(self):
        self.run_ingest();old=self.metadata()['active'];(self.source/s.filename('20261018','deep14day')).unlink()
        self.run_ingest();self.assertEqual(self.metadata()['active'],old);self.assertEqual(self.metadata()['state'],'retained')
    def test_interrupted_render_keeps_previous(self):
        self.run_ingest();old=self.metadata()['active'];(self.source/s.filename('20261018','deep7day')).write_bytes(b'revision')
        self.renderer.side_effect=RuntimeError('interrupted render');self.run_ingest();self.assertEqual(self.metadata()['active'],old)
    def test_corrupt_previous_not_retained(self):
        self.run_ingest();a=self.metadata()['active'];(self.root/a['products']['deep7day']['image']['path']).write_bytes(b'corrupt')
        (self.source/s.filename('20261018','deep7day')).unlink();self.run_ingest();self.assertIsNone(self.metadata()['active'])
    def test_expiry_by_end_not_baseline_or_retrieval(self):
        self.run_ingest();old=self.metadata()['active'];self.run_ingest(now=self.now+timedelta(days=4));m=self.metadata()
        self.assertFalse(m['usable']);self.assertEqual(m['state'],'expired');self.assertEqual(m['active'],old)
        base=s.parse(old['valid_time']);self.assertEqual(s.freshness(old,base+timedelta(hours=48))['status'],'aging');self.assertFalse(s.freshness(old,base+timedelta(hours=72))['usable'])
    def test_future_rejected(self):self.assertEqual(self.run_ingest(now=self.now-timedelta(days=1)),1)
    def test_mask_change_rejected(self):
        with self.assertRaises(ValueError):s.difference(np.array([1.,np.nan]),np.array([1.,2.]))
    def test_signed_palette_and_missing_neutral_distinction(self):
        values=np.array([[-100,-20,-1,0,1,20,100,np.nan]])
        out=s.rgba(values)[0];self.assertTrue(np.all(out[:-1,3]>0));self.assertEqual(out[-1,3],0)
        np.testing.assert_array_equal(out[0],s.COLORS[0]);np.testing.assert_array_equal(out[1],s.COLORS[1]);np.testing.assert_array_equal(out[3],s.COLORS[5]);np.testing.assert_array_equal(out[4],s.COLORS[6])
    def test_inventory_does_not_mix_products(self):
        names=s.filename('20261018','shallow')+s.filename('20261017','deep7day')
        self.assertEqual(s.inventory(names,'shallow'),{'20261018'})
    def test_source_revision_rejected(self):
        session=Mock();session.head.return_value.headers={'ETag':'new'}
        with self.assertRaisesRegex(ValueError,'revised'):s.check_revision(session,{'url':'https://example.test','etag':'old'})
    def test_validator_absence_uses_hash(self):
        session=Mock();session.head.return_value.headers={};session.get.return_value.content=b'content'
        self.assertEqual(s.check_revision(session,{'url':'https://example.test','sha256':s.hashlib.sha256(b'content').hexdigest()}),'post_download_sha256')
    def test_numeric_cache_retains_recent_revisions_and_prunes_old(self):
        self.run_ingest();idx=self.root/'numeric-cache/index.json';entries=json.loads(idx.read_text());sha='a'*64
        (self.root/'numeric-cache'/f'{sha}.tif').write_bytes(b'old');entries[sha]={'last_verified_at':s.iso(self.now-timedelta(days=22))};s.atomic_json(idx,entries)
        self.run_ingest();self.assertNotIn(sha,json.loads(idx.read_text()));self.assertEqual(len(list((self.root/'numeric-cache').glob('*.tif'))),4)

class NumericalTests(unittest.TestCase):
    def test_actual_signed_reprojection_preserves_drying_and_mask(self):
        tr=from_bounds(-124.94,25.06,-67.07,52.93,1929,929)
        a=np.full((929,1929),-5.0);a[:,1000:]=5;a[:100,:]=np.nan
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'map.png';meta=s.render(a,tr,path)
            from PIL import Image
            image=np.array(Image.open(path));self.assertEqual(image.shape,(2538,4000,4))
            self.assertTrue((image[:,:,3]==0).any());self.assertTrue(np.any(np.all(image==s.COLORS[3],axis=2)));self.assertTrue(np.any(np.all(image==s.COLORS[8],axis=2)))
    def test_native_sentinel_and_out_of_range_rejection(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'source.tif';a=np.full((929,1929),9999.);a.flat[:1290511]=-2
            profile=dict(driver='GTiff',height=929,width=1929,count=1,dtype='float64',crs='EPSG:4326',transform=from_bounds(-124.94,25.06,-67.07,52.93,1929,929))
            with rasterio.open(path,'w',**profile) as ds:ds.write(a,1)
            b,_,stats=s.read_source(path);self.assertEqual(stats['valid_cells'],1290511);self.assertTrue(np.isnan(b).any())
            with self.assertRaises(ValueError):s.read_source(path,state=True)
            a[0,0]=-101
            with rasterio.open(path,'w',**profile) as ds:ds.write(a,1)
            with self.assertRaises(ValueError):s.read_source(path)
if __name__=='__main__':unittest.main()
