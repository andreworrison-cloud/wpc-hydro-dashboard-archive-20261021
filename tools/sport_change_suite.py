"""H7 signed SPoRT change ingest. Review-only; no scheduler or publishing side effects."""
import hashlib
import json
import os
import re
import shutil
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import reproject, calculate_default_transform, transform_bounds, Resampling
from rasterio.transform import array_bounds, Affine
from PIL import Image
from fetch_sport import build_session
from tools.sport_rsm_suite import atomic_json, digest, iso, parse

BASE='https://nssrgeo.ndc.nasa.gov/SPoRT/modeling/lis/conus3km/geotiff'
REVISION='sport-change-v1'
POLICY={'warn_age_hours':48,'expire_age_hours':72,'status':'approved_h7_policy_v1'}
PRODUCTS={'shallow24h':(10,1,'derived_endpoint_difference'), 'deep7day':(200,7,'NASA_native_change'), 'deep14day':(200,14,'NASA_native_change')}
FIELDS={'shallow':'rsm0-10cm','deep7day':'rsm0-2m_diff7day','deep14day':'rsm0-2m_diff14day'}
COLORS=np.array([[111,59,22,235],[152,84,31,235],[189,121,62,235],[216,170,114,235],[236,211,174,235],[246,245,238,190],[204,233,238,235],[148,205,220,235],[85,168,198,235],[38,123,168,235],[18,84,121,235]],dtype=np.uint8)
EDGES=np.array([-100,-20,-10,-5,-2,-1,1,2,5,10,20,100])

def filename(date,key):return f'{date}_0000_sport_lis_{FIELDS[key]}_conus3km_float_wgs84.tif'
def folder(key):return FIELDS[key].replace('rsm','rsm_',1)
def url(date,key):return f'{BASE}/{folder(key)}/{filename(date,key)}'
def inventory(html,key):return set(re.findall(r'(\d{8})_0000_sport_lis_'+re.escape(FIELDS[key])+r'_conus3km_float_wgs84\.tif',html))
def freshness(active,now):
    if not active:return {'usable':False,'status':'unavailable'}
    age=(now-parse(active['valid_time'])).total_seconds()/3600
    return {'age_hours':round(age,2),'usable':0<=age<72,'status':'future' if age<0 else 'expired' if age>=72 else 'aging' if age>=48 else 'available'}

def read_source(path,state=False):
    with rasterio.open(path) as ds:
        if ds.count!=1 or ds.crs!=rasterio.crs.CRS.from_epsg(4326) or ds.dtypes[0] not in ('float32','float64'):raise ValueError('Unexpected source band, dtype or CRS')
        if ds.shape!=(929,1929) or not np.allclose(ds.bounds,[-124.94,25.06,-67.07,52.93],atol=1e-5,rtol=0):raise ValueError('Unexpected grid')
        if tuple(ds.scales)!=(1.0,) or tuple(ds.offsets)!=(0.0,):raise ValueError('Unexpected scale or offset')
        data=ds.read(1);valid=np.isfinite(data)&(ds.read_masks(1)>0)&(data!=9999)
        if ds.nodata is not None:valid &= data!=ds.nodata
        if np.any(valid&((data< (0 if state else -100.0001))|(data>100.0001))):raise ValueError('Unexpected numeric range')
        count=int(valid.sum())
        if abs(count-1290511)>12905:raise ValueError('Coverage differs by more than 1% from audited baseline')
        if state:data=np.minimum(data,100.0) # only float roundoff; substantive excursions rejected above
        data=np.where(valid,data,np.nan)
        return data,ds.transform,{'shape':list(ds.shape),'valid_cells':count,'min':float(np.nanmin(data)),'max':float(np.nanmax(data))}

def difference(end,start):
    if not np.array_equal(np.isfinite(end),np.isfinite(start)):raise ValueError('Endpoint coverage masks differ')
    return end-start

def rgba(data):
    valid=np.isfinite(data)&(data>=-100.0001)&(data<=100.0001)
    out=np.zeros(data.shape+(4,),dtype=np.uint8)
    out[valid]=COLORS[np.searchsorted(EDGES[1:-1],data[valid],side='right')]
    return out

