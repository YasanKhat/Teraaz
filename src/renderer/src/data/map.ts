import type { MapCity, MapMarker, MapRoute } from './types'

export const cities: MapCity[] = [
  { id: 'mecca', name: 'مکه', latin: 'Mecca', lon: 39.826, lat: 21.422, note: 'زادگاه پیامبر، کعبه و کانون دعوت در ۱۳ سال نخست.', lessons: [3], major: true },
  { id: 'medina', name: 'مدینه', latin: 'Medina', lon: 39.614, lat: 24.469, note: 'پایتخت حکومت نبوی؛ محل هجرت و پیمان‌نامهٔ عمومی.', lessons: [4, 5], major: true },
  { id: 'jerusalem', name: 'بیت‌المقدس', latin: 'Jerusalem', lon: 35.214, lat: 31.768, note: 'مقصد اسراء و معراج؛ از کانون‌های جنگ‌های صلیبی.', lessons: [3, 15], major: true },
  { id: 'damascus', name: 'دمشق', latin: 'Damascus', lon: 36.292, lat: 33.514, note: 'پایتخت خلافت اموی و پایگاه قدرت معاویه.', lessons: [5, 6], major: true },
  { id: 'kufa', name: 'کوفه', latin: 'Kufa', lon: 44.4, lat: 32.03, note: 'پایتخت امام علی (ع) و کانون قیام‌های شیعی و مختار.', lessons: [5, 6] },
  { id: 'basra', name: 'بصره', latin: 'Basra', lon: 47.81, lat: 30.508, note: 'شهر نظامی و تجاری؛ محل جنگ جمل.', lessons: [5] },
  { id: 'baghdad', name: 'بغداد', latin: 'Baghdad', lon: 44.362, lat: 33.315, note: 'پایتخت عباسیان، بیت‌الحکمه و مرکز نهضت ترجمه.', lessons: [7, 10, 11], major: true },
  { id: 'samarra', name: 'سامرا', latin: 'Samarra', lon: 43.876, lat: 34.198, note: 'پایتخت موقت عباسیان در دورهٔ ضعف و تجزیه.', lessons: [7] },
  { id: 'cairo', name: 'قاهره', latin: 'Cairo', lon: 31.236, lat: 30.044, note: 'بنیان‌گذاری فاطمیان و مرکز رقابت با عباسیان.', lessons: [7], major: true },
  { id: 'alexandria', name: 'اسکندریه', latin: 'Alexandria', lon: 29.919, lat: 31.2, note: 'در فتوحات مصر به دست مسلمانان افتاد.', lessons: [5] },
  { id: 'constantinople', name: 'قسطنطنیه', latin: 'Constantinople', lon: 28.978, lat: 41.008, note: 'پایتخت بیزانس؛ چند بار محاصره و در ۱۴۵۳ فتح شد.', lessons: [6, 15, 16], major: true },
  { id: 'rome', name: 'روم', latin: 'Rome', lon: 12.496, lat: 41.903, note: 'مرکز کلیسای کاتولیک و امپراتوری مقدس روم.', lessons: [15, 16], major: true },
  { id: 'florence', name: 'فلورانس', latin: 'Florence', lon: 11.256, lat: 43.77, note: 'خاستگاه رنسانس و کانون هنر و بانکداری.', lessons: [16], major: true },
  { id: 'venice', name: 'ونیزی', latin: 'Venice', lon: 12.316, lat: 45.441, note: 'دریابندری قدرتمند و دروازهٔ تجارت شرق در قرون وسطا.', lessons: [15] },
  { id: 'paris', name: 'پاریس', latin: 'Paris', lon: 2.352, lat: 48.857, note: 'مرکز پادشاهی فرانسه و یکی از کانون‌های تحولات عصر جدید.', lessons: [15, 16] },
  { id: 'london', name: 'لندن', latin: 'London', lon: -0.128, lat: 51.507, note: 'پادشاهی انگلستان؛ بازیگر تجارت و استعمار عصر جدید.', lessons: [15, 16] },
  { id: 'cordoba', name: 'قرطبه', latin: 'Córdoba', lon: -4.779, lat: 37.892, note: 'پایتخت اندلس اسلامی و کانون فلسفه و علم.', lessons: [6, 16], major: true },
  { id: 'lisbon', name: 'لیسبون', latin: 'Lisbon', lon: -9.139, lat: 38.722, note: 'بندر پرتغال؛ آغازگاه سفرهای اکتشافی.', lessons: [16] },
  { id: 'isfahan', name: 'اصفهان', latin: 'Isfahan', lon: 51.666, lat: 32.655, note: 'پایتخت شاه عباس و نماد شکوه معماری صفوی.', lessons: [13, 14], major: true },
  { id: 'tabriz', name: 'تبریز', latin: 'Tabriz', lon: 46.292, lat: 38.08, note: 'نخستین پایتخت صفوی و مرکز ایلخانان.', lessons: [11, 13], major: true },
  { id: 'qazvin', name: 'قزوین', latin: 'Qazvin', lon: 49.998, lat: 36.269, note: 'پایتخت صفوی پیش از انتقال به اصفهان.', lessons: [13] },
  { id: 'ray', name: 'ری', latin: 'Ray', lon: 51.435, lat: 35.589, note: 'شهر کهن و زادگاه رازی؛ از کانون‌های علمی ایران.', lessons: [9] },
  { id: 'nishapur', name: 'نیشابور', latin: 'Nishapur', lon: 58.795, lat: 36.213, note: 'کانون علم و ادب خراسان؛ زادگاه خیام و عطار.', lessons: [9, 10], major: true },
  { id: 'tus', name: 'طوس', latin: 'Tus', lon: 59.5, lat: 36.48, note: 'زادگاه فردوسی و نظام‌الملک؛ آرامگاه خواجه.', lessons: [10], major: true },
  { id: 'marv', name: 'مرو', latin: 'Merv', lon: 61.833, lat: 37.6, note: 'کلان‌شهر خراسان در مسیر جادهٔ ابریشم.', lessons: [9, 10, 11], major: true },
  { id: 'bukhara', name: 'بخارا', latin: 'Bukhara', lon: 64.423, lat: 39.768, note: 'پایتخت سامانیان و مرکز شکوفایی زبان فارسی.', lessons: [9], major: true },
  { id: 'samarkand', name: 'سمرقند', latin: 'Samarkand', lon: 66.975, lat: 39.627, note: 'پایتخت تیمور و کانون هنر و معماری تیموری.', lessons: [11, 12], major: true },
  { id: 'urgench', name: 'خوارزم', latin: 'Urgench', lon: 59.15, lat: 42.33, note: 'پایتخت خوارزمشاهیان و نخستین قربانی حملهٔ مغول.', lessons: [10, 11] },
  { id: 'ghazna', name: 'غزنه', latin: 'Ghazna', lon: 68.417, lat: 33.55, note: 'پایتخت غزنویان و دربار محمود.', lessons: [10], major: true },
  { id: 'herat', name: 'هرات', latin: 'Herat', lon: 62.2, lat: 34.35, note: 'کانون هنر تیموری و پایتخت شاهرخ.', lessons: [11, 12] },
  { id: 'balkh', name: 'بلخ', latin: 'Balkh', lon: 66.898, lat: 36.757, note: 'شهر کهن خراسان؛ زادگاه مولانا.', lessons: [12] },
  { id: 'zabol', name: 'سیستان', latin: 'Sistan', lon: 61.5, lat: 31.0, note: 'خاستگاه صفاریان و عیاران.', lessons: [9] },
  { id: 'hamadan', name: 'همدان', latin: 'Hamadan', lon: 48.515, lat: 34.798, note: 'شهر کهن ماد؛ آرامگاه ابن‌سینا.', lessons: [5, 9] },
  { id: 'shiraz', name: 'شیراز', latin: 'Shiraz', lon: 52.584, lat: 29.592, note: 'شهر سعدی و حافظ و ملاصدرا.', lessons: [1, 12, 14] },
  { id: 'mashhad', name: 'مشهد', latin: 'Mashhad', lon: 59.606, lat: 36.297, note: 'مسجد گوهرشاد؛ نماد معماری تیموری.', lessons: [12] },
  { id: 'ardabil', name: 'اردبیل', latin: 'Ardabil', lon: 48.293, lat: 38.25, note: 'خاستگاه طریقت صفویه.', lessons: [13] },
  { id: 'konya', name: 'قونیه', latin: 'Konya', lon: 32.485, lat: 37.875, note: 'شهر مولانا و پایگاه سلجوقیان روم.', lessons: [12, 15] },
  { id: 'delhi', name: 'دهلی', latin: 'Delhi', lon: 77.209, lat: 28.614, note: 'مقصد فتوحات غزنویان و مرکز سلطنت‌های هند.', lessons: [10] }
]

