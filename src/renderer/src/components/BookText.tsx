import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronDown, Loader2, Printer } from 'lucide-react'
import { cn, fas, normalizeFa } from '../lib/utils'
import { bookLesson, loadBook } from '../lib/book'

type Kind = 'h' | 'p' | 'note' | 'chart' | 'table' | 'ex' | 'q' | 'ans'
interface Block {
  t: Kind
  text: string
}
interface BookLesson {
  id: number
  blocks: Block[]
}

function useBookLesson(id: number) {
  const [data, setData] = useState<BookLesson | null>(bookLesson(id) ?? null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const ready = bookLesson(id)
    if (ready) {
      setData(ready)
      return
    }
    let alive = true
    setData(null)
    loadBook()
      .then(() => alive && setData(bookLesson(id) ?? null))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [id])

  return { data, failed }
}

function splitArrows(text: string) {
  const parts = text.replace(/\s*<-\s*/g, ' -> ').split(/\s*->\s*/).map((s) => s.trim()).filter(Boolean)
  return parts.length > 1 ? parts : null
}

function ChartBlock({ text, accent, query = '' }: { text: string; accent?: string; query?: string }) {
  const parts = splitArrows(text)
  if (!parts) return <p className="lesson-prose">{highlight(text, query)}</p>
  const [lead, ...rest] = parts
  return (
    <div className="book-chart rounded-xl border border-line/80 bg-surface/30 px-3.5 py-3">
      <div className="mb-1.5 flex items-start gap-2 text-[0.86rem] font-bold">
        <span className="mt-2 size-1.5 shrink-0 rotate-45 rounded-[1px]" style={{ background: accent ?? 'var(--c-gold)' }} />
        <span>{highlight(lead, query)}</span>
      </div>
      <ul className="space-y-1 ps-4">
        {rest.map((r, i) => (
          <li key={i} className="relative text-[0.8rem] leading-7 text-muted before:absolute before:-start-3 before:top-[0.85rem] before:h-px before:w-2 before:bg-line">
            {highlight(r, query)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function highlight(text: string, needle: string) {
  const q = needle.trim()
  if (q.length < 2) return text
  const target = normalizeFa(q)
  // نگاشت نویسه‌های متن اصلی به متن نرمال‌شده تا نشانه‌گذاری درست بنشیند
  let normalized = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const n = normalizeFa(text[i])
    for (let k = 0; k < n.length; k++) {
      normalized += n[k]
      map.push(i)
    }
  }
  const at = normalized.indexOf(target)
  if (at === -1) return text
  const start = map[at]
  const last = map[Math.min(at + target.length - 1, map.length - 1)]
  const end = last + 1
  return (
    <>
      {text.slice(0, start)}
      <mark data-bookhit className="rounded bg-gold/25 px-0.5 text-ink">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  )
}

export function BookText({
  lessonId,
  title,
  accent,
  query = '',
  resume,
  onRead
}: {
  lessonId: number
  title: string
  accent?: string
  query?: string
  resume?: number
  onRead?: (fraction: number) => void
}) {
  const { data, failed } = useBookLesson(lessonId)
  const [openToc, setOpenToc] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
  const bodyRef = useRef<HTMLElement | null>(null)

  // ادامهٔ خواندن از همان‌جایی که رها کرده بودی
  useEffect(() => {
    if (!data || query || !resume || resume <= 0.02) return
    const t = window.setTimeout(() => {
      const el = bodyRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      const room = el.offsetHeight - window.innerHeight
      if (room <= 0) return
      window.scrollTo({ top: top + room * resume, behavior: 'instant' as ScrollBehavior })
    }, 340)
    return () => window.clearTimeout(t)
  }, [data, resume, query, lessonId])

  // ثبت پیشرفت خواندن از روی جای اسکرول
  useEffect(() => {
    if (!onRead || !data) return
    let raf = 0
    const calc = () => {
      const el = bodyRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      const room = el.offsetHeight - window.innerHeight
      if (room <= 0) return
      const f = (window.scrollY - top) / room
      onRead(Math.min(1, Math.max(0, f)))
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(calc)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [onRead, data])

  const headings = useMemo(() => {
    if (!data) return []
    return data.blocks
      .map((b, i) => ({ ...b, i }))
      .filter((b) => b.t === 'h')
      .map((b) => ({ i: b.i, text: b.text }))
  }, [data])

  const stats = useMemo(() => {
    if (!data) return { chars: 0, words: 0 }
    const chars = data.blocks.reduce((n, b) => n + (b.t === 'note' || b.t === 'ans' ? 0 : b.text.length), 0)
    return { chars, words: Math.round(chars / 5.4) }
  }, [data])

  if (failed) {
    return <p className="rounded-xl border border-rose/30 bg-rose/5 p-4 text-[0.8rem] text-rose">متن کامل کتاب در این نسخه بارگذاری نشد.</p>
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[0.8rem] text-faint">
        <Loader2 size={15} className="animate-spin" /> در حال آوردن متن کامل کتاب…
      </div>
    )
  }

  return (
    <div>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/30 px-3.5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[0.66rem] text-gold">
            <BookOpen size={13} /> متن کامل کتاب
          </span>
          <span className="text-[0.6rem] text-faint">
            {fas(headings.length)} بخش · {fas(stats.words)} واژه · حدود {fas(Math.max(1, Math.round(stats.words / 180)))} دقیقه
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[0.6rem] text-muted hover:border-gold/40 hover:text-gold" onClick={() => setOpenToc((v) => !v)}>
            فهرست درس <ChevronDown size={11} className={cn('transition', openToc && 'rotate-180')} />
          </button>
          <button className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[0.6rem] text-muted hover:border-gold/40 hover:text-gold" onClick={() => window.print()}>
            <Printer size={11} /> چاپ
          </button>
        </div>
      </div>

      {openToc && (
        <ol className="no-print mb-6 columns-1 gap-6 rounded-xl border border-line bg-surface/20 px-4 py-3 text-[0.72rem] sm:columns-2">
          {headings.map((h, n) => (
            <li key={h.i} className="mb-1.5 break-inside-avoid">
              <button
                className="flex w-full items-start gap-2 text-start leading-6 text-muted hover:text-gold"
                onClick={() => document.getElementById(`bk-${lessonId}-${h.i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <span className="shrink-0 tabular-nums text-gold/70">{fas(n + 1)}</span>
                <span className="min-w-0">{h.text}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      <article ref={bodyRef} className="space-y-3.5" aria-label={`متن کامل ${title}`}>
        {data.blocks.map((b, i) => {
          const key = i
          switch (b.t) {
            case 'h':
              return (
                <h3
                  key={key}
                  id={`bk-${lessonId}-${i}`}
                  className="scroll-mt-32 border-t border-line/60 pt-5 text-[1.02rem] font-black leading-8 text-ink first:border-t-0 first:pt-0"
                >
                  {highlight(b.text, query)}
                </h3>
              )
            case 'note':
              return (
                <div key={key} className="rounded-lg border border-gold/25 bg-gold/[0.045] px-3.5 py-2.5 text-[0.8rem] leading-8 text-muted">
                  <span className="me-1 font-bold text-gold">نکته:</span>
                  {highlight(b.text, query)}
                </div>
              )
            case 'chart':
              return <ChartBlock key={key} text={b.text} accent={accent} query={query} />
            case 'table':
              return (
                <p key={key} className="rounded-lg border border-line bg-surface/25 px-3.5 py-2.5 text-[0.82rem] leading-8 text-muted">
                  {highlight(b.text, query)}
                </p>
              )
            case 'ex':
              return (
                <div key={key} className="rounded-lg border border-turq/25 bg-turq/[0.04] px-3.5 py-2">
                  <span className="text-[0.68rem] font-bold text-turq">تمرین کتاب</span>
                </div>
              )
            case 'q':
              return (
                <p key={key} className="ps-1 text-[0.82rem] leading-8 text-muted">
                  {highlight(b.text, query)}
                </p>
              )
            case 'ans':
              return (
                <details key={key} className="rounded-lg border border-line/70 px-3 py-1.5">
                  <summary className="cursor-pointer list-none text-[0.68rem] text-gold/85">پاسخ</summary>
                  <p className="mt-1 text-[0.78rem] leading-7 text-muted">{highlight(b.text.replace(/^پاسخ\s*[:：]\s*/, ''), query)}</p>
                </details>
              )
            default: {
              if (/->|<-/.test(b.text)) return <ChartBlock key={key} text={b.text} accent={accent} query={query} />
              const m = b.text.match(/^([^:：]{2,44}):\s*(.+)$/s)
              if (m && !m[1].includes('->')) {
                return (
                  <p key={key} className="lesson-prose">
                    <span className="font-bold text-ink/90">{m[1]}: </span>
                    {highlight(m[2], query)}
                  </p>
                )
              }
              return (
                <p key={key} className="lesson-prose">
                  {highlight(b.text, query)}
                </p>
              )
            }
          }
        })}
      </article>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-3 text-[0.6rem] text-faint">
        <span>پایان متن کامل درس</span>
        <button className="no-print text-gold hover:underline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          بازگشت به بالای درس ↑
        </button>
      </div>
    </div>
  )
}
