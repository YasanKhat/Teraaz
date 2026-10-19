import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 900 } })
const p = await b.newPage()
await p.goto('http://127.0.0.1:5173/#/lesson/2', { waitUntil: 'networkidle0' }); await new Promise(x=>setTimeout(x,800))
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('tabar-history-v1')).state
  s.readPos = { 7: 0.459 }
  localStorage.setItem('tabar-history-v1', JSON.stringify({ state: s, version: 1 }))
})
await p.reload({ waitUntil: 'networkidle0' })
await p.goto('http://127.0.0.1:5173/#/lesson/7?read=1', { waitUntil: 'networkidle0' })
for (const t of [300, 700, 1200, 2500]) {
  await new Promise(x => setTimeout(x, t === 300 ? 300 : t - 300))
  console.log(t, await p.evaluate(() => ({ y: Math.round(window.scrollY), h: document.documentElement.scrollHeight, art: document.querySelector('article[aria-label]')?.offsetHeight })))
}
await b.close()
