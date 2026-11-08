/**
 * لایهٔ اتصال به دیتابیسِ سروا — جایگزین‌شده در نسخهٔ دسکتاپ.
 *
 * روی وب این ماژول به MySQL/Postgres وصل می‌شد و همهٔ دسترسی به داده از
 * همین‌جا می‌گذشت. در اینجا داده روی همین دستگاه است و `platform/db` آن را
 * نگه می‌دارد.
 *
 * این فایل فقط برای این می‌ماند که **گرافِ ماژول بسته بماند**: چند کامپوننتِ
 * مدیریت (و از طریقِ آن‌ها چند ماژولِ سروری) هنوز این نام‌ها را import
 * می‌کنند. هیچ‌کدام از این توابع در برنامهٔ دسکتاپ صدا زده نمی‌شوند — اگر
 * روزی صدا زده شوند، پیامِ روشنی می‌دهند به‌جای این‌که بی‌صدا دادهٔ غلط
 * برگردانند.
 */

const NOT_AVAILABLE = 'این مسیر در نسخهٔ دسکتاپ به دیتابیس وصل نمی‌شود؛ داده روی همین دستگاه است.'

function unavailable(): never {
  throw new Error(NOT_AVAILABLE)
}

export type Pool = Record<string, unknown>
export type RowDataPacket = Record<string, unknown>
export type Tx = {
  query: <T = RowDataPacket>(text: string, params?: unknown[]) => Promise<T[]>
  queryOne: <T = RowDataPacket>(text: string, params?: unknown[]) => Promise<T | null>
  execute: (text: string, params?: unknown[]) => Promise<number>
}

export function getPool(): Pool {
  return {}
}

export function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

export function isUniqueViolation(): boolean {
  return false
}
export function isForeignKeyViolation(): boolean {
  return false
}
export function isCheckViolation(): boolean {
  return false
}
export function isTriggerAssertion(): boolean {
  return false
}
export function triggerAssertionMessage(): string | null {
  return null
}
export function isMissingTable(): boolean {
  return false
}
export function missingTableName(): string | null {
  return null
}

export function query<T = RowDataPacket>(): Promise<T[]> {
  return unavailable()
}
export function queryOne<T = RowDataPacket>(): Promise<T | null> {
  return unavailable()
}
export function execute(): Promise<number> {
  return unavailable()
}
export function transaction<T>(): Promise<T> {
  return unavailable()
}

export function placeholders(count: number): string {
  return Array.from({ length: Math.max(0, count) }, () => '?').join(', ')
}

export function likePattern(raw: string): string {
  return `%${String(raw).replace(/[%_]/g, (m) => `\\${m}`)}%`
}
