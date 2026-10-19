import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1440, height: 1000 } })
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push('PAGE ' + e.message))
page.on('console', m => { if (m.type() === 'error') errs.push('CON ' + m.text().slice(0, 120)) })
const routes = ['/', '/chapters', '/chapter/1', '/chapter/2', '/chapter/3', '/chapter/4', '/recap/1', '/recap/2', '/recap/3', '/recap/4', '/archive', '/archive/timeline', '/archive/figures', '/archive/map', '/exams', '/me', '/settings', '/film/11']
for (const r of routes) {
  await page.goto('http://127.0.0.1:5173/#' + r, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 500))
  const m = await page.evaluate(() => ({ h: document.body.innerText.trim().length, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  if (m.h < 400 || m.sw > m.cw) console.log('BAD', r, JSON.stringify(m))
}
for (let i = 1; i <= 16; i++) {
  await page.goto('http://127.0.0.1:5173/#/lesson/' + i, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 450))
  const m = await page.evaluate(() => document.body.innerText.trim().length)
  if (m < 900) console.log('SHORT lesson', i, m)
}
await page.setViewport({ width: 390, height: 844 })
for (const r of routes.concat(['/lesson/1', '/lesson/16'])) {
  await page.goto('http://127.0.0.1:5173/#' + r, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 450))
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth }))
  if (m.sw > 390) console.log('MOBILE OVERFLOW', r, m.sw)
}
console.log('DONE ERRS', [...new Set(errs)].slice(0, 6))
await browser.close()