export const markers: MapMarker[] = [
  { id: 'm-badr', name: 'بدر', lon: 38.79, lat: 23.78, era: 'nubuwwat', lessons: [4], detail: 'نخستین نبرد بزرگ مسلمانان با مشرکان مکه (۲ هـ.ق).', kind: 'نبرد' },
  { id: 'm-ohod', name: 'اُحُد', lon: 39.65, lat: 24.5, era: 'nubuwwat', lessons: [4], detail: 'نبرد ۳ هـ.ق در دامنهٔ کوه احد؛ درس فرمان‌پذیری.', kind: 'نبرد' },
  { id: 'm-khandaq', name: 'خندق', lon: 39.6, lat: 24.47, era: 'nubuwwat', lessons: [4], detail: 'جنگ احزاب در ۵ هـ.ق با تدبیر سلمان فارسی.', kind: 'نبرد' },
  { id: 'm-hudaybiyya', name: 'حدیبیه', lon: 39.6, lat: 21.3, era: 'nubuwwat', lessons: [4], detail: 'پیمان صلح ۶ هـ.ق؛ فرصت دعوت امپراتوری‌ها.', kind: 'رویداد' },
  { id: 'm-ghadir', name: 'غدیر خم', lon: 39.4, lat: 22.75, era: 'nubuwwat', lessons: [4], detail: 'معرفی امام علی (ع) به جانشینی در حجةالوداع.', kind: 'رویداد' },
  { id: 'm-qadisiya', name: 'قادسیه', lon: 43.9, lat: 31.7, era: 'khulafa', lessons: [5, 8], detail: 'شکست ساسانیان از مسلمانان در ۱۵ هـ.ق.', kind: 'نبرد' },
  { id: 'm-nahavand', name: 'نهاوند', lon: 48.38, lat: 34.19, era: 'khulafa', lessons: [5, 8], detail: 'فتح‌الفتوح؛ قطعی شدن سرنوشت ساسانیان (۲۱ هـ.ق).', kind: 'نبرد' },
  { id: 'm-jamal', name: 'جمل', lon: 47.81, lat: 30.51, era: 'khulafa', lessons: [5], detail: 'نخستین جنگ داخلی مسلمانان در ۳۶ هـ.ق.', kind: 'نبرد' },
  { id: 'm-siffin', name: 'صفین', lon: 39.0, lat: 35.95, era: 'khulafa', lessons: [5, 6], detail: 'رویارویی امام علی (ع) و معاویه و ماجرای حکمیت.', kind: 'نبرد' },
  { id: 'm-nahrawan', name: 'نهروان', lon: 44.33, lat: 34.0, era: 'khulafa', lessons: [5], detail: 'جنگ با خوارج در ۳۸ هـ.ق.', kind: 'نبرد' },
  { id: 'm-karbala', name: 'کربلا', lon: 44.033, lat: 32.617, era: 'umavi', lessons: [6], detail: 'شهادت امام حسین (ع) و یارانش در ۶۱ هـ.ق.', kind: 'رویداد' },
  { id: 'm-talas', name: 'طراز', lon: 71.367, lat: 42.9, era: 'abbasi', lessons: [7], detail: 'نبرد ۱۳۳ هـ.ق و انتقال صنعت کاغذ به جهان اسلام.', kind: 'نبرد' },
  { id: 'm-dandanqan', name: 'دندانقان', lon: 62.3, lat: 37.5, era: 'irani', lessons: [10], detail: 'شکست مسعود غزنوی از سلجوقیان در ۴۳۱ هـ.ق.', kind: 'نبرد' },
  { id: 'm-malazgert', name: 'ملازگرد', lon: 42.5, lat: 39.1, era: 'irani', lessons: [10], detail: 'اسارت امپراتور بیزانس به دست آلب ارسلان در ۴۶۳ هـ.ق.', kind: 'نبرد' },
  { id: 'm-chaldoran', name: 'چالدران', lon: 44.3, lat: 39.4, era: 'safavi', lessons: [13], detail: 'شکست شاه اسماعیل از عثمانی در ۹۲۰ هـ.ق.', kind: 'نبرد' },
  { id: 'm-acko', name: 'عکا', lon: 35.07, lat: 32.92, era: 'orupa', lessons: [15], detail: 'آخرین پایگاه صلیبیان در شام؛ سقوط در ۱۲۹۱ م.', kind: 'نبرد' },
  { id: 'm-isfahan-fall', name: 'سقوط اصفهان', lon: 51.666, lat: 32.655, era: 'safavi', lessons: [13], detail: 'پایان حکومت صفوی در ۱۱۳۵ هـ.ق.', kind: 'رویداد' }
]

