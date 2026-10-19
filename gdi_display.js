/* Shared GDI transport and legends. Does not alter meteorological fields. */
(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const utc=t=>new Date(t).toISOString().slice(5,16).replace('T',' ')+'Z';
async function request(url,type){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const r=await fetch(url,{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r[type]();}
  catch(e){last=e;}finally{clearTimeout(timer);}
 }
 throw last;
}
async function metadata(url){const u=new URL(url);u.searchParams.set('gdi_refresh',Math.floor(Date.now()/60000));return request(u,'json');}
const cache=new Map();
async function image(m,key,base){
 const a=m.assets[key],url=new URL(a.path,base).href,cacheKey=url+'#'+a.sha256;
 let bytes=cache.get(cacheKey);
 if(!bytes){
  bytes=await request(url,'arrayBuffer');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(hash!==a.sha256)throw Error('Image checksum mismatch');
  cache.set(cacheKey,bytes);if(cache.size>16)cache.delete(cache.keys().next().value);
 }
 const objectURL=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
 try{const im=new Image();im.src=objectURL;await im.decode();if(im.width!==m.width||im.height!==m.height)throw Error('Image dimensions');return objectURL;}catch(e){cache.delete(cacheKey);URL.revokeObjectURL(objectURL);throw e;}
}
const number=v=>Number.isInteger(Number(v))?String(v):Number(v).toFixed(1);
function scale(colors,edges,unit){
 const n=colors.length;if(!n||edges.length!==n)return '';
 const picks=n>12?[0,3,6,9,12,15,n-1]:n>8?[0,2,4,6,8,n-1]:edges.map((_,i)=>i);
 let html='<div class="gdi-scale-unit">'+esc(unit)+'</div><div class="gdi-scale" role="img" aria-label="'+esc(unit+' color scale; '+edges.map(number).join(', '))+'"><div class="gdi-scale-bar">';
 colors.forEach((c,i)=>{const range=i===0?'Below '+number(edges[1]):i===n-1?'≥ '+number(edges[i]):number(edges[i])+' to < '+number(edges[i+1]);html+='<span style="background:'+(/^#[0-9a-f]{6}$/i.test(c)?c:'#000000')+'" title="'+esc(range+' '+unit)+'"></span>';});
 html+='</div><div class="gdi-scale-ticks">';
 picks.forEach(i=>{const label=(i===n-1?'≥':'')+number(edges[i]);html+='<span style="left:'+(100*i/n)+'%">'+esc(label)+'</span>';});
 return html+'</div></div>';
}
function controls(id,checked){return '<div class="gdi-controls"><label><input type="checkbox" '+id+' '+(checked?'checked':'')+'> Labeled contours</label></div>';}
root.GDIDisplay={esc,utc,metadata,image,scale,controls};
})(typeof window==='undefined'?globalThis:window);
