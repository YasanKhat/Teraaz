import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1400, height: 950 } })
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push(e.message))
for (const [n, id] of [['l1',1],['l3',3],['l9',9],['l15',15]]) {
  await page.goto('http://127.0.0.1:5173/#/lesson/' + id, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 800))
  await page.screenshot({ path: `/home/user/shots/${n}.png` })
}
await page.setViewport({ width: 390, height: 844 })
for (const id of [1,3,9,15]) {
  await page.goto('http://127.0.0.1:5173/#/lesson/' + id, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 700))
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth }))
  console.log('mobile', id, m.sw)
}
console.log('ERRS', errs)
await browser.close()
