/* Named GDI suites: immutable assets, actual displayed valid times, optional values. */
(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(m,keys,previous){
 if(m?.schema!=='gdi_named_suite_v1'||m.width!==2400||m.height!==1360||m.crs!=='EPSG:3857'||m.resampling!=='nearest'||!/^\d{10}-[a-f0-9]{12}-v1$/.test(m.generation)||JSON.stringify(m.bounds)!=='[[24,-125],[50,-66]]'||!Number.isFinite(Date.parse(m.cycle)))throw Error('Invalid GDI suite');
 if(previous&&Date.parse(m.cycle)<Date.parse(previous.cycle))throw Error('Regressing suite');
 if(previous?.generation===m.generation&&JSON.stringify(previous)!==JSON.stringify(m))throw Error('Changed immutable suite');
 keys.forEach(k=>{if(!m.products[k]||!Number.isFinite(Date.parse(m.products[k].valid_time)))throw Error('Missing product/time');for(const suffix of ['','_numbers']){const a=m.assets[k+suffix];if(a?.path!==`generations/${m.generation}/${k+suffix}.png`||!/^[a-f0-9]{64}$/.test(a.sha256))throw Error('Invalid image');}});
}
function create({map,metadataURL,keys,paneName,onChange=()=>{}}){
 const ui=root.GDIDisplay;
 let metadata=null,shown=null,failed=false,numbers=true,serial=0,urls=[],contourFailed=false,loading=false,lastCheck=0,refreshing=null;
 const layers={};
 map.createPane(paneName);map.getPane(paneName).style.zIndex=340;map.getPane(paneName).style.pointerEvents='none';
 keys.forEach(k=>{const g=L.layerGroup();g.options.opacity=.8;g.setOpacity=v=>{g.options.opacity=v;g.eachLayer(x=>x.setOpacity(v));};layers[k]=g;});
 const selected=()=>keys.find(k=>map.hasLayer(layers[k]));
 const expired=m=>m?.expires_at&&Date.now()>=Date.parse(m.expires_at);
 function clear(){keys.forEach(k=>layers[k].clearLayers());urls.forEach(URL.revokeObjectURL);urls=[];shown=null;}
 async function draw(){
  const k=selected(),token=++serial,m=metadata;
  if(!k||!m){loading=false;onChange();return;}
  if(expired(m)){clear();loading=false;onChange();return;}
  loading=true;onChange();
  const want=numbers&&m.overlay_type==='labeled_contours_v1';
  const results=await Promise.allSettled([k,...(want?[k+'_numbers']:[])].map(x=>ui.image(m,x,metadataURL)));
  const fresh=results.filter(x=>x.status==='fulfilled').map(x=>x.value);
  if(token!==serial){fresh.forEach(URL.revokeObjectURL);return;}
  loading=false;
  if(results[0].status==='rejected'){fresh.forEach(URL.revokeObjectURL);failed=true;onChange();return;}
  if(expired(m)){fresh.forEach(URL.revokeObjectURL);clear();onChange();return;}
  contourFailed=want&&results[1].status==='rejected';
  clear();fresh.forEach(u=>L.imageOverlay(u,m.bounds,{pane:paneName,opacity:layers[k].options.opacity,interactive:false}).addTo(layers[k]));
  urls=fresh;shown={m,k};failed=false;onChange();
 }
 function refresh(){
  if(refreshing)return refreshing;
  refreshing=(async()=>{try{
   const m=await ui.metadata(metadataURL);validate(m,keys,metadata);lastCheck=Date.now();
   const changed=m.generation!==metadata?.generation;metadata=m;
   if(changed||failed||contourFailed||expired(m)||!shown)await draw();else onChange();
  }catch(e){failed=true;if(expired(metadata)){++serial;clear();}onChange();}
  finally{refreshing=null;}})();return refreshing;
 }
 map.on('layeradd layerremove',e=>{
  const k=keys.find(x=>layers[x]===e.layer);if(!k)return;
  if(e.type==='layeradd')keys.filter(x=>x!==k).forEach(x=>{if(map.hasLayer(layers[x]))map.removeLayer(layers[x]);});
  draw();if(e.type==='layeradd'&&(!metadata||Date.now()-lastCheck>60000))refresh();
 });
 document.addEventListener('change',e=>{if(e.target?.dataset?.gdiSuite===paneName){numbers=e.target.checked;draw();}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&selected())refresh();});
 function legendHTML(){
  const k=selected();if(!k)return '';
  const d=shown?.k===k?shown:null,m=d?.m,p=m?.products[k];
  if(!d)return '<div class="gdi-legend"><strong>'+esc(metadata?.products[k]?.label||'GDI')+'</strong><div class="gdi-status">'+(expired(metadata)?'Forecast window ended · awaiting current guidance':failed?'Data unavailable · retrying automatically':'Loading selected field…')+'</div></div>';
  let html='<div class="gdi-legend"><strong>'+esc(p.label)+'</strong>';
  html+='<div class="gdi-time">'+(p.window_start?'Period '+ui.utc(p.window_start)+' – '+ui.utc(p.valid_time):'Valid '+ui.utc(p.valid_time))+'</div>';
  html+='<div class="gdi-note">'+(p.source_label?esc(p.source_label):'Model cycle '+ui.utc(p.cycle||m.cycle))+'</div>';
  if(loading)html+='<div class="gdi-status">Loading update · displayed times shown above</div>';
  else if(failed)html+='<div class="gdi-status">Update unavailable · retaining displayed data; retrying</div>';
  if(contourFailed)html+='<div class="gdi-status">Contours unavailable · shading loaded; retrying</div>';
  if(!m.window_start&&Date.now()-Date.parse(m.cycle)>6*3600000)html+='<div class="gdi-status">Older cycle · awaiting update</div>';
  html+=ui.controls('data-gdi-suite="'+paneName+'"',numbers);
  const unit=k.startsWith('support')?'Neighborhood support (%)':k.startsWith('persistence')?'Mean qualifying hourly samples':k==='change'?'GDI change (3 h)':'GDI';
  html+=ui.scale(p.colors||[],p.edges||[],unit);
  html+='<div class="gdi-note">'+esc(p.legend)+'</div></div>';return html;
 }
 refresh();setInterval(()=>{if(selected()&&(failed||contourFailed||Date.now()-lastCheck>=120000||expired(metadata)))refresh();},15000);
 return {layers,legendHTML,refresh};
}
root.GDINamedSuite={create,validate};
})(typeof window==='undefined'?globalThis:window);
