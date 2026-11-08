// درختِ یک بخش از صفحه‌ی اصلی را از هر دو سو می‌نویسد، تا تفاوت دیده شود.
// کاربرد: node scripts/_homedump.mjs demos-title
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const want = process.argv[2] || 'demos-title'
const SOURCES = '/home/user/sarva-sources'
const root = '/home/user/Teraaz/sarva'

const liveDoc = new JSDOM(fs.readFileSync(path.join(SOURCES, 'home-live.html'), 'utf8')).window.document
for (const sel of ['header', 'footer', 'nav', 'script', 'style', 'noscript', 'template']) {
  liveDoc.querySelectorAll(sel).forEach((n) => n.remove())
}

const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/', pretendToBeVisual: true }
)
const { window } = dom
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false }))
class N { observe(){} unobserve(){} disconnect(){} takeRecords(){return []} }
window.IntersectionObserver = N; window.MutationObserver = N
window.scrollTo = () => {}; window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function') window.Element.prototype.animate = () => ({cancel(){},finish(){},play(){},pause(){},reverse(){},commitStyles(){},persist(){},finished:Promise.resolve(),onfinish:null,currentTime:0,playState:'finished',effect:{getComputedTiming:()=>({})}})
for (const p of [window.SVGElement, window.SVGPathElement]) if (p && !p.prototype.getTotalLength) { p.prototype.getTotalLength = () => 100; p.prototype.getPointAtLength = () => ({x:0,y:0}) }
if (!window.crypto?.randomUUID) { window.crypto = window.crypto||{}; let n=0; window.crypto.randomUUID=()=>`u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','ResizeObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) { if (window[k] !== undefined) { try { globalThis[k] = window[k] } catch {} } }
globalThis.window = window; globalThis.document = window.document; globalThis.self = window
class RO { constructor(cb){this.cb=cb} observe(el){setTimeout(()=>this.cb([{contentRect:{width:1200,height:400},target:el}],this),0)} unobserve(){} disconnect(){} }
window.ResizeObserver = RO; globalThis.ResizeObserver = RO

const server = await createServer({ configFile: path.join(root, 'vite.config.ts'), root, server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise((r) => setTimeout(r, 2600))
const port = window.document

const pick = (el) =>
  [...el.querySelectorAll('section')].find(
    (s) => (s.getAttribute('aria-labelledby') || s.getAttribute('aria-label')) === want
  )

const dehash = (c) => {
  let m = /-module__[A-Za-z0-9_-]{6,}__(.+)$/.exec(c)
  if (m) return m[1]
  m = /^_(.+)_[A-Za-z0-9]{5,}_\d+$/.exec(c)
  if (m) return m[1]
  return c
}
const normCls = (el) =>
  (el.getAttribute('class') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(dehash)
    .sort()
    .join(' ')

function tree(el, d = 0) {
  let out = ''
  for (const c of el.children) {
    const t = c.tagName.toLowerCase()
    if (['script','style','template','noscript'].includes(t)) continue
    const own = (c.childNodes.length && [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      ? ' «' + [...c.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 50) + '»'
      : ''
    const cls = normCls(c)
    const attrs = ['id','role','type','aria-selected','aria-controls','data-state','href']
      .map((a) => (c.getAttribute(a) ? ` ${a}=${c.getAttribute(a)}` : ''))
      .join('')
    out += '  '.repeat(d) + `<${t}${cls ? ' .' + cls.replace(/\s+/g, ' .') : ''}${attrs}>${own}\n`
    if (d < 6) out += tree(c, d + 1)
  }
  return out
}

for (const [name, doc] of [['واقعی', liveDoc], ['پورت', port]]) {
  const holder = name === 'واقعی' ? liveDoc.querySelector('main') || liveDoc.body : doc
  const s = pick(holder)
  console.log(`\n════ ${name} ════`)
  console.log(s ? tree(s) : '(یافت نشد)')
}
await server.close()
