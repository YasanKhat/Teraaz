import fs from 'node:fs'
import { JSDOM } from 'jsdom'
const { document } = new JSDOM(fs.readFileSync('/home/user/sarva-sources/vazn-yab-live.html','utf8')).window
const sec = document.querySelector('section[aria-labelledby="vy-guide"]')
fs.writeFileSync('/home/user/sarva-sources/guide.html', sec.outerHTML)
console.log('guide saved', sec.outerHTML.length)
const m = document.querySelector('section[aria-labelledby="vy-meters"]')
fs.writeFileSync('/home/user/sarva-sources/meters.html', m.outerHTML)
console.log('meters saved', m.outerHTML.length)
