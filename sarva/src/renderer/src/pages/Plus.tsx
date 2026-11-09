import PlanCards from '@/components/UI/plus/PlanCards'
import PlusScrollPage from '@/components/UI/plus/scroll/PlusScrollPage'
import { PLUS_COMPARE, PLUS_CYCLE, PLUS_RULES, PLUS_RULES_HEADING, PLUS_SUPPORT } from '@/components/UI/plus/scroll/plus-content'
import SupportButton from '@/components/UI/kit/support-button'
import purchaseRules from '@/components/UI/plus/purchase-rules.module.css'
import { usePlusSummary } from '@/lib/auth/use-current-user'
import { jalaliLong } from '@/lib/panel/format'
import type { PlusPlanOffer } from '@/lib/plus/types'

/**
 * سروا پلاس.
 *
 * ⚠️ مبالغ از صفحهٔ زندهٔ `/plus` آمده‌اند (واحدِ نمایش تومان است و در
 * `amountRials` به ریال نوشته می‌شوند تا با `formatRials` درست چاپ شوند).
 * در این برنامهٔ آفلاین خرید بی‌درنگ و بدون درگاه انجام می‌شود — همان‌طور که
 * پیش از این بود — ولی **قیمت‌ها همانی است که سایت نشان می‌دهد**؛ نشان دادنِ
 * یک پلنِ «رایگان / برای ۰ روز» چیزی نبود که کاربر روی سایت ببیند.
 *
 * ⚠️ این صفحه پیش از این تنها یک تیتر و یک کارت نشان می‌داد، در حالی که
 * `PlusScrollPage` (همان صفحهٔ کاملِ سایت) از پیش ساخته شده بود و هیچ‌جا به کار
 * نرفته بود. بعدتر هم وقتی وصل شد، متن‌هایش از خودِ صفحه نبودند. ترتیب و
 * متنِ همه‌چیز اینجا از `sarva-sources/plus-scrolled.html` می‌آید.
 */
const OFFERS: PlusPlanOffer[] = [
  {
    planId: 'plus-1m',
    code: 'plus_1m',
    title: 'سروا پلاس یک ماهه',
    subtitle: null,
    durationDays: 30,
    planVersionId: 'plus-1m-v1',
    version: 1,
    amountRials: 1_530_000,
    currency: 'IRR',
    monthlyEquivalentRials: null,
    savingPercent: null,
    compareAtRials: null,
    discountPercent: null,
  },
  {
    planId: 'plus-3m',
    code: 'plus_3m',
    title: 'سروا پلاس سه‌ماهه',
    subtitle: 'کمترین هزینهٔ ماهانه',
    durationDays: 90,
    planVersionId: 'plus-3m-v1',
    version: 1,
    amountRials: 3_800_000,
    currency: 'IRR',
    monthlyEquivalentRials: 1_270_000,
    savingPercent: 17,
    compareAtRials: null,
    discountPercent: null,
  },
  {
    planId: 'plus-12m',
    code: 'plus_12m',
    title: 'سروا پلاس یک‌ساله',
    subtitle: 'بهترین انتخاب',
    durationDays: 365,
    planVersionId: 'plus-12m-v1',
    version: 1,
    amountRials: 9_900_000,
    currency: 'IRR',
    monthlyEquivalentRials: 830_000,
    savingPercent: 47,
    compareAtRials: 15_600_000,
    discountPercent: 37,
  },
]

export default function Plus() {
  const { plus } = usePlusSummary()

  /* سربرگ و پاورقی را خودِ `App` می‌سازد؛ اینجا فرستاده نمی‌شوند تا دوبار
     نیایند. تنها بخشی که صفحه باید پر کند «قیمت‌ها» است. */

  /* ⚠️ مشترکِ فعال باید بداند تا کی وقت دارد و بتواند تمدید کند. پیش از این
     خطی نبود و کارتِ پلن برای کسی که اشتراک داشت اصلاً دکمه نشان نمی‌داد
     (`permanent`), یعنی راهی برای تمدید وجود نداشت. سایت برای مشترکِ فعال هم
     «تمدید اشتراک» می‌نویسد. */
  const subscriptionLine =
    plus.state === 'active' && plus.expiresAt
      ? `اشتراک تو فعال است تا ${jalaliLong(plus.expiresAt)}.`
      : null

  const plans = (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-center text-xl font-bold">انتخاب مدت</h2>

      {subscriptionLine && (
        <p className="mb-5 text-center text-sm plus-ink">{subscriptionLine}</p>
      )}

      <PlanCards
        offers={OFFERS}
        state={plus.state}
        permanent={plus.state === 'active' && plus.expiresAt === null}
      />

      <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border/70 bg-card px-5 pb-3 pt-4">
        <h3 className="mb-1 text-sm font-extrabold">{PLUS_RULES_HEADING}</h3>
        <ul className={purchaseRules.list}>
          {PLUS_RULES.map((rule) => {
            const Icon = rule.icon;
            return (
              <li key={rule.text} className={purchaseRules.item}>
                <span className={purchaseRules.icon} aria-hidden="true"><Icon size={16} /></span>
                <span>{rule.text}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">{PLUS_SUPPORT.question}</p>
        <SupportButton>{PLUS_SUPPORT.action}</SupportButton>
        {/* ⚠️ نشانِ اینماد در سایت پس از دکمهٔ پشتیبانی می‌آید (`mt-4`، ۷۲×۷۲)
            و صفحه بی‌آن حدود ۱۰۰ پیکسل کوتاه‌تر است. همان شناسه و کدی که سایت
            (و صفحهٔ «درباره‌ی» خودِ برنامه) به کار می‌برند. */}
        <a
          href="https://trustseal.enamad.ir/?id=7819726&Code=5bmAaIT1LDb6VNbUNjhcqagEYEAYtIK7"
          target="_blank"
          rel="noopener"
          referrerPolicy="origin"
          aria-label="نماد اعتماد الکترونیکی"
          className="inline-block shrink-0 mt-4"
        >
          <img
            src="https://trustseal.enamad.ir/logo.aspx?id=7819726&Code=5bmAaIT1LDb6VNbUNjhcqagEYEAYtIK7"
            alt=""
            referrerPolicy="origin"
            width={72}
            height={72}
            style={{ width: 72, height: 'auto', cursor: 'pointer' }}
          />
        </a>
      </div>
    </div>
  )

  return <PlusScrollPage cycle={PLUS_CYCLE} plans={plans} compare={PLUS_COMPARE} />
}
