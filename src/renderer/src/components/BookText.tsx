import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronDown, Loader2, Printer } from 'lucide-react'
import { cn, fas } from '../lib/utils'

type Kind = 'h' | 'p' | 'note' | 'chart' | 'table' | 'ex' | 'q' | 'ans'
interface Block {
  t: Kind
  text: string
}
interface BookLesson {
  id: number
  blocks: Block[]
}

type Cache = Record<number, BookLesson>

const cache: Cache = {}

function useBookLesson(id: number) {
  const [data, setData] = useState<BookLesson | null>(cache[id] ?? null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (cache[id]) {
      setData(cache[id])
      return
    }
    let alive = true
    setData(null)
    import('../data/book/full.json')
      .then((mod) => {
        const list = (mod.default ?? mod) as unknown as BookLesson[]
        list.forEach((l) => (cache[l.id] = l))
        if (alive) setData(cache[id] ?? null)
      })
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

function ChartBlock({ text, accent }: { text: string; accent?: string }) {
  const parts = splitArrows(text)
  if (!parts) return <p className="lesson-prose">{text}</p>
  const [lead, ...rest] = parts
  return (
    <div className="rounded-xl border border-line/80 bg-surface/30 px-3.5 py-3">
      <div className="mb-1.5 flex items-start gap-2 text-[0.86rem] font-bold">
        <span className="mt-2 size-1.5 shrink-0 rotate-45 rounded-[1px]" style={{ background: accent ?? 'var(--c-gold)' }} />
        <span>{lead}</span>
      </div>
      <ul className="space-y-1 ps-4">
        {rest.map((r, i) => (
          <li key={i} className="relative text-[0.8rem] leading-7 text-muted before:absolute before:-start-3 before:top-[0.85rem] before:h-px before:w-2 before:bg-line">
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BookText({ lessonId, title, accent }: { lessonId: number; title: string; accent?: string }) {
  const { data, failed } = useBookLesson(lessonId)
  const [openToc, setOpenToc] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

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

      <article className="space-y-3.5" aria-label={`متن کامل ${title}`}>
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
                  {b.text}
                </h3>
              )
            case 'note':
              return (
                <div key={key} className="rounded-lg border border-gold/25 bg-gold/[0.045] px-3.5 py-2.5 text-[0.8rem] leading-8 text-muted">
                  <span className="me-1 font-bold text-gold">نکته:</span>
                  {b.text}
                </div>
              )
            case 'chart':
              return <ChartBlock key={key} text={b.text} accent={accent} />
            case 'table':
              return (
                <p key={key} className="rounded-lg border border-line bg-surface/25 px-3.5 py-2.5 text-[0.82rem] leading-8 text-muted">
                  {b.text}
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
                  {b.text}
                </p>
              )
            case 'ans':
              return (
                <details key={key} className="rounded-lg border border-line/70 px-3 py-1.5">
                  <summary className="cursor-pointer list-none text-[0.68rem] text-gold/85">پاسخ</summary>
                  <p className="mt-1 text-[0.78rem] leading-7 text-muted">{b.text.replace(/^پاسخ\s*[:：]\s*/, '')}</p>
                </details>
              )
            default: {
              if (/->|<-/.test(b.text)) return <ChartBlock key={key} text={b.text} accent={accent} />
              const m = b.text.match(/^([^:：]{2,44}):\s*(.+)$/s)
              if (m && !m[1].includes('->')) {
                return (
                  <p key={key} className="lesson-prose">
                    <span className="font-bold text-ink/90">{m[1]}: </span>
                    {m[2]}
                  </p>
                )
              }
              return (
                <p key={key} className="lesson-prose">
                  {b.text}
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
