import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft } from 'lucide-react'
import { timeline } from '../../data/timeline'
import { lessonById } from '../../data/lessons'
import { navigate } from '../../lib/router'
import { cn, fas } from '../../lib/utils'

export function TimelineStrip({ ids, title }: { ids: string[]; title?: string }) {
  const events = useMemo(
    () => ids.map((id) => timeline.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e),
    [ids]
  )
  const [active, setActive] = useState<string | null>(null)
  const open = events.find((e) => e.id === active)

  if (!events.length) return null

  return (
    <div className="timeline-strip">
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={14} className="text-gold" />
          <span className="text-[0.72rem] font-semibold text-muted">{title}</span>
          <span className="ms-auto text-[0.6rem] text-faint">{fas(events.length)} ایستگاه</span>
        </div>
      )}
      <div className="relative">
        <div className="absolute inset-x-0 top-[26px] h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {events.map((e, i) => (
            <button
              key={e.id}
              onClick={() => setActive(active === e.id ? null : e.id)}
              className={cn(
                'tm-card group shrink-0',
                active === e.id ? 'tm-card--active' : ''
              )}
            >
              <span className="tm-dot" data-active={active === e.id} />
              <span className="tm-year">{e.date}</span>
              <span className="tm-title">{e.title}</span>
              <span className="tm-place">{e.place ?? '—'}</span>
              <span className="sr-only">ایستگاه {i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-gold/25 bg-gold/5 p-3.5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="tag">{open.date}</span>
                <span className="tag">{open.cat}</span>
                {open.place && <span className="tag">{open.place}</span>}
              </div>
              <div className="text-[0.88rem] font-bold">{open.title}</div>
              <p className="mt-1 text-[0.78rem] leading-7 text-muted">{open.desc}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {open.lessons.map((l) => {
                  const lesson = lessonById(l)
                  if (!lesson) return null
                  return (
                    <button key={l} className="chip" onClick={() => navigate(`lesson/${l}`)}>
                      <ChevronLeft size={11} /> درس {fas(l)}: {lesson.title}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
