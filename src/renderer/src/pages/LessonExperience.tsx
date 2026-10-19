import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Headphones,
  BookOpen,
  Layers,
  Map as MapIcon,
  Printer,
  Play,
  Sparkles,
  Target,
  TriangleAlert as AlertTriangle,
  Volume2,
  VolumeX
} from 'lucide-react'
import { lessonById, lessons } from '../data/lessons'
import { chapterById } from '../data/chapters'
import { planByLesson, planChapterOfLesson } from '../data/plans'
import type { Panel } from '../data/plans/types'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas, readingTime } from '../lib/utils'
import { LessonHero } from '../components/LessonHero'
import { BookText } from '../components/BookText'
import { BookExam } from '../components/BookExam'
import { BookSummaryView } from '../components/BookSummary'
import { BookLines } from '../components/BookLines'
import { ClipboardList, ListChecks } from 'lucide-react'
import { useProgress } from '../store/useProgress'
import { HistoricMap } from '../components/HistoricMap'
import { TimelineStrip } from '../components/scene/TimelineStrip'
import { Blocks, PanelView, Reveal } from '../components/scene/Panels'
import { LessonSignature } from '../components/signature'
import { FilmMode } from '../components/FilmMode'
import { Bar, ProgressRing } from '../components/ui'
import { QuizRunner } from '../components/QuizRunner'
import { Flashcards } from '../components/Flashcards'

type Mode = 'journey' | 'read' | 'bank' | 'lines' | 'exam' | 'cards'

