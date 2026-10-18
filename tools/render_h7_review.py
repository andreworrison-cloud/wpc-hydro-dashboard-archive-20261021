#!/usr/bin/env python3
"""Reproduce H7 audit-date review from hash-verified native float TIFFs.
Usage: python tools/render_h7_review.py --cache /tmp/h7-tiffs
Requires numpy, rasterio, matplotlib, pillow. No production publishing.
"""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, transform_bounds, transform
from rasterio.transform import from_bounds
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap, BoundaryNorm
from matplotlib.collections import LineCollection

ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(); p.add_argument('--cache',type=Path,default=Path('/tmp/h7-tiffs')); args=p.parse_args()
out=ROOT/'review/h7'; audit=json.loads((out/'numerical.json').read_text())
states_path=ROOT/'review/vendor/us-states.json'
states=json.loads(states_path.read_text())
records={}
def read(key):
    s=audit['sources'][key]; path=args.cache/s['url'].split('/')[-1]
    assert hashlib.sha256(path.read_bytes()).hexdigest()==s['sha256'],f'Revision mismatch: {key}'
    with rasterio.open(path) as ds:
        a=ds.read(1); grid=(ds.transform,ds.crs,ds.bounds)
    valid=np.isfinite(a)&(a!=9999)&(np.abs(a)<=100.0001)
    records[key]={'url':s['url'],'sha256':s['sha256']}
    return np.where(valid,a,np.nan),grid
end,grid=read('rsm_0-10cm/20261018'); start,g=read('rsm_0-10cm/20261017'); assert grid==g
shallow=end-start
seven,g=read('rsm_0-2m_diff7day/20261018'); assert grid==g
fourteen,g=read('rsm_0-2m_diff14day/20261018'); assert grid==g
bounds=transform_bounds(grid[1],'EPSG:3857',*grid[2]); dst_transform=from_bounds(*bounds,4000,2538)
colors=['#6f3b16','#98541f','#bd793e','#d8aa72','#ecd3ae','#f6f5ee','#cce9ee','#94cddc','#55a8c6','#267ba8','#125479']
levels=[-100,-20,-10,-5,-2,-1,1,2,5,10,20,100]
cmap=ListedColormap(colors); cmap.set_bad('#e3e7eb'); norm=BoundaryNorm(levels,len(colors))
lines=[]
for feature in states['features']:
    geom=feature['geometry']; polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
    for poly in polys:
        for ring in poly:
            xy=np.array(ring); x,y=transform('EPSG:4326','EPSG:3857',xy[:,0],xy[:,1]); lines.append(np.column_stack([x,y]))
def project(a):
    result=np.full((2538,4000),np.nan,dtype='float32'); mask=np.zeros(result.shape,dtype='uint8')
    reproject(a,result,src_transform=grid[0],src_crs=grid[1],src_nodata=np.nan,dst_transform=dst_transform,dst_crs='EPSG:3857',dst_nodata=np.nan,resampling=Resampling.bilinear)
    reproject(np.isfinite(a).astype('uint8'),mask,src_transform=grid[0],src_crs=grid[1],dst_transform=dst_transform,dst_crs='EPSG:3857',resampling=Resampling.nearest)
    result[mask==0]=np.nan
    return result
