import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 900 } })
const p = await b.newPage()
const errs=[]; p.on('pageerror', e=>errs.push(e.message))
await p.goto('http://127.0.0.1:5173/#/lesson/7?read=1', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 1200))
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45))
await new Promise(x => setTimeout(x, 800))
const st = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('tabar-history-v1')).state
  return { pos: s.readPos?.[7], prog: s.lessonProgress?.[7], y: Math.round(window.scrollY) }
})
console.log('after scroll', JSON.stringify(st))
await p.goto('http://127.0.0.1:5173/#/home', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 500))
await p.goto('http://127.0.0.1:5173/#/lesson/7?read=1', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 1600))
console.log('restored y', await p.evaluate(() => Math.round(window.scrollY)))
// search jump still lands on mark
await p.goto('http://127.0.0.1:5173/#/lesson/7?read=1&q=' + encodeURIComponent('بغداد'), { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 1600))
console.log('mark', await p.evaluate(() => document.querySelectorAll('mark[data-bookhit]').length), 'y', await p.evaluate(() => Math.round(window.scrollY)))
console.log('ERRS', [...new Set(errs)].slice(0,3))
await b.close()
