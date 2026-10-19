import { useMemo } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Flame,
  Layers,
  NotebookPen,
  Target,
  Trophy,
  Zap
} from 'lucide-react'
import { badges, studyPlan, exams } from '../data/exams'
import { chapters } from '../data/chapters'
import { lessons, lessonById, allQuestions } from '../data/lessons'
import { earnedBadges } from '../lib/badges'
import { navigate } from '../lib/router'
import { cn, fas, jalali, pct, todayKey, daysAgoKey, timeAgo } from '../lib/utils'
import { streakLength, useLevel, useProgress } from '../store/useProgress'
import { Bar, ProgressRing, SectionHead, Stat } from '../components/ui'

export function Progress() {
  const s = useProgress()
  const level = useLevel()
  const streak = streakLength(s.days)
  const done = s.completed.length
  const progress = Math.round((done / lessons.length) * 100)
  const earned = useMemo(
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

  const quizCount = Object.keys(s.quizzes).length
  const correct = Object.values(s.quizzes).reduce((a, r) => a + r.correct, 0)
  const total = Object.values(s.quizzes).reduce((a, r) => a + r.total, 0)
  const accuracy = total ? Math.round((correct / total) * 100) : 0
  const last30 = Array.from({ length: 30 }, (_, i) => daysAgoKey(29 - i))
  const maxXp = Math.max(1, ...last30.map((d) => s.dailyXp[d] ?? 0))
  const bookmarkedLessons = s.bookmarks.filter((b) => b.startsWith('lesson-')).map((b) => lessonById(Number(b.split('-')[1])))
  const notes = Object.entries(s.notes).filter(([, v]) => v.trim())

  return (
    <div>
      <SectionHead
        kicker="پیشرفت من"
        title={<>کارنامهٔ <span className="gold-text">تلاش تو</span></>}
        desc="هر عدد اینجا نتیجهٔ یک عادت است. هدف این نیست که همه‌چیز را یک‌شبه بخوانی؛ هدف این است که هر روز یک قدم جلو بروی."
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-[1.7rem] border border-line bg-gradient-to-bl from-surface/85 to-transparent p-5">
          <div className="pointer-events-none absolute -left-14 -top-16 size-52 rounded-full bg-gold/12 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <ProgressRing value={progress} size={124}>
              <div>
                <div className="text-2xl font-black">{fas(progress)}٪</div>
                <div className="text-[0.56rem] text-faint">کل مسیر</div>
              </div>
            </ProgressRing>
            <div className="min-w-0">
              <div className="kicker mb-1">سطح {fas(level.level)}</div>
              <div className="text-xl font-black text-gold">{level.title}</div>
              <div className="mt-1 text-[0.7rem] text-faint">{fas(s.xp)} از {fas(level.next)} امتیاز</div>
              <div className="mt-2 w-48"><Bar value={level.progress} /></div>
              <div className="mt-3 flex gap-2 text-[0.63rem] text-muted">
                <span className="flex items-center gap-1"><Flame size={11} className="text-rose" /> {fas(streak)} روز پیوسته</span>
                <span className="flex items-center gap-1"><BookOpen size={11} className="text-turq" /> {fas(done)} از {fas(lessons.length)} درس</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Stat icon={<Trophy size={15} />} label="آزمون‌ها" value={fas(s.exams.length)} hint={`میانگین ${fas(s.exams.length ? Math.round(s.exams.reduce((a, r) => a + pct(r.correct, r.total), 0) / s.exams.length) : 0)}٪`} />
          <Stat icon={<Target size={15} />} label="دقت آزمونک‌ها" value={`${fas(accuracy)}٪`} accent="var(--c-turq)" hint={`${fas(correct)} از ${fas(total)}`} />
          <Stat icon={<Layers size={15} />} label="کارت‌های دیده‌شده" value={fas(Object.keys(s.cards).length)} accent="var(--c-gold2)" hint={`از ${fas(lessons.reduce((a, l) => a + l.terms.length, 0))} کارت`} />
          <Stat icon={<CheckCircle2 size={15} />} label="نشان‌ها" value={`${fas(earned.length)} از ${fas(badges.length)}`} accent="var(--c-rose)" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="kicker mb-1">۳۰ روز گذشته</div>
              <h3 className="text-base font-bold">نمودار تلاش روزانه</h3>
            </div>
            <span className="flex items-center gap-1 text-[0.68rem] text-gold"><Zap size={13} /> {fas(s.dailyXp[todayKey()] ?? 0)} امروز</span>
          </div>
          <div className="flex h-28 items-end gap-[3px]">
            {last30.map((d) => {
              const xp = s.dailyXp[d] ?? 0
              const h = xp === 0 ? 3 : Math.max(8, (xp / maxXp) * 100)
              return (
                <div key={d} className="group relative flex-1">
                  <div
                    className={cn('w-full rounded-sm transition-colors', xp > 0 ? 'bg-gold/70 group-hover:bg-gold' : 'bg-line/60')}
                    style={{ height: `${(h / 100) * 112}px` }}
                  />
                  <div className="pointer-events-none absolute -top-7 right-1/2 hidden translate-x-1/2 whitespace-nowrap rounded bg-surface2 px-1.5 py-0.5 text-[0.55rem] group-hover:block">
                    {fas(xp)} امتیاز
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-[0.55rem] text-faint">
            <span>{jalali(new Date(Date.now() - 29 * 86400000))}</span>
            <span>امروز</span>
          </div>

          <div className="mt-5 space-y-2">
            {chapters.map((c) => {
              const ls = lessons.filter((l) => l.chapter === c.id)
              const d = ls.filter((l) => s.completed.includes(l.id)).length
              return (
                <div key={c.id} className="flex items-center gap-2.5">
                  <span className="w-24 shrink-0 truncate text-[0.66rem] text-muted">فصل {fas(c.id)}: {c.title}</span>
                  <div className="flex-1"><Bar value={(d / ls.length) * 100} color={c.accent} height={5} /></div>
                  <span className="w-10 text-left text-[0.6rem] text-faint">{fas(d)}/{fas(ls.length)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold">برنامهٔ هفت‌روزه</h3>
            <CalendarDays size={16} className="text-gold" />
          </div>
          <div className="space-y-1.5">
            {studyPlan.map((p, i) => {
              const isDone = s.days.includes(daysAgoKey(6 - i))
              return (
                <div key={p.day} className="flex items-start gap-2.5 rounded-lg border border-line bg-surface2/30 px-3 py-2">
                  <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[0.55rem]', isDone ? 'border-turq/50 bg-turq/15 text-turq' : 'border-line text-faint')}>
                    {isDone ? '✓' : fas(i + 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[0.72rem] font-semibold">{p.day} · {p.focus}</div>
                    <div className="text-[0.64rem] leading-5 text-faint">{p.task}</div>
                  </div>
                  <span className="ms-auto shrink-0 text-[0.58rem] text-faint">{fas(p.minutes)}′</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="kicker mb-1">نشان‌ها</div>
            <h3 className="text-lg font-bold">{fas(earned.length)} از {fas(badges.length)} نشان به دست آمده</h3>
          </div>
          <div className="text-[0.66rem] text-faint">هر نشان، یک عادت</div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {badges.map((b) => {
            const has = earned.includes(b.id)
            return (
              <div
                key={b.id}
                className={cn(
                  'relative overflow-hidden rounded-xl border p-3 text-center transition',
                  has ? 'border-gold/35 bg-gold/8' : 'border-line bg-surface2/20 opacity-55'
                )}
              >
                <div className={cn('mb-1 text-2xl', has ? '' : 'grayscale')}>{b.icon}</div>
                <div className="text-[0.7rem] font-bold">{b.title}</div>
                <div className="mt-0.5 text-[0.58rem] leading-4 text-faint">{b.desc}</div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">کارنامهٔ آزمون‌ها</h3>
            <Trophy size={15} className="text-gold" />
          </div>
          {s.exams.length === 0 ? (
            <p className="py-4 text-[0.72rem] text-faint">هنوز آزمونی نداده‌ای.</p>
          ) : (
            <div className="space-y-2">
              {s.exams.slice(0, 4).map((r, i) => {
                const e = exams.find((x) => x.id === r.examId)
                const p = pct(r.correct, r.total)
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-[0.68rem]">
                      <span className="truncate">{e?.title ?? r.examId}</span>
                      <span className={p >= 80 ? 'text-turq' : p >= 50 ? 'text-gold' : 'text-rose'}>{fas(p)}٪</span>
                    </div>
                    <Bar value={p} height={4} color={p >= 80 ? 'var(--c-turq)' : p >= 50 ? 'var(--c-gold)' : 'var(--c-rose)'} />
                    <div className="mt-0.5 text-[0.55rem] text-faint">{timeAgo(r.at)}</div>
                  </div>
                )
              })}
            </div>
          )}
          <button className="btn btn-sm mt-3 w-full" onClick={() => navigate('quiz')}>رفتن به آزمون‌ها <ArrowLeft size={12} /></button>
        </div>

        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">نشان‌شده‌ها</h3>
            <Bookmark size={15} className="text-gold" />
          </div>
          {bookmarkedLessons.length === 0 ? (
            <p className="py-4 text-[0.72rem] text-faint">چیزی را نشان نکرده‌ای. در هر درس، دکمهٔ نشانک را بزن.</p>
          ) : (
            <div className="space-y-1">
              {bookmarkedLessons.map((l) => l && (
                <button key={l.id} onClick={() => navigate(`lesson/${l.id}`)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-right text-[0.7rem] text-muted hover:bg-ink/5 hover:text-ink">
                  <span className="size-1.5 rounded-full" style={{ background: l.accent }} />
                  درس {fas(l.id)}: {l.title}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-2 flex items-center gap-1.5 text-[0.7rem] text-muted"><NotebookPen size={13} /> {fas(notes.length)} درس یادداشت دارد</div>
            {notes.slice(0, 2).map(([id, text]) => (
              <button key={id} onClick={() => navigate(`lesson/${id}`)} className="mb-1 block w-full truncate rounded-lg bg-surface2/40 px-2 py-1 text-right text-[0.62rem] text-faint">
                درس {fas(Number(id))}: {text.slice(0, 48)}
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="kicker mb-1.5">پرسش‌های بانک</div>
          <div className="text-3xl font-black tabular-nums text-gold">{fas(allQuestions.length)}</div>
          <p className="mt-1 text-[0.7rem] leading-6 text-muted">سؤال با پاسخ تشریحی، در سه سطح دشواری، برگرفته از متن کتاب و امتحان‌های نهایی.</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
            {[1, 2, 3].map((lv) => (
              <div key={lv} className="rounded-lg border border-line bg-bg/30 py-2">
                <div className="text-sm font-bold">{fas(allQuestions.filter((q) => q.level === lv).length)}</div>
                <div className="text-[0.55rem] text-faint">{lv === 1 ? 'آسان' : lv === 2 ? 'متوسط' : 'دشوار'}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-gold mt-3 w-full" onClick={() => navigate('game')}>
            <Zap size={14} /> چالش سریع
          </button>
        </div>
      </div>
    </div>
  )
}
