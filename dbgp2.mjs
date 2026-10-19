import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 1000 } })
const p = await b.newPage()
await p.goto('http://127.0.0.1:5173/#/paper/p3', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 900))
await p.screenshot({ path: '/home/user/shots/crop2.png', clip: { x: 160, y: 330, width: 460, height: 220 } })
await b.close()
