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
 const ui=root.GDIDisplay;const layers={};let metadata=null,displayed=null,hour=0,threshold=40,numbers=true,error='',serial=0,urls=[],contourFailed=false,loading=false,lastCheck=0,refreshing=null;
 map.createPane('gdiFields');map.getPane('gdiFields').style.zIndex=340;map.getPane('gdiFields').style.pointerEvents='none';
 names.forEach(n=>{const group=L.layerGroup();group.options.opacity=.8;group.setOpacity=v=>{group.options.opacity=v;group.eachLayer(x=>x.setOpacity(v));};layers[n]=group;});
 const selected=()=>names.find(n=>map.hasLayer(layers[n]));
 async function draw(){
  const n=selected(),token=++serial;if(!n||!metadata){loading=false;onChange();return;}
  const m=metadata,h=hour,t=threshold,show=numbers;
  const key=n==='gdi'?`gdi_${h}`:n==='coverage'?`coverage${t}_${h}`:`${n}${t}`;
  const keys=[key];if(n==='gdi'&&show&&m.overlay_type==='labeled_contours_v1')keys.push(`numbers_${h}`);
  loading=true;onChange();
  const results=await Promise.allSettled(keys.map(k=>ui.image(m,k,metadataURL)));const loaded=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(token!==serial){loaded.forEach(URL.revokeObjectURL);return;}
  loading=false;contourFailed=results.length>1&&results[1].status==='rejected';
  if(results[0].status==='rejected'){loaded.forEach(URL.revokeObjectURL);error='Update unavailable';onChange();return;}
  names.forEach(k=>layers[k].clearLayers());loaded.forEach(url=>L.imageOverlay(url,m.bounds,{pane:'gdiFields',opacity:layers[n].options.opacity,interactive:false}).addTo(layers[n]));
  urls.forEach(URL.revokeObjectURL);urls=loaded;displayed={m,n,h,t,show};error='';onChange();
 }
 function refresh(){
  if(refreshing)return refreshing;
  refreshing=(async()=>{try{const m=await ui.metadata(metadataURL);validate(m,metadata);lastCheck=Date.now();const changed=m.generation!==metadata?.generation;metadata=m;if(changed||error||contourFailed||!displayed)await draw();else onChange();}catch(e){error='Update unavailable';onChange();}finally{refreshing=null;}})();return refreshing;
 }
 map.on('layeradd layerremove',e=>{const n=names.find(k=>layers[k]===e.layer);if(!n)return;if(e.type==='layeradd')names.filter(k=>k!==n).forEach(k=>{if(map.hasLayer(layers[k]))map.removeLayer(layers[k]);});draw();if(e.type==='layeradd'&&(!metadata||Date.now()-lastCheck>60000))refresh();});
 document.addEventListener('change',e=>{const key=e.target?.dataset?.gdiControl;if(!key)return;if(key==='hour')hour=Number(e.target.value);if(key==='threshold')threshold=Number(e.target.value);if(key==='numbers')numbers=e.target.checked;draw();});
 const time=ui.utc;
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&selected())refresh();});
 function legendHTML(){const n=selected();if(!n)return '';
  const d=displayed?.n===n?displayed:null,m=d?.m;
  let html='<div class="gdi-legend"><strong>HRRR GDI'+(n==='gdi'?'':n==='coverage'?' · Neighborhood coverage':n==='persistence'?' · Sampled persistence':' · Longest sampled run')+'</strong>';
  html+='<div class="gdi-time">'+escape(m?(n==='gdi'||n==='coverage'?'Valid '+time(m.valid_times[d.h]):'Period '+time(m.valid_times[0])+' – '+time(m.valid_times[6])):error?'Data unavailable · retrying automatically':'Loading selected field…')+'</div>';
  if(m)html+='<div class="gdi-note">Model cycle '+time(m.cycle)+'</div>';
  if(loading&&m)html+='<div class="gdi-status">Loading selection · displayed times shown above</div>';
  if(error&&m)html+='<div class="gdi-status">'+escape(error+' · retaining displayed selection; retrying')+'</div>';
  if(contourFailed&&n==='gdi')html+='<div class="gdi-status">Contours unavailable · shading loaded; retrying</div>';
  if(m&&Date.now()-Date.parse(m.cycle)>6*3600000)html+='<div class="gdi-status">Older cycle · awaiting update</div>';
  html+='<div class="gdi-controls">';
  if(n==='gdi'||n==='coverage')html+='<label>Forecast <select aria-label="GDI forecast hour" data-gdi-control="hour">'+Array.from({length:7},(_,h)=>`<option value="${h}" ${h===hour?'selected':''}>+${h} h</option>`).join('')+'</select></label>';
  if(n!=='gdi')html+='<label> GDI ≥ <select aria-label="GDI threshold" data-gdi-control="threshold">'+[30,40,50].map(t=>`<option ${t===threshold?'selected':''}>${t}</option>`).join('')+'</select></label>';
  else html+=` <label><input type="checkbox" data-gdi-control="numbers" ${numbers?'checked':''}> Labeled contours</label>`;
  html+='</div>';
  if(m){
   const c=n==='gdi'?m.colors:n==='coverage'?m.coverage_colors:['#142d41',...m.coverage_colors];
   const edges=n==='gdi'?Array.from({length:18},(_,i)=>-30+i*5):n==='coverage'?Array.from({length:7},(_,i)=>i*100/6):Array.from({length:8},(_,i)=>i);
   html+=ui.scale(c,edges,n==='gdi'?'GDI':n==='coverage'?'Neighborhood coverage (%)':'Qualifying hourly samples');
   if(n!=='gdi')html+='<div class="gdi-note">GDI ≥ '+d.t+(n==='coverage'?' · 15-km radius':' · F00–F06 inclusive; counts are not continuous hours.')+'</div>';
  }return html+'</div>';
 }
 refresh();setInterval(()=>{if(selected()&&(error||contourFailed||Date.now()-lastCheck>=120000))refresh();},15000);return {layers,legendHTML,refresh};
}

root.HRRRGDI={create,validate};
})(typeof window==='undefined'?globalThis:window);
