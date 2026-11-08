/**
 * تستِ دود: برنامه را در یک DOMِ واقعی (jsdom) بالا می‌آورد و هر مسیر را
 * رندر می‌گیرد تا خطاهای زمانِ اجرا (چیزی که vite build نمی‌گیرد) بیرون
 * بیفتند: اکسپورتِ گم‌شده، تابعِ تعریف‌نشده، خواندن از یک store خالی، ...
 *
 * اجرا:  node scripts/smoke.mjs            (همهٔ مسیرها)
 *        node scripts/smoke.mjs / /aruz    (فقط مسیرهای دلخواه)
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* ---------- DOM ---------- */

const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>sarva</title></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/', pretendToBeVisual: true }
)

const { window } = dom

// چیزهایی که jsdom ندارد ولی کتابخانه‌های رابط از آن‌ها استفاده می‌کنند.
window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false
  }))

// jsdom وب‌انیمیشن را پیاده نکرده؛ کتابخانه‌های انیمیشن از آن استفاده می‌کنند.
if (typeof window.Element.prototype.animate !== 'function') {
  window.Element.prototype.animate = () =>
    ({
      cancel() {},
      finish() {},
      play() {},
      pause() {},
      reverse() {},
      commitStyles() {},
      persist() {},
      finished: Promise.resolve(),
      onfinish: null,
      currentTime: 0,
      playState: 'finished',
      effect: { getComputedTiming: () => ({}) }
    })
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
window.IntersectionObserver = window.IntersectionObserver || NoopObserver
window.ResizeObserver = window.ResizeObserver || NoopObserver
window.MutationObserver = window.MutationObserver || NoopObserver
window.scrollTo = window.scrollTo || (() => {})
window.HTMLElement.prototype.scrollIntoView = () => {}
window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null

// jsdom مسیرِ SVG را اندازه نمی‌گیرد؛ کتابخانه‌های انیمیشن برای رسمِ منحنی
// از آن استفاده می‌کنند. در مرورگرِ واقعی هست، اینجا فقط برای تست کافی است.
const svgProto = window.SVGElement?.prototype
if (svgProto && !svgProto.getTotalLength) {
  svgProto.getTotalLength = () => 100
  svgProto.getPointAtLength = () => ({ x: 0, y: 0 })
}
if (window.SVGPathElement && !window.SVGPathElement.prototype.getTotalLength) {
  window.SVGPathElement.prototype.getTotalLength = () => 100
  window.SVGPathElement.prototype.getPointAtLength = () => ({ x: 0, y: 0 })
}
if (!window.crypto?.randomUUID) {
  window.crypto = window.crypto || {}
  if (!window.crypto.randomUUID) {
    let n = 0
    window.crypto.randomUUID = () => `uuid-${Date.now().toString(36)}-${++n}`
  }
}

// متغیرهای سراسریِ پیش‌فرضِ vite در محیطِ ssr تعریف نشده‌اند.
globalThis.__SARVA_WEB__ = true

for (const key of [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'HTMLElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
  'HashChangeEvent',
  'PopStateEvent',
  'DOMParser',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'matchMedia',
  'IntersectionObserver',
  'ResizeObserver',
  'MutationObserver',
  'localStorage',
  'sessionStorage',
  'crypto',
  'Image',
  'Audio',
  'fetch',
  'Headers',
  'Request',
  'Response',
  'AbortController',
  'Blob',
  'File',
  'FileReader',
  'URL',
  'URLSearchParams',
  'TextDecoder',
  'TextEncoder',
  'SVGElement',
  'SVGSVGElement',
  'SVGPathElement',
  'HTMLCanvasElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLSelectElement',
  'HTMLAudioElement',
  'HTMLVideoElement',
  'Range',
  'NodeList',
  'DOMRect',
  'XMLHttpRequest',
  'FormData',
  'TouchEvent',
  'PointerEvent',
  'WheelEvent',
  'FocusEvent',
  'InputEvent',
  'DragEvent',
  'Selection',
  'StorageEvent',
  'PageTransitionEvent',
  'beforeunload',
  'screen',
  'devicePixelRatio',
  'innerWidth',
  'innerHeight',
  'scrollX',
  'scrollY',
  'ImageData',
  'OffscreenCanvas',
  'WebGLRenderingContext',
  'WebGL2RenderingContext',
  'ImageBitmap',
  'createImageBitmap'
]) {
  if (window[key] !== undefined) {
    try {
      globalThis[key] = window[key]
    } catch {
      /* بعضی از این‌ها فقط خواندنی‌اند؛ همان مقدارِ خودِ jsdom می‌ماند. */
    }
  }
}
globalThis.window = window
globalThis.document = window.document
globalThis.self = window

/* ---------- خطاها را جمع کن ---------- */

const problems = []
const realError = console.error
console.error = (...args) => {
  problems.push(
    args
      .map((a) => (a instanceof Error ? (a.stack ?? a.message) : typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ')
  )
  realError('   ↳', ...args)
}
window.addEventListener('error', (e) => problems.push(`window.error: ${e.message}`))
window.addEventListener('unhandledrejection', (e) =>
  problems.push(`unhandledrejection: ${e.reason}`)
)

/* ---------- مسیرها ---------- */

const ROUTES = [
  '#/',
  '#/doroos',
  '#/doroos/yazdahom',
  '#/doroos/yazdahom/1',
  '#/learn',
  '#/vazn-yab',
  '#/aruz',
  '#/quiz',
  '#/game',
  '#/exam',
  '#/panel',
  '#/auth',
  '#/about',
  '#/guide',
  '#/timeline',
  '#/shab-emtehan',
  '#/sarvaclub',
  '#/plus',
  '#/admin',
  '#/not-a-real-page'
]

const only = process.argv.slice(2)
const routes = only.length ? only.map((r) => (r.startsWith('#') ? r : `#${r}`)) : ROUTES

/* ---------- اجرا ---------- */

const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn'
})

const textOf = (el) =>
  (el?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 400)

let failures = 0

try {
  await server.ssrLoadModule('/src/renderer/src/main.tsx')
  await new Promise((r) => setTimeout(r, 400))

  const rootEl = window.document.getElementById('root')
  const firstHtml = rootEl.innerHTML
  if (!firstHtml || firstHtml.length < 200) {
    failures++
    console.log(`✗ #/  — چیزی رندر نشد (${firstHtml.length} بایت)`)
  } else {
    console.log(`✓ #/  — ${firstHtml.length} بایت`)
  }

  for (const route of routes) {
    problems.length = 0
    let html = ''
    let snippet = ''
    try {
      window.location.hash = route
      // هش‌راور به رویداد گوش می‌دهد؛ یک چرخه وقت بده تا state بنشیند.
      await new Promise((r) => setTimeout(r, 1200))
      await new Promise((r) => setTimeout(r, 0))
      html = window.document.getElementById('root').innerHTML
      snippet = textOf(window.document.getElementById('root'))
    } catch (error) {
      failures++
      console.log(`✗ ${route}  — پرتاب شد: ${error?.stack ?? error}`)
      continue
    }

    const bad = problems.filter((p) => !/Warning: |not wrapped in act|Not implemented|getTotalLength|Could not parse CSS/.test(p))
    if (!html || html.length < 200) {
      failures++
      console.log(`✗ ${route}  — خالی (${html.length} بایت) · ${snippet}`)
    } else if (bad.length) {
      failures++
      console.log(`✗ ${route}  — ${html.length} بایت، ${bad.length} خطا: ${bad[0].slice(0, 1500)} · ${snippet}`)
    } else {
      console.log(`✓ ${route}  — ${html.length} بایت · ${snippet}`)
    }
  }
} catch (error) {
  failures++
  console.log('\n✗ بالا آمدنِ برنامه شکست خورد:\n', error?.stack ?? error)
} finally {
  await server.close()
}

console.log(`\n${failures ? `✗ ${failures} مسیر مشکل داشت` : '✓ همهٔ مسیرها رندر شدند'}`)
process.exit(failures ? 1 : 0)
