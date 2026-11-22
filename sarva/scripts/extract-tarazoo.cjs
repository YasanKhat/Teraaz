// Extract only the anonymous, server-rendered public concept bank from a saved
// /game/tarazoo HTML response. Does not collect accounts or API responses.
const fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const [source,target]=process.argv.slice(2);
if(!source||!target)throw Error('Usage: node extract-tarazoo.cjs source.html target.json');
const doc=new JSDOM(fs.readFileSync(source,'utf8')).window.document,chunks=[];
for(const script of doc.querySelectorAll('script'))if(script.textContent.includes('self.__next_f.push'))vm.runInNewContext(script.textContent,{self:{__next_f:{push:x=>chunks.push(x)}}},{timeout:1000});
const stream=chunks.map(c=>c[1]||'').join('');const banks=[];
function visit(x){if(!x||typeof x!=='object')return;if(Array.isArray(x.bank)&&x.bank.every(v=>typeof v.id==='string'&&Array.isArray(v.lines)))banks.push(x.bank);Object.values(x).forEach(visit)}
for(const line of stream.split('\n')){const i=line.indexOf(':');if(i<0)continue;try{visit(JSON.parse(line.slice(i+1)))}catch{}}
if(banks.length!==1||banks[0].length===0)throw Error(`Expected one public bank, found ${banks.length}`);
fs.writeFileSync(target,JSON.stringify(banks[0],null,2)+'\n');console.log(`Extracted ${banks[0].length} families`);
