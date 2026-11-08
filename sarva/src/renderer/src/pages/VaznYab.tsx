import VaznYabScene from "@/components/UI/vazn-yab/VaznYabScene";
import VaznYabGuide from "@/components/UI/vazn-yab/VaznYabGuide";

/**
 * وزن‌یاب — سه بخش، به همان ترتیب و همان درختی که در صفحه‌ی سایت هست:
 *
 *   ۱. سرتیتر (وزن‌یاب / وزن، تقطیع هجایی و ریتم هر بیت فارسی)
 *   ۲. ماژولِ اصلی در یک قابِ `relative z-30 mx-auto mt-5 w-full max-w-5xl`
 *      که «وزن‌های مشهور» هم داخلِ همان قاب است
 *   ۳. راهنما — خواهرِ آن قاب، مستقیم در `container`
 *
 * ⚠️ پیش از این «وزن‌های مشهور» بیرونِ قاب بود و صدایش را خودِ این صفحه و با
 *    تنظیماتِ ثابت (چهارگاه/عادی) پخش می‌کرد؛ در سایت زدن روی یک کارت وزن را
 *    روی صحنه می‌نشاند و با دستگاه و آهنگِ **خودِ آن وزن** بی‌درنگ می‌نوازد.
 *    برای همین برگزیدنِ وزن به درونِ ماژول منتقل شد.
 */
export default function VaznYab() {
  return (
    <div className=" container relative z-20 overflow-x-clip pb-20 sm:pb-28" dir="rtl">
      <header className=" relative z-20 mx-auto mt-8 w-full max-w-5xl text-center sm:mt-12">
        <h1 className=" text-4xl leading-[1.15] font-black text-foreground sm:text-5xl">وزن‌یاب</h1>
        <p className=" mt-3 text-muted-foreground sm:text-lg">
          وزن، تقطیع هجایی و ریتم هر بیت فارسی
        </p>
      </header>

      <VaznYabScene />

      <VaznYabGuide />
    </div>
  );
}
