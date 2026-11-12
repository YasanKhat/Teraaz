// Structure for the "جفت‌های ادبی" memory-match game.
//
// The deck STRUCTURE (three books × two exam terms) lives here as static
// config. The PAIRS themselves live in the database (table `memory_pairs`) so
// they can be added/edited from the admin panel — see lib/pairs-content.ts for
// the loader and lib/admin/pairs-actions.ts for the admin CRUD.
//
// LITERARY_PAIRS below is the fallback that ships in the box: until an admin
// adds a single pair for a deck, that deck is dealt from this list, so the game
// is never empty on a fresh install.
export type LiteraryPair = {
  work: string;
  author: string;
  /** نشانیِ نگارهٔ این جفت — خالی یعنی هنوز نگاره‌ای ندارد. */
  image?: string;
};

export const MEMORY_GRADES = [
  { id: "dahom", title: "دهم" },
  { id: "yazdahom", title: "یازدهم" },
  { id: "davazdahom", title: "دوازدهم" },
] as const;

export type MemoryGrade = (typeof MEMORY_GRADES)[number]["id"];

export const MEMORY_TERMS = [
  { id: "dey", title: "آزمون دی", hint: "نیمهٔ اول کتاب" },
  { id: "khordad", title: "آزمون خرداد", hint: "نیمهٔ دوم کتاب" },
] as const;

export type MemoryTerm = (typeof MEMORY_TERMS)[number]["id"];

/** Every deck, keyed by grade and then term — the shape the game page hands
 *  to the client so switching grade or term needs no extra round-trip. */
export type MemoryDecks = Record<MemoryGrade, Record<MemoryTerm, LiteraryPair[]>>;

export function isMemoryGrade(value: string): value is MemoryGrade {
  return MEMORY_GRADES.some((g) => g.id === value);
}

export function isMemoryTerm(value: string): value is MemoryTerm {
  return MEMORY_TERMS.some((t) => t.id === value);
}

export function memoryGradeTitle(grade: MemoryGrade): string {
  return MEMORY_GRADES.find((g) => g.id === grade)?.title ?? grade;
}

export function memoryTermTitle(term: MemoryTerm): string {
  return MEMORY_TERMS.find((t) => t.id === term)?.title ?? term;
}

export function emptyMemoryDecks(): MemoryDecks {
  return {
    dahom: { dey: [], khordad: [] },
    yazdahom: { dey: [], khordad: [] },
    davazdahom: { dey: [], khordad: [] },
  };
}

/**
 * دسته‌هایِ واقعیِ «جفت‌های ادبی» — همان که sarvaedu.ir در بسته‌یِ RSC به
 * مرورگر می‌فرستد: همان جفت‌ها، همان ترتیب، همان نگاره‌ها. هشتاد و سه جفت در
 * شش دسته (سه پایه × دو نوبت).
 *
 * این همان چیزی است که پیش از این نبود: برنامه ده جفتِ ساختگیِ بی‌نگاره داشت و
 * همان‌ها را به هر شش دسته می‌چسباند — یعنی دانش‌آموزِ دوازدهم همان جفت‌هایِ
 * دهم را می‌دید و هیچ دسته‌ای شبیهِ آزمونِ واقعی نبود. نگاره‌ها (جلدِ کتاب‌ها)
 * از پیش در public/games/poems بودند و فقط داده به آن‌ها وصل نبود.
 *
 * ⚠️ در دو دسته نامِ نویسنده تکرار می‌شود: «سعدی» برای بوستان و گلستان،
 * «جامی» برای بهارستان و تحفه الاحرار، «عطار نیشابوری» برای تذکره الاولیا و
 * اسرارنامه (یازدهم/دی)، و «مولوی» برای فیه ما فیه و مثنوی معنوی
 * (دوازدهم/دی). پس در زمین دو کارتِ هم‌نام هست و تنها یکی با اثرِ داده‌شده
 * جفت می‌شود — چون جفت شدن با `pairId` است و نه با متن. این رفتارِ خودِ
 * سایت است، با همه‌یِ ناعادلانه بودنش، و «عین سایت» یعنی همین را هم داشته
 * باشیم.
 *
 * ⚠️ ترتیب معنا دارد: دست‌ها به ترتیبِ همین فهرست افراز می‌شوند، پس همان
 * ترتیبی که سایت فرستاده نگه داشته شده و نه مرتب‌سازیِ الفبایی.
 */
