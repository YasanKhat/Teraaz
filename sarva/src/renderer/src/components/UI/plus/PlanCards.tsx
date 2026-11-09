"use client";

import { useRouter } from "@/app/router";
import { ShinyButton } from "@/components/UI/kit/magic-shiny-button";
import { formatRials } from "@/lib/plus/money";
import { fa } from "@/lib/panel/format";
import type { PlusPlanOffer, PlusState } from "@/lib/plus/types";
import { PLUS_FEATURES } from "@/components/UI/plus/scroll/plus-content";
import AnimatedPlanCard from "./AnimatedPlanCard";

/**
 * کارت‌های پلن روی صفحهٔ «سروا پلاس».
 *
 * ⚠️ اینجا هیچ مبلغی محاسبه نمی‌شود. هر عددی که دیده می‌شود از سرور آمده و
 * سرور هم آن را از `plus_plan_versions` خوانده. اگر قیمت در مرورگر ساخته
 * می‌شد، همان قیمت هم می‌توانست در مرورگر عوض شود.
 *
 * ⚠️ و هیچ «قیمتِ قبلیِ خط‌خورده»ای وجود ندارد. تخفیفِ ساختگی از قیمتی که
 * هرگز وجود نداشته، در این پروژه ساخته نمی‌شود؛ تنها مقایسه‌ای که نشان داده
 * می‌شود، صرفه‌جوییِ *واقعی* پلن بلندتر نسبت به نرخِ روزانهٔ گران‌ترین پلن
 * است و آن هم سمتِ سرور حساب شده.
 */
