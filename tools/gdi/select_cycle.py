import datetime as dt,concurrent.futures,json,argparse,pathlib
from sources import HRRRSource

def choose_cycle(now,lookback=6,source_factory=None,providers=('aws','nomads')):
 now=now.astimezone(dt.timezone.utc);top=now.replace(minute=0,second=0,microsecond=0);attempts=[]
 for age in range(lookback+1):
  cycle=(top-dt.timedelta(hours=age)).strftime('%Y%m%d%H');source=(source_factory or (lambda c:HRRRSource(c,'run/provider_cache',providers=providers,product='prs')))(cycle)
  try:
   with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(source.preflight,range(7)))
   attempts.append({'cycle':cycle,'status':'inventory_ready','hours':rows})
   return {'selected_cycle':cycle,'status':'provisional_until_full_decode','checked_at':now.isoformat(),'attempts':attempts}
  except Exception as e:attempts.append({'cycle':cycle,'status':'not_selected','reason':str(e)})
 return {'selected_cycle':None,'status':'no_complete_candidate_keep_last_good','checked_at':now.isoformat(),'attempts':attempts}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--now');p.add_argument('--output',default='pipeline/cycle_selection.json');a=p.parse_args()
 now=dt.datetime.fromisoformat(a.now) if a.now else dt.datetime.now(dt.timezone.utc)
 if now.tzinfo is None:raise ValueError('Use a timezone-aware --now')
 r=choose_cycle(now);pathlib.Path(a.output).write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