export const LITERARY_DECKS: MemoryDecks = {
  dahom: {
    dey: [
      { work: "الهی‌نامه", author: "عطار نیشاپوری", image: "/games/poems/10/dah-14.webp" },
      { work: "چشمه", author: "نیما یوشیج (علی اسفندیاری)", image: "/games/poems/10/dah-24.webp" },
      { work: "کلیله و دمنه", author: "ترجمه نصرالله منشی", image: "/games/poems/10/dah-23.webp" },
      { work: "قابوس‌نامه", author: "عنصرالمعالی کیکاووس", image: "/games/poems/10/dah-15.webp" },
      { work: "دیوار", author: "جمال میرصادقی", image: "/games/poems/10/dah-5.webp" },
      { work: "گوشواره عرش", author: "سیدعلی موسوی گرمارودی", image: "/games/poems/10/dah-12.webp" },
      { work: "سیاست‌نامه", author: "خواجه نظام‌الملک", image: "/games/poems/10/dah-7.webp" },
      { work: "اسرارالتوحید", author: "محمد بن منور", image: "/games/poems/10/dah-25.webp" },
      { work: "تفسیر سوره یوسف", author: "احمد بن محمد بن زید طوسی", image: "/games/poems/10/dah-1.webp" },
      { work: "سفرنامه", author: "ناصر خسرو", image: "/games/poems/10/dah-21.webp" },
      { work: "گلستان", author: "سعدی", image: "/games/poems/10/dah-10.webp" },
      { work: "اتاق آبی", author: "سهراب سپهری", image: "/games/poems/10/dah-11.webp" },
      { work: "ازریابی شتاب‌زده", author: "جلال آل احمد", image: "/games/poems/10/dah-4.webp" },
    ],
    khordad: [
      { work: "خاک آزادگان", author: "سپیده کاشانی", image: "/games/poems/10/dah-8.webp" },
      { work: "من زنده ام", author: "معصومه آباد", image: "/games/poems/10/dah-19.webp" },
      { work: "شاهنامه", author: "فردوسی", image: "/games/poems/10/dah-17.webp" },
      { work: "دلیران و مردان ایران زمین", author: "محمود شاهرخی", image: "/games/poems/10/dah-18.webp" },
      { work: "مثنوی معنوی", author: "مولانا", image: "/games/poems/10/dah-20.webp" },
      { work: "اخلاق محسنی", author: "حسین واعظ کاشفی", image: "/games/poems/10/dah-6.webp" },
      { work: "خسرو", author: "عبدالحسین وجدانی", image: "/games/poems/10/dah-13.webp" },
      { work: "جوامع الحکایات و لوامع الروایات", author: "سدید الدین محمد عوفی", image: "/games/poems/10/dah-9.webp" },
      { work: "سمفونی پنجم جنوب", author: "نزار قبانی", image: "/games/poems/10/dah-22.webp" },
      { work: "مزار شاعر", author: "فرانسوا کوپه", image: "/games/poems/10/dah-16.webp" },
      { work: "مائده‌های زمینی", author: "آندره ژید", image: "/games/poems/10/dah-2.webp" },
      { work: "سه پرسش", author: "تولستوی", image: "/games/poems/10/dah-3.webp" },
    ],
  },
  yazdahom: {
    dey: [
      { work: "فرهاد و شیرین", author: "وحشی بافقی", image: "/games/poems/11/yaz-31.webp" },
      { work: "بوستان", author: "سعدی", image: "/games/poems/11/yaz-11.webp" },
      { work: "بهارستان", author: "جامی", image: "/games/poems/11/yaz-4.webp" },
      { work: "تاریخ بیهقی", author: "ابوالفضل بیهقی", image: "/games/poems/11/yaz-1.webp" },
      { work: "تحفه الاحرار", author: "جامی", image: "/games/poems/11/yaz-5.webp" },
      { work: "در امواج سند", author: "مهدی حمیدی شیرازی", image: "/games/poems/11/yaz-25.webp" },
      { work: "گلستان", author: "سعدی", image: "/games/poems/11/yaz-12.webp" },
      { work: "عباس میرزا آغازگری تنها", author: "مجید واعظی", image: "/games/poems/11/yaz-21.webp" },
      { work: "زندان موصل", author: "کامور بخشایش", image: "/games/poems/11/yaz-18.webp" },
      { work: "لیلی و مجنون", author: "نظامی گنجه ای", image: "/games/poems/11/yaz-30.webp" },
      { work: "تذکره الاولیا", author: "عطار نیشابوری", image: "/games/poems/11/yaz-16.webp" },
      { work: "مرصاد العباد من المبدأ الى المعاد", author: "نجم الدین رازی (معروف به نجم دایه)", image: "/games/poems/11/yaz-28.webp" },
      { work: "غزلیات شمس", author: "جلال الدین محمد مولوی", image: "/games/poems/11/yaz-26.webp" },
      { work: "زندگانی جلال الدین محمد مشهور به مولوی", author: "بدیع الزمان فروزان فر", image: "/games/poems/11/yaz-3.webp" },
      { work: "الهی نامه", author: "سنایی غزنوی", image: "/games/poems/11/yaz-13.webp" },
      { work: "اسرارنامه", author: "عطار نیشابوری", image: "/games/poems/11/yaz-15.webp" },
      { work: "اسرار التوحيد", author: "محمد بن منور", image: "/games/poems/11/yaz-22.webp" },
      { work: "روزها", author: "دکتر محمد علی اسلامی ندوشن", image: "/games/poems/11/yaz-23.webp" },
      { work: "میثاق دوستی", author: "لطفعلی صورتگر", image: "/games/poems/11/yaz-19.webp" },
    ],
    khordad: [
      { work: "بانگ جرس", author: "حمید سبزواری", image: "/games/poems/11/yaz-7.webp" },
      { work: "هم صدا با حلق اسماعیل", author: "سید حسن حسینی", image: "/games/poems/11/yaz-14.webp" },
      { work: "شاهنامه", author: "فردوسی", image: "/games/poems/11/yaz-17.webp" },
      { work: "روضه خلد", author: "مجد خوافی", image: "/games/poems/11/yaz-20.webp" },
      { work: "حمله حیدری", author: "باذل مشهدی", image: "/games/poems/11/yaz-2.webp" },
      { work: "کلیله و دمنه", author: "ترجمه ابوالمعالی نصرالله منشی", image: "/games/poems/11/yaz-29.webp" },
      { work: "جوامع الحكايات و لوامع الروايات", author: "محمد عوفی", image: "/games/poems/11/yaz-24.webp" },
      { work: "شلوارهای وصله دار", author: "رسول پرویزی", image: "/games/poems/11/yaz-9.webp" },
      { work: "سه دیدار", author: "نادر ابراهیمی", image: "/games/poems/11/yaz-27.webp" },
      { work: "ماه نو و مرغان آواره", author: "را بیندرانات تاگور", image: "/games/poems/11/yaz-8.webp" },
      { work: "پیامبر و دیوانه", author: "جبران خلیل جبران", image: "/games/poems/11/yaz-6.webp" },
      { work: "پرنده ای به نام آذرباد", author: "ریچارد باخ", image: "/games/poems/11/yaz-10.webp" },
    ],
  },
  davazdahom: {
    dey: [
      { work: "گلستان", author: "سعدی", image: "/games/poems/12/davaz-5.webp" },
      { work: "کلیله و دمنه", author: "نصرالله منشی", image: "/games/poems/12/davaz-26.webp" },
      { work: "روایت سنگرسازان ۲", author: "عیسی سلمانی لطف‌آبادی", image: "/games/poems/12/davaz-15.webp" },
      { work: "قصیده دماوندیه", author: "محمدتقی بهار", image: "/games/poems/12/davaz-20.webp" },
      { work: "قصه شیرین فرهاد", author: "احمد عربلو", image: "/games/poems/12/davaz-1.webp" },
      { work: "فیه ما فیه", author: "مولوی", image: "/games/poems/12/davaz-24.webp" },
      { work: "فی حقیقت العشق", author: "شهاب‌الدین سهروردی", image: "/games/poems/12/davaz-10.webp" },
      { work: "تمهیدات", author: "عین‌القضات همدانی", image: "/games/poems/12/davaz-16.webp" },
      { work: "مثل درخت در شب باران", author: "محمدرضا شفیعی کدکنی", image: "/games/poems/12/davaz-8.webp" },
      { work: "از پاریز تا پاریس", author: "محمدابراهیم باستانی پاریزی", image: "/games/poems/12/davaz-18.webp" },
      { work: "تذکره‌الاولیا", author: "عطار", image: "/games/poems/12/davaz-12.webp" },
      { work: "کویر", author: "علی شریعتی", image: "/games/poems/12/davaz-14.webp" },
      { work: "مثنوی معنوی", author: "مولوی", image: "/games/poems/12/davaz-25.webp" },
      { work: "بخارای من، ایل من", author: "محمد بهمن‌بیگی", image: "/games/poems/12/davaz-19.webp" },
    ],
    khordad: [
      { work: "قصه‌های دوشنبه", author: "آلفونس دوده", image: "/games/poems/12/davaz-2.webp" },
      { work: "هوا را از من بگیر، خنده‌ات را نه", author: "پابلو نرودا", image: "/games/poems/12/davaz-3.webp" },
      { work: "ارمیا", author: "رضا امیرخانی", image: "/games/poems/12/davaz-4.webp" },
      { work: "دری به خانهٔ خورشید", author: "سلمان هراتی", image: "/games/poems/12/davaz-6.webp" },
      { work: "سانتاماریا", author: "سیدمهدی شجاعی", image: "/games/poems/12/davaz-7.webp" },
      { work: "غزلواره‌ها", author: "شکسپیر", image: "/games/poems/12/davaz-9.webp" },
      { work: "سندبادنامه", author: "ظهیری سمرقندی", image: "/games/poems/12/davaz-11.webp" },
      { work: "منطق‌الطیر", author: "عطار نیشابوری", image: "/games/poems/12/davaz-13.webp" },
      { work: "شاهنامه", author: "فردوسی", image: "/games/poems/12/davaz-17.webp" },
      { work: "تیرانا", author: "محمدرضا رحمانی (مهرداد اوستا)", image: "/games/poems/12/davaz-21.webp" },
      { work: "کباب غاز", author: "محمدعلی جمالزاده", image: "/games/poems/12/davaz-22.webp" },
      { work: "در حیاط کوچک پاییز در زندان", author: "مهدی اخوان ثالث", image: "/games/poems/12/davaz-23.webp" },
      { work: "بینوایان", author: "ویکتور هوگو", image: "/games/poems/12/davaz-27.webp" },
    ],
  },

};


