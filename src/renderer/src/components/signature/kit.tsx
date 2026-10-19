import { type ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

/** صحنهٔ تجربه‌ای هر درس: کادر بزرگ با عنوان، توضیح و بدنهٔ تعاملی */
export function SignatureStage({
  kicker,
  title,
  hint,
  children,
  tone = 'gold'
}: {
  kicker: string
  title: string
  hint?: string
  children: ReactNode
  tone?: 'gold' | 'turq' | 'rose' | 'lapis'
}) {
  const ring = {
    gold: 'from-gold/25 via-gold/5',
    turq: 'from-turq/25 via-turq/5',
    rose: 'from-rose/25 via-rose/5',
    lapis: 'from-lapis/30 via-lapis/5'
  }[tone]
  return (
    <section className="sig">
      <div className={cn('sig__glow bg-gradient-to-l', ring)} />
      <header className="sig__head">
        <div>
          <div className="kicker mb-1">{kicker}</div>
          <h2 className="text-lg font-black leading-8 md:text-xl">{title}</h2>
          {hint && <p className="mt-1 max-w-2xl text-[0.74rem] leading-7 text-muted">{hint}</p>}
        </div>
        <span className="sig__seal" aria-hidden />
      </header>
      <div className="sig__body">{children}</div>
    </section>
  )
}

/** کارت کوچک قابل انتخاب */
export function PickCard({
  active,
  onClick,
  title,
  sub,
  badge,
  children,
  tone = 'gold'
}: {
  active?: boolean
  onClick?: () => void
  title: ReactNode
  sub?: ReactNode
  badge?: ReactNode
  children?: ReactNode
  tone?: 'gold' | 'turq' | 'rose' | 'lapis'
}) {
  return (
    <button
      onClick={onClick}
      data-on={!!active}
      data-tone={tone}
      className="sig-card text-start"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="sig-card__title">{title}</div>
          {sub && <div className="sig-card__sub">{sub}</div>}
        </div>
        {badge}
      </div>
      {children}
    </button>
  )
}

/** برچسب کوچک */
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'turq' | 'rose' }) {
  return <span className={cn('sig-tag', tone !== 'neutral' && `sig-tag--${tone}`)}>{children}</span>
}

/** ردیف بازشدنی (برای جزئیات) */
export function Fold({
  title,
  sub,
  children,
  open: openProp
}: {
  title: ReactNode
  sub?: ReactNode
  children: ReactNode
  open?: boolean
}) {
  const [open, setOpen] = useState(openProp ?? false)
  return (
    <div className="sig-fold" data-open={open}>
      <button className="sig-fold__head" onClick={() => setOpen((v) => !v)}>
        <span className="min-w-0 flex-1 text-start">
          <span className="block text-[0.82rem] font-bold">{title}</span>
          {sub && <span className="mt-0.5 block text-[0.66rem] text-faint">{sub}</span>}
        </span>
        <ChevronDown size={14} className={cn('shrink-0 text-faint transition', open && 'rotate-180')} />
      </button>
      {open && <div className="sig-fold__body">{children}</div>}
    </div>
  )
}
