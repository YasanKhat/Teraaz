import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  X,
  type LucideIcon
} from 'lucide-react'
import clsx from 'clsx'
import { groupDigits, latinDigits } from '../lib/digits'
import { fa, parseAmount } from '../lib/digits'
import { finishConfirm, useConfirm, useToasts } from '../store/ui'
import { LogoMark } from './Logo'

export { clsx }

/* ── Buttons ───────────────────────────────────────────────────────────── */
type ButtonVariant = 'default' | 'primary' | 'gold' | 'soft' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  block?: boolean
  loading?: boolean
}

export function Button({
  variant = 'default',
  size = 'md',
  icon: Icon,
  block,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={clsx(
        'btn',
        variant !== 'default' && `btn-${variant}`,
        size !== 'md' && `btn-${size}`,
        block && 'btn-block',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={size === 'sm' ? 14 : 16} /> : null}
      {children}
    </button>
  )
}

export function IconButton({
  icon: Icon,
  label,
  className,
  size = 17,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  label: string
  size?: number
}): React.JSX.Element {
  return (
    <button className={clsx('icon-btn', className)} aria-label={label} title={label} {...rest}>
      <Icon size={size} />
    </button>
  )
}

export function Spinner({ size = 15 }: { size?: number }): React.JSX.Element {
  return (
    <svg
      className="spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ── Surfaces & labels ─────────────────────────────────────────────────── */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={clsx('card', className)} {...rest}>
      {children}
    </div>
  )
}

export function Badge({
  tone = 'neutral',
  dot,
  children,
  className
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'gold' | 'accent'
  dot?: boolean
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <span className={clsx('badge', `badge-${tone}`, className)}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}): React.JSX.Element {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <div className="page-sub">{subtitle}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  )
}

export function SectionTitle({
  children,
  action
}: {
  children: ReactNode
  action?: ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      <div className="card-title">{children}</div>
      {action}
    </div>
  )
}

