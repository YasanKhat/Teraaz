import type { GradeKey } from "@/lib/doroos/types";
import type { JasoosLevel } from "@/lib/jasoos-data";
import raw from "./jasoos-bank.json";

/** یک پروندهٔ بانک، با نشانیِ کتابش: کدام پایه و کدام درس.
 *
 *  بانک همان ۳۶۵ پرونده‌ای است که سایت روی `/game/jasoos` منتشر کرده و در
 *  اچ‌تی‌ام‌الِ همان صفحه (در بارِ RSC) آمده — نه ساختهٔ ما. شمارِ پروندهٔ هر
 *  درس و متنِ بیت‌ها و چهار مظنون، نویسه‌به‌نویسه از همان ثبت استخراج شده. */
export type JasoosBankLevel = JasoosLevel & {
  grade: GradeKey;
  lesson: number;
};

export const JASOOS_BANK = raw as JasoosBankLevel[];

/** پرونده‌های یک پایه، به تفکیکِ شمارهٔ درس — همان جدولی که کارت‌های
 *  انتخابِ درس روی سایت نشان می‌دهند (مثلاً درسِ ۱ِ دهم: ۱۴ پرونده). */
export function lessonsOf(
  grade: GradeKey,
): { lesson: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const lv of JASOOS_BANK) {
    if (lv.grade !== grade) continue;
    counts.set(lv.lesson, (counts.get(lv.lesson) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([lesson, count]) => ({ lesson, count }));
}

/** پرونده‌های درس‌های برگزیده، به ترتیبِ همان بانک. */
/** شمارِ پرونده‌هایِ نشان‌دارِ یک درس — همان `taggedLevelCount`ِ سایت.
 *
 *  سایت از این برایِ دو چیز استفاده می‌کند: اینکه درس «باز» است یا «به‌زودی»،
 *  و اینکه آیا پرونده‌هایِ بی‌پایه به دستِ بازی افزوده شوند یا نه. */
export function taggedLevelCount(grade: GradeKey, lesson: number): number {
  return JASOOS_BANK.filter((lv) => lv.grade === grade && lv.lesson === lesson)
    .length;
}

/** همان `levelsForLessons`ِ سایت.
 *
 *  نکته‌ای که به چشم نمی‌آید: اگر یکی از درس‌هایِ برگزیده اصلاً پروندهٔ
 *  نشان‌دار نداشته باشد، سایت پرونده‌هایِ *بی‌پایه* را هم به دست می‌افزاید تا
 *  دست خالی نماند. در این بانک همهٔ ۳۶۵ پرونده پایه و درس دارند، پس این شاخه
 *  در عمل بسته است — اما نگه داشته شده تا اگر روزی پروندهٔ بی‌پایه‌ای آمد،
 *  رفتار با سایت یکی بماند. */
export function levelsForLessons(
  grade: GradeKey,
  lessons: readonly number[],
): JasoosBankLevel[] {
  if (!grade || !lessons?.length) return [...JASOOS_BANK];
  const picked = new Set(lessons);
  const tagged = JASOOS_BANK.filter(
    (lv) => lv.grade === grade && lv.lesson != null && picked.has(lv.lesson),
  );
  const hasEmpty = lessons.some((l) => taggedLevelCount(grade, l) === 0);
  const untagged = hasEmpty ? JASOOS_BANK.filter((lv) => !lv.grade) : [];
  return [...tagged, ...untagged];
}

/** دستِ بازی — سایت بیش از این پرونده نمی‌دهد (عضوِ آزاد هم همین قدر). */
export const JASOOS_HAND = 10;

/** همان `pickJasoosLevels`ِ سایت: درهم‌زنیِ فیشر–یتس، بعد بریدن به اندازه‌یِ دست.
 *
 *  ⚠️ چرا مهم است: پیش از این برنامه همهٔ پرونده‌هایِ درس را به ترتیب می‌داد،
 *  پس انتخابِ درسِ یکِ دهم یعنی ۱۴ پرونده‌یِ پشتِ‌هم و همیشه به یک ترتیب؛
 *  سایت ده پرونده برمی‌دارد و هر بار درهم می‌زند. */
export function pickJasoosLevels(
  levels: readonly JasoosBankLevel[],
  cap: number = JASOOS_HAND,
): JasoosBankLevel[] {
  const a = [...levels];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(cap, a.length));
}
