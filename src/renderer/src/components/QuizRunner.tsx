import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Rocket, Check, X, ArrowLeft, RotateCcw, Trophy, ChevronLeft, ChevronRight, Clock, Sparkles, Target } from 'lucide-react'
import type { QuizQ } from '../data/types'
import { cn, faDigits, fas, pct, shuffle } from '../lib/utils'
import { Bar, ProgressRing } from './ui'

type Phase = 'intro' | 'run' | 'result'

interface Props {
  questions: QuizQ[]
  title: string
  subtitle?: string
  mode: 'practice' | 'exam'
  minutes?: number
  onFinish?: (correct: number, total: number, seconds: number) => void
  onExit?: () => void
}

const LETTERS = ['۱', '۲', '۳', '۴']

function formatClock(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${faDigits(String(m).padStart(2, '0'))}:${faDigits(String(sec).padStart(2, '0'))}`
}

export function QuizRunner({ questions, title, subtitle, mode, minutes = 20, onFinish, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [order, setOrder] = useState<number[]>(() => questions.map((_, i) => i))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [seconds, setSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(minutes * 60)
  const finishedRef = useRef(false)

  const list = useMemo(() => order.map((i) => questions[i]), [order, questions])
  const q = list[index]
  const answered = Object.keys(answers).length
  const correctCount = list.reduce((sum, item, i) => (answers[i] === item.answer ? sum + 1 : sum), 0)

  useEffect(() => {
    if (phase !== 'run') return
    const t = setInterval(() => {
      setSeconds((s) => s + 1)
      if (mode === 'exam') setTimeLeft((v) => v - 1)
    }, 1000)
    return () => clearInterval(t)
  }, [phase, mode])

  useEffect(() => {
    if (mode === 'exam' && timeLeft <= 0 && phase === 'run' && !finishedRef.current) {
      finish()
    }
  }, [timeLeft, phase, mode])


  useEffect(() => {
    if (phase !== 'run') return
    const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '۱': 0, '۲': 1, '۳': 2, '۴': 3 }
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key in map) {
        const i = map[e.key]
        if (i < q.options.length) select(i)
      } else if (e.key === 'Enter') {
        if (index < questions.length - 1) {
          if (!(mode === 'practice' && chosen === undefined)) setIndex((i) => i + 1)
        } else if (mode === 'exam' || chosen !== undefined) {
          finish()
        }
      } else if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.min(questions.length - 1, i + 1))
      } else if (e.key === 'ArrowRight') {
        setIndex((i) => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, answers, mode, questions.length, q])

  const start = (shuffled = false) => {
    setOrder(shuffled ? shuffle(questions.map((_, i) => i)) : questions.map((_, i) => i))
    setAnswers({})
    setRevealed({})
    setIndex(0)
    setSeconds(0)
    setTimeLeft(minutes * 60)
    finishedRef.current = false
    setPhase('run')
  }

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setPhase('result')
    const total = questions.length
    const correct = list.reduce((sum, item, i) => (answers[i] === item.answer ? sum + 1 : sum), 0)
    onFinish?.(correct, total, seconds)
  }

  const select = (option: number) => {
    if (mode === 'practice' && answers[index] !== undefined) return
    setAnswers((a) => ({ ...a, [index]: option }))
    if (mode === 'practice') setRevealed((r) => ({ ...r, [index]: true }))
  }

  const score = pct(correctCount, questions.length)

  if (phase === 'intro') {
    return (
      <div className="surface anim-up overflow-hidden">
        <div className="relative px-6 py-8 md:px-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold/60 to-transparent" />
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
            {mode === 'exam' ? <Target size={26} /> : <Sparkles size={26} />}
          </div>
          <div className="kicker mb-2">{mode === 'exam' ? 'شبیه‌سازی امتحان' : 'تمرین درس'}</div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-2 max-w-xl text-sm leading-7 text-muted">{subtitle}</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface2/60 p-3.5">
              <div className="text-[0.68rem] text-faint">تعداد سؤال</div>
              <div className="mt-1 text-lg font-bold">{fas(questions.length)}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface2/60 p-3.5">
              <div className="text-[0.68rem] text-faint">زمان پیشنهادی</div>
              <div className="mt-1 text-lg font-bold">{fas(minutes)} دقیقه</div>
            </div>
            <div className="rounded-xl border border-line bg-surface2/60 p-3.5">
              <div className="text-[0.68rem] text-faint">حالت</div>
              <div className="mt-1 text-lg font-bold">{mode === 'exam' ? 'بدون بازخورد فوری' : 'با پاسخ تشریحی'}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn btn-gold" onClick={() => start(false)}>
              شروع آزمون <ArrowLeft size={16} />
            </button>
            <button className="btn" onClick={() => start(true)}>
              ترتیب تصادفی
            </button>
          </div>
          <p className="mt-3 text-[0.68rem] text-faint">
            با کلیدهای ۱ تا ۴ پاسخ بده، با Enter جلو برو و با کلیدهای جهت‌دار جابه‌جا شو.
          </p>
          {mode === 'exam' && (
            <p className="mt-2 text-xs leading-6 text-faint">
              در این حالت بازخورد هر سؤال را تا پایان نمی‌بینی؛ مثل جلسهٔ امتحان. در پایان، پاسخنامهٔ کامل را مرور می‌کنیم.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const wrong = list
      .map((item, i) => ({ item, chosen: answers[i] }))
      .filter((x) => x.chosen !== x.item.answer)
    return (
      <div className="space-y-4">
        <div className="surface anim-up overflow-hidden">
          <div className="relative flex flex-col items-center gap-5 px-6 py-8 text-center md:flex-row md:text-right">
            <ProgressRing value={score} size={140} color={score >= 80 ? 'var(--c-turq)' : score >= 50 ? 'var(--c-gold)' : 'var(--c-rose)'}>
              <div>
                <div className="text-2xl font-black tabular-nums">{fas(score)}٪</div>
                <div className="text-[0.65rem] text-faint">درصد</div>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <div className="kicker mb-1">نتیجهٔ آزمون</div>
              <h2 className="text-2xl font-bold">
                {score >= 90 ? 'بی‌نقص! آمادهٔ بیستی.' : score >= 70 ? 'خوب بود؛ نزدیک به هدف.' : score >= 50 ? 'پایه خوب است، تمرین بیشتر لازم است.' : 'از اینجا شروع می‌کنیم؛ مرور درس لازم است.'}
              </h2>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-muted md:justify-start">
                <span>
                  پاسخ درست: <b className="text-ink">{fas(correctCount)}</b> از {fas(questions.length)}
                </span>
                <span>
                  زمان: <b className="text-ink">{formatClock(seconds)}</b>
                </span>
                <span>
                  امتیاز: <b className="text-gold">+{fas(correctCount * 5)}</b>
                </span>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                <button className="btn btn-gold" onClick={() => start(false)}>
                  <RotateCcw size={15} /> تلاش دوباره
                </button>
                <button className="btn" onClick={() => start(true)}>
                  سؤال‌های تصادفی
                </button>
                {onExit && (
                  <button className="btn btn-ghost" onClick={onExit}>
                    بازگشت
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">پاسخنامهٔ تشریحی</h3>
            <span className="chip cursor-default">
              {wrong.length === 0 ? 'همه درست' : `${fas(wrong.length)} اشتباه`}
            </span>
          </div>
          <div className="space-y-3">
            {list.map((item, i) => {
              const chosen = answers[i]
              const ok = chosen === item.answer
              return (
                <details key={item.id} className="group rounded-xl border border-line bg-surface2/40 p-3.5" open={!ok}>
                  <summary className="flex cursor-pointer list-none items-start gap-2.5">
                    <span
                      className={cn(
                        'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-[0.68rem]',
                        ok ? 'bg-turq/15 text-turq' : 'bg-rose/15 text-rose'
                      )}
                    >
                      {ok ? <Check size={13} /> : <X size={13} />}
                    </span>
                    <span className="flex-1 text-sm font-medium leading-7">{item.prompt}</span>
                    <ChevronLeft size={15} className="mt-1 shrink-0 text-faint transition group-open:rotate-90" />
                  </summary>
                  <div className="mt-3 space-y-2 pr-8 text-[0.8rem] leading-7">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn('rounded-lg px-2 py-1', ok ? 'bg-turq/10 text-turq' : 'bg-rose/10 text-rose')}>
                        پاسخ تو: {chosen === undefined ? 'بی‌پاسخ' : `${LETTERS[chosen]}) ${item.options[chosen]}`}
                      </span>
                      {!ok && <span className="rounded-lg bg-turq/10 px-2 py-1 text-turq">درست: {LETTERS[item.answer]}) {item.options[item.answer]}</span>}
                    </div>
                    <p className="text-muted">{item.explain}</p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[0.65rem]">
                      <span className="tag">{item.source}</span>
                      {item.rocket && (
              <span className="tag flex items-center gap-1">
                <Rocket size={11} /> سؤال دشوار
              </span>
            )}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const chosen = answers[index]
  const showFeedback = mode === 'practice' && chosen !== undefined

  return (
    <div className="space-y-4">
      <div className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[0.68rem] text-faint">
              <span>
                سؤال {fas(index + 1)} از {fas(questions.length)}
              </span>
              {mode === 'exam' ? (
                <span className={cn('flex items-center gap-1 tabular-nums', timeLeft < 60 && 'text-rose')}>
                  <Clock size={12} /> {formatClock(Math.max(0, timeLeft))}
                </span>
              ) : (
                <span>{fas(answered)} پاسخ داده‌شده</span>
              )}
            </div>
            <div className="mt-2">
              <Bar value={((index + 1) / questions.length) * 100} height={4} />
            </div>
          </div>
        </div>

        <div className="px-5 py-6 md:px-7">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="tag">{q.source}</span>
            <span className="tag">{q.level === 1 ? 'پایه' : q.level === 2 ? 'متوسط' : 'دشوار'}</span>
            {q.rocket && (
              <span className="tag" title="سؤال دشوار">
                <Rocket size={11} />
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold leading-9 md:text-xl">{q.prompt}</h2>

          <div className="mt-5 space-y-2.5">
            {q.options.map((opt, i) => {
              const isChosen = chosen === i
              const isCorrect = q.answer === i
              const state = showFeedback ? (isCorrect ? 'correct' : isChosen ? 'wrong' : 'idle') : isChosen ? 'chosen' : 'idle'
              return (
                <button
                  key={i}
                  disabled={mode === 'practice' && chosen !== undefined}
                  onClick={() => select(i)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-right text-sm leading-7 transition',
                    state === 'idle' && 'border-line bg-surface2/40 hover:border-gold/40 hover:bg-gold/5',
                    state === 'chosen' && 'border-gold/60 bg-gold/10',
                    state === 'correct' && 'border-turq/60 bg-turq/10',
                    state === 'wrong' && 'border-rose/60 bg-rose/10'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border text-[0.68rem] font-bold',
                      state === 'correct'
                        ? 'border-turq/50 bg-turq/20 text-turq'
                        : state === 'wrong'
                          ? 'border-rose/50 bg-rose/20 text-rose'
                          : state === 'chosen'
                            ? 'border-gold/50 bg-gold/20 text-gold'
                            : 'border-line text-faint'
                    )}
                  >
                    {state === 'correct' ? <Check size={13} /> : state === 'wrong' ? <X size={13} /> : LETTERS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence initial={false}>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={cn('note-box mt-4 text-[0.84rem] leading-7', chosen === q.answer ? 'border-turq/30' : '')}>
                  <div className="mb-1 flex items-center gap-1.5 font-bold">
                    {chosen === q.answer ? (
                      <>
                        <Check size={15} className="text-turq" /> درست!
                      </>
                    ) : (
                      <>
                        <X size={15} className="text-rose" /> پاسخ درست: {LETTERS[q.answer]}) {q.options[q.answer]}
                      </>
                    )}
                  </div>
                  <p className="text-muted">{q.explain}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between gap-2">
            <button
              className="btn btn-ghost"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronRight size={16} /> قبلی
            </button>
            <div className="hidden items-center gap-1.5 sm:flex">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`سؤال ${i + 1}`}
                  className={cn(
                    'size-2 rounded-full transition',
                    i === index ? 'w-5 bg-gold' : answers[i] !== undefined ? 'bg-turq/60' : 'bg-line'
                  )}
                />
              ))}
            </div>
            {index < questions.length - 1 ? (
              <button
                className="btn btn-gold"
                disabled={mode === 'practice' && chosen === undefined}
                onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                بعدی <ChevronLeft size={16} />
              </button>
            ) : (
              <button className="btn btn-gold" onClick={finish}>
                <Trophy size={15} /> پایان و نتیجه
              </button>
            )}
          </div>
        </div>
      </div>

      {mode === 'exam' && (
        <div className="surface flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  'size-7 rounded-md border text-[0.62rem]',
                  i === index
                    ? 'border-gold bg-gold/15 text-gold'
                    : answers[i] !== undefined
                      ? 'border-turq/40 bg-turq/10 text-turq'
                      : 'border-line text-faint'
                )}
              >
                {faDigits(i + 1)}
              </button>
            ))}
          </div>
          <button className="btn btn-gold btn-sm" onClick={finish}>
            پایان آزمون
          </button>
        </div>
      )}
    </div>
  )
}
