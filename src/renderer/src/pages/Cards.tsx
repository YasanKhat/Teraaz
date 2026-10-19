import { useMemo, useState } from 'react'
import { Layers, Sparkles, TrendingUp } from 'lucide-react'
import { lessons } from '../data/lessons'
import { buildCards, Flashcards } from '../components/Flashcards'
import { Bar, SectionHead, Stat } from '../components/ui'
import { useProgress } from '../store/useProgress'
import { cn, fas } from '../lib/utils'

export function Cards() {
  const cardsState = useProgress((s) => s.cards)
  const [scope, setScope] = useState<number | 'all'>('all')

  const allCards = useMemo(() => buildCards(lessons), [])
  const seen = allCards.filter((c) => cardsState[c.id])
  const known = allCards.filter((c) => (cardsState[c.id]?.known ?? 0) > 0)
  const due = allCards.filter((c) => cardsState[c.id] && cardsState[c.id].due <= Date.now())
  const coverage = allCards.length ? Math.round((seen.length / allCards.length) * 100) : 0

  const byLesson = useMemo(
    () =>
      lessons.map((l) => {
        const cards = allCards.filter((c) => c.lessonId === l.id)
        const seenHere = cards.filter((c) => cardsState[c.id]).length
        return { lesson: l, total: cards.length, seen: seenHere }
      }),
    [allCards, cardsState]
  )

  const deck = useMemo(() => (scope === 'all' ? lessons : lessons.filter((l) => l.id === scope)), [scope])

  return (
    <div>
      <SectionHead
        kicker="کارت‌های مرور"
        title={<>مرور فاصله‌دار، <span className="gold-text">حافظهٔ بلندمدت</span></>}
        desc="هر واژه یک کارت است. با سنجش صادقانهٔ خودت، کارت‌ها در فاصله‌های ۱، ۲، ۴ و ۸ روز دوباره پیشت می‌آیند — دقیقاً همان چیزی که پیش از امتحان لازم داری."
      />

      <div className="mb-5 grid gap-2.5 sm:grid-cols-4">
        <Stat icon={<Layers size={16} />} label="کل کارت‌ها" value={fas(allCards.length)} />
        <Stat icon={<TrendingUp size={16} />} label="دیده‌شده" value={fas(seen.length)} accent="var(--c-turq)" hint={`${fas(coverage)}٪ پوشش`} />
        <Stat icon={<Sparkles size={16} />} label="بلد شده" value={fas(known.length)} accent="var(--c-gold2)" />
        <Stat icon={<Layers size={16} />} label="امروز موعد مرور" value={fas(due.length)} accent="var(--c-rose)" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button className="chip" data-active={scope === 'all'} onClick={() => setScope('all')}>
          همهٔ درس‌ها
        </button>
        {byLesson.map(({ lesson, total, seen: s }) => (
          <button
            key={lesson.id}
            className={cn('chip')}
            data-active={scope === lesson.id}
            onClick={() => setScope(lesson.id)}
          >
            درس {fas(lesson.id)}
            <span className="text-[0.58rem] text-faint">{fas(s)}/{fas(total)}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 surface p-4">
        <div className="mb-2 flex items-center justify-between text-[0.7rem] text-faint">
          <span>پوشش کارت‌ها در کل درس‌ها</span>
          <span className="text-gold">{fas(coverage)}٪</span>
        </div>
        <Bar value={coverage} />
        <div className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {byLesson.map(({ lesson, total, seen: s }) => (
            <div key={lesson.id} className="flex items-center gap-2 text-[0.65rem]">
              <span className="w-[52px] shrink-0 text-faint">درس {fas(lesson.id)}</span>
              <div className="flex-1"><Bar value={total ? (s / total) * 100 : 0} height={3} color={lesson.accent} /></div>
              <span className="w-8 text-left text-faint">{fas(s)}/{fas(total)}</span>
            </div>
          ))}
        </div>
      </div>

      <Flashcards lessons={deck} title={scope === 'all' ? 'همهٔ درس‌ها' : `درس ${scope}`} />

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {[
          { t: 'چرا فاصله؟', d: 'اگر یک بار مرور کنی، فراموشی سریع‌تر سراغت می‌آید. تکرار در فاصله‌های رو به افزایش، حافظه را پایدار می‌کند.' },
          { t: 'چرا صادق باش؟', d: 'اگر کارتی را بلد نیستی و «بلد» بزنی، برنامه کارت را دیرتر برمی‌گرداند. صداقت = مرور دقیق‌تر.' },
          { t: 'چرا با صدا؟', d: 'دکمهٔ بلندگو واژه را می‌خواند؛ شنیدن تلفظ درست، یادگیری اصطلاحات عربی و لاتین را آسان می‌کند.' }
        ].map((x) => (
          <div key={x.t} className="surface p-4">
            <div className="mb-1 text-[0.8rem] font-bold text-gold">{x.t}</div>
            <p className="text-[0.72rem] leading-7 text-muted">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
