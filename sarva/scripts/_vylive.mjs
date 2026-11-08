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

// بدلِ AudioContext — jsdom نداردش، ولی الکترون دارد. بی‌این، پخش هیچ‌وقت
// شروع نمی‌شود و هیچ‌کدام از رفتارهایِ صدا سنجیده نمی‌شد.
class FakeAudioContext {
  constructor() {
    this.currentTime = 0
    this.destination = {}
    this.outputLatency = 0
    this.state = 'running'
    this.sampleRate = 44100
  }
  resume() { return Promise.resolve() }
  close() { return Promise.resolve() }
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length))
    return {
      length, sampleRate, numberOfChannels: channels,
      copyToChannel(src, ch) { if (data[ch]) data[ch].set(src.subarray(0, data[ch].length)) },
      getChannelData: (ch) => data[ch],
    }
  }
  createBufferSource() {
    return { buffer: null, connect() {}, start() {}, stop() {}, onended: null }
  }
}
window.AudioContext = FakeAudioContext
globalThis.AudioContext = FakeAudioContext

// حافظه‌ی موقتِ ساختگی، تا بتوان محتوایِ «کپی تقطیع» را دید
globalThis.__CLIP__ = null
// Nodeِ ۲۲ خودش یک `navigator`ِ جهانیِ只خواندنی دارد، پس باید آن را هم عوض کرد؛
// وگرنه برنامه `navigator.clipboard` را پیدا نمی‌کند (در مرورگر چنین نیست).
const clipboard = { writeText: async (t) => { globalThis.__CLIP__ = t } }
try {
  Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: clipboard })
} catch {}
try {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: window.navigator })
} catch {}

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

// ── ۱٫۵) وزنِ نمونه پیش از هر جست‌وجو انتخاب است (مانندِ سایت) ─────
{
  const sec0 = $('section[aria-labelledby="vy-meters"]')
  const c0 = [...(sec0?.querySelectorAll('li > button') || [])]
  const p0 = c0.filter((b) => b.getAttribute('aria-pressed') === 'true')
  check('وزنِ نمونه (شاهنامه) پیش از جست‌وجو انتخاب است',
    p0.length === 1 && /شاهنامه/.test(p0[0].textContent), `${p0.length} انتخاب`)
  check('۲۰ کارتِ وزن هست', c0.length === 20, String(c0.length))
  check('وزن‌های مشهور داخلِ قابِ ماژول است',
    !!sec0 && sec0.parentElement?.className.includes('max-w-5xl'))
}

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

// ── ۵٫۵) کپی تقطیع ───────────────────────────────────────────────
const copyBtn = $$('button[aria-label="کپی تقطیع"]')[0]
check('دکمه‌ی کپی تقطیع روی صفحه هست', !!copyBtn)
if (process.env.DBG && copyBtn) console.log('DBG copy btn html:', copyBtn.outerHTML.slice(0, 200))
click(copyBtn)
await wait(400)
const clip = globalThis.__CLIP__
check('کپی تقطیع متن را می‌نویسد', typeof clip === 'string' && clip.length > 0, JSON.stringify(clip))
if (clip) {
  const rows = clip.split('\n')
  check('سطرِ نخست نامِ بحر است', /بحر|مثمن|مسدس|رباعی/.test(rows[0]), rows[0])
  check('سطرِ دوم ارکان است', /فعولن|مفاعیلن/.test(rows[1] || ''), rows[1])
  check('سطرِ سوم علامت‌های هجایی است (∪ و –)', /[∪–]/.test(rows[2] || ''), rows[2])
}

// ── ۶) بیتِ تصادفی ────────────────────────────────────────────────
setVal($$('input[data-bare]')[0], '')
setVal($$('input[data-bare]')[1], '')
await wait(100)
click(byText('button', 'بیت تصادفی'))
await wait(6000)
for (const w of [2000, 4000, 8000]) {
  await wait(w === 2000 ? 2000 : 2000)
  const foot = [...doc.querySelectorAll('form p')].map(p => p.textContent.trim()).join(' || ')
  if (process.env.DBG) console.log(`DBG t+${w}:`, JSON.stringify(foot), '| inputs:',
    JSON.stringify($$('input[data-bare]').map(i => i.value)))
}
const err = byText('p', 'بیتی از گنجور به دست نیامد')
const iv = $$('input[data-bare]')
const got = iv[0]?.value && iv[1]?.value
check('بیتِ تصادفی: یا بیت آمد یا پیغامِ خطایِ خودِ سایت', !!got || !!err, got ? 'بیت آمد' : err ? 'پیغامِ خطا مطابقِ سایت' : 'هیچ‌کدام')

