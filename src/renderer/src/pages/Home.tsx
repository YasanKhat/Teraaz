import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpLeft, Check, Clock3, Flame, Play, Sparkles, Target } from 'lucide-react'
import { chapterPlans, planByLesson, planChapterOfLesson } from '../data/plans'
import { lessons } from '../data/lessons'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, daysUntil, fas, greeting, jalali, readingTime, todayKey } from '../lib/utils'
import { useProgress, useStreak } from '../store/useProgress'
import { bankCounts } from '../data/bank'
import { DailyQuestion } from '../components/DailyQuestion'
import { figures } from '../data/figures'
import { timeline as timelineAll } from '../data/timeline'
import { BadgeGlyph } from '../components/BadgeGlyph'
import { badges, dailyQuests } from '../data/exams'

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } })
}

export function Home() {
  const completed = useProgress((s) => s.completed)
  const lastLesson = useProgress((s) => s.lastLesson)
  const settings = useProgress((s) => s.settings)
  const xp = useProgress((s) => s.xp)
  const quests = useProgress((s) => s.quests)
  const streak = useStreak()
  const today = todayKey()
  const doneQuests = quests[today] ?? []

  const current = useMemo(() => {
    const last = lastLesson ? lessons.find((l) => l.id === lastLesson) : undefined
    return last && !completed.includes(last.id) ? last : lessons.find((l) => !completed.includes(l.id)) ?? lessons[0]
  }, [lastLesson, completed])

  const plan = planByLesson(current.id)
  const chapterPlan = planChapterOfLesson(current.id)
  const daysLeft = daysUntil(settings.examDate)
  const progress = Math.round((completed.length / lessons.length) * 100)
  const currentStart = !completed.includes(current.id) && progress > 0

  return (
    <div className="space-y-12">
      {/* ── صفحهٔ عنوان ─────────────────────────────────────────── */}
      <section className="plate">
        <div className="order-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-[0.58rem] tracking-[0.3em] text-gold">تاریخ ۲ · یازدهم انسانی</span>
            <span className="hidden h-px flex-1 bg-gradient-to-l from-gold/35 to-transparent sm:block" />
            <span className="text-[0.58rem] text-faint">{jalali(new Date())}</span>
          </div>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="plate__title">
            تاریخ را <span className="gold-text">زندگی</span> کن
          </motion.h1>
          <div className="plate__line" />
          <p className="max-w-xl text-[0.92rem] leading-9 text-muted">
            {greeting()}، این یک کتاب درسی نیست؛ شانزده فیلم درس است. هر درس قاب‌به‌قاب جلو می‌رود، هر اصطلاح تازه را همان‌جا توضیح
            می‌دهد، با نقشه و خط زمان و سند پیش چشمت می‌آورد و اگر بخواهی با صدای بلند برایت می‌خواند؛ از هر جا رها کردی، از همان قاب
            ادامه می‌دهی.
          </p>

          <button onClick={() => navigate(`lesson/${current.id}`)} className="continue mt-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold/35 bg-gold/12 text-gold">
              <Play size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[0.56rem] tracking-[0.18em] text-gold">
                {currentStart ? 'ادامهٔ سفر' : progress > 0 ? 'درس تازه' : 'شروع از درس یک'}
                <span className="text-faint">·</span>
                <span className="text-faint">فصل {fas(chapterPlan?.chapter ?? 1)}: {chapterPlan?.tagline}</span>
              </span>
              <span className="mt-0.5 block truncate text-[1rem] font-black">{fas(current.id)}. {current.title}</span>
              <span className="mt-0.5 line-clamp-1 block text-[0.72rem] text-muted">{plan?.question}</span>
            </span>
            <span className="hidden shrink-0 items-center gap-3 text-[0.6rem] text-faint sm:flex">
              <span className="flex items-center gap-1"><Clock3 size={11} /> {readingTime(current.minutes)}</span>
              <ArrowLeft size={15} className="text-gold" />
            </span>
          </button>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.66rem]">
            <button className="flex items-center gap-1 text-gold/90 transition hover:text-gold" onClick={() => navigate(`bank/${current.id}`)}>
              <Target size={11} /> سؤال‌های درس {fas(current.id)}
            </button>
            <span className="flex items-center gap-1 text-faint">
              <Sparkles size={11} /> روایت صوتی هر قاب
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.66rem] text-faint">
            <span className="flex items-center gap-1"><Flame size={11} className="text-rose" /> {fas(streak)} روز پیوسته</span>
            <span>{fas(xp)} امتیاز</span>
            <span>{fas(completed.length)} از {fas(lessons.length)} درس</span>
            <button className="text-gold hover:underline" onClick={() => navigate('chapters')}>
              فهرست کامل فصل‌ها <ArrowUpLeft size={11} />
            </button>
          </div>
        </div>

        <div className="order-2">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="relative">
            <div className="arch aspect-[3/4] max-h-[300px] md:max-h-[380px]">
              <img src={art.ch2} alt="کاروانی در بیابان، در مسیر تاریخ" />
              <div className="arch__veil" />
              <div className="arch__frame" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-[0.55rem] tracking-[0.22em] text-gold">فصل دوم</div>
                <div className="display mt-0.5 text-[1.35rem] leading-9">ظهور اسلام</div>
              </div>
            </div>
            <div className="absolute -bottom-3 -start-3 hidden rounded-xl border border-gold/30 bg-bg/90 px-3 py-1.5 text-[0.58rem] text-muted backdrop-blur md:block">
              {fas(progress)}٪ مسیر خوانده‌شده
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── نوار امروز ─────────────────────────────────────────── */}
      <section>
        <div className="mb-2 flex items-end justify-between gap-2">
          <div>
            <div className="kicker">امروز</div>
            <h2 className="text-[1.05rem] font-black">یک قدم کوچک، همین حالا</h2>
          </div>
          <div className="text-[0.6rem] text-faint">
            {fas(doneQuests.length)} از {fas(dailyQuests.length)} انجام شد
          </div>
        </div>
        <div className="todaystrip">
          {dailyQuests.map((q) => {
            const done = doneQuests.includes(q.id)
            return (
              <div key={q.id} className="todaystrip__cell">
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border text-[0.56rem]', done ? 'border-turq/50 bg-turq/15 text-turq' : 'border-line text-faint')}>
                  {done ? <Check size={9} /> : '·'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn('truncate text-[0.74rem] font-medium', done && 'text-faint line-through')}>{q.title}</div>
                  <div className="truncate text-[0.58rem] text-faint">{q.hint}</div>
                </div>
                <span className="shrink-0 text-[0.56rem] text-gold">+{fas(q.xp)}</span>
              </div>
            )
          })}
        </div>
        <DailyQuestion />
      </section>

      {/* ── پردهٔ فصل‌ها ────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="kicker">پرده‌ها</div>
            <h2 className="text-[1.05rem] font-black">چهار فصل، چهار تجربهٔ متفاوت</h2>
          </div>
          <button className="text-[0.68rem] text-gold" onClick={() => navigate('chapters')}>
            فهرست کتاب <ArrowUpLeft size={12} />
          </button>
        </div>
        <div className="reel">
          {chapterPlans.map((ch, i) => {
            const ids = ch.lessons.map((l) => l.lesson)
            const done = ids.filter((id) => completed.includes(id)).length
            const pct = Math.round((done / ids.length) * 100)
            return (
              <motion.button
                key={ch.chapter}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                variants={reveal}
                className="reel__card"
                onClick={() => navigate(`chapter/${ch.chapter}`)}
              >
                <img src={art[ch.art]} alt="" loading="lazy" />
                <div className="reel__body">
                  <div className="flex items-center justify-between text-[0.55rem] text-gold">
                    <span>فصل {fas(ch.chapter)}</span>
                    <span>{fas(pct)}٪</span>
                  </div>
                  <div className="display mt-1 text-[1.1rem] leading-8 text-white">{ch.tagline}</div>
                  <div className="mt-1.5 h-px w-full bg-white/20">
                    <div className="h-px bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 text-[0.56rem] text-white/60">{fas(ids.length)} درس · از درس {fas(ids[0])}</div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </section>

      <div className="ornate-rule"><span /></div>

      {/* ── آزمون و آرشیو: دو ستون نامتقارن، بدون کارت ───────────── */}
      <section className="grid gap-8 md:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="kicker mb-1">شب امتحان</div>
          <div className="flex items-end gap-3">
            <div className="display text-[2.6rem] leading-none text-gold">{daysLeft > 0 ? fas(daysLeft) : '۰'}</div>
            <div className="pb-1.5">
              <div className="text-[0.82rem] font-bold">روز تا {settings.examTitle}</div>
              <div className="text-[0.62rem] text-faint">{jalali(new Date(settings.examDate + 'T00:00:00'))}</div>
            </div>
          </div>
          <p className="mt-2 max-w-md text-[0.74rem] leading-7 text-muted">
            چهار آزمون جامع با زمان‌سنج و پاسخ تشریحی؛ هر آزمون مثل برگهٔ واقعی نمره می‌گیرد.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn btn-gold btn-sm" onClick={() => navigate('exams')}>
              <Target size={13} /> رفتن به آزمون‌ها
            </button>
            <button className="btn btn-sm" onClick={() => navigate(`recap/${chapterPlan?.chapter}`)}>
              بازخوانی فصل {fas(chapterPlan?.chapter ?? 1)}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {badges.slice(0, 8).map((b) => (
              <span key={b.id} className="grid size-7 place-items-center rounded-full border border-line text-faint" title={b.title}>
                <BadgeGlyph icon={b.icon} size={12} />
              </span>
            ))}
            <button className="ms-1 text-[0.6rem] text-faint hover:text-gold" onClick={() => navigate('me')}>کارنامهٔ کامل</button>
          </div>
        </div>

        <div className="md:border-s md:border-line md:ps-8">
          <div className="kicker mb-1">آرشیو</div>
          <h2 className="text-[1rem] font-black">تاریخ را ببین، نه فقط بخوان</h2>
          <div className="mt-3 space-y-0">
            {[
              { t: 'درس‌ها', s: 'شانزده فیلم درس، قاب‌به‌قاب', r: 'chapters', n: '۱۶' },
              { t: 'سؤال‌ها', s: 'همهٔ پرسش‌های کتاب، با پاسخ', r: 'bank', n: fas(bankCounts.total) },
              { t: 'خط زمان', s: 'رویدادها، در یک خط', r: 'archive/timeline', n: fas(timelineAll.length) },
              { t: 'چهره‌ها', s: 'شخصیت‌های پشت رویدادها', r: 'archive/figures', n: fas(figures.length) }
            ].map((x) => (
              <button key={x.r} onClick={() => navigate(x.r)} className="toc-row group">
                <span className="tabular-nums text-[0.58rem] text-gold/80">{x.n}</span>
                <span className="min-w-0">
                  <span className="text-[0.78rem] font-semibold">{x.t}</span>
                  <span className="toc-row__leader mx-2 inline-block w-8 align-bottom" />
                  <span className="text-[0.62rem] text-faint">{x.s}</span>
                </span>
                <ArrowUpLeft size={12} className="text-faint transition group-hover:text-gold" />
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-gold/20 bg-gold/[0.04] px-3 py-2.5">
            <Sparkles size={13} className="mt-0.5 shrink-0 text-gold" />
            <p className="text-[0.68rem] leading-6 text-muted">
              هر درس یک تجربهٔ تعاملی مخصوص خودش دارد: کارگاه سند، حلقهٔ قبایل مکه، پیمان مدینه، نقشهٔ زندهٔ ایران و…
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
