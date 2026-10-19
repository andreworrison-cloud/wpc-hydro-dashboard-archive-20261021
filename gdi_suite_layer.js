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
 let metadata=null,shown=null,failed=false,numbers=true,serial=0,urls=[];const layers={};
 map.createPane(paneName);map.getPane(paneName).style.zIndex=340;map.getPane(paneName).style.pointerEvents='none';
 keys.forEach(k=>{const g=L.layerGroup();g.options.opacity=.8;g.setOpacity=v=>{g.options.opacity=v;g.eachLayer(x=>x.setOpacity(v));};layers[k]=g;});
 const selected=()=>keys.find(k=>map.hasLayer(layers[k]));
 async function image(m,k){const a=m.assets[k],r=await fetch(new URL(a.path,metadataURL));if(!r.ok)throw Error('Unavailable image');const b=await r.arrayBuffer(),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==a.sha256)throw Error('Checksum mismatch');const u=URL.createObjectURL(new Blob([b],{type:'image/png'}));try{const im=new Image();im.src=u;await im.decode();if(im.width!==2400||im.height!==1360)throw Error('Wrong dimensions');return u;}catch(e){URL.revokeObjectURL(u);throw e;}}
 async function draw(){const k=selected(),token=++serial,m=metadata;if(!k||!m){onChange();return;}if(m.expires_at&&Date.now()>=Date.parse(m.expires_at)){keys.forEach(x=>layers[x].clearLayers());shown=null;urls.forEach(URL.revokeObjectURL);urls=[];onChange();return;}const result=await Promise.allSettled((numbers?[k,k+'_numbers']:[k]).map(x=>image(m,x)));const fresh=result.filter(x=>x.status==='fulfilled').map(x=>x.value);if(token!==serial){fresh.forEach(URL.revokeObjectURL);return;}if(fresh.length!==result.length){fresh.forEach(URL.revokeObjectURL);failed=true;onChange();return;}keys.forEach(x=>layers[x].clearLayers());fresh.forEach(u=>L.imageOverlay(u,m.bounds,{pane:paneName,opacity:layers[k].options.opacity,interactive:false}).addTo(layers[k]));urls.forEach(URL.revokeObjectURL);urls=fresh;shown={m,k};failed=false;onChange();}
 async function refresh(){try{const r=await fetch(metadataURL,{cache:'no-store'});if(!r.ok)throw Error('No metadata');const m=await r.json();validate(m,keys,metadata);const changed=m.generation!==metadata?.generation;metadata=m;if(changed||failed||(m.expires_at&&Date.now()>=Date.parse(m.expires_at)))await draw();else onChange();}catch(e){failed=true;if(metadata?.expires_at&&Date.now()>=Date.parse(metadata.expires_at))await draw();else onChange();}}
 map.on('layeradd layerremove',e=>{const k=keys.find(x=>layers[x]===e.layer);if(!k)return;if(e.type==='layeradd')keys.filter(x=>x!==k).forEach(x=>{if(map.hasLayer(layers[x]))map.removeLayer(layers[x]);});draw();});
 document.addEventListener('change',e=>{if(e.target?.dataset?.gdiSuite===paneName){numbers=e.target.checked;draw();}});
 const utc=t=>new Date(t).toISOString().slice(0,16).replace('T',' ')+'Z';
 function legendHTML(){const k=selected();if(!k)return '';const d=shown?.k===k?shown:null;if(!d)return '<strong>GDI</strong><div>'+ (metadata?.expires_at&&Date.now()>=Date.parse(metadata.expires_at)?'Forecast window ended · awaiting current guidance':failed?'Data unavailable · awaiting a complete update':'Loading…')+'</div>';const m=d.m,p=m.products[k];let html=`<strong>${esc(p.label)}</strong><div>Cycle ${utc(p.cycle||m.cycle)} · Valid ${utc(p.valid_time)}</div>`;
 if(p.source_label)html+='<div>'+esc(p.source_label)+'</div>';
 if(p.window_start)html+=`<div>${utc(p.window_start)} – ${utc(p.valid_time)}</div>`;
 if(failed)html+='<div>Update unavailable · showing previous complete data</div>';
 if(Date.now()-Date.parse(m.cycle)>6*3600000)html+='<div>Older cycle · awaiting update</div>';
 html+=`<label><input type="checkbox" data-gdi-suite="${paneName}" ${numbers?'checked':''}> Numbers</label><div style="display:flex;height:12px;margin-top:6px">`;
 html+=(p.colors||[]).map(c=>`<span style="flex:1;background:${/^#[0-9a-f]{6}$/i.test(c)?c:'#000000'}"></span>`).join('')+'</div><div>'+esc(p.legend)+'</div>';return html;}
 refresh();setInterval(refresh,300000);return {layers,legendHTML,refresh};
}
root.GDINamedSuite={create,validate};
})(typeof window==='undefined'?globalThis:window);
