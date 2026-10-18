#!/usr/bin/env python3
"""Download fixed-date H7 Florida follow-up inputs into /tmp/h7-florida."""
from datetime import datetime, timezone
import requests, pathlib, concurrent.futures, hashlib,json
out=pathlib.Path('/tmp/h7-florida');out.mkdir(exist_ok=True)
base='https://nssrgeo.ndc.nasa.gov/SPoRT/modeling/lis/conus3km/geotiff/rsm_0-10cm/'
urls=[('qpe.grib2.gz','https://mrms.ncep.noaa.gov/2D/MultiSensor_QPE_24H_Pass2/MRMS_MultiSensor_QPE_24H_Pass2_00.00_20261018-000000.grib2.gz')]+[(f'{d}.tif',base+f'{d}_0000_sport_lis_rsm0-10cm_conus3km_float_wgs84.tif') for d in ['20261016','20261017','20261018']]
def get(pair):
 name,url=pair
 try:
  r=requests.get(url,timeout=35);r.raise_for_status();(out/name).write_bytes(r.content)
  return dict(retrieved_at=datetime.now(timezone.utc).isoformat(),name=name,url=url,bytes=len(r.content),sha256=hashlib.sha256(r.content).hexdigest(),modified=r.headers.get('Last-Modified'))
 except Exception as e:return dict(name=name,url=url,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: result=list(pool.map(get,urls))
(out/'fetch.json').write_text(json.dumps(result,indent=2)); print(json.dumps(result,indent=2))
