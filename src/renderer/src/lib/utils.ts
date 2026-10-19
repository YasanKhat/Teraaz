import clsx, { type ClassValue } from 'clsx'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** ارقام لاتین را به فارسی تبدیل می‌کند؛ برای اعداد داخل متن و شمارنده‌ها. */
export function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]).replace(/\./g, '٫')
}

/** فقط ارقام را فارسی می‌کند (نقطهٔ اعشار دست‌نخورده). */
export function faDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
}

export const fas = (n: number) => faDigits(Math.round(n))

export function pct(a: number, b: number): number {
  if (!b) return 0
  return Math.round((a / b) * 100)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysAgoKey(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return todayKey(d)
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function mulberry(seed: number) {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function levelFromXp(xp: number): { level: number; title: string; start: number; next: number; progress: number } {
  const step = 250
  const level = Math.floor(xp / step) + 1
  const titles = ['نوآموز', 'رهرو', 'جست‌وجوگر', 'تاریخ‌خوان', 'پژوهشگر', 'تاریخ‌نگار', 'استاد', 'افسانه']
  return {
    level,
    title: titles[Math.min(level - 1, titles.length - 1)],
    start: (level - 1) * step,
    next: level * step,
    progress: ((xp % step) / step) * 100
  }
}

export function jalali(date: Date): string {
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch {
    return date.toLocaleDateString('fa-IR')
  }
}

export function dayName(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(date)
  } catch {
    return ''
  }
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'شب‌بخیر'
  if (h < 12) return 'صبح‌به‌خیر'
  if (h < 17) return 'بعدازظهر بخیر'
  if (h < 20) return 'عصر بخیر'
  return 'شب‌بخیر'
}

export function daysUntil(dateISO: string): number {
  const target = new Date(dateISO + 'T00:00:00')
  const now = new Date()
  const diff = target.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.ceil(diff / 86400000)
}

export function readingTime(min: number): string {
  return `${faDigits(min)} دقیقه`
}

/** تاریخ‌های نسبی ساده برای «آخرین مطالعه». */
export function timeAgo(iso: string): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'همین حالا'
  if (mins < 60) return `${faDigits(mins)} دقیقه پیش`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${faDigits(hours)} ساعت پیش`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${faDigits(days)} روز پیش`
  return jalali(new Date(then))
}

/** نرمال‌سازی متن فارسی برای جست‌وجوی مقاوم (ی/ي، ک/ك، نیم‌فاصله). */
export function normalizeFa(s: string): string {
  return s
    .replace(/[يﯼﯽ]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
