"""Read-only H7 audit; run inventory audit first. No production publication."""
import json,hashlib,concurrent.futures,argparse
from pathlib import Path
from datetime import datetime,timedelta,timezone
import requests,numpy as np,rasterio
p=argparse.ArgumentParser();p.add_argument('--inventory',default='review/h7/inventory.json');p.add_argument('--output',default='review/h7/numerical.json');p.add_argument('--prior-provenance',default=None);p.add_argument('--cache',default='/tmp/h7-tiffs');args=p.parse_args()
inv=json.loads(Path(args.inventory).read_text())['sources'];cache=Path(args.cache);cache.mkdir(exist_ok=True)
latest=min(max(n[:8] for n in x['files']) for x in inv.values());end=datetime.strptime(latest,'%Y%m%d');ends=[end-timedelta(days=1),end];wanted=set()
for e in ends:
 for lag in [0,1]:wanted.add(('rsm_0-10cm',(e-timedelta(days=lag)).strftime('%Y%m%d')))
 for lag in [0,7,14]:wanted.add(('rsm_0-2m',(e-timedelta(days=lag)).strftime('%Y%m%d')))
 for lag in [7,14]:wanted.add((f'rsm_0-2m_diff{lag}day',e.strftime('%Y%m%d')))
def download(pair):
 folder,date=pair;names=[n for n in inv[folder]['files'] if n.startswith(date+'_0000_')]
 if len(names)!=1:raise ValueError('Missing exact source '+str(pair))
 name=names[0];url=inv[folder]['url']+name;path=cache/name
 response=requests.get(url,timeout=(20,120));response.raise_for_status();path.write_bytes(response.content)
 with rasterio.open(path) as ds:
  raw=ds.read(1).astype('float64');valid=np.isfinite(raw)&(ds.read_masks(1)>0)&(raw!=9999)
  if ds.nodata is not None:valid &= raw!=ds.nodata
  change='diff' in folder;limit=100.0001
  if np.any(valid&((raw < (-limit if change else 0))|(raw>limit))):raise ValueError('Unexpected range')
  if ds.count!=1 or ds.dtypes[0] not in ('float32','float64'):raise ValueError('Not numerical single-band float')
  a=np.where(valid,np.clip(raw,-100 if change else 0,100),np.nan)
  grid={'shape':list(a.shape),'crs':str(ds.crs),'transform':list(ds.transform),'bounds':list(ds.bounds)}
  meta={'url':url,'sha256':hashlib.sha256(response.content).hexdigest(),'bytes':len(response.content),'http_modified':response.headers.get('Last-Modified'),'etag':response.headers.get('ETag'),'retrieved_at':datetime.now(timezone.utc).isoformat(),'grid':grid,'dtype':ds.dtypes[0],'nodata':ds.nodata,'tags':ds.tags(),'band_tags':ds.tags(1),'scales':ds.scales,'offsets':ds.offsets,'valid_cells':int(valid.sum()),'min':float(raw[valid].min()),'max':float(raw[valid].max()),'roundoff_clamped_cells':int(np.count_nonzero(valid&(raw>100)))}
 print('validated',folder,date,meta['valid_cells'],flush=True)
 return pair,(a,valid,meta)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:data=dict(ex.map(download,sorted(wanted)))
comparisons=[]
for e in ends:
 date=e.strftime('%Y%m%d')
 for folder,lags in [('rsm_0-10cm',[1]),('rsm_0-2m',[7,14])]:
  a,ma,am=data[folder,date]
  for lag in lags:
   prior=(e-timedelta(days=lag)).strftime('%Y%m%d');b,mb,bm=data[folder,prior]
   if am['grid']!=bm['grid']:raise ValueError('Grid mismatch')
   mask=ma&mb;delta=a-b
   c={'depth':folder,'end':date+'T0000Z','start':prior+'T0000Z','duration_hours':lag*24,'units':'percentage_points','common_cells':int(mask.sum()),'mask_changed_cells':int(np.count_nonzero(ma!=mb)),'change_quantiles':dict(zip(['min','p01','p50','p99','max'],map(float,np.percentile(delta[mask],[0,1,50,99,100])))),'wetting_gt_1pp_cells':int(np.count_nonzero(mask&(delta>1))),'drying_lt_minus1pp_cells':int(np.count_nonzero(mask&(delta< -1)))}
   if folder=='rsm_0-2m':
    native,mn,nm=data[f'rsm_0-2m_diff{lag}day',date]
    if am['grid']!=nm['grid']:raise ValueError('Native change grid mismatch')
    common=mask&mn;error=native[common]-delta[common]
    c.update(native_comparison_cells=int(common.sum()),native_mask_difference_cells=int(np.count_nonzero(mn!=mask)),native_minus_derived_max_abs_pp=float(abs(error).max()),native_minus_derived_mean_abs_pp=float(abs(error).mean()),native_agree_within_0_001pp_fraction=float(np.mean(abs(error)<=.001)),native_range=[float(native[mn].min()),float(native[mn].max())])
   comparisons.append(c)
report={'checked_at':datetime.now(timezone.utc).isoformat(),'latest_common_date':latest,'scope':'16-day listings; numerical checks for latest two endpoints and exact prior days','sources':{f'{k[0]}/{k[1]}':v[2] for k,v in data.items()},'comparisons':comparisons}
if args.prior_provenance:
 prior=json.loads(Path(args.prior_provenance).read_text())['active'];date=prior['valid_time'][:10].replace('-','');report['same_date_revision_checks']=[]
 for depth,folder in [('10','rsm_0-10cm'),('200','rsm_0-2m')]:
  if (folder,date) in data:
   old=prior['products'][depth];new=data[folder,date][2];report['same_date_revision_checks'].append({'folder':folder,'date':date,'prior_sha256':old['source']['sha256'],'current_sha256':new['sha256'],'bytes_changed':old['source']['sha256']!=new['sha256'],'prior_modified':old['http_modified_at'],'current_modified':new['http_modified'],'caveat':'Byte revision confirmed; prior numerical arrays were not compared.'})
Path(args.output).parent.mkdir(parents=True,exist_ok=True)
Path(args.output).write_text(json.dumps(report,indent=2,allow_nan=False)+'\n');print(json.dumps(comparisons,indent=2),flush=True)
