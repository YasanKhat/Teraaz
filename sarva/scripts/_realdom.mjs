// ساختارِ DOMِ واقعیِ یک صفحه‌ی سایت را از فایلِ مرحله‌ی ۱ بیرون می‌کشد.
// کاربرد: node scripts/_realdom.mjs /vazn-yab
import fs from 'node:fs'
import { JSDOM } from 'jsdom'

const route = process.argv[2] || '/vazn-yab'
const dump = JSON.parse(fs.readFileSync('/tmp/arena-coding-uploads/sarva-deep.json', 'utf8'))
const html = dump.pages[route]
if (!html) {
  console.error('صفحه پیدا نشد:', route)
  console.error('دسترس‌ها:', Object.keys(dump.pages).filter(k => k.includes(route.slice(1, 6))).join(' '))
  process.exit(1)
}

const { document } = new JSDOM(html).window
const root = document.querySelector('main') || document.body

const SKIP = new Set(['script', 'style', 'noscript', 'svg', 'path', 'link', 'meta'])

function textOf(el) {
  let s = ''
  for (const n of el.childNodes) {
    if (n.nodeType === 3) s += n.textContent
    else if (!SKIP.has(n.nodeName.toLowerCase())) s += textOf(n)
  }
  return s.replace(/\s+/g, ' ').trim()
}

let depth = 0
function walk(el) {
  if (SKIP.has(el.tagName?.toLowerCase())) return
  const cls = (el.getAttribute?.('class') || '').trim()
  const own = textOf(el)
  const kids = [...el.children].filter(c => !SKIP.has(c.tagName.toLowerCase()))
  // فقط عناصری که خودشان متن دارند یا ارزشِ ساختاری دارند
  if (own || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON') {
    const indent = '  '.repeat(depth)
    const tag = el.tagName.toLowerCase()
    const attrs = []
    if (el.getAttribute('type')) attrs.push(`type=${el.getAttribute('type')}`)
    if (el.getAttribute('placeholder')) attrs.push(`ph="${el.getAttribute('placeholder')}"`)
    if (el.getAttribute('role')) attrs.push(`role=${el.getAttribute('role')}`)
    if (el.getAttribute('aria-label')) attrs.push(`aria=${el.getAttribute('aria-label')}`)
    if (el.getAttribute('dir')) attrs.push(`dir=${el.getAttribute('dir')}`)
    console.log(
      `${indent}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>` +
        (cls ? ` .${cls.split(/\s+/).join('.')}` : '') +
        (own ? `  «${own.slice(0, 78)}»` : ''),
    )
  }
  depth++
  for (const k of kids) walk(k)
  depth--
}

console.log('=== DOMِ واقعیِ ' + route + ' ===\n')
walk(root)
