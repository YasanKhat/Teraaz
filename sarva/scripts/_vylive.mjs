// تمرینِ زنده‌ی وزن‌یاب در jsdom: صحنه، حالتِ استادی و داوری را واقعاً کلیک
// می‌کند و نتیجه را می‌سنجد. عددِ پوششِ متن هیچ‌کدام از این‌ها را ثابت نمی‌کند.
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = '/home/user/Teraaz/sarva'
const dom = new JSDOM(`<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`, { url: 'http://localhost/#/vazn-yab', pretendToBeVisual: true })
const { window } = dom
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false }))
class N { observe(){} unobserve(){} disconnect(){} takeRecords(){return []} }
window.IntersectionObserver = N; window.MutationObserver = N
// jsdom چیدمان ندارد، پس ResizeObserver باید خودش پهنا را خبر بدهد؛
// در مرورگر واقعی همین عدد از چیدمان می‌آید.
class RO {
  constructor(cb) { this.cb = cb }
  observe(el) { setTimeout(() => this.cb([{ contentRect: { width: 900, height: 300 }, target: el }], this), 0) }
  unobserve(){} disconnect(){}
}
window.ResizeObserver = RO
window.scrollTo = () => {}; window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function') window.Element.prototype.animate = () => ({cancel(){},finish(){},play(){},pause(){},reverse(){},commitStyles(){},persist(){},finished:Promise.resolve(),onfinish:null,currentTime:0,playState:'finished',effect:{getComputedTiming:()=>({})}})
for (const p of [window.SVGElement, window.SVGPathElement]) if (p && !p.prototype.getTotalLength) { p.prototype.getTotalLength = () => 100; p.prototype.getPointAtLength = () => ({ x: 0, y: 0 }) }
if (!window.crypto?.randomUUID) { window.crypto = window.crypto || {}; let n = 0; window.crypto.randomUUID = () => `u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','ResizeObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) { if (window[k] !== undefined) { try { globalThis[k] = window[k] } catch {} } }
globalThis.window = window; globalThis.document = window.document; globalThis.self = window

const server = await createServer({ configFile: path.join(root, 'vite.config.ts'), root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise((r) => setTimeout(r, 2500))

const doc = window.document
const $ = (s) => doc.querySelector(s)
const $$ = (s) => [...doc.querySelectorAll(s)]
const byText = (sel, t) => $$(sel).find((e) => (e.textContent || '').trim().includes(t))
const click = (el) => el?.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const report = []
const check = (name, cond, extra = '') => report.push(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`)

// ── ۱) صحنه‌ی تقطیع روی نمونه ──────────────────────────────────────
if (process.env.DBG) {
  const ids = $$('[id]').map(e=>e.id).filter(Boolean)
  console.log('DBG ids:', ids.join(' '))
  const sec = doc.querySelector('section.overflow-hidden')
  console.log('DBG section html:', sec ? sec.outerHTML.slice(0,1500) : 'none')
}
const stage = $('[data-vy-stage]')
const svg = stage?.querySelector('svg')
check('صحنه‌ی تقطیع روی نمونه هست', !!svg)
const cells = svg ? svg.querySelectorAll('g > path').length : 0
check('سلول‌های هجا روی صحنه کشیده شده', cells >= 8, `${cells} سلول`)
const labels = svg ? [...svg.querySelectorAll('text')].map((t) => t.textContent.trim()).filter(Boolean) : []
check('نامِ ارکان زیرِ خط‌ها نوشته شده', labels.length >= 8, labels.join(' '))
const ball = svg?.querySelector('g > circle')
check('توپ روی صحنه هست', !!ball)

// ── ۲) حالتِ استادی ظاهر می‌شود ────────────────────────────────────
click(byText('button', 'استادی'))
await wait(400)
check('حالتِ استادی باز می‌شود', !!byText('span', 'حدس تو'))
check('پیغامِ «رکن‌ها را به ترتیب انتخاب کن» هست', !!byText('span', 'رکن‌ها را به ترتیب انتخاب کن'))
const chips = $$('button').filter((b) => b.querySelector('span')?.textContent.trim() === 'فعولن' && b.className.includes('flex-col'))
check('ارکانِ قابلِ انتخاب هستند', chips.length > 0, `${chips.length} رکن`)

// ── ۳) بدون حدس خطا می‌دهد ─────────────────────────────────────────
click(byText('button', 'پیدا کن'))
await wait(200)
check('بدون حدس پیغامِ «اول وزن را حدس بزن.» می‌دهد', !!byText('span', 'اول وزن را حدس بزن.'))

