import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
await p.goto('http://127.0.0.1:5173/#/lesson/1', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 900))
console.log(await p.evaluate(() => {
  const chips = [...document.querySelectorAll('button')].filter(b => ['صحنه‌ها','متن کامل','پرسش‌ها','خط‌به‌خط','کارت‌ها','آزمون'].includes(b.textContent.trim()))
  return chips.map(b => { const r = b.getBoundingClientRect(); return [b.textContent.trim(), Math.round(r.left), Math.round(r.right)] })
}))
await p.screenshot({ path: '/home/user/shots/chips-mobile.png' })
await b.close()
