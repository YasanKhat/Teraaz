import type { Chapter } from './types'

export const chapters: Chapter[] = [
  {
    id: 1,
    title: 'تاریخ‌شناسی',
    subtitle: 'چگونه گذشته را می‌خوانیم؟',
    hint: 'ابزار مورخ: منبع، نقد، روایت',
    span: 'درس ۱',
    lessons: [1],
    accent: '#2DD4BF',
    motif: 'astrolabe'
  },
  {
    id: 2,
    title: 'ظهور اسلام',
    subtitle: 'حرکتی تازه در تاریخ بشر',
    hint: 'از مکه تا بغداد؛ ۶۱۰ تا ۶۵۶ م',
    span: 'درس ۲ تا ۷',
    lessons: [2, 3, 4, 5, 6, 7],
    accent: '#E3B45E',
    motif: 'mihrab'
  },
  {
    id: 3,
    title: 'ایران اسلامی',
    subtitle: 'از ورود اسلام تا پایان صفویه',
    hint: 'ایرانیان؛ وارثان تمدن و قدرت',
    span: 'درس ۸ تا ۱۴',
    lessons: [8, 9, 10, 11, 12, 13, 14],
    accent: '#EF8266',
    motif: 'bazaar'
  },
  {
    id: 4,
    title: 'اروپا',
    subtitle: 'از قرون وسطا تا عصر جدید',
    hint: 'رنسانس، اکتشاف، اصلاح دینی',
    span: 'درس ۱۵ و ۱۶',
    lessons: [15, 16],
    accent: '#9B8AFB',
    motif: 'compass'
  }
]

export const chapterById = (id: number): Chapter => chapters.find((c) => c.id === id) ?? chapters[0]

/** جدول بارم‌بندی امتحان نهایی — برگرفته از بخش مشاورهٔ شب امتحان */
export const baramTable: { lesson: number; mid?: string; final?: string }[] = [
  { lesson: 1, mid: '۱', final: '۱' },
  { lesson: 2, mid: '۱ تا ۲', final: '—' },
  { lesson: 3, mid: '۱ تا ۳', final: '۲' },
  { lesson: 4, mid: '۱ تا ۳', final: '—' },
  { lesson: 5, mid: '۱ تا ۳', final: '۱٫۵' },
  { lesson: 6, mid: '۱ تا ۳', final: '—' },
  { lesson: 7, mid: '۱ تا ۳', final: '۱٫۵' },
  { lesson: 8, mid: '۱ تا ۳', final: '—' },
  { lesson: 9, final: '۲' },
  { lesson: 10, final: '۲' },
  { lesson: 11, final: '۱' },
  { lesson: 12, final: '۱' },
  { lesson: 13, final: '۱' },
  { lesson: 14, final: '۱٫۵' },
  { lesson: 15, final: '۲' },
  { lesson: 16, final: '۲' }
]

export const examBlueprint = [
  { row: 'به خاطر بیاورید', types: 'صحیح/غلط، جورکردنی، جای خالی، چهارگزینه‌ای، پاسخ کوتاه', score: '۳' },
  { row: 'تعریف اصطلاحات', types: 'تعریف مفاهیم تاریخی', score: '۲' },
  { row: 'مقایسه', types: 'مقایسهٔ دو پدیدهٔ تاریخی', score: '۲' },
  { row: 'اظهار نظر و قضاوت', types: 'تحلیل و داوری', score: '۲' },
  { row: 'توصیف و طبقه‌بندی', types: 'فهرست کردن و دسته‌بندی', score: '۴' },
  { row: 'کاربست شواهد', types: 'متن تاریخی + پرسش', score: '۱' },
  { row: 'تشریحی', types: 'علل، آثار، نتایج و پیامدها', score: '۶' }
]

export const appMeta = {
  name: 'تبار',
  fullName: 'تبار — تاریخ ۲ یازدهم',
  tagline: 'تاریخ را زندگی کن، نه حفظ کن',
  description:
    'تبار، تاریخ ۲ پایهٔ یازدهم انسانی را به شانزده فیلم درس تبدیل می‌کند: هر درس قاب‌به‌قاب، با نقشه، خط زمان، چهره‌ها، توضیح اصطلاح‌ها و روایت صوتی؛ به‌همراه خط زمان سراسری، کارت‌های مرور و آزمون‌های شبیه‌ساز امتحان نهایی.',
  publisher: 'ماجرای بیست — تاریخ ۲، پایهٔ یازدهم انسانی',
  authorLine: 'بر پایهٔ کتاب درسی تاریخ ۲ و کتاب ماجرای بیست (خیلی سبز)'
}
