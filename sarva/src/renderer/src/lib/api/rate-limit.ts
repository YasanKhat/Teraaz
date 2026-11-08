/**
 * محدودیتِ نرخ — در یک برنامهٔ تک‌نفره بی‌معناست.
 *
 * روی وب این از یک جدول یا حافظهٔ سرور استفاده می‌کرد تا جلویِ اسکریپت‌هایی
 * را بگیرد که endpointها را بمباران می‌کنند. در نسخهٔ دسکتاپ «سرور» روی میزِ
 * کاربر است؛ کسی که بتواند آن را بمباران کند، خودش است. پس اینجا همیشه
 * اجازه می‌دهد — و امضاها را نگه می‌دارد تا ماژول‌هایی که صدایش می‌زنند
 * دست‌نخورده بمانند.
 */

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(_key: string, limit = 60, _windowSeconds = 60): RateLimitResult {
  return { allowed: true, remaining: limit, retryAfterSeconds: 0 }
}

export function resetRateLimit(_key: string): void {}

export async function rateLimitSubject(_request?: unknown): Promise<string> {
  return 'local'
}
