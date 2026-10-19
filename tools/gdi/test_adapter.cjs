const assert=require('node:assert/strict');
require('../../gdi_layer.js');
const m={schema_version:1,crs:'EPSG:3857',width:2400,height:1360,resampling:'nearest',generation:'2026101819-123456789abc-v1',bounds:[[24,-125],[50,-66]],cycle:'2026-10-18T19:00:00+00:00',valid_times:Array.from({length:7},(_,h)=>new Date(Date.parse('2026-10-18T19:00Z')+h*3600000).toISOString()),assets:{}};
for(let h=0;h<7;h++)for(const p of ['gdi','numbers','coverage30','coverage40','coverage50'])m.assets[`${p}_${h}`]={path:`generations/${m.generation}/${p}_${h}.png`,sha256:'0'.repeat(64)};
for(const p of ['persistence','longest'])for(const t of [30,40,50])m.assets[`${p}${t}`]={path:`generations/${m.generation}/${p}${t}.png`,sha256:'0'.repeat(64)};
HRRRGDI.validate(m);
for(const mutate of [x=>delete x.assets.gdi_6,x=>x.valid_times[6]=x.valid_times[5],x=>x.assets.gdi_0.path='../bad.png',x=>x.bounds[1][0]=51,x=>x.assets.gdi_0.sha256='bad']){const bad=structuredClone(m);mutate(bad);assert.throws(()=>HRRRGDI.validate(bad));}
const changed=structuredClone(m);changed.resampling='bilinear';assert.throws(()=>HRRRGDI.validate(changed,m));
console.log('GDI adapter rejects incomplete windows, invalid projection, unsafe assets and corrupt checksums');
