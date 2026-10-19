const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=process.argv[2]||'.',fixture=process.argv[3],output=process.argv[4]||'/tmp/h8-browser-evidence';
(async()=>{
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1050}});
const originals={};for(const n of [1,2])originals[n]=JSON.parse(fs.readFileSync(path.join(fixture,`pass${n}/metadata.json`)));
let mode='good',errors=[];
await page.addInitScript(t=>{window.h8Now=t;Date.now=()=>window.h8Now;},Date.parse(originals[1].active.qpe_end)+75*60000);
page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
page.on('console',m=>{if(m.text().includes('refresh retained'))console.log(m.text());});
await page.route('**/*',async route=>{const u=new URL(route.request().url()),url=u.href;
 if(u.protocol==='blob:')return route.continue();
 if(url.includes('/review/qpe-ffg/')){
  const n=Number(url.match(/pass(\d)/)[1]);
  if(u.pathname.endsWith('metadata.json')){
   if(mode==='offline')return route.fulfill({status:503,body:'outage'});
   const m=structuredClone(originals[n]);
   if(mode==='partial'){m.active.generation='partial-generation';for(const a of Object.values(m.active.assets))a.path=`generations/partial-generation/${path.basename(a.path)}`;}
   return route.fulfill({json:m});
  }
  if(mode==='partial'&&u.pathname.endsWith('/fine6.png'))return route.fulfill({status:503,body:'partial batch'});
  const f=path.join(fixture,`pass${n}/generations/${originals[n].active.generation}`,path.basename(u.pathname));
  return route.fulfill({body:fs.readFileSync(f),contentType:'image/png'});
 }
 if(u.hostname==='h8.local'){
  const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);
  if(fs.existsSync(f)&&fs.statSync(f).isFile())return route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/json'});
  return route.fulfill({status:404,body:'not in fixture'});
 }
 if(url.includes('leaflet@1.9.4/dist/leaflet.js'))return route.fulfill({body:fs.readFileSync(path.join(root,'review/vendor/leaflet-1.9.4.js')),contentType:'application/javascript'});
 if(url.includes('leaflet@1.9.4/dist/leaflet.css'))return route.fulfill({body:fs.readFileSync(path.join(root,'review/vendor/leaflet-1.9.4.css')),contentType:'text/css'});
 if(url.includes('iso8601.min.js'))return route.fulfill({body:fs.readFileSync('/tmp/h8_iso.js'),contentType:'application/javascript'});
 if(url.includes('leaflet.timedimension.min.js'))return route.fulfill({body:fs.readFileSync('/tmp/h8_time.js'),contentType:'application/javascript'});
 if(url.includes('us-states.json'))return route.fulfill({body:fs.readFileSync(path.join(root,'review/vendor/us-states.json')),contentType:'application/json'});
 return route.fulfill({status:503,body:'Other services isolated during H8 integration test'});
});
await page.goto('https://h8.local/?h8Review=1');
try{await page.waitForFunction(()=>window.QPEFFG?.every(x=>x.getState().state==='current'),{timeout:15000});}catch(e){console.log(await page.evaluate(()=>({states:window.QPEFFG?.map(x=>x.getState()),title:document.title})));throw e;}
await page.evaluate(()=>getAllDashboardLayerEntries().forEach(e=>setDashboardLayerActive(e,false)));
for(const n of [1,2])for(const method of ['fine'])for(const h of [1,3,6]){
 const id=`qpe-ffg-${n}-${method}${h}`;
 await page.evaluate(id=>{setDashboardLayerActive(layerEntriesById.get(id),true);selectDashboardLayer(id);},id);
 assert.equal(await page.locator('.qpe-ffg-raster').count(),1);
 const legend=await page.locator('.qpe-ffg-card').innerText();assert.match(legend,new RegExp(`${h}-hour`));assert.match(legend,new RegExp(`Pass ${n}`));assert.match(legend,/FFG snapshot/);
}
await page.evaluate(()=>{setDashboardLayerActive(layerEntriesById.get('qpe-ffg-1-fine6'),true);selectDashboardLayer('qpe-ffg-1-fine6');QPEFFG[0].layers.fine6.setOpacity(.7);map.setView([26.5,-81],7);});
assert.equal(await page.locator('.qpe-ffg-raster').evaluate(x=>x.style.opacity),'0.7');
await page.waitForFunction(()=>document.querySelector('.qpe-ffg-raster')?.naturalWidth===4000);
const basemaps=await page.locator('#basemap-select option').evaluateAll(xs=>xs.map(x=>x.value));
for(const value of basemaps){await page.locator('#basemap-select').selectOption(value,{force:true});assert.equal(await page.locator('.qpe-ffg-raster').count(),1);}
await page.locator('#basemap-select').selectOption(basemaps[0],{force:true});
await page.screenshot({path:path.join(output,'h8-fine-florida.png')});
mode='partial';await page.evaluate(()=>QPEFFG[0].refresh());
assert.equal(await page.evaluate(()=>QPEFFG[0].getMetadata().active.generation),originals[1].active.generation);
assert.equal(await page.evaluate(()=>QPEFFG[0].getState().state),'retained');assert.equal(await page.locator('.qpe-ffg-raster').count(),1);
mode='offline';await page.evaluate(()=>QPEFFG[0].refresh());assert.equal(await page.evaluate(()=>QPEFFG[0].getState().state),'retained');
await page.evaluate(()=>{window.h8Now=QPEFFG[0].getState().expires;QPEFFG.forEach(x=>x.sync());});
assert.equal(await page.locator('.qpe-ffg-raster').count(),0);assert.match(await page.locator('.qpe-ffg-card').innerText(),/Expired/);
await page.screenshot({path:path.join(output,'h8-expired.png')});
assert.deepEqual(errors,[]);
fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({result:'passed',controls:6,opacity:true,partial_batch_retained:true,outage_retained:true,expiry_hides:true,page_errors:errors,basemap_controls_tested:basemaps.length,basemaps:'overlay retained through all background controls; external tiles isolated, not a live tile-provider test'},null,2));
console.log('6 dashboard controls, matching legends, opacity, partial batch retention, outage retention and expiration passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
