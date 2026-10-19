/* Window-fixed observed rainfall / RFC guidance. */
function qpeFFGDisplayState(m,now=Date.now()) {
 const a=m?.active, unavailable={state:'unavailable',visible:false,label:'Unavailable'};
 if(!a)return unavailable;
 const q=Date.parse(a.qpe_end),s=Date.parse(a.ffg?.snapshot_time),r=Date.parse(a.ffg_reference),declared=Date.parse(a.live_age_deadline);
 if(![q,s,r,declared].every(Number.isFinite)||q>now||s>q||r>s)return unavailable;
 const extended=a.pass_number===2 && m.policy?.qpe_hours===6 && m.policy?.snapshot_hours===9 && m.policy?.reference_hours===15;
 const limits=[[q+(extended?6:3)*3600000,'rainfall age limit'],[s+(extended?9:3)*3600000,'paired FFG snapshot age limit'],[r+(extended?15:9)*3600000,'paired RFC cycle age limit'],[declared,'pair viewing deadline']];
 const [expires,reason]=limits.reduce((best,item)=>item[0]<best[0]?item:best);
 if(now>=expires)return {state:'expired',visible:false,label:'Hidden — '+reason,expires};
 const attempt=m.last_attempt?.['pass'+a.pass_number];
 const retained=m.stale||!attempt||!['accepted','accepted_prior_window'].includes(attempt.state);
 return {state:retained?'retained':'current',visible:true,label:retained?'Update delayed — retaining verified pair':(a.pass_number===2?'Pass 2 — earlier paired rainfall window':'Current paired rainfall window'),expires};
}
function qpeFFGTimingSummary(m, now=Date.now()) {
 const end=Date.parse(m?.active?.qpe_end);
 if(!Number.isFinite(end)||end>now)return null;
 const mins=Math.floor((now-end)/60000);
 return {through:'Rainfall through '+new Date(end).toISOString().replace('T',' ').replace(/:00\.000Z$/, 'Z'),
         guidance:Number.isFinite(Date.parse(m.active.ffg_reference))?'Paired RFC cycle '+new Date(m.active.ffg_reference).toISOString().replace('T',' ').replace(/:00\.000Z$/, 'Z'):'Paired RFC cycle unavailable',
         age:mins<60?`${mins} min old`:`${Math.floor(mins/60)} h ${mins%60} min old`};
}
if(typeof window!=='undefined')window.qpeFFGTimingSummary=qpeFFGTimingSummary;
if(typeof module!=='undefined')module.exports={qpeFFGDisplayState,qpeFFGTimingSummary};
/* RFC guidance adapter: immutable, hash-verified images; all durations swap together. */
if(typeof window!=='undefined')window.createQPEFFGLayers = function ({map, metadataURL, passNumber, onChange = () => {}, now = () => Date.now()}) {
    const hours = ['fine1','fine3','fine6','coarse1','coarse3','coarse6'], layers = {}, images = {};
    let metadata = null, loadedGeneration = null, busy = false, failed = false, objectURLs = [], borders = null;
    const pane='qpeFFG'+passNumber; map.createPane(pane); map.getPane(pane).style.zIndex = 345;
    hours.forEach(h => {
        const group = L.layerGroup(); group.options.opacity = 1;
        group.setOpacity = value => {group.options.opacity = value; group.eachLayer(l => l.setOpacity(value));};
        layers[h] = group;
    });
    const utc = value => Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z') : 'Unavailable';
    const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function state() {
        const m = failed && metadata ? {...metadata, stale:true} : metadata;
        return qpeFFGDisplayState(m, now());
    }
    function selected() { return hours.filter(h => map.hasLayer(layers[h])); }
    function sync() {
        const s = state();
        hours.forEach(h => {
            if (s.visible && images[h] && !layers[h].hasLayer(images[h])) layers[h].addLayer(images[h]);
            if (!s.visible) layers[h].clearLayers();
        });
        if (borders) {
            if (selected().length && !map.hasLayer(borders)) borders.addTo(map);
            if (!selected().length && map.hasLayer(borders)) map.removeLayer(borders);
        }
        onChange();
    }
    function validate(m) {
        if (m?.schema_version !== 1 || !m.policy) throw Error('Invalid FFG metadata');
        // Accepted application policy cannot be silently relaxed by a producer.
        const legacy=m.policy.snapshot_hours===3 && m.policy.reference_hours===9 && m.policy.qpe_hours===3;
        const extended=passNumber===2 && m.policy.snapshot_hours===9 && m.policy.reference_hours===15 && m.policy.qpe_hours===6;
        if (!legacy && !extended) throw Error('FFG freshness policy mismatch');
        if (!m.active) return;
        const a=m.active, l=a.legend;
        if(a.pass_number!==passNumber)throw Error('QPE pass mismatch');
        if (qpeFFGDisplayState(m,now()).state === 'unavailable' || Date.parse(a.ffg_reference)>Date.parse(a.ffg.snapshot_time) || Date.parse(a.ffg.snapshot_time)>Date.parse(a.qpe_end)) throw Error('Invalid FFG time contract');
        if (l?.crs !== 'EPSG:3857' || JSON.stringify(l.bounds_wsen)!=='[-126,24,-66,50]' || l.units!=='percent of FFG' || l.resampling!=='nearest') throw Error('Invalid FFG projection');
        if (!Array.isArray(l.class_upper_edges) || !Array.isArray(l.colors_rgb) || l.colors_rgb.length!==l.class_upper_edges.length+1 || !l.class_upper_edges.every((v,i,x)=>Number.isFinite(v)&&v>0&&(!i||v>x[i-1])) || !l.colors_rgb.every(c=>Array.isArray(c)&&c.length===3&&c.every(v=>Number.isInteger(v)&&v>=0&&v<=255))) throw Error('Invalid FFG legend');
        if (!a.generation || !hours.every(h => a.assets?.[h]?.duration_hours===Number(h.slice(-1)) && a.assets[h].method===h.slice(0,-1) && /^[a-f0-9]{64}$/.test(a.assets[h].sha256) && a.assets[h].path.startsWith(`generations/${a.generation}/`) && !a.assets[h].path.includes('..'))) throw Error('Invalid FFG asset contract');
        if (metadata?.active?.generation === a.generation && JSON.stringify(metadata.policy)!==JSON.stringify(m.policy)) throw Error('Immutable FFG policy changed');
        if (metadata?.active?.generation === a.generation && ['assets','legend','qpe_end','ffg','ffg_reference','paired_at','live_age_deadline'].some(key=>JSON.stringify(metadata.active[key])!==JSON.stringify(a[key]))) throw Error('Immutable FFG generation changed');
        if (metadata?.active && Date.parse(a.qpe_end)<Date.parse(metadata.active.qpe_end)) throw Error('Regressing FFG product');
    }
    async function refresh() {
        if (busy) return; busy=true;
        const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),30000), staged=[];
        try {
            const url=new URL(metadataURL,document.baseURI); url.searchParams.set('_check',String(now()));
            const response=await fetch(url,{cache:'no-store',signal:controller.signal});
            if (!response.ok) throw Error('FFG metadata unavailable');
            const next=await response.json();validate(next);
            if (next.active && qpeFFGDisplayState(next,now()).visible && next.active.generation!==loadedGeneration) {
                // Wait for every download, hash, and decode before changing anything on the map.
                const results=[];
                for (const h of hours) { try {
                    const value=await (async()=>{
                    const asset=next.active.assets[h], assetURL=new URL(asset.path,new URL('.',url));
                    const r=await fetch(assetURL,{signal:controller.signal});if(!r.ok)throw Error('FFG image unavailable');
                    const data=await r.arrayBuffer(), hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
                    if(hash!==asset.sha256)throw Error('FFG image checksum mismatch');
                    const blob=new Blob([data],{type:'image/png'});
                    const decoded=await createImageBitmap(blob);
                    const correct=decoded.width===4000 && decoded.height===2538;decoded.close();
                    if(!correct)throw Error('Invalid QPE FFG image dimensions');
                    const blobURL=URL.createObjectURL(blob);staged.push(blobURL);
                    return [h,L.imageOverlay(blobURL,[[24,-126],[50,-66]],{pane,opacity:layers[h].options.opacity,interactive:false,className:'qpe-ffg-raster'})];
                    })();results.push({status:'fulfilled',value});
                } catch(reason) {results.push({status:'rejected',reason});break;} }
                const error=results.find(r=>r.status==='rejected');if(error)throw error.reason;
                hours.forEach(h=>layers[h].clearLayers());
                results.forEach(r=>{images[r.value[0]]=r.value[1];});
                loadedGeneration=next.active.generation;
                const old=objectURLs;objectURLs=staged.splice(0);old.forEach(u=>URL.revokeObjectURL(u));
            }
            // An unavailable upstream pointer must not discard a still-valid local generation.
            if (!next.active && metadata?.active) {failed=true;} else {metadata=next;failed=false;}
        } catch(error) {failed=true;console.warn('QPE FFG refresh retained prior validated product:',error.message);}
        finally {staged.forEach(u=>URL.revokeObjectURL(u));clearTimeout(timeout);busy=false;sync();}
    }
    function legendHTML() {
        const keys=selected();if(!keys.length)return '';
        const s=state(),a=metadata?.active,key=keys[0],h=Number(key.slice(-1)),fine=key.startsWith('fine');
        let html=`<div class="rfc-ffg-card qpe-ffg-card"><strong>${h}-hour observed rainfall / FFG · Pass ${passNumber}</strong><div>${passNumber===1?'Latest rainfall · primary real-time view':'Refined rainfall · additional gauge information'}</div><div>${fine?'MRMS QPE · ~1 km grid':'QPE averaged onto FFG grid · comparison'}</div><b>${esc(s.label)}</b>`;
        if(a){
            const timing=qpeFFGTimingSummary(metadata,now());
            if(timing)html+=`<p class="qpe-rainfall-through"><strong>${esc(timing.through)}</strong><br>${esc(timing.age)} · ${h}-hour accumulation<br>${esc(timing.guidance)}</p>`;
            const l=a.legend,e=l.class_upper_edges;
            html+='<div>Percent of paired RFC guidance (%)</div>';
            l.colors_rgb.forEach((c,i)=>{const label=i===0?`0 to < ${e[0]}`:i===e.length?`≥ ${e[i-1]}`:`${e[i-1]} to < ${e[i]}`;html+=`<div><i class="rfc-ffg-swatch" style="background:rgb(${c.join(',')})"></i>${esc(label)}%</div>`;});
            html+=`<p>Rainfall: ${esc(utc(new Date(Date.parse(a.qpe_end)-h*3600000).toISOString()))} – ${esc(utc(a.qpe_end))}<br>FFG snapshot: ${esc(utc(a.ffg.snapshot_time))}<br>FFG reference cycle: ${esc(utc(a.ffg_reference))}<br>Pair fixed: ${esc(utc(a.paired_at))}<br>Last check: ${esc(utc(metadata.last_attempt?.at))}<br>Hidden at: ${esc(utc(new Date(s.expires).toISOString()))}</p>`;
            if(passNumber===2)html+='<p>Pass 2 refines earlier rainfall using additional gauge information; it may end earlier than the latest Pass 1. Compare revisions only for the same rainfall window and paired guidance. More gauges do not guarantee greater accuracy everywhere.</p>';
            html+='<p>Window-fixed guidance may differ from the latest RFC FFG layer. Fine QPE does not add FFG detail. Not flood probability or remaining rainfall capacity. Transparent = unavailable.</p>';
        }
        return html+'</div>';
    }
    function setBorders(geojson) {
        if(borders&&map.hasLayer(borders))map.removeLayer(borders);
        borders=L.layerGroup([
            L.geoJSON(geojson,{pane:'mapReference',interactive:false,style:{color:'#101820',weight:2.6,opacity:.85,fill:false}}),
            L.geoJSON(geojson,{pane:'mapReference',interactive:false,style:{color:'#fff',weight:1,opacity:.9,fill:false}})
        ]);sync();
    }
    map.on('layeradd layerremove',e=>{if(hours.some(h=>layers[h]===e.layer))sync();});
    const timer=setInterval(sync,30000),poll=setInterval(refresh,300000);
    // Initial refresh runs after the dashboard's synchronous initialization.
    setTimeout(refresh,0);
    return {layers,refresh,legendHTML,setBorders,getState:state,getMetadata:()=>metadata,sync,stop:()=>{clearInterval(timer);clearInterval(poll);}};
};
