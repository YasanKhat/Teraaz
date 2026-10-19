import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 1000 } })
const p = await b.newPage()
await p.goto('http://127.0.0.1:5173/#/paper/p3', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 800))
console.log(await p.evaluate(() => {
  const row = [...document.querySelectorAll('div')].find(d => d.className.includes('flex gap-2 py-[3px]'))
  if (!row) return 'none'
  const cs = getComputedStyle(row)
  const [a, bb] = row.children
  return { dir: cs.direction, flex: cs.flexDirection, row: row.getBoundingClientRect().toJSON(), a: a.getBoundingClientRect().toJSON(), b: bb.getBoundingClientRect().toJSON(), cls: row.className }
}))
await b.close()
