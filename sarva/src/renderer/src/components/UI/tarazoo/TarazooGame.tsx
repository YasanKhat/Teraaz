import { useEffect, useState, type CSSProperties } from 'react'
import Tour from '@/components/UI/kit/Tour'
import { immersiveMode } from '@/lib/immersive-mode'
import { GameBackButton } from '@/components/UI/games/GameNav'
import bank from '@/data/seeds/tarazoo/public-bank.json'
import { buildRound, answerOf, isWrongMove, KINDS, KIND_NAMES, KIND_HINTS, type Kind, type Question, type Family } from './round'
import hero from './hero.html?raw'
import scene from './scene.html?raw'
import './tarazoo.css'
import './local.css'
const T='tarazoo-module__AjZGMW__', fa=(n:number)=>n.toLocaleString('fa-IR'), letters=['الف','ب','ج','د']
const setupTour = [{target:'[data-tour="tz-balance"]',text:'هم‌مفهوم یعنی هم‌وزن: بیتِ هم‌مفهوم ترازو را صاف می‌کند و بیتِ دیگر کجش.'},{target:'[data-tour="tz-kinds"]',text:'پنج نوع سؤالِ قرابت؛ هر کدام را نخواهی خاموشش کن.'},{target:'[data-tour="tz-start"]',text:'هر دور ده سؤال است. اولِ هر نوع، راهنمای کوتاهش می‌آید.'}]
const hints:Record<Kind,string>={match:'بیتِ هم‌مفهوم را در کفهٔ خالی بگذار.',concept:'همهٔ بیت‌هایی را که این مفهوم را دارند در کفه بگذار.',odd:'بیتی را که هم‌مفهومِ بقیه نیست از کفه بردار.',pairs:'دو بیتِ هم‌مفهوم را در دو کفه بگذار.',meaning:'مفهومِ این بیت را در کفه بگذار.'}
export default function TarazooGame(){
 const [kinds,setKinds]=useState<Kind[]>(KINDS), [screen,setScreen]=useState<'setup'|'play'|'result'>('setup')
 const [round,setRound]=useState<Question[]>([]),[index,setIndex]=useState(0),[chosen,setChosen]=useState<string[]>([]),[mistakes,setMistakes]=useState(0),[points,setPoints]=useState(0),[streak,setStreak]=useState(0),[won,setWon]=useState(false),[notice,setNotice]=useState(''),[history,setHistory]=useState<number[]>([])
 const q=round[index]
 useEffect(()=>{immersiveMode.set(screen==='play'?'fullscreen':'off');return()=>immersiveMode.set('off')},[screen])
 function start(){if(!kinds.length)return;setRound(buildRound(kinds,5,bank as Family[]));setIndex(0);setChosen([]);setMistakes(0);setPoints(0);setStreak(0);setWon(false);setNotice('');setHistory([]);setScreen('play');window.scrollTo({top:0,behavior:'instant'})}
 function next(){if(index+1===round.length){setScreen('result');return}setIndex(n=>n+1);setChosen([]);setMistakes(0);setWon(false);setNotice('')}
 function act(id:string){
  if(!q||won||chosen.includes(id))return
  if(isWrongMove(q,id)){const n=mistakes+1;setMistakes(n);setStreak(0);setNotice(n>=2?'از گزینه‌های هم‌رنگ راهنما استفاده کن.':'این گزینه پاسخ درست نیست؛ دوباره تلاش کن.');return}
  const selected=[...chosen,id];setChosen(selected);setNotice('')
  const solved=q.kind==='odd'||selected.length===(q.kind==='pairs'?2:answerOf(q).length)
  if(solved){const score=mistakes===0?100+10*Math.min(streak,5):40;setPoints(n=>n+score);setStreak(n=>mistakes?0:n+1);setHistory(a=>[...a,mistakes]);setWon(true);setNotice(`درست! مفهوم: ${q.options.find(o=>answerOf(q).includes(o.id))?.idea}`)}
 }
 useEffect(()=>{if(screen!=='play'||!q)return;const handle=(e:KeyboardEvent)=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName))return;const n=Math.max('1234'.indexOf(e.key),'۱۲۳۴'.indexOf(e.key));if(n>=0&&q.options[n])act(q.options[n].id);else if(e.key==='Enter'&&won&&(e.target as HTMLElement)?.tagName!=='BUTTON')next()};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle)})
 return <div className={T+'root'} data-screen={screen} dir="rtl" style={{'--tz-top':'80px'} as CSSProperties}>
  <header className={T+'topbar'}><GameBackButton href="/game"/><div className={T+'topMid'}>{q&&screen==='play'&&<><span className={T+'kindName'}>{KIND_NAMES[q.kind]}</span><ol className={T+'ticks'} aria-label={`سؤال ${fa(index+1)} از ${fa(round.length)}`}>{round.map((_,i)=><li key={i} data-state={i<index?(history[i]?'mid':'ok'):i===index?'now':undefined}/>)}</ol><span className={T+'count'}><b>{fa(index+1)}</b> از {fa(round.length)}</span></>}</div><div className={T+'topEnd'}>{screen==='play'&&<div className={T+'score'}><b>{fa(points)}</b><small>امتیاز</small></div>}</div></header>
  {screen==='result'?<section className="tarazoo-local-result"><h1>نتیجهٔ ترازوی معنا</h1><p>{fa(points)} امتیاز</p><p>{fa(history.filter(x=>x===0).length)} پاسخ بدون اشتباه از {fa(round.length)}</p><button className={T+'primary'} onClick={start}>دوباره</button><button className={T+'ghostBtn'} onClick={()=>setScreen('setup')}>انتخاب نوع سؤال</button></section>:<main className={T+'machine'} data-screen={screen}>
   <div className={T+'side'}><section className={T+'display'} data-form={q&&screen==='play'?q.prompt?.form:undefined}>
    {screen==='setup'?<div className={T+'hero'} dangerouslySetInnerHTML={{__html:hero}}/>:q&&<><span className={T+'leds'} aria-label={`${fa(Math.max(0,2-mistakes))} فرصت`}>{[0,1].map(i=><i key={i} data-used={i<mistakes||undefined}/>)}</span><div className={T+'verseBox'}><div className={T+'promptText'}>{q.prompt?q.prompt.text.split(' / ').map((line,i)=><p key={i}>{line}</p>):'کدام دو بیت هم‌مفهوم‌اند؟'}</div></div><div className={T+'status'} aria-live="polite"><span>{notice||hints[q.kind]}</span>{won&&<button className={T+'primary'} onClick={next}>ادامه</button>}</div></>}
   </section><section className={T+'deck'}>
   {screen==='setup'?<><Tour id="setup-tarazoo" steps={setupTour}/><div className={T+'field'}><span className={T+'fieldLabel'}>نوع سؤال</span><div className={T+'kinds'} role="group" aria-label="نوع سؤال" data-tour="tz-kinds">{KINDS.map((kind,i)=><button key={kind} className={T+'kindKey'} style={{'--i':i} as CSSProperties} aria-pressed={kinds.includes(kind)} onClick={()=>setKinds(a=>a.includes(kind)?a.filter(v=>v!==kind):[...a,kind])}><i aria-hidden="true"/><b>{KIND_NAMES[kind]}</b><small>{KIND_HINTS[kind]}</small></button>)}</div></div><div className={T+'deckFoot'}><div className={T+'sizeBox'}><span className={T+'sizeLabel'}>تعداد</span><div className={T+'sizes'} role="radiogroup" aria-label="تعداد سؤال">{[5,10,15,20,50].map(n=><button key={n} role="radio" aria-checked={n===5} className={T+'sizeKey'} data-locked={n!==5||undefined} onClick={()=>n!==5&&setNotice('تعداد بیشتر مخصوص سروا پلاس است.')}><b>{fa(n)}</b>{n!==5&&<span aria-label="سروا پلاس">🔒</span>}</button>)}</div></div><button className={T+'primary'} disabled={!kinds.length} data-tour="tz-start" onClick={start}>شروع ←</button></div>{notice&&<p role="status">{notice}</p>}</>:q&&<div className={T+'cards'} data-kind={q.kind}>{q.options.map((option,i)=><button key={option.id} className={T+'card'} data-live={!won&&!chosen.includes(option.id)||undefined} data-selected={chosen.includes(option.id)||undefined} data-guide={mistakes>=2 && (q.kind==='odd'?!answerOf(q).includes(option.id):answerOf(q).includes(option.id))||undefined} style={{'--i':i} as CSSProperties} onClick={()=>act(option.id)}><span className={T+'chip'}>{letters[i]}</span><span className={T+'cardText'}>{option.text.split(' / ').map((line,j)=><span key={j}>{line}<br/></span>)}</span></button>)}</div>}
   </section></div><section className={T+'scene'} data-tour="tz-balance" data-state={won?'ok':undefined}><div dangerouslySetInnerHTML={{__html:scene}} className="tarazoo-local-scene"/>{screen==='play'&&chosen.length>0&&<div className="tarazoo-local-weights" aria-live="polite">{chosen.map(id=>letters[q.options.findIndex(o=>o.id===id)]).join(' · ')}</div>}</section>
  </main>}
 </div>
}
