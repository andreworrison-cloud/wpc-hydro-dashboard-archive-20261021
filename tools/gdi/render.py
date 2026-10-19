"""Display-only nearest-neighbor reprojection; native fields are never smoothed."""
import argparse, datetime as dt, hashlib, json, pathlib
import numpy as np
from pyproj import CRS, Transformer
from PIL import Image
from contours import contour_image,CONTOUR_STYLE
from matplotlib.colors import to_rgba

COLORS=['#323232','#646464','#737373','#7e7e7e','#909090','#a3a3a3','#bcbcbc','#bbc7cb','#b2d2dd','#5acf28','#bad411','#ffcc00','#ffa900','#fc8106','#eb4722','#d8133a','#990a1d','#770022']
COVERAGE=['#142d41','#205269','#267991','#359fa4','#62c6b4','#a5debd','#e5efa6']
WIDTH,HEIGHT=2400,1360
BOUNDS=[[24,-125],[50,-66]]

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def render(decoded, public, cycle):
    decoded,public=pathlib.Path(decoded),pathlib.Path(public)
    markers=[json.loads((decoded/f'F{h:02d}_DONE.json').read_text()) for h in range(7)]
    stamp=dt.datetime.strptime(cycle,'%Y%m%d%H').replace(tzinfo=dt.timezone.utc)
    for h,m in enumerate(markers):
        if m['cycle']!=stamp.isoformat() or m['forecast_hour']!=h or m['recipe']!='pressure_terrain_v1' or m['output_sha256']!=sha(decoded/f'F{h:02d}.npz'):raise ValueError('Incomplete or inconsistent decoded cycle')
    digest=hashlib.sha256(CONTOUR_STYLE.encode()+json.dumps(markers,sort_keys=True).encode()).hexdigest()[:12]
    generation=f'{cycle}-{digest}-v1';dest=public/'generations'/generation;dest.mkdir(parents=True,exist_ok=True)
    grid=np.load(decoded/'grid.npz');lat,lon=grid['latitude'],grid['longitude']
    # HRRR spherical Lambert projection. Fit array index to projected coordinates,
    # then reject any grid that does not fit to much better than one native cell.
    native=CRS.from_proj4('+proj=lcc +lat_1=38.5 +lat_2=38.5 +lat_0=38.5 +lon_0=-97.5 +R=6371229 +units=m')
    project=Transformer.from_crs('EPSG:4326',native,always_xy=True)
    gx,gy=project.transform(lon,lat);ny,nx=lat.shape
    iy,ix=np.mgrid[:ny,:nx];sel=(slice(None,None,50),slice(None,None,50))
    design=np.column_stack([gx[sel].ravel(),gy[sel].ravel(),np.ones(gx[sel].size)])
    coeff=np.linalg.lstsq(design,np.column_stack([ix[sel].ravel(),iy[sel].ravel()]),rcond=None)[0]
    if np.max(np.abs(design@coeff-np.column_stack([ix[sel].ravel(),iy[sel].ravel()])))>0.01:raise ValueError('Unrecognized HRRR projection')
    merc=Transformer.from_crs(4326,3857,always_xy=True);west,south=merc.transform(-125,24);east,north=merc.transform(-66,50)
    mx,my=np.meshgrid(west+(np.arange(WIDTH)+.5)*(east-west)/WIDTH,north-(np.arange(HEIGHT)+.5)*(north-south)/HEIGHT)
    px,py=Transformer.from_crs(3857,native,always_xy=True).transform(mx,my)
    xx=np.rint(px*coeff[0,0]+py*coeff[1,0]+coeff[2,0]).astype(int);yy=np.rint(px*coeff[0,1]+py*coeff[1,1]+coeff[2,1]).astype(int)
    inside=(xx>=0)&(xx<nx)&(yy>=0)&(yy<ny);xx=np.clip(xx,0,nx-1);yy=np.clip(yy,0,ny-1)
    def sample(a):return np.where(inside,a[yy,xx],np.nan)
    assets={}
    def save(name,a,palette,edges,labels=False):
        a=sample(a);valid=np.isfinite(a)
        if labels:
            im=contour_image(a,range(-30,81,10))
        else:
            rgba=np.array([[round(v*255) for v in to_rgba(c)] for c in palette],dtype=np.uint8)
            idx=np.clip(np.searchsorted(edges,np.nan_to_num(a,nan=-999),side='right')-1,0,len(palette)-1)
            pixels=rgba[idx];pixels[~valid]=0;im=Image.fromarray(pixels)
        path=dest/(name+'.png');im.save(path,optimize=True)
        assets[name]={'path':str(path.relative_to(public)),'sha256':sha(path)}
    stack=[]
    for h in range(7):
        with np.load(decoded/f'F{h:02d}.npz') as f:
            a=f['jose_gfs_baseline__native'];stack.append(a)
            save(f'gdi_{h}',a,COLORS,np.arange(-30,60,5));save(f'numbers_{h}',a,COLORS,[],True)
            for threshold in (30,40,50):save(f'coverage{threshold}_{h}',f[f'jose_gfs_baseline__support_ge{threshold}']*100,COVERAGE,np.linspace(0,100,7))
    stack=np.stack(stack);complete=np.isfinite(stack).all(axis=0)
    for threshold in (30,40,50):
        yes=stack>=threshold;count=yes.sum(axis=0);run=np.zeros(count.shape,dtype=np.uint8);longest=run.copy()
        for frame in yes:run=np.where(frame,run+1,0);longest=np.maximum(longest,run)
        for name,a in [('persistence',count),('longest',longest)]:save(f'{name}{threshold}',np.where(complete,a,np.nan),['#142d41']+COVERAGE,np.arange(8))
    metadata={'schema_version':1,'overlay_type':CONTOUR_STYLE,'generation':generation,'cycle':stamp.isoformat(),'valid_times':[(stamp+dt.timedelta(hours=h)).isoformat() for h in range(7)],'bounds':BOUNDS,'crs':'EPSG:3857','width':WIDTH,'height':HEIGHT,'resampling':'nearest','assets':assets,'colors':COLORS,'coverage_colors':COVERAGE,'formulation':'jose_gfs_q_theta850_additive_terrain','input_product':'HRRR wrfprs TMP/SPFH 950/850/700/500 hPa + surface PRES','sampling':'F00 through F06 inclusive: seven hourly samples; counts are not continuous duration','coverage_radius_km':15,'coverage_min_valid_fraction':0.8}
    (dest/'provenance.json').write_text(json.dumps(markers,indent=2))
    temporary=public/'metadata.tmp';temporary.write_text(json.dumps(metadata,indent=2));temporary.replace(public/'metadata.json')
    return metadata
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--decoded',required=True);p.add_argument('--public',required=True);p.add_argument('--cycle',required=True);a=p.parse_args();m=render(a.decoded,a.public,a.cycle);print(m['generation'],len(m['assets']),'assets')
