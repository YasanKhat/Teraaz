// Anonymous, read-only collection of the exact public verse fields used by
// Taar. Fresh isolated browser context; never record headers, cookies, account
// responses, API URLs, or unrecognized fields from the response.
const { chromium }=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises');
const catalog=require('../../sarva/src/renderer/src/data/seeds/taar/public-catalog.json');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{const browser=await chromium.launch({headless:true});const result=[],errors=[];
try{const context=await browser.newContext({serviceWorkers:'block'});const page=await context.newPage();await page.goto('https://sarvaedu.ir/game/taar',{waitUntil:'domcontentloaded'});
for(let offset=0;offset<catalog.length;offset+=8){const keys=catalog.slice(offset,offset+8).map(x=>x.key);const response=await page.evaluate(async keys=>{try{const r=await fetch('/api/v1/taar/bayts?keys='+encodeURIComponent(keys.join(',')),{credentials:'omit'});return {status:r.status,body:await r.json()}}catch{return {status:0}}},keys);
if(response.status!==200 || response.body?.ok!==true || !Array.isArray(response.body?.data?.bayts)){errors.push({offset,status:response.status});break}
for(const b of response.body.data.bayts){if(!keys.includes(b.key)||!Array.isArray(b.hemis)||b.hemis.length!==2)throw Error('Unexpected public verse format');const hemis=b.hemis.map(h=>{if(typeof h.id!=='string'||typeof h.text!=='string'||!Array.isArray(h.syllables))throw Error('Unexpected hemistich format');return {id:h.id,text:h.text,syllables:h.syllables.map(s=>{if(typeof s.text!=='string'||typeof s.length!=='string'||typeof s.footStart!=='boolean'||typeof s.foot!=='number')throw Error('Unexpected syllable format');return {text:s.text,length:s.length,footStart:s.footStart,foot:s.foot}})}});if(typeof b.poet!=='string'||typeof b.meter!=='string'||typeof b.level!=='number')throw Error('Unexpected verse metadata');result.push({key:b.key,hemis,poet:b.poet,meter:b.meter,level:b.level})}
await delay(250)}
await context.close();await fs.mkdir('sarva-capture-output',{recursive:true});await fs.writeFile('sarva-capture-output/taar-public-bank.json',JSON.stringify({requested:catalog.length,bank:result,errors},null,2));await fs.writeFile('sarva-capture-output/manifest.json',JSON.stringify({routes:[],resources:{},errors}));console.log(`::notice title=TaarPublicBank::${result.length} verses; ${errors.length} request errors`);if(errors.length)process.exitCode=1;
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
