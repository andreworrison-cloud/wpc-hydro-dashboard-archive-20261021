/* Contract/failure-path tests; browser visual qualification is separate. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{webcrypto,createHash}=require('node:crypto');
require('../sport_change_layer.js');
const {displayState,validate}=globalThis.SPoRTChange;
const fixture=JSON.parse(fs.readFileSync('review/h7/change_ingest_evidence.json')),valid=Date.parse(fixture.active.valid_time),fresh=()=>structuredClone(fixture);
test('live three-product evidence validates',()=>assert.doesNotThrow(()=>validate(fixture)));
for(const [hours,state,visible] of [[47.99,'available',true],[48,'aging',true],[72,'expired',false],[-1,'future',false]])test(`freshness at ${hours} hours`,()=>{const s=displayState(fixture,valid+hours*3600000);assert.equal(s.state,state);assert.equal(s.visible,visible);});
for(const [name,change] of [
 ['missing native',m=>delete m.active.products.deep14day],
 ['wrong baseline',m=>m.active.products.shallow24h.start_time='2026-10-16T00:00:00Z'],
 ['wrong units',m=>m.active.units='percent'],
 ['wrong origin',m=>m.active.products.deep7day.origin='derived_endpoint_difference'],
 ['wrong source time',m=>m.active.products.shallow24h.sources[0].valid_time=m.active.valid_time],
 ['unsigned palette',m=>m.active.products.deep7day.image.palette='sport-rsm-v1'],
 ['unsafe path',m=>m.active.products.deep7day.image.path='../bad.png'],
 ['wrong depth',m=>m.active.products.shallow24h.depth_cm=[0,200]]
])test(`rejects ${name}`,()=>{const m=fresh();change(m);assert.throws(()=>validate(m));});
test('baseline age and retrieval cannot reset end-time expiry',()=>{const m=fresh();m.last_attempt.at=new Date(valid+74*3600000).toISOString();assert(displayState(m,valid+20*3600000).visible);assert(!displayState(m,valid+74*3600000).visible);});
function harness(){
 const group=()=>({options:{},items:new Set(),eachLayer(f){this.items.forEach(f);},hasLayer(l){return this.items.has(l);},addLayer(l){this.items.add(l);return this;},clearLayers(){this.items.clear();},addTo(m){m.addLayer(this);return this;}});
 const map={items:new Set(),pane:{style:{}},handlers:[],createPane(){},getPane(){return this.pane;},hasLayer(l){return this.items.has(l);},on(e,f){this.handlers.push(f);},addLayer(l){this.items.add(l);this.handlers.forEach(f=>f({layer:l}));},removeLayer(l){this.items.delete(l);this.handlers.forEach(f=>f({layer:l}));}};
 let clock=valid+20*3600000,meta=fresh(),failure=null;const bytes=new TextEncoder().encode('test image bytes'),hash=createHash('sha256').update(bytes).digest('hex');Object.values(meta.active.products).forEach(p=>p.image.sha256=hash);
 const ctx={URL,Blob,AbortController,crypto:webcrypto,console:{warn(){}},document:{baseURI:'https://example.test/'},setInterval(){return 1;},clearInterval(){},setTimeout(){return 1;},clearTimeout(){},
 Image:class{naturalWidth=4000;naturalHeight=2538;async decode(){if(failure==='dimensions')this.naturalWidth=1808;}},
 L:{layerGroup:group,geoJSON:()=>({}),imageOverlay:(url,bounds,options)=>({url,bounds,options,setOpacity(v){this.options.opacity=v;}})},
 fetch:async url=>{if(String(url).includes('metadata.json')){if(failure==='metadata')throw Error('offline');return {ok:true,json:async()=>structuredClone(meta)};}return {ok:!(failure==='image'&&String(url).includes('deep14day')),arrayBuffer:async()=>bytes.buffer};}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('sport_change_layer.js','utf8'),ctx);const adapter=ctx.SPoRTChange.create({map,metadataURL:'review/sport-suite/metadata.json',now:()=>clock});
 return {adapter,map,setClock:v=>clock=v,setFailure:v=>{failure=v;if(v==='hash')meta.active.products['shallow24h'].image.sha256='0'.repeat(64);},next(){meta.active.generation=meta.active.generation.replace(/-[a-f0-9]{20}-/,'-aaaaaaaaaaaaaaaaaaaa-');Object.entries(meta.active.products).forEach(([key,p])=>p.image.path=`generations/${meta.active.generation}/${key}.png`);}};
}

test('all product controls show periods, provenance and signed units',async()=>{const h=harness(),a=h.adapter;await a.refresh();for(const key of ['shallow24h','deep7day','deep14day']){h.map.addLayer(a.layers[key]);assert(a.legendHTML().includes('Period:'));assert(a.legendHTML().includes('percentage points'));assert(a.legendHTML().includes('Source modified:'));assert(a.legendHTML().includes(key==='shallow24h'?'Derived from exact-date':'NASA native'));if(key==='deep14day')assert(a.legendHTML().includes('Secondary context'));h.map.removeLayer(a.layers[key]);}});
test('borders, opacity and exact expiry',async()=>{const h=harness(),a=h.adapter;await a.refresh();h.map.addLayer(a.layers.shallow24h);a.setBorders({});assert.equal(h.map.items.size,2);a.layers.shallow24h.setOpacity(.4);assert.equal([...a.layers.shallow24h.items][0].options.opacity,.4);h.setClock(valid+72*3600000);a.sync();Object.values(a.layers).forEach(l=>assert.equal(l.items.size,0));});
for(const failure of ['metadata','image','dimensions','hash'])test(`${failure} outage retains all images then expires`,async()=>{const h=harness(),a=h.adapter;await a.refresh();const before=a.getMetadata(),images=Object.values(a.layers).map(l=>[...l.items][0]);h.next();h.setFailure(failure);await a.refresh();assert.equal(a.getMetadata(),before);assert.equal(a.getState().state,'retained');Object.values(a.layers).forEach((l,i)=>assert.equal([...l.items][0],images[i]));h.setClock(valid+72*3600000);a.sync();assert(!a.getState().visible);});
test('H7 production controls and review override are mutually exclusive with SPoRT',()=>{const source=fs.readFileSync('app.js','utf8');assert(source.includes("get('h7Review') === '1'"));assert(source.includes("sportDataRoot + 'change/metadata.json'"));assert(!source.includes('const sportChange = h7Review ?')); const fn=source.match(/function enforceExclusiveSPoRTSelection\(activeEntry\) \{[\s\S]*?\n\}/)[0];const entries=['sport-rsm-10','sport-suite-200','sport-change-shallow24h','sport-change-deep7day','sport-change-deep14day','nwm-soilsat'].map(id=>({id}));for(const selected of entries.slice(0,-1)){const disabled=[],ctx={getAllDashboardLayerEntries:()=>entries,setDashboardLayerActive:e=>disabled.push(e.id)};vm.createContext(ctx);vm.runInContext(fn,ctx);ctx.enforceExclusiveSPoRTSelection(selected);assert.equal(disabled.length,4);assert(!disabled.includes('nwm-soilsat'));assert(!disabled.includes(selected.id));}});
