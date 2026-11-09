// سنجشِ صفحهٔ سروا پلاس: آیا صفحهٔ کامل (قهرمان، چرخِ «چطور کار می‌کند»،
// برچسب‌هایِ مدار، قیمت‌ها) رندر می‌شود؟ پیش از این `PlusScrollPage` ساخته
// شده بود ولی هیچ‌جا به کار نرفته بود و /plus فقط یک تیتر نشان می‌داد.
// کاربرد: node scripts/_pluschk.mjs
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = '/home/user/Teraaz/sarva'
const dom = new JSDOM(`<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/plus', pretendToBeVisual: true })
const { window } = dom
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }))
class N { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
window.MutationObserver = N
window.scrollTo = () => {}
window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
for (const pp of [window.SVGElement, window.SVGPathElement]) if (pp && !pp.prototype.getTotalLength) { pp.prototype.getTotalLength = () => 100; pp.prototype.getPointAtLength = () => ({ x: 0, y: 0 }) }
if (!window.document.fonts) Object.defineProperty(window.document, 'fonts', { value: { ready: Promise.resolve(), add() {}, delete() {}, check: () => true, load: () => Promise.resolve([]) }, configurable: true })
class IO { constructor(cb) { this.cb = cb } observe(el) { setTimeout(() => this.cb([{ isIntersecting: true, target: el }], this), 0) } unobserve() {} disconnect() {} takeRecords() { return [] } }
window.IntersectionObserver = IO
class RO { constructor(cb) { this.cb = cb } observe(el) { setTimeout(() => this.cb([{ contentRect: { width: 1200, height: 400 }, target: el }], this), 0) } unobserve() {} disconnect() {} }
window.ResizeObserver = RO
if (!window.crypto?.randomUUID) { window.crypto = window.crypto || {}; let n = 0; window.crypto.randomUUID = () => `u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','ResizeObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) {
  if (window[k] !== undefined) { try { globalThis[k] = window[k] } catch {} }
}
globalThis.window = window; globalThis.document = window.document; globalThis.self = window
globalThis.ResizeObserver = RO
if (typeof window.Element.prototype.animate !== 'function') window.Element.prototype.animate = () => ({ cancel() {}, finish() {}, play() {}, pause() {}, reverse() {}, commitStyles() {}, persist() {}, finished: Promise.resolve(), onfinish: null, currentTime: 0, playState: 'finished', effect: { getComputedTiming: () => ({}) } })

const server = await createServer({ configFile: path.join(root, 'vite.config.ts'), root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise(r => setTimeout(r, 3000))
/* گره‌هایِ متنیِ هم‌سایه را یکی می‌کند: «برای » + «۳۰» + « روز» در برنامه سه
   گره است و در سایت یک گره، وگرنه در نمایش هیچ فرقی ندارند. */
const collect = (el, out) => { out.push('SKEL') }  /* unused */
const collectOld = (el, out) => {
  let buf = []
  const flush = () => {
    const t = buf.join('').trim().replace(/\s+/g, ' ')
    if (t) out.push(t)
    buf = []
  }
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === 3) buf.push(n.textContent || '')
    else if (n.nodeType === 1) { flush(); collect(n, out) }
  }
  flush()
}

const out = []
const walkSkel = (el, depth) => {
  const kids = Array.from(el.children || [])
  for (const n of kids) {
    const tag = n.tagName.toLowerCase()
    if (tag === 'svg' || tag === 'script' || tag === 'style') { out.push('svg'); continue }
    let cls = (n.className && typeof n.className === 'string') ? n.className.split(/\s+/)[0] : ''
    let c = cls
    const mA = /^([a-z0-9-]+)__[A-Za-z0-9_-]+__(.+)$/.exec(cls)
    const mB = /^_(.+)_[A-Za-z0-9]{4,}_\d+$/.exec(cls)
    if (mA) c = mA[2]
    else if (mB) c = mB[1]
    out.push(tag + (c ? '.' + c : ''))
    walkSkel(n, depth + 1)
  }
}
walkSkel(window.document.getElementById('root') || window.document.body, 0)
fs.writeFileSync('/tmp/port_skel.txt', out.join('\n'))

process.exit(0)
