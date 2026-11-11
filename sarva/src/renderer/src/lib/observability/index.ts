/**
 * لاگ و ردیابیِ درخواست — نسخهٔ دسکتاپ.
 *
 * روی سرور این ماژول با `AsyncLocalStorage` یک شناسهٔ درخواست را به همهٔ
 * لاگ‌ها می‌دوخت تا بتوان یک خطای گزارش‌شده از کاربر را در لاگ پیدا کرد. در
 * یک برنامهٔ تک‌نفره، «درخواست» وجود ندارد — پس پیچیدگی را نمی‌آوریم و همان
 * رابط را با یک لاگرِ ساده پیاده می‌کنیم.
 *
 * این کار فقط برای این است که گرافِ ماژول بسته بماند: چند ماژولِ سروری که
 * هنوز در باندل‌اند (`lib/api/http` و مانندش) این نام‌ها را import می‌کنند.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogFields = Record<string, unknown>
export type LogRecord = { level: LogLevel; message: string; fields?: LogFields }
export type LogSink = (record: LogRecord) => void

export const LEVEL_NAMES: LogLevel[] = ['debug', 'info', 'warn', 'error']

const sinks: LogSink[] = []

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const record: LogRecord = { level, message, fields }
  for (const sink of sinks) sink(record)
  // در توسعه دیدنِ لاگ مفید است؛ در production ساکت می‌مانیم مگر خطا.
  if (import.meta.env?.DEV || level === 'error' || level === 'warn') {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
    fn?.(`[sarva:${level}] ${message}`, fields ?? '')
  }
}

export type Logger = {
  debug(message: string, fields?: LogFields): void
  info(message: string, fields?: LogFields): void
  warn(message: string, fields?: LogFields): void
  error(message: string, fields?: LogFields): void
}

export const logger: Logger = {
  debug: (m, f) => emit('debug', m, f),
  info: (m, f) => emit('info', m, f),
  warn: (m, f) => emit('warn', m, f),
  error: (m, f) => emit('error', m, f)
}

export function addSink(sink: LogSink): void {
  sinks.push(sink)
}
export function configureLogger(): void {}
export function resetLogger(): void {
  sinks.length = 0
}

export const REQUEST_ID_HEADER = 'x-request-id'

export type RequestContext = { requestId: string; route?: string; ip?: string | null }

let counter = 0

export function newRequestId(): string {
  counter += 1
  return `local-${Date.now().toString(36)}-${counter}`
}

export function normalizeRequestId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : null
}

export function currentRequestContext(): RequestContext | null {
  return { requestId: newRequestId() }
}

export function currentRequestId(): string {
  return newRequestId()
}

export function runWithRequestContext<T>(_context: RequestContext, fn: () => T): T {
  return fn()
}

export type RedactProfile = 'default' | 'strict'
export type RedactOptions = { profile?: RedactProfile }

export function redact(value: unknown, _options?: RedactOptions): unknown {
  return value
}

/* ⚠️ `redactRecord` پیاده‌سازیِ واقعی است: برخلافِ `redact`ِ بالا که برای
   بسته ماندنِ گراف فقط مقدار را برمی‌گرداند، این یکی خروجی‌اش «شیء ساده»ی
   تضمین‌شده است (برای ستون jsonb). `lib/admin/audit.ts` آن را از همین درگاه
   می‌خواهد و نبودنش کلِ ماژول را با `SyntaxError` از کار می‌انداخت — و هر
   صفحه‌ای که به آن زنجیره پیوند بخورد (از جمله بازیِ نینجا) خطا می‌داد. */
export { redactRecord } from "./redact"

export function sanitizeUrl(url: string): string {
  return String(url ?? '').replace(/[?#].*$/, '')
}

export type SerializedError = { name: string; message: string; stack?: string }

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { name: 'Error', message: String(error) }
}

const reported = new WeakSet<object>()

export function markReported(error: object): void {
  reported.add(error)
}
export function wasReported(error: object): boolean {
  return reported.has(error)
}

export function buildErrorRecord(error: unknown, source?: string): SerializedError & { source?: string } {
  void source
  return serializeError(error)
}

export type ErrorSource = string
