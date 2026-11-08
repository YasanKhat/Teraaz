import fs from 'node:fs'
import { JSDOM } from 'jsdom'
const dump = JSON.parse(fs.readFileSync('/tmp/arena-coding-uploads/sarva-deep.json','utf8'))
const html = dump.pages['/vazn-yab']
const { document } = new JSDOM(html).window
const svgs = [...document.querySelectorAll('svg')]
console.log('svg count:', svgs.length)
svgs.forEach((s,i)=>{
  const texts=[...s.querySelectorAll('text')].map(t=>t.textContent.trim())
  const paths=s.querySelectorAll('path').length
  const circles=s.querySelectorAll('circle').length
  if (paths>4 || texts.length) console.log(`#${i} vb=${s.getAttribute('viewBox')} paths=${paths} circles=${circles} texts=[${texts.join(' | ')}]`)
})
