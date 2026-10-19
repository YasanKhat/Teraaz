import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ArrowLeft, MapPin, X, Clock3 } from 'lucide-react'
import { eras, timeline, eraById } from '../data/timeline'
import type { TimelineEvent } from '../data/types'
import { lessonById } from '../data/lessons'
import { navigate } from '../lib/router'
import { fas, normalizeFa } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { Modal } from './ui'

const cats = ['همه', 'سیاسی', 'نظامی', 'مذهبی', 'علمی', 'فرهنگی', 'اقتصادی'] as const

export function TimelineView() {
  const [eraFilter, setEraFilter] = useState<string>('all')
  const [cat, setCat] = useState<string>('همه')
  const [q, setQ] = useState('')
  const [openEvent, setOpenEvent] = useState<TimelineEvent | null>(null)
  const eraRefs = useRef<Record<string, HTMLElement | null>>({})
  const visit = useProgress((s) => s.visit)

  useEffect(() => {
    visit('timeline')
  }, [visit])

  const filtered = useMemo(() => {
    const nq = normalizeFa(q)
    return timeline.filter((e) => {
      if (eraFilter !== 'all' && e.era !== eraFilter) return false
      if (cat !== 'همه' && e.cat !== cat) return false
      if (nq.length >= 2 && !normalizeFa(`${e.title} ${e.desc} ${e.date} ${e.place ?? ''}`).includes(nq)) return false
      return true
    })
  }, [eraFilter, cat, q])

  const grouped = eras
    .map((era) => ({ era, events: filtered.filter((e) => e.era === era.id).sort((a, b) => a.year - b.year) }))
    .filter((g) => g.events.length)

  const scrollToEra = (id: string) => {
    setEraFilter(id)
    setTimeout(() => eraRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="kicker mb-1">نقشهٔ زمانی</div>
            <h2 className="text-lg font-bold">۱۴۰۰ سال در یک نگاه</h2>
          </div>
          <span className="chip cursor-default">
            <Clock3 size={13} /> {fas(filtered.length)} رویداد
          </span>
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <button className="chip shrink-0" data-active={eraFilter === 'all'} onClick={() => setEraFilter('all')}>
            همهٔ دوره‌ها
          </button>
          {eras.map((era) => (
            <button
              key={era.id}
              onClick={() => scrollToEra(era.id)}
              className="chip shrink-0"
              data-active={eraFilter === era.id}
              title={era.note}
            >
              <span className="size-2 rounded-full" style={{ background: era.color }} />
              {era.title}
              <span className="text-[0.6rem] opacity-60">{fas(era.from)}–{fas(era.to)}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="searchbox flex min-w-[220px] flex-1 items-center gap-2 px-3 py-2">
            <Search size={14} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جست‌وجو در رویدادها…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-faint"
            />
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {cats.map((c) => (
              <button key={c} className="chip shrink-0" data-active={cat === c} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="surface px-6 py-14 text-center text-sm text-muted">رویدادی با این فیلترها پیدا نشد.</div>
      )}

      <div className="space-y-8">
        {grouped.map(({ era, events }) => (
          <section
            key={era.id}
            ref={(el) => {
              eraRefs.current[era.id] = el
            }}
            className="scroll-mt-24"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="size-2.5 rounded-full" style={{ background: era.color }} />
              <h3 className="text-base font-bold">{era.title}</h3>
              <span className="text-[0.68rem] text-faint">
                {fas(era.from)} – {fas(era.to)} م
              </span>
              <span className="hidden flex-1 text-[0.7rem] text-muted sm:block">{era.note}</span>
            </div>

            <div className="relative pr-5">
              <div
                className="absolute inset-y-0 right-[7px] w-px"
                style={{ background: `linear-gradient(180deg, ${era.color}55, ${era.color}11)` }}
              />
              <div className="space-y-2.5">
                {events.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setOpenEvent(e)}
                    className="group relative block w-full text-right"
                  >
                    <span
                      className="absolute -right-[19px] top-5 size-[9px] rounded-full border-2 transition group-hover:scale-125"
                      style={{ borderColor: era.color, background: 'var(--c-bg)' }}
                    />
                    <div className="card-hover rounded-xl border border-line bg-surface/65 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-[0.66rem] text-faint">
                        <span className="font-bold" style={{ color: era.color }}>
                          {e.date}
                        </span>
                        <span>·</span>
                        <span>{e.title}</span>
                        <span className="flex-1" />
                        <span className="tag">{e.cat}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[0.8rem] leading-6 text-muted">{e.desc}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[0.62rem] text-faint">
                        {e.place && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {e.place}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          درس {e.lessons.map((l) => fas(l)).join('، ')}
                        </span>
                        <span className="flex flex-1 justify-end items-center gap-1 text-gold opacity-0 transition group-hover:opacity-100">
                          جزئیات <ArrowLeft size={11} />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <Modal open={!!openEvent} onClose={() => setOpenEvent(null)} title={openEvent?.title}>
        {openEvent && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag" style={{ color: eraById(openEvent.era).color, borderColor: `${eraById(openEvent.era).color}55` }}>
                {eraById(openEvent.era).title}
              </span>
              <span className="tag">{openEvent.date}</span>
              <span className="tag">{openEvent.cat}</span>
              {openEvent.place && (
                <span className="tag">
                  <MapPin size={11} /> {openEvent.place}
                </span>
              )}
            </div>
            <p className="prose-fa text-sm leading-8">{openEvent.desc}</p>
            <div>
              <div className="kicker mb-2">درس‌های مرتبط</div>
              <div className="flex flex-wrap gap-2">
                {openEvent.lessons.map((l) => {
                  const lesson = lessonById(l)
                  if (!lesson) return null
                  return (
                    <button
                      key={l}
                      className="chip"
                      onClick={() => {
                        setOpenEvent(null)
                        navigate(`lesson/${l}`)
                      }}
                    >
                      درس {fas(l)}: {lesson.title}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setOpenEvent(null)}>
                <X size={14} /> بستن
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
