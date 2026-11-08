// مقایسه‌ی ساختاریِ صفحه‌ی اصلی: درختِ DOMِ واقعی (از HAR) در برابرِ درختِ
// پورت. متن کافی نیست — ۹۷٪ پوششِ متنی داشتیم در حالی که بخشِ «حامیان» در
// سایت اصلاً روی صفحه‌ی اصلی نبود. اینجا کلاس‌ها و ترتیب سنجیده می‌شود.
// کاربرد: node scripts/_homestruct.mjs
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const SOURCES = '/home/user/sarva-sources'
const root = '/home/user/Teraaz/sarva'

/* ── ۱) صفحه‌ی واقعی ─────────────────────────────────────────────── */
const liveDoc = new JSDOM(fs.readFileSync(path.join(SOURCES, 'home-live.html'), 'utf8')).window
  .document
// هدر و فوترِ مشترک را می‌اندازیم: آن‌ها جدا سنجیده می‌شوند
for (const sel of ['header', 'footer', 'nav', 'script', 'style', 'noscript']) {
  liveDoc.querySelectorAll(sel).forEach((n) => n.remove())
}

/* ── ۲) پورت ─────────────────────────────────────────────────────── */
const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/', pretendToBeVisual: true }
)
const { window } = dom
window.matchMedia =
  window.matchMedia ||
  ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }))
class N { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
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
  observe(el) { setTimeout(() => this.cb([{ contentRect: { width: 1200, height: 400 }, target: el }], this), 0) }
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
const SKIP = new Set(['script', 'style', 'noscript', 'link', 'meta', 'head', 'template'])

/** شناسه‌هایِ ساخته‌شده در زمانِ اجرا (رادیکس، نکست) هیچ‌گاه یکی نمی‌شوند. */
const GEN_ID = /^(radix-|__|_R_|:|B:)/

/**
 * نامِ محلیِ کلاس را از هر دو شیوه‌ی نام‌گذاری بیرون می‌کشد، تا دو طرف
 * هم‌سنج شوند:
 *   سایت (Next)  home-module__oe3DtG__hero  →  hero
 *   پورت (Vite)  _hero_v33d7_22             →  hero
 * پیش‌تر هر کلاسِ آغازیده با `_` انداخته می‌شد و برای همین پورت «بی‌کلاس»
 * به نظر می‌رسید — در حالی که کلاس‌ها بودند، فقط نام‌شان دیگر بود.
 */
const dehash = (c) => {
  let m = /-module__[A-Za-z0-9_-]{6,}__(.+)$/.exec(c)
  if (m) return m[1]
  m = /^_(.+)_[A-Za-z0-9]{5,}_\d+$/.exec(c)
  if (m) return m[1]
  return c
}

function sig(el) {
  const cls = (el.getAttribute('class') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(dehash)
    .sort()
    .join(' ')

  // آیکون‌ها: نسخه‌ی تازه‌ترِ lucide یک نامِ مستعار هم می‌افزاید
  // (`lucide-gamepad-2 lucide-gamepad2`)؛ نخستینِ مرتب‌شده همان نامِ اصلی است
  // و در سایت هم همان است.
  if (el.tagName.toLowerCase() === 'svg') {
    const icons = (el.getAttribute('class') || '').split(/\s+/).filter((c) => c.startsWith('lucide-')).sort()
    return `<svg class="lucide${icons[0] ? ' ' + icons[0] : ''}">`
  }

  const classes = cls
  const rawId = el.getAttribute('id') || ''
  const id = GEN_ID.test(rawId) ? '' : rawId
  // `aria-labelledby` هم ممکن است به یک شناسه‌ی ساخته‌شده اشاره کند
  // (رادیکس برای هر پنل همین کار را می‌کند)؛ آن هم باید نادیده گرفته شود.
  const rawAria = el.getAttribute('aria-labelledby') || el.getAttribute('aria-label') || ''
  const aria = GEN_ID.test(rawAria) ? '' : rawAria
  return `<${el.tagName.toLowerCase()}${id ? '#' + id : ''}${aria ? ' aria=' + aria : ''}${classes ? ' class="' + classes + '"' : ''}>`
}

function flatten(el, out = [], depth = 0) {
  for (const c of el.children) {
    const t = c.tagName.toLowerCase()
    if (SKIP.has(t)) continue
    out.push({ sig: sig(c), depth, tag: t, text: (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) })
    flatten(c, out, depth + 1)
  }
  return out
}

const liveMain = liveDoc.querySelector('main') || liveDoc.body
const portMain = port.querySelector('[data-homepage]') || port.getElementById('root')

const A = flatten(liveMain)
const B = flatten(portMain)

console.log('تعدادِ عنصر — واقعی:', A.length, ' پورت:', B.length)

const n = A.length, m = B.length
const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
for (let i = n - 1; i >= 0; i--)
  for (let j = m - 1; j >= 0; j--)
    dp[i][j] = A[i].sig === B[j].sig ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])

