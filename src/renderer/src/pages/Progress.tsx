import { useMemo } from 'react'
import { ArrowLeft, Award, BookOpen, Check, Flame, Layers, ListChecks, NotebookPen, Target, Zap } from 'lucide-react'
import { chapterPlans } from '../data/plans'
import { lessonById, allQuestions } from '../data/lessons'
import { badges, exams } from '../data/exams'
import { earnedBadges } from '../lib/badges'
import { navigate } from '../lib/router'
import { cn, daysAgoKey, fas, jalali, pct, timeAgo, todayKey } from '../lib/utils'
import { streakLength, useLevel, useProgress } from '../store/useProgress'
import { bankCounts } from '../data/bank'

export function Progress() {
  const s = useProgress()
  const bankDone = Object.keys(s.bank).length
  const bankTotal = bankCounts.total
  const level = useLevel()
  const streak = streakLength(s.days)
  const totalLessons = chapterPlans.reduce((n, c) => n + c.lessons.length, 0)
  const done = s.completed.length
  const earns = useMemo(
    () =>
      earnedBadges({
        xp: s.xp,
        completed: s.completed,
        quizzes: s.quizzes,
        exams: s.exams,
        cards: s.cards,
        days: s.days,
        visited: s.visited
      }),
    [s]
  )
  const answered = Object.values(s.quizzes).reduce((a, r) => a + r.total, 0)
  const correct = Object.values(s.quizzes).reduce((a, r) => a + r.correct, 0)
  const days = Array.from({ length: 28 }, (_, i) => daysAgoKey(27 - i))
  const peak = Math.max(1, ...days.map((d) => s.dailyXp[d] ?? 0))
  const bookmarked = s.bookmarks
    .filter((b) => b.startsWith('lesson-'))
    .map((b) => lessonById(Number(b.split('-')[1])))
    .filter(Boolean)
  const notes = Object.entries(s.notes).filter(([, t]) => t.trim())

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 text-center">
        <div className="ornate-rule mb-3"><span /></div>
        <div className="kicker mb-2">کارنامهٔ من</div>
        <h1 className="display text-[1.9rem] leading-[2.2] md:text-[2.4rem]">{level.title}</h1>
        <p className="mx-auto mt-1 max-w-lg text-[0.8rem] leading-8 text-muted">
          سطح {fas(level.level)} · {fas(s.xp)} امتیاز · {fas(streak)} روز پیوسته · {fas(done)} از {fas(totalLessons)} درس کامل‌شده
        </p>
        <div className="mx-auto mt-4 max-w-md">
          <div className="relative h-[3px] bg-line">
            <div className="absolute inset-y-0 start-0 bg-gradient-to-l from-gold2 to-gold" style={{ width: `${level.progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.56rem] text-faint">
            <span>{fas(level.start)}</span>
            <span>{fas(level.next)}</span>
          </div>
        </div>
        <div className="ornate-rule mt-4"><span /></div>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'امتیاز', value: fas(s.xp), icon: <Zap size={13} />, tone: 'text-gold' },
          { label: 'زنجیرهٔ روزانه', value: `${fas(streak)} روز`, icon: <Flame size={13} />, tone: 'text-rose' },
          { label: 'درس کامل‌شده', value: `${fas(done)} از ${fas(totalLessons)}`, icon: <BookOpen size={13} />, tone: 'text-turq' },
          { label: 'نشان', value: `${fas(earns.length)} از ${fas(badges.length)}`, icon: <Award size={13} />, tone: 'text-lapis' }
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border border-line bg-surface/40 px-3 py-2.5">
            <div className={cn('flex items-center gap-1 text-[0.56rem]', tile.tone)}>
              {tile.icon} {tile.label}
            </div>
            <div className="mt-1 text-[1.2rem] font-black tabular-nums leading-6">{tile.value}</div>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <div className="kicker mb-3">مسیر پرده‌ها</div>
        <div className="divide-y divide-line">
          {chapterPlans.map((ch) => {
            const ids = ch.lessons.map((l) => l.lesson)
            const d = ids.filter((id) => s.completed.includes(id)).length
            const p = Math.round((d / ids.length) * 100)
            return (
              <button key={ch.chapter} onClick={() => navigate(`chapter/${ch.chapter}`)} className="group flex w-full items-center gap-3 py-3 text-start">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-gold/35 text-[0.62rem] font-bold tabular-nums text-gold/85 group-hover:border-gold">{fas(ch.chapter)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.86rem] font-bold">{ch.tagline}</span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                      <span className="absolute inset-y-0 start-0 rounded-full bg-gold" style={{ width: `${p}%` }} />
                    </span>
                    <span className="text-[0.56rem] tabular-nums text-faint">{fas(d)} از {fas(ids.length)}</span>
                  </span>
                </span>
                <span className="shrink-0 text-[0.6rem] text-gold">{fas(p)}٪</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mb-10 grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="kicker">چهار هفتهٔ گذشته</div>
              <h2 className="text-[0.95rem] font-black">ردِّ تلاش روزانه</h2>
            </div>
            <span className="flex items-center gap-1 text-[0.62rem] text-gold"><Zap size={11} /> {fas(s.dailyXp[todayKey()] ?? 0)} امروز</span>
          </div>
          <div className="flex h-24 items-end gap-[3px]">
            {days.map((d) => {
              const xp = s.dailyXp[d] ?? 0
              const h = xp === 0 ? 2 : Math.max(7, (xp / peak) * 100)
              return (
                <div key={d} className="group relative flex-1">
                  <div
                    className={cn('w-full rounded-sm', xp ? 'bg-gold/65 group-hover:bg-gold' : 'bg-line/70')}
                    style={{ height: `${(h / 100) * 96}px` }}
                  />
                  <span className="pointer-events-none absolute -top-6 right-1/2 hidden translate-x-1/2 whitespace-nowrap rounded bg-bg2 px-1.5 py-0.5 text-[0.52rem] group-hover:block">{fas(xp)}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-[0.52rem] text-faint">
            <span>{jalali(new Date(Date.now() - 27 * 86400000))}</span>
            <span>امروز</span>
          </div>
        </div>
        <div>
          <div className="kicker mb-3">شمارش‌ها</div>
          <div className="divide-y divide-line text-[0.72rem]">
            {[
              { icon: <Target size={12} />, label: 'پرسش پاسخ‌داده‌شده', value: fas(answered) },
              { icon: <Award size={12} />, label: 'دقت در آزمونک‌ها', value: `${fas(answered ? Math.round((correct / answered) * 100) : 0)}٪` },
              { icon: <Layers size={12} />, label: 'کارت مرورشده', value: fas(Object.keys(s.cards).length) },
              { icon: <BookOpen size={12} />, label: 'نشان‌گذاری‌شده', value: fas(bookmarked.length) },
              { icon: <NotebookPen size={12} />, label: 'درس با یادداشت', value: fas(notes.length) },
              { icon: <ListChecks size={12} />, label: 'از بانک سؤال', value: `${fas(bankDone)} از ${fas(bankTotal)}` },
              { icon: <Flame size={12} />, label: 'زنجیرهٔ فعلی', value: `${fas(streak)} روز` }
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2 py-2">
                <span className="text-gold">{row.icon}</span>
                <span className="flex-1 text-muted">{row.label}</span>
                <span className="font-bold tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <button className="btn btn-gold btn-sm" onClick={() => navigate('exams')}><Target size={12} /> آزمون تازه</button>
            <button className="btn btn-sm" onClick={() => navigate('bank')}><ListChecks size={12} /> بانک سؤال</button>
            <button className="btn btn-sm" onClick={() => navigate('chapters')}>ادامهٔ مطالعه <ArrowLeft size={12} /></button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="kicker">مُهرها</div>
            <h2 className="text-[0.95rem] font-black">{fas(earns.length)} از {fas(badges.length)} نشان</h2>
          </div>
          <span className="text-[0.58rem] text-faint">هر نشان، نشانهٔ یک عادت</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {badges.map((b) => {
            const has = earns.includes(b.id)
            return (
              <div key={b.id} className={cn('flex items-start gap-2.5', !has && 'opacity-35')}>
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-full border text-[0.95rem]', has ? 'border-gold/45 bg-gold/8' : 'border-line')}>
                  {b.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.68rem] font-semibold">{b.title}</span>
                  <span className="block text-[0.55rem] leading-4 text-faint">{b.desc}</span>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-10 grid gap-8 md:grid-cols-2">
        <div>
          <div className="kicker mb-3">کارنامهٔ آزمون‌ها</div>
          {s.exams.length === 0 ? (
            <p className="border-s-2 border-gold/30 ps-3 text-[0.72rem] leading-7 text-faint">هنوز آزمون جامعی نداده‌ای. با یک آزمون پرده شروع کن.</p>
          ) : (
            <div className="divide-y divide-line">
              {s.exams.slice(0, 6).map((r, i) => {
                const ex = exams.find((e) => e.id === r.examId)
                const ch = chapterPlans.find((c) => String(r.examId).startsWith(`chapter-${c.chapter}`))
                const p = pct(r.correct, r.total)
                return (
                  <div key={i} className="py-2.5">
                    <div className="flex items-center justify-between text-[0.7rem]">
                      <span>{ex ? ex.title : ch ? ch.tagline : r.examId}</span>
                      <span className={p >= 80 ? 'text-turq' : p >= 50 ? 'text-gold' : 'text-rose'}>{fas(p)}٪</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="relative h-px flex-1 bg-line">
                        <span className={cn('absolute inset-y-0 start-0', p >= 80 ? 'bg-turq' : p >= 50 ? 'bg-gold' : 'bg-rose')} style={{ width: `${p}%` }} />
                      </span>
                      <span className="text-[0.52rem] text-faint">{fas(r.correct)} از {fas(r.total)} · {timeAgo(r.at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div>
          <div className="kicker mb-3">حاشیه‌ها</div>
          {bookmarked.length === 0 && notes.length === 0 ? (
            <p className="border-s-2 border-gold/30 ps-3 text-[0.72rem] leading-7 text-faint">هنوز چیزی نشان نکرده‌ای. در هر درس، دکمهٔ نشانک یا دفتر یادداشت را بزن.</p>
          ) : (
            <div className="space-y-1.5">
              {bookmarked.map(
                (l) =>
                  l && (
                    <button key={l.id} onClick={() => navigate(`lesson/${l.id}`)} className="flex w-full items-center gap-2 py-1 text-start text-[0.7rem] text-muted hover:text-gold">
                      <Check size={11} className="text-gold" /> درس {fas(l.id)}: {l.title}
                    </button>
                  )
              )}
              {notes.map(([id, text]) => (
                <button key={id} onClick={() => navigate(`lesson/${id}`)} className="block w-full truncate border-s border-line ps-2 text-start text-[0.62rem] leading-6 text-faint hover:text-gold">
                  درس {fas(Number(id))}: {text.slice(0, 60)}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 rounded-lg border border-line/70 p-3 text-[0.62rem] leading-6 text-faint">
            بانک پرسش‌های این نسخه {fas(allQuestions.length)} سؤال دارد: {fas(allQuestions.filter((q) => q.level === 1).length)} پایه، {fas(allQuestions.filter((q) => q.level === 2).length)} متوسط و {fas(allQuestions.filter((q) => q.level === 3).length)} دشوار.
          </div>
        </div>
      </section>

      <div className="ornate-rule mb-6"><span /></div>
      <p className="text-center text-[0.62rem] leading-7 text-faint">کارنامه در همین مرورگر ذخیره می‌شود · برای پشتیبان‌گیری به تنظیمات برو</p>
    </div>
  )
}
