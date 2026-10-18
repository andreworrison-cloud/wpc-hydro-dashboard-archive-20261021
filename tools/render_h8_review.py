#!/usr/bin/env python3
"""Render immutable H8 review generations; nearest display sampling after science."""
import argparse,json,sys
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import transform,transform_bounds,reproject,Resampling
from rasterio.transform import from_bounds
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap,BoundaryNorm
from matplotlib.collections import LineCollection
sys.path.insert(0,str(Path(__file__).resolve().parent))
from ingest_h8_review import verify_generation
ROOT=Path(__file__).resolve().parents[1]
COLORS=['#fafcfc','#dceef7','#99cee6','#48acbe','#72b76c','#e5d760','#f6a44b','#e85a46','#b53569','#713c91','#3e235f']
EDGES=[0,.1,.25,.5,.75,1,1.5,2,3,5,10,1000]
def main():
 p=argparse.ArgumentParser();p.add_argument('--input-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--region',choices=['conus','florida','peak'],default='florida');p.add_argument('--pass-number',type=int,choices=[1,2],default=1);args=p.parse_args()
 base=args.input_dir/f'pass{args.pass_number}';m=json.loads((base/'metadata.json').read_text());verify_generation(base,m);folder=base/'generations'/m['generation'];out=args.output_dir;out.mkdir(parents=True,exist_ok=True)
 bounds=(-126,24,-66,50) if args.region=='conus' else (-84,24.7,-79.5,29)
 if args.region=='peak':
  point=m['products']['3'];x,y=point['fine_peak_lon'],point['fine_peak_lat'];bounds=(x-3,y-2,x+3,y+2)
 merc=transform_bounds('EPSG:4326','EPSG:3857',*bounds);tr=from_bounds(*merc,1200,740)
 states=json.loads((ROOT/'review/vendor/us-states.json').read_text());lines=[]
 for feat in states['features']:
  g=feat['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
  for poly in polys:
   for ring in poly:
    xs,ys=transform('EPSG:4326','EPSG:3857',*[list(x) for x in zip(*ring)]);lines.append(np.column_stack((xs,ys)))
 cmap=ListedColormap(COLORS);cmap.set_bad('#d9e0e5');norm=BoundaryNorm(EDGES,len(COLORS))
 fig,axs=plt.subplots(2,3,figsize=(16,10.152),dpi=250);fig.patch.set_facecolor('#f3f6f8');fig.subplots_adjust(left=.06,right=.98,top=.85,bottom=.18,hspace=.18,wspace=.045)
 stats={}
 for col,h in enumerate((1,3,6)):
  stats[str(h)]={}
  for row,name in enumerate(('fine_ratio','coarse_ratio')):
   path=folder/m['products'][str(h)]['assets'][name]['path']
   with rasterio.open(path) as d:
    dest=np.full((740,1200),np.nan,dtype='float32');reproject(rasterio.band(d,1),dest,src_transform=d.transform,src_crs=d.crs,src_nodata=np.nan,dst_transform=tr,dst_crs='EPSG:3857',dst_nodata=np.nan,resampling=Resampling.nearest)
    # Native-grid regional maximum, independent of screen resampling.
    from rasterio.windows import from_bounds as win_bounds, Window
    native_bounds=transform_bounds('EPSG:4326',d.crs,*bounds,densify_pts=41);w=win_bounds(*native_bounds,d.transform).round_offsets().round_lengths().intersection(Window(0,0,d.width,d.height));a=d.read(1,window=w);rr,cc=np.where(np.isfinite(a));xs,ys=rasterio.transform.xy(d.window_transform(w),rr,cc);lon,lat=transform(d.crs,'EPSG:4326',xs,ys);lon=np.asarray(lon);lat=np.asarray(lat);inside=(lon>=bounds[0])&(lon<=bounds[2])&(lat>=bounds[1])&(lat<=bounds[3]);values=a[rr[inside],cc[inside]]
    stats[str(h)][name]={'regional_max_ratio':float(values.max()) if values.size else None,'native_valid_cells':int(values.size)}
   ax=axs[row,col];ax.imshow(dest,extent=[merc[0],merc[2],merc[1],merc[3]],origin='upper',cmap=cmap,norm=norm,interpolation='nearest');ax.add_collection(LineCollection(lines,colors='#4c5e6a',linewidths=.55));ax.set_xlim(merc[0],merc[2]);ax.set_ylim(merc[1],merc[3]);ax.set_xticks([]);ax.set_yticks([])
   for spine in ax.spines.values():spine.set_color('#aebcc6')
   maximum=stats[str(h)][name]['regional_max_ratio'];ax.text(.025,.035,f'Regional peak: {maximum*100:.0f}% of FFG',transform=ax.transAxes,fontsize=10,bbox=dict(facecolor='white',alpha=.9,edgecolor='none',pad=4))
   if row==0:ax.set_title(f'{h}-hour rainfall / {h}-hour FFG',fontsize=14,pad=10,color='#193747')
  axs[0,col].text(.5,1.01,m['products'][str(h)]['window_start'][11:16]+'–'+m['qpe_end'][11:16]+' UTC',transform=axs[0,col].transAxes,ha='center',fontsize=9,color='#536977')
 fig.text(.03,.68,'Fine-scale QPE\nNative FFG assigned\nby nearest neighbor',rotation=90,ha='center',va='center',fontsize=12,color='#17394b')
 fig.text(.03,.36,'QPE averaged\nonto native FFG cells',rotation=90,ha='center',va='center',fontsize=12,color='#17394b')
 title={'florida':'Florida rainfall structure and FFG comparison','conus':'CONUS rainfall structure and FFG comparison','peak':'Regional rainfall structure and FFG comparison'}[args.region]
 fig.suptitle(title,fontsize=22,weight='bold',y=.97,color='#17394b')
 fig.text(.5,.92,f'MRMS multi-sensor Pass {args.pass_number}  •  Rainfall ending {m["qpe_end"][:10]} {m["qpe_end"][11:16]} UTC',ha='center',fontsize=13)
 fig.text(.5,.885,f'FFG snapshot {m["ffg"]["snapshot_time"][11:16]} UTC; reference cycle {m["ffg_reference"][11:16]} UTC  |  Retrospective review—not a live hazard product',ha='center',fontsize=10,color='#536977')
 cbax=fig.add_axes([.20,.115,.65,.022]);cb=fig.colorbar(plt.cm.ScalarMappable(norm=norm,cmap=cmap),cax=cbax,orientation='horizontal',spacing='uniform');cb.set_ticks(EDGES[:-1]);cb.set_ticklabels(['0','10','25','50','75','100','150','200','300','500','1000']);cb.ax.tick_params(labelsize=9);cb.set_label('Observed rainfall as percent of selected FFG (%)',fontsize=11)
 fig.text(.06,.049,'Gray = unavailable. Both methods use the same rainfall window and FFG source. Fine display does not create finer FFG information.',fontsize=10,color='#344e60')
 fig.text(.06,.022,'Scientific ratios are calculated before display reprojection. State borders included; nearest display sampling preserves spatial differences.',fontsize=10,color='#344e60')
 name=f'{args.region}_pass{args.pass_number}_comparison';fig.savefig(out/(name+'.png'),dpi=250);plt.close(fig)
 (out/(name+'.json')).write_text(json.dumps(dict(generation=m['generation'],pass_number=args.pass_number,bounds=bounds,statistics=stats),indent=2)+'\n');print(json.dumps(stats),flush=True)
if __name__=='__main__':main()
