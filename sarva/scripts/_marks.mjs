// «∪» و «–» (علامت‌های هجایی) را در صفحه‌ی واقعی و در پورت پیدا می‌کند تا
// معلوم شود کجا کم گذاشته شده.
import fs from 'node:fs'
import { JSDOM } from 'jsdom'

const dump = JSON.parse(fs.readFileSync('/home/user/sarva-sources/sarva-deep.json','utf8'))
const html = dump.pages['/vazn-yab']
const { document } = new JSDOM(html).window
for (const s of ['script','style','noscript','svg']) document.querySelectorAll(s).forEach(e=>e.remove())
const live = document.body.textContent.replace(/\s+/g,' ').trim()

const count = (s, ch) => (s.match(new RegExp(ch,'g'))||[]).length
console.log('LIVE  ∪ :', count(live,'∪'), '  – :', count(live,'–'), '  U :', count(live,'U'))

// هر رشته‌ای که این نمادها را دارد
const hits = new Set()
const walk = (el) => {
  for (const n of el.childNodes) {
    if (n.nodeType === 3) {
      const t = n.textContent.trim()
      if (/[∪–U-]/.test(t) && t.length > 1) hits.add(t.slice(0,120))
    } else if (n.nodeName !== 'SCRIPT') walk(n)
  }
}
walk(document.body)
console.log('--- رشته‌های دارای علامت در صفحه‌ی واقعی ---')
;[...hits].slice(0,25).forEach(h=>console.log('  •', h))
