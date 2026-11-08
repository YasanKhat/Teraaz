import { useEffect, useRef, useState } from "react";
import VaznYabScene from "@/components/UI/vazn-yab/VaznYabScene";
import FamousMeters, { type FamousMeter } from "@/components/UI/vazn-yab/FamousMeters";
import VaznYabGuide from "@/components/UI/vazn-yab/VaznYabGuide";
import { ARKAN } from "@/lib/aruz/meters";
import { playRhythm, stopRhythm } from "@/lib/vazn-yab/rhythm";
import type { RhythmMode, SpeedId } from "@/lib/vazn-yab/rhythm";

/**
 * وزن‌یاب — چهار بخش، به همان ترتیبی که در صفحه‌ی سایت هست:
 *
 *   ۱. سرتیتر (وزن‌یاب / وزن، تقطیع هجایی و ریتم هر بیت فارسی)
 *   ۲. ماژولِ اصلی — نمونه، پخش ریتم، دستگاه، سرعت، فرمِ دو مصراع
 *   ۳. وزن‌های مشهور
 *   ۴. راهنما
 *
 * ⚠️ دو بخشی که پیش از این اینجا بودند و در سایت وجود ندارند حذف شدند:
 *    - یک صحنه‌ی سه‌بعدی که وانمود می‌کرد بیتی را تایپ و تحلیل می‌کند
 *      (VaznYabHero3D)؛ جایش را ماژولِ واقعی گرفت.
 *    - یک بخشِ جداگانه به نام «خودت را بیازما» (MasterChallenge)؛ روی سایت
 *      حالتِ استادی یکی از گزینه‌های همان فرم است، نه یک بخشِ جدا.
 *
 * تفاوتِ این نسخه با وب در یک چیز است و آن هم به نفعِ آفلاین: اگر اینترنت وصل
 * باشد، وزن از گنجور تأیید می‌شود؛ اگر نباشد، همان موتورِ عروضِ خودِ سروا پاسخ
 * می‌دهد. کاربر در هر دو حال جواب می‌گیرد.
 */
export default function VaznYab() {
  // گزینشِ وزن از فهرستِ «وزن‌های مشهور» — صدایش با همان تنظیماتِ ماژول پخش
  // می‌شود؛ تنظیمات در خودِ ماژول است و اینجا فقط پخش را صدا می‌زنیم.
  const [picked, setPicked] = useState<{ feet: string; playing: boolean } | null>(null);
  const meterToken = useRef(0);

  const patternOf = (feet: string) =>
    feet
      .split(/\s+/)
      .filter(Boolean)
      .map((f) => ARKAN[f] ?? "")
      .join("");

  const onPickMeter = async (m: FamousMeter) => {
    if (picked?.feet === m.feet && picked.playing) {
      stopRhythm();
      setPicked({ feet: m.feet, playing: false });
      return;
    }
    const mine = ++meterToken.current;
    setPicked({ feet: m.feet, playing: true });
    // تنظیماتِ پیش‌فرضِ ماژول، تا صدایِ فهرست با پیش‌فرضِ صفحه یکی باشد
    const { ok, duration } = await playRhythm(patternOf(m.feet), {
      mode: "chahargah",
      speed: "normal",
    });
    if (mine !== meterToken.current) return;
    setPicked({ feet: m.feet, playing: ok });
    if (ok) {
      window.setTimeout(() => {
        if (mine === meterToken.current) setPicked({ feet: m.feet, playing: false });
      }, duration * 1000 + 200);
    }
  };

  useEffect(() => () => stopRhythm(), []);

  return (
    <div className=" container relative z-20 overflow-x-clip pb-20 sm:pb-28" dir="rtl">
      <header className=" relative z-20 mx-auto mt-8 w-full max-w-5xl text-center sm:mt-12">
        <h1 className=" text-4xl leading-[1.15] font-black text-foreground sm:text-5xl">
          وزن‌یاب
        </h1>
        <p className=" mt-3 text-muted-foreground sm:text-lg">
          وزن، تقطیع هجایی و ریتم هر بیت فارسی
        </p>
      </header>

      <VaznYabScene />

      <FamousMeters
        current={picked?.feet ?? null}
        playing={picked?.playing ?? false}
        onPick={onPickMeter}
      />

      <VaznYabGuide />
    </div>
  );
}
