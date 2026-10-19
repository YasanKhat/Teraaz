import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 950 } })
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push('PAGE ' + e.message))
page.on('console', m => { if (m.type() === 'error') errs.push('CON ' + m.text().slice(0, 140)) })
const routes = ['/', '/chapters', '/chapter/1', '/chapter/2', '/chapter/3', '/chapter/4', '/recap/1', '/recap/2', '/recap/3', '/recap/4', '/archive', '/archive/timeline', '/archive/figures', '/archive/map', '/exams', '/me', '/settings', '/film/11', '/exam/mid-1']
for (const r of routes) {
  await page.goto('http://127.0.0.1:5173/#' + r, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 450))
  const m = await page.evaluate(() => ({ h: document.body.innerText.trim().length, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  if (m.h < 400 || m.sw > m.cw) console.log('BAD', r, JSON.stringify(m))
}
// mobile incl. book read mode
await page.setViewport({ width: 390, height: 844 })
for (const id of [1, 8, 16]) {
  await page.goto('http://127.0.0.1:5173/#/lesson/' + id, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 400))
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'متن کامل')?.click())
  await new Promise(x => setTimeout(x, 1000))
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, prose: document.querySelectorAll('.lesson-prose').length }))
  console.log('mobile read', id, JSON.stringify(m))
}
// print view
await page.setViewport({ width: 900, height: 1200 })
await page.goto('http://127.0.0.1:5173/#/lesson/16', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 400))
await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'متن کامل')?.click())
await new Promise(x => setTimeout(x, 1200))
await page.emulateMediaType('print')
await new Promise(x => setTimeout(x, 500))
await page.screenshot({ path: '/home/user/shots/print-book.png' })
console.log('ERRS', [...new Set(errs)].slice(0, 6))
await browser.close()
