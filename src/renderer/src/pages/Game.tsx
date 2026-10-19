import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Play, RotateCcw, Timer, Trophy, Zap } from 'lucide-react'
import { allQuestions } from '../data/lessons'
import { useProgress } from '../store/useProgress'
import { cn, fas, shuffle } from '../lib/utils'
import { ProgressRing, SectionHead } from '../components/ui'

const LENGTH = 60

export function Game() {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const [time, setTime] = useState(LENGTH)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [deck, setDeck] = useState(() => shuffle(allQuestions))
  const addXp = useProgress((s) => s.addXp)
  const markQuest = useProgress((s) => s.markQuest)
  const timer = useRef<number | null>(null)

  const q = deck[index % deck.length]

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
  }, [])

  useEffect(() => () => stop(), [stop])

  const start = () => {
    setDeck(shuffle(allQuestions))
    setPhase('play')
    setTime(LENGTH)
    setScore(0)
    setStreak(0)
    setIndex(0)
    setPicked(null)
    stop()
    timer.current = window.setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          stop()
          setPhase('over')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (phase === 'over') {
      setBest((b) => Math.max(b, score))
      if (score > 0) addXp(Math.min(score * 2, 120))
      markQuest('q-quiz', 30)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const answer = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const ok = i === q.answer
    if (ok) {
      setScore((s) => s + 10 + Math.min(streak, 5) * 2)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
    window.setTimeout(() => {
      setPicked(null)
      setIndex((n) => n + 1)
    }, 520)
  }

  return (
    <div>
      <SectionHead
        kicker="چالش سریع"
        title={<>۶۰ ثانیه، <span className="gold-text">حداکثر تمرکز</span></>}
        desc="سؤال‌ها تصادفی از تمام ۱۶ درس می‌آیند. هر پاسخ درست ۱۰ امتیاز و با هر پاسخ پیاپی، ۲ امتیاز جایزهٔ بیشتر."
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="relative overflow-hidden rounded-[1.7rem] border border-line bg-surface/55 p-5 md:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-turq/10 blur-3xl" />

          {phase === 'ready' && (
            <div className="relative flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mb-4 grid size-20 place-items-center rounded-3xl border border-gold/30 bg-gold/10">
                <Zap size={34} className="text-gold" />
              </div>
              <h3 className="display text-[1.5rem]">آماده‌ای؟</h3>
              <p className="mt-2 max-w-sm text-[0.82rem] leading-8 text-muted">
                یک دقیقه وقت داری. بی‌مکث پاسخ بده؛ اگر غلط بزنی، رشتهٔ پیاپی‌ات صفر می‌شود. بهترین رکورد تو: {fas(best)}
              </p>
              <button className="btn btn-gold mt-6" onClick={start}>
                <Play size={15} /> شروع چالش
              </button>
            </div>
          )}

          {phase === 'play' && q && (
            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-lg border border-line bg-surface2/60 px-2.5 py-1 text-[0.72rem] font-bold">
                  <Timer size={13} className={time <= 10 ? 'animate-pulse text-rose' : 'text-gold'} />
                  <span className={time <= 10 ? 'text-rose' : ''}>{fas(time)}</span>
                </span>
                <div className="flex-1"><div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gradient-to-l from-gold2 to-gold transition-[width] duration-1000" style={{ width: `${(time / LENGTH) * 100}%` }} /></div></div>
                <span className="flex items-center gap-1 text-[0.72rem] font-bold text-gold"><Trophy size={13} /> {fas(score)}</span>
                {streak > 1 && (
                  <motion.span initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-lg bg-rose/10 px-2 py-1 text-[0.68rem] font-bold text-rose">
                    <Flame size={12} /> {fas(streak)}
                  </motion.span>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>
                  <div className="mb-1 text-[0.62rem] text-faint">سؤال {fas(index + 1)} · درس {q.id.split('-')[0].replace('L', '')}</div>
                  <h3 className="mb-5 text-[1.05rem] font-bold leading-9">{q.prompt}</h3>
                  <div className="grid gap-2">
                    {q.options.map((opt, i) => {
                      const isRight = i === q.answer
                      const state = picked === null ? 'idle' : isRight ? 'right' : picked === i ? 'wrong' : 'dim'
                      return (
                        <button
                          key={i}
                          onClick={() => answer(i)}
                          disabled={picked !== null}
                          className={cn(
                            'rounded-xl border px-4 py-3 text-right text-[0.85rem] transition',
                            state === 'idle' && 'border-line bg-surface2/40 hover:border-gold/40 hover:bg-gold/5',
                            state === 'right' && 'border-turq/60 bg-turq/12 text-turq',
                            state === 'wrong' && 'border-rose/60 bg-rose/12 text-rose',
                            state === 'dim' && 'border-line bg-surface2/20 text-faint'
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {phase === 'over' && (
            <div className="relative flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="text-[0.7rem] text-faint">امتیاز این دور</div>
              <div className="my-1 text-6xl font-black tabular-nums text-gold">{fas(score)}</div>
              <div className="text-[0.78rem] text-muted">بهترین رکورد: {fas(Math.max(best, score))}</div>
              <div className="mt-5 flex gap-2">
                <button className="btn btn-gold" onClick={start}><RotateCcw size={14} /> دوباره</button>
                <button className="btn" onClick={() => setPhase('ready')}>پایان</button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="surface p-5 text-center">
            <ProgressRing value={(time / LENGTH) * 100} size={120} color={time <= 10 ? 'var(--c-rose)' : 'var(--c-gold)'}>
              <div>
                <div className="text-2xl font-black">{fas(time)}</div>
                <div className="text-[0.55rem] text-faint">ثانیه</div>
              </div>
            </ProgressRing>
            <div className="mt-3 text-[0.7rem] text-faint">زمان باقی‌مانده</div>
          </div>
          <div className="surface p-4">
            <div className="kicker mb-2">قواعد</div>
            <ul className="space-y-1.5 text-[0.7rem] leading-6 text-muted">
              <li>• پاسخ درست: ۱۰ امتیاز</li>
              <li>• پاسخ‌های پیاپی درست: +۲ امتیاز بیشتر برای هر کدام</li>
              <li>• پاسخ غلط: رشته صفر می‌شود، زمان ادامه دارد</li>
              <li>• امتیاز به پیشرفت روزانهٔ تو اضافه می‌شود</li>
            </ul>
          </div>
          <div className="note-box">
            <div className="mb-1 text-[0.78rem] font-bold text-gold">دقت کن</div>
            <p className="text-[0.7rem] leading-6 text-muted">در امتحان واقعی، سرعت مهم‌تر از شتاب است. این بازی برای «یادآوری» است، نه جای خواندن.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
