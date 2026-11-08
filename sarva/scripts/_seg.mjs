import fs from 'node:fs'
import { JSDOM } from 'jsdom'
const { document } = new JSDOM(fs.readFileSync('/home/user/sarva-sources/vazn-yab-live.html','utf8')).window
for (const g of document.querySelectorAll('[role=radiogroup]')) {
  const btns=[...g.querySelectorAll('button[role=radio]')]
  console.log('LABEL:', g.getAttribute('aria-label'))
  btns.forEach((b,i)=>console.log('   ',i, JSON.stringify(b.textContent.trim()), 'checked=', b.getAttribute('aria-checked')))
}