def render(data,src_transform,path):
    h,w=data.shape;bounds=array_bounds(h,w,src_transform)
    dst,width,height=calculate_default_transform('EPSG:4326','EPSG:3857',w,h,*bounds)
    scale=max(width,height)/4000;ow,oh=round(width/scale),round(height/scale)
    if (ow,oh)!=(4000,2538):raise ValueError('Unexpected display aspect ratio')
    dst=dst*Affine.scale(width/ow,height/oh)
    values=np.full((oh,ow),np.nan,dtype='float32');mask=np.zeros((oh,ow),dtype='uint8')
    common=dict(src_transform=src_transform,src_crs='EPSG:4326',dst_transform=dst,dst_crs='EPSG:3857',num_threads=2)
    reproject(data,values,src_nodata=np.nan,dst_nodata=np.nan,resampling=Resampling.bilinear,**common)
    reproject(np.isfinite(data).astype('uint8'),mask,src_nodata=0,dst_nodata=0,resampling=Resampling.nearest,**common)
    values[mask==0]=np.nan
    Image.fromarray(rgba(values)).save(path,optimize=True)
    west,south,east,north=transform_bounds('EPSG:3857','EPSG:4326',*array_bounds(oh,ow,dst),densify_pts=21)
    return {'width':ow,'height':oh,'crs':'EPSG:3857','bounds':[[south,west],[north,east]],'resampling':'bilinear','mask_resampling':'nearest','palette':REVISION}

def verify(root,active):
    if not active or set(active.get('products',{}))!=set(PRODUCTS):raise ValueError('Incomplete change suite')
    gen=active['generation']
    if not re.fullmatch(r'\d{8}-[a-f0-9]{20}-sport-change-v1',gen):raise ValueError('Unsafe generation')
    for key,(depth,days,origin) in PRODUCTS.items():
        p=active['products'][key]
        if p['depth_cm']!=[0,depth] or p['valid_time']!=active['valid_time'] or parse(p['valid_time'])-parse(p['start_time'])!=timedelta(days=days) or p['origin']!=origin:raise ValueError('Product period/provenance mismatch')
        asset=p['image'];expected=f'generations/{gen}/{key}.png'
        if asset['path']!=expected or not re.fullmatch('[a-f0-9]{64}',asset['sha256']) or digest(root/expected)!=asset['sha256']:raise ValueError('Missing or corrupt image')
    return True

def download(session,date,key,path):
    with session.get(url(date,key),stream=True,timeout=(20,180)) as response:
        response.raise_for_status()
        with path.open('wb') as f:
            for chunk in response.iter_content(1024*1024):f.write(chunk)
        return {'url':url(date,key),'valid_time':iso(datetime.strptime(date,'%Y%m%d').replace(tzinfo=timezone.utc)), 'retrieved_at':iso(datetime.now(timezone.utc)), 'http_modified_at':response.headers.get('Last-Modified'), 'etag':response.headers.get('ETag'),'sha256':digest(path),'filename':path.name}

def check_revision(session,source):
    # Compare post-download validators after ALL endpoints have been fetched.
    # Missing validators or failed HEAD require a second full-content checksum.
    try:
        r=session.head(source['url'],timeout=(20,60));r.raise_for_status()
        keys=[('etag','ETag'),('http_modified_at','Last-Modified')]
        if source.get('etag') and r.headers.get('ETag'):
            if any(source.get(k) and r.headers.get(h) and source[k]!=r.headers[h] for k,h in keys):raise ValueError('Source revised during paired retrieval')
            return 'post_download_http_validators'
    except ValueError:raise
    except Exception:pass
    r=session.get(source['url'],timeout=(20,180));r.raise_for_status()
    if hashlib.sha256(r.content).hexdigest()!=source['sha256']:raise ValueError('Source revised during paired retrieval')
    return 'post_download_sha256'

def cache_sources(root,stage,sources,now):
    # Hash-addressed versions: local retention only until durable publishing is qualified.
    cache=root/'numeric-cache';cache.mkdir(exist_ok=True)
    index_path=cache/'index.json'
    try:index=json.loads(index_path.read_text())
    except FileNotFoundError:index={}
    for source in sources:
        sha=source['sha256'];target=cache/(sha+'.tif')
        if not target.exists():shutil.copyfile(stage/source['filename'],target)
        if digest(target)!=sha:raise ValueError('Numeric cache checksum failure')
        index[sha]={**source,'last_verified_at':iso(now)}
    # Keep each observed version >=21 days after last verification, including old baselines.
    for sha,entry in list(index.items()):
        if parse(entry['last_verified_at'])<now-timedelta(days=21):
            (cache/(sha+'.tif')).unlink(missing_ok=True);del index[sha]
    atomic_json(index_path,index)

