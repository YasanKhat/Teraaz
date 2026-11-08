import * as db from '@/platform/db'
import * as auth from '@/platform/auth'
import type { PlusStatus } from './types'

/**
 * وضعیتِ دسترسیِ سروا پلاس — بازنوشته برای نسخهٔ دسکتاپ.
 *
 * 💚 قاعده‌ی این نسخه ساده است: خرید رایگان است، پس به‌محضِ فعال‌شدن،
 * دسترسی دائمی است. `getPlusStatus` همان شکلی را برمی‌گرداند که روی وب
 * برمی‌گرداند، تا `PlusSettingCard` و بقیه‌ی اجزا دست‌نخورده بمانند.
 *
 * ⚠️ حالتی که روی وب `unavailable` بود (دیتابیس در دسترس نبود) اینجا هرگز
 * پیش نمی‌آید: داده روی همین دستگاه است. پیامِ «نمی‌دانیم اشتراک داری یا نه»
 * در یک برنامه‌ی آفلاین بی‌معناست.
 */

export class PlusRequiredError extends Error {
  constructor(message = 'این بخش نیاز به سروا پلاس دارد.') {
    super(message)
    this.name = 'PlusRequiredError'
  }
}

export class PlusUnavailableError extends Error {
  constructor(message = 'بررسیِ وضعیتِ اشتراک ممکن نشد.') {
    super(message)
    this.name = 'PlusUnavailableError'
  }
}

export function getPlusStatusFor(userId: string): PlusStatus {
  const sub = db.findOne<{ userId: string; state: string; expiresAt: string | null }>(
    'plus_subscriptions',
    (r) => r.userId === userId
  )

  if (!sub || sub.state !== 'active') {
    return {
      state: 'free',
      isActive: false,
      expiresAt: null,
      startsAt: null,
      daysRemaining: null,
      expiringSoon: false,
      source: null
    }
  }

  return {
    state: 'active',
    isActive: true,
    expiresAt: sub.expiresAt ?? null,
    startsAt: null,
    daysRemaining: null,
    expiringSoon: false,
    source: 'purchase'
  }
}

export function getPlusStatus(): PlusStatus {
  const user = auth.currentUser()
  return user
    ? getPlusStatusFor(user.id)
    : {
        state: 'free',
        isActive: false,
        expiresAt: null,
        startsAt: null,
        daysRemaining: null,
        expiringSoon: false,
        source: null
      }
}

export function hasActivePlus(userId: string): boolean {
  return getPlusStatusFor(userId).isActive
}

export function requirePlus(): PlusStatus {
  return getPlusStatus()
}
