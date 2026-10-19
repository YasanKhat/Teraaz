import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Clock3, Layers, Sparkles, Target, Trophy } from 'lucide-react'
import { exams } from '../data/exams'
import { allQuestions, lessons } from '../data/lessons'
import { questionById } from '../data/lessons'
import { navigate } from '../lib/router'
import { cn, fas, pct, shuffle } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { Bar, ProgressRing, SectionHead, Stat } from '../components/ui'
import { QuizRunner } from '../components/QuizRunner'

export function Quiz({ examId }: { examId?: string }) {
  const [active, setActive] = useState<string | null>(examId ?? null)
  const [lesson, setLesson] = useState<number | 'all'>('all')
  const [mixed, setMixed] = useState<typeof allQuestions | null>(null)
  const records = useProgress((s) => s.exams)
  const quizzes = useProgress((s) => s.quizzes)
  const recordExam = useProgress((s) => s.recordExam)
  const recordQuiz = useProgress((s) => s.recordQuiz)
  const markQuest = useProgress((s) => s.markQuest)
  const completed = useProgress((s) => s.completed)

  const exam = exams.find((e) => e.id === active)
  const examQuestions = useMemo(
    () => (exam ? exam.questionIds.map((q) => questionById(q)).filter((q): q is NonNullable<typeof q> => !!q) : []),
    [exam]
  )

  const lessonQuestions = useMemo(
    () => (lesson === 'all' ? [] : lessons.find((l) => l.id === lesson)?.quiz ?? []),
    [lesson]
  )

  const best = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of records) map[r.examId] = Math.max(map[r.examId] ?? 0, pct(r.correct, r.total))
    return map
  }, [records])

  const avg = records.length ? Math.round(records.reduce((s, r) => s + pct(r.correct, r.total), 0) / records.length) : 0

  if (exam && examQuestions.length > 0) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm mb-3" onClick={() => setActive(null)}>
          <ArrowLeft size={14} /> بازگشت به آزمون‌ها
        </button>
        <QuizRunner
          questions={examQuestions}
          title={exam.title}
          subtitle={`${exam.subtitle} · ${fas(examQuestions.length)} سؤال`}
          mode="exam"
          minutes={exam.minutes}
          onFinish={(c, t, sec) => {
            recordExam({ examId: exam.id, correct: c, total: t, seconds: sec })
            markQuest('q-quiz', 30)
          }}
          onExit={() => setActive(null)}
        />
      </div>
    )
  }

  if (mixed && mixed.length > 0) {
    return (
      <div>
        <button className="btn btn-ghost btn-sm mb-3" onClick={() => setMixed(null)}>
          <ArrowLeft size={14} /> بازگشت به آزمون‌ها
        </button>
        <QuizRunner
          questions={mixed}
          title="آزمون تصادفی از کل کتاب"
          subtitle="۱۵ سؤال از ۱۶ درس، با پاسخ تشریحی؛ هر بار ترکیب تازه‌ای می‌بینی."
          mode="practice"
          minutes={20}
          onFinish={(c, t) => {
            recordQuiz('mixed', c, t)
            markQuest('q-quiz', 30)
          }}
          onExit={() => setMixed(null)}
        />
      </div>
    )
  }

  if (lesson !== 'all' && lessonQuestions.length > 0) {
    const l = lessons.find((x) => x.id === lesson)!
    return (
      <div>
        <button className="btn btn-ghost btn-sm mb-3" onClick={() => setLesson('all')}>
          <ArrowLeft size={14} /> بازگشت
        </button>
        <QuizRunner
          questions={lessonQuestions}
          title={`آزمونک درس ${fas(l.id)}`}
          subtitle={l.title}
          mode="practice"
          minutes={10}
          onFinish={(c, t) => {
            recordQuiz(`lesson-${l.id}`, c, t)
            markQuest('q-quiz', 30)
          }}
          onExit={() => setLesson('all')}
        />
      </div>
    )
  }

  return (
    <div>
      <SectionHead
        kicker="آزمون‌ها"
        title={<>با <span className="gold-text">شرایط واقعی</span> تمرین کن</>}
        desc="آزمون‌های شبیه‌ساز نوبت اول و دوم، با زمان‌سنج، برگهٔ پاسخ و پاسخنامهٔ تشریحی. هر آزمون را می‌توانی چند بار بدهی."
      />

      <div className="mb-6 grid gap-2.5 sm:grid-cols-3">
        <Stat label="آزمون‌های داده‌شده" value={fas(records.length)} icon={<Trophy size={16} />} />
        <Stat label="میانگین درصد" value={`${fas(avg)}٪`} icon={<Target size={16} />} />
        <Stat label="آزمونک درس‌ها" value={fas(Object.keys(quizzes).length)} icon={<Layers size={16} />} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {exams.map((e) => {
          const score = best[e.id]
          return (
            <button
              key={e.id}
              onClick={() => setActive(e.id)}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface/55 p-5 text-right transition hover:border-gold/35 hover:bg-surface/80"
            >
              <div className="pointer-events-none absolute -left-16 -top-16 size-44 rounded-full bg-gold/8 blur-3xl transition group-hover:bg-gold/15" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <span className="tag mb-2">{e.term}</span>
                  <h3 className="text-lg font-bold">{e.title}</h3>
                  <p className="mt-1 text-[0.72rem] text-muted">{e.subtitle}</p>
                </div>
                {score !== undefined ? (
                  <ProgressRing value={score} size={62} stroke={6}>
                    <span className="text-[0.7rem] font-black text-gold">{fas(score)}٪</span>
                  </ProgressRing>
                ) : (
                  <span className="grid size-[62px] place-items-center rounded-full border border-dashed border-line text-[0.6rem] text-faint">نداده‌ای</span>
                )}
              </div>
              <div className="relative mt-4 flex items-center gap-4 text-[0.65rem] text-faint">
                <span className="flex items-center gap-1"><Clock3 size={12} /> {fas(e.minutes)} دقیقه</span>
                <span>{fas(e.questionIds.length)} سؤال</span>
                <span className="ms-auto flex items-center gap-1 text-gold opacity-0 transition group-hover:opacity-100">
                  شروع آزمون <ArrowLeft size={12} />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="kicker mb-1">آزمونک سریع</div>
              <h3 className="text-base font-bold">یک درس را انتخاب کن</h3>
            </div>
            <span className="chip cursor-default"><Sparkles size={12} /> حالت تمرین</span>
          </div>
          <button
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-gold/30 bg-gold/8 px-3.5 py-3 text-right transition hover:bg-gold/12"
            onClick={() => setMixed(shuffle(allQuestions).slice(0, 15))}
          >
            <span>
              <span className="block text-[0.82rem] font-bold">آزمون تصادفی کل کتاب</span>
              <span className="block text-[0.64rem] text-faint">۱۵ سؤال از همهٔ درس‌ها · همیشه تازه</span>
            </span>
            <Sparkles size={16} className="shrink-0 text-gold" />
          </button>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {lessons.map((l) => {
              const r = quizzes[`lesson-${l.id}`]
              return (
                <button
                  key={l.id}
                  onClick={() => setLesson(l.id)}
                  className={cn(
                    'rounded-xl border p-2.5 text-right transition',
                    completed.includes(l.id) ? 'border-turq/25 bg-turq/5' : 'border-line bg-surface2/30',
                    'hover:border-gold/40 hover:bg-gold/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[0.7rem] font-bold" style={{ color: l.accent }}>درس {fas(l.id)}</span>
                    {r && <span className="text-[0.55rem] text-gold">{fas(r.correct)}/{fas(r.total)}</span>}
                  </div>
                  <div className="mt-0.5 truncate text-[0.66rem] text-muted">{l.title}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="surface p-5">
          <div className="kicker mb-2">کارنامه</div>
          {records.length === 0 ? (
            <div className="py-6 text-center text-[0.78rem] text-faint">هنوز آزمونی نداده‌ای. با یک آزمونک شروع کن.</div>
          ) : (
            <div className="space-y-2.5">
              {records.slice(0, 5).map((r, i) => {
                const e = exams.find((x) => x.id === r.examId)
                const p = pct(r.correct, r.total)
                return (
                  <div key={i} className="rounded-lg border border-line bg-surface2/30 p-2.5">
                    <div className="mb-1 flex items-center justify-between text-[0.7rem]">
                      <span className="font-semibold">{e?.title ?? r.examId}</span>
                      <span className={p >= 80 ? 'text-turq' : p >= 50 ? 'text-gold' : 'text-rose'}>{fas(p)}٪</span>
                    </div>
                    <Bar value={p} color={p >= 80 ? 'var(--c-turq)' : p >= 50 ? 'var(--c-gold)' : 'var(--c-rose)'} height={4} />
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold/20 bg-gold/5 p-2.5 text-[0.68rem] leading-6 text-muted">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-gold" />
            در امتحان نهایی، هر پاسخ نادرست نمرهٔ منفی ندارد؛ پس هیچ سؤالی را خالی نگذار.
          </div>
          <button className="btn btn-gold mt-3 w-full" onClick={() => navigate('progress')}>
            دیدن کارنامهٔ کامل
          </button>
        </div>
      </div>
    </div>
  )
}