export function LessonExperience({ id, autoFilm = false, openRead = false, initialQuery = '' }: { id?: string; autoFilm?: boolean; openRead?: boolean; initialQuery?: string }) {
  const lesson = lessonById(Number(id))
  const plan = lesson ? planByLesson(lesson.id) : undefined
  const chapter = lesson ? chapterById(lesson.chapter) : undefined
  const chapterPlan = lesson ? planChapterOfLesson(lesson.id) : undefined

  const [active, setActive] = useState(0)
  const [mode, setMode] = useState<Mode>('journey')
  const [readSource, setReadSource] = useState<'book' | 'summary' | 'digest'>('book')
  const [speaking, setSpeaking] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [film, setFilm] = useState(false)
  const refs = useRef<Record<number, HTMLElement | null>>({})

  const completed = useProgress((s) => (lesson ? s.completed.includes(lesson.id) : false))
  const readPct = useProgress((s) => (lesson ? s.lessonProgress[lesson.id] ?? 0 : 0))
  const readPos = useProgress((s) => (lesson ? s.readPos[lesson.id] ?? 0 : 0))
  const saveReadPos = useProgress((s) => s.saveReadPos)
  const doneRef = useRef<number>(-1)
  const bookmarks = useProgress((s) => s.bookmarks)
  const setProgress = useProgress((s) => s.setLessonProgress)

  const onBookRead = useCallback(
    (fraction: number) => {
      if (!lesson) return
      saveReadPos(lesson.id, fraction)
      const rounded = Math.round((8 + fraction * 84) / 2) * 2
      if (rounded === doneRef.current) return
      doneRef.current = rounded
      const state = useProgress.getState()
      if (state.completed.includes(lesson.id)) return
      setProgress(lesson.id, Math.max(state.lessonProgress[lesson.id] ?? 0, rounded))
    },
    [lesson, saveReadPos, setProgress]
  )
  const completeLesson = useProgress((s) => s.completeLesson)
  const toggleBookmark = useProgress((s) => s.toggleBookmark)
  const setLastLesson = useProgress((s) => s.setLastLesson)
  const recordQuiz = useProgress((s) => s.recordQuiz)
  const markQuest = useProgress((s) => s.markQuest)
  const quizRecord = useProgress((s) => (lesson ? s.quizzes[`lesson-${lesson.id}`] : undefined))
  const sceneCount = plan?.scenes.length ?? 1

  useEffect(() => {
    if (!lesson) return
    setLastLesson(lesson.id)
    doneRef.current = -1
    setMode(openRead ? 'read' : 'journey')
    setActive(0)
    markQuest('q-read', 20)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [lesson, setLastLesson, markQuest, openRead])

  useEffect(() => {
    if (!lesson || !initialQuery) return
    const t = window.setTimeout(() => {
      const marked = document.querySelector('mark[data-bookhit]')
      if (marked) marked.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 700)
    return () => window.clearTimeout(t)
  }, [lesson, initialQuery])

  useEffect(() => {
    if (!plan) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.scene)
            if (!Number.isNaN(i)) {
              setActive(i)
              const value = Math.round(((i + 1) / sceneCount) * 92)
              if (!useProgress.getState().completed.includes(lesson!.id)) {
                setProgress(lesson!.id, Math.max(8, value))
              }
            }
          }
        })
      },
      { rootMargin: '-38% 0px -52% 0px', threshold: 0 }
    )
    Object.values(refs.current).forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [plan, lesson, sceneCount, setProgress])

  useEffect(() => {
    if (autoFilm && lesson) setFilm(true)
  }, [autoFilm, lesson])

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  const baseScenes = plan?.scenes ?? []
  const allScenes = useMemo(() => {
    if (!lesson) return baseScenes
    const used = new Set<number>()
    baseScenes.forEach((sc) => (sc.sections ?? []).forEach((n) => used.add(n)))
    const missing = lesson.sections.map((_, i) => i).filter((i) => !used.has(i))
    if (!missing.length) return baseScenes
    return [
      ...baseScenes,
      {
        title: 'پیوست: بخش‌های تکمیلی درس',
        kicker: 'برای کامل‌شدن تصویر',
        sections: missing,
        panels: []
      }
    ]
  }, [baseScenes, lesson])
  const scenes = allScenes
  const idxInChapter = chapterPlan?.lessons.findIndex((l) => l.lesson === lesson?.id) ?? -1
  const nextLesson = lessons.find((l) => l.id === (lesson?.id ?? 0) + 1)
  const prevLesson = [...lessons].reverse().find((l) => l.id === (lesson?.id ?? 0) - 1)

  const speak = () => {
    if (!lesson || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const parts = [lesson.title, plan?.heroLine ?? '', plan?.question ?? '', ...lesson.keyPoints]
    const utter = new SpeechSynthesisUtterance(parts.join('. '))
    utter.lang = 'fa-IR'
    utter.rate = 0.95
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
    setSpeaking(true)
  }

  if (!lesson || !plan || !chapter || !chapterPlan) {
    return (
      <div className="surface p-8 text-center">
        <div className="text-lg font-bold">این درس پیدا نشد.</div>
        <button className="btn btn-gold mt-4" onClick={() => navigate('chapters')}>بازگشت به فصل‌ها</button>
      </div>
    )
  }

  const isBookmarked = bookmarks.includes(`lesson-${lesson.id}`)
  const deck = [lesson]
  const allPanels = scenes.flatMap((s) => s.panels)

  return (
    <div className="space-y-6">
      <FilmMode lesson={lesson} plan={plan} open={film} onClose={() => setFilm(false)} />
      <LessonHero
        lesson={lesson}
        plan={plan}
        chapter={chapter}
        chapterPlan={chapterPlan}
        idxInChapter={idxInChapter}
        sceneCount={scenes.length}
        readPct={readPct}
        completed={completed}
        isBookmarked={isBookmarked}
        speaking={speaking}
        onStart={() => { setMode('journey'); refs.current[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
        onFilm={() => setFilm(true)}
        onExam={() => setMode('exam')}
        onSpeak={speak}
        onBookmark={() => toggleBookmark(`lesson-${lesson.id}`)}
      />

      {/* ── ناوبری صحنه ───────────────────────────────────────── */}
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-line bg-bg/80 px-4 py-2 backdrop-blur-xl md:-mx-0 md:rounded-xl md:border md:px-3">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          <div className="flex shrink-0 items-center rounded-lg border border-line bg-bg/60 p-0.5">
            <button
              onClick={() => setMode('journey')}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[0.66rem] transition', mode === 'journey' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-ink')}
            >
              <Layers size={11} /> صحنه‌ها
            </button>
            <button
              onClick={() => setMode('read')}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[0.66rem] transition', mode === 'read' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-ink')}
            >
              <BookOpen size={11} /> متن کامل
            </button>
            <button
              onClick={() => setMode('bank')}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[0.66rem] transition', mode === 'bank' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-ink')}
            >
              <ClipboardList size={11} /> پرسش‌ها
            </button>
            <button
              onClick={() => setMode('lines')}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[0.66rem] transition', mode === 'lines' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-ink')}
            >
              <ListChecks size={11} /> خط‌به‌خط
            </button>
            <button
              onClick={() => setMode('cards')}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[0.66rem] transition', mode === 'cards' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-ink')}
            >
              <Layers size={11} /> کارت‌ها
            </button>
            <button
              onClick={() => setMode('exam')}
              className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[0.66rem] transition', mode === 'exam' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-ink')}
            >
              <Target size={11} /> آزمون
            </button>
          </div>
          {mode === 'journey' && (
            <>
              <span className="h-4 w-px shrink-0 bg-line" />
              {scenes.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => {
                    setShowAll(true)
                    setTimeout(() => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
                  }}
                  data-active={active === i}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[0.66rem] transition',
                    active === i ? 'bg-ink/8 text-gold' : 'text-muted hover:bg-ink/5'
                  )}
                >
                  <span className="text-[0.52rem] opacity-70">{fas(i + 1)}</span>
                  {s.title.length > 22 ? s.title.slice(0, 22) + '…' : s.title}
                </button>
              ))}
            </>
          )}
          {mode === 'read' && (
            <div className="ms-1 flex shrink-0 items-center gap-1 border-s border-line ps-2">
              <button
                onClick={() => setReadSource('book')}
                className={cn('rounded-md px-2 py-1 text-[0.64rem] transition', readSource === 'book' ? 'bg-ink/10 text-ink' : 'text-faint hover:text-ink')}
              >
                کتاب کامل
              </button>
              <button
                onClick={() => setReadSource('summary')}
                className={cn('rounded-md px-2 py-1 text-[0.64rem] transition', readSource === 'summary' ? 'bg-ink/10 text-ink' : 'text-faint hover:text-ink')}
              >
                خلاصهٔ کتاب
              </button>
              <button
                onClick={() => setReadSource('digest')}
                className={cn('rounded-md px-2 py-1 text-[0.64rem] transition', readSource === 'digest' ? 'bg-ink/10 text-ink' : 'text-faint hover:text-ink')}
              >
                چکیده
              </button>
            </div>
          )}
          {mode !== 'journey' && (
            <span className="ms-auto shrink-0 text-[0.56rem] text-faint">
              {mode === 'read'
                ? 'همان متن کتاب، کامل'
                : mode === 'bank'
                  ? 'پرسش‌های خود کتاب'
                  : mode === 'lines'
                    ? 'جمله‌های کتاب؛ درست یا نادرست؟'
                    : mode === 'cards'
                      ? 'برای مرور سریع'
                      : 'خودآزمایی درس'}
            </span>
          )}
        </div>
      </div>

      {mode === 'read' && (
        <section className="mx-auto max-w-3xl">
          {readSource === 'book' && (
            <BookText
              lessonId={lesson.id}
              title={lesson.title}
              accent={lesson.accent}
              query={initialQuery}
              resume={readPos}
              onRead={onBookRead}
            />
          )}
          {readSource === 'summary' && <BookSummaryView lessonId={lesson.id} />}

          {readSource === 'digest' && (
          <div className="space-y-8">
            {lesson.sections.map((sec, i) => (
              <article key={sec.title}>
                <h3 className="mb-2.5 text-[1.05rem] font-black">{sec.title}</h3>
                <div className="space-y-4">
                  <Blocks section={sec} accent={lesson.accent} />
                </div>
              </article>
            ))}

            <article className="border-t border-line pt-6">
              <h3 className="mb-2.5 text-[1.05rem] font-black">نکته‌های کلیدی</h3>
              <ol className="space-y-2">
                {lesson.keyPoints.map((k, i) => (
                  <li key={i} className="flex gap-3 text-[0.88rem] leading-8">
                    <span className="shrink-0 text-[0.62rem] text-gold">{fas(i + 1)}</span>
                    <span className="text-muted">{k}</span>
                  </li>
                ))}
              </ol>
            </article>

            <article>
              <h3 className="mb-2.5 text-[1.05rem] font-black">واژه‌نامه</h3>
              <dl className="grid gap-2 sm:grid-cols-2">
                {lesson.terms.map((t) => (
                  <div key={t.term} className="scene-mini">
                    <dt className="text-[0.8rem] font-bold text-gold">{t.term}</dt>
                    <dd className="mt-0.5 text-[0.74rem] leading-6 text-muted">{t.def}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-xl border-s-2 border-gold bg-gold/[0.04] px-4 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[0.8rem] font-bold"><Sparkles size={13} className="text-gold" /> حافظه‌یار</div>
              <div className="text-[0.9rem] font-bold">{lesson.mnemonic.title}</div>
              <p className="mt-1 text-[0.8rem] leading-7 text-muted">{lesson.mnemonic.text}</p>
            </article>

            <article>
              <h3 className="mb-2.5 text-[1.05rem] font-black">نکته‌های امتحانی</h3>
              <ul className="space-y-2">
                {lesson.examTips.map((t, i) => (
                  <li key={i} className="flex gap-2.5 text-[0.84rem] leading-7 text-muted">
                    <Target size={13} className="mt-1 shrink-0 text-gold" /> {t}
                  </li>
                ))}
              </ul>
            </article>
          </div>
          )}

          <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[0.6rem] text-faint">
            <span>{readSource === 'book' ? 'همان متن کتاب درسی؛ کامل و بی‌کم‌وکاست' : readSource === 'summary' ? 'خلاصهٔ رسمی پایان کتاب' : 'چکیده، واژه‌نامه و نکته‌های امتحانی'}</span>
            <button className="btn btn-sm" onClick={() => window.print()}><Printer size={12} /> چاپ این درس</button>
          </div>
        </section>
      )}

      {mode === 'bank' && (
        <section>
          <BookExam lessonId={lesson.id} />
        </section>
      )}

      {mode === 'lines' && (
        <section>
          <BookLines lessonId={lesson.id} accent={lesson.accent} />
        </section>
      )}

      {mode === 'exam' && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="kicker mb-1">آزمون درس {fas(lesson.id)}</div>
              <h2 className="text-lg font-black">{lesson.title}</h2>
            </div>
            {quizRecord && <span className="chip cursor-default">بهترین: {fas(quizRecord.correct)} از {fas(quizRecord.total)}</span>}
          </div>
          <QuizRunner
            questions={lesson.quiz}
            title={`آزمون درس ${fas(lesson.id)}`}
            subtitle="پرسش‌ها از متن همین درس و با الگوی امتحان نهایی‌اند."
            mode="practice"
            minutes={Math.ceil(lesson.quiz.length * 1.4)}
            onFinish={(c, t) => {
              recordQuiz(`lesson-${lesson.id}`, c, t)
              markQuest('q-quiz', 30)
              setProgress(lesson.id, 100)
            }}
            onExit={() => setMode('journey')}
          />
        </section>
      )}

      {mode === 'cards' && (
        <section>
          <div className="mb-3">
            <div className="kicker mb-1">کارت‌های مرور</div>
            <h2 className="text-lg font-black">واژه‌های کلیدی درس {fas(lesson.id)}</h2>
          </div>
          <Flashcards lessons={deck} title={`درس ${lesson.id}`} />
        </section>
      )}

      {mode === 'journey' && (
        <div className="space-y-6">
          <LessonSignature lesson={lesson.id} />
        </div>
      )}

      {mode === 'journey' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
          <div className="min-w-0 space-y-8">
            {scenes.map((s, i) => {
              const sectionBlocks = (s.sections ?? []).map((n) => lesson.sections[n]).filter(Boolean)
              return (
                <section
                  key={s.title}
                  ref={(el) => { refs.current[i] = el }}
                  data-scene={i}
                  className="scene scroll-mt-32"
                >
                  <div className="scene__head">
                    <span className="scene__num">{fas(i + 1)}</span>
                    <div className="min-w-0">
                      <div className="kicker mb-0.5">صحنهٔ {fas(i + 1)} از {fas(scenes.length)}</div>
                      <h2 className="text-xl font-black leading-9 md:text-[1.35rem]">{s.title}</h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {s.maps?.map((m, k) => (
                      <Reveal key={k}>
                        <div>
                          <div className="mb-1.5 flex items-center gap-1.5 text-[0.62rem] text-faint">
                            <MapIcon size={11} className="text-gold" /> نقشهٔ تعاملی — با دکمهٔ پخش، گام‌به‌گام ببین
                          </div>
                          <HistoricMap spec={m.spec} />
                        </div>
                      </Reveal>
                    ))}

                    {s.timeline && (
                      <Reveal>
                        <TimelineStrip ids={s.timeline.items} title={s.timeline.title} />
                      </Reveal>
                    )}

                    {sectionBlocks.map((sec) => (
                      <Reveal key={sec.title}>
                        <div className="rounded-2xl border border-line bg-surface/45 p-4">
                          <h3 className="mb-2.5 flex items-center gap-2 text-[0.95rem] font-bold">
                            <span className="size-1.5 rotate-45 rounded-[1px] bg-gold" />
                            {sec.title}
                          </h3>
                          <Blocks section={sec} accent={lesson.accent} />
                        </div>
                      </Reveal>
                    ))}

                    {s.panels.map((p, k) => (
                      <Reveal key={k} delay={0.02 * k}>
                        <PanelView panel={p} accent={lesson.accent} />
                      </Reveal>
                    ))}

                    {s.takeaway && (
                      <Reveal>
                        <div className="flex items-start gap-2.5 rounded-xl border-s-2 border-gold bg-gold/[0.04] px-3.5 py-2.5">
                          <Sparkles size={14} className="mt-0.5 shrink-0 text-gold" />
                          <div>
                            <div className="text-[0.58rem] tracking-widest text-gold/80">جمع‌بندی صحنه</div>
                            <p className="mt-0.5 text-[0.84rem] leading-7 text-ink/85">{s.takeaway}</p>
                          </div>
                        </div>
                      </Reveal>
                    )}
                  </div>
                </section>
              )
            })}

            {/* ── میز آزمون ─────────────────────────────────── */}
            <section className="scroll-mt-32" ref={(el) => { refs.current[scenes.length] = el }} data-scene={scenes.length}>
              <div className="scene__head">
                <span className="scene__num">{fas(scenes.length + 1)}</span>
                <div>
                  <div className="kicker mb-0.5">میز آزمون</div>
                  <h2 className="text-xl font-black">آنچه ممتحن می‌پرسد</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2.5 md:grid-cols-2">
                  {plan.interview.map((item) => (
                    <details key={item.q} className="scene-mini group">
                      <summary className="flex cursor-pointer list-none items-start gap-2 text-[0.82rem] font-semibold">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-gold/30 text-[0.55rem] text-gold">؟</span>
                        <span className="flex-1 leading-7">{item.q}</span>
                        <ChevronDown size={13} className="mt-1 text-faint transition group-open:rotate-180" />
                      </summary>
                      <p className="mt-2 border-s-2 border-gold/25 ps-3 text-[0.78rem] leading-8 text-muted">{item.a}</p>
                    </details>
                  ))}
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {plan.danger.map((d) => (
                    <div key={d.title + d.text} className="rounded-xl border border-rose/25 bg-rose/[0.05] p-3.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[0.72rem] font-bold text-rose">
                        <AlertTriangle size={12} /> {d.title}
                      </div>
                      <p className="text-[0.76rem] leading-7 text-muted">{d.text}</p>
                    </div>
                  ))}
                </div>

                <PanelView panel={{ kind: 'recipe', title: plan.examRecipe.title, rows: plan.examRecipe.rows } as Panel} accent={lesson.accent} />

                {lesson.terms.length > 0 && (
                  <div className="rounded-2xl border border-line bg-surface/45 p-4">
                    <div className="kicker mb-2.5">واژه‌نامهٔ درس</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {lesson.terms.map((t) => (
                        <div key={t.term} className="scene-mini">
                          <div className="text-[0.8rem] font-bold text-gold">{t.term}</div>
                          <p className="mt-0.5 text-[0.74rem] leading-6 text-muted">{t.def}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/60 p-4">
                  <div>
                    <div className="text-[0.9rem] font-bold">{completed ? 'این درس را کامل کرده‌ای' : 'درس را تمام کردی؟'}</div>
                    <div className="text-[0.7rem] text-faint">{completed ? 'حالا درس بعدی یا آزمون فصل.' : 'با ثبت پایان درس، ۶۰ امتیاز بگیر.'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!completed && (
                      <button className="btn btn-gold btn-sm" onClick={() => { completeLesson(lesson.id); markQuest('q-read', 20) }}>
                        <Check size={14} /> ثبت پایان درس
                      </button>
                    )}
                    <button className="btn btn-sm" onClick={() => setFilm(true)}><Play size={13} /> تماشای درس</button>
            <button className="btn btn-sm" onClick={() => setMode('exam')}><Target size={13} /> آزمون درس</button>
                    <button className="btn btn-sm" onClick={() => setMode('cards')}><Layers size={13} /> کارت‌ها</button>
                  </div>
                </div>

                <button className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2 text-[0.7rem] text-faint hover:text-ink" onClick={() => setShowAll((v) => !v)}>
                  <span>دیدن فهرست کامل پرسش‌های خودآزمایی این درس ({fas(allPanels.filter((p) => p.kind === 'check').length)} پرسش)</span>
                  <ChevronDown size={13} className={cn('transition', showAll && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {showAll && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="space-y-2.5">
                        {allPanels.filter((p) => p.kind === 'check').map((p, i) => (
                          <PanelView key={i} panel={p} accent={lesson.accent} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* ── درس بعد ──────────────────────────────────── */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {prevLesson ? (
                <button onClick={() => navigate(`lesson/${prevLesson.id}`)} className="card-hover rounded-xl border border-line bg-surface/55 p-4 text-start">
                  <div className="mb-1 flex items-center gap-1.5 text-[0.62rem] text-faint"><ArrowRight size={11} /> درس قبلی</div>
                  <div className="text-[0.86rem] font-bold">{fas(prevLesson.id)}. {prevLesson.title}</div>
                </button>
              ) : <span />}
              {nextLesson && (
                <button onClick={() => navigate(`lesson/${nextLesson.id}`)} className="card-hover rounded-xl border border-line bg-surface/55 p-4 text-end">
                  <div className="mb-1 flex items-center justify-end gap-1.5 text-[0.62rem] text-faint">درس بعدی <ArrowLeft size={11} /></div>
                  <div className="text-[0.86rem] font-bold">{fas(nextLesson.id)}. {nextLesson.title}</div>
                </button>
              )}
            </div>
            <div className="text-center">
              <button className="btn btn-sm" onClick={() => navigate(`recap/${chapter.id}`)}>
                بازخوانی فصل {fas(chapter.id)} <ArrowLeft size={12} />
              </button>
            </div>
          </div>

          {/* ── ریل صحنه‌ها ───────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="scene-rail">
              <div className="kicker mb-1.5 px-1">در این درس</div>
              {scenes.map((s, i) => (
                <button
                  key={s.title}
                  data-active={active === i}
                  className="scene-rail__item"
                  onClick={() => { setShowAll(true); refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                >
                  <span className="scene-rail__dot" />
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
              <button data-active={active >= scenes.length} className="scene-rail__item" onClick={() => refs.current[scenes.length]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <span className="scene-rail__dot" />
                <span className="truncate">میز آزمون</span>
              </button>

              <div className="mt-3 rounded-xl border border-line bg-surface/50 p-2.5">
                <div className="mb-1 flex items-center justify-between text-[0.58rem] text-faint">
                  <span>پیشرفت</span>
                  <span className="text-gold">{fas(readPct)}٪</span>
                </div>
                <Bar value={readPct} height={3} />
                <div className="mt-2 flex items-center gap-1 text-[0.55rem] text-faint">
                  <Headphones size={10} /> {fas(scenes.length)} صحنه · {fas(lesson.terms.length)} واژه
                </div>
              </div>

              <button className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.66rem] text-muted hover:text-ink" onClick={() => navigate(`chapter/${chapter.id}`)}>
                <ChevronLeft size={11} className="rotate-180" /> بازگشت به فصل
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
