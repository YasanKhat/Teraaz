/**
 * شکلِ پاسخِ API — همان قراردادی که `lib/api/http.ts`ِ سروا تعریف کرده.
 *
 * سرتاسرِ کدِ سروا با `{ ok: true, data } | { ok: false, errors }` کار
 * می‌کند و `lib/api/client.ts` غیر از این چیزی نمی‌فهمد. اینجا همان نوع را
 * بازتعریف می‌کنیم تا لایهٔ سکو نیازی به ماژول‌های سروری (که `next/server`
 * و `node:*` وارد می‌کنند) نداشته باشد.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; errors: string[] }

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

export function fail(message: string): ApiResult<never> {
  return { ok: false, errors: [message] }
}

export function fails(messages: string[]): ApiResult<never> {
  return { ok: false, errors: messages.length ? messages : ['خطای ناشناخته.'] }
}
