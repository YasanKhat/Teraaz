import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 900 } })
const page = await browser.newPage()
const report = {}
for (const r of ['/', '/chapters', '/chapter/1', '/chapter/4', '/lesson/3', '/recap/2', '/archive', '/archive/timeline', '/exams', '/me', '/settings']) {
  await page.goto('http://127.0.0.1:5173/#' + r, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 500))
  const res = await page.evaluate(() => {
    const heads = [...document.querySelectorAll('h1')].map(h => h.textContent.trim().slice(0, 30))
    const noLabel = [...document.querySelectorAll('button')].filter(b => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length
    const lang = document.documentElement.lang
    const dir = document.documentElement.dir
    const imgsNoAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length
    return { h1: heads.length, heads, noLabel, lang, dir, imgsNoAlt }
  })
  report[r] = res
}
console.log(JSON.stringify(report, null, 1))
await browser.close()
