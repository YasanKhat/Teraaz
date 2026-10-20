import { useState } from 'react'
import { Compass, Users } from 'lucide-react'
import { TimelineView } from '../components/TimelineView'
import { FiguresGallery } from '../components/FiguresGallery'
import { cn, fas } from '../lib/utils'
import { figures } from '../data/figures'
import { timeline as timelineAll } from '../data/timeline'

type Tab = 'timeline' | 'figures'

export function Archive({ tab }: { tab?: string }) {
  const initial: Tab = tab === 'figures' ? 'figures' : 'timeline'
  const [active, setActive] = useState<Tab>(initial)

  const tabs: { id: Tab; label: string; icon: typeof Compass; count: number }[] = [
    { id: 'timeline', label: 'خط زمان', icon: Compass, count: timelineAll.length },
    { id: 'figures', label: 'چهره‌ها', icon: Users, count: figures.length }
  ]

  return (
    <div className="space-y-5">
      <header>
        <div className="kicker mb-1.5">آرشیو</div>
        <h1 className="text-2xl font-black md:text-[1.8rem]">
          تاریخ را <span className="gold-text">مرور کن</span>
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.84rem] leading-8 text-muted">
          خط زمانی که رویدادها را به هم می‌دوزد و چهره‌هایی که پشت رویدادها ایستاده‌اند. نقشه‌ها جای خودشان را در دلِ فیلمِ هر درس دارند.
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
    </div>
  )
}
