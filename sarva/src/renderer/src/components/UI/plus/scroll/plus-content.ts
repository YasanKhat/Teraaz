import {
  AudioWaveform, CalendarPlus, FileCheck2, Image as ImageIcon, Landmark, MoonStar, Palette, ScanText,
  ScrollText, UserRound, type LucideIcon,
} from "lucide-react";
import type { CycleStep } from "./PlusScrollPage";

/**
 * متنِ صفحهٔ سروا پلاس — یک منبع، برای هم صفحهٔ واقعی و هم پیش‌نمایش.
 *
 * ⚠️ همهٔ این متن‌ها از صفحهٔ زندهٔ `/plus` کپی شده‌اند (MHTMLِ اسکرول‌شده،
 * `sarva-sources/plus-scrolled.html`). ترتیبِ نمایش هم همان است و در
 * `sarva-sources/plus-live-order.txt` ضبط شده؛ اگر ترتیبی عوض شد، آن فایل
 * مبنای مقایسه است.
 *
 * ⚠️ پیش از این این فایل شش «دلیل» و یک تیترِ دیگر داشت که هیچ‌کدام در سایت
 * نبودند. چیزی که اینجا نوشته می‌شود روی صفحه می‌رود و کاربر آن را متنِ
 * محصول می‌خواند — پس از خودِ صفحه می‌آید، نه از تخیل.
 */

/**
 * شش بلوکِ بخشِ «کتاب کمک‌درسی یا سروا پلاس؟».
 *
 * در سایت هر بلوک دو بار دیده می‌شود: یک‌بار به‌شکلِ یک توضیحِ بلند
 * (`title` و `body` و پاسخِ «کتاب:») و یک‌بار به‌شکلِ یک کارتِ برگردان در
 * دستهٔ کارت‌ها (`card` و `caption`). هر دو از یک داده می‌آیند تا اگر متنی
 * عوض شد، دو جا از قلم نیفتد.
 */
export type StoryItem = {
  id: string;
  /** اصلِ یادگیری — برچسبِ بالای هر بلوک و رویِ کارت. */
  principle: string;
  /** تیترِ توضیحِ بلند. */
  title: string;
  /** همان توضیح، همان‌طور که در سایت آمده. */
  body: string;
  /** پاسخِ «کتاب:» — روشِ کتابِ کمک‌درسی. */
  book: string;
  /** نامِ ابزار، رویِ کارت. */
  card: string;
  /** توضیحِ کوتاهِ پشتِ کارت. */
  caption: string;
  /** برچسبِ دکمهٔ راهنمایِ دستهٔ کارت‌ها. */
  chip: string;
  /** رنگِ این کارت — از `style="--accent: …"` خودِ سایت. */
  accent: string;
  /** آیکنِ نشانِ پشتِ کارت — از کلاسِ `lucide-*` در همان نشان. */
  icon: LucideIcon;
};

export const PLUS_STORY_HEADING = "کتاب کمک‌درسی یا سروا پلاس؟";
export const PLUS_STORY_LEDE = "هر دو درسنامه دارند؛ فرق در روشِ یادگرفتن است.";

