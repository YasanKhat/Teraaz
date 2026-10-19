import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 950 } })
const page = await browser.newPage()
await page.goto('http://127.0.0.1:5173/#/lesson/1?read=1&q=' + encodeURIComponent('چالدران'), { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 2500))
const info = await page.evaluate(() => ({
  has: document.body.innerText.includes('چالدران'),
  marks: document.querySelectorAll('mark').length,
  mode: [...document.querySelectorAll('button')].filter(b => b.className.includes('bg-gold/15')).map(b=>b.textContent?.trim()),
  books: document.body.innerText.slice(0, 200)
}))
console.log(JSON.stringify(info, null, 1).slice(0, 900))
await browser.close()
