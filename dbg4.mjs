import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 950 } })
const page = await browser.newPage()
page.on('console', m => { if (m.type()==='error') console.log('ERR', m.text().slice(0,200)) })
await page.goto('http://127.0.0.1:5173/#/lesson/1?read=1&q=' + encodeURIComponent('چالدران'), { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 3000))
const info = await page.evaluate(() => {
  const matches = []
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = walk.nextNode())) if (n.nodeValue.includes('چالدران')) matches.push({ p: n.parentElement.tagName, c: n.parentElement.className.slice(0,50), v: n.nodeValue.slice(0, 60) })
  return { count: document.querySelectorAll('.lesson-prose').length, article: !!document.querySelector('article[aria-label]'), matches: matches.slice(0, 4) }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
