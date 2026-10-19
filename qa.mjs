import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--single-process','--no-zygote'], headless: true, defaultViewport: { width: 1280, height: 1000 } })
const p = await b.newPage()
const errs = []
p.on('pageerror', e => errs.push(e.message))
p.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,120)) })
await p.goto('http://127.0.0.1:5173/#/home', { waitUntil: 'networkidle0' })
await p.evaluate(() => {
  const st = { xp: 120, completed: [1,2], lessonProgress: { 1: 70 }, quizzes: {}, exams: [], cards: {}, bookmarks: ['figure-1'], notes: { 3: 'یادداشت آزمایشی' }, days: ['2026-10-18'], settings: { theme: 'dark', motion: true }, lastLesson: 3, visited: { home: true }, quests: {} }
  localStorage.setItem('tabar-history-v1', JSON.stringify({ state: st, version: 1 }))
})
await p.reload({ waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 500))
const raw = await p.evaluate(() => localStorage.getItem('tabar-history-v1'))
fs.writeFileSync('/tmp/backup.json', JSON.parse(raw).state ? JSON.stringify(JSON.parse(raw)) : raw)
console.log('exported bytes', raw.length)

// palette checks
await p.keyboard.down('Control'); await p.keyboard.press('KeyK'); await p.keyboard.up('Control')
await new Promise(x => setTimeout(x, 400))
await p.type('input[placeholder*="جست‌وجو"]', 'چالدران')
await new Promise(x => setTimeout(x, 900))
const pal = await p.evaluate(() => ({
  open: !!document.querySelector('[role="dialog"]'),
  digits: [...document.querySelectorAll('[role="dialog"] .text-\\[0\\.7rem\\].font-bold')].map(e=>e.textContent),
  lock: getComputedStyle(document.body).overflow,
  snippet: document.querySelector('[role="dialog"]')?.innerText.includes('متن کتاب')
}))
console.log('palette', JSON.stringify(pal))
await p.mouse.click(30, 700)
await new Promise(x => setTimeout(x, 300))
console.log('closed after backdrop', await p.evaluate(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).overflow))

// reset then import
await p.goto('http://127.0.0.1:5173/#/settings', { waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 600))
await p.evaluate(() => localStorage.removeItem('tabar-history-v1'))
await p.reload({ waitUntil: 'networkidle0' })
await new Promise(x => setTimeout(x, 600))
const input = await p.$('input[type=file]')
await input.uploadFile('/tmp/backup.json')
await new Promise(x => setTimeout(x, 700))
const after = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('tabar-history-v1') || '{}').state || {}
  return { xp: s.xp, completed: s.completed, note: s.notes?.[3], msg: document.body.innerText.includes('بازیابی شد') }
})
console.log('import', JSON.stringify(after))
// bad file
fs.writeFileSync('/tmp/bad.json', '{"hello":1}')
await input.uploadFile('/tmp/bad.json')
await new Promise(x => setTimeout(x, 600))
console.log('bad rejected', await p.evaluate(() => document.body.innerText.includes('معتبر نیست')), 'xp kept', await p.evaluate(() => JSON.parse(localStorage.getItem('tabar-history-v1')).state.xp))
console.log('ERRS', [...new Set(errs)].slice(0,4))
await b.close()
