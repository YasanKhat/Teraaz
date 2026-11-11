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
export function levelsForLessons(
  grade: GradeKey,
  lessons: readonly number[],
): JasoosBankLevel[] {
  const picked = new Set(lessons);
  return JASOOS_BANK.filter(
    (lv) => lv.grade === grade && picked.has(lv.lesson),
  );
}
