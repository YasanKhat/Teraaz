import { useEffect, useMemo, useState } from 'react'
import { Sprout, Star, Trophy } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Volume2, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'
import type { Lesson } from '../data/types'
import { useProgress } from '../store/useProgress'
import { cn, fas, shuffle } from '../lib/utils'

interface Card {
  id: string
  term: string
  def: string
  lessonId: number
  lessonTitle: string
  accent: string
}

export function buildCards(lessons: Lesson[]): Card[] {
  return lessons.flatMap((l) =>
    l.terms.map((t) => ({
      id: `${l.id}-${t.term}`,
      term: t.term,
      def: t.def,
      lessonId: l.id,
      lessonTitle: l.title,
      accent: l.accent
    }))
  )
}

export function Flashcards({ lessons, title }: { lessons: Lesson[]; title: string }) {
  const all = useMemo(() => buildCards(lessons), [lessons])
  const cardsState = useProgress((s) => s.cards)
  const reviewCard = useProgress((s) => s.reviewCard)
  const markQuest = useProgress((s) => s.markQuest)

  const [queue, setQueue] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const [known, setKnown] = useState(0)
  const [mode, setMode] = useState<'due' | 'all' | 'smart'>('due')

  const dueCards = useMemo(
    () => all.filter((c) => !cardsState[c.id] || cardsState[c.id].due <= Date.now()),
    [all, cardsState]
  )
  const newCards = useMemo(() => all.filter((c) => !cardsState[c.id]), [all, cardsState])

  const begin = (list: Card[]) => {
    setQueue(shuffle(list))
    setIndex(0)
    setFlipped(false)
    setDone(0)
    setKnown(0)
  }

  useEffect(() => {
    const list = mode === 'due' ? dueCards : mode === 'smart' ? newCards : all
    begin(list)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lessons])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const card = queue[index]

  const grade = (g: 0 | 1 | 2 | 3) => {
    if (!card) return
    reviewCard(card.id, g)
    setDone((d) => d + 1)
    if (g >= 2) setKnown((k) => k + 1)
    setFlipped(false)
    if (done + 1 >= 10) markQuest('q-card', 25)
    setTimeout(() => setIndex((i) => i + 1), 160)
  }

  const speak = () => {
    if (!card || typeof window === 'undefined' || !window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(`${card.term}. ${card.def}`)
    u.lang = 'fa-IR'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  if (!queue.length) {
    return (
      <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-turq/30 bg-turq/10 text-turq">
          <Sparkles size={24} />
        </div>
        <h3 className="text-lg font-bold">همهٔ کارت‌ها مرور شده‌اند</h3>
        <p className="max-w-md text-sm leading-7 text-muted">
          کارت‌ها بر پایهٔ تکرار فاصله‌دار زمان‌بندی می‌شوند؛ کارت‌های سخت زودتر برمی‌گردند. می‌توانی همهٔ کارت‌ها را هم یک‌بار مرور کنی.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button className="btn btn-gold" onClick={() => setMode('all')}>
            مرور همهٔ کارت‌ها
          </button>
          <button className="btn" onClick={() => setMode('smart')}>
            کارت‌های تازه
          </button>
        </div>
      </div>
    )
  }

  if (index >= queue.length) {
    const pctKnown = Math.round((known / queue.length) * 100)
    return (
      <div className="surface flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="grid size-14 place-items-center rounded-full border border-gold/35 bg-gold/10 text-gold">
          {pctKnown >= 80 ? <Trophy size={26} /> : pctKnown >= 50 ? <Star size={26} /> : <Sprout size={26} />}
        </div>
        <h3 className="text-xl font-bold">دور مرور تمام شد</h3>
        <p className="text-sm text-muted">
          {fas(known)} از {fas(queue.length)} کارت را بلد بودی ({fas(pctKnown)}٪)
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button className="btn btn-gold" onClick={() => begin(all)}>
            <RotateCcw size={15} /> دور تازه
          </button>
          <button className="btn" onClick={() => begin(dueCards)}>
            مرور کارت‌های سررسید
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button className="chip" data-active={mode === 'due'} onClick={() => setMode('due')}>
            سررسید ({fas(dueCards.length)})
          </button>
          <button className="chip" data-active={mode === 'all'} onClick={() => setMode('all')}>
            همه ({fas(all.length)})
          </button>
          <button className="chip" data-active={mode === 'smart'} onClick={() => setMode('smart')}>
            تازه ({fas(newCards.length)})
          </button>
        </div>
        <span className="text-xs text-faint">
          {fas(index + 1)} / {fas(queue.length)} · {fas(done)} مرور
        </span>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="flip-card h-[330px] sm:h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id + String(index)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <div
                className="flip-inner h-full w-full cursor-pointer"
                data-flipped={flipped}
                onClick={() => setFlipped((f) => !f)}
                role="button"
                aria-label="برگرداندن کارت"
              >
                <div className="flip-face panel relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden p-6 text-center">
                  <div
                    className="pointer-events-none absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
                    style={{ background: card.accent }}
                  />
                  <span className="tag">درس {fas(card.lessonId)} · کارت مرور</span>
                  <h3 className="text-2xl font-extrabold leading-relaxed md:text-3xl">{card.term}</h3>
                  <p className="text-[0.72rem] text-faint">برای دیدن تعریف، کارت را بزن یا Space را فشار بده</p>
                  <div className="absolute inset-x-6 bottom-5 flex items-center justify-between text-[0.65rem] text-faint">
                    <span className="truncate">{title}</span>
                    <span className="flex items-center gap-1">
                      <RotateCcw size={11} /> برگرداندن
                    </span>
                  </div>
                </div>
                <div className="flip-back flip-face panel flex h-full flex-col justify-center gap-3 overflow-hidden p-6">
                  <div className="flex items-center justify-between">
                    <span className="tag">{card.term}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        speak()
                      }}
                      aria-label="خواندن"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                  <p className="max-h-[160px] overflow-y-auto text-[0.92rem] leading-8 text-muted">{card.def}</p>
                  <div className="text-[0.65rem] text-faint">{card.lessonTitle}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { g: 0 as const, label: 'نمی‌دانستم', cls: 'border-rose/40 text-rose hover:bg-rose/10' },
            { g: 1 as const, label: 'سخت بود', cls: 'border-gold/40 text-gold hover:bg-gold/10' },
            { g: 2 as const, label: 'خوب', cls: 'border-turq/40 text-turq hover:bg-turq/10' },
            { g: 3 as const, label: 'آسان', cls: 'border-lapis/40 text-lapis hover:bg-lapis/10' }
          ].map((b) => (
            <button
              key={b.g}
              onClick={() => grade(b.g)}
              disabled={!flipped}
              className={cn('rounded-xl border bg-surface/50 py-2.5 text-xs font-semibold transition disabled:opacity-40', b.cls)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[0.68rem] text-faint">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setIndex((i) => Math.max(0, i - 1))
              setFlipped(false)
            }}
          >
            <ArrowRight size={14} /> قبلی
          </button>
          <span>Space برای برگرداندن کارت</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setIndex((i) => Math.min(queue.length, i + 1))
              setFlipped(false)
            }}
          >
            بعدی <ArrowLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
