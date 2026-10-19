import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 1000 } })
const p = await b.newPage()
await p.goto('http://127.0.0.1:5173/#/paper/p3', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 900))
console.log(await p.evaluate(() => [...document.querySelectorAll('div')].filter(d => /flex gap-2 py-\[3px\]/.test(d.className)).slice(0,3).map(d => ({
  text: d.textContent.slice(0, 40),
  row: [Math.round(d.getBoundingClientRect().left), Math.round(d.getBoundingClientRect().width)],
  kids: [...d.children].map(c => Math.round(c.getBoundingClientRect().left) + ":" + Math.round(c.getBoundingClientRect().width) + ":" + getComputedStyle(c).textAlign)
}))))
await b.close()
