import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1440, height: 1000 } })
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push(e.message))
for (const [name, route, y] of [['ch3','/chapter/3',380],['ch4','/chapter/4',420],['ch1','/chapter/1',300]]) {
  await page.goto('http://127.0.0.1:5173/#' + route, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 700))
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await new Promise(x => setTimeout(x, 400))
  await page.screenshot({ path: `/home/user/shots/d-${name}.png` })
}
console.log('ERRS', errs)
await browser.close()
