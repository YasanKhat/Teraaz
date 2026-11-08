import PlanCards from '@/components/UI/plus/PlanCards'
import { usePlusSummary } from '@/lib/auth/use-current-user'
import type { PlusPlanOffer } from '@/lib/plus/types'

/**
 * سروا پلاس.
 *
 * 💚 در این نسخه **خرید رایگان و بی‌درنگ است**: همان لحظه‌ای که روی یک طرح
 * کلیک می‌کنی، سفارش ساخته و بلافاصله پرداخت‌شده ثبت می‌شود و دسترسی فعال
 * می‌گردد — بدون درگاه، بدون انتظار، بدون شماره کارت.
 *
 * چرا؟ چون کلِ محتوا همین‌جا روی دستگاه است و پشتِ درگاهی نشسته که در یک
 * برنامهٔ آفلاین معنایی ندارد. مسیرِ سایت (`checkout` → `pay`) دست‌نخورده
 * مانده تا همان تجربه حفظ شود؛ فقط مرحله‌ای که منتظر بانک می‌ماند حذف شده.
 */
const OFFERS: PlusPlanOffer[] = [
  {
    planId: 'plus-free',
    code: 'FREE',
    title: 'سروا پلاس',
    subtitle: 'همهٔ امکانات، برای همیشه',
    durationDays: 0,
    planVersionId: 'plus-free-v1',
    version: 1,
    amountRials: 0,
    currency: 'IRT',
    monthlyEquivalentRials: null,
    savingPercent: null,
    compareAtRials: null,
    discountPercent: null
  }
]

export default function Plus() {
  const { plus } = usePlusSummary()

  return (
    <div dir="rtl" className="container py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-black text-foreground sm:text-4xl">سروا پلاس</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          در نسخهٔ دسکتاپ، پلاس رایگان است. همین حالا فعالش کن تا قفلِ هیچ بخشی نماند.
        </p>
      </div>
      <PlanCards offers={OFFERS} state={plus.state} permanent={plus.state === 'active'} />
    </div>
  )
}
