// تصویرهای صفحهٔ اصلی را می‌سنجد: روی هر چهار زبانهٔ «ابزارها را ببین» کلیک
// می‌کند، هر <img> را برمی‌دارد و می‌بیند پرونده‌اش روی دیسک هست یا نه.
// پیش‌تر همهٔ نشانی‌ها به `/api/vocab-image` پیچانده می‌شد — مسیری که در
// برنامه (بی‌سرور) کسی سرو نمی‌کند — و هیچ تصویری دیده نمی‌شد.
// کاربرد: node scripts/_homeimgs.mjs
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = '/home/user/Teraaz/sarva'
const PUBLIC = path.join(root, 'public')

const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/', pretendToBeVisual: true }
)
const { window } = dom
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false }))
class N { observe(){} unobserve(){} disconnect(){} takeRecords(){return []} }
window.MutationObserver = N
/* نمایش‌های صفحهٔ اصلی با `IntersectionObserver` بیدار می‌شوند (آستانه‌ی ۰٫۳)؛
   اگر این فقط یک کلاسِ تهی باشد، هیچ نمایشی هرگز آغاز نمی‌شود و تنها یک تصویر
   دیده می‌شود. باید واقعاً «در دید» گزارش کند. */
class IO {
  constructor(cb) { this.cb = cb }
  observe(el) { setTimeout(() => this.cb([{ isIntersecting: true, target: el }], this), 0) }
  unobserve() {} disconnect() {} takeRecords() { return [] }
}
window.IntersectionObserver = IO
window.scrollTo = () => {}; window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function') window.Element.prototype.animate = () => ({cancel(){},finish(){},play(){},pause(){},reverse(){},commitStyles(){},persist(){},finished:Promise.resolve(),onfinish:null,currentTime:0,playState:'finished',effect:{getComputedTiming:()=>({})}})
/* `document.fonts` در jsdom نیست ولی در کرومیوم و الکترون هست؛
   `Highlighter`ِ هیرو منتظرِ `document.fonts.ready` می‌ماند و بی‌این، رندرِ
   صفحهٔ اصلی با خطا می‌شکند. */
if (!window.document.fonts) {
  Object.defineProperty(window.document, 'fonts', {
    value: { ready: Promise.resolve(), add() {}, delete() {}, check: () => true, load: () => Promise.resolve([]) },
    configurable: true,
  })
}
if (!window.crypto?.randomUUID) { window.crypto = window.crypto||{}; let n=0; window.crypto.randomUUID=()=>`u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) { if (window[k] !== undefined) { try { globalThis[k] = window[k] } catch {} } }
globalThis.window = window; globalThis.document = window.document; globalThis.self = window
class RO { constructor(cb){this.cb=cb} observe(el){setTimeout(()=>this.cb([{contentRect:{width:1200,height:400},target:el}],this),0)} unobserve(){} disconnect(){} }
window.ResizeObserver = RO; globalThis.ResizeObserver = RO
globalThis.IntersectionObserver = IO

const server = await createServer({ configFile: path.join(root, 'vite.config.ts'), root, server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise((r) => setTimeout(r, 2600))

const doc = window.document
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))

const report = []
const check = (name, ok, extra = '') => report.push(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)

// هر <img> ی که برنامه روی صفحهٔ اصلی می‌سازد، برای هر زبانه
const found = new Map() // src → برچسبِ زبانه
const tabs = [...doc.querySelectorAll('[role=tab]')]
check('چهار زبانه یافت شد', tabs.length === 4, `${tabs.length} زبانه`)

for (const tab of tabs) {
  const label = (tab.textContent || '').trim()
  click(tab)
  // دورِ نمایش خودکار عوض می‌شود، پس با صبر و چند بار نگاه کردن جمع می‌کنیم
  for (let t = 0; t < 40; t++) {
    await wait(300)
    for (const img of doc.querySelectorAll('img')) {
      const src = img.getAttribute('src') || ''
      if (src && !found.has(src)) found.set(src, label)
    }
  }
}

const srcs = [...found.keys()]
check('دست‌کم یک تصویر روی صفحهٔ اصلی هست', srcs.length > 0, `${srcs.length} تصویر`)

let bad = 0
for (const [src, label] of found) {
  // نشانی‌هایِ بیرونی یا داده‌ای را از این سنجش بیرون می‌گذاریم
  if (/^(https?:|data:|blob:)/i.test(src)) {
    check(`تصویرِ «${label}» بیرونی است: ${src.slice(0, 60)}`, false, 'وابستگیِ بیرونی')
    bad++
    continue
  }
  if (src.startsWith('/api/')) {
    check(`تصویرِ «${label}» به مسیرِ سرو شده می‌رود: ${src.slice(0, 40)}`, false, 'در برنامه سرو نمی‌شود')
    bad++
    continue
  }
  const rel = decodeURIComponent(src.replace(/^\//, '').split('?')[0])
  const file = path.join(PUBLIC, rel)
  const ok = fs.existsSync(file)
  if (!ok) bad++
  check(
    `تصویرِ «${label}» روی دیسک هست`,
    ok,
    ok ? `${rel} (${(fs.statSync(file).size / 1024).toFixed(0)} کیلوبایت)` : `${rel} یافت نشد`,
  )
}

console.log(report.join('\n'))
const fails = report.filter((r) => r.startsWith('❌')).length
console.log(`\n${report.length - fails}/${report.length} گذشت`)
await server.close()
process.exit(fails ? 1 : 0)
