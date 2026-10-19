import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, Loader2, RotateCcw, Sparkles, X } from 'lucide-react'
import { linesByLesson, loadLines, type BookLine } from '../lib/book'
import { useProgress } from '../store/useProgress'
import { cn, fas } from '../lib/utils'

const verdictLabels = { right: 'درست حدس زدی', wrong: 'اشتباه بود' }

export function BookLines({ lessonId, accent }: { lessonId: number; accent?: string }) {
  const [items, setItems] = useState<BookLine[] | null>(linesByLesson(lessonId) ?? null)
  const [index, setIndex] = useState(0)
  const [guesses, setGuesses] = useState<Record<number, boolean>>({})
  const markQuest = useProgress((s) => s.markQuest)

  useEffect(() => {
    const ready = linesByLesson(lessonId)
    if (ready) {
      setItems(ready)
      return
    }
    let alive = true
    setItems(null)
    loadLines().then(() => alive && setItems(linesByLesson(lessonId) ?? []))
    return () => {
      alive = false
    }
  }, [lessonId])

  useEffect(() => {
    setIndex(0)
    setGuesses({})
  }, [lessonId])

  const answered = useMemo(() => Object.keys(guesses).length, [guesses])

  if (!items) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[0.8rem] text-faint">
        <Loader2 size={15} className="animate-spin" /> در حال آوردن جمله‌های کتاب…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface/40 p-4 text-center text-[0.8rem] text-faint">
        برای این درس جملهٔ خط‌به‌خط ثبت نشده است.
      </p>
    )
  }

  const current = items[Math.min(index, items.length - 1)]
  const guess = guesses[current.n]
  const isAnswered = guess !== undefined
  const right = Object.entries(guesses).filter(([n, g]) => {
    const item = items.find((i) => i.n === Number(n))
    return item ? item.ok === g : false
  }).length
  const finished = answered === items.length

  const pick = (choice: boolean) => {
    if (isAnswered) return
    setGuesses((g) => ({ ...g, [current.n]: choice }))
    if (choice === current.ok) markQuest('q-fact', 6)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface/40 px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-[0.66rem]">
          <Sparkles size={13} style={{ color: accent }} />
          <span className="text-gold">مرور خط‌به‌خط</span>
          <span className="text-faint">· {fas(items.length)} جمله از این درس</span>
        </div>
        <div className="flex items-center gap-2 text-[0.62rem]">
          <span className="text-faint">{fas(answered)} از {fas(items.length)} پاسخ</span>
          <span className="text-turq">{fas(right)} درست</span>
          <button
            className="rounded-md border border-line px-2 py-1 text-faint transition hover:border-gold/40 hover:text-gold"
            onClick={() => {
              setGuesses({})
              setIndex(0)
            }}
          >
            <RotateCcw size={11} className="inline" /> از نو
          </button>
        </div>
      </div>

      <div className="mb-3 h-1 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(answered / items.length) * 100}%`, background: accent ?? 'var(--gold)' }}
        />
      </div>

      <article className="surface relative overflow-hidden p-5 sm:p-7">
        <span className="pointer-events-none absolute -left-2 top-2 select-none font-display text-[5rem] font-black leading-none text-gold/[0.06]">
          {fas(index + 1)}
        </span>
        <div className="kicker mb-3">جملهٔ {fas(index + 1)} از {fas(items.length)}</div>
        <p className="relative text-[0.95rem] font-medium leading-9 text-ink">{current.text}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {[true, false].map((choice) => {
            const picked = guess === choice
            const showState = isAnswered && (picked || choice === current.ok)
            const good = showState && choice === current.ok
            return (
              <button
                key={String(choice)}
                disabled={isAnswered}
                onClick={() => pick(choice)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[0.82rem] font-bold transition',
                  !showState && 'border-line bg-surface2/40 hover:border-gold/40 hover:bg-gold/5',
                  good && 'border-turq/50 bg-turq/10 text-turq',
                  showState && !good && 'border-rose/50 bg-rose/10 text-rose',
                  isAnswered && !showState && 'opacity-40'
                )}
              >
                {choice ? <Check size={15} /> : <X size={15} />}
                {choice ? 'درست' : 'نادرست'}
              </button>
            )
          })}
        </div>

        {isAnswered && (
          <div
            className={cn(
              'mt-4 rounded-xl border p-3.5 text-[0.8rem] leading-7',
              guess === current.ok ? 'border-turq/30 bg-turq/5' : 'border-rose/30 bg-rose/5'
            )}
          >
            <div className={cn('mb-1 flex items-center gap-1.5 text-[0.72rem] font-bold', guess === current.ok ? 'text-turq' : 'text-rose')}>
              {guess === current.ok ? <Check size={13} /> : <X size={13} />}
              {verdictLabels[guess === current.ok ? 'right' : 'wrong']} — پاسخ کتاب: {current.ok ? 'درست' : 'نادرست'}
            </div>
            {current.why ? (
              <p className="text-muted">
                <span className="text-ink/80">تصحیح کتاب: </span>
                {current.why}
              </p>
            ) : (
              <p className="text-muted">این جمله در کتاب همین‌طور آمده است.</p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[0.62rem] text-faint">
            {finished ? 'همهٔ جمله‌های این درس را دیدی.' : `${fas(items.length - answered)} جمله مانده`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="btn btn-ghost btn-sm"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              قبلی
            </button>
            <button
              className="btn btn-sm"
              disabled={index >= items.length - 1}
              onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            >
              جملهٔ بعدی <ChevronLeft size={13} />
            </button>
          </div>
        </div>
      </article>

      {finished && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-[0.74rem]">
          <span>
            نتیجهٔ این دور: <b className="text-gold">{fas(right)} از {fas(items.length)}</b> جملهٔ درست
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setGuesses({})
              setIndex(0)
            }}
          >
            <RotateCcw size={12} /> دور دوباره
          </button>
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[0.6rem] text-faint">
        <ArrowLeft size={11} /> جمله‌ها از بخش «مرور خط‌به‌خط» پایان کتاب آمده‌اند؛ هر جمله را بخوان و درست یا نادرست بودنش را حدس بزن.
      </p>
    </div>
  )
}
