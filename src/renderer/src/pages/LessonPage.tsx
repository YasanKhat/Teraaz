import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  ChevronLeft,
  Clock3,
  Layers,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Printer,
  ScrollText,
  Volume2,
  VolumeX,
  Sparkles,
  Target,
  Trophy,
  Users,
  X
} from 'lucide-react'
import type { Block, Lesson } from '../data/types'
import { lessonById, lessons } from '../data/lessons'
import { chapterById } from '../data/chapters'
import { timeline, eraById } from '../data/timeline'
import { figureById } from '../data/figures'
import { navigate } from '../lib/router'
import { cn, fas, readingTime } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { Bar, ChapterMotif, Modal, SectionHead } from '../components/ui'
import { Flashcards } from '../components/Flashcards'
import { QuizRunner } from '../components/QuizRunner'

type Tab = 'read' | 'summary' | 'cards' | 'quiz' | 'notes'

const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'read', label: 'درس‌نامه', icon: ScrollText },
  { id: 'summary', label: 'جمع‌بندی', icon: ListChecks },
  { id: 'cards', label: 'کارت‌ها', icon: Layers },
  { id: 'quiz', label: 'آزمون درس', icon: Target },
  { id: 'notes', label: 'یادداشت', icon: NotebookPen }
]

function BlockView({ block, accent }: { block: Block; accent: string }) {
  switch (block.t) {
    case 'p':
      return <p className="prose-fa">{block.text}</p>
    case 'bullets':
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[0.95rem] leading-8 text-muted">
              <span className="mt-3 size-1.5 shrink-0 rotate-45 rounded-[1px]" style={{ background: accent }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'tip':
    case 'warn':
      return (
        <div
          className="note-box"
          style={
            block.t === 'warn'
              ? { borderColor: 'color-mix(in oklab, var(--c-rose) 35%, var(--c-line))', background: 'color-mix(in oklab, var(--c-rose) 7%, transparent)' }
              : undefined
          }
        >
          <div className="mb-1 flex items-center gap-1.5 text-[0.8rem] font-bold">
            {block.t === 'warn' ? <X size={14} className="text-rose" /> : <Lightbulb size={14} className="text-gold" />}
            {block.title ?? (block.t === 'warn' ? 'دقت کن' : 'نکته')}
          </div>
          <p className="text-[0.9rem] leading-8 text-muted">{block.text}</p>
        </div>
      )
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface/50">
          <table className="tbl">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={j === 0 ? 'font-semibold text-ink' : undefined}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && <div className="border-t border-line px-3 py-2 text-[0.65rem] text-faint">{block.caption}</div>}
        </div>
      )
    case 'quote':
      return (
        <blockquote className="quote">
          {block.text}
          {block.source && <footer className="mt-2 text-[0.68rem] text-faint">— {block.source}</footer>}
        </blockquote>
      )
    case 'cards':
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.title} className="rounded-xl border border-line bg-surface2/40 p-3.5">
              <div className="mb-1 text-[0.85rem] font-bold" style={{ color: accent }}>
                {item.title}
              </div>
              <p className="text-[0.8rem] leading-7 text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      )
    case 'steps':
      return (
        <div className="relative space-y-3 pr-6">
          <div className="absolute inset-y-2 right-[9px] w-px bg-line" />
          {block.items.map((item, i) => (
            <div key={item.title} className="relative">
              <span
                className="absolute -right-[23px] top-1 grid size-[18px] place-items-center rounded-full border text-[0.55rem] font-bold"
                style={{ borderColor: accent, color: accent, background: 'var(--c-bg)' }}
              >
                {fas(i + 1)}
              </span>
              <div className="rounded-xl border border-line bg-surface2/30 p-3.5">
                <div className="text-[0.85rem] font-bold">{item.title}</div>
                <p className="mt-1 text-[0.8rem] leading-7 text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

export function LessonPage({ id }: { id?: string }) {
  const lesson = id ? lessonById(Number(id)) : undefined
  const [tab, setTab] = useState<Tab>('read')
  const [openEvent, setOpenEvent] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [speaking, setSpeaking] = useState(false)
  const [readPct, setReadPct] = useState(0)

  const speak = () => {
    if (!lesson || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = [lesson.title, lesson.hook, ...lesson.keyPoints].join('. ')
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'fa-IR'
    utter.rate = 0.95
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
    setSpeaking(true)
  }

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  const completed = useProgress((s) => (lesson ? s.completed.includes(lesson.id) : false))
  const record = useProgress((s) => (lesson ? s.quizzes[`lesson-${lesson.id}`] : undefined))
  const notes = useProgress((s) => (lesson ? s.notes[lesson.id] ?? '' : ''))
  const bookmarks = useProgress((s) => s.bookmarks)
  const saveNote = useProgress((s) => s.saveNote)
  const completeLesson = useProgress((s) => s.completeLesson)
  const setProgress = useProgress((s) => s.setLessonProgress)
  const setLastLesson = useProgress((s) => s.setLastLesson)
  const recordQuiz = useProgress((s) => s.recordQuiz)
  const markQuest = useProgress((s) => s.markQuest)
  const toggleBookmark = useProgress((s) => s.toggleBookmark)

  useEffect(() => {
    if (!lesson) return
    setLastLesson(lesson.id)
    setProgress(lesson.id, Math.max(8, useProgress.getState().lessonProgress[lesson.id] ?? 8))
  }, [lesson, setLastLesson, setProgress])

  useEffect(() => {
    setTab('read')
  }, [id])

  useEffect(() => {
    if (tab !== 'read') return
    const onScroll = () => {
      const el = contentRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 150
      const span = el.offsetHeight - window.innerHeight + 260
      const p = span > 0 ? ((window.scrollY - top) / span) * 100 : 0
      setReadPct(Math.max(0, Math.min(100, p)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [tab, lesson])

  const idx = lesson ? lessons.findIndex((l) => l.id === lesson.id) : -1
  const prev = idx > 0 ? lessons[idx - 1] : null
  const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null

  const events = useMemo(() => (lesson ? timeline.filter((e) => e.lessons.includes(lesson.id)) : []), [lesson])
  const cardDeck = useMemo(() => (lesson ? [lesson] : []), [lesson])
  const event = events.find((e) => e.id === openEvent)

  if (!lesson) {
    return (
      <div className="surface p-8 text-center">
        <div className="text-lg font-bold">این درس پیدا نشد.</div>
        <button className="btn btn-gold mt-4" onClick={() => navigate('lessons')}>
          بازگشت به درس‌ها
        </button>
      </div>
    )
  }

  const chapter = chapterById(lesson.chapter)
  const isBookmarked = bookmarks.includes(`lesson-${lesson.id}`)
  const isDone = completed
  const quizRecord = record

  const finishLesson = () => {
    completeLesson(lesson.id)
    markQuest('q-read', 20)
  }

  return (
    <div>
      {tab === 'read' && (
        <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent lg:me-[264px]">
          <div
            className="h-full bg-gradient-to-l from-gold2 via-gold to-gold2 transition-[width] duration-150"
            style={{ width: `${readPct}%` }}
          />
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[0.68rem] text-faint">
        <button className="hover:text-ink" onClick={() => navigate('lessons')}>درس‌ها</button>
        <ChevronLeft size={12} className="rotate-180" />
        <button className="hover:text-ink" onClick={() => navigate(`lessons/${chapter.id}`)}>
          فصل {fas(chapter.id)}: {chapter.title}
        </button>
        <ChevronLeft size={12} className="rotate-180" />
        <span className="text-muted">درس {fas(lesson.id)}</span>
      </div>

      <header className="relative overflow-hidden rounded-[1.7rem] border border-line bg-gradient-to-bl from-surface/85 via-surface/40 to-transparent p-5 md:p-7">
        <div
          className="pointer-events-none absolute -left-20 -top-24 size-64 rounded-full opacity-20 blur-3xl"
          style={{ background: lesson.accent }}
        />
        <ChapterMotif
          motif={chapter.motif}
          className="pointer-events-none absolute -bottom-12 -left-6 size-44 opacity-[0.06]"
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <div
            className="grid size-16 shrink-0 place-items-center rounded-2xl border text-2xl font-black"
            style={{
              color: lesson.accent,
              borderColor: `color-mix(in oklab, ${lesson.accent} 40%, var(--c-line))`,
              background: `color-mix(in oklab, ${lesson.accent} 12%, transparent)`
            }}
          >
            {isDone ? <Check size={28} /> : fas(lesson.id)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="tag" style={{ color: lesson.accent, borderColor: `color-mix(in oklab, ${lesson.accent} 40%, transparent)` }}>
                {lesson.era}
              </span>
              <span className="chip cursor-default">{lesson.span}</span>
              <span className="chip cursor-default"><Clock3 size={12} /> {readingTime(lesson.minutes)}</span>
              {lesson.baram.final && <span className="tag">بارم نهایی {lesson.baram.final}</span>}
            </div>
            <h1 className="text-xl font-black leading-9 md:text-2xl">{lesson.title}</h1>
            <p className="mt-1 text-[0.8rem] text-muted">{lesson.subtitle}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => toggleBookmark(`lesson-${lesson.id}`)}
              title="ذخیرهٔ درس"
            >
              {isBookmarked ? <BookmarkCheck size={17} className="text-gold" /> : <Bookmark size={17} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={speak} title="شنیدن خلاصهٔ درس">
              {speaking ? <VolumeX size={17} className="text-gold" /> : <Volume2 size={17} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()} title="چاپ درس‌نامه">
              <Printer size={16} />
            </button>
            <button className={cn('btn btn-sm', isDone ? 'btn-ghost' : 'btn-gold')} onClick={finishLesson}>
              {isDone ? (
                <>
                  <Check size={14} className="text-turq" /> خوانده‌شده
                </>
              ) : (
                <>پایان درس</>
              )}
            </button>
          </div>
        </div>

        <div className="relative mt-4 rounded-xl border border-line bg-bg/50 p-4">
          <div className="kicker mb-1.5">روایت ورودی</div>
          <p className="text-[1.02rem] font-medium leading-10 text-ink/90">{lesson.hook}</p>
        </div>
      </header>

      <div className="no-scrollbar sticky top-[57px] z-20 mt-4 flex gap-1.5 overflow-x-auto border-b border-line bg-bg/70 py-2 backdrop-blur-xl">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                setProgress(lesson.id, Math.max(useProgress.getState().lessonProgress[lesson.id] ?? 0, t.id === 'read' ? 25 : 55))
                if (t.id === 'summary') markQuest('q-read', 20)
              }}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] transition',
                tab === t.id ? 'bg-gold/12 text-gold' : 'text-muted hover:bg-ink/5'
              )}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        {tab === 'read' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <div ref={contentRef} className="space-y-7">
              {lesson.sections.map((section, si) => (
                <section key={section.title} id={`sec-${si}`} className="scroll-mt-32">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="ornament" />
                    <h2 className="text-lg font-bold">{section.title}</h2>
                  </div>
                  <div className="space-y-4">
                    {section.blocks.map((b, bi) => (
                      <BlockView key={bi} block={b} accent={lesson.accent} />
                    ))}
                  </div>
                </section>
              ))}

              <div className="note-box">
                <div className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
                  <Sparkles size={15} className="text-gold" /> چرا این درس مهم است؟
                </div>
                <p className="text-[0.9rem] leading-8 text-muted">{lesson.why}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/60 p-4">
                <div>
                  <div className="text-sm font-bold">{isDone ? 'این درس را کامل خوانده‌ای' : 'درس را تمام کردی؟'}</div>
                  <div className="text-[0.68rem] text-faint">
                    {isDone ? 'حالا کارت‌ها و آزمون را امتحان کن.' : 'با ثبت پایان درس، ۶۰ امتیاز بگیر و پیشرفتت را ذخیره کن.'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isDone && (
                    <button className="btn btn-gold btn-sm" onClick={finishLesson}>
                      <Trophy size={14} /> ثبت پایان درس
                    </button>
                  )}
                  <button className="btn btn-sm" onClick={() => setTab('quiz')}>
                    <Target size={14} /> آزمون درس
                  </button>
                </div>
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-[118px] space-y-4">
                <div className="surface p-4">
                  <div className="kicker mb-2">در این درس</div>
                  <nav className="space-y-1">
                    {lesson.sections.map((s, i) => (
                      <button
                        key={s.title}
                        onClick={() => document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="block w-full rounded-lg px-2 py-1.5 text-right text-[0.72rem] leading-6 text-muted transition hover:bg-ink/5 hover:text-ink"
                      >
                        {s.title}
                      </button>
                    ))}
                  </nav>
                </div>
                {lesson.people.length > 0 && (
                  <div className="surface p-4">
                    <div className="kicker mb-2">چهره‌ها</div>
                    <div className="space-y-1.5">
                      {lesson.people.map((pid) => {
                        const f = figureById(pid)
                        if (!f) return null
                        return (
                          <button
                            key={pid}
                            className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-right text-[0.72rem] text-muted hover:bg-ink/5 hover:text-ink"
                            onClick={() => navigate(`figures/${pid}`)}
                          >
                            <span className="size-1.5 rounded-full" style={{ background: f.accent }} />
                            <span className="truncate">{f.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {events.length > 0 && (
                  <div className="surface p-4">
                    <div className="kicker mb-2">رویدادها</div>
                    <div className="space-y-1.5">
                      {events.slice(0, 5).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => setOpenEvent(e.id)}
                          className="block w-full rounded-lg px-1.5 py-1 text-right text-[0.7rem] leading-6 text-muted hover:bg-ink/5 hover:text-ink"
                        >
                          <span className="text-gold">{e.date}</span> · {e.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {tab === 'summary' && (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <div className="space-y-4">
              <div className="surface p-5">
                <SectionHead kicker="مرور سریع" title="نکات کلیدی درس" className="mb-3" />
                <ol className="space-y-2.5">
                  {lesson.keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-3 text-[0.86rem] leading-8">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-gold/10 text-[0.6rem] font-bold text-gold">
                        {fas(i + 1)}
                      </span>
                      <span className="text-muted">{k}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="surface p-5">
                <SectionHead kicker="برای امتحان" title="نکته‌های امتحانی" className="mb-3" />
                <div className="space-y-2.5">
                  {lesson.examTips.map((t, i) => (
                    <div key={i} className="note-box py-3">
                      <div className="flex gap-2 text-[0.84rem] leading-7 text-muted">
                        <Target size={14} className="mt-1 shrink-0 text-gold" />
                        {t}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="panel relative overflow-hidden p-5">
                <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-gold/15 blur-2xl" />
                <div className="kicker mb-1.5">حافظه‌یار</div>
                <h3 className="display text-[1.15rem] text-gold">{lesson.mnemonic.title}</h3>
                <p className="mt-2 text-[0.86rem] leading-8 text-muted">{lesson.mnemonic.text}</p>
              </div>
              <div className="surface p-5">
                <div className="kicker mb-2">واژه‌نامه</div>
                <div className="space-y-2">
                  {lesson.terms.map((t) => (
                    <details key={t.term} className="group rounded-lg border border-line bg-surface2/30 px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-[0.8rem] font-semibold">
                        {t.term}
                        <ChevronLeft size={13} className="text-faint transition group-open:rotate-90" />
                      </summary>
                      <p className="mt-1.5 text-[0.76rem] leading-7 text-muted">{t.def}</p>
                    </details>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn" onClick={() => setTab('cards')}>
                  <Layers size={15} /> کارت‌ها
                </button>
                <button className="btn btn-gold" onClick={() => setTab('quiz')}>
                  <Target size={15} /> آزمون
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'cards' && (
          <div>
            <SectionHead kicker="مرور فاصله‌دار" title={`کارت‌های درس ${fas(lesson.id)}`} desc="ابتدا حدس بزن، بعد کارت را برگردان. صادق باش؛ زمان‌بندی مرور بر پایهٔ پاسخ‌های تو تنظیم می‌شود." />
            <Flashcards lessons={cardDeck} title={`درس ${lesson.id}`} />
          </div>
        )}

        {tab === 'quiz' && (
          <div>
            <SectionHead
              kicker="آزمونک"
              title={`آزمون درس ${fas(lesson.id)}`}
              desc="بازخورد فوری با پاسخ تشریحی؛ هر پاسخ درست ۵ امتیاز."
              action={
                quizRecord ? (
                  <span className="chip cursor-default">
                    بهترین: {fas(quizRecord.correct)} از {fas(quizRecord.total)}
                  </span>
                ) : undefined
              }
            />
            <QuizRunner
              questions={lesson.quiz}
              title={`آزمون درس ${fas(lesson.id)}: ${lesson.title}`}
              subtitle="سؤال‌ها بر پایهٔ متن درس و الگوی امتحان نهایی طراحی شده‌اند."
              mode="practice"
              minutes={Math.ceil(lesson.quiz.length * 1.5)}
              onFinish={(c, t) => {
                recordQuiz(`lesson-${lesson.id}`, c, t)
                markQuest('q-quiz', 30)
                setProgress(lesson.id, Math.max(useProgress.getState().lessonProgress[lesson.id] ?? 0, 70))
              }}
              onExit={() => setTab('summary')}
            />
          </div>
        )}

        {tab === 'notes' && (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="surface p-5">
              <SectionHead kicker="دفتر شخصی" title={`یادداشت‌های درس ${fas(lesson.id)}`} desc="هرچه را نمی‌خواهی فراموش کنی، اینجا بنویس. ذخیره خودکار است." />
              <textarea
                value={notes}
                onChange={(e) => saveNote(lesson.id, e.target.value)}
                placeholder="مثلاً: سه علت جنگ صلیبی…"
                className="min-h-[260px] w-full resize-y rounded-xl border border-line bg-surface2/40 p-4 text-[0.88rem] leading-8 outline-none placeholder:text-faint focus:border-gold/40"
              />
            </div>
            <div className="space-y-3">
              <div className="surface p-4">
                <div className="kicker mb-2">نشانگرها</div>
                <div className="space-y-1.5 text-[0.78rem] text-muted">
                  <div className="flex items-center gap-2"><Users size={14} className="text-lapis" /> {fas(lesson.people.length)} چهرهٔ مرتبط</div>
                  <div className="flex items-center gap-2"><Clock3 size={14} className="text-gold" /> {fas(events.length)} رویداد در خط زمان</div>
                  <div className="flex items-center gap-2"><Layers size={14} className="text-turq" /> {fas(lesson.terms.length)} واژهٔ کلیدی</div>
                </div>
              </div>
              <button className="btn btn-gold w-full" onClick={finishLesson}>
                <Check size={15} /> {isDone ? 'این درس کامل است' : 'پایان درس و ثبت پیشرفت'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
        {prev ? (
          <button onClick={() => navigate(`lesson/${prev.id}`)} className="card-hover rounded-xl border border-line bg-surface/60 p-4 text-right">
            <div className="mb-1 flex items-center gap-1.5 text-[0.65rem] text-faint"><ArrowRight size={12} /> درس قبلی</div>
            <div className="text-[0.85rem] font-bold">{fas(prev.id)}. {prev.title}</div>
          </button>
        ) : (
          <div />
        )}
        {next && (
          <button onClick={() => navigate(`lesson/${next.id}`)} className="card-hover rounded-xl border border-line bg-surface/60 p-4 text-left">
            <div className="mb-1 flex items-center justify-end gap-1.5 text-[0.65rem] text-faint">درس بعدی <ArrowLeft size={12} /></div>
            <div className="text-[0.85rem] font-bold">{fas(next.id)}. {next.title}</div>
          </button>
        )}
      </div>

      <Modal open={!!event} onClose={() => setOpenEvent(null)} title={event?.title}>
        {event && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="tag">{event.date}</span>
              <span className="tag">{event.cat}</span>
              <span className="tag">{eraById(event.era).title}</span>
            </div>
            <p className="text-[0.9rem] leading-8 text-muted">{event.desc}</p>
            <div className="flex justify-end">
              <button
                className="btn btn-gold btn-sm"
                onClick={() => {
                  setOpenEvent(null)
                  navigate(`timeline/${event.id}`)
                }}
              >
                دیدن در خط زمان <ArrowLeft size={13} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