export default function PlanCards({
  offers,
  state,
  permanent = false,
}: {
  offers: PlusPlanOffer[];
  state: PlusState;
  /** دسترسیِ فعالِ بی‌پایان — خرید چیزی به آن اضافه نمی‌کند. */
  permanent?: boolean;
}) {
  const router = useRouter();

  if (offers.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
        هنوز پلنی برای فروش تعریف نشده است. به‌زودی.
      </div>
    );
  }

  /* متنِ دکمه با وضعیتِ حساب عوض می‌شود. یک عبارتِ ثابت («خرید اشتراک») به
     کسی که همین حالا اشتراک دارد پیشنهادِ بی‌معنی می‌دهد و به کسی که
     اشتراکش تمام شده نمی‌گوید که قرار است تمدید کند.

     ⚠️ مشترکِ فعال هم به صفحهٔ خرید می‌رود و نه «مدیریت»: پیش‌تر این دکمه به
     `/panel/subscription` می‌رفت و دکمهٔ «تمدید» همان صفحه به `/plus`
     برمی‌گشت — یعنی کسی که اشتراکش رو به پایان بود، هیچ راهی برای تمدید
     نداشت. فقط دسترسیِ دائمی دکمه ندارد، چون خرید چیزی به آن اضافه نمی‌کند. */
  const ctaLabel =
    state === "active" || state === "expired" || state === "revoked"
      ? "تمدید اشتراک"
      : "خرید اشتراک";

  /* ⚠️ با یک پلن، شبکهٔ دوستونه یک کارتِ نیمه‌عرضِ چسبیده به یک لبه می‌سازد
     که شبیه چیزی است که نصفش بار نشده. تا وقتی مالک فقط یک مدت می‌فروشد،
     همان یک کارت وسط و با عرضِ محدود می‌نشیند. */
  const single = offers.length === 1;

  /* ⚠️ تعدادِ ستون از تعدادِ پلن‌ها می‌آید و ثابت نیست. با `sm:grid-cols-2`
     ثابت، سه پلن یعنی دو کارت بالا و یکی تنها در ردیفِ دوم — که شبیهِ
     «یکی جا مانده» است و نه یک انتخابِ سه‌گانه. */
  const columns =
    single ? "mx-auto max-w-sm" : offers.length === 3
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      : "grid gap-4 sm:grid-cols-2";

  return (
    <div className={columns}>
      {offers.map((offer, index) => {
        /* ⚠️ هیچ نشانِ «به‌صرفه‌تر»ای ساخته نمی‌شود. سایت روی پلنِ سه‌ماهه
           فقط زیرتیترِ «کمترین هزینهٔ ماهانه» و خطِ «۱۷٪ به‌صرفه‌تر» را
           می‌نویسد؛ نشانِ بالای کارت فقط برای تخفیفِ واقعی است. گذاشتنِ یک
           نشانِ دیگر یعنی دو برچسبِ رقابتی روی یک کارت. */

        return (
          <AnimatedPlanCard
            key={offer.planVersionId}
            index={index}
            className="flex flex-col gap-4 rounded-2xl p-6"
          >
            {/* ⚠️ نشانِ تخفیف بر نشانِ «به‌صرفه‌تر» اولویت دارد و هر دو
                هم‌زمان نشان داده نمی‌شوند: دو برچسب روی یک کارت، هیچ‌کدام
                خوانده نمی‌شوند. */}
            {offer.discountPercent !== null ? (
              <span className="absolute -top-3 right-6 rounded-full border border-gold/40 bg-background px-3 py-0.5 text-[11px] font-bold plus-ink">
                {fa(offer.discountPercent)}٪ تخفیف
              </span>
            ) : null}

            <header className="space-y-1">
              <h3 className="text-lg font-bold">{offer.title}</h3>
              {offer.subtitle && (
                <p className="text-sm text-muted-foreground">{offer.subtitle}</p>
              )}
            </header>

            {/* ⚠️ دو شکلِ قیمت، برابرِ سایت: پلنِ یک‌ماهه یک عدد دارد
                («۱۵۳٬۰۰۰ تومان برای ۳۰ روز»)؛ پلن‌هایِ بلندتر اول هزینهٔ
                ماهانه را بزرگ می‌نویسند («۱۲۷٬۰۰۰ تومان در ماه») و بعد
                پرداختِ یک‌جا را در یک خطِ جدا می‌آورند. یکی کردنِ این دو شکل
                یعنی کاربر باید خودش حساب کند کدام به‌صرفه‌تر است. */}
            {offer.monthlyEquivalentRials !== null ? (
              <>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-2xl font-extrabold">{formatRials(offer.monthlyEquivalentRials)}</span>
                  <span className="text-sm text-muted-foreground">در ماه</span>
                </div>
                <p className="-mt-2 text-sm text-muted-foreground">
                  پرداخت یک‌جا{" "}
                  {/* ⚠️ قیمتِ خط‌خورده فقط وقتی می‌آید که مدیر عددِ *واقعیِ*
                      قبلی را ثبت کرده باشد. اینجا هیچ عددی ساخته نمی‌شود؛ اگر
                      ستون خالی باشد هیچ خط‌خوردگی‌ای وجود ندارد. */}
                  {offer.compareAtRials !== null && (
                    <span className="line-through decoration-muted-foreground/60">
                      {formatRials(offer.compareAtRials)}{" "}
                    </span>
                  )}
                  <b className="font-bold text-foreground">{formatRials(offer.amountRials)}</b> برای{" "}
                  {fa(offer.durationDays)} روز
                </p>
              </>
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {/* ⚠️ واحد همیشه کنارِ عدد است. «۱۹۹۰۰۰» بدونِ واحد یعنی
                    کاربر باید حدس بزند ریال است یا تومان. */}
                <span className="text-2xl font-extrabold">{formatRials(offer.amountRials)}</span>
                <span className="text-sm text-muted-foreground">
                  برای {fa(offer.durationDays)} روز
                </span>
              </div>
            )}

            {offer.savingPercent !== null && (
              <p className="text-xs plus-ink">
                نسبت به پلن کوتاه‌تر، {fa(offer.savingPercent)}٪ به‌صرفه‌تر
              </p>
            )}

            {/* ⚠️ این چهار خط از خودِ صفحهٔ `/plus` آمده‌اند. پیش از این پنج
                خطِ دیگر اینجا بود (دفتر اشتباه‌ها، روند پیشرفت هفتگی…) که
                روی سایت نیستند؛ نوشتنِ قابلیتی که در سایت فروخته نمی‌شود،
                روی این کارت هم درست نیست. */}
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {PLUS_FEATURES.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>

            {/* ⚠️ پرداخت خودکار نداریم و این باید *قبل* از خرید صریح گفته
                شود، نه در متنِ ریز پس از پرداخت. */}
            <p className="text-xs text-muted-foreground">
              پیش‌پرداخت است و تمدید خودکار ندارد.
            </p>

            {permanent ? (
              <p className="mt-auto rounded-xl border border-border px-4 py-2.5 text-center text-sm text-muted-foreground">
                اشتراک تو دائمی است
              </p>
            ) : (
              <ShinyButton
                type="button"
                onClick={() => router.push(`/checkout?plan=${encodeURIComponent(offer.code)}`)}
                className="mt-auto w-full border-primary/50 py-2.5"
                /* نامِ پلن در برچسبِ دسترس‌پذیری می‌آید تا کاربرِ صفحه‌خوان
                   بداند این دکمه مالِ کدام کارت است — سه دکمه با متنِ یکسان
                   بی‌فایده‌اند. */
                aria-label={`${ctaLabel} — ${offer.title}`}
                data-plan-index={index}
              >
                {ctaLabel}
              </ShinyButton>
            )}
          </AnimatedPlanCard>
        );
      })}
    </div>
  );
}
