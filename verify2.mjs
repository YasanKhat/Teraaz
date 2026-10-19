import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 950 } })
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push('PAGE ' + e.message))
page.on('console', m => { if (m.type() === 'error') errs.push('CON ' + m.text().slice(0, 140)) })
for (let i = 1; i <= 16; i++) {
  await page.goto('http://127.0.0.1:5173/#/lesson/' + i, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 350))
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'متن کامل')?.click())
  await new Promise(x => setTimeout(x, 700))
  const m = await page.evaluate(() => ({ len: document.body.innerText.length, h: document.querySelectorAll('article[aria-label] p').length }))
  console.log(i, m.len, m.h)
}
console.log('ERRS', [...new Set(errs)].slice(0, 6))
await browser.close()