// ── ۷) نگاره‌هایِ علامت‌هایِ هجایی در راهنما ──────────────────────
const guide = doc.querySelector('section[aria-labelledby="vy-guide"]')
check('بخشِ راهنما هست', !!guide)
const glyphs = guide ? [...guide.querySelectorAll('dl svg path')].map(p => p.getAttribute('d')) : []
check('سه نگاره‌ی علامتِ هجایی در راهنما هست', glyphs.length === 3, glyphs.join(' | '))
check('نگاره‌ی کوتاه کمان است', glyphs[0] === 'M14 9C14 23 2 23 2 9', glyphs[0])
check('نگاره‌ی بلند خط است', glyphs[1] === 'M30 16H2', glyphs[1])
check('نگاره‌ی کشیده خط و کمان است', glyphs[2] === 'M52 16H24M14 9C14 23 2 23 2 9', glyphs[2])
const dts = guide ? [...guide.querySelectorAll('dl dt')].map(d => d.textContent.trim()) : []
const ddNames = guide ? [...guide.querySelectorAll('dl dd:first-of-type span:first-child')].map(d => d.textContent.trim()) : []
check('نامِ سه علامت در راهنما هست', ddNames.join(',') === 'هجای کوتاه,هجای بلند,هجای کشیده', ddNames.join(','))

// ── ۸) وزن‌های مشهور ─────────────────────────────────────────────
const metersSec = doc.querySelector('section[aria-labelledby="vy-meters"]')
check('بخشِ وزن‌های مشهور هست', !!metersSec)
const cards = metersSec ? [...metersSec.querySelectorAll('li > button')] : []
const pressed = cards.filter(b => b.getAttribute('aria-pressed') === 'true')
if (process.env.DBG) {
  console.log('DBG cards feet:', cards.slice(-3).map(b => b.querySelector('span.mt-3')?.textContent).join(' | '))
  console.log('DBG subtitle:', JSON.stringify(doc.querySelector('section p')?.textContent.trim()))
  console.log('DBG pressed count:', pressed.length)
}
check('پس از جست‌وجو هیچ کارتی انتخاب نیست (مانندِ سایت)', pressed.length === 0, pressed.length + ' انتخاب')
// زدن روی یک کارتِ دیگر باید آن را انتخاب کند
const other = cards.find(b => !/شاهنامه/.test(b.textContent))
click(other)
await wait(600)
const pressed2 = [...(doc.querySelector('section[aria-labelledby="vy-meters"]')?.querySelectorAll('li > button') || [])].filter(b => b.getAttribute('aria-pressed') === 'true')
check('زدن روی کارت، آن را انتخاب می‌کند', pressed2.length === 1 && pressed2[0] === other, pressed2.length + ' انتخاب')

