/**
 * مدل دادهٔ «تبار» — تاریخ ۲، پایهٔ یازدهم انسانی
 * همهٔ محتوا در فایل‌های دادهٔ محلی نگهداری می‌شود تا برنامه کاملاً آفلاین باشد.
 */

export type ChapterId = 1 | 2 | 3 | 4

export interface Chapter {
  id: ChapterId
  title: string
  subtitle: string
  hint: string
  span: string
  lessons: number[]
  accent: string
  /** نقشِ تزئینی فصل روی جلد */
  motif: 'astrolabe' | 'mihrab' | 'bazaar' | 'compass'
}

export type Block =
  | { t: 'p'; text: string }
  | { t: 'bullets'; items: string[] }
  | { t: 'tip'; title?: string; text: string }
  | { t: 'warn'; title?: string; text: string }
  | { t: 'table'; head: string[]; rows: string[][]; caption?: string }
  | { t: 'quote'; text: string; source?: string }
  | { t: 'cards'; items: { title: string; text: string }[] }
  | { t: 'steps'; items: { title: string; text: string }[] }

export interface Section {
  title: string
  blocks: Block[]
}

export interface Term {
  term: string
  def: string
  /** برابر یا آوانگاری لاتین، برای جست‌وجوی دوگانه */
  latin?: string
}

export type QKind = 'mcq' | 'tf'
export type QLevel = 1 | 2 | 3

export interface QuizQ {
  id: string
  kind: QKind
  prompt: string
  options: string[]
  answer: number
  explain: string
  level: QLevel
  source: 'کتاب درسی' | 'امتحان نهایی' | 'تألیفی'
  /** نشانهٔ سؤال دشوار (نماد موشک در کتاب) */
  rocket?: boolean
}

export interface Lesson {
  id: number
  slug: string
  title: string
  subtitle: string
  chapter: ChapterId
  era: string
  /** بازهٔ زمانی درس، برای نمایش روی جلد */
  span: string
  minutes: number
  level: 1 | 2 | 3
  accent: string
  /** جملهٔ کوتاه روی کارت درس */
  tagline: string
  /** روایت ورودی درس؛ قلابِ داستانی */
  hook: string
  why: string
  keyPoints: string[]
  sections: Section[]
  terms: Term[]
  people: string[]
  events: string[]
  mnemonic: { title: string; text: string }
  examTips: string[]
  quiz: QuizQ[]
  /** بارم امتحان بر اساس جدول بارم کتاب */
  baram: { mid?: string; final?: string }
}

export interface TimelineEvent {
  id: string
  /** سال میلادی برای مرتب‌سازی */
  year: number
  /** برچسب فارسی تاریخ */
  date: string
  title: string
  desc: string
  cat: 'سیاسی' | 'علمی' | 'فرهنگی' | 'مذهبی' | 'اقتصادی' | 'نظامی'
  era: EraId
  lessons: number[]
  place?: string
  importance?: 1 | 2 | 3
}

export type EraId =
  | 'jahiliyya'
  | 'nubuwwat'
  | 'khulafa'
  | 'umavi'
  | 'abbasi'
  | 'irani'
  | 'mongol'
  | 'safavi'
  | 'orupa'

export interface Era {
  id: EraId
  title: string
  from: number
  to: number
  color: string
  note: string
}

export interface Figure {
  id: string
  name: string
  title: string
  type:
    | 'پیامبر و امام'
    | 'خلیفه و پادشاه'
    | 'دانشمند'
    | 'مورخ و ادیب'
    | 'هنرمند'
    | 'فرمانده'
    | 'مذهبی'
  span: string
  place: string
  bio: string
  works: string[]
  lessonIds: number[]
  accent: string
  /** جملهٔ ماندگار یا نکتهٔ کلیدی */
  note: string
}

export interface MapCity {
  id: string
  name: string
  latin: string
  lon: number
  lat: number
  note: string
  lessons: number[]
  /** شهرهای کلیدی برجسته‌تر دیده می‌شوند */
  major?: boolean
}

export interface MapMarker {
  id: string
  name: string
  lon: number
  lat: number
  era: EraId
  lessons: number[]
  detail: string
  kind: 'رویداد' | 'شهر' | 'نبرد' | 'بنا'
}

export interface MapRoute {
  id: string
  title: string
  era: EraId
  color: string
  lessons: number[]
  desc: string
  points: [number, number][]
}

export interface ExamDef {
  id: string
  title: string
  subtitle: string
  term: 'نوبت اول' | 'نوبت دوم'
  minutes: number
  questionIds: string[]
  /** توضیح استراتژی آزمون */
  note: string
}
