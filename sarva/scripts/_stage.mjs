// دو چیز را می‌سنجد: (۱) ارکانِ زیرِ صحنه درست باشند، (۲) کشِ پارتیتور کار کند.
import path from 'node:path'
import { createServer } from 'vite'

const root = '/home/user/Teraaz/sarva'
const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'), root,
  server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
})

const { bareHemi, splitFeet } = await server.ssrLoadModule('/src/renderer/src/lib/vazn-yab/prosody.ts')
const { renderCached, scoreKey, buildHemis } = await server.ssrLoadModule('/src/renderer/src/lib/vazn-yab/score.ts')

let bad = 0
const check = (n, c, x = '') => { console.log(`${c ? '✅' : '❌'} ${n}${x ? ' — ' + x : ''}`); if (!c) bad++ }

// ── ۱) ارکانِ صحنه ────────────────────────────────────────────────
const CASES = [
  { feet: 'فعولن فعولن فعولن فعل', expect: 'فعولن فعولن فعولن فعل' },
  { feet: 'مفاعلن فعلاتن مفاعلن فعلن', expect: 'مفاعلن فعلاتن مفاعلن فعلن' },
  { feet: 'فاعلاتن فاعلاتن فاعلن', expect: 'فاعلاتن فاعلاتن فاعلن' },
  { feet: 'مفعول مفاعیل مفاعیل فعل', expect: 'مفعول مفاعیل مفاعیل فعل' },
]
for (const c of CASES) {
  const feetArr = splitFeet(c.feet)
  // همان کاری که کامپوننتِ صحنه انجام می‌دهد
  const raw = bareHemi(c.feet)
  const labels = []
  let cur = raw[0]?.foot
  const seen = []
  for (const s of raw) {
    if (s.foot !== cur) { seen.push(cur); cur = s.foot }
  }
  seen.push(cur)
  for (const f of seen) labels.push(feetArr[f] ?? `(ناشناختهٔ ${f})`)
  const got = labels.join(' ')
  check(`ارکانِ «${c.feet}»`, got === c.expect, got)
}
// تعدادِ هجاها
const raw = bareHemi('فعولن فعولن فعولن فعل')
check('شاهنامه ۱۱ هجا در هر مصراع', raw.length === 11, String(raw.length))
check('شماره‌ی رکن‌ها صفر تا سه است', JSON.stringify([...new Set(raw.map(r => r.foot))]) === '[0,1,2,3]',
  JSON.stringify([...new Set(raw.map(r => r.foot))]))

// ── ۲) کشِ پارتیتور ───────────────────────────────────────────────
const input = { hemis: buildHemis('فعولن فعولن فعولن فعل'), unit: 0.238, mode: 'chahargah', character: 'epic' }
const k1 = scoreKey(input)
const t0 = Date.now()
const a = await renderCached(input)
const first = Date.now() - t0
check('نخستین ساخت انجام شد', !!(a && a.left.length), `${first} میلی‌ثانیه، ${a?.left.length ?? 0} نمونه`)

const same = scoreKey({ ...input })
const t1 = Date.now()
const b = await renderCached(input)
const second = Date.now() - t1
check('کلید برای ورودیِ یکسان یکی است', k1 === same)
check('بارِ دوم همان پارتیتور برگشت', a === b)
check('بارِ دوم بی‌درنگ است', second < 5, `${second} میلی‌ثانیه در برابر ${first} میلی‌ثانیه`)

// سقفِ شش‌تایی
for (let i = 0; i < 9; i++) {
  await renderCached({ ...input, unit: 0.2 + i * 0.01 })
}
console.log(`\n${bad ? bad + ' مورد نگذشت' : 'همه گذشت'}`)
await server.close()
process.exit(bad ? 1 : 0)
