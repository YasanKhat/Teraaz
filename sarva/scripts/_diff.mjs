// متنِ رندرشده‌ی پورت را با متنِ واقعیِ همان صفحه در سایت مقایسه می‌کند.
// کاربرد: node scripts/_diff.mjs /vazn-yab '#/vazn-yab'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
import { execFileSync } from 'node:child_process'

const route = process.argv[2]
const hash = process.argv[3] || '#' + route

const dump = JSON.parse(fs.readFileSync('/tmp/arena-coding-uploads/sarva-deep.json', 'utf8'))
const html = dump.pages[route]
if (!html) {
  console.error('صفحه در فایلِ مرحله‌ی ۱ نیست:', route)
  process.exit(1)
}

// متنِ واقعی
const realDoc = new JSDOM(html).window.document
// حذفِ هدر و فوترِ مشترک تا فقط بدنه‌ی صفحه مقایسه شود
for (const sel of ['header.site-header', 'footer', 'nav', 'script', 'style', 'noscript']) {
  realDoc.querySelectorAll(sel).forEach((n) => n.remove())
}
const realMain = realDoc.querySelector('main') || realDoc.body
const realText = realMain.textContent.replace(/\s+/g, ' ').trim()

// متنِ پورت
const mineRaw = execFileSync('node', ['scripts/_cmp.mjs', hash], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
const mineDoc = new JSDOM(mineRaw).window.document
const mineMain = mineDoc.querySelector('#root') || mineDoc.body
let mineText = mineMain.textContent.replace(/\s+/g, ' ').trim()

// نرمال‌سازی: اعدادِ فارسی/لاتین و نیم‌فاصله یکی شود
const norm = (s) =>
  s
    .replace(/[يی]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/‌/g, '')
    .replace(/\s+/g, ' ')

const A = norm(realText)
const B = norm(mineText)

console.log('طولِ متنِ واقعی:', A.length)
console.log('طولِ متنِ پورت  :', B.length)

// جمله‌های واقعی که در پورت نیستند
const missing = []
const step = 12
for (let i = 0; i < A.length - step; i += step) {
  const chunk = A.slice(i, i + step)
  if (!B.includes(chunk)) missing.push({ at: i, chunk })
}
console.log('\n=== بخش‌های واقعی که در پورت نیست ===')
let last = -999
let shown = 0
for (const m of missing) {
  if (m.at - last < step) {
    last = m.at
    continue
  }
  last = m.at
  console.log(`  [${m.at}] …${A.slice(Math.max(0, m.at - 20), m.at + 90)}…`)
  if (++shown > 24) {
    console.log('  …')
    break
  }
}
if (!shown) console.log('  (هیچ — متن‌ها یکی است)')

const cov = Math.round((1 - missing.length / (A.length / step)) * 100)
console.log(`\nپوششِ متنی: ${cov}%`)
