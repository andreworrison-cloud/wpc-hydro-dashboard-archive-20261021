#!/usr/bin/env python3
"""Florida H7 consistency check; python tools/check_h7_florida.py --cache /tmp/h7-florida.
Inputs: 20261016/17/18.tif; qpe.grib2.gz; fetch.json from fetch_h7_florida.py.
Outputs are review-only. Requires numpy, rasterio, matplotlib.
"""
import argparse,json,gzip,hashlib
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
import rasterio
from rasterio.warp import reproject,Resampling
from rasterio.features import rasterize
from rasterio.windows import from_bounds,Window
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap,BoundaryNorm
from matplotlib.collections import LineCollection
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'review/h7'
p=argparse.ArgumentParser();p.add_argument('--cache',type=Path,default=Path('/tmp/h7-florida'));args=p.parse_args();cache=args.cache
fetch=json.loads((cache/'fetch.json').read_text());audit=json.loads((out/'numerical.json').read_text())
for src in fetch:
 assert 'error' not in src,src
 assert hashlib.sha256((cache/src['name']).read_bytes()).hexdigest()==src['sha256']
revisions={}
arrays=[]
for date in ['20261016','20261017','20261018']:
 with rasterio.open(cache/f'{date}.tif') as d:
  a=d.read(1);a=np.where(np.isfinite(a)&(a>=0)&(a<=100.0001),a,np.nan)
  if arrays:assert d.transform==tr and d.shape==shape and d.crs==crs
  tr,shape,crs=d.transform,d.shape,d.crs
  arrays.append(a)
 revisions[date]=next(x['sha256'] for x in fetch if x['name']==f'{date}.tif')==audit['sources'][f'rsm_0-10cm/{date}']['sha256']
prior,start,end=arrays;delta=end-start
(cache/'qpe.grib2').write_bytes(gzip.decompress((cache/'qpe.grib2.gz').read_bytes()))
# Restrict numerical processing to Florida and a generous coastal buffer.
w=from_bounds(-88,24,-79,32,tr).round_offsets().round_lengths();w=w.intersection(Window(0,0,shape[1],shape[0]));r0,c0=int(w.row_off),int(w.col_off);nr,nc=int(w.height),int(w.width)
rt=rasterio.windows.transform(w,tr);region=(slice(r0,r0+nr),slice(c0,c0+nc))
with rasterio.open(cache/'qpe.grib2') as q:
 tags=q.tags(1)
 assert tags['GRIB_ELEMENT']=='MultiSensor_QPE_24H_Pass2' and tags['GRIB_UNIT']=='[mm]'
 valid_time=datetime.fromtimestamp(int(tags['GRIB_VALID_TIME']),timezone.utc)
 assert valid_time.isoformat()=='2026-10-18T00:00:00+00:00'
 qw=from_bounds(-89,23,-78,33,q.transform).round_offsets().round_lengths();qa=q.read(1,window=qw);qt=q.window_transform(qw);qcrs=q.crs
 qa=np.where(np.isfinite(qa)&(qa>=0),qa,np.nan)
 qmean=np.full((nr,nc),np.nan);qnearest=qmean.copy();coverage=np.zeros((nr,nc),dtype='float32')
 for dst,res in [(qmean,Resampling.average),(qnearest,Resampling.nearest)]:
  reproject(qa,dst,src_transform=qt,src_crs=qcrs,src_nodata=np.nan,dst_transform=rt,dst_crs=crs,dst_nodata=np.nan,resampling=res)
 reproject(np.isfinite(qa).astype('float32'),coverage,src_transform=qt,src_crs=qcrs,dst_transform=rt,dst_crs=crs,resampling=Resampling.average)
 qshape=q.shape;qtransform=list(q.transform)
states=json.loads((ROOT/'review/vendor/us-states.json').read_text());fl=next(f for f in states['features'] if f['properties']['name']=='Florida')
land=rasterize([(fl['geometry'],1)],out_shape=(nr,nc),transform=rt).astype(bool)
lat=rt.f+(np.arange(nr)+.5)*rt.e;lon=rt.c+(np.arange(nc)+.5)*rt.a
s,e,change,previous=[x[region] for x in [start,end,delta,start-prior]]
valid=land&np.isfinite(change)&np.isfinite(qmean)&(coverage>=.99)
def stats(mask):
 x=qmean[mask];y=change[mask]
 return {'cells':int(mask.sum()),'pearson_r':float(np.corrcoef(x,y)[0,1]),'median_qpe_mm':float(np.median(x)),'median_change_pp':float(np.median(y)),'wetting_gt_1pp_fraction':float(np.mean(y>1)),'drying_lt_minus1pp_fraction':float(np.mean(y < -1))}
summary={'checked_at':datetime.now(timezone.utc).isoformat(),'window_start':'2026-10-17T00:00:00Z','window_end':'2026-10-18T00:00:00Z','sources':fetch,'rsm_hashes_match_review':revisions,'qpe_grib_tags':tags,'qpe_grid_shape':qshape,'qpe_transform':qtransform,'method':'MRMS nonnegative QPE averaged onto native RSM cells; require >=99% valid QPE coverage; Florida polygon pixel-center mask; unweighted descriptive cell statistics, not independent validation or causal attribution','florida':stats(valid),'south_florida_south_of_28N':stats(valid&(lat[:,None]<28)),'qpe_bins':[]}
for lo,hi in [(0,1),(1,5),(5,10),(10,25),(25,50),(50,1000)]:
 m=valid&(qmean>=lo)&(qmean<hi)
 if m.any():summary['qpe_bins'].append(dict(lower_mm=lo,upper_mm=hi,**stats(m)))