/** یک کارتِ رویِ زمین. هر جفت دو کارت می‌سازد: یکی اثر، یکی پدیدآورنده. */
export type MemoryCard = {
  id: number;
  pairId: number;
  kind: "work" | "author";
  text: string;
  /** نگارهٔ جفت — روی هر دو کارتِ یک جفت یکسان است. */
  image: string;
};

/** بیشترین جفت در یک «دست».
 *
 *  ⚠️ این عدد از ۱۵ به ۶ آمد، و تغییرش یک تنظیمِ سلیقه‌ای نیست.
 *
 *  پانزده جفت یعنی سی کارت: زمینی که روی موبایل یک‌جا دیده نمی‌شود و دوری
 *  که آن‌قدر طول می‌کشد که نیمه‌کاره رها شود. شش جفت یعنی دوازده کارت — سه
 *  ردیفِ چهارتایی، یک صفحه، یک نفس.
 *
 *  و «بقیهٔ دسته چه می‌شود» جوابِ تازه‌ای گرفت: به‌جای اینکه هر دور یک
 *  زیرمجموعهٔ تصادفی باشد و باقی جفت‌ها شانسی دیده شوند، کلِ دسته به چند
 *  **دستِ پشتِ‌هم** تقسیم می‌شود. ← memoryRoundSizes */
