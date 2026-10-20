import { useMemo, useState } from 'react'
import { ArrowUpLeft, Sparkles } from 'lucide-react'
import { bankItems, kindLabel } from '../data/bank'
import { lessonById } from '../data/lessons'
import { navigate } from '../lib/router'
import { cn, fas, todayKey } from '../lib/utils'
import { useProgress } from '../store/useProgress'

/** پرسش روز: هر روز یک سؤال آزمونی از بانک، با پاسخ و بازخورد */
const pool = bankItems.filter((i) => (i.kind === 'tf' || i.kind === 'mcq') && (i.options?.length ?? 0) >= 2)

function pick(dayKey: string) {
  // درهم‌سازی FNV-1a تا سؤال روزهای پشت‌سرهم کنار هم نیفتد
  let h = 2166136261
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 13
  h = Math.imul(h, 0x5bd1e995)
  h ^= h >>> 15
  return pool[(h >>> 0) % pool.length]
}

export function DailyQuestion() {
  const day = todayKey()
  const item = useMemo(() => pick(day), [day])
  const [choice, setChoice] = useState<number | null>(null)
  const saved = useProgress((s) => s.bank[item.id])
  const answerBank = useProgress((s) => s.answerBank)
  const lesson = lessonById(item.lesson)
  const done = choice !== null
  const right = choice === item.correct

  const choose = (i: number) => {
    if (done) return
    setChoice(i)
    answerBank(item.id, i === item.correct)
  }

  return (
    <div className="panel mt-3 px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="kicker !mb-0">پرسش امروز</span>
        <span className="tag">{kindLabel(item.kind)}</span>
        <span className="tag">درس {fas(item.lesson)}</span>
        {saved !== undefined && <span className="tag !text-turq">قبلاً دیده‌ای</span>}
        <button className="ms-auto flex items-center gap-1 text-[0.6rem] text-faint hover:text-gold" onClick={() => navigate(`bank/${item.lesson}`)}>
          همهٔ سؤال‌های درس <ArrowUpLeft size={11} />
        </button>
      </div>
      <p className="mt-2 text-[0.86rem] font-semibold leading-8">{item.q}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {item.options?.map((opt, i) => {
          const chosen = choice === i
          const isRight = done && i === item.correct
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={done}
              className={cn('bank-opt', isRight && 'bank-opt--right', chosen && !isRight && 'bank-opt--wrong')}
            >
              <span className="bank-opt__n">{fas(i + 1)}</span>
              <span className="flex-1 text-start">{opt}</span>
            </button>
          )
        })}
      </div>
      {done && (
        <div className={cn('bank-note mt-2', right ? 'bank-note--ok' : 'bank-note--bad')}>
          <Sparkles size={11} className="me-1 inline" />
          <b>{right ? 'درست!' : 'پاسخ درست روشن شد.'}</b>{' '}
          {item.note || (lesson ? `${lesson.title} — این نکته را در فیلم همان درس ببین.` : '')}
        </div>
      )}
    </div>
  )
}