/* ── Form primitives ───────────────────────────────────────────────────── */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={clsx('field', className)}>
      {label ? (
        <label className="label">
          {label}
          {required ? <span className="req">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <div className="field-error">{error}</div> : hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  )
}

export function AmountInput({
  value,
  onChange,
  placeholder = '۰',
  suffix = 'تومان',
  autoFocus,
  disabled,
  id
}: {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  suffix?: string
  autoFocus?: boolean
  disabled?: boolean
  id?: string
}): React.JSX.Element {
  return (
    <div className="input-group">
      <input
        id={id}
        className="input amount-input"
        inputMode="numeric"
        dir="ltr"
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder={placeholder}
        value={value ? groupDigits(value) : ''}
        onChange={(event) => onChange(parseAmount(event.target.value))}
      />
      <span className="input-suffix">{suffix}</span>
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder = 'جست‌وجو…',
  className
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}): React.JSX.Element {
  return (
    <div className={clsx('input-group', className)} style={{ minWidth: 200 }}>
      <span
        style={{
          position: 'absolute',
          insetInlineStart: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--muted)',
          pointerEvents: 'none',
          display: 'grid'
        }}
      >
        <Search size={15} />
      </span>
      <input
        className="input"
        style={{ paddingInlineStart: 36 }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={clsx('switch', checked && 'on')}
      onClick={() => onChange(!checked)}
    />
  )
}

export function Progress({
  value,
  tone = 'accent',
  className
}: {
  value: number
  tone?: 'accent' | 'gold'
  className?: string
}): React.JSX.Element {
  return (
    <div className={clsx('progress', tone === 'gold' && 'gold', className)}>
      <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

/* ── Avatar & empty state ──────────────────────────────────────────────── */
const AVATAR_TONES = ['', 'gold']

export function Avatar({
  name,
  size = 'md',
  gold,
  className
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  gold?: boolean
  className?: string
}): React.JSX.Element {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials =
    parts.length === 0 ? '؟' : parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`
  return (
    <span
      className={clsx(
        'avatar',
        size !== 'md' && size,
        (gold ?? AVATAR_TONES[0]) && gold && 'gold',
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action
}: {
  icon: LucideIcon
  title: string
  text?: string
  action?: ReactNode
}): React.JSX.Element {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={28} strokeWidth={1.7} />
      </div>
      <div className="empty-title">{title}</div>
      {text ? <div className="empty-text">{text}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

/* ── Modal ─────────────────────────────────────────────────────────────── */
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'default' | 'wide' | 'xwide'
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'default'
}: ModalProps): React.JSX.Element {
  useEscape(open, onClose)
  useLockBody(open)

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            className={clsx('modal', size !== 'default' && size)}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="modal-head">
              <div>
                <div className="modal-title">{title}</div>
                {subtitle ? <div className="modal-sub">{subtitle}</div> : null}
              </div>
              <button className="icon-btn ghost sm" onClick={onClose} aria-label="بستن">
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">{children}</div>
            {footer ? <div className="modal-foot">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

/* ── Drawer ────────────────────────────────────────────────────────────── */
interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  narrow?: boolean
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  narrow
}: DrawerProps): React.JSX.Element {
  useEscape(open, onClose)
  useLockBody(open)

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="overlay drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            className={clsx('drawer', narrow && 'narrow')}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="drawer-head">
              <div>
                <div className="drawer-title">{title}</div>
                {subtitle ? <div className="drawer-sub">{subtitle}</div> : null}
              </div>
              <button className="icon-btn ghost sm" onClick={onClose} aria-label="بستن">
                <X size={18} />
              </button>
            </div>
            <div className="drawer-body">{children}</div>
            {footer ? <div className="drawer-foot">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

function useEscape(active: boolean, callback: () => void): void {
  useEffect(() => {
    if (!active) return
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') callback()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, callback])
}

function useLockBody(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [active])
}

/* ── Toast & confirm hosts ─────────────────────────────────────────────── */
export function ToastHost(): React.JSX.Element {
  const items = useToasts((state) => state.items)
  const dismiss = useToasts((state) => state.dismiss)

  return createPortal(
    <div className="toast-host">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const Icon = item.tone === 'error' ? AlertTriangle : item.tone === 'info' ? Info : Check
          return (
            <motion.div
              key={item.id}
              layout
              className={clsx('toast', item.tone)}
              initial={{ opacity: 0, x: -30, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            >
              <div className="toast-icon">
                <Icon size={16} />
              </div>
              <div className="grow">
                <div className="toast-title">{item.title}</div>
                {item.description ? <div className="toast-desc">{item.description}</div> : null}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ height: 24, padding: 0, width: 24 }}
                onClick={() => dismiss(item.id)}
                aria-label="بستن"
              >
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body
  )
}

export function ConfirmHost(): React.JSX.Element {
  const confirm = useConfirm()

  return (
    <Modal
      open={confirm.open}
      onClose={() => finishConfirm(false)}
      title={confirm.title}
      footer={
        <>
          <Button variant="ghost" onClick={() => finishConfirm(false)}>
            {confirm.cancelLabel}
          </Button>
          <Button
            variant={confirm.danger ? 'danger' : 'primary'}
            onClick={() => finishConfirm(true)}
          >
            {confirm.confirmLabel}
          </Button>
        </>
      }
    >
      <div className={clsx('confirm-icon', confirm.danger && 'danger')}>
        <AlertTriangle size={23} />
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 2 }}>{confirm.message}</div>
    </Modal>
  )
}

/* ── Numbers & pagination ──────────────────────────────────────────────── */
export function CountUp({
  value,
  format,
  duration = 850
}: {
  value: number
  format: (value: number) => ReactNode
  duration?: number
}): React.JSX.Element {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    const from = previous.current
    const to = value
    previous.current = value
    if (from === to) {
      setDisplay(to)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{format(display)}</>
}

export function Pagination({
  page,
  pageCount,
  onChange,
  total,
  pageSize
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
  total: number
  pageSize: number
}): React.JSX.Element | null {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const pages: (number | '…')[] = []
  for (let i = 1; i <= pageCount; i += 1) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }

  return (
    <div className="table-footer">
      <span>
        نمایش {fa(from)} تا {fa(to)} از {fa(total)} مورد
      </span>
      <div className="pagination">
        <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="قبلی">
          <ChevronRight size={14} />
        </button>
        {pages.map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} className="page-btn" style={{ border: 0, cursor: 'default' }}>
              …
            </span>
          ) : (
            <button
              key={item}
              className={clsx('page-btn', item === page && 'active')}
              onClick={() => onChange(item)}
            >
              {fa(item)}
            </button>
          )
        )}
        <button
          className="page-btn"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="بعدی"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── Splash ────────────────────────────────────────────────────────────── */
export function Splash(): React.JSX.Element {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="splash-inner">
        <motion.div
          className="splash-mark"
          initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <LogoMark size={56} />
        </motion.div>
        <motion.div
          className="splash-name"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          تراز
        </motion.div>
        <motion.div
          className="splash-tag"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          دفترِ هوشمند کسب‌وکار
        </motion.div>
        <div className="splash-line">
          <span />
        </div>
      </div>
      <div className="splash-foot">ساخته‌شده برای کسب‌وکارهای ایرانی</div>
    </motion.div>
  )
}

/* ── Small helpers ─────────────────────────────────────────────────────── */
export function Divider({ className }: { className?: string }): React.JSX.Element {
  return <div className={clsx('divider', className)} />
}

export function Hint({
  children,
  tone = 'accent'
}: {
  children: ReactNode
  tone?: 'accent' | 'gold'
}): React.JSX.Element {
  return (
    <div className={clsx('insight', tone === 'gold' && 'gold')}>
      <Info size={15} />
      <div>{children}</div>
    </div>
  )
}

export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function formatInputNumber(value: number): string {
  return groupDigits(value)
}

export function normalizeSearch(value: string): string {
  return value
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[ىي]/g, 'ی')
    .replace(/ك/g, 'ک')
    .toLowerCase()
}

export function matchesSearch(haystack: string, needle: string): boolean {
  if (!needle.trim()) return true
  return normalizeSearch(haystack).includes(normalizeSearch(needle))
}

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
]

export { latinDigits }

export { DatePicker } from './DatePicker'