metadata={'valid_end':'2026-10-18T00:00:00Z','audit_snapshot':audit['checked_at'],'output_pixels':[4000,2538],'projection':'EPSG:3857','resampling':'bilinear values; nearest mask','legend_edges_pp':levels,'legend_colors':colors,'near_zero_bin':'-1 to +1 pp','missing':'gray','sources':records,'boundary_sha256':hashlib.sha256(states_path.read_bytes()).hexdigest(),'products':{}}
for slug,a,title,begin,provenance in [
 ('shallow_24h',shallow,'24-hour shallow RSM change · 0–10 cm','17 Oct 2026','Derived: exact-date NASA SPoRT RSM endpoint subtraction'),
 ('deep_7day',seven,'7-day deep RSM change · 0–200 cm','11 Oct 2026','NASA SPoRT native 7-day change product'),
 ('deep_14day',fourteen,'14-day deep RSM change · 0–200 cm','04 Oct 2026','NASA SPoRT native 14-day change product · Secondary context')]:
    projected=project(a)
    fig=plt.figure(figsize=(16,10.152),dpi=250,facecolor='white')
    ax=fig.add_axes([.035,.20,.93,.68]); ax.set_facecolor('#e3e7eb')
    im=ax.imshow(projected,extent=[bounds[0],bounds[2],bounds[1],bounds[3]],origin='upper',cmap=cmap,norm=norm,interpolation='nearest')
    ax.add_collection(LineCollection(lines,colors='#45545e',linewidths=.38)); ax.set_xlim(bounds[0],bounds[2]); ax.set_ylim(bounds[1],bounds[3]); ax.set_axis_off()
    fig.text(.055,.955,title,size=23,weight='bold',color='#142c3b')
    fig.text(.055,.918,f'{begin} 00Z → 18 Oct 2026 00Z',size=15,color='#45545e')
    cb=fig.colorbar(im,cax=fig.add_axes([.15,.13,.70,.025]),orientation='horizontal',ticks=[-20,-10,-5,-2,-1,1,2,5,10,20],spacing='uniform',extend='both')
    cb.ax.tick_params(labelsize=11); cb.set_label('RSM change (percentage points)     ← Drying                         Wetting →',size=12,labelpad=10)
    fig.text(.055,.050,provenance,size=11,color='#45545e')
    fig.text(.055,.025,'REVIEW SNAPSHOT · Gray = unavailable / masked · Ivory = −1 to +1 pp · Display interpolation adds no native detail',size=10,color='#45545e')
    fig.savefig(out/f'{slug}.png',dpi=250); plt.close(fig)
    vals=a[np.isfinite(a)]; metadata['products'][slug]={'start':begin+' 00Z','end':'18 Oct 2026 00Z','provenance':provenance,'min_pp':float(vals.min()),'max_pp':float(vals.max()),'valid_cells':int(vals.size)}

# Native-cell diagnostics, with exact state values at extremes. No rain attribution.
fig,axes=plt.subplots(1,2,figsize=(16,6),dpi=200)
extremes=[]
for ax,kind,func in zip(axes,['Strongest drying','Strongest wetting'],[np.nanargmin,np.nanargmax]):
    row,col=np.unravel_index(func(shallow),shallow.shape); lon,lat=rasterio.transform.xy(grid[0],row,col)
    a=project(shallow); bb=transform_bounds('EPSG:4326','EPSG:3857',lon-3,lat-2,lon+3,lat+2)
    ax.imshow(a,extent=[bounds[0],bounds[2],bounds[1],bounds[3]],origin='upper',cmap=cmap,norm=norm,interpolation='nearest')
    ax.add_collection(LineCollection(lines,colors='#45545e',linewidths=.8)); x,y=transform('EPSG:4326','EPSG:3857',[lon],[lat]); ax.plot(x,y,'+',color='black',ms=12)
    ax.set_xlim(bb[0],bb[2]); ax.set_ylim(bb[1],bb[3]); ax.set_axis_off()
    ax.set_title(f'{kind}: {shallow[row,col]:+.2f} pp\n{lat:.3f}° N, {abs(lon):.3f}° W',fontsize=13)
    extremes.append({'kind':kind,'latitude':lat,'longitude':lon,'start_rsm_percent':float(start[row,col]),'end_rsm_percent':float(end[row,col]),'change_pp':float(shallow[row,col])})
fig.suptitle('24-hour shallow-change diagnostics · 17–18 Oct 2026, 00Z',fontsize=17)
fig.text(.07,.035,'Same signed palette as national maps. Crosses mark native-cell extrema. Rainfall consistency remains unverified.',fontsize=11)
fig.savefig(out/'shallow_extremes.png'); plt.close(fig)
metadata['shallow_extremes']=extremes
(out/'map_review.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(extremes,indent=2))
