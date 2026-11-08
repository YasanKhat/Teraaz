// آزمونِ جایِ توپ هنگامِ «توقف در میانه، سپس تغییرِ وزن».
//
// چرا جدا از `_vylive.mjs`؟ در آن تمرین، ساختِ پارتیتور نخِ اصلی را می‌بندد
// (jsdom کارگر ندارد)، پس حالتِ «کوک ساز…» هرگز با یک قابِ کشیده‌شده دیده
// نمی‌شود و توپِ میانِ راه را نمی‌شود در همان لحظه سنجید. اینجا خودِ صحنه با
// یک ساعتِ دستی بالا می‌آید: می‌توان پخش را جلو برد، ناگهان متوقف کرد و بعد
// وزن را عوض کرد — درست همان ترتیبی که کاربر گزارش داد.
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = '/home/user/Teraaz/sarva'
const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/', pretendToBeVisual: true },
)
const { window } = dom
window.matchMedia =
  window.matchMedia ||
  ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }))
class N { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
window.IntersectionObserver = N
class RO {
  constructor(cb) { this.cb = cb }
  observe(el) { setTimeout(() => this.cb([{ contentRect: { width: 900, height: 300 }, target: el }], this), 0) }
  unobserve() {} disconnect() {}
}
window.ResizeObserver = RO
for (const p of [window.SVGElement, window.SVGPathElement]) {
  if (p && !p.prototype.getTotalLength) {
    p.prototype.getTotalLength = () => 100
    p.prototype.getPointAtLength = () => ({ x: 0, y: 0 })
  }
}
window.MutationObserver = window.MutationObserver || N
for (const k of ['window', 'document', 'navigator', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia', 'ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'getComputedStyle', 'Element', 'SVGElement', 'SVGSVGElement', 'SVGPathElement', 'Node', 'HTMLElement', 'localStorage', 'sessionStorage', 'crypto']) {
  if (window[k] !== undefined) { try { globalThis[k] = window[k] } catch {} }
}
globalThis.window = window
globalThis.document = window.document
globalThis.self = window
// رنگ‌ها را از متغیرهایِ CSS می‌خواند
window.document.documentElement.style.setProperty('--primary', '120,80,40')
window.document.documentElement.style.setProperty('--foreground', '20,20,20')

const server = await createServer({
  root,
  configFile: 'vite.web.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

// react و react-dom بسته‌های CJS اند و با `ssrLoadModule` بالا نمی‌آیند؛
// خودِ node آن‌ها را درست درون‌ریزی می‌کند. پس از بالا آمدنِ jsdom می‌آیند،
// چون react-dom هنگامِ درون‌ریزی به `document` دست می‌زند.
const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const { default: Stage } = await server.ssrLoadModule(
  '/src/renderer/src/components/UI/vazn-yab/VaznYabStage.tsx',
)
const { bareHemi } = await server.ssrLoadModule('/src/renderer/src/lib/vazn-yab/prosody.ts')
const { splitFeet } = await server.ssrLoadModule('/src/renderer/src/lib/vazn-yab/meters.ts').catch(
  () => ({ splitFeet: (f) => f.split(/\s+/) }),
)

const report = []
const check = (name, ok, extra = '') =>
  report.push(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const METRE_A = 'فعولن فعولن فعولن فعل'
const METRE_B = 'مفاعیلن مفاعیلن فعولن'

const clockRef = { current: null }
let version = 'famous:' + METRE_A
let props = { playing: true, loading: false, muted: false }

const rootEl = window.document.getElementById('root')
const reactRoot = createRoot(rootEl)

const draw = () => {
  const feet = splitFeet(METRE_A)
  reactRoot.render(
    React.createElement(Stage, {
      hemis: [bareHemi(METRE_A), bareHemi(METRE_A)],
      feet,
      clock: clockRef,
      playing: props.playing,
      loading: props.loading,
      muted: props.muted,
      version,
      cheer: '',
    }),
  )
}

/** توپ همان <g> ای است که یک <circle> دارد. */
const ballX = () => {
  const g = [...window.document.querySelectorAll('svg g')].find((n) => n.querySelector('circle'))
  const m = /translate\(\s*(-?[\d.]+)/.exec(g?.getAttribute('transform') || '')
  return m ? Number(m[1]) : NaN
}
const near = (a, b, tol = 1) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol

// ── ۱) پخش: توپ باید از خانه‌ی نخست جلو برود ────────────────────────
let now = 1000 // ثانیه‌ی دلخواهِ ساعت
clockRef.current = {
  ctx: { get currentTime() { return now }, outputLatency: 0 },
  start: 1000,
  score: { onsets: bareHemi(METRE_A).map((_, i) => i * 0.28) },
}
draw()
// چند قاب صبر می‌کنیم تا نخستین نقاشی انجام شود و توپ جا بگیرد
for (let i = 0; i < 40 && !Number.isFinite(ballX()); i++) await wait(50)
const x0 = ballX()
now = 1000 + 0.28 * 4 + 0.05 // بگذار چهار هجا بگذرد
await wait(150)
const xAdv = ballX()
check('هنگامِ پخش توپ از خانه‌ی نخست جلو می‌رود',
  Number.isFinite(x0) && Number.isFinite(xAdv) && !near(x0, xAdv),
  `x0=${x0} → xAdv=${xAdv}`)

// ── ۲) توقف: توپ در همان ناحیه‌ی میانی می‌ماند (رفتارِ سایت) ─────────
clockRef.current = null
props = { ...props, playing: false }
draw()
await wait(200)
const xStop = ballX()
check('با توقف، توپ در ناحیه‌ی میانی می‌ماند',
  Number.isFinite(xStop) && Number.isFinite(x0) && !near(xStop, x0),
  `خانه‌ی نخست=${x0}، پس از توقف=${xStop}`)

// ── ۳) تغییرِ وزن در همین حالتِ توقف: توپ باید بی‌درنگ به اول برگردد ──
// این همان چیزی است که کاربر گزارش داد: تا وقتی «کوک ساز…» است توپ همان‌جا
// می‌ماند و فقط با آغازِ موسیقی می‌آید.
props = { ...props, loading: true }
version = 'famous:' + METRE_B
reactRoot.render(
  React.createElement(Stage, {
    hemis: [bareHemi(METRE_B), bareHemi(METRE_B)],
    feet: splitFeet(METRE_B),
    clock: clockRef,
    playing: props.playing,
    loading: props.loading,
    muted: props.muted,
    version,
    cheer: '',
  }),
)
await wait(200)
const xNew = ballX()

// خانه‌ی نخستِ وزنِ تازه را جدا حساب می‌کنیم: همان صحنه با ساعتِ تهی و بدون
// تاریخچه — یعنی جایی که توپ باید باشد اگر درست به اول برگشته باشد.
const homeRef = { current: {} }
const homeRoot = createRoot(window.document.body.appendChild(window.document.createElement('div')))
homeRoot.render(
  React.createElement(Stage, {
    hemis: [bareHemi(METRE_B), bareHemi(METRE_B)],
    feet: splitFeet(METRE_B),
    clock: { current: null },
    playing: false,
    loading: false,
    muted: false,
    version: 'fresh:' + METRE_B,
    cheer: '',
  }),
)
await wait(300)
const allBalls = [...window.document.querySelectorAll('svg g')].filter((n) => n.querySelector('circle'))
const xHome = (() => {
  const g = allBalls[allBalls.length - 1]
  const m = /translate\(\s*(-?[\d.]+)/.exec(g?.getAttribute('transform') || '')
  return m ? Number(m[1]) : NaN
})()

check(
  'با تغییرِ وزن، توپ بی‌درنگ به خانه‌ی نخست برمی‌گردد',
  near(xNew, xHome),
  `خانه‌ی نخست=${xHome}، میانه‌ی مانده=${xStop}، پس از تغییر=${xNew}`,
)
check(
  'و دیگر در ناحیه‌ی میانیِ قبلی نیست',
  !near(xNew, xStop),
  `xStop=${xStop} در برابر xNew=${xNew}`,
)

console.log(report.join('\n'))
const bad = report.filter((r) => r.startsWith('❌')).length
console.log(`\n${report.length - bad}/${report.length} گذشت`)
await server.close()
process.exit(bad ? 1 : 0)