export const PLUS_STORY: StoryItem[] = [
  {
    id: "story-doroos",
    principle: "یادگیری دیداری",
    title: "نقش و آرایه را روی خودِ بیت ببین",
    body: "هر نقش دستوری و هر آرایه با خطی به واژهٔ خودش وصل است. توضیح کنارِ متن است و لازم نیست بین بیت و پاورقی رفت‌وبرگشت کنی.",
    book: "توضیح‌ها جدا از بیت، در پاورقی و حاشیه",
    card: "درسنامهٔ هوشمند",
    caption: "نقش و آرایهٔ هر بیت",
    chip: "درسنامه",
    accent: "var(--primary)",
    icon: ScanText,
  },
  {
    id: "story-rangara",
    principle: "یادگیری فعال",
    title: "آرایه را خودت پیدا کن",
    body: "واژه را با رنگِ آرایه‌اش علامت می‌زنی و توضیحش همان لحظه می‌آید. چیزی که خودت پیدا کنی، بهتر از چیزی که فقط بخوانی می‌ماند.",
    book: "آرایه‌ها از قبل زیر هر بیت نوشته شده",
    card: "رنگ‌آرا",
    caption: "بازی آرایه‌ها",
    chip: "رنگ‌آرا",
    accent: "#e0879b",
    icon: Palette,
  },
  {
    id: "story-vazhyab",
    principle: "رمزگذاری دوگانه",
    title: "هر واژه، با یک تصویر",
    body: "معنیِ هر واژهٔ درس یک تصویر دارد و از روی تصویر پیدایش می‌کنی. واژه‌ای که هم تصویر دارد و هم معنی، دو راه برای به یاد آمدن دارد.",
    book: "فهرستِ واژه و معنی",
    card: "واژه‌یاب",
    caption: "هر واژه با یک تصویر",
    chip: "واژه",
    accent: "#b58ad6",
    icon: ImageIcon,
  },
  {
    id: "story-aruz",
    principle: "یادگیری شنیداری",
    title: "وزن را بشنو، فقط هجا نشمار",
    body: "ریتمِ وزن پخش می‌شود و بیتی را که با همان ریتم خوانده می‌شود پیدا می‌کنی. وزنی که شنیده‌ای، راحت‌تر یادت می‌ماند.",
    book: "وزن فقط با هجابندی روی کاغذ",
    card: "عروض سماعی",
    caption: "رشتهٔ انسانی",
    chip: "عروض",
    accent: "#3fb8d8",
    icon: AudioWaveform,
  },
  {
    id: "story-exam",
    principle: "بازخورد فوری",
    title: "امتحان نهایی، همان لحظه تصحیح",
    body: "سؤال‌های نهاییِ سال‌های قبل را جواب می‌دهی و درست یا غلطش همان لحظه معلوم می‌شود، پیش از آنکه اشتباه در ذهنت جا بیفتد.",
    book: "پاسخ‌نامه در صفحه‌های آخرِ کتاب",
    card: "امتحان نهایی",
    caption: "نهایی‌های سال‌های قبل",
    chip: "آزمون",
    accent: "#d9a441",
    icon: FileCheck2,
  },
  {
    id: "story-shab",
    principle: "مرور فشرده",
    title: "شب امتحان، همهٔ درس یک‌جا",
    body: "واژه، آرایه، دستور و نمونه‌سؤالِ هر درس کنار هم می‌آیند؛ اول مرور می‌کنی و بعد با بازی می‌سنجی که چقدر مانده.",
    book: "خلاصهٔ درس در چند صفحه، بی‌سنجش",
    card: "شب امتحان",
    caption: "همهٔ درس در یک مرور",
    chip: "شب امتحان",
    accent: "#7b8fd4",
    icon: MoonStar,
  },
];

/**
 * جدولِ «همهٔ تفاوت‌ها» — ۱۷ مورد در چهار گروه، برابرِ سایتِ زنده.
 *
 * ⚠️ در سایت دو ستون یکی نیستند: خانهٔ کتاب هم نشانه را می‌نویسد (برای
 * صفحه‌خوان) و هم توضیح را؛ خانهٔ پلاس **یا** نشانه می‌نویسد **یا** توضیح،
 * و وقتی توضیح دارد دیگر واژهٔ نشانه را تکرار نمی‌کند. همین تفاوتِ ریز در
 * `Mark` پیاده شده؛ اگر اینجا ساده‌سازی شود، متنِ خروجی با سایت فرق می‌کند.
 */
export type CompareMark = { state: "yes" | "part" | "no"; note?: string };
export type CompareRow = { label: string; book: CompareMark; plus: CompareMark };
export type CompareGroup = { title: string; rows: CompareRow[] };

const YES: CompareMark = { state: "yes" };
const NO: CompareMark = { state: "no" };

