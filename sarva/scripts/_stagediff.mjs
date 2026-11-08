// مقایسه‌ی ساختاریِ وزن‌یاب: درختِ DOMِ صفحه‌ی واقعی (MHTML) در برابرِ درختِ
// پورت. متن به‌تنهایی کافی نیست — کلاس‌ها، ترتیب و تگ‌ها هم باید یکی باشند.
// کاربرد: node scripts/_struct.mjs
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const SOURCES = '/home/user/sarva-sources'
const root = '/home/user/Teraaz/sarva'

/* ── ۱) صفحه‌ی واقعی ─────────────────────────────────────────────── */

/* ── ۲) پورت ─────────────────────────────────────────────────────── */
const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/vazn-yab', pretendToBeVisual: true }
)
const { window } = dom
window.matchMedia =
  window.matchMedia ||
  ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }))
class N {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
window.IntersectionObserver = N
window.MutationObserver = N
window.scrollTo = () => {}
window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function')
  window.Element.prototype.animate = () => ({ cancel(){}, finish(){}, play(){}, pause(){}, reverse(){}, commitStyles(){}, persist(){}, finished: Promise.resolve(), onfinish: null, currentTime: 0, playState: 'finished', effect: { getComputedTiming: () => ({}) } })
for (const p of [window.SVGElement, window.SVGPathElement])
  if (p && !p.prototype.getTotalLength) {
    p.prototype.getTotalLength = () => 100
    p.prototype.getPointAtLength = () => ({ x: 0, y: 0 })
  }
if (!window.crypto?.randomUUID) { window.crypto = window.crypto || {}; let n = 0; window.crypto.randomUUID = () => `u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','ResizeObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) {
  if (window[k] !== undefined) { try { globalThis[k] = window[k] } catch {} }
}
globalThis.window = window
globalThis.document = window.document
globalThis.self = window
class RO {
  constructor(cb) { this.cb = cb }
  observe(el) { setTimeout(() => this.cb([{ contentRect: { width: 974, height: 300 }, target: el }], this), 0) }
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = RO
globalThis.ResizeObserver = RO

const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise((r) => setTimeout(r, 2600))
const port = window.document


// ── مقایسه‌ی صحنه‌ی تقطیع ──────────────────────────────────────────
const liveDoc = new JSDOM(fs.readFileSync(path.join(SOURCES, 'vazn-yab-live.html'), 'utf8')).window.document
const portDoc = window.document

function stageOf(doc) {
  const host = doc.querySelector('[data-vy-stage]')
  if (!host) return null
  const svg = host.querySelector('svg')
  return {
    h: host.style.height,
    viewBox: svg?.getAttribute('viewBox'),
    paths: [...(svg?.querySelectorAll('path') || [])].map(p => ({
      d: p.getAttribute('d'),
      dash: p.getAttribute('stroke-dasharray'),
      off: p.getAttribute('stroke-dashoffset'),
      w: p.getAttribute('stroke-width'),
    })),
    texts: [...(svg?.querySelectorAll('text') || [])].map(t => t.textContent),
    ballR: svg?.querySelector('circle')?.getAttribute('r'),
  }
}

const A = stageOf(liveDoc), B = stageOf(portDoc)
if (!A || !B) { console.log('صحنه پیدا نشد', !!A, !!B); await server.close(); process.exit(1) }

console.log('ارتفاعِ واقعی:', A.h, '| پورت:', B.h)
console.log('viewBox واقعی:', A.viewBox, '| پورت:', B.viewBox)
console.log('شعاعِ توپ واقعی:', A.ballR, '| پورت:', B.ballR)
console.log('تعدادِ مسیر واقعی:', A.paths.length, '| پورت:', B.paths.length)
console.log('تعدادِ متن واقعی:', A.texts.length, '| پورت:', B.texts.length)
console.log()
console.log('ارکانِ واقعی :', A.texts.join(' '))
console.log('ارکانِ پورت  :', B.texts.join(' '))
console.log('ارکان یکی است؟', A.texts.join(' ') === B.texts.join(' '))
console.log()

// مقایسه با تلورانس: snapshot در میانه‌ی انیمیشن ذخیره شده، پس لرزشِ بسیار
// کوچکی در اعدادِ واقعی هست که در حالتِ ایستایِ پورت نیست.
const nums = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
let exact = 0, close = 0
let worst = 0
for (let i = 0; i < Math.min(A.paths.length, B.paths.length); i++) {
  if (A.paths[i].d === B.paths[i].d) { exact++; continue }
  const a = nums(A.paths[i].d), b = nums(B.paths[i].d)
  if (a.length !== b.length) { console.log(`مسیر ${i}: تعدادِ عدد فرق دارد`); continue }
  let maxDiff = 0
  for (let k = 0; k < a.length; k++) maxDiff = Math.max(maxDiff, Math.abs(a[k] - b[k]))
  worst = Math.max(worst, maxDiff)
  if (maxDiff < 1e-6) close++
  else console.log(`مسیر ${i}: بیشینه اختلاف ${maxDiff}`)
}
console.log(`مسیرها: ${exact} دقیقاً یکسان، ${close} یکی با تلورانس، مجموع ${Math.min(A.paths.length, B.paths.length)}`)
console.log(`بیشینه اختلافِ عددی: ${worst.toExponential(2)} (لرزشِ زنده در snapshot)`)
const attrSame = A.paths.length === B.paths.length &&
  A.paths.every((p, i) => p.dash === B.paths[i].dash && p.w === B.paths[i].w)
console.log('ویژگی‌هایِ مسیر (dasharray, stroke-width) یکسان؟', attrSame)
await server.close()
