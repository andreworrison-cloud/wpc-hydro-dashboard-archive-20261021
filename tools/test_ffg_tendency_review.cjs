const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(require('node:url').pathToFileURL(require('node:path').resolve('review/ffg-tendency/ffg_tendency_review.html')).href);
 for(const h of ['1','3','6'])for(const lag of ['6','12','24']){
  await page.selectOption('#duration',h);await page.selectOption('#lag',lag);
  await page.waitForFunction(()=>overlay.getElement().complete&&overlay.getElement().naturalWidth===4000);
  if(!await page.evaluate(()=>map.hasLayer(overlay)))throw Error('Missing overlay');
  if(!(await page.locator('#times').textContent()).includes(h+'-hour FFG'))throw Error('Duration label');
 }
 const alignment=await page.evaluate(()=>{let worst=0;const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));for(const zoom of [3,5,7]){map.setView([38,-98],zoom,{animate:false});const rect=overlay.getElement().getBoundingClientRect(),container=map.getContainer().getBoundingClientRect();for(const [lat,lon] of [[47,-122],[40,-105],[35,-90],[26,-80],[45,-69]]){const p=map.latLngToContainerPoint([lat,lon]);const x=rect.left-container.left+rect.width*(lon+126)/60,y=rect.top-container.top+rect.height*(merc(50)-merc(lat))/(merc(50)-merc(24));worst=Math.max(worst,Math.abs(x-p.x),Math.abs(y-p.y));}}return worst});
 if(alignment>1.5)throw Error('Misalignment '+alignment);
 await page.selectOption('#duration','3');await page.selectOption('#lag','24');await page.evaluate(()=>map.setView([38,-96],4,{animate:false}));await page.screenshot({path:'/tmp/ffg-tendency-browser.png',fullPage:true});
 if(errors.length)throw Error(errors.join(';'));
 const results={combinations:9,max_alignment_error_pixels:alignment,page_errors:errors};fs.writeFileSync('review/ffg-tendency/browser_checks.json',JSON.stringify(results,null,2)+'\n');console.log(results);await browser.close();
})();
