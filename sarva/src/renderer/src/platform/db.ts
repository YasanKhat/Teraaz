/**
 * لایهٔ دادهٔ محلی — جانشینِ Postgres.
 *
 * در سروا هیچ کلاینتی مستقیم به دیتابیس وصل نمی‌شد؛ همه‌چیز از پشتِ
 * `lib/api/*` می‌گذشت و پاسخ‌ها شکلِ یکسانی داشتند. اینجا همان جدول‌ها روی
 * `localStorage`ِ همین دستگاه پیاده شده‌اند، تا:
 *
 *   • کامپوننت‌های سروا دست‌نخورده بمانند (همان مسیرها، همان شکلِ پاسخ)؛
 *   • برنامه واقعاً آفلاین باشد — هیچ سرویس، کوکی یا سشنی در کار نیست؛
 *   • پشتیبان‌گیری همان یک فایل JSON باشد که کاربر خودش ذخیره می‌کند.
 *
 * جدول‌ها در یک شیءِ واحد نشسته‌اند و هر نوشتن یک بار کلِ آن را می‌نویسد.
 * این برای اندازهٔ واقعیِ دادهٔ یک دانش‌آموز (چند هزار ردیف) کاملاً کافی است
 * و پیچیدگیِ IndexedDB را به یک برنامهٔ آموزشی نمی‌آورد.
 */

const KEY = 'sarva-db-v1'

export type Row = { id?: string } & Record<string, unknown>

type Schema = Record<string, Row[]>

let memory: Schema | null = null

function load(): Schema {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(KEY)
    memory = raw ? (JSON.parse(raw) as Schema) : {}
  } catch {
    memory = {}
  }
  return memory
}

let flushTimer: number | null = null

function flush() {
  if (!memory) return
  try {
    localStorage.setItem(KEY, JSON.stringify(memory))
  } catch {
    // پرشدنِ سهمیهٔ localStorage — داده در حافظه سالم است، فقط ماندگار نمی‌شود.
  }
}

/** نوشتن‌ها را دسته می‌کند: یک دورِ ۲۰ سؤالی ۲۰ بار دیسک را لمس نمی‌کند. */
function scheduleFlush() {
  if (flushTimer !== null) return
  flushTimer = window.setTimeout(() => {
    flushTimer = null
    flush()
  }, 250)
}

export function table<T extends Row>(name: string): T[] {
  const db = load()
  return (db[name] ??= []) as T[]
}

export function insert<T extends Row>(name: string, row: T): T {
  table<T>(name).push(row)
  scheduleFlush()
  return row
}

export function insertMany<T extends Row>(name: string, rows: T[]): T[] {
  const t = table<T>(name)
  t.push(...rows)
  scheduleFlush()
  return rows
}

export function find<T extends Row>(name: string, predicate: (row: T) => boolean): T[] {
  return table<T>(name).filter(predicate)
}

export function findOne<T extends Row>(name: string, predicate: (row: T) => boolean): T | null {
  return table<T>(name).find(predicate) ?? null
}

export function update<T extends Row>(name: string, id: string, patch: Partial<T>): T | null {
  const t = table<T>(name)
  const i = t.findIndex((r) => r.id === id)
  if (i === -1) return null
  t[i] = { ...t[i], ...patch }
  scheduleFlush()
  return t[i]
}

export function remove(name: string, predicate: (row: Row) => boolean): number {
  const t = table(name)
  const before = t.length
  const kept = t.filter((r) => !predicate(r))
  if (kept.length === before) return 0
  load()[name] = kept
  scheduleFlush()
  return before - kept.length
}

export function replaceAll<T extends Row>(name: string, rows: T[]): void {
  load()[name] = rows as Row[]
  scheduleFlush()
}

/** شناسه‌ای که در مرورگر هم در دسترس است (بدون `node:crypto`). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function dump(): Schema {
  return JSON.parse(JSON.stringify(load())) as Schema
}

export function restore(snapshot: Schema): void {
  memory = snapshot
  flush()
}

export function reset(keep?: string[]): void {
  const db = load()
  const preserved: Schema = {}
  for (const k of keep ?? []) if (db[k]) preserved[k] = db[k]
  memory = preserved
  flush()
}

export function tableNames(): string[] {
  return Object.keys(load())
}

export function count(name: string): number {
  return table(name).length
}

/** فوراً روی دیسک بنویس — پیش از خروج یا گرفتنِ پشتیبان. */
export function flushNow(): void {
  flush()
}
