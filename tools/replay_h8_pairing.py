#!/usr/bin/env python3
"""Offline full-grid regression using hash-verified prior H8 source generations.
Simulates delayed Pass 2 and forbids all FFG discovery after first pairing.
"""
import argparse,copy,json,hashlib
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import ingest_h8_review as ingest

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--fixture-root',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);args=p.parse_args()
 if args.output_dir.exists():raise ValueError('Use a new output directory for a complete first-pair replay')
 args.output_dir.mkdir(parents=True)
 fixtures={}
 for number in (1,2):
  m=json.loads((args.fixture_root/f'pass{number}/metadata.json').read_text())
  ingest.verify_generation(args.fixture_root/f'pass{number}',m);fixtures[number]=m
 one=fixtures[1];end=one['qpe_end']
 assert fixtures[2]['qpe_end']==end and fixtures[2]['ffg']['sha256']==one['ffg']['sha256']
 data={}
 for number,m in fixtures.items():
  folder=args.fixture_root/f'pass{number}/generations'/m['generation']
  for h in ingest.HOURS:
   source=m['products'][str(h)]['qpe_source'];data[source['url']]=((folder/f'qpe_{h}h.grib2.gz').read_bytes(),source)
 ffg_path=args.fixture_root/'pass1/generations'/one['generation']/'ffg.g2'
 data[one['ffg']['url']]=(ffg_path.read_bytes(),one['ffg'])
 stage=0;ffg_requests=[]
 def fetch(url):
  if url.startswith(ingest.WPC):
   ffg_requests.append(dict(stage=stage,url=url))
   if stage:raise AssertionError('Late FFG discovery must not occur for frozen window')
  if url==ingest.WPC:return ('<a href="'+one['ffg']['url'].rsplit('/',1)[-1]+'">FFG</a>').encode(),{}
  raw,meta=data[url]
  assert hashlib.sha256(raw).hexdigest()==meta['sha256']
  return raw,copy.deepcopy(meta)
 def inventory(product,root):
  number=int(product[-1]);h=int(product.split('_')[2][:-1]);source=fixtures[number]['products'][str(h)]['qpe_source']
  rows=[] if stage==0 and number==2 else [dict(end=end,filename=source['url'].rsplit('/',1)[-1])]
  return dict(product=product,rows=rows)
 options=SimpleNamespace(output_dir=args.output_dir,historical_end=end)
 with patch.object(ingest,'fetch',fetch),patch.object(ingest,'inventory',inventory):
  with ingest.writer_lock(args.output_dir):ingest.run(options)
  first=json.loads((args.output_dir/'attempt.json').read_text())
  assert first['pass2']['state']=='waiting_for_paired_window'
  p1before=json.loads((args.output_dir/'pass1/metadata.json').read_text())
  stage=1
  with ingest.writer_lock(args.output_dir):ingest.run(options)
 after={n:json.loads((args.output_dir/f'pass{n}/metadata.json').read_text()) for n in (1,2)}
 assert after[1]==p1before
 assert after[1]['ffg']==after[2]['ffg'] and after[1]['paired_at']==after[2]['paired_at']
 for n,m in after.items():
  for asset in m['files']:
   if asset['path'].endswith('.tif'):
    old=next(a for a in fixtures[n]['files'] if a['path']==asset['path'])
    assert asset['sha256']==old['sha256'],asset['path']
 result=dict(result='passed',mode='offline full-grid replay of recorded source bytes; availability is simulated',qpe_end=end,first_pass2_status=first['pass2']['state'],ffg_requests=ffg_requests,pass1_unchanged=True,shared_ffg_and_pairing_time=True,all_24_derived_tiff_hashes_match=True,generations={str(n):m['generation'] for n,m in after.items()})
 (args.output_dir/'replay_result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':main()
