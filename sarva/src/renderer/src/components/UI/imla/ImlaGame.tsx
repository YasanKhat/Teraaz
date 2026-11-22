import { useEffect, useMemo, useRef, useState } from 'react'
import data from '@/data/seeds/imla/public-bank.json'
import { LESSON_TITLES } from '@/lib/doroos/catalog'
import { GameBackButton } from '@/components/UI/games/GameNav'
import '@/components/UI/games/game-setup.css'
import '@/components/UI/games/lesson-picker.css'
import stage from './stage.html?raw'
import { buildRound, livesFor, type Item, type Word } from './round'
import './imla.css'
import './local.css'

const I = 'imla-module__ZX_77W__', P = 'lesson-picker-module__g8CuTa__', S = 'game-setup-module__3IIroq__'
const fa = (n: number) => n.toLocaleString('fa-IR')
type Grade = 'dahom' | 'yazdahom' | 'davazdahom'
const grades: { key: Grade; name: string; book: string }[] = [{ key:'dahom', name:'دهم', book:'فارسی ۱' }, { key:'yazdahom', name:'یازدهم', book:'فارسی ۲' }, { key:'davazdahom', name:'دوازدهم', book:'فارسی ۳' }]
const bank = data.bank as Word[]
const locked = data.locked as Record<string, number>
function Lever({ correct, onClick }: { correct: boolean; onClick: () => void }) {
  return <button type="button" className={I+'lever'} data-kind={correct?'yes':'no'} data-ready="true" data-held="false" onClick={onClick} aria-keyshortcuts={correct?'1 ArrowRight':'2 ArrowLeft'}>
    <span className={I+'leverLamp'} aria-hidden="true"/><span className={I+'well'} aria-hidden="true"><span className={I+'groove'}/><span className={I+'shaft'}/><span className={I+'hub'}/><span className={I+'knob'} style={{transform:'translateY(-125%)'}}/></span>
    <span className={I+'leverLabel'}><span className={I+'leverIcon'} aria-hidden="true">{correct?'✓':'×'}</span><span className="game-title">{correct?'درست':'نادرست'}</span><kbd className={I+'kbd game-num'}>{correct?'۱':'۲'}</kbd></span>
  </button>
}
export default function ImlaGame() {
  const [grade,setGrade] = useState<Grade>('dahom'), [selected,setSelected] = useState<number[]>([])
  const [screen,setScreen] = useState<'intro'|'play'|'result'>('intro')
  const [round,setRound] = useState<Item[]>([]), [index,setIndex] = useState(0), [lives,setLives] = useState(5)
  const [answers,setAnswers] = useState<boolean[]>([]), [feedback,setFeedback] = useState(false), [lockedNotice,setLockedNotice] = useState(false)
  const lessons = useMemo(() => [...new Set([...bank.filter(w=>w.grade===grade).map(w=>w.lesson), ...Object.keys(locked).filter(k=>k.startsWith(grade+':')).map(k=>Number(k.split(':')[1]))])].sort((a,b)=>a-b), [grade])
  const open = lessons.filter(n=>bank.some(w=>w.grade===grade && w.lesson===n))
  const item = round[index]
  const stageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = stageRef.current
    const word = root?.querySelector<HTMLElement>('.' + I + 'word')
    const serial = root?.querySelector<HTMLElement>('.' + I + 'serial')
    const tile = root?.querySelector<HTMLElement>('.' + I + 'tile')
    const shown = screen === 'play' && item ? item.shown : 'املا'
    if (word) word.textContent = shown
    if (serial) serial.textContent = fa(screen === 'play' ? index + 1 : 0).padStart(2, '۰')
    if (tile) { tile.style.setProperty('--len', String([...shown].length)); tile.setAttribute('aria-label', shown); tile.dataset.demo = String(screen !== 'play') }
  }, [screen, item, index])
  const start = () => { const next=buildRound(bank,grade,selected); if(!next.length)return; setRound(next);setIndex(0);setLives(livesFor(next.length));setAnswers([]);setFeedback(false);setScreen('play');window.scrollTo({top:0,behavior:'smooth'}) }
  const advance = () => { if(lives <= 0) { setIndex(0);setLives(livesFor(round.length));setAnswers([]) } else if(index+1 >= round.length) setScreen('result'); else setIndex(i=>i+1);setFeedback(false) }
  const answer = (correct: boolean) => {
    if(screen !== 'play' || !item) return
    if(feedback) { if(correct === item.isCorrectSpelling) advance(); return }
    const ok=correct===item.isCorrectSpelling
    setAnswers(a=>[...a,ok])
    if(ok) { if(index+1 >= round.length) setScreen('result'); else setIndex(i=>i+1) }
    else { setLives(n=>n-1); setFeedback(true) }
  }
  useEffect(()=>{ const handler=(e:KeyboardEvent)=>{ if(e.repeat || e.ctrlKey || e.altKey || e.metaKey || ['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName))return; if(['1','۱','ArrowRight'].includes(e.key)){e.preventDefault();answer(true)}else if(['2','۲','ArrowLeft'].includes(e.key)){e.preventDefault();answer(false)}else if(e.key==='Enter' && feedback && item && (e.target as HTMLElement)?.tagName !== 'BUTTON')answer(item.isCorrectSpelling) }; window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler) })
  const title = (n:number) => LESSON_TITLES[grade]?.[n] || `درس ${fa(n)}`
  return <div dir="rtl" className={I+'root'} data-screen={screen} data-phase={feedback?'feedback':'awaiting'}>
    <header className={I+'bar'} data-play={screen==='play'}><GameBackButton href="/game"/><div className={I+'barMid'}>{screen==='play' && <><h1 className={I+'name game-title'}>بازرس املا</h1><div className={I+'progress'}><ol className={I+'dots'} data-many={round.length>12} aria-hidden="true">{round.map((_,i)=><li key={i} className={I+'dot'} data-state={i===index?'now':i<index?(answers[i]?'ok':'bad'):'todo'}/>)}</ol><span className="game-num">{fa(index+1)} / {fa(round.length)}</span><span className={I+'lives'} aria-label={`فرصت: ${fa(lives)} از ${fa(livesFor(round.length))}`}>{Array.from({length:livesFor(round.length)},(_,i)=><span key={i} className={I+'life'} data-on={i<lives}/>)}</span></div></>}</div><div className={I+'side'}/></header>
    {screen==='intro' && <div className={I+'introHead'}><h1 className={S+'title game-display'}>بازرس املا</h1><p className={S+'lede'}>املای هر واژه را بررسی کن و یکی از دو اهرم را بکش. جملهٔ کتاب کمکت می‌کند.</p></div>}
    {screen!=='result' && <div className={I+'machine'}><div className={I+'scope'}><div ref={stageRef} dangerouslySetInnerHTML={{__html:stage}}/></div>
      {screen==='play' && item && <div className={I+'deck'}><Lever correct onClick={()=>answer(true)}/><section className={I+'display'} data-view="play" aria-label="برگهٔ بازرسی"><div className={I+'slip'}><div className={I+'slipHead'}><p className={I+'headMain'}>{grades.find(g=>g.key===grade)?.book}، درس {fa(item.word.lesson)} «{title(item.word.lesson)}»</p><div className={I+'headSide'}><span className={I+'serialNo game-num'}>{fa(index+1).padStart(2,'۰')}</span></div></div><div className={I+'feed'}><p className={I+'sentence'} data-kind="prose">{item.word.sentence.split('___').map((part,i)=><span key={i}>{i>0&&<span className={I+'blank'} data-filled={feedback}>{feedback?item.word.word:<span className="sr-only">جای خالی</span>}</span>}{part}</span>)}</p><div className={I+'slipFoot'}><p className={I+'meaning'}>معنی: <b>{item.word.meaning}</b></p>{feedback && <p role="alert">املای درست: <b>{item.word.word}</b> — {item.word.why} {lives===0?'فرصت‌ها تمام شد؛ اهرم درست را بکش تا دوباره شروع شود.':'اهرم درست را بکش.'}</p>}</div></div></div></section><Lever correct={false} onClick={()=>answer(false)}/></div>}
    </div>}
    {screen==='intro' && <div className={S+'panel '+I+'picker'}><div className={P+'root'}><div className={P+'grades'} role="radiogroup" aria-label="پایه">{grades.map(g=><button key={g.key} type="button" role="radio" aria-checked={grade===g.key} data-on={grade===g.key} className={P+'grade'} onClick={()=>{setGrade(g.key);setSelected([]);setLockedNotice(false)}}>{grade===g.key&&<span className={P+'thumb'} aria-hidden="true"/>}<span className={P+'gradeName'}>{g.name}</span><span className={P+'gradeBook'}>{g.book}</span></button>)}</div><div className={P+'head'}><span>درس‌ها</span><button type="button" className={P+'all'} onClick={()=>setSelected(selected.length===open.length?[]:open)}> {selected.length===open.length?'برداشتن همه':'انتخاب همه'}</button></div><div className={P+'lessons'}>{lessons.map((n,i)=>{const count=bank.filter(w=>w.grade===grade&&w.lesson===n).length;const isLocked=!count;return <button key={n} type="button" data-on={selected.includes(n)} data-locked={isLocked || undefined} aria-pressed={isLocked?undefined:selected.includes(n)} className={P+'lesson'} style={{'--i':Math.min(i,12)} as React.CSSProperties} onClick={()=>isLocked?setLockedNotice(true):setSelected(s=>s.includes(n)?s.filter(x=>x!==n):[...s,n])}><span className={P+'num'}>{fa(n)}</span><span className={P+'mark'}>{isLocked?'🔒':selected.includes(n)?'✓':''}</span><span className={P+'title'}>{title(n)}</span><span className={P+'meta'}>{fa(count||locked[`${grade}:${n}`])} واژه</span></button>})}</div></div>{lockedNotice&&<p role="status">این درس مخصوص سروا پلاس است و واژه‌های آن در دادهٔ عمومی موجود نیست.</p>}<div className="imla-local-start"><span>{selected.length?`${fa(selected.length)} درس · ${fa(bank.filter(w=>w.grade===grade&&selected.includes(w.lesson)).length)} واژه`:'یک یا چند درس انتخاب کن.'}</span><button className={S+'start'} disabled={!selected.length} onClick={start}>شروع</button></div></div>}
    {screen==='result' && <section className="imla-local-result"><h1>نتیجهٔ بازرسی</h1><p>{fa(answers.filter(Boolean).length)} پاسخ درست از {fa(answers.length)}</p><button onClick={start}>دوباره</button><button onClick={()=>setScreen('intro')}>انتخاب درس‌ها</button></section>}
  </div>
}
