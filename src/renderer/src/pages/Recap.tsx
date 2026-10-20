import { useMemo, useState } from 'react'
import { useState as useReactState } from 'react'
import { ArrowLeft, ArrowUpLeft, BookOpen, Check, ChevronDown, Layers, ListChecks, Moon, Sparkles, Target } from 'lucide-react'
import { chapterPlans } from '../data/plans'
import { lessonById, allQuestions } from '../data/lessons'
import { chapterById, baramTable } from '../data/chapters'
import { bookQuestionsOf } from '../data/book/examQuestions'
import { QuestionCards } from '../components/BookQuestions'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { QuizRunner } from '../components/QuizRunner'
import { Flashcards } from '../components/Flashcards'

type Tab = 'map' | 'quiz' | 'cards'

export function Recap({ id }: { id?: string }) {
  const ch = chapterPlans.find((c) => c.chapter === Number(id)) ?? chapterPlans[0]
  const [tab, setTab] = useState<Tab>('map')
  const [checked, setChecked] = useState<string[]>([])
  const recordQuiz = useProgress((s) => s.recordQuiz)
  const markQuest = useProgress((s) => s.markQuest)
  const record = useProgress((s) => s.quizzes[`chapter-${ch.chapter}`])

  const lessons = useMemo(() => ch.lessons.map((l) => lessonById(l.lesson)).filter((l): l is NonNullable<typeof l> => !!l), [ch])
  const questions = useMemo(() => lessons.flatMap((l) => l.quiz), [lessons])
  const official = useMemo(
    () => lessons.flatMap((l) => bookQuestionsOf(l.id)).slice(0, 18),
    [lessons]
  )
  const idx = chapterPlans.findIndex((c) => c.chapter === ch.chapter)
  const next = chapterPlans[idx + 1]

  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <button className="text-[0.62rem] text-faint hover:text-gold" onClick={() => navigate('chapters')}>← فهرست کتاب</button>

      <header>
        <div className="flex flex-wrap items-center gap-2 text-[0.56rem]">
          <span className="text-gold">بازخوانی پردهٔ {fas(ch.chapter)}</span>
          <span className="text-faint">· {fas(lessons.length)} درس</span>
          <span className="text-faint">· {fas(questions.length)} پرسش</span>
        </div>
        <h1 className="mt-1 text-[1.7rem] font-black leading-[1.8] md:text-[2.05rem]">{ch.tagline}</h1>
        <p className="mt-2 max-w-2xl border-s-2 border-gold/40 ps-3 text-[0.86rem] leading-8 text-muted">{ch.summary.verdict}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(['map', 'quiz', 'cards'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-[0.72rem] transition',
                tab === t ? 'border-gold/60 bg-gold/12 text-gold' : 'border-line text-muted hover:text-ink'
              )}
            >
              {t === 'map' ? 'زنجیره و شب امتحان' : t === 'quiz' ? `آزمون پرده (${fas(questions.length)})` : 'کارت‌های پرده'}
            </button>
          ))}
          <button
            className="flex items-center gap-1.5 rounded-lg border border-gold/35 bg-gold/[0.06] px-3 py-1.5 text-[0.72rem] text-gold transition hover:bg-gold/12"
            onClick={() => navigate(`bank/ch${ch.chapter}`)}
          >
            <ListChecks size={13} /> همهٔ سؤال‌های این پرده
          </button>
        </div>
      </header>

      {tab === 'map' && (
        <div className="space-y-9">
          {/* سه ایدهٔ بزرگ: سه ستون موازی */}
          <section>
            <div className="mb-2 flex items-end justify-between">
              <div className="kicker">سه ایدهٔ بزرگ</div>
              <span className="text-[0.58rem] text-faint">اگر فقط همین سه را بفهمی، پرده را گرفته‌ای</span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {ch.summary.bigIdeas.map((b, i) => (
                <div key={b.title} className="relative rounded-xl border border-line bg-surface/25 p-3.5">
                  <span className="absolute end-3 top-2.5 text-[0.8rem] font-black tabular-nums text-gold/45">۰{fas(i + 1)}</span>
                  <div className="pe-6 text-[0.86rem] font-bold leading-7">{b.title}</div>
                  <p className="mt-1 text-[0.72rem] leading-6 text-muted">{b.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* زنجیرهٔ رویدادها: خط زمان دو ستونه */}
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="kicker">زنجیره</div>
                <h2 className="text-[1.02rem] font-black">رویدادها، به ترتیب پیوند</h2>
              </div>
              <span className="text-[0.6rem] text-faint">{fas(ch.summary.chain.length)} گره</span>
            </div>
            <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
              {ch.summary.chain.map((c, i) => (
                <div key={c.label} className="relative border-s border-line pb-3.5 ps-5 last:pb-0">
                  <span className="absolute -start-[9px] top-2 grid size-[17px] place-items-center rounded-full border border-gold/50 bg-bg text-[0.44rem] text-gold">
                    {fas(i + 1)}
                  </span>
                  <div className="text-[0.84rem] font-bold leading-6">{c.label}</div>
                  <div className="text-[0.7rem] leading-6 text-muted">{c.note}</div>
                </div>
              ))}
            </div>
          </section>

          {/* درس به درس: اصلِ کاری که باید در هر درس بدانی */}
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="kicker">درس به درس</div>
                <h2 className="text-[1.02rem] font-black">از هر درس، دقیقاً چه می‌خواهند؟</h2>
              </div>
              <span className="text-[0.6rem] text-faint">باز کن و ببین</span>
            </div>
            <div className="space-y-2">
              {lessons.map((l) => (
                <LessonDrill key={l.id} lessonId={l.id} />
              ))}
            </div>
          </section>

          {/* پرسش‌های کتاب همان پرده */}
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="kicker">پرسش‌های کتاب</div>
                <h2 className="text-[1.02rem] font-black">سؤال‌هایی که از خودِ کتاب می‌آید</h2>
              </div>
              <button className="text-[0.6rem] text-gold" onClick={() => navigate(`bank/ch${ch.chapter}`)}>
                همه در بانک سؤال <ArrowUpLeft size={10} />
              </button>
            </div>
            <QuestionCards items={official} />
          </section>

          {/* بارم‌بندی */}
          <section>
            <div className="mb-2 flex items-end justify-between">
              <div className="kicker">بارم‌بندی</div>
              <span className="text-[0.58rem] text-faint">از جدول بارم‌بندی امتحان</span>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {lessons.map((l) => {
                const row = baramTable.find((b) => b.lesson === l.id)
                return (
                  <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface/35 px-3 py-2">
                    <span className="min-w-0 truncate text-[0.72rem]">درس {fas(l.id)}: {l.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[0.6rem]">
                      {row?.mid && <span className="text-turq">نوبت اول {row.mid}</span>}
                      {row?.final && <span className="text-gold">نهایی {row.final}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* شب امتحان */}
          <section className="rounded-2xl border border-gold/25 bg-gold/[0.035] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Moon size={15} className="text-gold" />
              <h2 className="text-[0.95rem] font-bold">شب امتحان — این چهار مورد را بتوانی بگویی، کافی است</h2>
            </div>
            <div className="space-y-1.5">
              {ch.summary.lastNight.map((l, i) => {
                const on = checked.includes(l)
                return (
                  <button
                    key={l}
                    onClick={() => setChecked((c) => (c.includes(l) ? c.filter((x) => x !== l) : [...c, l]))}
                    className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-start transition hover:bg-bg/40"
                  >
                    <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[0.5rem]', on ? 'border-turq/50 bg-turq/15 text-turq' : 'border-line text-faint')}>
                      {on ? <Check size={11} /> : fas(i + 1)}
                    </span>
                    <span className={cn('text-[0.78rem] leading-7', on ? 'text-faint line-through' : 'text-ink/85')}>{l}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.6rem] text-faint">
              <span>{fas(checked.length)} از {fas(ch.summary.lastNight.length)} بررسی شد</span>
              <button className="text-gold" onClick={() => setChecked([])}>پاک‌کردن</button>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <button className="continue" onClick={() => setTab('quiz')}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold"><Target size={15} /></span>
              <span className="min-w-0">
                <span className="block text-[0.82rem] font-bold">آزمون پرده</span>
                <span className="block text-[0.66rem] text-muted">{fas(questions.length)} پرسش از همهٔ درس‌ها، با پاسخ تشریحی</span>
              </span>
            </button>
            <button className="continue" onClick={() => setTab('cards')}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-turq/30 bg-turq/10 text-turq"><Layers size={15} /></span>
              <span className="min-w-0">
                <span className="block text-[0.82rem] font-bold">کارت‌های پرده</span>
                <span className="block text-[0.66rem] text-muted">همهٔ نکته‌های کلیدی، در یک دست</span>
              </span>
            </button>
          </section>

          <div className="relative overflow-hidden rounded-xl border border-line">
            <img src={art[ch.art]} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,9,19,0.9),rgba(5,9,19,0.55))]" />
            <div className="relative flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-[0.76rem] text-white/85">
                <Sparkles size={13} className="mb-1 inline text-gold" /> پرده را بستی؟ برو سراغ درس‌ها یا پردهٔ بعد.
              </div>
              <div className="flex gap-2">
                <button className="btn btn-sm border-white/20 bg-white/10 text-white" onClick={() => navigate(`chapter/${ch.chapter}`)}>
                  صفحهٔ پرده
                </button>
                {next ? (
                  <button className="btn btn-gold btn-sm" onClick={() => navigate(`chapter/${next.chapter}`)}>
                    پردهٔ {fas(next.chapter)}: {next.tagline} <ArrowLeft size={12} />
                  </button>
                ) : (
                  <button className="btn btn-gold btn-sm" onClick={() => navigate('exams')}>
                    آزمون جامع <ArrowUpLeft size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'quiz' && (
        <div>
          {record && <div className="mb-3 text-[0.72rem] text-faint">بهترین نتیجهٔ قبلی: {fas(record.correct)} از {fas(record.total)}</div>}
          <QuizRunner
            questions={questions}
            title={`آزمون پردهٔ ${fas(ch.chapter)}: ${ch.tagline}`}
            subtitle="ترکیبی از پرسش‌های همهٔ درس‌های این پرده، با پاسخ تشریحی."
            mode="practice"
            minutes={Math.ceil(questions.length * 1.2)}
            onFinish={(c, t) => {
              recordQuiz(`chapter-${ch.chapter}`, c, t)
              markQuest('q-quiz', 30)
            }}
            onExit={() => setTab('map')}
          />
        </div>
      )}

      {tab === 'cards' && <Flashcards lessons={lessons} title={`پردهٔ ${ch.chapter}`} />}
    </div>
  )
}


/* ── بازشوی هر درس: نکته‌های حفظی، اصطلاحات، و پرسش کتاب ─────────────── */

function LessonDrill({ lessonId }: { lessonId: number }) {
  const l = lessonById(lessonId)
  const [open, setOpen] = useReactState(false)
  if (!l) return null
  const chips = l.keyPoints.slice(0, 3)
  const more = l.keyPoints.slice(3)
  const qs = bookQuestionsOf(lessonId)

  return (
    <div className={cn('overflow-hidden rounded-xl border transition', open ? 'border-gold/40 bg-gold/[0.03]' : 'border-line bg-surface/30')}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start">
        <span className="grid size-6 shrink-0 place-items-center rounded-md border border-gold/35 text-[0.58rem] font-bold text-gold">
          {fas(l.id)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.82rem] font-bold">{l.title}</span>
        <span className="shrink-0 text-[0.58rem] text-faint">{fas(l.keyPoints.length)} نکته · {fas(qs.length)} پرسش</span>
        <ChevronDown size={14} className={cn('shrink-0 text-faint transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-line/70 px-3.5 py-3">
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-[0.58rem] tracking-widest text-gold">
              <Sparkles size={10} /> باید بتوانی بگویی
            </div>
            <ul className="space-y-1">
              {[...chips, ...more].map((k, i) => (
                <li key={i} className="flex gap-1.5 text-[0.74rem] leading-7 text-ink/85">
                  <span className="mt-2.5 size-1 shrink-0 rounded-full bg-gold/70" />
                  {k}
                </li>
              ))}
            </ul>
          </div>

          {l.terms.length > 0 && (
            <div>
              <div className="mb-1.5 text-[0.58rem] tracking-widest text-turq">اصطلاح‌ها</div>
              <div className="space-y-1">
                {l.terms.slice(0, 4).map((t) => (
                  <div key={t.term} className="text-[0.72rem] leading-7">
                    <b className="text-ink">{t.term}:</b> <span className="text-muted">{t.def}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <button className="chip" onClick={() => navigate(`lesson/${l.id}`)}>
              <BookOpen size={11} /> خواندن درس
            </button>
            <button className="chip" onClick={() => navigate(`bank/${l.id}`)}>
              <ListChecks size={11} /> {fas(l.quiz.length + qs.length)} سؤال
            </button>
            <span className="ms-auto text-[0.56rem] text-faint">
              {l.chapter ? chapterById(l.chapter).title : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