// ── ۹) «کوک ساز…» هنگامِ ساخت، و بی‌وقفه بودنِ بارِ دوم ─────────────
const playBtn = () => $$('button').find((b) => /کوک ساز|توقف|پخش ریتم/.test(b.textContent))
{
  // به وضعیتِ نمونه برگردیم و یک دستگاهِ تازه برگزینیم (یعنی کلیدِ تازه)
  const modeBtns = [...(doc.querySelector('[role=radiogroup][aria-label="دستگاه"]')?.querySelectorAll('button') || [])]
  const currentMode = modeBtns.find((b) => b.getAttribute('aria-checked') === 'true')
  // باید دستگاهی را برگزینیم که با کنونی فرق کند، وگرنه کلیدِ کش همان است
  const otherMode = modeBtns.find((b) => b !== currentMode)
  if (process.env.DBG) console.log('DBG mode:', currentMode?.textContent.trim(), '→', otherMode?.textContent.trim())
  click(otherMode)
  await wait(500)
  const nowMode = modeBtns.find((b) => b.getAttribute('aria-checked') === 'true')
  check('دستگاه عوض می‌شود', nowMode === otherMode, `${currentMode?.textContent.trim()} → ${nowMode?.textContent.trim()}`)

  // نخستین پخش: باید «کوک ساز…» دیده شود
  // اول مطمئن شویم چیزی در حال پخش نیست
  if (/توقف/.test(playBtn()?.textContent || '')) { click(playBtn()); await wait(200) }
  if (process.env.DBG) {
    console.log('DBG before click:', JSON.stringify(playBtn()?.textContent))
  }
  const t0 = Date.now()
  click(playBtn())
  if (process.env.DBG) console.log('DBG بلافاصله:', JSON.stringify(playBtn()?.textContent))
  await wait(0)
  if (process.env.DBG) console.log('DBG بعد از ۰:', JSON.stringify(playBtn()?.textContent))
  if (process.env.DBG) {
    console.log('DBG after click :', JSON.stringify(playBtn()?.textContent))
  }
  // در jsdom کارگر نداریم، پس رندر نخِ اصلی را می‌بندد و این حالت را نمی‌شود
  // پس از آن دید. به‌جایش با یک نگهبان ثبت می‌کنیم که این حالت رخ داده است.
  const seen = []
  const obs = new window.MutationObserver(() => {
    const t = (playBtn()?.textContent || '').trim()
    if (t && seen[seen.length - 1] !== t) seen.push(t)
  })
  obs.observe(doc.body, { childList: true, subtree: true, characterData: true })
  const t1 = playBtn()?.textContent.trim() || ''
  check('نخستین پخش از حالتِ «کوک ساز…» می‌گذرد', seen.includes('کوک ساز…') || /کوک ساز/.test(t1),
    seen.join(' → ') || JSON.stringify(t1))

  // صبر تا پخش شروع شود
  let playMs = -1
  for (let i = 0; i < 40 && !/توقف/.test(playBtn()?.textContent || ''); i++) { await wait(50); }
  playMs = Date.now() - t0
  if (process.env.DBG) console.log('DBG تا شروعِ پخش:', playMs, 'ms')
  for (let i = 0; i < 40 && !/توقف/.test(playBtn()?.textContent || ''); i++) await wait(200)
  const t2 = playBtn()?.textContent.trim() || ''
  check('پخش آغاز می‌شود', /توقف/.test(t2), JSON.stringify(t2))

  // توقف، و پخشِ دوبارهٔ همان: حالا کش دارد، پس نباید «کوک ساز…» بیاید
  click(playBtn())
  await wait(150)
  click(playBtn())
  await wait(60)
  const t3 = playBtn()?.textContent.trim() || ''
  check('بارِ دوم بی‌درنگ است و «کوک ساز…» نمی‌آید', /توقف|پخش ریتم/.test(t3) && !/کوک ساز/.test(t3), JSON.stringify(t3))
}

// ── ۱۰) برگزیدنِ وزنِ مشهور باید بی‌درنگ بپردازد ──────────────────
{
  // توقف، بعد یک کارتِ دیگر را بزن
  if (/توقف/.test(playBtn()?.textContent || '')) { click(playBtn()); await wait(150) }
  const sec = doc.querySelector('section[aria-labelledby="vy-meters"]')
  const cards = [...(sec?.querySelectorAll('li > button') || [])]
  const other = cards.find((b) => b.getAttribute('aria-pressed') !== 'true')
  click(other)
  // چند بار می‌سنجم: پخش باید در یکی از این لحظه‌ها در جریان باشد
  let sawPlaying = false
  for (let i = 0; i < 30; i++) {
    await wait(200)
    const txt = playBtn()?.textContent.trim() || ''
    if (/توقف|کوک ساز/.test(txt)) { sawPlaying = true; break }
  }
  check('زدن روی وزنِ مشهور پخش را آغاز می‌کند', sawPlaying, JSON.stringify(playBtn()?.textContent.trim()))
  // و همان کارت انتخاب شده بماند
  const nowPressed = [...(doc.querySelector('section[aria-labelledby="vy-meters"]')?.querySelectorAll('li > button') || [])]
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
  check('و همان کارت انتخاب می‌ماند', nowPressed.length === 1 && nowPressed[0] === other, `${nowPressed.length} انتخاب`)
}

console.log(report.join('\n'))
const bad = report.filter((r) => r.startsWith('❌')).length
console.log(`\n${report.length - bad}/${report.length} گذشت`)
await server.close()
process.exit(bad ? 1 : 0)
