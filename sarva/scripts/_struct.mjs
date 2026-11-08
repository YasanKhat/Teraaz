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
const live = new JSDOM(fs.readFileSync(path.join(SOURCES, 'vazn-yab-live.html'), 'utf8')).window
  .document

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

/* ── ۳) مقایسه ───────────────────────────────────────────────────── */
const SKIP = new Set(['script', 'style', 'noscript', 'link', 'meta', 'head'])

/** فقط تگ و کلاس — نه متن، تا ساختار سنجیده شود. */
function sig(el) {
  const cls = (el.getAttribute('class') || '')
    .split(/\s+/)
    .filter((c) => c && !/^(vazn-yab-module__|_)/.test(c) && !/^[a-z]+_[0-9a-f]{6,}-module__/.test(c))
    .sort()
    .join(' ')
  return `<${el.tagName.toLowerCase()}${cls ? ' class="' + cls + '"' : ''}>`
}

function flatten(el, out = [], depth = 0) {
  for (const c of el.children) {
    const t = c.tagName.toLowerCase()
    if (SKIP.has(t)) continue
    out.push({ sig: sig(c), depth, tag: t })
    flatten(c, out, depth + 1)
  }
  return out
}

// وزن‌یاب از <main> شروع می‌شود
const liveMain = live.querySelector('main') || live.body
const portMain = port.querySelector('main') || port.getElementById('root')

const A = flatten(liveMain)
const B = flatten(portMain)

console.log('تعدادِ عنصر — واقعی:', A.length, ' پورت:', B.length)

// هم‌تراز کردنِ ساده: LCS روی امضاها
const n = A.length, m = B.length
const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
for (let i = n - 1; i >= 0; i--)
  for (let j = m - 1; j >= 0; j--)
    dp[i][j] = A[i].sig === B[j].sig ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])

console.log('عنصرِ مشترک (LCS):', dp[0][0], `(${(100 * dp[0][0] / Math.max(n, m)).toFixed(1)}%)`)

// تفاوت‌ها
const missing = [] // در واقعی هست، در پورت نیست
const extra = [] // در پورت هست، در واقعی نیست
let i = 0, j = 0
while (i < n && j < m) {
  if (A[i].sig === B[j].sig) { i++; j++; continue }
  if (dp[i + 1][j] >= dp[i][j + 1]) missing.push(A[i++])
  else extra.push(B[j++])
}
while (i < n) missing.push(A[i++])
while (j < m) extra.push(B[j++])

const show = (title, arr, limit = 40) => {
  console.log(`\n=== ${title} (${arr.length}) ===`)
  for (const e of arr.slice(0, limit)) console.log('  '.repeat(Math.min(e.depth, 8)) + e.sig)
  if (arr.length > limit) console.log(`  … و ${arr.length - limit} موردِ دیگر`)
}

show('در سایت هست، در پورت نیست', missing)
show('در پورت هست، در سایت نیست', extra)

// زمینه: ۳ عنصرِ پیش و پس از هر تفاوت
if (missing.length) {
  const idx = A.indexOf(missing[0])
  console.log('\n--- زمینه در سایت (پیرامونِ نخستین تفاوت) ---')
  A.slice(Math.max(0, idx - 3), idx + 4).forEach((e, k) =>
    console.log((k === 3 ? '>> ' : '   ') + '  '.repeat(Math.min(e.depth, 8)) + e.sig))
}
if (extra.length) {
  const idx = B.indexOf(extra[0])
  console.log('\n--- زمینه در پورت (پیرامونِ نخستین تفاوت) ---')
  B.slice(Math.max(0, idx - 3), idx + 4).forEach((e, k) =>
    console.log((k === 3 ? '>> ' : '   ') + '  '.repeat(Math.min(e.depth, 8)) + e.sig))
}

await server.close()
