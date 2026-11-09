// سنجشِ سربرگ: منویِ «فهرست» را باز می‌کند و نام، ترتیب و نشانیِ بخش‌ها را
// با همان چیزی می‌سنجد که در سایتِ زنده است (بسته‌ی سربرگ در HAR-4).
// کاربرد: node scripts/_hdrchk.mjs
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = '/home/user/Teraaz/sarva'
const dom = new JSDOM(`<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/', pretendToBeVisual: true })
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

// همان چیزی که در سایت زنده است (بسته‌ی سربرگ، HAR-4)
const LIVE = [
  ['آزمون‌ها', '/exam'], ['درسنامه', '/doroos'], ['کنکور', '/konkur'],
  ['بازی‌ها', '/game'], ['کارگاه', '/learn'], ['شب امتحان', '/shab-emtehan'],
  ['عروض', '/aruz'], ['وزن‌یاب', '/vazn-yab'], ['خط زمان', '/timeline'],
]

let pass = 0, fail = 0
const ok = (label, cond, extra = '') => { if (cond) { pass++; console.log('  ✅ ' + label) } else { fail++; console.log('  ❌ ' + label + (extra ? ' — ' + extra : '')) } }
const wait = (ms) => new Promise(r => setTimeout(r, ms))

// دکمه‌ی «فهرست»
const trigger = [...window.document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('فهرست'))
ok('دکمهٔ «فهرست» در سربرگ هست', !!trigger)

if (trigger) {
  trigger.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
  trigger.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }))
  trigger.dispatchEvent(new window.MouseEvent('pointerup', { bubbles: true, pointerType: 'mouse' }))
  trigger.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
}

let menu = null
for (let i = 0; i < 40 && !menu; i++) { await wait(100); menu = window.document.querySelector('[role="menu"]') }
ok('منو باز می‌شود', !!menu)

if (menu) {
  const grid = menu.querySelector('div[class*="grid"]')
  ok('بخش‌ها درونِ شبکه (grid) هستند', !!grid)
  const items = [...(grid ?? menu).querySelectorAll('a')]
  const got = items.map(a => [a.textContent.trim(), (a.getAttribute('href') || '').replace(/^#/, '')])
  console.log('\n  واقعی:', LIVE.map(x => x[0]).join('، '))
  console.log('  پورت :', got.map(x => x[0]).join('، '), '\n')
  ok('تعدادِ بخش‌ها ۹ تاست', items.length === 9, `${items.length} تا`)
  ok('نام و ترتیب و نشانی درست است', JSON.stringify(got) === JSON.stringify(LIVE),
     JSON.stringify(got.filter((g, i) => JSON.stringify(g) !== JSON.stringify(LIVE[i]))))
  ok('شبکه سه‌ستونه است', !!grid && /repeat\(3/.test(fs.readFileSync(path.join(root, 'src/renderer/src/components/UI/header.module.css'), 'utf8').match(/\.grid \{[^}]*\}/)?.[0] ?? ''))
}

// کارتِ پلاس
if (menu) {
  const card = [...menu.querySelectorAll('a')].find(a => a.textContent.includes('سروا پلاس'))
  // بی‌اشتراک (state "off") سایت هم کارت را نشان نمی‌دهد؛ اینجا فقط ساختار سنجیده می‌شود.
  const src = fs.readFileSync(path.join(root, 'src/renderer/src/components/UI/Header.tsx'), 'utf8')
  ok('کارتِ پلاس در کد هست و تنها با اشتراکِ غیرِ خاموش پیدا می‌شود', /plusVisible && \(/.test(src) && /styles\.plusCard/.test(src))
  ok('کارت عنوانِ «سروا پلاس» و توضیحِ کوچک دارد', /<b>\{plusTitle\}<\/b>/.test(src) && /<small>/.test(src))
  ok('عنوانِ پلاس در فهرست همیشه «سروا پلاس» است (نه «تمدید پلاس»)', /plusTitle = "سروا پلاس"/.test(src))
  if (card) console.log('    (کارت در این وضعیت هم رندر شد)')
}

// مسیرها: آیا هر نشانی در برنامه صفحه‌ای دارد؟
const routes = fs.readFileSync(path.join(root, 'src/renderer/src/App.tsx'), 'utf8')
for (const [title, href] of LIVE) {
  const seg = href.split('/').filter(Boolean)[0]
  ok(`مسیرِ ${title} (${href}) در برنامه تعریف شده`, new RegExp(`case '${seg}'`).test(routes))
}

console.log(`\n${pass} از ${pass + fail}`)
process.exit(0)
