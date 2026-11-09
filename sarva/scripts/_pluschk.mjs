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
await new Promise(r => setTimeout(r, 2500))
let pass = 0, fail = 0
const ok = (label, cond, extra = '') => { if (cond) { pass++; console.log('  ✅ ' + label) } else { fail++; console.log('  ❌ ' + label + (extra ? ' — ' + extra : '')) } }
const text = window.document.body.textContent || ''
const has = (t) => text.includes(t)

// ── قهرمان و چرخ ──
ok('تیترِ «سروا پلاس»', has('سروا پلاس'))
ok('متنِ بالای صفحه', has('همهٔ درس‌های بازی‌ها، نقش و آرایهٔ درسنامه، هوشواره، همهٔ امتحان‌های نهایی و مرور شب امتحان'))
ok('پیوندِ «دیدن قیمت‌ها»', has('دیدن قیمت‌ها'))
ok('«چطور کار می‌کند»', has('چطور کار می‌کند'))
for (const t of ['خواندن', 'بازی', 'امتحان', 'مرور']) ok('مرحلهٔ چرخ: ' + t, has(t))
for (const t of ['درس', 'بازی', 'امتحان']) ok('برچسبِ مدار: ' + t, has(t))

// ── صحنه‌ی یادگیری ──
ok('تیترِ «هر درسِ کتاب، یک بازی»', has('هر درسِ کتاب، یک بازی'))
for (const t of ['واژه و املا', 'دستور و آرایه', 'معنا و قرابت']) ok('موضوع: ' + t, has(t))

// ── شش کارت (deck) ──
const CARDS = [
  ['درسنامهٔ هوشمند', 'نقش و آرایهٔ هر بیت', 'یادگیری دیداری'],
  ['رنگ‌آرا', 'بازی آرایه‌ها', 'یادگیری فعال'],
  ['واژه‌یاب', 'هر واژه با یک تصویر', 'رمزگذاری دوگانه'],
  ['عروض سماعی', 'رشتهٔ انسانی', 'یادگیری شنیداری'],
  ['امتحان نهایی', 'نهایی‌های سال‌های قبل', 'بازخورد فوری'],
  ['شب امتحان', 'همهٔ درس در یک مرور', 'مرور فشرده'],
]
for (const [name, body, note] of CARDS) {
  ok(`کارتِ «${name}»`, has(name) && has(body) && has(note), [name, body, note].filter(t => !has(t)).join('، '))
}

// ── جدولِ «همهٔ تفاوت‌ها» ──
ok('تیترِ «همهٔ تفاوت‌ها»', has('همهٔ تفاوت‌ها'))
ok('شمارشِ «۱۷ مورد»', has('۱۷ مورد'))
const GROUPS = ['درسنامه', 'واژه و املا', 'تمرین و آزمون', 'دسترسی']
for (const g of GROUPS) ok('گروه: ' + g, has(g))
const ROWS = ['درسنامه و معنی بیت‌ها', 'هوشواره؛ پیدا کردن نقش‌ها با هوش مصنوعی',
  'یادگیری واژه با تصویر', 'درست یا غلط بودن جواب، همان لحظه', 'وزن شعر با صدا',
  'محتوای تازه در طول سال']
for (const r of ROWS) ok('ردیف: ' + r.slice(0, 34), has(r))
const rows = window.document.querySelectorAll('[role="row"]').length
ok('شمارِ ردیف‌هایِ جدول ۱۷ + گروه‌ها و سر ردیف است', rows >= 22, rows + ' ردیف')

// ── قیمت‌ها و قوانین ──
ok('«قیمت‌ها»', has('قیمت‌ها'))
ok('«انتخاب مدت»', has('انتخاب مدت'))
ok('قانونِ چهارم (بازگشتِ وجه)', has('بانک معمولاً تا ۷۲ ساعت'))

// ── ساختار ──
const h1 = window.document.querySelector('h1')
ok('یک h1 با عنوانِ «سروا پلاس»', !!h1 && h1.textContent.trim() === 'سروا پلاس', h1?.textContent)
const ol = window.document.querySelector('ol')
ok('مراحل در یک <ol>اند (۴ تا)', !!ol && ol.querySelectorAll('li').length === 4, ol ? ol.querySelectorAll('li').length + ' تا' : 'نیست')
const sections = window.document.querySelectorAll('section').length
ok('بخش‌هایِ صفحه بیش ازِ ۵ تاست (صفحهٔ کامل)', sections >= 6, sections + ' بخش')

console.log(`\n${pass} از ${pass + fail}`)
process.exit(0)
