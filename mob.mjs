import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } })
const p = await b.newPage()
const errs = []
p.on('pageerror', e => errs.push(e.message))
for (const [route, name] of [['home','m-home'],['archive/figures','m-figures'],['paper/p1','m-paper'],['lesson/13','m-lesson']]) {
  await p.goto(`http://127.0.0.1:5173/#/${route}`, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 900))
  const info = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, dock: !!document.querySelector('.dock'), dockVisible: document.querySelector('.dock') ? getComputedStyle(document.querySelector('.dock')).display : 'none' }))
  console.log(route, JSON.stringify(info))
  await p.screenshot({ path: `/home/user/shots/${name}.png` })
}
console.log('ERRS', [...new Set(errs)].slice(0,4))
await b.close()
