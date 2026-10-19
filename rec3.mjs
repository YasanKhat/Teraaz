import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 1000 } })
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push(e.message))
for (const c of [1,2,3,4]) {
  await page.goto('http://127.0.0.1:5173/#/recap/' + c, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 600))
  await page.screenshot({ path: `/home/user/shots/r${c}.png` })
}
await page.setViewport({ width: 390, height: 844 })
for (const c of [2,4]) {
  await page.goto('http://127.0.0.1:5173/#/recap/' + c, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 500))
  console.log('mobile', c, await page.evaluate(() => document.documentElement.scrollWidth))
}
console.log('ERRS', errs)
await browser.close()
