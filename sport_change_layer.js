/* H7 signed-change review adapter; exact periods, atomic image swaps and clock expiry. */
(function (root) {
    const depths = ['shallow24h','deep7day','deep14day'];
    const specs={shallow24h:{depth:10,days:1,title:'24-hour shallow RSM change',origin:'derived_endpoint_difference'},deep7day:{depth:200,days:7,title:'7-day deep RSM change',origin:'NASA_native_change'},deep14day:{depth:200,days:14,title:'14-day deep RSM change · Secondary context',origin:'NASA_native_change'}};
    const colors = ['#6f3b16','#98541f','#bd793e','#d8aa72','#ecd3ae','#f6f5ee','#cce9ee','#94cddc','#55a8c6','#267ba8','#125479'];
    const edges = [-100,-20,-10,-5,-2,-1,1,2,5,10,20,100];
    const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const utc = value => Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().replace('T',' ').replace(/\.\d{3}Z$/,'Z') : 'Unavailable';
    function displayState(metadata, now = Date.now(), failed = false) {
        const a = metadata?.active, time = Date.parse(a?.valid_time), age = (now-time)/3600000;
        if (!a || !Number.isFinite(age)) return {visible:false, state:'unavailable', label:'Unavailable — no validated suite'};
        if (age < 0) return {visible:false, state:'future', label:'Hidden — invalid future valid time'};
        if (age >= 72) return {visible:false, state:'expired', age, label:'Expired—awaiting newer data (hidden at 72 hours)'};
        const retained = failed || metadata.last_attempt?.ok === false;
        return {visible:true, age, state:retained?'retained':age>=48?'aging':'available',
            label:(retained?'Retained previous suite · ':'')+(age>=48?'Aging soil-moisture data':'Within dashboard age limit')+` · ${age.toFixed(1)} h old`};
    }
    function validate(metadata, previous) {
        if(metadata?.schema_version!==1 || metadata.policy?.warn_age_hours!==48 || metadata.policy?.expire_age_hours!==72 || metadata.policy?.status!=='approved_h7_policy_v1')throw Error('H7 policy mismatch');
        const a=metadata.active;if(!a)return;
        if(a.quantity!=='relative_soil_moisture_change'||a.units!=='percentage_points'||a.render_revision!=='sport-change-v1')throw Error('H7 definition mismatch');
        if(!Number.isFinite(Date.parse(a.valid_time))||!/^\d{8}-[a-f0-9]{20}-sport-change-v1$/.test(a.generation))throw Error('Invalid H7 generation');
        if(Object.keys(a.products||{}).sort().join(',')!==[...depths].sort().join(','))throw Error('Incomplete H7 suite');
        let bounds;
        depths.forEach(key=>{
            const p=a.products[key],spec=specs[key],i=p.image;
            if(JSON.stringify(p.depth_cm)!==JSON.stringify([0,spec.depth])||p.valid_time!==a.valid_time||Date.parse(p.valid_time)-Date.parse(p.start_time)!==spec.days*86400000||p.origin!==spec.origin)throw Error('H7 period/depth/origin mismatch');
            if(p.secondary_context!==(key==='deep14day'))throw Error('H7 context mismatch');
            if(i?.crs!=='EPSG:3857'||i.width!==4000||i.height!==2538||i.resampling!=='bilinear'||i.mask_resampling!=='nearest'||i.palette!=='sport-change-v1')throw Error('H7 display contract mismatch');
            if(i.path!==`generations/${a.generation}/${key}.png`||!/^[a-f0-9]{64}$/.test(i.sha256))throw Error('Unsafe H7 image');
            if(!Array.isArray(p.sources)||p.sources.length!==(key==='shallow24h'?2:1)||p.sources.some(s=>!/^[a-f0-9]{64}$/.test(s.sha256)))throw Error('H7 source provenance missing');
            if(p.sources[p.sources.length-1].valid_time!==p.valid_time||(key==='shallow24h'&&p.sources[0].valid_time!==p.start_time))throw Error('H7 endpoint mismatch');
            const b=i.bounds;
            if(!Array.isArray(b)||b.length!==2||!b.every(x=>Array.isArray(x)&&x.length===2&&x.every(Number.isFinite))||b[0][0]<24||b[0][0]>26||b[1][0]<52||b[1][0]>54||b[0][1]<-126||b[0][1]>-124||b[1][1]<-68||b[1][1]>-66)throw Error('Invalid H7 bounds');
            if(bounds&&JSON.stringify(bounds)!==JSON.stringify(b))throw Error('H7 grids differ');bounds=b;
        });
        if(previous?.active){
            if(Date.parse(a.valid_time)<Date.parse(previous.active.valid_time))throw Error('Regressing H7 time');
            if(a.generation===previous.active.generation&&JSON.stringify(a)!==JSON.stringify(previous.active))throw Error('Immutable H7 generation changed');
        }
    }
    function create({map, metadataURL, onChange=()=>{}, now=()=>Date.now()}) {
        const layers={},images={};let metadata=null,loaded=null,busy=false,failed=false,objectURLs=[],borders=null;
        map.createPane('sportChange');map.getPane('sportChange').style.zIndex=342;
        depths.forEach(d=>{const group=L.layerGroup();group.options.opacity=1;
            group.setOpacity=v=>{group.options.opacity=v;group.eachLayer(l=>l.setOpacity(v));};layers[d]=group;});
        const state=()=>displayState(metadata,now(),failed);
        const selected=()=>depths.filter(d=>map.hasLayer(layers[d]));
        function sync(){const s=state();depths.forEach(d=>{
            if(s.visible&&images[d]&&!layers[d].hasLayer(images[d]))layers[d].addLayer(images[d]);
            if(!s.visible)layers[d].clearLayers();
        });
            if(borders){if(selected().length&&!map.hasLayer(borders))borders.addTo(map);if(!selected().length&&map.hasLayer(borders))map.removeLayer(borders);}onChange();
        }
        async function refresh(){if(busy)return;busy=true;
            const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000),staged=[];
            try{
                const url=new URL(metadataURL,document.baseURI);url.searchParams.set('_check',String(now()));
                const response=await fetch(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('SPoRT metadata unavailable');
                const next=await response.json();validate(next,metadata);
                if(next.active && Date.parse(next.active.valid_time)>now())throw Error('Future SPoRT valid time');
                if(next.active&&displayState(next,now()).visible&&next.active.generation!==loaded){
                    const results=await Promise.allSettled(depths.map(async d=>{
                        const asset=next.active.products[d].image;
                        const r=await fetch(new URL(asset.path,new URL('.',url)),{signal:controller.signal});if(!r.ok)throw Error('SPoRT image unavailable');
                        const data=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
                        if(hash!==asset.sha256)throw Error('SPoRT checksum mismatch');
                        const blobURL=URL.createObjectURL(new Blob([data],{type:'image/png'}));staged.push(blobURL);
                        const decoded=new Image();decoded.src=blobURL;await decoded.decode();
                        if(decoded.naturalWidth!==4000||decoded.naturalHeight!==2538)throw Error('SPoRT image dimensions mismatch');
                        return [d,L.imageOverlay(blobURL,asset.bounds,{pane:'sportChange',opacity:layers[d].options.opacity,interactive:false,className:'sport-change-raster'})];
                    }));
                    const error=results.find(r=>r.status==='rejected');if(error)throw error.reason;
                    depths.forEach(d=>layers[d].clearLayers());results.forEach(r=>{const [d,image]=r.value;image.setOpacity(layers[d].options.opacity);images[d]=image;});loaded=next.active.generation;
                    const old=objectURLs;objectURLs=staged.splice(0);old.forEach(u=>URL.revokeObjectURL(u));
                }
                if(!next.active&&metadata?.active)failed=true;else{metadata=next;failed=false;}
            }catch(error){failed=true;console.warn('SPoRT refresh retained prior validated suite:',error.message);}
            finally{staged.forEach(u=>URL.revokeObjectURL(u));clearTimeout(timeout);busy=false;sync();}
        }
        function legendHTML(){const ds=selected();if(!ds.length)return '';const s=state(),a=metadata?.active,key=ds[0],spec=specs[key];
            let html=`<div class="sport-suite-card"><strong>${esc(spec.title)}<br>NASA SPoRT-LIS · 0–${spec.depth} cm</strong><p><b>${esc(s.label)}</b></p><div>RSM change (percentage points)<br>Brown = drying · Blue = wetting</div>`;
            colors.forEach((color,i)=>{html+=`<div><i class="sport-suite-swatch" style="background:${color}"></i>${edges[i]} to ${edges[i+1]} pp${i===5?' · near zero':''}</div>`;});
            html+='<p>Missing data are transparent. Change is not rainfall, percentile change or flood probability. Compare with absolute RSM: drying soil can remain wet.</p>';
            if(a){const p=a.products[key];html+=`<div><b>Period: ${esc(utc(p.start_time))} → ${esc(utc(p.valid_time))}</b><br>Origin: ${key==='shallow24h'?'Derived from exact-date RSM endpoints':'NASA native change product'}</div>`;
                p.sources.forEach((source,i)=>{html+=`<p>${key==='shallow24h'?(i?'Ending':'Starting')+' source':'Native source'}<br>Source modified: ${esc(utc(source.http_modified_at))}<br>Retrieved: ${esc(utc(source.retrieved_at))}</p>`;});
                html+=`<div>Last ingest attempt: ${esc(utc(metadata.last_attempt?.at))}<br>Mode: ${esc(a.retrieval_mode)}<br>Display cutoff: ${esc(utc(new Date(Date.parse(a.valid_time)+72*3600000).toISOString()))}</div>`;}
            return html+'<p>Dashboard policy: warning at 48 h; hidden at 72 h, measured from the END of the comparison period. Nominal 3-km source; bilinear display adds no scientific resolution.</p></div>';
        }
        function setBorders(data){if(borders&&map.hasLayer(borders))map.removeLayer(borders);borders=L.layerGroup([
            L.geoJSON(data,{pane:'mapReference',interactive:false,style:{color:'#101820',weight:2.6,opacity:.85,fill:false}}),
            L.geoJSON(data,{pane:'mapReference',interactive:false,style:{color:'#fff',weight:1,opacity:.9,fill:false}})]);sync();}
        map.on('layeradd layerremove',e=>{if(depths.some(d=>layers[d]===e.layer))sync();});
        const timer=setInterval(sync,30000),poll=setInterval(refresh,300000);setTimeout(refresh,0);
        return {layers,refresh,legendHTML,setBorders,sync,getState:state,getMetadata:()=>metadata,stop:()=>{clearInterval(timer);clearInterval(poll);}};
    }
    root.SPoRTChange={depths,specs,displayState,validate,create};
})(typeof window==='undefined'?globalThis:window);