// ── ۴) بیتِ واقعی: وزن درست پیدا می‌شود و حدس داوری می‌شود ─────────
const inputs = $$('input[data-bare]')
const setVal = (el, v) => {
  const proto = window.HTMLInputElement.prototype
  const d = Object.getOwnPropertyDescriptor(proto, 'value')
  d.set.call(el, v)
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
}
setVal(inputs[0], 'توانا بود هر که دانا بود')
setVal(inputs[1], 'ز دانش دل پیر برنا بود')
await wait(200)

// حدسِ درستِ شاهنامه: فعولن فعولن فعولن فعل
for (const foot of ['فعولن', 'فعولن', 'فعولن', 'فعل']) {
  const chip = $$('button').find((b) => b.querySelector('span')?.textContent.trim() === foot && b.className.includes('flex-col') && !b.disabled)
  click(chip)
  await wait(120)
}
check('حدس انتخاب شد', !!byText('button', 'پاک کردن'))

click(byText('button', 'پیدا کن'))
await wait(1600)

const verdict = $('#vy-verdict')
check('تابلوی داوری ظاهر شد', !!verdict)
const vtext = verdict ? verdict.textContent.replace(/\s+/g, ' ').trim() : ''
check('متنِ داوری نشان داده شد', /درست حدس زدی|ارکان درست است|این بار نشد|وزن مرجع تأیید نشد/.test(vtext), vtext.slice(0, 90))

const title = byText('h2', 'متقارب') || byText('h2', 'وزن') || doc.querySelector('h2')
check('وزنِ بیت پیدا شد', !!title && !/وزنی پیدا نشد/.test(title.textContent), title?.textContent.trim())

const ganjoor = $$('a').find((a) => (a.textContent || '').includes('گنجور'))
const motor = byText('span', 'پیشنهاد موتور')
check('نشانِ مرجع (گنجور یا پیشنهادِ موتور) هست', !!ganjoor || !!motor, ganjoor ? 'ثبت‌شده در گنجور' : motor ? 'پیشنهاد موتور' : 'هیچ‌کدام')

// ── ۵) بیتی با وزنِ دیگر: صحنه باید عوض شود ──────────────────────
setVal($$('input[data-bare]')[0], 'الا یا ایها الساقی ادر کأسا و ناولها')
setVal($$('input[data-bare]')[1], 'که عشق آسان نمود اول ولی افتاد مشکل‌ها')
await wait(200)
click(byText('button', 'پیدا کن'))
await wait(4000)
const stage2 = $('[data-vy-stage]')
const labels2 = stage2 ? [...stage2.querySelectorAll('text')].map((t) => t.textContent.trim()).filter(Boolean) : []
const h2s = [...doc.querySelectorAll('h2')].map((e) => e.textContent.trim())
if (process.env.DBG) console.log('DBG h2s:', JSON.stringify(h2s))
const h2b = doc.querySelector('section h2')?.textContent.trim()
// زیرعنوان داخل AnimatePresence نیست، پس واقعاً به‌روز می‌شود: اگر آمد، یعنی
// state درست است و فقط خروجِ انیمیشن در jsdom کامل نمی‌شود.
const sub = doc.querySelector('section p')?.textContent.trim()
if (process.env.DBG) console.log('DBG sub:', JSON.stringify(sub))
check('زیرعنوانِ ارکان با وزنِ تازه به‌روز شد', !!sub && sub.includes('مفاعیلن'), sub || '(خالی)')
check('بیتِ دوم وزنِ دیگری یافت', !!h2b && !/وزنی پیدا نشد/.test(h2b), h2b)
check('صحنه با وزنِ تازه باز کشیده شد', labels2.join(' ') !== labels.join(' '), labels2.join(' ') || '(خالی)')

// ── ۶) بیتِ تصادفی ────────────────────────────────────────────────
click(byText('button', 'بیت تصادفی'))
await wait(2500)
const err = byText('p', 'بیتی از گنجور به دست نیامد')
const iv = $$('input[data-bare]')
const got = iv[0]?.value && iv[1]?.value
check('بیتِ تصادفی: یا بیت آمد یا پیغامِ خطایِ خودِ سایت', !!got || !!err, got ? 'بیت آمد' : err ? 'پیغامِ خطا مطابقِ سایت' : 'هیچ‌کدام')

console.log(report.join('\n'))
const bad = report.filter((r) => r.startsWith('❌')).length
console.log(`\n${report.length - bad}/${report.length} گذشت`)
await server.close()
process.exit(bad ? 1 : 0)
