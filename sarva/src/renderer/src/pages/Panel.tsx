import { useMemo } from 'react'
import HomePanel from '@/components/UI/panel/HomePanel'
import { useCurrentUser } from '@/lib/auth/use-current-user'
import { panelOverview } from '@/platform/panel'
import { Link } from '@/app/router'

/**
 * پنلِ کاربری.
 *
 * روی وب این صفحه از `lib/panel/queries.ts` با چند کوئریِ SQL پر می‌شد. اینجا
 * همان عددها از روی ردیف‌های محلی ساخته می‌شوند (در `platform/panel.ts`) و
 * همان `HomePanel`ِ سایت نمایششان می‌دهد.
 *
 * ⚠️ یک تفاوتِ کوچک اما مهم: چون داده روی همین دستگاه و منطقهٔ زمانیِ
 * خودش است، آن هشدارِ `dayState: "unavailable"` (که روی سرور وقتی جدولِ
 * منطقهٔ زمانی بار نبود پیش می‌آمد) دیگر هرگز رخ نمی‌دهد.
 */
export default function Panel() {
  const { user, loading } = useCurrentUser()
  const overview = useMemo(() => panelOverview(user?.id ?? null), [user?.id])

  if (loading) return <div className="min-h-[60vh]" aria-busy="true" />

  if (!user) {
    return (
      <div dir="rtl" className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <h1 className="text-2xl font-black text-foreground">پنلِ من</h1>
        <p className="max-w-md text-sm leading-7 text-muted-foreground">
          برای اینکه پیشرفتت ذخیره شود، یک حسابِ محلی بساز. چیزی به اینترنت فرستاده نمی‌شود — حساب
          فقط روی همین دستگاه است.
        </p>
        <Link
          href="/auth"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
        >
          ساختِ حساب
        </Link>
      </div>
    )
  }

  return (
    <HomePanel
      name={user.fullName ?? 'کاربر سروا'}
      memberSince={user.createdAt}
      overview={overview}
      todayPlan={null}
    />
  )
}
