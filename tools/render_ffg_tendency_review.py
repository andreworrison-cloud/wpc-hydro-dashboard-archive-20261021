#!/usr/bin/env python3
"""Frozen FFG tendency review: exact hash-verified hourly endpoints, no publishing."""
import argparse, json, hashlib, gzip, base64
from pathlib import Path
from datetime import datetime
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, transform_bounds, transform
from rasterio.transform import from_bounds
from rasterio.windows import from_bounds as window_bounds
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap, BoundaryNorm
from matplotlib.collections import LineCollection
from PIL import Image
from probe_rfc_ffg_numeric import band_contract, checked_array
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--cache',type=Path,default=Path('/tmp/ffg-tendency-source'));p.add_argument('--rain-cache',type=Path,default=Path('/tmp/ffg-tendency-case'));args=p.parse_args()
out=ROOT/'review/ffg-tendency';audit=json.loads((out/'audit.json').read_text());states=json.loads((ROOT/'review/vendor/us-states.json').read_text())
fields={};native_grid=None

def read(name):
 global native_grid
 if name in fields:return fields[name]
 path=args.cache/name;source=audit['sources'][name]
 assert hashlib.sha256(path.read_bytes()).hexdigest()==source['source']['sha256'],name
 with rasterio.open(path) as ds:
  grid=(ds.transform,ds.crs,ds.shape)
  if native_grid is None:native_grid=grid
  assert grid==native_grid
  a={}
  for b in ds.indexes:
   h,ref,end=band_contract(ds.tags(b))
   if h in (1,3,6):a[h]=checked_array(ds.read(b,masked=True)).filled(np.nan).astype('float32')
 assert set(a)=={1,3,6}
 fields[name]=a;return a

