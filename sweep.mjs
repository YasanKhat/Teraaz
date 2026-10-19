import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 1000 } })
const routes = ['home','chapters','chapter/2','lesson/7','lesson/7?read=1','lesson/7:bank','recap/7','archive/maps','archive/timeline','archive/figures','exams','quiz/lesson-5','progress','settings','paper/p6']
for (const r of routes) {
  const p = await b.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(e.message))
  p.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,110)) })
  const url = 'http://127.0.0.1:5173/#/' + r.replace(':bank','')
  await p.goto(url, { waitUntil: 'networkidle0' })
  await new Promise(x => setTimeout(x, 900))
  const info = await p.evaluate(() => ({ len: document.body.innerText.length, sw: document.documentElement.scrollWidth, h1: document.querySelector('h1')?.innerText.slice(0,40) }))
  console.log(r, JSON.stringify(info), errs.length ? 'ERR ' + [...new Set(errs)].slice(0,2) : '')
  if (['home','chapters','chapter/2','recap/7','progress'].includes(r)) await p.screenshot({ path: `/home/user/shots/sw-${r.replace(/\W/g,'_')}.png` })
  await p.close()
}
await b.close()
