/*
 * Jalali (Shamsi) calendar engine — an independent implementation of the
 * well-known Khayyam/Birashk algorithm (jalaali-js), with no runtime deps.
 * All dates are exchanged as Gregorian ISO strings (`YYYY-MM-DD`) and shown
 * to the user in the Persian calendar.
 */

import { fa } from './digits'

const div = (a: number, b: number): number => Math.trunc(a / b)
const mod = (a: number, b: number): number => a - Math.floor(a / b) * b

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
  2394, 2456, 3178
]

function jalCal(jy: number, withoutLeap = false): { leap: number; gy: number; march: number } {
  const bl = BREAKS.length
  const gy = jy + 621
  let leapJ = -14
  let jp = BREAKS[0]
  let jump = 0
  let leap = 0

  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new Error('Invalid Jalali year ' + jy)
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }

  let n = jy - jp
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG

  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
    leap = mod(mod(n + 1, 33) - 1, 4)
    if (leap === -1) leap = 4
  }

  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

export interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

export function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy, true)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

export function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy, false)
  const jdn1f = g2d(gy, 3, r.march)
  let k = jdn - jdn1f

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

export function isoToJalali(iso: string): JalaliDate {
  const [gy, gm, gd] = iso.split('-').map(Number)
  return d2j(g2d(gy, gm, gd))
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = d2g(j2d(jy, jm, jd))
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
}

export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
}

export function isoToUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function utcToIso(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`
}

export function addDaysIso(iso: string, days: number): string {
  return utcToIso(isoToUtc(iso) + days * 86400000)
}

export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((isoToUtc(toIso) - isoToUtc(fromIso)) / 86400000)
}

export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function isBetweenIso(iso: string, from: string, to: string): boolean {
  return iso >= from && iso <= to
}

export const JALALI_MONTHS = [
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

export const JALALI_MONTHS_SHORT = [
  'فرو',
  'ارد',
  'خرد',
  'تیر',
  'مرد',
  'شهر',
  'مهر',
  'آبا',
  'آذر',
  'دی',
  'بهم',
  'اسف'
]

export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
export const WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

export function jalaliMonthLength(jy: number, jm: number): number {
  const first = j2d(jy, jm, 1)
  const next = jm === 12 ? j2d(jy + 1, 1, 1) : j2d(jy, jm + 1, 1)
  return next - first
}

/** 0 = Saturday … 6 = Friday */
export function weekdayOfIso(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 1) % 7
}

export function formatJalali(
  iso: string,
  style: 'long' | 'medium' | 'short' | 'numeric' | 'month' | 'monthYear' = 'long'
): string {
  const { jy, jm, jd } = isoToJalali(iso)
  const month = JALALI_MONTHS[jm - 1]
  switch (style) {
    case 'numeric':
      return fa(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
    case 'short':
      return fa(`${jd} ${month}`)
    case 'medium':
      return fa(`${jd} ${month} ${jy}`)
    case 'month':
      return fa(month)
    case 'monthYear':
      return fa(`${month} ${jy}`)
    case 'long':
    default:
      return `${WEEKDAYS[weekdayOfIso(iso)]} ${fa(jd)} ${month} ${fa(jy)}`
  }
}

export function relativeDay(iso: string, today = todayIso()): string {
  const diff = diffDays(iso, today)
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'دیروز'
  if (diff > 1 && diff < 7) return fa(`${diff} روز پیش`)
  if (diff < 0 && diff > -7) return fa(`${Math.abs(diff)} روز آینده`)
  return formatJalali(iso, 'medium')
}

export function startOfJalaliMonth(iso: string): string {
  const { jy, jm } = isoToJalali(iso)
  return jalaliToIso(jy, jm, 1)
}

export function endOfJalaliMonth(iso: string): string {
  const { jy, jm } = isoToJalali(iso)
  return jalaliToIso(jy, jm, jalaliMonthLength(jy, jm))
}

export function addJalaliMonths(iso: string, delta: number): string {
  const { jy, jm, jd } = isoToJalali(iso)
  const total = (jy * 12 + (jm - 1)) + delta
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const len = jalaliMonthLength(ny, nm)
  return jalaliToIso(ny, nm, Math.min(jd, len))
}

export function currentJalaliYear(iso = todayIso()): number {
  return isoToJalali(iso).jy
}
