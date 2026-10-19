import { useMemo, useState } from 'react'
import { ChevronDown, Compass, Map as MapIcon, Play, Users } from 'lucide-react'
import { TimelineView } from '../components/TimelineView'
import { FiguresGallery } from '../components/FiguresGallery'
import { HistoricMap } from '../components/HistoricMap'
import { allLessonPlans } from '../data/plans'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'

type Tab = 'maps' | 'timeline' | 'figures'

export function Archive({ tab }: { tab?: string }) {
  const initial: Tab = tab === 'timeline' ? 'timeline' : tab === 'figures' ? 'figures' : 'maps'
  const [active, setActive] = useState<Tab>(initial)
  const [openMap, setOpenMap] = useState<string | null>(null)

  const maps = useMemo(
    () =>
      allLessonPlans.flatMap((lp) =>
        lp.scenes.flatMap((s, si) =>
          (s.maps ?? []).map((m, i) => ({
            key: `${lp.lesson}-${si}-${i}`,
            spec: m.spec,
            lesson: lp.lesson
          }))
        )
      ),
    []
  )

  const tabs: { id: Tab; label: string; icon: typeof MapIcon; count: number }[] = [
    { id: 'maps', label: 'نقشه‌های تاریخی', icon: MapIcon, count: maps.length },
    { id: 'timeline', label: 'خط زمان', icon: Compass, count: 84 },
    { id: 'figures', label: 'چهره‌ها', icon: Users, count: 53 }
  ]

  return (
    <div className="space-y-5">
      <header>
        <div className="kicker mb-1.5">آرشیو تصویری</div>
        <h1 className="text-2xl font-black md:text-[1.8rem]">تاریخ را <span className="gold-text">ببین</span></h1>
        <p className="mt-1.5 max-w-2xl text-[0.84rem] leading-8 text-muted">
          نقشه‌هایی که فتح‌ها را گام‌به‌گام نشان می‌دهند، خط زمانی که رویدادها را به هم می‌دوزد و چهره‌هایی که پشت رویدادها ایستاده‌اند.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[0.76rem] transition',
                active === t.id ? 'border-gold/50 bg-gold/10 text-gold' : 'border-line bg-surface/50 text-muted hover:text-ink'
              )}
            >
              <Icon size={14} /> {t.label}
              <span className="rounded-md bg-bg/50 px-1 text-[0.58rem] text-faint">{fas(t.count)}</span>
            </button>
          )
        })}
      </div>

      {active === 'timeline' && <TimelineView />}

      {active === 'figures' && <FiguresGallery />}

      {active === 'maps' && (
        <div className="grid gap-3 md:grid-cols-2">
          {maps.map((m) => {
            const isOpen = openMap === m.key
            return (
              <div key={m.key} className={cn('rounded-2xl border border-line bg-surface/50 p-4', isOpen && 'md:col-span-2')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="kicker mb-0.5">{m.spec.kicker ?? 'نقشه'}</div>
                    <div className="text-[0.9rem] font-bold">{m.spec.title}</div>
                    <div className="mt-0.5 text-[0.62rem] text-faint">
                      {fas(m.spec.phases.length)} گام · درس {fas(m.lesson)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`lesson/${m.lesson}`)} title="رفتن به درس">
                      درس
                    </button>
                    <button className="btn btn-sm" onClick={() => setOpenMap(isOpen ? null : m.key)}>
                      {isOpen ? 'بستن' : <><Play size={12} /> دیدن</>}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-3">
                    <HistoricMap spec={m.spec} />
                  </div>
                )}
                {!isOpen && <div className="mt-3 flex items-center gap-2 text-[0.62rem] text-faint"><ChevronDown size={12} /> روی «دیدن» بزن تا نقشه گام‌به‌گام اجرا شود.</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
