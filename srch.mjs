import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 950 } })
const page = await browser.newPage()
const errs = []
page.on('pageerror', e => errs.push('PAGE ' + e.message))
page.on('console', m => { if (m.type() === 'error') errs.push('CON ' + m.text().slice(0, 140)) })
await page.goto('http://127.0.0.1:5173/#/', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 500))
await page.keyboard.down('Control'); await page.keyboard.press('KeyK'); await page.keyboard.up('Control')
await new Promise(x => setTimeout(x, 400))
await page.keyboard.type('چالدران')
await new Promise(x => setTimeout(x, 2200))
await page.screenshot({ path: '/home/user/shots/search-book.png' })
const hits = await page.evaluate(() => [...document.querySelectorAll('mark[data-bookhit]')].length)
const body = await page.evaluate(() => document.body.innerText.includes('در متن کتاب'))
console.log('hasBookSection', body)
// click the book hit
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const b = btns.find(x => x.textContent?.includes('متن کتاب'))
  b?.click()
})
await new Promise(x => setTimeout(x, 2500))
console.log('url', page.url())
const marked = await page.evaluate(() => document.querySelectorAll('mark[data-bookhit]').length)
console.log('marked', marked)
await page.screenshot({ path: '/home/user/shots/search-book2.png' })
console.log('ERRS', [...new Set(errs)].slice(0,4))
await browser.close()
