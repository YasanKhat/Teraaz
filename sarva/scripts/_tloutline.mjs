// خط‌سیرِ درشتِ خط‌زمان را از هر دو سو می‌نویسد.
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
const root = '/home/user/Teraaz/sarva'
const liveDoc = new JSDOM(fs.readFileSync('/home/user/sarva-sources/timeline-live.html','utf8')).window.document
for (const sel of ['header','footer','nav','script','style','noscript','template']) liveDoc.querySelectorAll(sel).forEach(n=>n.remove())

const dom = new JSDOM(`<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,{url:'http://localhost/#/timeline',pretendToBeVisual:true})
const { window } = dom
window.matchMedia = window.matchMedia||((q)=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent:()=>false}))
class N { observe(){} unobserve(){} disconnect(){} takeRecords(){return[]} }
window.MutationObserver = N
window.scrollTo=()=>{}; window.Element.prototype.scrollIntoView=()=>{}
window.HTMLCanvasElement.prototype.getContext=()=>null
if (typeof window.Element.prototype.animate!=='function') window.Element.prototype.animate=()=>({cancel(){},finish(){},play(){},pause(){},reverse(){},commitStyles(){},persist(){},finished:Promise.resolve(),onfinish:null,currentTime:0,playState:'finished',effect:{getComputedTiming:()=>({})}})
for (const pp of [window.SVGElement, window.SVGPathElement]) if (pp && !pp.prototype.getTotalLength) { pp.prototype.getTotalLength=()=>100; pp.prototype.getPointAtLength=()=>({x:0,y:0}) }
if (!window.document.fonts) Object.defineProperty(window.document,'fonts',{value:{ready:Promise.resolve(),add(){},delete(){},check:()=>true,load:()=>Promise.resolve([])},configurable:true})
class IO { constructor(cb){this.cb=cb} observe(el){setTimeout(()=>this.cb([{isIntersecting:true,target:el}],this),0)} unobserve(){} disconnect(){} takeRecords(){return[]} }
window.IntersectionObserver = IO
if (!window.crypto?.randomUUID){window.crypto=window.crypto||{};let n=0;window.crypto.randomUUID=()=>`u-${++n}`}
globalThis.__SARVA_WEB__=true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','ResizeObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) { if (window[k]!==undefined) { try { globalThis[k]=window[k] } catch {} } }
globalThis.window=window; globalThis.document=window.document; globalThis.self=window
class RO { constructor(cb){this.cb=cb} observe(el){setTimeout(()=>this.cb([{contentRect:{width:1200,height:400},target:el}],this),0)} unobserve(){} disconnect(){} }
window.ResizeObserver=RO; globalThis.ResizeObserver=RO
const server = await createServer({ configFile: path.join(root,'vite.config.ts'), root, server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise(r=>setTimeout(r,2600))

const dehash=(c)=>{let m=/-module__[A-Za-z0-9_-]{6,}__(.+)$/.exec(c); if(m)return m[1]; m=/^_(.+)_[A-Za-z0-9]{5,}_\d+$/.exec(c); if(m)return m[1]; return c}
const cls=(el)=>(el.getAttribute('class')||'').split(/\s+/).filter(Boolean).map(dehash).sort().join(' ')
function out(el,d=0,maxD=2){
  let s=''
  for(const c of el.children){
    const t=c.tagName.toLowerCase()
    if(['script','style','template','noscript'].includes(t)) continue
    const own=[...c.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean).join(' ')
    const id=c.getAttribute('id')
    const aria=c.getAttribute('aria-labelledby')||c.getAttribute('aria-label')
    s+='  '.repeat(d)+`<${t}${id?' #'+id:''}${aria?' aria='+aria:''}${cls(c)?' .'+cls(c).replace(/\s+/g,' .'):''}>${own?' «'+own.slice(0,45)+'»':''}\n`
    if(d<maxD) s+=out(c,d+1,maxD)
  }
  return s
}
for(const [name,doc] of [['واقعی',liveDoc],['پورت',window.document]]){
  const m=doc.querySelector('main')||doc.getElementById('root')||doc.body
  console.log(`\n════════ ${name} ════════`)
  console.log(out(m,0,Number(process.env.DEPTH||2)))
}
process.exit(0)
