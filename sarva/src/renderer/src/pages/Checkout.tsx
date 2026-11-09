import CheckoutPanel, { type CheckoutOffer } from '@/components/UI/plus/purchase/CheckoutPanel'
import { useCurrentUser, usePlusSummary } from '@/lib/auth/use-current-user'
import { useSearchParams } from '@/app/router'

/**
 * تکمیل خرید.
 *
 * ⚠️ این صفحه پیش از این وجود نداشت: `CheckoutPanel` ساخته شده بود ولی هیچ
 * مسیری آن را رندر نمی‌کرد، برای همین هر دکمهٔ «خرید اشتراک» و «تمدید اشتراک»
 * (روی صفحهٔ پلاس، در پنل، و در ایمیل‌ها) به صفحهٔ ۴۰۴ می‌رفت. مسیر اینجا
 * وصل شده؛ مبالغ هنوز از همان سه پلنِ صفحهٔ `/plus` می‌آید.
 *
 * ⚠️ مبلغ اینجا ساخته نمی‌شود — `formatRials` درونِ `CheckoutPanel` آن را
 * نشان می‌دهد و تنها چیزی که به سرور می‌رود `planCode` است.
 */

/** سه مدت، همان که در `/plus` دیده می‌شود. */
const PLANS = [
  { code: 'plus_1m', title: 'سروا پلاس یک ماهه', subtitle: null, durationDays: 30, amountRials: 1_530_000, compareAtRials: null, discountPercent: null, savingPercent: null, note: null },
  { code: 'plus_3m', title: 'سروا پلاس سه‌ماهه', subtitle: 'کمترین هزینهٔ ماهانه', durationDays: 90, amountRials: 3_800_000, compareAtRials: null, discountPercent: null, savingPercent: 17, note: 'تا پایان امتحان‌های دی' },
  { code: 'plus_12m', title: 'سروا پلاس یک‌ساله', subtitle: 'بهترین انتخاب', durationDays: 365, amountRials: 9_900_000, compareAtRials: 15_600_000, discountPercent: 37, savingPercent: 47, note: 'امتحان‌های دی و خرداد را می‌گیرد' },
] as const

const DAY_MS = 86_400_000

export default function Checkout() {
  const params = useSearchParams()
  const { user } = useCurrentUser()
  const { plus } = usePlusSummary()

  /* پلن از نشانی می‌آید تا رفرش یا برگشت از درگاه همان انتخاب را نشان دهد؛
     ناشناس یعنی کوتاه‌ترین مدت. */
  const requested = params.get('plan')
  const initialCode = PLANS.find((plan) => plan.code === requested)?.code ?? PLANS[0].code

  /* ⚠️ تمدید رویِ اشتراکِ موجود سوار می‌شود، نه از امروز: سایت هم روی صفحه
     می‌نویسد «این خرید به انتهای آن اضافه می‌شود». اگر اینجا از امروز حساب
     می‌شد، کسی که دو ماه اعتبار دارد با خریدِ یک‌ماهه یک ماه از دست می‌داد. */
  const from = plus.state === 'active' && plus.expiresAt ? new Date(plus.expiresAt).getTime() : Date.now()
  const offers: CheckoutOffer[] = PLANS.map((plan) => ({
    ...plan,
    accessUntil: new Date(from + plan.durationDays * DAY_MS).toISOString(),
  }))

  const account = user?.email ?? user?.phone ?? '—'
  const holder = user?.displayName?.trim() || account

  return (
    <CheckoutPanel
      offers={offers}
      initialCode={initialCode}
      account={account}
      /* ایمیل و شماره هر دو لاتین‌اند؛ نام می‌تواند فارسی باشد. */
      accountLtr={Boolean(user?.email ?? user?.phone)}
      holder={holder}
      activeUntil={plus.state === 'active' ? plus.expiresAt : null}
      blockedReason={null}
      isTestGateway={false}
    />
  )
}
