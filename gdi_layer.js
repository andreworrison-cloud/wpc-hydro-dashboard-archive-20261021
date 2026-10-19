/* HRRR GDI: atomic, checksum-verified display; native calculation stays server-side. */
(function(root){
'use strict';
const names=['gdi','coverage','persistence','longest'];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(m,previous){
 if(m?.schema_version!==1||m.crs!=='EPSG:3857'||m.width!==2400||m.height!==1360||m.resampling!=='nearest'||!/^\d{10}-[a-f0-9]{12}-v1$/.test(m.generation)||JSON.stringify(m.bounds)!=='[[24,-125],[50,-66]]')throw Error('Invalid GDI metadata');
 const cycle=Date.parse(m.cycle);if(!Number.isFinite(cycle)||cycle>Date.now()+3600000)throw Error('Invalid cycle');
 if(previous&&cycle<Date.parse(previous.cycle))throw Error('Regressing cycle');
 if(m.valid_times?.length!==7||m.valid_times.some((t,h)=>Date.parse(t)!==cycle+h*3600000))throw Error('Incomplete forecast window');
 const keys=[];for(let h=0;h<7;h++)for(const p of ['gdi','numbers','coverage30','coverage40','coverage50'])keys.push(`${p}_${h}`);
 for(const p of ['persistence','longest'])for(const t of [30,40,50])keys.push(`${p}${t}`);
 if(Object.keys(m.assets||{}).length!==keys.length)throw Error('Incomplete assets');
 keys.forEach(k=>{const a=m.assets[k];if(a?.path!==`generations/${m.generation}/${k}.png`||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('Invalid asset');});
 if(previous?.generation===m.generation&&JSON.stringify(previous)!==JSON.stringify(m))throw Error('Changed immutable generation');
}
function create({map,metadataURL,onChange=()=>{}}){
 const layers={};let metadata=null,displayed=null,hour=0,threshold=40,numbers=true,error='',serial=0,urls=[];
 map.createPane('gdiFields');map.getPane('gdiFields').style.zIndex=340;map.getPane('gdiFields').style.pointerEvents='none';
 names.forEach(n=>{const group=L.layerGroup();group.options.opacity=.8;group.setOpacity=v=>{group.options.opacity=v;group.eachLayer(x=>x.setOpacity(v));};layers[n]=group;});
 const selected=()=>names.find(n=>map.hasLayer(layers[n]));
 async function image(m,key){
  const a=m.assets[key],r=await fetch(new URL(a.path,metadataURL));if(!r.ok)throw Error('Image unavailable');
  const b=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==a.sha256)throw Error('Image checksum mismatch');
  const url=URL.createObjectURL(new Blob([b],{type:'image/png'}));
  try{const im=new Image();im.src=url;await im.decode();if(im.width!==m.width||im.height!==m.height)throw Error('Image size mismatch');return url;}catch(e){URL.revokeObjectURL(url);throw e;}
 }
 async function draw(){
  const n=selected(),token=++serial;if(!n||!metadata){onChange();return;}
  const m=metadata,h=hour,t=threshold,show=numbers;
  const key=n==='gdi'?`gdi_${h}`:n==='coverage'?`coverage${t}_${h}`:`${n}${t}`;
  const keys=[key];if(n==='gdi'&&show)keys.push(`numbers_${h}`);
  const results=await Promise.allSettled(keys.map(k=>image(m,k)));const loaded=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(token!==serial){loaded.forEach(URL.revokeObjectURL);return;}
  if(results.some(r=>r.status==='rejected')){loaded.forEach(URL.revokeObjectURL);error='Update unavailable';onChange();return;}
  names.forEach(k=>layers[k].clearLayers());loaded.forEach(url=>L.imageOverlay(url,m.bounds,{pane:'gdiFields',opacity:layers[n].options.opacity,interactive:false}).addTo(layers[n]));
  urls.forEach(URL.revokeObjectURL);urls=loaded;displayed={m,n,h,t,show};error='';onChange();
 }
 async function refresh(){try{const r=await fetch(metadataURL,{cache:'no-store'});if(!r.ok)throw Error('Metadata unavailable');const m=await r.json();validate(m,metadata);const changed=m.generation!==metadata?.generation;metadata=m;if(changed||error)await draw();else onChange();}catch(e){error='Update unavailable';onChange();}}
 map.on('layeradd layerremove',e=>{const n=names.find(k=>layers[k]===e.layer);if(!n)return;if(e.type==='layeradd')names.filter(k=>k!==n).forEach(k=>{if(map.hasLayer(layers[k]))map.removeLayer(layers[k]);});draw();});
 document.addEventListener('change',e=>{const key=e.target?.dataset?.gdiControl;if(!key)return;if(key==='hour')hour=Number(e.target.value);if(key==='threshold')threshold=Number(e.target.value);if(key==='numbers')numbers=e.target.checked;draw();});
 const time=t=>new Date(t).toISOString().slice(0,16).replace('T',' ')+'Z';
 function legendHTML(){const n=selected();if(!n)return '';
  const d=displayed?.n===n?displayed:null,m=d?.m;
  let html='<strong>HRRR GDI'+(n==='gdi'?'':n==='coverage'?' · Neighborhood coverage':n==='persistence'?' · Sampled persistence':' · Longest sampled run')+'</strong>';
  html+='<div>'+escape(m?`Cycle ${time(m.cycle)} · ${n==='gdi'||n==='coverage'?'Valid '+time(m.valid_times[d.h]):time(m.valid_times[0])+' – '+time(m.valid_times[6])}`:'Loading data…')+'</div>';
  if(error)html+='<div>'+escape(error+(m?' · Showing previous selection':''))+'</div>';
  if(m&&Date.now()-Date.parse(m.cycle)>6*3600000)html+='<div>Older cycle · awaiting a newer complete update</div>';
  if(n==='gdi'||n==='coverage')html+='<label>Forecast <select data-gdi-control="hour">'+Array.from({length:7},(_,h)=>`<option value="${h}" ${h===hour?'selected':''}>+${h} h</option>`).join('')+'</select></label>';
  if(n!=='gdi')html+='<label> GDI ≥ <select data-gdi-control="threshold">'+[30,40,50].map(t=>`<option ${t===threshold?'selected':''}>${t}</option>`).join('')+'</select></label>';
  else html+=` <label><input type="checkbox" data-gdi-control="numbers" ${numbers?'checked':''}> Numbers</label>`;
  if(m){const c=n==='gdi'?m.colors:n==='coverage'?m.coverage_colors:['#142d41',...m.coverage_colors];html+='<div style="display:flex;height:12px;margin-top:6px">'+c.map(color=>`<span style="flex:1;background:${escape(/^#[0-9a-f]{6}$/i.test(color)?color:'#000000')}"></span>`).join('')+'</div>';
   html+='<div>'+(n==='gdi'?'−30 · −15 · 0 · 15 · 30 · 45 · 60':n==='coverage'?`0–100% within 15 km · GDI ≥ ${d.t}`:`0–7 hourly samples · GDI ≥ ${d.t}`)+'</div>';
   if(n==='persistence'||n==='longest')html+='<div>F00–F06 inclusive; sampled counts, not continuous hours.</div>';
  }return html;
 }
 refresh();setInterval(refresh,300000);return {layers,legendHTML,refresh};
}
root.HRRRGDI={create,validate};
})(typeof window==='undefined'?globalThis:window);