export const MEMORY_ROUND_PAIRS = 6;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * یک دسته با `total` جفت، به چند دست و هرکدام با چند جفت.
 *
 * ⚠️ دست‌ها **هم‌اندازه** بسته می‌شوند و نه «شش‌تا شش‌تا تا هرچه ماند».
 *
 * هجده جفت در هر دو حالت سه دست است، ولی هفت جفت با تقسیمِ ساده می‌شد
 * ۶ + ۱: یک دستِ کامل و بعد یک دستِ تک‌جفتی که نه بازی است و نه آزمون.
 * تقسیمِ متوازن همان را ۴ + ۳ می‌کند. `splitEvenly` باقی‌مانده را بین
 * دست‌های اول پخش می‌کند، پس هیچ دستی بیش از یکی از بقیه کوچک‌تر نیست.
 *
 * ⚠️ و هر اندازه‌ای پذیرفته نمی‌شود: اگر تقسیمِ متوازن دستی بسازد که
 * زمینش ردیفِ ناقص بدهد، یک دستِ بیشتر امتحان می‌شود. قاعدهٔ «کارتِ تنها
 * ممنوع» بالاتر از تعدادِ دست‌هاست.
 */
export function memoryRoundSizes(total: number): number[] {
  const n = Math.max(0, Math.floor(total));
  if (n === 0) return [];

  for (let rounds = Math.ceil(n / MEMORY_ROUND_PAIRS); rounds < n; rounds++) {
    // دو نامزد با *همان* تعداد دست: تقسیمِ متوازن، و پر کردنِ دست‌ها تا سقف
    // و ریختنِ باقی در آخری. هیچ‌کدام همیشه بهتر نیست —
    //   ۷ جفت:  متوازن ۴+۳   ولی پرکردن ۶+۱  (دستِ تک‌جفتی، بی‌معنا)
    //   ۱۰ جفت: متوازن ۵+۵   ولی پرکردن ۶+۴  (هر دو زمینِ چهارستونی)
    // پس هر دو ساخته می‌شوند و کم‌هزینه‌ترین برنده است.
    const candidates = [splitEvenly(n, rounds), splitToFull(n, rounds)];
    const usable = candidates.filter((s) => s.length === rounds && s.every(fitsMemoryGrid));
    if (usable.length === 0) continue;

    return usable.reduce((best, s) => (sizeCost(s) < sizeCost(best) ? s : best));
  }
  // نگهبانِ آخر: هر دست یک جفت. دو کارت همیشه یک ردیفِ کامل است، پس این
  // شاخه هرگز ردیفِ ناقص نمی‌دهد — و عملاً هم هرگز به آن نمی‌رسیم.
  return splitEvenly(n, n);
}

