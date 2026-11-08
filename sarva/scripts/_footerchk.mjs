// فوترِ پورت را با فوترِ زنده می‌سنجد: گروه‌ها، پیوندها، ترتیب، رایانامه و
// شبکه‌ها. فوتر رویِ همه‌ی صفحه‌هاست، پس یک لغزش اینجا همه‌جا دیده می‌شود.
// کاربرد: node scripts/_footerchk.mjs
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = '/home/user/Teraaz/sarva'
const live = new JSDOM(fs.readFileSync('/home/user/sarva-sources/home-live.html', 'utf8')).window
  .document

/** گروه‌ها و پیوندهایِ یک فوتر را بیرون می‌کشد. */
function groups(footer) {
  const out = []
  for (const h of footer.querySelectorAll('h3')) {
    const col = h.parentElement
    const links = [...(col?.querySelectorAll('a') || [])].map((a) => ({
      href: (a.getAttribute('href') || '').replace(/^#/, '') || '/',
      label: (a.textContent || '').replace(/\s+/g, ' ').trim(),
    }))
    out.push({ title: (h.textContent || '').trim(), links })
  }
  return out
}

const liveFooter = live.querySelector('footer')
const liveGroups = groups(liveFooter)
const liveMail = [...liveFooter.querySelectorAll('a[href^="mailto:"]')].map((a) =>
  (a.getAttribute('href') || '').replace('mailto:', ''),
)
const socials = (f) => [...f.querySelectorAll('a[target="_blank"]')]
  .filter((a) => !(a.getAttribute('href') || '').startsWith('mailto:'))
  .map((a) => ({
  href: a.getAttribute('href'),
  label: a.getAttribute('aria-label'),
}))
const liveSocial = socials(liveFooter)

/* ── پورت ─────────────────────────────────────────────────────────── */
const dom = new JSDOM(
  `<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/#/', pretendToBeVisual: true }
)
const { window } = dom
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent: () => false }))
class N { observe(){} unobserve(){} disconnect(){} takeRecords(){return []} }
window.IntersectionObserver = N; window.MutationObserver = N
window.scrollTo = () => {}; window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function') window.Element.prototype.animate = () => ({cancel(){},finish(){},play(){},pause(){},reverse(){},commitStyles(){},persist(){},finished:Promise.resolve(),onfinish:null,currentTime:0,playState:'finished',effect:{getComputedTiming:()=>({})}})
if (!window.crypto?.randomUUID) { window.crypto = window.crypto||{}; let n=0; window.crypto.randomUUID=()=>`u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) { if (window[k] !== undefined) { try { globalThis[k] = window[k] } catch {} } }
globalThis.window = window; globalThis.document = window.document; globalThis.self = window
class RO { constructor(cb){this.cb=cb} observe(el){setTimeout(()=>this.cb([{contentRect:{width:1200,height:400},target:el}],this),0)} unobserve(){} disconnect(){} }
window.ResizeObserver = RO; globalThis.ResizeObserver = RO

const server = await createServer({ configFile: path.join(root, 'vite.config.ts'), root, server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise((r) => setTimeout(r, 2600))

const portFooter = window.document.querySelector('footer')
const portGroups = groups(portFooter)
const portMail = [...portFooter.querySelectorAll('a[href^="mailto:"]')].map((a) =>
  (a.getAttribute('href') || '').replace('mailto:', ''),
)
const portSocial = socials(portFooter)

/* ── سنجش ─────────────────────────────────────────────────────────── */
const report = []
const check = (name, ok, extra = '') => report.push(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

check('شمارِ گروه‌ها یکی است', liveGroups.length === portGroups.length,
  `واقعی ${liveGroups.length} / پورت ${portGroups.length}`)
for (let i = 0; i < Math.max(liveGroups.length, portGroups.length); i++) {
  const a = liveGroups[i], b = portGroups[i]
  if (!a || !b) { check(`گروه ${i}`, false, `${a?.title} / ${b?.title}`); continue }
  check(`ستونِ «${a.title}»: همان پیوندها با همان ترتیب`,
    same(a.links, b.links),
    same(a.links, b.links) ? `${a.links.length} پیوند` : `واقعی ${JSON.stringify(a.links)} در برابر پورت ${JSON.stringify(b.links)}`)
}
check('رایانامه یکی است', same(liveMail, portMail), `واقعی ${liveMail} / پورت ${portMail}`)
check('شبکه‌ها: نشانی و برچسب یکی است', same(liveSocial, portSocial),
  same(liveSocial, portSocial) ? `${liveSocial.length} شبکه` : `واقعی ${JSON.stringify(liveSocial)} در برابر پورت ${JSON.stringify(portSocial)}`)

console.log(report.join('\n'))
const bad = report.filter((r) => r.startsWith('❌')).length
console.log(`\n${report.length - bad}/${report.length} گذشت`)
await server.close()
process.exit(bad ? 1 : 0)
