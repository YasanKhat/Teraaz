import path from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
const root = '/home/user/Teraaz/sarva'
const dom = new JSDOM(`<!doctype html><html lang="fa" dir="rtl"><head></head><body><div id="root"></div></body></html>`, { url: 'http://localhost/#/panel', pretendToBeVisual: true })
const { window } = dom
window.matchMedia = window.matchMedia || ((q)=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent:()=>false}))
class N { observe(){} unobserve(){} disconnect(){} takeRecords(){return[]} }
window.IntersectionObserver = N; window.ResizeObserver = N; window.MutationObserver = N
window.scrollTo = () => {}; window.Element.prototype.scrollIntoView = () => {}
window.HTMLCanvasElement.prototype.getContext = () => null
if (typeof window.Element.prototype.animate !== 'function') window.Element.prototype.animate = () => ({cancel(){},finish(){},play(){},pause(){},reverse(){},commitStyles(){},persist(){},finished:Promise.resolve(),onfinish:null,currentTime:0,playState:'finished',effect:{getComputedTiming:()=>({})}})
for (const p of [window.SVGElement, window.SVGPathElement]) if (p && !p.prototype.getTotalLength) { p.prototype.getTotalLength = () => 100; p.prototype.getPointAtLength = () => ({x:0,y:0}) }
if (!window.crypto?.randomUUID) { window.crypto = window.crypto||{}; let n=0; window.crypto.randomUUID=()=>`u-${++n}` }
globalThis.__SARVA_WEB__ = true
for (const k of ['window','document','navigator','location','history','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','HashChangeEvent','PopStateEvent','DOMParser','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','matchMedia','IntersectionObserver','ResizeObserver','MutationObserver','localStorage','sessionStorage','crypto','Image','Audio','Headers','Request','Response','AbortController','Blob','File','FileReader','URL','URLSearchParams','TextDecoder','TextEncoder','SVGElement','SVGSVGElement','SVGPathElement','HTMLCanvasElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLAudioElement','Range','NodeList','FormData','XMLHttpRequest','screen']) { if (window[k]!==undefined) { try { globalThis[k]=window[k] } catch {} } }
globalThis.window = window; globalThis.document = window.document; globalThis.self = window
const server = await createServer({ configFile: path.join(root,'vite.config.ts'), root, server:{middlewareMode:true}, appType:'custom', logLevel:'error' })
const { auth, db } = await server.ssrLoadModule('/src/renderer/src/platform/index.ts')
const { dispatch } = await server.ssrLoadModule('/src/renderer/src/platform/server.ts')
await server.ssrLoadModule('/src/renderer/src/main.tsx')
await new Promise(r=>setTimeout(r,800))

// یک حساب + کمی فعالیت واقعی، تا پنل چیزی برای نشان دادن داشته باشد
await auth.register({ fullName: 'سارا دانش‌آموز', email: 'sara@sarva.local', password: 'sarva-1234' })
await auth.login('sara@sarva.local', 'sarva-1234')
const uid = auth.currentUserId()
const bank = (await dispatch('/api/v1/quiz/bank', {method:'GET'})).data.questions
const picked = bank.slice(0,5).map(q => ({ questionId: q.id, selectedOptionId: q.options[0]?.id ?? null }))
await dispatch('/api/v1/quiz/attempt', { method:'POST', body:{ answers: picked } })
for (const q of bank.slice(0,8)) await dispatch('/api/v1/quiz/answer', { method:'POST', body:{ questionId:q.id, selectedOptionId:q.options[0]?.id } })
await dispatch('/api/v1/vocab/answer', { method:'POST', body:{ wordId:'10-1-0', correct:true, word:'افلاک', meaning:'آسمان‌ها' } })
await dispatch('/api/v1/grammar-circuit/answers', { method:'POST', body:{ questionId:'q1', correct:true } })
db.flushNow()
console.log('فعالیتِ ثبت‌شده: quiz_answers =', db.find('quiz_answers', ()=>true).length, '| attempts =', db.find('quiz_attempts', ()=>true).length, '| attempt_answers =', db.find('quiz_attempt_answers', ()=>true).length, '| vocab =', db.find('vocab_answers', ()=>true).length)

for (const sub of ['home','aruz','vocab','exam','bookmarks','club','rang-ara','support','billing','analysis']) {
  window.location.hash = '#/panel/' + sub
  await new Promise(r=>setTimeout(r,900))
  const el = window.document.querySelector('#panel-content')
  const t = (el?.textContent ?? '').replace(/\s+/g,' ').trim()
  console.log(`\n— /panel/${sub}  (${t.length} نویسه)`)
  console.log('   ', t.slice(0, 150) || '«خالی»')
}
await server.close()
