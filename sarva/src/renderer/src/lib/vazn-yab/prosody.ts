// توابعِ عروضیِ ویژه‌ی وزن‌یاب — پورتِ ماژولِ 267020 از بسته‌ی زنده‌ی سایت
// (۲۰۲۶-۱۱-۰۸).
//
// این‌ها همان توابعی‌اند که صفحه‌ی وزن‌یاب برای ساختنِ صحنه، برچسبِ رکن‌ها،
// تشخیصِ «شخصیتِ وزن» و رونوشتِ تقطیع به کار می‌برد.

import { ARKAN } from "@/lib/aruz/meters";

/** نرمال‌سازیِ رشته‌ی ارکان: نیم‌فاصله، ی و ک عربی، و حرکت‌ها. */
export function splitFeet(feet: string): string[] {
  return feet
    .replace(/[\u200c\u200e\u200f]/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064b-\u0652]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export type ScannedFoot = { foot: string; marks: string };

/** هر رکن را به علامت‌های هجایی‌اش می‌برد؛ اگر رکنی نشناسد، null. */
export function scanFeet(feet: string): ScannedFoot[] | null {
  const rows = splitFeet(feet).map((foot) => ({ foot, marks: ARKAN[foot] }));
  return rows.length && rows.every((r) => r.marks) ? rows : null;
}

/** علامت‌های هجاییِ کلِ وزن، پیوسته (مثل ‎U--U--‎). */
export function patternOf(feet: string): string {
  return (
    scanFeet(feet)
      ?.map((r) => r.marks)
      .join("") ?? ""
  );
}

/**
 * وزن را به دو مصراعِ «برهنه» می‌برد: هر هجا با بلندی/کوتاهی و شماره‌ی رکن.
 *
 * این همان چیزی است که به موتورِ صدا داده می‌شود.
 */
export function bareHemi(feet: string): { long: boolean; foot: number }[] {
  return (scanFeet(feet) ?? []).flatMap(({ marks }, foot) =>
    [...marks].map((m) => ({ long: m === "-", foot })),
  );
}

/** علامت‌ها را برای نمایش می‌آراید: بلند «–» و کوتاه «∪». */
export function marksText(marks: string): string {
  return [...marks].map((m) => (m === "-" ? "–" : "∪")).join(" ");
}

/**
 * شخصیتِ هر وزن — اینکه با کدام دستگاه و چه آهنگی نواخته شود.
 *
 * سایت برای هر وزن یک شخصیت دارد (حماسی مانندِ شاهنامه با چهارگاه و تندتر،
 * عرفانی مانندِ مثنوی با شور و کشیده‌تر) و بقیه «غنایی»‌اند.
 */
export const CHARACTER = {
  epic: { mode: "chahargah", pace: 0.88 },
  lyric: { mode: "shur", pace: 1 },
  mystic: { mode: "shur", pace: 1.15 },
  festive: { mode: "mahur", pace: 0.85 },
  reflective: { mode: "shur", pace: 1.12 },
} as const;

export type CharacterId = keyof typeof CHARACTER;

const CHARACTER_BY_FEET: Record<string, CharacterId> = {
  "فعولن فعولن فعولن فعل": "epic",
  "فعولن فعولن فعولن فعولن": "epic",
  "فاعلاتن فاعلاتن فاعلن": "mystic",
  "فعلاتن مفاعلن فعلن": "mystic",
  "مفتعلن مفتعلن فاعلن": "mystic",
  "مفعول مفاعیل مفاعیل فعل": "reflective",
  "مفعول مفاعیل مفاعیل فعولن": "reflective",
  "مفعول مفاعیلن مفعول مفاعیلن": "festive",
  "مفعول فاعلاتن مفعول فاعلاتن": "festive",
  "مفتعلن فاعلن مفتعلن فاعلن": "festive",
  "مفتعلن مفاعلن مفتعلن مفاعلن": "festive",
  "فعلات فاعلاتن فعلات فاعلاتن": "festive",
  "مستفعلن فع مستفعلن فع": "festive",
  "مفتعلن فع مفتعلن فع": "festive",
  "مفتعلن مفتعلن مفتعلن مفتعلن": "festive",
};

export function characterOf(feet: string): CharacterId {
  return CHARACTER_BY_FEET[splitFeet(feet).join(" ")] ?? "lyric";
}

/**
 * تنظیماتِ نواختنِ یک وزن: شخصیت، دستگاه و زمانِ هر واحد.
 *
 * `speed` همان ضریبِ سرعت است که کاربر برمی‌گزیند.
 */
export function voicingOf(
  feet: string,
  speedFactor: number,
  preferredMode?: string,
): { character: CharacterId; mode: "shur" | "chahargah" | "mahur"; unit: number } {
  const character = characterOf(feet);
  const mode = (preferredMode ?? CHARACTER[character].mode) as "shur" | "chahargah" | "mahur";
  const unit = Math.round(0.27 * CHARACTER[character].pace * speedFactor * 1e3) / 1e3;
  return { character, mode, unit };
}

/** رکن‌هایی که در حالتِ استادی برای حدس‌زدن پیش گذاشته می‌شود. */
export const GUESS_FEET = [
  "فاعلاتن",
  "فعلاتن",
  "فاعلن",
  "فعلن",
  "مفاعیلن",
  "مفاعلن",
  "فعولن",
  "مستفعلن",
  "مفتعلن",
  "مفعول",
  "مفاعیل",
  "فاعلات",
  "فعلات",
  "فعل",
  "فع",
] as const;

export type Verdict = "right" | "close" | "wrong" | null;

/** داوریِ حدسِ کاربر در حالتِ استادی. */
export function judgeGuess(guess: string[], feet: string): Verdict {
  const truth = splitFeet(feet);
  if (!guess.length || !truth.length) return "wrong";
  if (guess.join(" ") === truth.join(" ")) return "right";
  const key = (a: string[]) => [...new Set(a)].sort().join("|");
  return key(guess) === key(truth) ? "close" : "wrong";
}
