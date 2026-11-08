import { dispatch } from './server'
import type { ApiResult } from './http'

/**
 * ترابریِ درون‌برنامه‌ای.
 *
 * `lib/api/client.ts`ِ سروا درخواست را به `fetch(path)` می‌سپرد و آن به
 * سرورِ Next می‌رسید. اینجا همان درخواست به `dispatch` می‌رود و پاسخ در
 * همان(process) ساخته می‌شود — بدون شبکه، بدون تأخیر، بدون سرور.
 *
 * تنها چیزی که لازم است همان شیءِ پاسخی است که `client.ts` از آن می‌خواند:
 * `ok`, `status`, `json()`. بقیهٔ رفتارش (پیام‌های فارسیِ خطا، کشِ
 * `no-store`, شکلِ `{ ok, data }`) دست‌نخورده می‌ماند.
 */

class LocalResponse {
  constructor(
    readonly ok: boolean,
    readonly status: number,
    private readonly payload: unknown
  ) {}

  async json(): Promise<unknown> {
    return this.payload
  }

  async text(): Promise<string> {
    return JSON.stringify(this.payload)
  }
}

/** کمی تأخیرِ مصنوعی تا رابطِ کاربری حالتی را که روی وب داشت حفظ کند:
 *  وضعیتِ «در حال بارگذاری» واقعاً دیده می‌شود و دکمه‌ها یک لحظه غیرفعال
 *  می‌مانند، درست مثل قبل. بدون آن، بعضی انیمیشن‌ها هرگز اجرا نمی‌شدند. */
function latency(): number {
  return 12 + Math.random() * 28
}

export async function platformFetch(path: string, init: { method?: string; body?: unknown } = {}) {
  const body = typeof init.body === 'string' ? safeParse(init.body) : init.body
  const result: ApiResult<unknown> = await dispatch(path, { method: init.method, body })

  await new Promise((r) => setTimeout(r, latency()))

  if (result.ok) return new LocalResponse(true, 200, { ok: true, data: result.data })
  return new LocalResponse(false, 400, { ok: false, errors: result.errors })
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
