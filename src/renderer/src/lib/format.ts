import { fa, faAlways, groupDigits } from './digits'
import { JALALI_MONTHS, isoToJalali } from './jalali'

/** 12,450,000 → «۱۲٬۴۵۰٬۰۰۰» */
export function money(value: number): string {
  const sign = value < 0 ? '−' : ''
  return sign + fa(groupDigits(Math.abs(value))).replace(/,/g, '٬')
}

/** 12,450,000 → «۱۲٫۴ میلیون» */
export function compact(value: number, maxDigits = 1): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  const units: { limit: number; divisor: number; label: string }[] = [
    { limit: 1_000_000_000_000, divisor: 1_000_000_000_000, label: 'هزار میلیارد' },
    { limit: 1_000_000_000, divisor: 1_000_000_000, label: 'میلیارد' },
    { limit: 1_000_000, divisor: 1_000_000, label: 'میلیون' },
    { limit: 1_000, divisor: 1_000, label: 'هزار' }
  ]
  for (const unit of units) {
    if (abs >= unit.limit) {
      const n = abs / unit.divisor
      const digits = n >= 100 ? 0 : maxDigits
      const text = n.toFixed(digits).replace(/\.0+$/, '').replace('.', '٫')
      return `${sign}${fa(text)} ${unit.label}`
    }
  }
  return money(value)
}

export function percent(value: number, digits = 0): string {
  const text = value.toFixed(digits).replace(/\.0+$/, '').replace('.', '٫')
  return `${fa(text)}٪`
}

export function faNumber(value: number, digits = 0): string {
  return fa(value.toFixed(digits).replace('.', '٫'))
}

export function weekdayDate(iso: string): string {
  return fa(iso)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return `${parts[0][0]}${parts[parts.length - 1][0]}`
}

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده'
]
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = [
  '',
  'یکصد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد'
]
const SCALES = ['', ' هزار', ' میلیون', ' میلیارد', ' هزار میلیارد']

function threeDigitsToWords(value: number): string {
  const parts: string[] = []
  const h = Math.floor(value / 100)
  const rest = value % 100
  if (h > 0) parts.push(HUNDREDS[h])
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10])
  } else {
    const t = Math.floor(rest / 10)
    const o = rest % 10
    if (t > 0) parts.push(TENS[t])
    if (o > 0) parts.push(ONES[o])
  }
  return parts.join(' و ')
}

/** 12540000 → «دوازده میلیون و پانصد و چهل هزار» */
export function numberToPersianWords(value: number): string {
  const rounded = Math.round(Math.abs(value))
  if (rounded === 0) return 'صفر'
  if (rounded > 999_999_999_999_999) return money(rounded)

  const groups: number[] = []
  let rest = rounded
  while (rest > 0) {
    groups.push(rest % 1000)
    rest = Math.floor(rest / 1000)
  }

  const words: string[] = []
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    if (groups[i] === 0) continue
    words.push(`${threeDigitsToWords(groups[i])}${SCALES[i]}`)
  }
  const text = words.join(' و ')
  return value < 0 ? `منفی ${text}` : text
}

export function amountInWords(value: number, currency = 'تومان'): string {
  return `${numberToPersianWords(value)} ${currency}`
}

/** Joins Persian labels with the correct Arabic comma. */
export function joinFa(parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join('، ')
}

export function monthShort(iso: string): string {
  return fa(JALALI_MONTHS[isoToJalali(iso).jm - 1])
}

export function truncate(value: string, max = 48): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function latinPercent(value: number): string {
  return `${value.toFixed(0).replace('.', '٫')}%`
}

export function faDigitsOnly(value: string): string {
  return faAlways(value)
}
