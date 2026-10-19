const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function scenario(named){
 const keys=named?['analysis','change']:['gdi','coverage','persistence','longest'];
 const cycle=new Date(Date.now()-3600000).toISOString(),generation=cycle.replace(/[-:]/g,'').slice(0,11).replace('T','')+'-aaaaaaaaaaaa-v1';
 const assets={};const add=k=>assets[k]={path:`generations/${generation}/${k}.png`,sha256:'a'.repeat(64)};
 if(named)keys.forEach(k=>{add(k);add(k+'_numbers');});else{for(let h=0;h<7;h++)for(const p of ['gdi','numbers','coverage30','coverage40','coverage50'])add(p+'_'+h);for(const p of ['persistence','longest'])for(const t of [30,40,50])add(p+t);}
 let m={schema:'gdi_named_suite_v1',schema_version:1,cycle,generation,width:2400,height:1360,crs:'EPSG:3857',resampling:'nearest',bounds:[[24,-125],[50,-66]],assets,overlay_type:'labeled_contours_v1',products:Object.fromEntries(keys.map(k=>[k,{label:k,valid_time:cycle,colors:['#000000','#ffffff'],edges:[0,1],legend:'test'}])),colors:['#000000'],coverage_colors:['#000000'],valid_times:Array.from({length:7},(_,h)=>new Date(Date.parse(cycle)+h*3600000).toISOString())};
 let failContour=true,failBase=false,hold=null,handlers={},listeners={},active=new Set(),revoked=[];
 const map={createPane(){},getPane(){return {style:{}};},hasLayer:g=>active.has(g),on(events,fn){events.split(' ').forEach(e=>handlers[e]=fn);},removeLayer(g){active.delete(g);handlers.layerremove({type:'layerremove',layer:g});},addLayer(g){active.add(g);handlers.layeradd({type:'layeradd',layer:g});}};
 const ctx={console,URL:{revokeObjectURL:u=>revoked.push(u)},Date,setInterval(){},document:{hidden:false,addEventListener:(n,f)=>listeners[n]=f},L:{layerGroup:()=>({options:{},images:[],clearLayers(){this.images=[];},eachLayer(f){this.images.forEach(f);}}),imageOverlay:(u,b,o)=>({addTo(g){g.images.push({u,setOpacity(){}});}})},GDIDisplay:{utc:t=>t,esc:String,scale:()=>'',controls:()=>'',metadata:async()=>structuredClone(m),image:async(meta,k)=>{if(hold)await hold;if(failBase&&!k.includes('numbers'))throw Error('base unavailable');if(failContour&&k.includes('numbers'))throw Error('contour unavailable');return meta.generation+'/'+k;}}};
 vm.runInNewContext(fs.readFileSync(named?'gdi_suite_layer.js':'gdi_layer.js','utf8'),ctx);
 const suite=(named?ctx.GDINamedSuite:ctx.HRRRGDI).create({map,metadataURL:'https://example.test/metadata.json',keys,paneName:'test'});await flush();
 map.addLayer(suite.layers[keys[0]]);await flush();
 assert.equal(suite.layers[keys[0]].images.length,1,'base remains visible if contours fail');
 assert.match(suite.legendHTML(),/Contours unavailable/);
 failContour=false;await suite.refresh();assert.equal(suite.layers[keys[0]].images.length,2,'same-generation retry restores contour');
 failBase=true;await suite.refresh(); // Normal unchanged refresh intentionally does not redraw.
 // Force a redraw via a contour toggle, exercising retained data after base failure.
 listeners.change({target:{dataset:named?{gdiSuite:'test'}:{gdiControl:'numbers'},checked:true}});await flush();
 assert.equal(suite.layers[keys[0]].images.length,2,'retain verified displayed field on failed update');assert.match(suite.legendHTML(),/retaining/);
 failBase=false;await suite.refresh();assert.doesNotMatch(suite.legendHTML(),/retaining/);
 let release;hold=new Promise(r=>release=r);listeners.change({target:{dataset:named?{gdiSuite:'test'}:{gdiControl:'numbers'},checked:true}});
 map.removeLayer(suite.layers[keys[0]]);map.addLayer(suite.layers[keys[1]]);release();hold=null;await flush();
 assert.equal(suite.layers[keys[0]].images.length,0,'late old request cannot overwrite new selection');assert.ok(suite.layers[keys[1]].images.length);
 if(named){m={...m,expires_at:new Date(Date.now()-1).toISOString(),generation:generation.replace('aaaaaaaaaaaa','bbbbbbbbbbbb')};for(const a of Object.values(m.assets))a.path=a.path.replace(generation,m.generation);await suite.refresh();assert.equal(suite.layers[keys[1]].images.length,0);assert.match(suite.legendHTML(),/window ended/);}
}
(async()=>{await scenario(true);await scenario(false);
 const ctx={URL,AbortController,setTimeout,clearTimeout,Date,fetch:async()=>{throw Error('network');}};vm.runInNewContext(fs.readFileSync('gdi_display.js','utf8'),ctx);
 let calls=0;ctx.fetch=async()=>{calls++;if(calls===1)return {ok:false,status:503};return {ok:true,json:async()=>({ok:true})};};assert.equal((await ctx.GDIDisplay.metadata('https://example.test/m.json')).ok,true);assert.equal(calls,2);
 const legend=ctx.GDIDisplay.scale(['#000000','#ffffff'],[0,100],'Support (%)');assert.match(legend,/left:50%/);assert.match(legend,/≥100/);
 console.log('GDI display tests passed: contour isolation/recovery, retained frames, selection races, expiry, transport retry, scale alignment.');
})().catch(e=>{console.error(e);process.exitCode=1;});