console.log('عنصرِ مشترک (LCS):', dp[0][0], `(${(100 * dp[0][0] / Math.max(n, m)).toFixed(1)}%)`)

const missing = []
const extra = []
let i = 0, j = 0
while (i < n && j < m) {
  if (A[i].sig === B[j].sig) { i++; j++; continue }
  if (dp[i + 1][j] >= dp[i][j + 1]) missing.push(A[i++])
  else extra.push(B[j++])
}
while (i < n) missing.push(A[i++])
while (j < m) extra.push(B[j++])
// افت‌هایِ تودرتو را کوتاه می‌کنیم تا فقط ریشه‌ی تفاوت دیده شود
const prune = (arr, keep = 4) =>
  arr.filter((x, k) => k === 0 || x.depth <= arr[k - 1].depth || k < keep)

console.log('\n=== در واقعی هست، در پورت نیست ===')
for (const x of prune(missing).slice(0, 14)) console.log('  ' + '  '.repeat(Math.min(x.depth, 4)) + x.sig + (x.text ? `  «${x.text}»` : ''))
console.log('\n=== در پورت هست، در واقعی نیست ===')
for (const x of prune(extra).slice(0, 14)) console.log('  ' + '  '.repeat(Math.min(x.depth, 4)) + x.sig + (x.text ? `  «${x.text}»` : ''))

// ── هر بخش جدا ──────────────────────────────────────────────────────
const sectionsOf = (el) =>
  [...el.querySelectorAll('section')].filter((s) => s.getAttribute('aria-labelledby') || s.getAttribute('aria-label'))
const liveSect = sectionsOf(liveMain)
const portSect = sectionsOf(portMain)
console.log('\n=== هر بخش جدا ===')
for (let k = 0; k < Math.max(liveSect.length, portSect.length); k++) {
  const a = liveSect[k], b = portSect[k]
  const label = (a || b).getAttribute('aria-labelledby') || (a || b).getAttribute('aria-label')
  const fa = a ? flatten(a) : []
  const fb = b ? flatten(b) : []
  // LCSِ همان بخش
  const nn = fa.length, mm = fb.length
  const d2 = Array.from({ length: nn + 1 }, () => new Uint16Array(mm + 1))
  for (let x = nn - 1; x >= 0; x--)
    for (let y = mm - 1; y >= 0; y--)
      d2[x][y] = fa[x].sig === fb[y].sig ? d2[x + 1][y + 1] + 1 : Math.max(d2[x + 1][y], d2[x][y + 1])
  const pct = Math.max(nn, mm) ? Math.round((100 * d2[0][0]) / Math.max(nn, mm)) : 100
  const flag = pct >= 95 ? '✅' : pct >= 80 ? '⚠️' : '❌'
  console.log(`  ${flag} ${label}: واقعی ${nn} عنصر / پورت ${mm} — هم‌سانی ${pct}%`)
}

// ترتیبِ بخش‌ها
const sect = (el) =>
  [...el.querySelectorAll('[aria-labelledby],[aria-label]')]
    .filter((s) => s.tagName === 'SECTION')
    .map((s) => s.getAttribute('aria-labelledby') || s.getAttribute('aria-label'))
console.log('\nترتیبِ بخش‌ها — واقعی:', JSON.stringify(sect(liveMain)))
console.log('ترتیبِ بخش‌ها — پورت :', JSON.stringify(sect(portMain)))

await server.close()