function splitEvenly(total: number, rounds: number): number[] {
  const base = Math.floor(total / rounds);
  const extra = total % rounds;
  return Array.from({ length: rounds }, (_, i) => base + (i < extra ? 1 : 0));
}

/** دست‌ها تا سقف پر می‌شوند و باقی‌مانده دستِ آخر است. */
function splitToFull(total: number, rounds: number): number[] {
  const rest = total - MEMORY_ROUND_PAIRS * (rounds - 1);
  if (rest < 1) return [];
  return [...Array.from({ length: rounds - 1 }, () => MEMORY_ROUND_PAIRS), rest];
}

/** هزینهٔ یک اندازه، از نگاهِ کسی که زمین را می‌بیند.
 *
 *  شش و چهار جفت هر دو زمینِ چهارستونی می‌دهند و بی‌هزینه‌اند. پنج و سه
 *  کار می‌کنند ولی ستون‌بندیِ دیگری دارند، پس در یک نشست کنارِ دستِ
 *  شش‌تایی ناهماهنگ به نظر می‌رسند. یک و دو جفت اصلاً «دست» نیستند: چهار
 *  کارت را کسی به‌خاطر نمی‌سپارد، نگاه می‌کند. */
const SIZE_COST: Record<number, number> = { 1: 6, 2: 5, 3: 1, 4: 0, 5: 1, 6: 0 };

function sizeCost(sizes: number[]): number {
  return sizes.reduce((sum, s) => sum + (SIZE_COST[s] ?? 0), 0);
}

