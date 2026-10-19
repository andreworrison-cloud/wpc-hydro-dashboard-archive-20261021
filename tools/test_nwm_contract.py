import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import unittest
from unittest.mock import patch
import tempfile
import json
from datetime import datetime, timezone
import numpy as np
import xarray as xr
import fetch_nwm as nwm

class Contract(unittest.TestCase):
    def array(self, values):
        a = xr.DataArray(values, attrs={'units':'1'})
        a.encoding.update(scale_factor=np.float32(.001), add_offset=0.)
        return a
    def test_saturated_roundoff_and_missing(self):
        np.testing.assert_allclose(nwm.saturation_percent(self.array([1.0000000475,.2,np.nan])), [100,20,np.nan])
    def test_unknown_units_rejected(self):
        a=self.array([.2]); a.attrs['units']='percent'
        with self.assertRaises(RuntimeError): nwm.saturation_percent(a)
    def test_bad_packing_rejected(self):
        a=self.array([.2]); a.encoding['scale_factor']=.01
        with self.assertRaises(RuntimeError): nwm.saturation_percent(a)
    def test_out_of_range_rejected(self):
        for v in [-.01, 1.01, np.nan]:
            with self.assertRaises(RuntimeError): nwm.saturation_percent(self.array([v]))
    def test_valid_time_and_initialization(self):
        d=xr.Dataset(coords={'time':[np.datetime64('2026-10-19T00:00:00')]},attrs={'model_output_valid_time':'2026-10-19_00:00:00','model_initialization_time':'2026-10-18_21:00:00'})
        t=datetime(2026,10,19,tzinfo=timezone.utc)
        self.assertEqual(nwm.validate_source_time(d,t),'2026-10-18T21:00:00Z')
        d.attrs['model_output_valid_time']='2026-10-19_01:00:00'
        with self.assertRaises(RuntimeError): nwm.validate_source_time(d,t)
        d.attrs['model_output_valid_time']='2026-10-19_00:00:00'
        d=d.assign_coords(time=[np.datetime64('2026-10-19T01:00:00')])
        with self.assertRaises(RuntimeError): nwm.validate_source_time(d,t)
    def test_failure_preserves_image_and_source_age(self):
        with tempfile.TemporaryDirectory() as temp:
            png=Path(temp)/'map.png'; meta=Path(temp)/'meta.json'
            png.write_bytes(b'original'); original={'image_crs':'EPSG:3857','valid_time_iso':'2026-10-19T00:00:00Z','retrieved_time':'2026-10-19T01:00:00Z'}
            meta.write_text(json.dumps(original))
            with patch.object(nwm,'OUTPUT_PNG',png), patch.object(nwm,'OUTPUT_JSON',meta), patch.object(nwm,'download_latest_nwm',side_effect=RuntimeError('test')):
                self.assertEqual(nwm.main(),1)
            self.assertEqual(png.read_bytes(),b'original')
            result=json.loads(meta.read_text())
            for key in original: self.assertEqual(result[key],original[key])
            self.assertEqual(result['update_status'],'failed_retained')

if __name__=='__main__': unittest.main()
