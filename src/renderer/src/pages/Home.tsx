import { ArrowLeft, BookOpen, Flame, Zap, Trophy, Clock3, Target, Layers, Users, Map as MapIcon, Sparkles, CalendarDays, Quote } from 'lucide-react'
import { lessons } from '../data/lessons'
import { chapters } from '../data/chapters'
import { exams, dailyQuests, badges } from '../data/exams'
import { timeline } from '../data/timeline'
import { figures } from '../data/figures'
import { useProgress, useLevel, useStreak } from '../store/useProgress'
import { earnedBadges } from '../lib/badges'
import { navigate } from '../lib/router'
import { cn, daysUntil, fas, greeting, jalali, readingTime, todayKey, timeAgo } from '../lib/utils'
import { Astrolabe, Bar, ChapterMotif, ProgressRing, SectionHead, StarMark, Stat } from '../components/ui'
import { LessonCard } from '../components/LessonCard'

export function Home() {
  const completed = useProgress((s) => s.completed)
  const xp = useProgress((s) => s.xp)
  const days = useProgress((s) => s.days)
  const lastLesson = useProgress((s) => s.lastLesson)
  const quizzes = useProgress((s) => s.quizzes)
  const examsHistory = useProgress((s) => s.exams)
  const cards = useProgress((s) => s.cards)
  const visited = useProgress((s) => s.visited)
  const quests = useProgress((s) => s.quests)
  const settings = useProgress((s) => s.settings)
  const lessonProgress = useProgress((s) => s.lessonProgress)

  const level = useLevel()
  const streak = useStreak()
  const progress = Math.round((completed.length / lessons.length) * 100)
  const today = todayKey()
  const doneQuests = quests[today] ?? []
  const nextLesson = lessons.find((l) => !completed.includes(l.id)) ?? lessons[0]
  const current = lastLesson ? lessons.find((l) => l.id === lastLesson) ?? nextLesson : nextLesson
  const daysLeft = daysUntil(settings.examDate)
  const earned = earnedBadges({ xp, completed, quizzes, exams: examsHistory, cards, days, visited })
  const todayXp = useProgress((s) => s.dailyXp[today] ?? 0)
  const qTotal = lessons.reduce((n, l) => n + l.quiz.length, 0)

  return (
    <div className="space-y-9">
      {/* ─── قهرمان صفحه ─── */}
      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-bl from-surface/80 via-surface/40 to-transparent px-5 py-8 md:px-9 md:py-10">
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="tag">
                <StarMark size={12} /> تاریخ ۲ · یازدهم انسانی
              </span>
              <span className="chip cursor-default">{greeting()} — {jalali(new Date())}</span>
            </div>
            <h1 className="display text-[2.15rem] text-balance md:text-[2.7rem]">
              تاریخ را <span className="gold-text">زندگی</span> کن،
              <br />
              نه حفظ.
            </h1>
            <p className="mt-4 max-w-lg text-[0.92rem] leading-8 text-muted">
              شانزده درس، یک خط زمان زنده، نقشهٔ فتوحات و چهره‌ها، و آزمون‌هایی که تو را برای نمرهٔ بیست آماده می‌کنند — همه در یک سفر.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button className="btn btn-gold" onClick={() => navigate(`lesson/${current.id}`)}>
                {completed.length ? 'ادامهٔ سفر' : 'شروع سفر'} <ArrowLeft size={16} />
              </button>
              <button className="btn" onClick={() => navigate('quiz')}>
                <Target size={15} /> آزمون آزمایشی
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('timeline')}>
                <Clock3 size={15} /> خط زمان
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.7rem] text-faint">
              <span>{fas(lessons.length)} درس‌نامه</span>
              <span>{fas(qTotal)} سؤال</span>
              <span>{fas(timeline.length)} رویداد</span>
              <span>{fas(figures.length)} چهره</span>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[290px] w-full max-w-[330px] sm:block">
            <div className="mihrab absolute inset-0">
              <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-[999px_999px_1.2rem_1.2rem]">
                <Astrolabe size={300} className="absolute spin-slow opacity-60" />
                <Astrolabe size={210} className="absolute spin-rev opacity-40" />
                <div className="relative z-10 text-center">
                  <StarMark size={54} />
                  <div className="display mt-2 text-3xl text-gold">تبار</div>
                  <div className="mt-1 text-[0.62rem] tracking-[0.25em] text-faint">TABAR · ۱۴۰۵</div>
                </div>
              </div>
            </div>
            <div className="floaty absolute -right-2 top-10 rounded-xl border border-gold/30 bg-bg/85 px-2.5 py-1.5 text-[0.62rem] text-gold backdrop-blur">
              ۶۵۶ ق · سقوط بغداد
            </div>
            <div className="floaty absolute -left-1 top-32 rounded-xl border border-line bg-bg/85 px-2.5 py-1.5 text-[0.62rem] text-muted backdrop-blur" style={{ animationDelay: '1.2s' }}>
              نبرد چالدران · ۹۲۰ ق
            </div>
            <div className="floaty absolute bottom-8 right-3 rounded-xl border border-turq/30 bg-bg/85 px-2.5 py-1.5 text-[0.62rem] text-turq backdrop-blur" style={{ animationDelay: '2.1s' }}>
              میدان نقش جهان
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3 border-t border-line pt-4 text-[0.72rem] text-muted">
          <Quote size={14} className="shrink-0 text-gold" />
          <span className="display text-[0.95rem] leading-8">توانا بود هر که دانا بود · ز دانش دل پیر برنا بود</span>
          <span className="hidden text-faint sm:block">— فردوسی</span>
        </div>
      </section>

      {/* ─── آمار اصلی ─── */}
      <section className="grid gap-3 md:grid-cols-[1.25fr_1fr_1fr_1fr]">
        <div className="surface flex items-center gap-4 p-4">
          <ProgressRing value={progress} size={92} stroke={7}>
            <div>
              <div className="text-lg font-black tabular-nums">{fas(progress)}٪</div>
              <div className="text-[0.58rem] text-faint">پیشرفت</div>
            </div>
          </ProgressRing>
          <div className="min-w-0">
            <div className="text-[0.7rem] text-faint">مسیر ۱۶ درس</div>
            <div className="mt-0.5 text-lg font-bold">
              {fas(completed.length)} از {fas(lessons.length)}
            </div>
            <div className="mt-1 text-[0.66rem] leading-5 text-muted">
              {completed.length === 0 ? 'اولین درس را باز کن؛ سفر از آنجا شروع می‌شود.' : completed.length === 16 ? 'همهٔ درس‌ها خوانده شده. حالا مرور و آزمون.' : 'یک قدم تا درس بعدی.'}
            </div>
          </div>
        </div>
        <Stat icon={<Flame size={19} />} label="روزهای پیوسته" value={`${fas(streak)} روز`} hint={streak > 0 ? 'زنجیره‌ات را نشکن' : 'امروز شروع کن'} accent="var(--c-rose)" />
        <Stat icon={<Zap size={19} />} label="امتیاز و سطح" value={`${fas(xp)} · ${level.title}`} hint={`تا سطح بعد: ${fas(Math.max(0, level.next - xp))} امتیاز`} />
        <Stat
          icon={<CalendarDays size={19} />}
          label={settings.examTitle}
          value={daysLeft > 0 ? `${fas(daysLeft)} روز مانده` : 'زمان آزمون رسیده'}
          hint={jalali(new Date(settings.examDate + 'T00:00:00'))}
          accent="var(--c-turq)"
        />
      </section>

      {/* ─── ادامه و برنامه امروز ─── */}
      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="panel relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-gold/10 blur-2xl" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="kicker mb-1">ادامهٔ یادگیری</div>
              <h2 className="text-xl font-bold">درس {fas(current.id)}: {current.title}</h2>
              <p className="mt-1 text-[0.78rem] leading-6 text-muted">{current.tagline}</p>
            </div>
            <span className="tag">{current.era}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.68rem] text-faint">
            <span className="flex items-center gap-1"><Clock3 size={12} /> {readingTime(current.minutes)}</span>
            <span>·</span>
            <span>{fas(current.quiz.length)} سؤال</span>
            <span>·</span>
            <span>{fas(current.terms.length)} کارت</span>
            {current.baram.final && <span className="tag">بارم نهایی {current.baram.final}</span>}
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[0.62rem] text-faint">
              <span>پیشرفت این درس</span>
              <span>{fas(lessonProgress[current.id] ?? 0)}٪</span>
            </div>
            <Bar value={lessonProgress[current.id] ?? 0} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-gold" onClick={() => navigate(`lesson/${current.id}`)}>
              <BookOpen size={15} /> {completed.includes(current.id) ? 'مرور درس' : 'خواندن درس'}
            </button>
            <button className="btn" onClick={() => navigate('cards')}>
              <Layers size={15} /> کارت‌های مرور
            </button>
          </div>
        </div>

        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="kicker mb-1">برنامهٔ امروز</div>
              <h3 className="font-bold">چهار کار کوچک، یک روز خوب</h3>
            </div>
            <span className="text-[0.66rem] text-gold">+{fas(todayXp)} امروز</span>
          </div>
          <div className="space-y-2">
            {dailyQuests.map((q) => {
              const done = doneQuests.includes(q.id)
              return (
                <div key={q.id} className={cn('flex items-center gap-2.5 rounded-xl border px-3 py-2.5', done ? 'border-turq/30 bg-turq/5' : 'border-line')}>
                  <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border text-[0.6rem]', done ? 'border-turq/50 bg-turq/15 text-turq' : 'border-line text-faint')}>
                    {done ? '✓' : '○'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[0.78rem] font-medium', done && 'text-muted line-through')}>{q.title}</div>
                    <div className="truncate text-[0.62rem] text-faint">{q.hint}</div>
                  </div>
                  <span className="text-[0.62rem] text-gold">+{fas(q.xp)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── فصل‌ها ─── */}
      <section>
        <SectionHead
          kicker="نقشهٔ کتاب"
          title="چهار فصل، یک جهان"
          desc="از ابزار مورخ تا رنسانس؛ مسیر را فصل‌به‌فصل برو یا مستقیم سراغ درس‌ها برو."
          action={<button className="btn btn-sm" onClick={() => navigate('lessons')}>همهٔ درس‌ها <ArrowLeft size={14} /></button>}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {chapters.map((ch) => {
            const chLessons = lessons.filter((l) => l.chapter === ch.id)
            const done = chLessons.filter((l) => completed.includes(l.id)).length
            const p = Math.round((done / chLessons.length) * 100)
            return (
              <button
                key={ch.id}
                onClick={() => navigate(`lessons/${ch.id}`)}
                className="card-hover group relative overflow-hidden rounded-2xl border border-line bg-surface/65 p-4 text-right"
              >
                <ChapterMotif motif={ch.motif} className="absolute -left-5 -bottom-6 size-30 opacity-[0.13] transition group-hover:opacity-25" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="kicker">فصل {fas(ch.id)}</span>
                    <span className="text-[0.62rem]" style={{ color: ch.accent }}>{ch.span}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold">{ch.title}</h3>
                  <p className="mt-0.5 text-[0.72rem] text-muted">{ch.subtitle}</p>
                  <p className="mt-2 text-[0.65rem] text-faint">{ch.hint}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${p}%`, background: ch.accent }} />
                    </div>
                    <span className="text-[0.62rem] tabular-nums text-faint">{fas(done)}/{fas(chLessons.length)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ─── درس پیشنهادی + ابزارها ─── */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHead
            kicker="برای امروز"
            title="درس پیشنهادی"
            desc="بر اساس مسیر کتاب، این درس‌ها قدم بعدی‌اند."
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {lessons.filter((l) => !completed.includes(l.id)).slice(0, 2).map((l) => (
              <LessonCard key={l.id} lesson={l} />
            ))}
            {lessons.filter((l) => !completed.includes(l.id)).length === 0 && (
              <div className="surface col-span-2 p-5 text-sm leading-7 text-muted">
                همهٔ درس‌ها را خوانده‌ای. حالا وقت آزمون و مرور است: از «آزمون‌ها» یک شبیه‌سازی نهایی بگیر یا کارت‌های مرور را دوره کن.
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHead kicker="ابزارها" title="ورود از هر دری" />
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Clock3, title: 'خط زمان', desc: `${fas(timeline.length)} رویداد`, route: 'timeline', color: 'var(--c-gold)' },
              { icon: MapIcon, title: 'نقشه', desc: 'فتوحات و مسیرها', route: 'map', color: 'var(--c-turq)' },
              { icon: Users, title: 'چهره‌ها', desc: `${fas(figures.length)} شخصیت`, route: 'figures', color: 'var(--c-lapis)' },
              { icon: Sparkles, title: 'چالش سریع', desc: '۶۰ ثانیه', route: 'game', color: 'var(--c-rose)' }
            ].map((t) => {
              const Icon = t.icon
              return (
                <button key={t.route} onClick={() => navigate(t.route)} className="card-hover rounded-xl border border-line bg-surface/60 p-3.5 text-right">
                  <Icon size={20} style={{ color: t.color }} />
                  <div className="mt-2 text-[0.82rem] font-bold">{t.title}</div>
                  <div className="text-[0.65rem] text-faint">{t.desc}</div>
                </button>
              )
            })}
          </div>
          <div className="surface mt-2.5 flex items-center gap-3 p-3.5">
            <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <Trophy size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[0.78rem] font-semibold">{fas(earned.length)} از {fas(badges.length)} نشان</div>
              <div className="text-[0.62rem] text-faint">با خواندن، آزمون و مرور، نشان بگیر</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('progress')}>
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── آخرین آزمون ─── */}
      {examsHistory.length > 0 && (
        <section>
          <SectionHead kicker="کارنامه" title="آخرین آزمون‌ها" action={<button className="btn btn-sm" onClick={() => navigate('progress')}>کارنامهٔ کامل</button>} />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {examsHistory.slice(0, 3).map((r) => {
              const ex = exams.find((e) => e.id === r.examId)
              const p = Math.round((r.correct / r.total) * 100)
              return (
                <div key={r.at} className="surface flex items-center gap-3 p-3.5">
                  <ProgressRing value={p} size={54} stroke={5} color={p >= 80 ? 'var(--c-turq)' : 'var(--c-gold)'}>
                    <span className="text-[0.68rem] font-bold">{fas(p)}٪</span>
                  </ProgressRing>
                  <div className="min-w-0">
                    <div className="truncate text-[0.8rem] font-semibold">{ex?.title ?? 'آزمون'}</div>
                    <div className="text-[0.62rem] text-faint">
                      {fas(r.correct)} از {fas(r.total)} · {timeAgo(r.at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
