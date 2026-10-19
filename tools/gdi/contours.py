"""Labeled isolines on the display grid; never modify the shaded/science fields."""
import numpy as np
from PIL import Image
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib import patheffects

CONTOUR_STYLE='labeled_contours_v1'

def contour_image(field, levels):
    a=np.asarray(field);height,width=a.shape
    empty=Image.new('RGBA',(width,height))
    finite=a[np.isfinite(a)]
    if not finite.size:return empty
    levels=[float(v) for v in levels if finite.min()<v<finite.max()]
    if not levels:return empty
    fig=Figure(figsize=(width/100,height/100),dpi=100,facecolor='none')
    canvas=FigureCanvasAgg(fig);ax=fig.add_axes([0,0,1,1],frameon=False)
    ax.set_xlim(-.5,width-.5);ax.set_ylim(height-.5,-.5);ax.set_axis_off()
    cs=ax.contour(np.ma.masked_invalid(a),levels=levels,colors='#263341',linewidths=.65,corner_mask=False)
    cs.set_path_effects([patheffects.Stroke(linewidth=1.3,foreground='#e5e3d5',alpha=.65),patheffects.Normal()])
    # Put labels on sufficiently long contour segments, never on a point grid.
    placed=[];positions=[]
    segments=[list(parts) for parts in cs.allsegs]
    for level,parts in zip(levels,segments):
        points=[]
        for segment in sorted(parts,key=len,reverse=True):
            if len(segment)<2:continue
            length=np.linalg.norm(np.diff(segment,axis=0),axis=1).sum()
            if length<150:continue
            point=segment[len(segment)//2]
            if not (40<point[0]<width-40 and 30<point[1]<height-30):continue
            if any(np.linalg.norm(point-other)<155 for other in placed):continue
            points.append(tuple(point));placed.append(point.copy())
            if len(points)>=6:break
        positions.extend(points)
    if positions:
        labels=cs.clabel(manual=positions,inline=True,inline_spacing=4,fontsize=13,fmt='%g',colors='#17232e')
        for label in labels:label.set_path_effects([patheffects.withStroke(linewidth=2.2,foreground='#e5e3d5')])
    canvas.draw();result=Image.fromarray(np.asarray(canvas.buffer_rgba()).copy())
    fig.clear();return result

def levels_for(key):
    if key.startswith('support'):return [10,25,50,75,90]
    if key.startswith('persistence'):return [1,2,3,4,6,9,12,15,18,21,24]
    if key=='change':return [-30,-20,-10,-5,0,5,10,20,30]
    return list(range(-30,81,10))
