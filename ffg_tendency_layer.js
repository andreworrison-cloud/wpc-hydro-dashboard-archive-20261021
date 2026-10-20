/* Derived guidance changes; snapshot times are not individual RFC issuance times. */
function ffgTendencyState(m,lag,now=Date.now()) {
 const a=m?.products?.[lag];
 if(!a)return {visible:false,state:'unavailable',label:'Exact endpoint pair unavailable'};
 const newer=Date.parse(a.new?.snapshot_time),older=Date.parse(a.old?.snapshot_time),ref=Date.parse(a.new?.reference_time),oldref=Date.parse(a.old?.reference_time),declared=Date.parse(a.expires_at);
 if(![newer,older,ref,oldref,declared].every(Number.isFinite)||newer>now||newer-older!==Number(lag)*3600000||ref>newer||oldref>older||older-oldref>=9*3600000)return {visible:false,state:'unavailable',label:'Invalid endpoint timing'};
 const expires=Math.min(newer+3*3600000,ref+9*3600000,declared);
 if(now>=expires)return {visible:false,state:'expired',label:'Hidden — latest guidance exceeds age limit',expires};
 const retained=m.stale||!m.last_attempt?.products?.[lag]?.ok;
 return {visible:true,state:retained?'retained':'current',label:retained?'Update delayed — prior verified tendency':now-newer>=2*3600000?'Guidance update aging':'Current guidance tendency',expires};
}
if(typeof module!=='undefined')module.exports={ffgTendencyState};
if(typeof window!=='undefined')window.createFFGTendencyLayers=function({map,metadataURL,onChange=()=>{},now=()=>Date.now()}) {
 const hours=[1,3,6],lags=[6,12,24],layers={},images={},loaded={},urls={};let metadata=null,busy=false,failed=false,borders=null,lag=24;
 const pane='ffgTendency';map.createPane(pane);map.getPane(pane).style.zIndex=342;
 hours.forEach(h=>{const g=L.layerGroup();g.options.opacity=1;g.setOpacity=value=>{g.options.opacity=value;g.eachLayer(x=>x.setOpacity(value));};layers[h]=g;});
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const utc=v=>Number.isFinite(Date.parse(v))?new Date(v).toISOString().replace('T',' ').replace(/:00\.000Z$/,'Z'):'Unavailable';
 const state=l=>ffgTendencyState(failed&&metadata?{...metadata,stale:true}:metadata,l??lag,now());
 const selected=()=>hours.filter(h=>map.hasLayer(layers[h]));
 // A removed Leaflet group still has _map during layerremove. Never repopulate
 // an unselected group there: its image would be re-added as an orphan raster.
 function sync(){
  const s=state();hours.forEach(h=>{layers[h].clearLayers();if(map.hasLayer(layers[h])&&s.visible&&images[lag]?.[h]){images[lag][h].setOpacity(layers[h].options.opacity);layers[h].addLayer(images[lag][h]);}});
  if(borders){if(selected().length&&!map.hasLayer(borders))borders.addTo(map);if(!selected().length&&map.hasLayer(borders))map.removeLayer(borders);}onChange();
 }
 function validate(m){
  if(m?.schema_version!==1||m.policy?.snapshot_hours!==3||m.policy?.reference_hours!==9||m.policy?.warning_hours!==2)throw Error('Tendency policy mismatch');
  const l=m.legend;
  if(l?.crs!=='EPSG:3857'||JSON.stringify(l.bounds_wsen)!=='[-126,24,-66,50]'||JSON.stringify(l.pixels)!=='[4000,2538]'||l.units!=='inches'||l.resampling!=='bilinear with nearest paired-valid mask'||JSON.stringify(l.edges)!=='[-2,-1,-0.5,-0.25,-0.01,0.01,0.25,0.5,1,2]'||JSON.stringify(l.colors)!=='["#08306b","#08519c","#2171b5","#6baed6","#c6dbef","#f5f4ef","#f6dfba","#e8b66b","#ca8639","#9b591e","#65350f"]')throw Error('Tendency legend contract mismatch');
  lags.forEach(lag=>{const a=m.products?.[lag];if(!a)return;
   if(a.lookback_hours!==lag||ffgTendencyState(m,lag,now()).state==='unavailable')throw Error('Invalid tendency endpoints');
   if(!/^[a-zA-Z0-9-]+$/.test(a.generation)||!hours.every(h=>a.assets?.[h]?.duration_hours===h&&/^[a-f0-9]{64}$/.test(a.assets[h].sha256)&&a.assets[h].path===`generations/${a.generation}/${h}h.png`))throw Error('Invalid tendency assets');
   const old=metadata?.products?.[lag];if(old&&Date.parse(old.new.snapshot_time)>Date.parse(a.new.snapshot_time))throw Error('Regressing tendency');
   if(old?.generation===a.generation&&JSON.stringify(old)!==JSON.stringify(a))throw Error('Immutable tendency changed');
  });
 }
 async function refresh(){
  if(busy)return;busy=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000),staged=[];
  try{
   const url=new URL(metadataURL,document.baseURI);url.searchParams.set('_check',String(now()));const r=await fetch(url,{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Metadata unavailable');const next=await r.json();validate(next);
   const pending={};
   for(const l of lags){const a=next.products[l];if(!a||!ffgTendencyState(next,l,now()).visible||loaded[l]===a.generation)continue;pending[l]={images:{},urls:[],gen:a.generation};
    for(const h of hours){const asset=a.assets[h],r=await fetch(new URL(asset.path,new URL('.',url)),{signal:controller.signal});if(!r.ok)throw Error('Tendency image unavailable');const data=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==asset.sha256)throw Error('Image checksum mismatch');
     const blob=new Blob([data],{type:'image/png'}),bitmap=await createImageBitmap(blob),correct=bitmap.width===4000&&bitmap.height===2538;bitmap.close();if(!correct)throw Error('Image dimensions mismatch');
     const u=URL.createObjectURL(blob);staged.push(u);pending[l].urls.push(u);pending[l].images[h]=L.imageOverlay(u,[[24,-126],[50,-66]],{pane,interactive:false,className:'rfc-ffg-raster'});
    }
   }
   hours.forEach(h=>layers[h].clearLayers());
   Object.entries(pending).forEach(([l,p])=>{(urls[l]||[]).forEach(u=>URL.revokeObjectURL(u));urls[l]=p.urls;images[l]=p.images;loaded[l]=p.gen;});staged.length=0;
   // Preserve a previously verified pair only to its original deadline.
   lags.forEach(l=>{if(!next.products[l]&&metadata?.products[l]){next.products[l]=metadata.products[l];next.last_attempt.products[l]={ok:false};}});
   metadata=next;failed=false;
  }catch(e){failed=true;console.warn('FFG tendency refresh:',e.message);}
  finally{staged.forEach(u=>URL.revokeObjectURL(u));clearTimeout(timeout);busy=false;sync();}
 }
 function summary(){const a=metadata?.products?.[lag];return a?`${utc(a.old.snapshot_time)} → ${utc(a.new.snapshot_time)} · ${state().label}`:state().label;}
 function legendHTML(){const hs=selected();if(!hs.length)return '';const a=metadata?.products?.[lag],s=state();let html=`<div class="rfc-ffg-card"><strong>${hs.map(h=>`${h}-hour FFG`).join(' / ')} · Change over ${lag} hours</strong><div>${esc(s.label)}</div>`;
  if(a){html+=`<p>Snapshots: ${esc(utc(a.old.snapshot_time))} → ${esc(utc(a.new.snapshot_time))}<br>RFC reference cycles: ${esc(utc(a.old.reference_time))} → ${esc(utc(a.new.reference_time))}</p><strong>Guidance change · inches</strong><div>Lower guidance / possible wetting (blue)<br>Higher guidance / possible drying (brown)</div>`;
   const edges=metadata.legend.edges;metadata.legend.colors.forEach((c,i)=>{const label=i===0?`< ${edges[0]}`:i===edges.length?`≥ ${edges[i-1]}`:i===5?'−0.01 to +0.01 (near zero)':`${edges[i-1]} to ${edges[i]}`;html+=`<div><i class="rfc-ffg-swatch" style="background:${c}"></i>${label}</div>`;});
   html+=`<p>Current minus earlier RFC guidance. Streamflow conditions and RFC updates can also cause changes; tendency alone does not establish wetting or drying.</p><p>Nominal 5-km source · transparent = unavailable.<br>Mosaic times do not establish individual RFC issuance times.<br>Last source check: ${esc(utc(metadata.last_attempt?.at))}<br>Hide after: ${esc(utc(a.expires_at))}</p>`;
  }return html+'</div>';
 }
 function setBorders(geojson){if(borders&&map.hasLayer(borders))map.removeLayer(borders);borders=L.layerGroup([L.geoJSON(geojson,{pane:'mapReference',interactive:false,style:{color:'#101820',weight:2.6,opacity:.85,fill:false}}),L.geoJSON(geojson,{pane:'mapReference',interactive:false,style:{color:'#fff',weight:1,opacity:.9,fill:false}})]);sync();}
 map.on('layeradd layerremove',e=>{if(hours.some(h=>layers[h]===e.layer))sync();});const timer=setInterval(sync,30000),poll=setInterval(refresh,300000);setTimeout(refresh,0);
 return {layers,refresh,legendHTML,setBorders,sync,getState:()=>state(),getMetadata:()=>metadata,summary,getLookback:()=>lag,setLookback:value=>{value=Number(value);if(!lags.includes(value))throw Error('Unsupported tendency');lag=value;sync();},stop:()=>{clearInterval(timer);clearInterval(poll);}};
};