summary['extremes']=[]
for label,fn in [('drying',np.nanargmin),('wetting',np.nanargmax)]:
 r,c=np.unravel_index(fn(delta),delta.shape);rr,cc=r-r0,c-c0
 patch=(slice(max(0,rr-1),rr+2),slice(max(0,cc-1),cc+2));xx,yy=rasterio.transform.xy(tr,r,c)
 summary['extremes'].append({'label':label,'lon':xx,'lat':yy,'start_rsm_percent':float(s[rr,cc]),'end_rsm_percent':float(e[rr,cc]),'change_pp':float(change[rr,cc]),'previous_24h_change_pp':float(previous[rr,cc]),'qpe_cell_mean_mm':float(qmean[rr,cc]),'qpe_nearest_mm':float(qnearest[rr,cc]),'qpe_coverage_fraction':float(coverage[rr,cc]),'neighbor_3x3_median_qpe_mm':float(np.nanmedian(qmean[patch])),'neighbor_3x3_median_change_pp':float(np.nanmedian(change[patch]))})
(out/'florida_check.json').write_text(json.dumps(summary,indent=2)+'\n')
# Plot native RSM grid and native MRMS grid with the same geographical viewport.
colors=['#6f3b16','#98541f','#bd793e','#d8aa72','#ecd3ae','#f6f5ee','#cce9ee','#94cddc','#55a8c6','#267ba8','#125479'];levels=[-100,-20,-10,-5,-2,-1,1,2,5,10,20,100]
change_cmap=ListedColormap(colors);change_cmap.set_bad('#e3e7eb');change_norm=BoundaryNorm(levels,len(colors))
qlevels=[0,1,5,10,25,50,75,100,150,250];qcolors=['#f6f5ee','#d9f0d3','#a6dba0','#5aae61','#1b7837','#80b9db','#2879b9','#7041a6','#be2865'];qcmap=ListedColormap(qcolors);qcmap.set_bad('#e3e7eb');qnorm=BoundaryNorm(qlevels,len(qcolors))
scmap=plt.get_cmap('YlGnBu').copy();scmap.set_bad('#e3e7eb')
lines=[]
for f in states['features']:
 geom=f['geometry'];polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
 for poly in polys:
  lines.extend(np.array(ring) for ring in poly)
fig,axes=plt.subplots(2,2,figsize=(16,10.152),dpi=250);fig.subplots_adjust(left=.05,right=.94,top=.88,bottom=.1,hspace=.21,wspace=.22)
extent=[rt.c,rt.c+nc*rt.a,rt.f+nr*rt.e,rt.f];qextent=[qt.c,qt.c+qa.shape[1]*qt.a,qt.f+qa.shape[0]*qt.e,qt.f]
for ax,a,ext,cmap,norm,title,label in [
 (axes[0,0],qa,qextent,qcmap,qnorm,'MRMS 24-hour rainfall · Pass 2','Rainfall (mm)'),
 (axes[0,1],change,extent,change_cmap,change_norm,'Shallow RSM change · 0–10 cm','Change (percentage points)'),
 (axes[1,0],s,extent,scmap,plt.Normalize(0,100),'Starting shallow RSM · 17 Oct 00Z','RSM (%)'),
 (axes[1,1],e,extent,scmap,plt.Normalize(0,100),'Ending shallow RSM · 18 Oct 00Z','RSM (%)')]:
 im=ax.imshow(a,extent=ext,origin='upper',cmap=cmap,norm=norm,interpolation='nearest',aspect=1/np.cos(np.deg2rad(27)))
 ax.add_collection(LineCollection(lines,colors='#485965',linewidths=.65));ax.set_xlim(-83, -79.8);ax.set_ylim(25.06,28.4);ax.set_title(title,fontsize=13,pad=8)
 ax.set_facecolor('#e3e7eb');ax.tick_params(labelsize=9);ax.set_xlabel('Longitude',fontsize=9);ax.set_ylabel('Latitude',fontsize=9)
 for point in summary['extremes']:
  ax.plot(point['lon'],point['lat'],marker='o',ms=6,mfc='none',mec='#111111',mew=1);ax.annotate('D' if point['label']=='drying' else 'W',(point['lon'],point['lat']),xytext=(7,2),textcoords='offset points',fontsize=11,weight='bold')
 cb=fig.colorbar(im,ax=ax,fraction=.035,pad=.025);cb.set_label(label,fontsize=10);cb.ax.tick_params(labelsize=8)
 if norm==change_norm:cb.set_ticks([-20,-10,-5,-2,-1,1,2,5,10,20])
fig.suptitle('Florida rainfall and shallow soil-moisture response',fontsize=23,weight='bold',y=.975,color='#142c3b')
fig.text(.5,.927,'Matched window: 17 October 2026 00Z → 18 October 2026 00Z',ha='center',fontsize=14)
fig.text(.05,.045,'D / W = strongest drying / wetting cells. Native grids shown without display smoothing; gray = masked / unavailable.',fontsize=11)
fig.text(.05,.022,'Consistency check only: rainfall and modeled soil-moisture change are different quantities. Numerical comparisons use grid-cell mean QPE.',fontsize=10)
fig.savefig(out/'florida_rainfall_rsm.png',dpi=250);plt.close(fig)
print(json.dumps({k:summary[k] for k in ['rsm_hashes_match_review','florida','south_florida_south_of_28N','qpe_bins','extremes']},indent=2))
