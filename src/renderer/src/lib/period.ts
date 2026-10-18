import { addJalaliMonths, diffDays, isoToJalali, jalaliToIso, startOfJalaliMonth, todayIso } from './jalali'
import type { Settings } from '../domain/types'

export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'last3' | 'last6' | 'fiscal' | 'all'

export interface PeriodRange {
  from: string
  to: string
  label: string
}

export const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'thisMonth', label: 'این ماه' },
  { key: 'lastMonth', label: 'ماه گذشته' },
  { key: 'last3', label: '۳ ماه اخیر' },
  { key: 'last6', label: '۶ ماه اخیر' },
  { key: 'fiscal', label: 'سال مالی' },
  { key: 'all', label: 'همه' }
]

export function fiscalStart(year: number): string {
  return jalaliToIso(year, 1, 1)
}

export function fiscalEnd(year: number): string {
  return jalaliToIso(year + 1, 1, 1)
}

export function resolvePeriod(preset: PeriodPreset, settings: Settings): PeriodRange {
  const today = todayIso()
  const currentMonth = startOfJalaliMonth(today)
  const fyStart = fiscalStart(settings.fiscalYear)
  const fyEnd = fiscalEnd(settings.fiscalYear)
  const end = today < fyEnd ? today : fyEnd

  switch (preset) {
    case 'lastMonth': {
      const start = addJalaliMonths(currentMonth, -1)
      const last = addJalaliMonths(currentMonth, -1)
      return {
        from: start,
        to: addJalaliMonths(last, 1) > today ? today : addDays(addJalaliMonths(last, 1), -1),
        label: 'ماه گذشته'
      }
    }
    case 'last3':
      return { from: addJalaliMonths(currentMonth, -2), to: today, label: '۳ ماه اخیر' }
    case 'last6':
      return { from: addJalaliMonths(currentMonth, -5), to: today, label: '۶ ماه اخیر' }
    case 'fiscal':
      return { from: fyStart, to: end, label: `سال مالی ${settings.fiscalYear}` }
    case 'all':
      return { from: fyStart, to: end, label: 'کل سال مالی' }
    case 'thisMonth':
    default:
      return { from: currentMonth, to: today, label: 'این ماه' }
  }
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d) + days * 86400000)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`
}

export function previousRange(range: PeriodRange): PeriodRange {
  const length = Math.max(1, diffDays(range.from, range.to) + 1)
  return {
    from: addDays(range.from, -length),
    to: addDays(range.from, -1),
    label: 'دوره قبل'
  }
}

export interface MonthBucket {
  key: string
  label: string
  from: string
  to: string
  year: number
  month: number
}

export function monthBuckets(from: string, to: string): MonthBucket[] {
  const start = isoToJalali(from)
  const end = isoToJalali(to)
  const buckets: MonthBucket[] = []
  let year = start.jy
  let month = start.jm
  let guard = 0

  while ((year < end.jy || (year === end.jy && month <= end.jm)) && guard < 60) {
    const bucketStart = jalaliToIso(year, month, 1)
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 }
    const bucketEnd = addDays(jalaliToIso(next.y, next.m, 1), -1)
    buckets.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: `${['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'][month - 1]}`,
      from: bucketStart < from ? from : bucketStart,
      to: bucketEnd > to ? to : bucketEnd,
      year,
      month
    })
    if (month === 12) {
      year += 1
      month = 1
    } else {
      month += 1
    }
    guard += 1
  }

  return buckets
}

export function fiscalProgress(settings: Settings, today = todayIso()): number {
  const start = fiscalStart(settings.fiscalYear)
  const end = fiscalEnd(settings.fiscalYear)
  const total = Math.max(1, diffDays(start, end))
  return Math.min(100, Math.max(0, (diffDays(start, today) / total) * 100))
}
