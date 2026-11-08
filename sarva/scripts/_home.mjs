import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
const root = '/home/user/Teraaz/sarva'
const dom = new JSDOM(`<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`, { url: 'http://localhost/#/', pretendToBeVisual: true })
const { window } = dom
window.matchMedia = window.matchMedia || ((q)=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent:()=>false}))
class N { observe(){} unobserve(){} disconnect(){} takeRecords(){return[]} }
window.IntersectionObserver = N; window.ResizeObserver = N; window.MutationObserver = N
window.scrollTo = () => {}; window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function') window.Element.prototype.animate = () => ({cancel(){},finish(){},play(){},pause(){},reverse(){},commitStyles(){},persist(){},finished:Promise.resolve(),onfinish:null,currentTime:0,playState:'finished',effect:{getComputedTiming:()=>({})}})
for (const p of [window.SVGElement, window.SVGPathElement]) if (p && !p.prototype.getTotalLength) { p.prototype.getTotalLength = () => 100; p.prototype.getPointAtLength = () => ({x:0,y:0}) }
if (!window.crypto?.randomUUID) { window.crypto = window.crypto||{}; let n=0; window.crypto.randomUUID=()=>`u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','ResizeObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) { if (window[k]!==undefined) { try { globalThis[k]=window[k] } catch {} } }
globalThis.window = window; globalThis.document = window.document; globalThis.self = window
const server = await createServer({ configFile: path.join(root,'vite.config.ts'), root, server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise(r=>setTimeout(r,1500))
const d = window.document.getElementById('root')
console.log('section   :', d.querySelectorAll('section').length)
console.log('img       :', d.querySelectorAll('img').length)
console.log('svg       :', d.querySelectorAll('svg').length)
console.log('button    :', d.querySelectorAll('button').length)
console.log('a[href]   :', d.querySelectorAll('a[href]').length)
const imgs = [...d.querySelectorAll('img')].map(i=>i.getAttribute('src')||'')
const broken = imgs.filter(s=>!s || s==='null' || s==='undefined')
console.log('نمونه src :', imgs.slice(0,6).join(' | '))
console.log('src خراب  :', broken.length)
await server.close()