/** آیا دستی با `pairs` جفت، زمینی با ردیف‌های پر می‌سازد؟
 *
 *  ⚠️ فقط زمینِ **صفحهٔ بزرگ** سنجیده می‌شود و نه موبایل، و این عمدی است.
 *
 *  تا دیروز هر دو سنجیده می‌شدند و همین، اندازهٔ دست‌ها را به ستون‌بندیِ
 *  موبایل گره می‌زد — گرهی که به ضررِ هر دو تمام می‌شد. زمینِ موبایل حالا
 *  `flex` است و ردیفِ ناتمامش **وسط‌چین** می‌شود، پس دیگر «ردیفِ ناقص»
 *  ندارد که جلویش گرفته شود. (همان استدلالی که صفحهٔ مرورِ همین بازی از
 *  اول با آن نوشته شده بود.)
 *
 *  اگر این شرط برمی‌گشت، برای رسیدن به یک `base` ِ قابل قبول باید
 *  دست‌های پنج‌جفتی حذف می‌شدند — و آن‌وقت دسته‌ای با ۱۳ جفت به
 *  ۶ + ۶ + ۱ می‌رسید: یک دستِ **تک‌جفتی**، که دقیقاً همان چیزی است که
 *  `memoryRoundSizes` برای جلوگیری از آن نوشته شد. */
export function fitsMemoryGrid(pairs: number): boolean {
  const cards = pairs * 2;
  return fillsRows(cards, memoryGridColumns(cards).wide);
}

/**
 * دسته را به دست‌های این نشست تقسیم می‌کند.
 *
 * ⚠️ این یک **افراز** است و نه چند نمونه‌گیریِ مستقل: کل دسته یک بار بُر
 * می‌خورد و بعد تکه‌تکه می‌شود، پس هر جفت دقیقاً در یکی از دست‌ها می‌آید.
 *
 * دلیلش مستقیماً آموزشی است: وقتی به دانش‌آموز می‌گوییم «این آزمون سه دست
 * است»، آن جمله فقط وقتی راست است که سه دست *همهٔ* آزمون باشند. با
 * نمونه‌گیریِ تصادفی ممکن بود یک جفت سه بار بیاید و جفتِ دیگری هیچ‌وقت.
 */
export function buildMemoryRounds(pairs: LiteraryPair[]): LiteraryPair[][] {
  const shuffled = shuffle(pairs);
  const rounds: LiteraryPair[][] = [];
  let at = 0;
  for (const size of memoryRoundSizes(shuffled.length)) {
    rounds.push(shuffled.slice(at, at + size));
    at += size;
  }
  return rounds;
}

/** کارت‌های یک دست: هر جفت دو کارت — اثر و پدیدآورنده — بُرخورده.
 *
 *  اینجا دیگر هیچ چیزی کنار گذاشته نمی‌شود؛ اندازهٔ دست را
 *  `buildMemoryRounds` از قبل تعیین کرده است. */
export function buildMemoryDeck(pairs: LiteraryPair[]): MemoryCard[] {
  const cards: MemoryCard[] = [];
  pairs.forEach((p, pairId) => {
    // تصویر روی *هر دو* کارتِ یک جفت می‌نشیند، نه فقط کارتِ پدیدآورنده: صفحهٔ
    // مرور جفت‌ها را از روی همین دسته بازسازی می‌کند، و این‌طور هر کدام از دو
    // کارت که اول دیده شود، نگاره‌اش را همراه دارد.
    cards.push({ id: pairId * 2, pairId, kind: "work", text: p.work, image: p.image ?? "" });
    cards.push({ id: pairId * 2 + 1, pairId, kind: "author", text: p.author, image: p.image ?? "" });
  });
  return shuffle(cards);
}

/** آیا `cardCount` کارت در `cols` ستون، ردیف‌های پر می‌سازد؟
 *
 *  یک ردیفِ ناقص وقتی *تنها ردیف* است اشکالی ندارد — چهار کارت در شش ستون
 *  یک خطِ کوتاه است، نه یک دُمِ سرگردان. */
function fillsRows(cardCount: number, cols: number): boolean {
  return cardCount % cols === 0 || cardCount <= cols;
}

/** چند ستون برای زمینی با `cardCount` کارت — روی موبایل (`base`) و روی صفحهٔ
 *  بزرگ (`wide`).
 *
 *  کارت نسبتِ ۳:۴ خودش را نگه می‌دارد و با زیاد شدنِ ستون‌ها فقط کوچک‌تر
 *  می‌شود. */
export function memoryGridColumns(cardCount: number): { base: number; wide: number } {
  return { base: mobileColumns(cardCount), wide: fitColumns(cardCount, 3, 6) };
}

