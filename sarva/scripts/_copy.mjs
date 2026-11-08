import fs from 'node:fs'
import { JSDOM } from 'jsdom'
const dump = JSON.parse(fs.readFileSync('/home/user/sarva-sources/sarva-deep.json','utf8'))
const { document } = new JSDOM(dump.pages['/vazn-yab']).window
for (const b of document.querySelectorAll('button,[role=button],a')) {
  const al = (b.getAttribute('aria-label')||'') + ' ' + (b.getAttribute('title')||'')
  const t = (b.textContent||'').trim()
  if (/کپی|رونوشت|copy/i.test(al+' '+t)) {
    console.log('---', b.tagName, JSON.stringify({al: b.getAttribute('aria-label'), title:b.getAttribute('title')}))
    console.log(b.outerHTML.replace(/></g,'>\n<').slice(0,900))
  }
}
console.log('=== all aria-labels on vazn-yab ===')
;[...document.querySelectorAll('[aria-label]')].forEach(e=>console.log(' •', e.getAttribute('aria-label')))
