import { type ReactNode, useEffect } from 'react'
import { cn } from '../lib/utils'
import { X } from 'lucide-react'

export function SectionHead({
  kicker,
  title,
  desc,
  action,
  className
}: {
  kicker?: string
  title: ReactNode
  desc?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {kicker && <div className="kicker mb-2">{kicker}</div>}
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        {desc && <p className="mt-1.5 max-w-2xl text-sm leading-7 text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export function ProgressRing({
  value,
  size = 132,
  stroke = 8,
  children,
  color = 'var(--c-gold)'
}: {
  value: number
  size?: number
  stroke?: number
  children?: ReactNode
  color?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ring-progress -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  children,
  title,
  wide
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'panel anim-up relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl sm:rounded-3xl',
          wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg/80 px-5 py-3.5 backdrop-blur-xl">
          <div className="min-w-0 font-bold">{title}</div>
          <button onClick={onClose} className="btn btn-ghost btn-sm shrink-0" aria-label="بستن">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Stat({
  icon,
  label,
  value,
  hint,
  accent = 'var(--c-gold)'
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: string
  accent?: string
}) {
  return (
    <div className="surface flex items-center gap-3.5 p-4">
      <div
        className="grid size-11 shrink-0 place-items-center rounded-xl border"
        style={{
          color: accent,
          borderColor: `color-mix(in oklab, ${accent} 30%, var(--c-line))`,
          background: `color-mix(in oklab, ${accent} 10%, transparent)`
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[0.7rem] text-faint">{label}</div>
        <div className="mt-0.5 truncate text-lg font-bold leading-tight">{value}</div>
        {hint && <div className="mt-0.5 truncate text-[0.68rem] text-muted">{hint}</div>}
      </div>
    </div>
  )
}

export function Bar({ value, color = 'var(--c-gold)', height = 6 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-line" style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}

export function Empty({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 grid size-12 place-items-center rounded-2xl border border-line bg-surface2 text-gold">{icon}</div>
      <div className="font-bold">{title}</div>
      {desc && <p className="max-w-md text-sm leading-7 text-muted">{desc}</p>}
      {action}
    </div>
  )
}

export function StarMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="sm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--c-gold2)" />
          <stop offset="1" stopColor="var(--c-gold)" />
        </linearGradient>
      </defs>
      <path
        d="M32 3l6.4 16.2L55 22.4 42.8 34.2 46 51l-14-7.6L18 51l3.2-16.8L9 22.4l16.6-3.2z"
        fill="none"
        stroke="url(#sm-g)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="5.4" fill="none" stroke="url(#sm-g)" strokeWidth="1.3" />
      <circle cx="32" cy="32" r="1.6" fill="var(--c-gold)" />
    </svg>
  )
}

export function Astrolabe({ size = 260, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} className={className} aria-hidden>
      <g fill="none" stroke="var(--c-gold)" strokeOpacity="0.45">
        <circle cx="120" cy="120" r="112" strokeWidth="0.8" />
        <circle cx="120" cy="120" r="92" strokeWidth="0.6" strokeDasharray="2 5" />
        <circle cx="120" cy="120" r="70" strokeWidth="0.9" />
        <circle cx="120" cy="120" r="38" strokeWidth="0.6" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6
          return (
            <line
              key={i}
              x1={120 + 38 * Math.cos(a)}
              y1={120 + 38 * Math.sin(a)}
              x2={120 + 112 * Math.cos(a)}
              y2={120 + 112 * Math.sin(a)}
              strokeWidth="0.5"
              strokeOpacity="0.35"
            />
          )
        })}
        <path d="M120 8l16 24 28 2-15 24 15 24-28 2-16 24-16-24-28-2 15-24-15-24 28-2z" strokeWidth="0.7" />
      </g>
    </svg>
  )
}

export function ChapterMotif({ motif, className }: { motif: string; className?: string }) {
  if (motif === 'compass') {
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="44" strokeOpacity=".35" />
        <circle cx="60" cy="60" r="30" strokeOpacity=".2" strokeDasharray="2 4" />
        <path d="M60 20l12 34-12 46-12-46z" strokeOpacity=".55" strokeWidth="1" />
        <path d="M20 60h80M60 20v80" strokeOpacity=".2" />
      </svg>
    )
  }
  if (motif === 'bazaar') {
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none" stroke="currentColor">
        <path d="M18 96V52c0-14 12-26 26-26h32c14 0 26 12 26 26v44" strokeOpacity=".35" />
        <path d="M30 96V54c0-9 8-17 18-17h24c10 0 18 8 18 17v42" strokeOpacity=".2" />
        <path d="M44 96V64h32v32M18 96h84" strokeOpacity=".45" />
        <circle cx="60" cy="38" r="5" strokeOpacity=".5" />
      </svg>
    )
  }
  if (motif === 'mihrab') {
    return (
      <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none" stroke="currentColor">
        <path d="M60 18c18 0 30 14 30 32v50H30V50c0-18 12-32 30-32z" strokeOpacity=".4" />
        <path d="M60 30c12 0 20 10 20 22v38H40V52c0-12 8-22 20-22z" strokeOpacity=".22" />
        <path d="M60 44v36M46 62h28" strokeOpacity=".45" />
        <circle cx="60" cy="62" r="8" strokeOpacity=".3" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle cx="60" cy="60" r="36" strokeOpacity=".4" />
      <circle cx="60" cy="60" r="26" strokeOpacity=".2" strokeDasharray="2 4" />
      <path d="M60 20v80M20 60h80" strokeOpacity=".2" />
      <circle cx="60" cy="60" r="5" strokeOpacity=".6" />
      <path d="M60 30l10 20-10 20-10-20z" strokeOpacity=".45" />
    </svg>
  )
}
