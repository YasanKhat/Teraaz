import * as db from './db'
import * as auth from './auth'
import { installNextShims } from '@/platform/next-shims'
import { platformFetch } from '@/platform/fetch'

/**
 * راه‌اندازیِ لایهٔ سکو.
 *
 * اینجا تنها جایی است که برنامه «دستگاه» را لمس می‌کند: می‌فهمد آیا اینترنت
 * هست (تا وزن را از گنجور بپرسد یا از موتورِ محلی)، و نشستِ کاربر را
 * برمی‌گرداند.
 */

export type OnlineStatus = 'online' | 'offline' | 'unknown'

let online: OnlineStatus = typeof navigator === 'undefined' ? 'unknown' : navigator.onLine ? 'online' : 'offline'

export function onlineStatus(): OnlineStatus {
  return online
}

export function isOnline(): boolean {
  return online !== 'offline'
}

const listeners = new Set<(status: OnlineStatus) => void>()

export function onOnlineChange(cb: (status: OnlineStatus) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function set(next: OnlineStatus) {
  if (next === online) return
  online = next
  for (const l of listeners) l(next)
}

export function installPlatform(): void {
  installNextShims()
  installLocalFetch()
  window.addEventListener('online', () => set('online'))
  window.addEventListener('offline', () => set('offline'))

  // پیش از بسته‌شدن، هرچه نوشته‌نشده مانده روی دیسک برود.
  window.addEventListener('beforeunload', () => db.flushNow())

  // منوی الکترون: گرفتن و بازیابیِ پشتیبان با یک فایل.
  if (window.sarva) {
    window.sarva.onExportBackup?.(() => {
      const payload = JSON.stringify(
        { version: 1, exportedAt: new Date().toISOString(), data: db.dump() },
        null,
        2
      )
      void window.sarva?.saveFile(payload, `sarva-backup-${new Date().toISOString().slice(0, 10)}.json`)
    })

    window.sarva.onImportBackup?.(() => {
      void window.sarva?.pickFile().then((text) => {
        if (!text) return
        try {
          const parsed = JSON.parse(text) as { data?: Record<string, unknown[]> }
          if (!parsed.data) return
          db.restore(parsed.data as never)
          window.location.reload()
        } catch {
          /* فایلِ نامعتبر — چیزی عوض نمی‌شود. */
        }
      })
    })
  }

  void auth.ensureBootstrapAdmin()
}

/**
 * هر `fetch`ِ نسبی را به همان مسیریابِ محلی می‌سپارد.
 *
 * بیشترِ کد از `lib/api/client.ts` می‌گذرد که خودش `platformFetch` را صدا
 * می‌زند؛ اما چند کامپوننتِ قدیمی‌تر مستقیم `fetch('/api/v1/...')` می‌نویسند
 * (بانکِ آزمون، گزارشِ ایراد، نگاره، محتوای سایت، ...). بی‌صدا کردنِ آن‌ها
 * یعنی یک بخشِ برنامه بی‌دلیل خالی بماند — پس در سطحِ `window.fetch` گیر
 * می‌اندازیمشان.
 *
 * هرچه نسبی نیست (مثل درخواستِ گنجور) دست‌نخورده به شبکه می‌رود، تا
 * رفتارِ «اگر اینترنت بود از گنجور بپرس» سر جایش بماند.
 */
function installLocalFetch(): void {
  if (typeof window === 'undefined') return
  const native = window.fetch?.bind(window)
  if (!native) return

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url ?? ''
    if (url.startsWith('/')) return platformFetch(url, init as never)
    return native(input as never, init)
  }) as typeof window.fetch
}

export { db, auth }
