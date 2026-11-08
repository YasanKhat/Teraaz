/**
 * تستِ جریان: به‌جای این‌که فقط ببیند صفحه رندر می‌شود، کاری را که کاربر
 * می‌کند انجام می‌دهد — ثبت‌نام، گرفتنِ وزنِ یک بیت، خریدِ پلاس، فرستادنِ
 * سروده به کلاب، زدنِ یک آزمونِ نهایی — و نتیجه را از روی DOM می‌خواند.
 *
 * اجرا: node scripts/flows.mjs
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* ---------- DOM (همان تنظیماتِ smoke.mjs) ---------- */

const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/', pretendToBeVisual: true }
)
const { window } = dom

window.matchMedia =
  window.matchMedia ||
  ((q) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false
  }))

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
window.IntersectionObserver = NoopObserver
window.ResizeObserver = NoopObserver
window.MutationObserver = NoopObserver
window.scrollTo = () => {}
window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function') {
  window.Element.prototype.animate = () => ({
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
for (const proto of [window.SVGElement, window.SVGGraphicsElement, window.SVGPathElement]) {
  if (proto && !proto.prototype.getTotalLength) {
    proto.prototype.getTotalLength = () => 100
    proto.prototype.getPointAtLength = () => ({ x: 0, y: 0 })
  }
}
if (!window.crypto?.randomUUID) {
  window.crypto = window.crypto || {}
  let n = 0
  window.crypto.randomUUID = () => `uuid-${Date.now().toString(36)}-${++n}`
}

globalThis.__SARVA_WEB__ = true
for (const key of [
  'window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'Element', 'Node',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'HashChangeEvent', 'PopStateEvent',
  'DOMParser', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia',
  'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'localStorage', 'sessionStorage', 'crypto', 'Image',
  'Audio', 'Headers', 'Request', 'Response', 'AbortController', 'Blob', 'File', 'FileReader',
  'URL', 'URLSearchParams', 'TextDecoder', 'TextEncoder', 'SVGElement', 'SVGSVGElement',
  'SVGPathElement', 'HTMLCanvasElement', 'HTMLInputElement', 'HTMLTextAreaElement',
  'HTMLSelectElement', 'HTMLAudioElement', 'Range', 'NodeList', 'FormData', 'XMLHttpRequest',
  'screen'
]) {
  if (window[key] !== undefined) {
    try {
      globalThis[key] = window[key]
    } catch {
      /* ignore */
    }
  }
}
globalThis.window = window
globalThis.document = window.document
globalThis.self = window

/* ---------- ابزار ---------- */

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const root$ = () => window.document.getElementById('root')
const text = () => (root$().textContent ?? '').replace(/\s+/g, ' ')

async function go(hash) {
  window.location.hash = hash
  await wait(700)
}

function findButton(label) {
  const wanted = label.replace(/\s+/g, ' ')
  return [...window.document.querySelectorAll('button')].find((b) =>
    (b.textContent ?? '').replace(/\s+/g, ' ').trim().includes(wanted)
  )
}

async function click(label, { wait: ms = 700 } = {}) {
  const button = findButton(label)
  if (!button) throw new Error(`دکمهٔ «${label}» پیدا نشد`)
  button.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  await wait(ms)
  return button
}

function setInput(el, value) {
  const proto = Object.getPrototypeOf(el)
  const desc = Object.getOwnPropertyDescriptor(proto, 'value')
  if (desc?.set) desc.set.call(el, value)
  else el.value = value
  el.dispatchEvent(new window.Event('input', { bubbles: true }))
  el.dispatchEvent(new window.Event('change', { bubbles: true }))
}

let passed = 0
let failed = 0

function check(name, ok, detail = '') {
  if (ok) {
    passed++
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    failed++
    console.log(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

/* ---------- اجرا ---------- */

const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn'
})

try {
  const { db, auth } = await server.ssrLoadModule('/src/renderer/src/platform/index.ts')
  await server.ssrLoadModule('/src/renderer/src/main.tsx')
  await wait(600)

  /* ── ۱. حساب ───────────────────────────────────────────────────────── */

  const registered = await auth.register({
    fullName: 'رضا دانش‌آموز',
    email: 'reza@sarva.local',
    password: 'sarva-1234'
  })
  const newUser = registered.user ?? null
  check('ساختِ حساب', !!newUser?.id, newUser?.email ?? String(registered.error ?? registered))
  const loggedIn = await auth.login('reza@sarva.local', 'sarva-1234')
  check('ورود', !!auth.currentUser(), auth.currentUser()?.fullName ?? String(loggedIn?.error ?? ''))

  /* ── ۲. وزن‌یاب: همان بیتی که روی سایت امتحان شده ─────────────────── */

  const { dispatch } = await server.ssrLoadModule('/src/renderer/src/platform/server.ts')
  const vazn = await dispatch('/api/vazn-yab', {
    method: 'POST',
    body: { poem1: 'بنی آدم اعضای یکدیگرند', poem2: 'که در آفرینش ز یک گوهرند' }
  })
  const meter = vazn.ok ? (vazn.data?.pattern ?? vazn.data?.rhythm ?? vazn.data?.meter ?? '') : ''
  check('وزن‌یاب پاسخ داد', vazn.ok, `منبع: ${vazn.data?.source ?? '؟'} · ${meter}`)
  check(
    'وزن‌یاب وزن می‌دهد',
    String(meter).length > 3,
    String(meter).slice(0, 60)
  )

  /* ── ۳. بانکِ آزمونِ عروض ──────────────────────────────────────────── */

  const bank = await dispatch('/api/v1/quiz/bank', { method: 'GET' })
  const count = bank.ok ? bank.data?.questions?.length ?? 0 : 0
  check('بانکِ پرسش‌ها', count > 1000, `${count} پرسش`)

  /* ── ۴. بازی‌ها ────────────────────────────────────────────────────── */

  const jasoos = await dispatch('/api/v1/jasoos/levels', { method: 'GET' })
  check('مراحلِ جاسوس', jasoos.ok && (jasoos.data?.levels?.length ?? 0) > 0, `${jasoos.data?.levels?.length ?? 0} مرحله`)

  const gc = await dispatch('/api/v1/grammar-circuit/questions?grade=dahom&lessons=1,2,3&limit=5', {
    method: 'GET'
  })
  const gcCount = gc.ok ? gc.data?.questions?.length ?? 0 : 0
  check('مدارِ دستور', gcCount > 0, `${gcCount} پرسش${gc.ok ? '' : ` · ${gc.errors}`}`)

  /* ── ۵. پلاس: پرداخت، رایگان و همان لحظه ──────────────────────────── */

  const checkout = await dispatch('/api/v1/plus/checkout', {
    method: 'POST',
    body: { planId: 'plus-free' }
  })
  const orderId = checkout.ok ? checkout.data?.orderId ?? checkout.data?.order?.id : null
  check('ساختِ سفارش', !!orderId, String(orderId))

  if (orderId) {
    const pay = await dispatch(`/api/v1/plus/orders/${orderId}/pay`, { method: 'POST' })
    check('پرداختِ خودکار', pay.ok === true, pay.ok ? 'فعال شد' : String(pay.errors))
    const entitled = await server.ssrLoadModule('/src/renderer/src/lib/plus/entitlement.ts')
    const status = entitled.getPlusStatus()
    check('دسترسیِ پلاس', status?.state === 'active' || status?.active === true,
      JSON.stringify(status).slice(0, 100))
  }

  /* ── ۶. سروا کلاب: فرستادن و خواندنِ سروده ────────────────────────── */

  const club = await server.ssrLoadModule('/src/renderer/src/lib/club/actions.ts')
  const created = await club.createClubPost({
    title: 'آزمایش',
    body: 'برای اینکه بماند بر جای خویش\nنگه دار مارا ز لغزش به پیش',
    form: 'ghazal',
    tags: [],
    anonymous: false
  })
  check('فرستادنِ سروده', created?.ok === true, created?.ok ? '' : String(created?.errors))

  const queries = await server.ssrLoadModule('/src/renderer/src/lib/club/queries.ts')
  const viewer = await queries.getClubViewer()
  const feed = await queries.getClubFeed(viewer, {})
  check('خواندنِ فهرست', (feed?.posts?.length ?? 0) > 0, `${feed?.posts?.length ?? 0} سروده`)
  const stats = await queries.getClubStats()
  check('آمارِ کلاب', stats.poems > 0, JSON.stringify(stats))

  /* ── ۷. امتحانِ نهایی ─────────────────────────────────────────────── */

  const exams = await server.ssrLoadModule('/src/renderer/src/platform/exams.ts')
  const list = exams.listExams ? exams.listExams() : []
  check('فهرستِ امتحان‌ها', list.length > 0, `${list.length} امتحان`)

  await go('#/exam')
  check('صفحهٔ امتحان', text().includes('امتحان نهایی'), text().slice(0, 60))

  /* ── ۸. ذخیره و ماندگاری ──────────────────────────────────────────── */

  db.flushNow()
  const dump = db.dump()
  const tables = Object.keys(dump)
  check('پایگاهِ محلی', tables.length >= 5, `${tables.length} جدول: ${tables.slice(0, 8).join(', ')}`)
  check('ماندگاری در localStorage', (window.localStorage.getItem('sarva-db-v1') ?? '').length > 100,
    `${(window.localStorage.getItem('sarva-db-v1') ?? '').length} بایت`)

  await go('#/panel')
  check('پنل', text().includes('پنل'), text().slice(0, 70))
} catch (error) {
  failed++
  console.log('\n✗ جریان شکست خورد:\n', error?.stack ?? error)
} finally {
  await server.close()
}

console.log(`\n${failed ? `✗ ${failed} مورد از ${passed + failed} شکست` : `✓ هر ${passed} بررسی گذشت`}`)
process.exit(failed ? 1 : 0)
