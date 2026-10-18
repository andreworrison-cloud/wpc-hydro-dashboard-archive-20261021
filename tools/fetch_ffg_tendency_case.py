import requests,concurrent.futures,hashlib,json
from pathlib import Path
from datetime import datetime,timezone
out=Path('/tmp/ffg-tendency-case');out.mkdir(exist_ok=True)
def get(h):
 name=f'MRMS_MultiSensor_QPE_24H_Pass2_00.00_20261018-{h:02}0000.grib2.gz';url='https://mrms.ncep.noaa.gov/2D/MultiSensor_QPE_24H_Pass2/'+name
 r=requests.get(url,timeout=50);r.raise_for_status();(out/name).write_bytes(r.content)
 return {'name':name,'url':url,'sha256':hashlib.sha256(r.content).hexdigest(),'retrieved_at':datetime.now(timezone.utc).isoformat(),'last_modified':r.headers.get('Last-Modified')}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: rows=list(pool.map(get,[7,19]))
(out/'fetch.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
