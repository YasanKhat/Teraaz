import { useMemo } from 'react'
import { Clock3, MapPin } from 'lucide-react'
import { timeline } from '../data/timeline'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'

/**
 * سالشمار یک پرده: گره‌های مهم همهٔ درس‌های آن پرده، به ترتیب زمان.
 * جای «فهرست تاریخ‌ها» را می‌گیرد و به درسِ هر رویداد پیوند دارد.
 */
export function ChapterTimeline({
  lessons,
  accent = '#C9A227',
  compact = false
}: {
  lessons: number[]
  accent?: string
  compact?: boolean
}) {
  const events = useMemo(
    () =>
      timeline
        .filter((e) => e.lessons.some((id) => lessons.includes(id)))
        .sort((a, b) => a.year - b.year),
    [lessons]
  )

  if (events.length < 3) return null

  return (
    <div className="ct">
      <div className="ct__head">
        <Clock3 size={13} style={{ color: accent }} />
        <span className="ct__title">سالشمار این پرده</span>
        <span className="ct__count">{fas(events.length)} گره</span>
      </div>

      <ol className={cn('ct__list', compact && 'is-compact')}>
        {events.map((e) => (
          <li key={e.id} className="ct__row">
            <span className="ct__date" style={{ color: accent }}>{e.date}</span>
            <span className="ct__dot" style={{ background: accent }} aria-hidden />
            <button
              className="ct__body"
              onClick={() => navigate(`lesson/${e.lessons[0]}`)}
              title={`درس ${fas(e.lessons[0])}`}
            >
              <span className="ct__name">{e.title}</span>
              {!compact && <span className="ct__desc">{e.desc}</span>}
            </button>
            {e.place && !compact && (
              <span className="ct__place">
                <MapPin size={9} /> {e.place}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
