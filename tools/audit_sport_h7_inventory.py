import urllib.request,re,json,concurrent.futures,argparse,hashlib
from pathlib import Path
from datetime import datetime,timedelta,timezone
parser=argparse.ArgumentParser();parser.add_argument('--output',default='review/h7/inventory.json');args=parser.parse_args()
base='https://nssrgeo.ndc.nasa.gov/SPoRT/modeling/lis/conus3km/geotiff/'
root_html=urllib.request.urlopen(base,timeout=45).read().decode()
root_folders=sorted(set(re.findall(r"href='([^'./]+)'",root_html)))
folders=['rsm_0-10cm','rsm_0-2m','rsm_0-2m_diff7day','rsm_0-2m_diff14day']
def get(f):
 s=urllib.request.urlopen(base+f+'/',timeout=45).read().decode();Path('/tmp/h7_'+f+'.html').write_text(s)
 names=sorted(set(re.findall(r'href=[\'\"]([^\'\"]+\.tif)[\'\"]',s)))
 floats=[n for n in names if '_float_wgs84.tif' in n]
 dates=sorted(set(n[:8] for n in floats));times=sorted(set(n[9:13] for n in floats))
 missing=[]
 if dates:
  d=datetime.strptime(dates[0],'%Y%m%d');end=datetime.strptime(dates[-1],'%Y%m%d')
  while d<=end:
   if d.strftime('%Y%m%d') not in dates:missing.append(d.strftime('%Y%m%d'))
   d+=timedelta(days=1)
 rows=re.findall(r"<a href='([^']+)'[^>]*>.*?</a></td>\s*<td class='m'>([^<]+)</td>",s)
 modified={n:' '.join(t.split()) for n,t in rows if n in floats}
 lags=[(datetime.strptime(t,'%Y-%b-%d %H:%M:%S')-datetime.strptime(n[:8]+n[9:13],'%Y%m%d%H%M')).total_seconds()/3600 for n,t in modified.items()]
 result={'listing_sha256':hashlib.sha256(s.encode()).hexdigest(),'directory_modified_utc':modified,'modified_minus_valid_hours_range':[min(lags),max(lags)] if lags else None,'url':base+f+'/','files':floats,'count':len(floats),'first':dates[0] if dates else None,'latest':dates[-1] if dates else None,'cycles':times,'missing_dates':missing,'examples':names[-4:]}
 print(f,json.dumps({k:v for k,v in result.items() if k not in ('files','directory_modified_utc')}),flush=True)
 return f,result
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:results=dict(ex.map(get,folders))
Path(args.output).parent.mkdir(parents=True,exist_ok=True)
Path(args.output).write_text(json.dumps({'checked_at':datetime.now(timezone.utc).isoformat(),'root_url':base,'root_folders':root_folders,'root_listing_sha256':hashlib.sha256(root_html.encode()).hexdigest(),'sources':results},indent=2))