def ingest(root,source_dir=None,date=None,now=None,session=None):
    root=Path(root);root.mkdir(parents=True,exist_ok=True);(root/'generations').mkdir(exist_ok=True)
    now=now or datetime.now(timezone.utc);pointer=root/'metadata.json';previous=None;ok=False;error=None
    if pointer.exists():
        try:previous=json.loads(pointer.read_text())['active'];verify(root,previous)
        except Exception:previous=None
    active=previous;state='unavailable';attempt_sources=[]
    try:
        session=session or build_session()
        if not source_dir:
            inv={}
            for key in FIELDS:
                r=session.get(f'{BASE}/{folder(key)}/',timeout=(20,90));r.raise_for_status();inv[key]=inventory(r.text,key)
                if not inv[key]:raise ValueError('No exact dated float inventory for '+key)
            date=max(max(dates) for dates in inv.values())
            if not all(date in dates for dates in inv.values()):raise ValueError('Newest suite incomplete')
        if not date or not re.fullmatch(r'\d{8}',date):raise ValueError('Expected YYYYMMDD date')
        end=datetime.strptime(date,'%Y%m%d').replace(tzinfo=timezone.utc);prior=(end-timedelta(days=1)).strftime('%Y%m%d')
        if not freshness({'valid_time':iso(end)},now)['usable']:raise ValueError('Candidate future or expired')
        if previous and end<parse(previous['valid_time']):raise ValueError('Regressing valid time')
        if not source_dir and prior not in inv['shallow']:raise ValueError('Exact 24-hour baseline missing; no nearest-date substitution')
        with tempfile.TemporaryDirectory(prefix='.stage-',dir=root) as tmp:
            stage=Path(tmp);inputs={};grid=None;sources={}
            for key,day,kind in [('start',prior,'shallow'),('end',date,'shallow'),('deep7day',date,'deep7day'),('deep14day',date,'deep14day')]:
                path=stage/filename(day,kind)
                print(f'H7: fetching {key} {day}',flush=True)
                if source_dir:
                    shutil.copyfile(Path(source_dir)/path.name,path)
                    source={'url':url(day,kind),'valid_time':iso(datetime.strptime(day,'%Y%m%d').replace(tzinfo=timezone.utc)),'sha256':digest(path),'filename':path.name,'http_modified_at':None,'etag':None,'retrieved_at':None}
                else:source=download(session,day,kind,path)
                data,tr,coverage=read_source(path,state=kind=='shallow');source['coverage']=coverage
                if grid is not None and tr!=grid:raise ValueError('Source grids differ')
                grid=tr;inputs[key]=data;sources[key]=source
            for source in sources.values():source['revision_check']='offline' if source_dir else check_revision(session,source)
            attempt_sources=list(sources.values())
            fields={'shallow24h':difference(inputs['end'],inputs['start']),'deep7day':inputs['deep7day'],'deep14day':inputs['deep14day']}
            for field in fields.values():
                if not np.array_equal(np.isfinite(field),np.isfinite(fields['shallow24h'])):raise ValueError('Product coverage masks differ')
            token=hashlib.sha256(''.join(sources[k]['sha256'] for k in sorted(sources)).encode()).hexdigest()[:20]
            generation=f'{date}-{token}-{REVISION}'
            cache_sources(root,stage,attempt_sources,now)
            if previous and generation==previous['generation']:state='unchanged'
            else:
                products={}
                for key,(depth,days,origin) in PRODUCTS.items():
                    image=stage/(key+'.png');asset=render(fields[key],grid,image)
                    asset.update(path=f'generations/{generation}/{key}.png',sha256=digest(image))
                    vals=fields[key][np.isfinite(fields[key])]
                    products[key]={'depth_cm':[0,depth],'start_time':iso(end-timedelta(days=days)),'valid_time':iso(end),'origin':origin,'secondary_context':key=='deep14day','sources':[sources['start'],sources['end']] if key=='shallow24h' else [sources[key]],'image':asset,'coverage':{'valid_cells':int(vals.size),'min_pp':float(vals.min()),'max_pp':float(vals.max())}}
                active={'generation':generation,'valid_time':iso(end),'accepted_at':iso(now),'quantity':'relative_soil_moisture_change','units':'percentage_points','render_revision':REVISION,'products':products,'retrieval_mode':'offline_review' if source_dir else 'live'}
                # Public generations contain only images. Numeric versions live in separate cache.
                for path in stage.glob('*.tif'):path.unlink()
                target=root/'generations'/generation
                if not target.exists():os.replace(stage,target)
                verify(root,active);state='updated'
            ok=True
    except Exception as exc:
        active=previous;error=str(exc);state='retained' if active else 'unavailable';print('H7: '+error,flush=True)
    status=freshness(active,now)
    if active and not status['usable']:state='expired'
    result={'schema_version':1,'state':state,'usable':status['usable'],'policy':POLICY,'freshness':status,'last_attempt':{'at':iso(now),'ok':ok,'error':error,'sources':attempt_sources},'active':active}
    atomic_json(pointer,result);print('H7: '+state,flush=True)
    return 0 if ok else 1

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--suite-dir',type=Path,required=True);p.add_argument('--source-dir',type=Path);p.add_argument('--date');a=p.parse_args()
    raise SystemExit(ingest(a.suite_dir,a.source_dir,a.date))
