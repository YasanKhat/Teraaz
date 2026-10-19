import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, MapPin, Search, SearchX, Sparkles } from 'lucide-react'
import { figures, figureTypes } from '../data/figures'
import { lessonById } from '../data/lessons'
import { useProgress } from '../store/useProgress'
import { navigate } from '../lib/router'
import { cn, fas, normalizeFa } from '../lib/utils'
import { Empty, Modal } from './ui'

export function FiguresGallery() {
  const [type, setType] = useState<string>('همه')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const visit = useProgress((s) => s.visit)
  const markQuest = useProgress((s) => s.markQuest)
  const bookmarks = useProgress((s) => s.bookmarks)
  const toggleBookmark = useProgress((s) => s.toggleBookmark)

  useEffect(() => {
    visit('figures')
  }, [visit])

  const list = useMemo(() => {
    const needle = normalizeFa(q.trim())
    return figures.filter((f) => {
      const okType = type === 'همه' || f.type === type
      if (!okType) return false
      if (!needle) return true
      return normalizeFa(`${f.name} ${f.title} ${f.place} ${f.bio}`).includes(needle)
    })
  }, [type, q])

  const active = figures.find((f) => f.id === open)

  const counts = useMemo(() => {
    const m: Record<string, number> = { همه: figures.length }
    for (const f of figures) m[f.type] = (m[f.type] ?? 0) + 1
    return m
  }, [])

  return (
    <div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2">
          <Search size={15} className="text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی نام، شهر یا نقش…"
            className="w-full bg-transparent text-[0.82rem] outline-none placeholder:text-faint"
          />
        </div>
        <div className="no-scrollbar flex flex-wrap gap-1.5">
          {figureTypes.map((t) => (
            <button key={t} className="chip shrink-0" data-active={type === t} onClick={() => setType(t)}>
              {t} <span className="text-[0.6rem] text-faint">{fas(counts[t] ?? 0)}</span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={<SearchX size={26} />} title="چهره‌ای پیدا نشد" desc="عبارت دیگری را امتحان کن یا فیلتر را بردار." />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((f) => {
            const saved = bookmarks.includes(`figure-${f.id}`)
            return (
              <button
                key={f.id}
                onClick={() => {
                  setOpen(f.id)
                  markQuest('q-fact', 15)
                }}
                className="group card-hover relative overflow-hidden rounded-2xl border border-line bg-surface/55 p-4 text-right"
              >
                <div
                  className="pointer-events-none absolute -left-10 -top-12 size-28 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
                  style={{ background: f.accent }}
                />
                <div className="relative flex items-start gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl border text-base font-black"
                    style={{
                      color: f.accent,
                      borderColor: `color-mix(in oklab, ${f.accent} 40%, transparent)`,
                      background: `color-mix(in oklab, ${f.accent} 12%, transparent)`
                    }}
                  >
                    {f.name.replace(/^(حضرت |امام |خواجه |شیخ |ابن |ابو )/, '').slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[0.88rem] font-bold">{f.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[0.68rem] leading-5 text-muted">{f.title}</div>
                  </div>
                </div>
                <div className="relative mt-3 flex flex-wrap items-center gap-1.5 text-[0.6rem] text-faint">
                  <span className="tag" style={{ color: f.accent, borderColor: `color-mix(in oklab, ${f.accent} 35%, transparent)` }}>{f.type}</span>
                  {f.place && <span className="flex items-center gap-0.5"><MapPin size={10} /> {f.place.split('،')[0]}</span>}
                  {saved && <span className="text-gold">· نشان‌شده</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Modal open={!!active} onClose={() => setOpen(null)} title={active?.name}>
        {active && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="tag" style={{ color: active.accent, borderColor: `color-mix(in oklab, ${active.accent} 40%, transparent)` }}>{active.type}</span>
              <span className="tag">{active.span}</span>
              {active.place && <span className="tag"><MapPin size={11} /> {active.place}</span>}
            </div>
            <p className="text-[0.95rem] leading-9 text-muted">{active.bio}</p>
            {active.works.length > 0 && (
              <div>
                <div className="kicker mb-2">کارها و دستاوردها</div>
                <div className="flex flex-wrap gap-1.5">
                  {active.works.map((w) => (
                    <span key={w} className="chip cursor-default">{w}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="note-box">
              <div className="mb-1 flex items-center gap-1.5 text-[0.78rem] font-bold"><Sparkles size={13} className="text-gold" /> نکتهٔ امتحانی</div>
              <p className="text-[0.84rem] leading-7 text-muted">{active.note}</p>
            </div>
            <div>
              <div className="kicker mb-2">در کدام درس‌ها؟</div>
              <div className="flex flex-wrap gap-1.5">
                {active.lessonIds.map((lid) => {
                  const l = lessonById(lid)
                  if (!l) return null
                  return (
                    <button
                      key={lid}
                      onClick={() => {
                        setOpen(null)
                        navigate(`lesson/${lid}`)
                      }}
                      className="chip"
                    >
                      <BookOpen size={12} /> درس {fas(lid)}: {l.title}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <button
                className={cn('btn btn-sm', bookmarks.includes(`figure-${active.id}`) ? 'btn-ghost text-gold' : '')}
                onClick={() => toggleBookmark(`figure-${active.id}`)}
              >
                {bookmarks.includes(`figure-${active.id}`) ? 'نشان‌شده' : 'نشان‌کردن'}
              </button>
              <button className="btn btn-gold btn-sm" onClick={() => { setOpen(null); navigate('figures') }}>
                بستن <ArrowLeft size={13} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