export const routes: MapRoute[] = [
  {
    id: 'r-khulafa',
    title: 'فتوحات خلفای نخستین',
    era: 'khulafa',
    color: '#E3B45E',
    lessons: [5],
    desc: 'از مدینه به شام، عراق، ایران و مصر؛ گسترش اسلام بیرون از شبه‌جزیره.',
    points: [
      [39.614, 24.469],
      [36.292, 33.514],
      [43.9, 31.7],
      [48.38, 34.19],
      [29.919, 31.2]
    ]
  },
  {
    id: 'r-umavi',
    title: 'فتوحات اموی تا اندلس',
    era: 'umavi',
    color: '#A78BFA',
    lessons: [6],
    desc: 'از دمشق تا قرطبه؛ دورترین گسترهٔ سیاسی جهان اسلام در غرب.',
    points: [
      [36.292, 33.514],
      [29.919, 31.2],
      [-4.779, 37.892]
    ]
  },
  {
    id: 'r-mongol',
    title: 'موج اول حملهٔ مغول',
    era: 'mongol',
    color: '#94A3B8',
    lessons: [11],
    desc: 'از ماوراءالنهر به خراسان؛ مسیر ویرانی و سپس بنیان‌گذاری ایلخانان.',
    points: [
      [59.15, 42.33],
      [64.423, 39.768],
      [66.975, 39.627],
      [61.833, 37.6],
      [58.795, 36.213],
      [51.435, 35.589]
    ]
  },
  {
    id: 'r-hulagu',
    title: 'موج دوم: هلاکو تا بغداد',
    era: 'mongol',
    color: '#CBD5E1',
    lessons: [7, 11],
    desc: 'از مراغه به بغداد؛ پایان خلافت عباسی در ۶۵۶ هـ.ق.',
    points: [
      [46.292, 38.08],
      [48.515, 34.798],
      [44.362, 33.315]
    ]
  },
  {
    id: 'r-safavi',
    title: 'مسیر قدرت صفویه',
    era: 'safavi',
    color: '#34D399',
    lessons: [13],
    desc: 'از اردبیل به تبریز، قزوین و اصفهان؛ ساخت یکپارچگی ایران.',
    points: [
      [48.293, 38.25],
      [46.292, 38.08],
      [49.998, 36.269],
      [51.666, 32.655]
    ]
  },
  {
    id: 'r-silk',
    title: 'جادهٔ ابریشم',
    era: 'abbasi',
    color: '#60A5FA',
    lessons: [7, 9, 10],
    desc: 'بخارا، مرو، نیشابور، ری و بغداد؛ شریان تجارت و تبادل علم و هنر.',
    points: [
      [66.975, 39.627],
      [64.423, 39.768],
      [61.833, 37.6],
      [58.795, 36.213],
      [51.435, 35.589],
      [44.362, 33.315]
    ]
  },
  {
    id: 'r-crusade',
    title: 'جنگ‌های صلیبی',
    era: 'orupa',
    color: '#9B8AFB',
    lessons: [15],
    desc: 'از اروپا به قسطنطنیه و شام؛ دو قرن جنگ و تبادل فرهنگی.',
    points: [
      [2.352, 48.857],
      [12.496, 41.903],
      [28.978, 41.008],
      [35.214, 31.768]
    ]
  },
  {
    id: 'r-explore',
    title: 'سفرهای اکتشافی اروپا',
    era: 'orupa',
    color: '#C4B5FD',
    lessons: [16],
    desc: 'لیسبون به سوی دماغهٔ امید نیک و هند؛ آغاز استعمار و تجارت جهانی.',
    points: [
      [-9.139, 38.722],
      [18.424, -33.925],
      [77.209, 28.614]
    ]
  }
]
