// ساختارِ DOMِ بخشِ «علامت‌های هجایی» در صفحه‌ی واقعیِ سایت.
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
const dump = JSON.parse(fs.readFileSync('/home/user/sarva-sources/sarva-deep.json','utf8'))
const { document } = new JSDOM(dump.pages['/vazn-yab']).window

// پیدا کردنِ نزدیک‌ترین جدول/شبکه به «هجای کوتاه»
const all = [...document.querySelectorAll('*')]
const hit = all.find(e => e.children.length === 0 && e.textContent.trim() === 'هجای کوتاه')
if (!hit) { console.log('پیدا نشد'); process.exit(0) }

// بالا رفتن تا جایی که همه‌ی سه ردیف را در بر بگیرد
let node = hit
for (let i = 0; i < 7; i++) {
  node = node.parentElement
  if (/هجای کشیده/.test(node.textContent)) break
}
// بالاتر رفتن تا خودِ بخش
for (let i = 0; i < 4; i++) node = node.parentElement
console.log('=== section ===', node.tagName, node.className)
console.log(node.outerHTML.replace(/></g, '>\n<').slice(0, 9000))