export const PLUS_COMPARE: CompareGroup[] = [
  {
    title: "درسنامه",
    rows: [
      { label: "درسنامه و معنی بیت‌ها", book: YES, plus: YES },
      { label: "نقش دستوری و آرایهٔ هر بیت", book: { state: "part", note: "در متن" }, plus: { state: "yes", note: "روی خود بیت" } },
      { label: "هوشواره؛ پیدا کردن نقش‌ها با هوش مصنوعی", book: NO, plus: YES },
      { label: "تاریخ ادبیات", book: YES, plus: { state: "yes", note: "با خط زمان" } },
    ],
  },
  {
    title: "واژه و املا",
    rows: [
      { label: "معنی واژه‌ها", book: YES, plus: YES },
      { label: "یادگیری واژه با تصویر", book: NO, plus: YES },
      { label: "تمرین املا", book: { state: "part", note: "فهرست واژه" }, plus: { state: "yes", note: "بازی املا" } },
    ],
  },
  {
    title: "تمرین و آزمون",
    rows: [
      { label: "سؤال و تست تمرینی", book: YES, plus: YES },
      { label: "درست یا غلط بودن جواب، همان لحظه", book: NO, plus: YES },
      { label: "آزمون‌های نهایی سال‌های قبل", book: YES, plus: { state: "yes", note: "آنلاین" } },
      { label: "بازی‌های آموزشی", book: NO, plus: YES },
      { label: "تمرین دستور زبان", book: { state: "part", note: "تمرین کتبی" }, plus: { state: "yes", note: "سه بازی" } },
      { label: "تمرین قرابت معنایی", book: { state: "part", note: "چند تست" }, plus: { state: "yes", note: "ترازوی معنا" } },
      { label: "وزن شعر با صدا", book: NO, plus: { state: "yes", note: "رشتهٔ انسانی" } },
      { label: "مرور شب امتحان", book: { state: "part", note: "خلاصهٔ درس" }, plus: YES },
    ],
  },
  {
    title: "دسترسی",
    rows: [
      { label: "پایه‌ها", book: { state: "part", note: "یک پایه" }, plus: { state: "yes", note: "هر سه پایه" } },
      { label: "محتوای تازه در طول سال", book: { state: "no", note: "تا چاپ بعد" }, plus: YES },
    ],
  },
];

/** بهایِ کتابِ کمک‌درسی — زیرِ جدول، برای اینکه ۱۷ تا ۵ با عددِ پول هم دیده شود. */
export const PLUS_COST = {
  name: "کتاب کمک‌درسی فارسی",
  prefix: "بیش از",
  value: "۱٬۱۰۰٬۰۰۰",
  unit: "تومان",
};

/** چهار خطی که زیرِ هر سه پلن می‌آید — از خودِ سایت. */
export const PLUS_FEATURES = [
  "همهٔ درس‌های بازی‌ها، بدون محدودیت روزانه",
  "نقش دستوری، آرایه‌ها و هوشواره در درسنامه",
  "همهٔ امتحان‌های نهایی سال‌های قبل",
  "مرور شب امتحان برای همهٔ درس‌ها",
];

/** متنِ زیرِ هر کارتِ پلن، پیش از دکمه. */
export const PLUS_PREPAID_NOTE = "پیش‌پرداخت است و تمدید خودکار ندارد.";

export const PLUS_RULES_HEADING = "قوانین خرید";

/* هر قانون یک آیکن دارد — از کلاسِ `lucide-*` کنارِ هر `<li>` در سایت. */
export const PLUS_RULES: { icon: LucideIcon; text: string }[] = [
  {
    icon: ScrollText,
    text: "اشتراک پیش‌پرداخت است، تمدید خودکار ندارد و بلافاصله بعد از پرداخت فعال می‌شود.",
  },
  { icon: CalendarPlus, text: "اگر اشتراک فعال داری، مدت جدید به انتهای آن اضافه می‌شود." },
  { icon: UserRound, text: "هر حساب مخصوص یک نفر است و استفادهٔ چند نفر از یک اشتراک مجاز نیست." },
  {
    icon: Landmark,
    text: "اگر مبلغ کم شد و اشتراک فعال نشد، بانک معمولاً تا ۷۲ ساعت آن را برمی‌گرداند. در غیر این صورت به پشتیبانی پیام بده.",
  },
];

/** پایانِ صفحه — بلوکِ پشتیبانی. */
export const PLUS_SUPPORT = { question: "سؤالی داری؟", action: "پشتیبانی" };

export const PLUS_CYCLE: CycleStep[] = [
  { title: "خواندن", body: "درسنامه با نقش و آرایهٔ روی هر بیت." },
  { title: "بازی", body: "هر درس با بازیِ خودش؛ جواب همان لحظه معلوم می‌شود." },
  { title: "امتحان", body: "نهایی‌های سال‌های قبل، با تصحیح فوری." },
  { title: "مرور", body: "شب امتحان، همهٔ درس یک‌جا." },
];

/** سه واژه‌یِ دورِ چرخ در بخشِ «چطور کار می‌کند» — برابرِ سایت زنده. */
export const PLUS_ORBIT_LABELS = ["درس", "بازی", "امتحان"];
