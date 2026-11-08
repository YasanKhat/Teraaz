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
  observe(el) { setTimeout(() => this.cb([{ contentRect: { width: 900, height: 300 }, target: el }], this), 0) }
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


for (const g of window.document.querySelectorAll('[role=radiogroup]')) {
  const btns = [...g.querySelectorAll('button[role=radio]')]
  console.log('LABEL:', g.getAttribute('aria-label'))
  btns.forEach((b, i) => console.log('   ', i, JSON.stringify(b.textContent.trim()), 'checked=', b.getAttribute('aria-checked')))
}
console.log('=== کارتِ انتخاب‌شده در وزن‌های مشهور ===')
for (const b of window.document.querySelectorAll('section[aria-labelledby="vy-meters"] button[aria-pressed="true"]')) {
  console.log('  ', b.querySelector('span.block.text-lg')?.textContent, '|', b.querySelector('span.mt-3')?.textContent)
}
await server.close()
