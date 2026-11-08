// متنِ صفحه‌ی اصلیِ پورت را با متنِ واقعیِ همان صفحه در سایت می‌سنجد.
// کاربرد: node scripts/_homediff.mjs
// زمینه‌ی سنجش: /home/user/sarva-sources/home-live.html (از sarvaedu.ir.har-3.txt)
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
import { execFileSync } from 'node:child_process'

const live = fs.readFileSync('/home/user/sarva-sources/home-live.html', 'utf8')
const realDoc = new JSDOM(live).window.document
// هدر و فوترِ مشترک را می‌اندازیم تا فقط بدنه‌ی صفحه سنجیده شود
for (const sel of ['header', 'footer', 'nav', 'script', 'style', 'noscript']) {
  realDoc.querySelectorAll(sel).forEach((n) => n.remove())
}
const realMain = realDoc.querySelector('main') || realDoc.body
const realText = realMain.textContent.replace(/\s+/g, ' ').trim()

// متنِ پورت
const mineRaw = execFileSync('node', ['scripts/_cmp.mjs', '#/'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
const mineDoc = new JSDOM(mineRaw).window.document
const mineMain = mineDoc.querySelector('#root') || mineDoc.body
const mineText = mineMain.textContent.replace(/\s+/g, ' ').trim()

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

// بخش‌های واقعی که در پورت نیست
const step = 12
const missing = []
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
  console.log(`  [${m.at}] …${A.slice(Math.max(0, m.at - 20), m.at + 110)}…`)
  if (++shown > 24) {
    console.log('  …')
    break
  }
}
if (!shown) console.log('  (هیچ — متن‌ها یکی است)')

// بخش‌های پورت که در واقعی نیست (افزوده‌هایِ ناخواسته)
const extra = []
const Bl = B.length
for (let i = 0; i < Bl - step; i += step) {
  const chunk = B.slice(i, i + step)
  if (!A.includes(chunk)) extra.push({ at: i, chunk })
}
console.log('\n=== بخش‌های پورت که در واقعی نیست ===')
last = -999
shown = 0
for (const m of extra) {
  if (m.at - last < step) {
    last = m.at
    continue
  }
  last = m.at
  console.log(`  [${m.at}] …${B.slice(Math.max(0, m.at - 20), m.at + 110)}…`)
  if (++shown > 24) {
    console.log('  …')
    break
  }
}
if (!shown) console.log('  (هیچ)')

const cov = Math.round((1 - missing.length / (A.length / step)) * 100)
console.log(`\nپوششِ متنی: ${cov}%`)
