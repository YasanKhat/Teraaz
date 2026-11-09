import PlanCards from '@/components/UI/plus/PlanCards'
import PlusScrollPage from '@/components/UI/plus/scroll/PlusScrollPage'
import { PLUS_COMPARE, PLUS_CYCLE, PLUS_REASONS } from '@/components/UI/plus/scroll/plus-content'
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
 *
 * ⚠️ این صفحه پیش از این تنها یک تیتر و یک کارت نشان می‌داد، در حالی که
 * `PlusScrollPage` (همان صفحهٔ کاملِ سایت: قهرمان، چرخِ «چطور کار می‌کند»،
 * صحنه‌های یادگیری، دلیل‌ها و قیمت‌ها) از پیش ساخته شده بود و هیچ‌جا به کار
 * نرفته بود. اکنون همان رندر می‌شود.
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

  /* سربرگ و پاورقی را خودِ `App` می‌سازد؛ اینجا فرستاده نمی‌شوند تا دوبار
     نیایند. تنها بخشی که صفحه باید پر کند «قیمت‌ها» است. */
  const plans = (
    <>
      <h3 className="mb-4 text-center text-lg font-bold">انتخاب مدت</h3>
      <PlanCards offers={OFFERS} state={plus.state} permanent={plus.state === 'active'} />
      <ul className="mx-auto mt-10 max-w-2xl space-y-2 text-sm leading-7 text-muted-foreground">
        <li>• اشتراک پیش‌پرداخت است، تمدید خودکار ندارد و بلافاصله بعد از پرداخت فعال می‌شود.</li>
        <li>• اگر اشتراک فعال داری، مدت جدید به انتهای آن اضافه می‌شود.</li>
        <li>• هر حساب مخصوص یک نفر است و استفادهٔ چند نفر از یک اشتراک مجاز نیست.</li>
        <li>• اگر مبلغ کم شد و اشتراک فعال نشد، بانک معمولاً تا ۷۲ ساعت آن را برمی‌گرداند. در غیر این صورت به پشتیبانی پیام بده.</li>
      </ul>
    </>
  )



  return <PlusScrollPage reasons={PLUS_REASONS} cycle={PLUS_CYCLE} plans={plans} compare={PLUS_COMPARE} />
}