/**
 * ستون‌بندیِ موبایل — همیشه سه یا چهار.
 *
 * =============================================================================
 * ⚠️ چرا این تابع جدا شد و چرا دیگر «مقسوم‌علیه» شرط نیست
 * =============================================================================
 *
 * نسخهٔ قبلی همان `fitColumns` را با `min = 2` صدا می‌زد. نتیجه‌اش برای
 * دستِ **پنج‌جفتی** — که دستِ نادری هم نیست؛ دسته‌های ۵، ۱۱، ۱۳ و ۱۷ جفتی
 * همه یکی دارند — این بود: ده کارت، و تنها مقسوم‌علیهِ ۱۰ در بازهٔ ۲ تا ۴
 * عددِ **۲** است.
 *
 * دو ستون یعنی روی یک گوشیِ ۳۶۰ پیکسلی، کارت‌هایی با عرضِ ۱۷۰ و ارتفاعِ
 * ۲۳۰ پیکسل، در **پنج ردیف**: زمینی که یک‌سومش در هر لحظه دیده می‌شود.
 * بازیِ حافظه‌ای که برای دیدنِ نصفِ زمینش باید اسکرول کنی، بازیِ حافظه
 * نیست.
 *
 * پس شرطِ مقسوم‌علیه بودن اینجا برداشته شد. بهایش یک ردیفِ ناتمام است، و
 * آن بها با چیدمانِ `flex` و `justify-center` پرداخت می‌شود: ردیفِ آخرِ
 * وسط‌چین یک خطِ کوتاهِ عمدی به نظر می‌رسد و نه یک خانهٔ خالیِ شبکه.
 *
 * ⚠️ ولی یک چیز هنوز ممنوع است: **کارتِ تنها**. ردیفی با یک کارت، حتی
 * وسط‌چین، شبیه اشتباه است. برای همین «باقی‌ماندهٔ ۱» بدترین امتیاز را
 * می‌گیرد — ده کارت به چهار ستون می‌رود (۴+۴+۲) و نه سه ستون
 * (۳+۳+۳+۱).
 */
function mobileColumns(cardCount: number): number {
  /* هزینهٔ یک ستون‌بندی: ردیفِ آخرِ پر بهترین، ردیفِ آخرِ تک‌کارته بدترین. */
  const cost = (cols: number): number => {
    if (cardCount % cols === 0 || cardCount <= cols) return 0;
    return cardCount % cols === 1 ? 2 : 1;
  };

  /* ⚠️ چهار اول امتحان می‌شود و در تساوی هم برنده می‌ماند: ستونِ بیشتر
     یعنی ردیفِ کمتر، و کمتر بودنِ ردیف تمامِ دلیلِ وجودِ این تابع است. */
  return cost(4) <= cost(3) ? 4 : 3;
}

/** نزدیک‌ترین ستون‌بندی به یک زمینِ مربع — ولی **فقط از میان مقسوم‌علیه‌های**
 *  تعداد کارت.
 *
 *  ⚠️ نسخهٔ پیشین برعکس کار می‌کرد: اول عددِ مربع‌ساز را حساب می‌کرد و بعد
 *  «اگر ارزان بود» آن را به یک مقسوم‌علیه هُل می‌داد. یعنی راگی بودنِ ردیفِ
 *  آخر یک خروجیِ ممکن بود. حالا نیست؛ و چون `memoryRoundPairs` تعداد کارت را
 *  طوری انتخاب می‌کند که همیشه مقسوم‌علیهِ خوبی داشته باشد، آن `ideal` انتهای
 *  تابع فقط برای دسته‌های خیلی کوچک می‌ماند (مثلاً دو کارت، که یک ردیفِ
 *  کوتاه است و نه یک دُم).
 *
 *  گره‌ها به نفعِ ستونِ بیشتر باز می‌شوند، یعنی ردیفِ کمتر. */
function fitColumns(cardCount: number, min: number, max: number): number {
  const ideal = Math.min(max, Math.max(min, Math.round(Math.sqrt(cardCount * 1.4))));

  let best: number | null = null;
  for (let c = min; c <= max; c++) {
    if (cardCount % c !== 0) continue;
    if (
      best === null ||
      Math.abs(c - ideal) < Math.abs(best - ideal) ||
      (Math.abs(c - ideal) === Math.abs(best - ideal) && c > best)
    ) {
      best = c;
    }
  }

  return best ?? ideal;
}
