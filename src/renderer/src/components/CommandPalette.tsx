import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Bookmark, Clock3, CornerDownLeft, HelpCircle, Landmark, Search, User, X } from 'lucide-react'
import type { HitIcon } from '../lib/search'

const HIT = {
  lesson: BookOpen,
  term: Bookmark,
  figure: User,
  event: Clock3,
  question: HelpCircle,
  chapter: Landmark
} as const

function HitGlyph({ icon }: { icon: HitIcon }) {
  const Icon = HIT[icon] ?? BookOpen
  return <Icon size={16} strokeWidth={1.7} />
}
import { searchAll, type SearchHit } from '../lib/search'
import { searchFilm, type FilmHit } from '../lib/filmSearch'
import { fas } from '../lib/utils'

export function CommandPalette({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const openHandler = () => setOpen(true)
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('tabar:open-search', openHandler as EventListener)
    window.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('tabar:open-search', openHandler as EventListener)
      window.removeEventListener('keydown', keyHandler)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40)
      setActive(0)
    } else {
      setQ('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const results = useMemo(() => (q.trim().length >= 2 ? searchAll(q, 10) : []), [q])
  const [bookHits, setBookHits] = useState<FilmHit[]>([])
  const [bookPending, setBookPending] = useState(false)

  useEffect(() => {
    let alive = true
    if (q.trim().length < 3) {
      setBookHits([])
      setBookPending(false)
      return
    }
    setBookPending(true)
    const t = window.setTimeout(() => {
      try {
        const h = searchFilm(q, 5)
        if (alive) {
          setBookHits(h)
          setBookPending(false)
        }
      } catch {
        if (alive) {
          setBookHits([])
          setBookPending(false)
        }
      }
    }, 140)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [q])

  const total = results.length + bookHits.length
  const activeKey = active

  useEffect(() => setActive(0), [q])

  const go = (hit: SearchHit) => {
    onNavigate(hit.route)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!total) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + total) % total)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeKey < results.length) go(results[activeKey])
      else {
        const hit = bookHits[activeKey - results.length]
        if (hit) {
          onNavigate(`lesson/${hit.lesson}?q=${encodeURIComponent(q.trim())}`)
          setOpen(false)
        }
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="panel anim-up relative w-full max-w-xl overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <Search size={18} className="text-gold" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="جست‌وجو در درس‌ها، واژه‌ها و متن فیلم…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
          />
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="بستن">
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {q.trim().length < 2 && (
            <div className="px-3 py-6 text-center text-sm leading-7 text-muted">
              نام یک درس، شخصیت یا رویداد را بنویس…
              <div className="mt-2 text-xs text-faint">مثلاً «چالدران» یا «نظامیه»</div>
            </div>
          )}
          {results.map((hit, i) => (
            <button
              key={`${hit.type}-${hit.title}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(hit)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition ${
                i === active ? 'bg-gold/10' : 'hover:bg-ink/5'
              }`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface2 text-faint">
                <HitGlyph icon={hit.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{hit.title}</span>
                <span className="block truncate text-[0.7rem] text-muted">{hit.sub}</span>
              </span>
              <span className="tag shrink-0">{hit.type}</span>
              {i === active && <CornerDownLeft size={14} className="shrink-0 text-faint" />}
            </button>
          ))}
          {bookHits.length > 0 && (
            <div className="mt-1 border-t border-line/70 px-3 pb-1 pt-2 text-[0.58rem] tracking-widest text-faint">
              در متن فیلم درس‌ها
            </div>
          )}
          {bookHits.map((hit, i) => {
            const idx = results.length + i
            return (
              <button
                key={`book-${hit.lesson}-${i}`}
                onMouseEnter={() => setActive(idx)}
                onClick={() => {
                  onNavigate(`lesson/${hit.lesson}?q=${encodeURIComponent(q.trim())}`)
                  setOpen(false)
                }}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-right transition ${
                  idx === active ? 'bg-gold/10' : 'hover:bg-ink/5'
                }`}
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-gold/25 bg-gold/8 text-[0.7rem] font-bold text-gold">
                  {fas(hit.lesson)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-[0.8rem] leading-6 text-ink/90">{hit.snippet}</span>
                  <span className="block text-[0.62rem] text-faint">درس {fas(hit.lesson)} · {hit.lessonTitle}</span>
                </span>
                {idx === active && <CornerDownLeft size={14} className="mt-1 shrink-0 text-faint" />}
              </button>
            )
          })}
          {q.trim().length >= 2 && total === 0 && !bookPending && (
            <div className="px-3 py-8 text-center text-sm text-muted">چیزی پیدا نشد. املای دیگری را امتحان کن.</div>
          )}
          {q.trim().length >= 2 && total === 0 && bookPending && (
            <div className="px-3 py-8 text-center text-sm text-muted">در حال جست‌وجو در فیلم…</div>
          )}
          
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[0.68rem] text-faint">
          <span>جست‌وجوی سراسری تبار</span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-line px-1.5 py-0.5">↑↓</kbd>
            برای حرکت
            <kbd className="rounded border border-line px-1.5 py-0.5">Enter</kbd>
            برای رفتن
          </span>
        </div>
      </div>
    </div>
  )
}
