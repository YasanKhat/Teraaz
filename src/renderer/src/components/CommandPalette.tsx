import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft, X } from 'lucide-react'
import { searchAll, type SearchHit } from '../lib/search'
import { normalizeFa } from '../lib/utils'

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

  const results = useMemo(() => (q.trim().length >= 2 ? searchAll(q, 10) : []), [q])

  useEffect(() => setActive(0), [q])

  const go = (hit: SearchHit) => {
    onNavigate(hit.route)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[active])
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
            placeholder="جست‌وجو در درس‌ها، چهره‌ها، رویدادها و واژه‌ها…"
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
          {q.trim().length >= 2 && results.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted">چیزی پیدا نشد. املای دیگری را امتحان کن.</div>
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
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface2 text-base">
                {hit.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{hit.title}</span>
                <span className="block truncate text-[0.7rem] text-muted">{hit.sub}</span>
              </span>
              <span className="tag shrink-0">{hit.type}</span>
              {i === active && <CornerDownLeft size={14} className="shrink-0 text-faint" />}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[0.68rem] text-faint">
          <span>جست‌وجوی سراسری تبار</span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-line px-1.5 py-0.5">{normalizeFa('↑↓') || '↑↓'}</kbd>
            برای حرکت
            <kbd className="rounded border border-line px-1.5 py-0.5">Enter</kbd>
            برای رفتن
          </span>
        </div>
      </div>
    </div>
  )
}
