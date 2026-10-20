import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  FileText,
  Library,
  ListChecks,
  Quote,
  ScrollText,
  X
} from 'lucide-react'
import {
  loadBook,
  loadLines,
  loadSummary,
  type BookBlock,
  type BookLesson,
  type BookLine,
  type BookSummary
} from '../lib/book'
import { lessonById } from '../data/lessons'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'

type Tab = 'text' | 'line' | 'summary'

const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: 'text', label: 'متن درس', icon: FileText },
  { key: 'line', label: 'خط‌به‌خط', icon: ListChecks },
  { key: 'summary', label: 'خلاصهٔ کتاب', icon: ScrollText }
]

/** جای‌گاه پاسخ‌ها در حافظهٔ محلی، تا مرور خط‌به‌خط از جا ادامه یابد */
const LS = 'tabar:lineReview'

function useLineReview() {
  const [state, setState] = useState<Record<string, 'ok' | 'no'>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS) || '{}')
    } catch {
      return {}
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(state))
    } catch {
      /* حافظه پر است — بی‌صدا رد شو */
    }
  }, [state])
  return [state, setState] as const
}

function Block({ b }: { b: BookBlock }) {
  if (b.t === 'h') return <h3 className="rdx__h">{b.text}</h3>
  if (b.t === 'note')
    return (
      <aside className="rdx__note">
        <span className="rdx__noteTag">نکته</span>
        <p>{b.text}</p>
      </aside>
    )
  if (b.t === 'ex') return <div className="rdx__ex">{b.text}</div>
  if (b.t === 'chart')
    return (
      <div className="rdx__chart">
        {b.text.split(/\s*->\s*/).map((part, i) => (
          <span key={i} className="rdx__chartStep">
            {part}
          </span>
        ))}
      </div>
    )
  if (b.t === 'q') {
    const m = b.text.match(/^([۰-۹]+)\s*[-.)]\s*/)
    return (
      <p className="rdx__q">
        {m && <span className="rdx__qNo">{m[1]}</span>}
        <span>{m ? b.text.slice(m[0].length) : b.text}</span>
      </p>
    )
  }
  if (b.t === 'ans') return <p className="rdx__ans">{b.text}</p>
  if (b.t === 'table')
    return (
      <div className="rdx__table">
        {b.text.split('\n').map((row, i) => (
          <div key={i} className="rdx__row">
            {row.split('\t').map((cell, j) => (
              <span key={j}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    )
  return <p className="rdx__p">{b.text}</p>
}

export function BookReader({ id }: { id?: string }) {
  const n = Math.min(16, Math.max(1, Number(id) || 1))
  const lesson = lessonById(n)
  const [tab, setTab] = useState<Tab>('text')
  const [lessons, setLessons] = useState<BookLesson[]>([])
  const [lines, setLines] = useState<BookLine[]>([])
  const [summaries, setSummaries] = useState<BookSummary[]>([])
  const [answerShown, setAnswerShown] = useState(false)
  const [onlyWrong, setOnlyWrong] = useState(false)
  const [review, setReview] = useLineReview()
  useEffect(() => {
    let alive = true
    Promise.all([loadBook(), loadLines(), loadSummary()]).then(([b, l, s]) => {
      if (!alive) return
      setLessons(b)
      setLines(l)
      setSummaries(s)
    })
    return () => {
      alive = false
    }
  }, [])

  const book = useMemo(() => lessons.find((l) => l.id === n), [lessons, n])
  const summary = useMemo(() => summaries.find((s) => s.lesson === n), [summaries, n])
  const lessonLines = useMemo(() => lines.filter((l) => l.lesson === n), [lines, n])

  const counts = useMemo(() => {
    const blocks = book?.blocks ?? []
    return {
      heads: blocks.filter((b) => b.t === 'h').length,
      notes: blocks.filter((b) => b.t === 'note').length,
      questions: blocks.filter((b) => b.t === 'q').length + lessonLines.length,
      summary: summary?.items.length ?? 0
    }
  }, [book, lessonLines, summary])

  const shownLines = useMemo(() => {
    if (!onlyWrong) return lessonLines
    return lessonLines.filter((l) => review[`${l.lesson}-${l.n}`] === 'no')
  }, [lessonLines, onlyWrong, review])

  const answered = lessonLines.filter((l) => review[`${l.lesson}-${l.n}`]).length
  const correct = lessonLines.filter((l) => review[`${l.lesson}-${l.n}`] === 'ok').length

  return (
    <div className="rdx">
      <header className="rdx__head">
        <button className="rdx__back" onClick={() => navigate(`lesson/${n}`)}>
          <ArrowRight size={14} /> درس {fas(n)}
        </button>

        <div className="rdx__titleRow">
          <div className="min-w-0">
            <div className="rdx__eyebrow">
              <Library size={12} /> متن کامل کتاب درسی
            </div>
            <h1 className="rdx__title">{lesson?.title ?? `درس ${fas(n)}`}</h1>
            <p className="rdx__sub">
              هر جمله‌ای که در کتاب آمده، همان‌جا و بدون کم‌وکاست. نکته‌ها و پرسش‌های کتاب هم در جای خودشان.
            </p>
          </div>

          <div className="rdx__pick">
            <select
              value={n}
              onChange={(e) => navigate(`book/${e.target.value}`)}
              aria-label="انتخاب درس"
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((i) => (
                <option key={i} value={i}>
                  درس {fas(i)} — {lessonById(i)?.title ?? ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="rdx__stats">
          <span>
            <BookOpenCheck size={12} /> {fas(counts.heads)} سرتیتر
          </span>
          <span>
            <Quote size={12} /> {fas(counts.notes)} نکتهٔ کتاب
          </span>
          <span>
            <CircleHelp size={12} /> {fas(counts.questions)} پرسش
          </span>
          <span>
            <ScrollText size={12} /> {fas(counts.summary)} نکتهٔ خلاصه
          </span>
        </div>

        <div className="rdx__tabs">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button key={t.key} className="rdx__tab" data-on={tab === t.key} onClick={() => setTab(t.key)}>
                <Icon size={13} /> {t.label}
              </button>
            )
          })}
          <button className="rdx__tab rdx__tab--ghost" onClick={() => navigate(`bank/${n}`)}>
            <ListChecks size={13} /> بانک پرسش این درس
          </button>
        </div>
      </header>

      {tab === 'text' && (
        <article className="rdx__doc">
          {!book && <div className="rdx__loading">در حال آوردن متن درس…</div>}
          {book?.blocks.map((b, i) => {
            if (b.t === 'ans' && !answerShown) return null
            return <Block key={i} b={b} />
          })}
          {(book?.blocks ?? []).some((b) => b.t === 'ans') && (
            <button className="rdx__reveal" onClick={() => setAnswerShown((v) => !v)}>
              {answerShown ? <X size={13} /> : <Download size={13} />}
              {answerShown ? 'پنهان‌کردن پاسخ‌ها' : 'نمایش پاسخ‌های کتاب'}
            </button>
          )}
          {book && (
            <footer className="rdx__docEnd">
              <span>پایان درس {fas(n)}</span>
              <div className="rdx__docNav">
                <button disabled={n <= 1} onClick={() => navigate(`book/${n - 1}`)}>
                  درس پیش
                </button>
                <button disabled={n >= 16} onClick={() => navigate(`book/${n + 1}`)}>
                  درس پس
                </button>
              </div>
            </footer>
          )}
        </article>
      )}

      {tab === 'line' && (
        <section className="rdx__lines">
          <div className="rdx__lineHead">
            <div>
              <h2>مرور خط‌به‌خط کتاب</h2>
              <p>
                {fas(lessonLines.length)} جملهٔ کلیدی کتاب؛ همان‌هایی که در امتحان به‌صورت «درست / نادرست» می‌آیند. تصمیم
                بگیر، بعد پاسخ و دلیلِ کتاب را ببین.
              </p>
            </div>
            <div className="rdx__score">
              <span className="rdx__scoreNum">{fas(correct)}</span>
              <span className="rdx__scoreOf">از {fas(answered)}</span>
            </div>
          </div>

          <label className="rdx__filter">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
            فقط جمله‌هایی که اشتباه زدم
          </label>

          {shownLines.length === 0 && <div className="rdx__loading">چیزی برای مرور نمانده — خوب است.</div>}

          <div className="rdx__lineList">
            {shownLines.map((l) => {
              const key = `${l.lesson}-${l.n}`
              const pick = review[key]
              const right = pick === (l.ok ? 'ok' : 'no')
              return (
                <div key={key} className="rdx__line" data-state={pick ?? 'none'} data-right={pick ? right : undefined}>
                  <div className="rdx__lineTop">
                    <span className="rdx__lineNo">{fas(l.n)}</span>
                    <p>{l.text}</p>
                  </div>
                  <div className="rdx__lineActions">
                    <button
                      className="rdx__pick"
                      data-ok
                      data-on={pick === 'ok'}
                      onClick={() => setReview((s) => ({ ...s, [key]: 'ok' }))}
                    >
                      <Check size={12} /> درست
                    </button>
                    <button
                      className="rdx__pick"
                      data-on={pick === 'no'}
                      onClick={() => setReview((s) => ({ ...s, [key]: 'no' }))}
                    >
                      <X size={12} /> نادرست
                    </button>
                    {pick && (
                      <span className="rdx__verdict">
                        {right ? 'آفرین' : 'اشتباه'} — پاسخ کتاب: <b>{l.ok ? 'درست' : 'نادرست'}</b>
                      </span>
                    )}
                  </div>
                  {pick && l.why && !right && <p className="rdx__why">{l.why}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'summary' && (
        <section className="rdx__sum">
          <div className="rdx__sumHead">
            <h2>خلاصهٔ نکات درس {fas(n)}</h2>
            <p>همان خلاصهٔ پایان کتاب؛ کوتاه، فشرده و شبِ امتحان.</p>
          </div>
          {(summary?.items ?? []).map((item, i) => (
            <div key={i} className={cn('rdx__sumItem', /^[۰-۹]+\./.test(item) && 'is-num')}>
              <span className="rdx__sumDot" aria-hidden />
              <p>{item}</p>
            </div>
          ))}
          {!summary && <div className="rdx__loading">در حال آوردن خلاصه…</div>}
        </section>
      )}
    </div>
  )
}