levels=[-8,-2,-1,-.5,-.25,-.01,.01,.25,.5,1,2,8]
colors=['#08306b','#08519c','#2171b5','#6baed6','#c6dbef','#f5f4ef','#f6dfba','#e8b66b','#ca8639','#9b591e','#65350f']
cmap=ListedColormap(colors);cmap.set_bad('#e3e7eb');norm=BoundaryNorm(levels,len(colors))
geo_bounds=(-126,24,-66,50);bounds=transform_bounds('EPSG:4326','EPSG:3857',*geo_bounds);dst=from_bounds(*bounds,4000,2538)
lines=[];geo_lines=[]
for f in states['features']:
 g=f['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
 for poly in polys:
  for ring in poly:
   xy=np.array(ring);geo_lines.append(xy);x,y=transform('EPSG:4326','EPSG:3857',xy[:,0],xy[:,1]);lines.append(np.column_stack([x,y]))
def project(a,bb=bounds,shape=(2538,4000),crs='EPSG:3857',method=Resampling.bilinear):
 t=from_bounds(*bb,shape[1],shape[0]);z=np.full(shape,np.nan,dtype='float32');mask=np.zeros(shape,dtype='uint8')
 reproject(a,z,src_transform=native_grid[0],src_crs=native_grid[1],src_nodata=np.nan,dst_transform=t,dst_crs=crs,dst_nodata=np.nan,resampling=method)
 reproject(np.isfinite(a).astype('uint8'),mask,src_transform=native_grid[0],src_crs=native_grid[1],dst_transform=t,dst_crs=crs,resampling=Resampling.nearest)
 z[mask==0]=np.nan;return z
metadata={'status':'Frozen review only; not an operational product','projection':'EPSG:3857','pixels':[4000,2538],'bounds_wsen':geo_bounds,'resampling':'Native subtraction, bilinear display values with nearest paired-valid mask','units':'inches','legend_edges':levels,'legend_colors':colors,'neutral_interval_inches':[-.01,.01],'products':{}}
overlays={}
for lag in (6,12,24):
 c=audit['comparisons'][f'{lag}h'];new,old=read(c['new']),read(c['old'])
 for h in (1,3,6):
  # Subtract millimeters before conversion, matching the numerical audit.
  delta=(new[h]-old[h])/25.4
  a=project(delta);slug=f'ffg_{h}h_change_{lag}h';rgba=cmap(norm(np.nan_to_num(a)));rgba[~np.isfinite(a),3]=0
  Image.fromarray((rgba*255).astype('uint8')).save(out/f'{slug}_overlay.png',optimize=True)
  overlays[f'{h}/{lag}']='data:image/png;base64,'+base64.b64encode((out/f'{slug}_overlay.png').read_bytes()).decode()
  fig=plt.figure(figsize=(16,10.152),dpi=250,facecolor='white');ax=fig.add_axes([.025,.20,.95,.67]);ax.set_facecolor('#e3e7eb')
  im=ax.imshow(a,extent=[bounds[0],bounds[2],bounds[1],bounds[3]],origin='upper',cmap=cmap,norm=norm,interpolation='nearest')
  ax.add_collection(LineCollection(lines,colors='#45545e',linewidths=.38));ax.set_xlim(bounds[0],bounds[2]);ax.set_ylim(bounds[1],bounds[3]);ax.set_axis_off()
  begin=datetime.fromisoformat(audit['sources'][c['old']]['snapshot_filename_time']);end=datetime.fromisoformat(audit['sources'][c['new']]['snapshot_filename_time'])
  fig.text(.05,.95,f'{lag}-hour FFG tendency · {h}-hour rainfall duration',size=23,weight='bold',color='#142c3b')
  fig.text(.05,.91,f'Snapshots: {begin:%d %b %Y %HZ} → {end:%d %b %Y %HZ}',size=14,color='#45545e')
  cb=fig.colorbar(im,cax=fig.add_axes([.12,.125,.76,.025]),orientation='horizontal',ticks=levels[1:-1],spacing='uniform',extend='both');cb.ax.tick_params(labelsize=10)
  cb.set_label('FFG change (inches)     ← Lower guidance                         Higher guidance →',size=12,labelpad=9)
  fig.text(.05,.048,'Derived from RFC-issued guidance in WPC hourly mosaics · Current minus earlier guidance',size=11,color='#45545e')
  fig.text(.05,.023,'FROZEN REVIEW · Ivory: ±0.01 inch · Gray: unavailable · Mosaic time does not establish each RFC’s issuance time',size=10,color='#45545e')
  fig.savefig(out/f'{slug}.png');plt.close(fig)
  paired=np.isfinite(delta);expected=c['bands'][str(h)]['paired_cells'];assert int(paired.sum())==expected
  metadata['products'][slug]={'duration_hours':h,'lookback_hours':lag,'new':c['new'],'old':c['old'],'paired_cells':int(paired.sum()),'min_inches':float(np.nanmin(delta)),'max_inches':float(np.nanmax(delta)),'neutral_fraction':float((np.abs(delta[paired])<=.01).mean())}
  print('Rendered',slug,flush=True)
# Case comparison: native fields remapped nearest for display; QPE averaged only for statistics.
a=read('5kmffg_2026101806.g2')[3]/25.4;b=read('5kmffg_2026101807.g2')[3]/25.4;change=(read('5kmffg_2026101807.g2')[3]-read('5kmffg_2026101806.g2')[3])/25.4
r,c=audit['largest_24h_drop_trace']['grid_row_col'];lon,lat=audit['largest_24h_drop_trace']['lonlat']
rows=json.loads((args.rain_cache/'fetch.json').read_text());qpes={};qmeta=[]
for source in rows:
 path=args.rain_cache/source['name'];assert hashlib.sha256(path.read_bytes()).hexdigest()==source['sha256']
 unpacked=path.with_suffix('');unpacked.write_bytes(gzip.decompress(path.read_bytes()))
 with rasterio.open(unpacked) as q:
  tags=q.tags(1);assert tags['GRIB_ELEMENT']=='MultiSensor_QPE_24H_Pass2' and tags['GRIB_UNIT']=='[mm]'
  when=datetime.fromtimestamp(int(tags['GRIB_VALID_TIME']),__import__('datetime').timezone.utc)
  assert when.strftime('%Y%m%d-%H%M%S') in source['name']
  w=window_bounds(-85,35,-75,44,q.transform).round_offsets().round_lengths();qa=q.read(1,window=w,masked=True).filled(np.nan);qa=np.where(qa>=0,qa,np.nan);qt=q.window_transform(w)
  target=np.full(native_grid[2],np.nan,dtype='float32');coverage=np.zeros(native_grid[2],dtype='float32')
  reproject(qa,target,src_transform=qt,src_crs=q.crs,src_nodata=np.nan,dst_transform=native_grid[0],dst_crs=native_grid[1],dst_nodata=np.nan,resampling=Resampling.average)
  reproject(np.isfinite(qa).astype('float32'),coverage,src_transform=qt,src_crs=q.crs,dst_transform=native_grid[0],dst_crs=native_grid[1],resampling=Resampling.average)
  target[coverage<.99]=np.nan;qpes[when.hour]=(target,qa,qt)
  qmeta.append(dict(source,grib_tags=tags,point_mean_mm=float(target[r,c]),point_coverage=float(coverage[r,c])))
# Regional statistics use pixel centers and include only matched valid coverage.
rr,cc=np.indices(native_grid[2]);tr=native_grid[0];x=tr.c+(cc+.5)*tr.a+(rr+.5)*tr.b;y=tr.f+(cc+.5)*tr.d+(rr+.5)*tr.e
lo,la=transform(native_grid[1],'EPSG:4326',x.ravel(),y.ravel());lo=np.array(lo).reshape(rr.shape);la=np.array(la).reshape(rr.shape)
region=(lo>=-82)&(lo<=-78)&(la>=37)&(la<=41);large=region&(change<=-1)&np.isfinite(qpes[7][0]);vals=qpes[7][0][large]
case={'point_lonlat':[lon,lat],'ffg_duration_hours':3,'jump_start':'2026-10-18T06:00:00Z','jump_end':'2026-10-18T07:00:00Z','before_inches':float(a[r,c]),'after_inches':float(b[r,c]),'difference_inches':float(change[r,c]),'qpe_sources':qmeta,'regional_box_wsen':[-82,37,-78,41],'regional_decreases_ge_1inch':{'cells_with_qualified_qpe':int(large.sum()),'qpe_24h_end07_mm_quantiles':np.quantile(vals,[0,.5,.95,1]).tolist() if vals.size else [],'fraction_under_1mm':float((vals<1).mean()) if vals.size else None},'interpretation':'Rainfall consistency check, not causal attribution. FFG mosaic transition verified; individual RFC issuance/revision cause not established.'}
(out/'case_verification.json').write_text(json.dumps(case,indent=2)+'\n')
bb=(-83,36.5,-76.5,42);extent=[bb[0],bb[2],bb[1],bb[3]];sc=plt.get_cmap('YlGnBu').copy();sc.set_bad('#e3e7eb');qc=plt.get_cmap('YlGnBu').copy();qc.set_bad('#e3e7eb')
fig,axes=plt.subplots(2,2,figsize=(16,10.152),dpi=250);fig.subplots_adjust(left=.06,right=.94,top=.87,bottom=.1,wspace=.25,hspace=.25)
for ax,field,cm,nm,title,label in [(axes[0,0],a,sc,plt.Normalize(0,12),'Before · 18 October 06Z','3-hour FFG (inches)'),(axes[0,1],b,sc,plt.Normalize(0,12),'After · 18 October 07Z','3-hour FFG (inches)'),(axes[1,0],change,cmap,norm,'Guidance change · 06Z → 07Z','FFG change (inches)'),(axes[1,1],qpes[7][0],qc,plt.Normalize(0,50),'Prior 24-hour MRMS rainfall · ending 07Z','Pass 2 rainfall (mm)')]:
 z=project(field,bb,(700,850),'EPSG:4326',Resampling.nearest);im=ax.imshow(z,extent=extent,origin='upper',cmap=cm,norm=nm,interpolation='nearest',aspect=1/np.cos(np.deg2rad(39)))
 ax.add_collection(LineCollection(geo_lines,colors='#45545e',linewidths=.65));ax.set_xlim(bb[0],bb[2]);ax.set_ylim(bb[1],bb[3]);ax.plot(lon,lat,'+',color='#d7191c',ms=11,mew=1.5);ax.set_title(title,size=12);ax.tick_params(labelsize=9)
 cb=fig.colorbar(im,ax=ax,fraction=.035,pad=.025);cb.set_label(label,size=9);cb.ax.tick_params(labelsize=8)
 if cm==cmap:cb.set_ticks([-2,-1,-.5,-.01,.01,.5,1,2])
fig.suptitle('Northern West Virginia · abrupt guidance change',fontsize=22,weight='bold',y=.97,color='#142c3b');fig.text(.5,.92,f'Marked cell: {a[r,c]:.2f} → {b[r,c]:.2f} inches of 3-hour FFG',ha='center',size=14)
fig.text(.05,.045,'Cross marks the audited cell. Rainfall averaged onto FFG cells with ≥99% valid coverage; no missing-value zero filling.',size=10)
fig.text(.05,.022,'Native FFG differences; nearest-neighbor case display. A guidance change alone does not establish soil wetting or its cause.',size=10)
fig.savefig(out/'wv_case.png');plt.close(fig)
# Standalone interactive review: all nine transparent overlays and state borders embedded.
css=(ROOT/'review/vendor/leaflet-1.9.4.css').read_text();js=(ROOT/'review/vendor/leaflet-1.9.4.js').read_text()
html='''<!doctype html><html><head><meta charset="utf-8"><title>FFG tendency review</title><style>LEAFCSS
body{margin:0;font:15px system-ui;color:#142c3b}header{padding:16px 22px}h1{font-size:22px;margin:0 0 10px}select{padding:8px;margin-right:20px}#map{height:70vh;background:#e3e7eb}footer{padding:14px 22px}.legend{display:flex;max-width:900px}.bin{flex:1;height:17px}.labels{display:flex;justify-content:space-between;max-width:900px;font-size:12px}p{margin:8px 0}</style></head><body><header><h1>FFG tendency · frozen review</h1><label>Rainfall duration <select id="duration"><option>1</option><option selected>3</option><option>6</option></select></label><label>Change interval <select id="lag"><option>6</option><option>12</option><option selected>24</option></select> hours</label><div id="times"></div></header><div id="map"></div><footer><div class="legend" id="legend"></div><div class="labels"><span>Lower guidance ←</span><span>Ivory: ±0.01 inch</span><span>→ Higher guidance</span></div><p>Bins (inches): &lt;−2 | −2 to −1 | −1 to −0.5 | −0.5 to −0.25 | −0.25 to −0.01 | ±0.01 | 0.01 to 0.25 | 0.25 to 0.5 | 0.5 to 1 | 1 to 2 | &gt;2</p><p>Current minus earlier RFC-issued guidance in WPC mosaics. Transparent gaps are unavailable, not zero change.</p><p>Snapshot times do not establish individual RFC issuance times. Review only; not live.</p></footer><script>LEAFJS</script><script>const data=PAYLOAD;
const map=L.map('map').setView([38,-96],4);let overlay;map.createPane('states');map.getPane('states').style.zIndex=650;L.geoJSON(data.states,{style:{color:'#45545e',weight:1,fill:false},pane:'states'}).addTo(map);function show(){let h=document.getElementById('duration').value,l=document.getElementById('lag').value;if(overlay)map.removeLayer(overlay);overlay=L.imageOverlay(data.images[h+'/'+l],[[24,-126],[50,-66]],{opacity:.9,zIndex:0}).addTo(map);document.getElementById('times').textContent='18 Oct 2026 19Z minus '+({'6':'18 Oct 13Z','12':'18 Oct 07Z','24':'17 Oct 19Z'}[l])+' · '+h+'-hour FFG';}for(let id of ['duration','lag'])document.getElementById(id).onchange=show;data.colors.forEach(c=>{let d=document.createElement('div');d.className='bin';d.style.background=c;document.getElementById('legend').appendChild(d)});show();</script></body></html>'''
html=html.replace('LEAFCSS',css).replace('LEAFJS',js).replace('PAYLOAD',json.dumps({'images':overlays,'states':states,'colors':colors}).replace('<','\\u003c'))
(out/'ffg_tendency_review.html').write_text(html)
metadata['case']=case;metadata['source_audit_sha256']=hashlib.sha256((out/'audit.json').read_bytes()).hexdigest();(out/'map_review.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(case,indent=2),flush=True)
