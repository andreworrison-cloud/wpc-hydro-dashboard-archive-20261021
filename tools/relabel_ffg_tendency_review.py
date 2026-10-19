#!/usr/bin/env python3
"""Re-render frozen review legends from embedded color overlays; no science recomputation."""
import base64,io,json,re,hashlib,math
from pathlib import Path
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap,BoundaryNorm
from matplotlib.collections import LineCollection
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'review/ffg-tendency'
p=out/'ffg_tendency_review.html';html=p.read_text();data=json.loads(re.search(r'const data=(.*);\nconst map=',html).group(1));m=json.loads((out/'map_review.json').read_text())
legend='FFG change (inches)    ← Lower guidance / possible wetting                 Higher guidance / possible drying →'
html=html.replace('<span>Lower guidance ←</span>','<span>Lower guidance / possible wetting ←</span>').replace('<span>→ Higher guidance</span>','<span>→ Higher guidance / possible drying</span>')
note='Guidance also reflects streamflow conditions and RFC updates; tendency alone does not establish soil wetting or drying.'
if note not in html:html=html.replace('<p>Snapshot times do not establish',f'<p>{note}</p><p>Snapshot times do not establish')
p.write_text(html)
p=ROOT/'tools/render_ffg_tendency_review.py';s=p.read_text().replace('FFG change (inches)     ← Lower guidance                         Higher guidance →',legend).replace('<span>Lower guidance ←</span>','<span>Lower guidance / possible wetting ←</span>').replace('<span>→ Higher guidance</span>','<span>→ Higher guidance / possible drying</span>')
s=s.replace("size=12,labelpad=9","size=10,labelpad=9")
if note not in s:s=s.replace('<p>Snapshot times do not establish',f'<p>{note}</p><p>Snapshot times do not establish')
p.write_text(s)
def merc(lon,lat):return (6378137*math.radians(lon),6378137*math.log(math.tan(math.pi/4+math.radians(lat)/2)))
x0,y0=merc(-126,24);x1,y1=merc(-66,50);lines=[]
for feature in data['states']['features']:
 g=feature['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
 for poly in polys:
  for ring in poly:lines.append(np.array([merc(x,y) for x,y in ring]))
cmap=ListedColormap(m['legend_colors']);norm=BoundaryNorm(m['legend_edges'],len(m['legend_colors']))
proof={}
for key,uri in data['images'].items():
 h,lag=map(int,key.split('/'));raw=base64.b64decode(uri.split(',',1)[1]);im=Image.open(io.BytesIO(raw)).convert('RGBA');assert im.size==(4000,2538)
 rgba=np.array(im);rgba[rgba[:,:,3]==0]=[227,231,235,255]
 slug=f'ffg_{h}h_change_{lag}h';proof[slug]=hashlib.sha256(raw).hexdigest()
 fig=plt.figure(figsize=(16,10.152),dpi=250,facecolor='white');ax=fig.add_axes([.025,.20,.95,.67])
 ax.imshow(rgba,extent=[x0,x1,y0,y1],origin='upper',interpolation='nearest')
 ax.add_collection(LineCollection(lines,colors='#45545e',linewidths=.38));ax.set_xlim(x0,x1);ax.set_ylim(y0,y1);ax.set_axis_off()
 begin={6:'18 Oct 2026 13Z',12:'18 Oct 2026 07Z',24:'17 Oct 2026 19Z'}[lag]
 fig.text(.05,.95,f'{lag}-hour FFG tendency · {h}-hour rainfall duration',size=23,weight='bold',color='#142c3b')
 fig.text(.05,.91,f'Snapshots: {begin} → 18 Oct 2026 19Z',size=14,color='#45545e')
 cb=fig.colorbar(plt.cm.ScalarMappable(norm=norm,cmap=cmap),cax=fig.add_axes([.12,.125,.76,.025]),orientation='horizontal',ticks=m['legend_edges'][1:-1],spacing='uniform',extend='both');cb.ax.tick_params(labelsize=10);cb.set_label(legend,size=10,labelpad=9)
 fig.text(.05,.048,'Derived from RFC-issued guidance in WPC hourly mosaics · Current minus earlier guidance',size=11,color='#45545e')
 fig.text(.05,.023,'FROZEN REVIEW · Ivory: ±0.01 inch · Gray: unavailable · Guidance changes may reflect streamflow conditions and RFC updates',size=10,color='#45545e')
 fig.savefig(out/f'{slug}.png');plt.close(fig);print('Relabeled',slug,flush=True)
(out/'legend_update.json').write_text(json.dumps({'legend':legend,'qualification':note,'method':'Frozen color overlays reused unchanged; only presentation legends and explanatory text updated','overlay_sha256':proof},indent=2)+'\n')
