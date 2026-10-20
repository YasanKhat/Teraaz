import type { MapPhase, MapSpec } from '../../components/AtlasMap'
import type { LessonPlan } from './types'

/**
 * لایهٔ اصلاح نقشه‌ها.
 * فیلم‌نامه‌های درس فقط «موضوع» هر گام را نوشته‌اند؛ این فایل به هر گام،
 * قلمرو تاریخی، شهرها و مسیرهایش را می‌دهد تا نقشه واقعاً چیزی یاد بدهد،
 * نه اینکه نقطه‌ای روی یک صفحهٔ خالی باشد.
 */

type Patch = Partial<MapPhase>

const P = (regions: string[], pins: MapPhase['pins'] = [], extra: Patch = {}): Patch => ({
  regions,
  pins,
  ...extra
})

/** هر نقشه با «درس:شمارهٔ نقشه» شناخته می‌شود */
export const MAP_FIXES: Record<string, Patch[]> = {
  /* ── درس ۱: سندگردی در ایران ─────────────────────────────────────────── */
  '1:سندگردی در ایران': [
    // گام ۱: مکان‌های رویداد — با مختصات واقعی روی نقشهٔ جغرافیایی
    P(['jibal', 'fars', 'khurasan', 'azerbaijan', 'khuzestan'], [
      { lon: 44.9, lat: 39.1, label: 'دشت چالدران', tone: 'gold' },
      { lon: 39.61, lat: 24.47, label: 'کوه اُحُد', tone: 'gold' },
      { lon: 39.86, lat: 21.46, label: 'غار حرا', tone: 'gold' },
      { lon: 48.5, lat: 32.0, label: 'چغازنبیل', tone: 'gold' }
    ]),
    // گام ۲: بناها و آثار
    P(['jibal', 'fars', 'khurasan', 'azerbaijan'], [
      { lon: 51.677, lat: 32.657, label: 'میدان نقش جهان', tone: 'turq' },
      { lon: 59.606, lat: 36.288, label: 'مسجد گوهرشاد', tone: 'turq' },
      { lon: 52.891, lat: 29.935, label: 'تخت جمشید', tone: 'turq' },
      { lon: 46.3, lat: 38.08, label: 'مسجد کبود', tone: 'turq' }
    ]),
    // گام ۳: اشیا و دست‌ساخته‌ها
    P(['jibal', 'khurasan', 'fars', 'iraq'], [
      { lon: 51.43, lat: 35.59, label: 'سکهٔ ساسانی — ری', tone: 'rose' },
      { lon: 58.8, lat: 36.21, label: 'سفال نیشابور', tone: 'rose' },
      { lon: 48.51, lat: 34.8, label: 'کتیبهٔ سنگی — همدان', tone: 'rose' }
    ])
  ],

  /* ── درس ۳: عربستان پیش از اسلام ─────────────────────────────────────── */
  '3:عربستان در آستانهٔ اسلام': [
    P(['hejaz', 'yemen', 'jazira'], [
      { lon: 39.83, lat: 21.42, label: 'مکه — قریش', tone: 'gold' },
      { lon: 39.6, lat: 24.47, label: 'یثرب', tone: 'turq' },
      { lon: 40.4, lat: 21.27, label: 'طائف', tone: 'turq' },
      { lon: 39.4, lat: 25.0, label: 'خیبر', tone: 'turq' }
    ]),
    P(['hejaz', 'yemen'], [], {
      arrows: [
        { from: [45.5, 15.5], to: [39.9, 21.4], label: 'کاروان یمن ← مکه' },
        { from: [39.9, 21.4], to: [36.3, 33.5], label: 'مکه ← شام' }
      ]
    }),
    P(['hejaz', 'yemen', 'jazira'], [
      { lon: 39.83, lat: 21.42, label: 'کعبه و بتان', tone: 'gold' },
      { lon: 44.4, lat: 17.4, label: 'نجران — مسیحیان', tone: 'turq' },
      { lon: 39.6, lat: 24.47, label: 'یهودیان یثرب', tone: 'turq' }
    ])
  ],

  '3:پنجرهٔ وحی': [
    P(['hejaz'], [{ lon: 39.86, lat: 21.42, label: 'غار حرا', tone: 'gold' }]),
    P(['hejaz'], [
      { lon: 39.83, lat: 21.42, label: 'خانهٔ ارقم', tone: 'gold' },
      { lon: 39.86, lat: 21.42, label: 'غار حرا', tone: 'turq' }
    ]),
    P(['hejaz'], [
      { lon: 39.83, lat: 21.42, label: 'مسجدالحرام', tone: 'gold' },
      { lon: 40.4, lat: 21.27, label: 'طائف', tone: 'rose' }
    ], { arrows: [{ from: [39.83, 21.42], to: [40.4, 21.27], label: 'دعوت عمومی', tone: 'rose' }] })
  ],

  '3:مسیر هجرت': [
    P(['hejaz'], [{ lon: 39.86, lat: 21.43, label: 'شعب ابی‌طالب', tone: 'gold' }]),
    P(['hejaz'], [{ lon: 39.83, lat: 21.42, label: 'مکه · عام‌الحزن', tone: 'rose' }]),
    P(['hejaz'], [
      { lon: 39.7, lat: 21.5, label: 'عقبه', tone: 'gold' },
      { lon: 39.6, lat: 24.47, label: 'یثرب', tone: 'turq' }
    ]),
    P(['hejaz'], [
      { lon: 39.6, lat: 24.47, label: 'مدینه', tone: 'gold' }
    ], {
      arrows: [
        { from: [39.83, 21.42], to: [39.6, 21.5], label: 'غار ثور' },
        { from: [39.6, 21.5], to: [39.6, 24.47], label: 'یثرب' }
      ]
    })
  ],

  /* ── درس ۴: مدینه ─────────────────────────────────────────────────────── */
  '4:یثرب پیش از هجرت': [
    P(['hejaz'], [
      { lon: 39.6, lat: 24.47, label: 'یثرب', tone: 'gold' },
      { lon: 39.4, lat: 25.0, label: 'خیبر', tone: 'turq' },
      { lon: 39.4, lat: 24.2, label: 'قبا', tone: 'turq' }
    ]),
    P(['hejaz'], [{ lon: 39.6, lat: 24.47, label: 'کشتار و ناامنی', tone: 'rose' }]),
    P(['hejaz'], [{ lon: 39.6, lat: 24.47, label: 'منطقهٔ داوری', tone: 'gold' }])
  ],

  '4:میدان‌های دفاع از مدینه': [
    P(['hejaz'], [{ lon: 38.8, lat: 23.8, label: 'بدر', tone: 'gold' }], {
      arrows: [{ from: [39.6, 24.47], to: [38.8, 23.8], label: 'مدینه ← بدر' }]
    }),
    P(['hejaz'], [{ lon: 39.6, lat: 24.71, label: 'اُحُد', tone: 'gold' }], {
      arrows: [{ from: [39.6, 24.47], to: [39.6, 24.71], label: 'اُحُد' }]
    }),
    P(['hejaz'], [{ lon: 39.6, lat: 24.47, label: 'خندق', tone: 'gold' }]),
    P(['hejaz'], [
      { lon: 39.6, lat: 24.47, label: 'مدینه', tone: 'gold' },
      { lon: 39.83, lat: 21.42, label: 'مکه', tone: 'rose' }
    ], { arrows: [{ from: [39.6, 24.47], to: [39.83, 21.42], label: 'فتح مکه' }] })
  ],

  /* ── درس ۵: خلفای نخستین ─────────────────────────────────────────────── */
  '5:دوازده سال فتح': [
    P(['sham'], [{ lon: 36.2, lat: 33.5, label: 'دمشق', tone: 'gold' }, { lon: 35.2, lat: 31.8, label: 'بیت‌المقدس', tone: 'turq' }], {
      arrows: [{ from: [39.6, 24.47], to: [36.2, 33.5], label: 'شام' }]
    }),
    P(['iraq'], [{ lon: 44.4, lat: 32.4, label: 'قادسیه', tone: 'gold' }], {
      arrows: [{ from: [39.6, 24.47], to: [44.4, 32.5], label: 'قادسیه' }]
    }),
    P(['iraq', 'jibal', 'khuzestan'], [{ lon: 48.4, lat: 34.2, label: 'نهاوند', tone: 'gold' }], {
      arrows: [{ from: [44.4, 32.5], to: [48.4, 34.2], label: 'نهاوند' }]
    }),
    P(['sham', 'egypt'], [{ lon: 31.2, lat: 30.0, label: 'فسطاط', tone: 'gold' }], {
      arrows: [{ from: [36.2, 33.5], to: [31.2, 30], label: 'مصر', tone: 'gold' }]
    }),
    P(['sham', 'iraq', 'jibal', 'fars', 'khurasan', 'egypt'], [
      { lon: 44.4, lat: 32.0, label: 'کوفه', tone: 'gold' },
      { lon: 47.8, lat: 30.5, label: 'بصره', tone: 'gold' },
      { lon: 31.2, lat: 30.0, label: 'فسطاط', tone: 'turq' }
    ])
  ],

  '5:جغرافیای سه جنگ': [
    P(['iraq'], [{ lon: 47.8, lat: 30.5, label: 'بصره', tone: 'gold' }], {
      arrows: [{ from: [44.4, 31.9], to: [47.8, 30.5], label: 'کوفه ← بصره' }]
    }),
    P(['iraq', 'sham'], [{ lon: 38.5, lat: 35.9, label: 'صفین', tone: 'gold' }], {
      arrows: [{ from: [44.4, 31.9], to: [38.5, 35.9], label: 'کوفه ← صفین' }]
    }),
    P(['iraq'], [{ lon: 44.5, lat: 34.1, label: 'نهروان', tone: 'rose' }]),
    P(['iraq'], [{ lon: 44.4, lat: 32.0, label: 'کوفه', tone: 'rose' }])
  ],

  /* ── درس ۶: امویان ───────────────────────────────────────────────────── */
  '6:گسترش شرقی و غربی': [
    P(['khurasan', 'transoxiana', 'sind'], [
      { lon: 62.2, lat: 37.6, label: 'مرو', tone: 'gold' },
      { lon: 66.9, lat: 39.6, label: 'سمرقند', tone: 'turq' },
      { lon: 68.9, lat: 27.0, label: 'سند', tone: 'turq' }
    ], { arrows: [{ from: [58.8, 36.2], to: [66.9, 36.7], label: 'خراسان ← ماوراءالنهر' }] }),
    P(['egypt', 'maghrib', 'andalus'], [
      { lon: 8.5, lat: 33.8, label: 'قیروان', tone: 'gold' },
      { lon: -5.5, lat: 38.0, label: 'قرطبه', tone: 'turq' }
    ], {
      arrows: [
        { from: [31.2, 30], to: [8.5, 33], label: 'مصر ← مغرب' },
        { from: [8.5, 33], to: [-5.5, 38.5], label: 'اندلس' }
      ]
    }),
    P(['maghrib', 'andalus', 'europe'], [
      { lon: 0.4, lat: 46.6, label: 'پواتیه', tone: 'rose' }
    ], { arrows: [{ from: [-5.5, 38.5], to: [0.4, 46.6], label: 'توقف در پواتیه', tone: 'rose' }] })
  ],

  /* ── درس ۷: عباسیان ──────────────────────────────────────────────────── */
  '7:دستگاه عباسی': [
    P(['khurasan', 'iraq'], [
      { lon: 58.8, lat: 36.2, label: 'نیشابور', tone: 'gold' },
      { lon: 44.4, lat: 32.0, label: 'کوفه', tone: 'turq' }
    ]),
    P(['khurasan', 'iraq'], [
      { lon: 59.6, lat: 36.3, label: 'ابومسلم', tone: 'gold' }
    ], { arrows: [{ from: [58.8, 36.2], to: [44.4, 32], label: 'خراسان ← کوفه', tone: 'rose' }] }),
    P(['iraq', 'jibal', 'khurasan'], [{ lon: 44.1, lat: 33.4, label: 'بغداد', tone: 'gold' }]),
    P(['iraq', 'jibal'], [{ lon: 44.4, lat: 33.3, label: 'بغداد', tone: 'gold' }]),
    P(['iraq', 'egypt', 'maghrib', 'hejaz'], [
      { lon: 31.2, lat: 30.0, label: 'قاهره', tone: 'gold' },
      { lon: 10.8, lat: 35.8, label: 'مهدیه', tone: 'turq' }
    ], { arrows: [{ from: [10.8, 35.8], to: [31.2, 30], label: 'مهدیه ← قاهره', tone: 'turq' }] })
  ],

  /* ── درس ۸: ایران و اسلام ────────────────────────────────────────────── */
  '8:دولت ساسانی در آستانهٔ فروپاشی': [
    P(['iraq', 'jibal', 'fars', 'khurasan', 'azerbaijan', 'tabaristan', 'khuzestan', 'transoxiana', 'caucasus'], [
      { lon: 44.4, lat: 33.1, label: 'تیسفون', tone: 'gold' }
    ]),
    P(['iraq', 'khuzestan', 'fars'], [
      { lon: 52.5, lat: 29.6, label: 'فارس · مالیات', tone: 'rose' },
      { lon: 48.5, lat: 34.8, label: 'همدان', tone: 'turq' }
    ]),
    P(['iraq', 'khuzestan'], [
      { lon: 47.0, lat: 31.2, label: 'طغیان دجله و فرات', tone: 'turq' },
      { lon: 44.4, lat: 33.1, label: 'طاعون', tone: 'rose' }
    ]),
    P(['iraq', 'jibal'], [
      { lon: 44.4, lat: 32.0, label: 'حیره', tone: 'gold' }
    ], { arrows: [{ from: [40.0, 28.0], to: [44.4, 32.0], label: 'نفوذ از بیابان', tone: 'rose' }] })
  ],

  '8:چهار نبرد، یک نتیجه': [
    P(['iraq'], [{ lon: 44.3, lat: 31.9, label: 'جسر', tone: 'gold' }], {
      arrows: [{ from: [44.2, 29.5], to: [44.3, 31.9], label: 'ورود اعراب' }]
    }),
    P(['iraq'], [{ lon: 44.4, lat: 32.4, label: 'قادسیه', tone: 'gold' }], {
      arrows: [{ from: [44.2, 29.5], to: [44.4, 32.4], label: 'قادسیه' }]
    }),
    P(['iraq', 'jibal'], [{ lon: 45.4, lat: 34.5, label: 'جلولا', tone: 'gold' }], {
      ghost: ['iraq'],
      arrows: [{ from: [44.4, 32.4], to: [45.4, 34.5], label: 'جلولا' }]
    }),
    P(['iraq', 'jibal', 'khuzestan'], [{ lon: 48.4, lat: 34.2, label: 'نهاوند', tone: 'gold' }], {
      ghost: ['iraq', 'jibal'],
      arrows: [{ from: [45.4, 34.5], to: [48.4, 34.2], label: 'فتح‌الفتوح' }]
    }),
    P(['iraq', 'jibal', 'khuzestan', 'fars'], [
      { lon: 51.67, lat: 32.65, label: 'اصفهان', tone: 'gold' },
      { lon: 52.5, lat: 29.6, label: 'فارس', tone: 'turq' }
    ], {
      ghost: ['iraq', 'jibal', 'khuzestan'],
      arrows: [
        { from: [48.4, 34.2], to: [51.67, 32.65], label: 'اصفهان' },
        { from: [51.67, 32.65], to: [52.5, 29.6], label: 'فارس' }
      ]
    }),
    P(['iraq', 'jibal', 'khuzestan', 'fars', 'kerman', 'khurasan', 'transoxiana'], [
      { lon: 58.8, lat: 36.2, label: 'نیشابور', tone: 'gold' },
      { lon: 62.2, lat: 37.6, label: 'مرو', tone: 'turq' },
      { lon: 66.9, lat: 39.6, label: 'ماوراءالنهر', tone: 'turq' }
    ], {
      ghost: ['iraq', 'jibal', 'khuzestan', 'fars', 'kerman'],
      arrows: [{ from: [52.5, 29.6], to: [66.9, 36.7], label: 'خراسان ← ماوراءالنهر' }]
    })
  ],

  /* ── درس ۹: سلسله‌های ایرانی ─────────────────────────────────────────── */
  '9:نقشهٔ سلسله‌های ایرانی': [
    P(['khurasan'], [{ lon: 58.8, lat: 36.2, label: 'نیشابور', tone: 'gold' }]),
    P(['kerman', 'khurasan'], [
      { lon: 61.9, lat: 31.0, label: 'زرنج', tone: 'gold' },
      { lon: 51.4, lat: 35.6, label: 'ری', tone: 'turq' }
    ], { arrows: [{ from: [61.9, 30.3], to: [51.4, 35.7], label: 'سیستان ← ری', tone: 'rose' }] }),
    P(['transoxiana', 'khurasan'], [
      { lon: 64.4, lat: 39.8, label: 'بخارا', tone: 'gold' },
      { lon: 66.9, lat: 39.6, label: 'سمرقند', tone: 'turq' }
    ]),
    P(['tabaristan'], [{ lon: 52.3, lat: 36.5, label: 'آمل', tone: 'gold' }]),
    P(['tabaristan', 'jibal'], [{ lon: 54.4, lat: 36.8, label: 'گرگان', tone: 'gold' }]),
    P(['fars', 'jibal', 'iraq'], [
      { lon: 52.5, lat: 29.6, label: 'شیراز', tone: 'gold' },
      { lon: 44.4, lat: 33.3, label: 'بغداد', tone: 'turq' }
    ], { arrows: [{ from: [51.4, 35.7], to: [44.4, 33.3], label: 'ری ← بغداد', tone: 'rose' }] })
  ],

  /* ── درس ۱۰: غزنوی، سلجوقی، خوارزمشاهی ─────────────────────────────── */
  '10:از غزنه تا ملازگرد': [
    P(['khurasan', 'transoxiana'], [{ lon: 68.4, lat: 33.5, label: 'غزنه', tone: 'gold' }], {
      arrows: [{ from: [68.4, 33.5], to: [75.9, 30.9], label: 'لشکرکشی به هند', tone: 'rose' }]
    }),
    P(['khurasan'], [{ lon: 61.8, lat: 37.6, label: 'دندانقان', tone: 'gold' }], {
      arrows: [{ from: [66.9, 37.7], to: [61.8, 37.6], label: 'سلجوقیان' }]
    }),
    P(['jibal', 'iraq', 'khurasan'], [
      { lon: 51.4, lat: 35.6, label: 'ری', tone: 'gold' },
      { lon: 44.4, lat: 33.3, label: 'بغداد', tone: 'turq' }
    ], { arrows: [{ from: [58.8, 36.2], to: [44.4, 33.3], label: 'نیشابور ← بغداد' }] }),
    P(['anatolia'], [{ lon: 42.5, lat: 39.1, label: 'ملازگرد', tone: 'gold' }], {
      arrows: [{ from: [44.4, 33.3], to: [42.5, 39.1], label: 'ملازگرد' }]
    }),
    P(['transoxiana', 'khurasan', 'jibal'], [{ lon: 59.2, lat: 42.3, label: 'گرگانج', tone: 'gold' }])
  ],

  /* ── درس ۱۱: مغول و تیمور ────────────────────────────────────────────── */
  '11:دو موج، سه مرحله': [
    P(['transoxiana', 'khurasan'], [
      { lon: 66.9, lat: 39.6, label: 'سمرقند', tone: 'rose' },
      { lon: 64.4, lat: 39.8, label: 'بخارا', tone: 'rose' },
      { lon: 62.2, lat: 37.6, label: 'مرو', tone: 'rose' },
      { lon: 58.8, lat: 36.2, label: 'نیشابور', tone: 'rose' }
    ], {
      arrows: [
        { from: [66.9, 39.6], to: [64.4, 39.8], label: 'سمرقند ← بخارا', tone: 'rose' },
        { from: [64.4, 39.8], to: [62.2, 37.6], label: 'مرو', tone: 'rose' },
        { from: [62.2, 37.6], to: [58.8, 36.2], label: 'نیشابور', tone: 'rose' }
      ]
    }),
    P(['transoxiana', 'khurasan', 'jibal', 'iraq'], [
      { lon: 46.2, lat: 37.4, label: 'مراغه', tone: 'gold' },
      { lon: 44.4, lat: 33.3, label: 'بغداد', tone: 'rose' }
    ], {
      ghost: ['transoxiana', 'khurasan', 'jibal'],
      arrows: [
        { from: [66.9, 39.6], to: [46.2, 37.4], label: 'به سوی مراغه', tone: 'rose' },
        { from: [46.2, 37.4], to: [44.4, 33.3], label: 'بغداد', tone: 'rose' }
      ]
    }),
    P(['transoxiana', 'khurasan', 'jibal', 'fars', 'iraq'], [
      { lon: 66.9, lat: 39.6, label: 'سمرقند', tone: 'gold' }
    ], {
      ghost: ['transoxiana', 'khurasan'],
      arrows: [
        { from: [66.9, 39.6], to: [58.8, 36.2], label: 'خراسان' },
        { from: [58.8, 36.2], to: [51.4, 35.7], label: 'ری' },
        { from: [51.4, 35.7], to: [44.4, 33.3], label: 'بغداد' },
        { from: [51.4, 35.7], to: [52.5, 29.6], label: 'شیراز' }
      ]
    }),
    P(['transoxiana', 'khurasan', 'jibal', 'fars', 'iraq', 'azerbaijan'], [
      { lon: 46.3, lat: 38.1, label: 'تبریز', tone: 'gold' },
      { lon: 48.8, lat: 36.4, label: 'سلطانیه', tone: 'gold' }
    ])
  ],

  /* ── درس ۱۲: هنر و معماری ───────────────────────────────────────────── */
  '12:نقشهٔ هنر تیموری و ایلخانی': [
    P(['khurasan', 'azerbaijan', 'fars'], [
      { lon: 62.2, lat: 34.3, label: 'هرات · مکتب نگارگری', tone: 'gold' },
      { lon: 46.3, lat: 38.1, label: 'تبریز', tone: 'gold' },
      { lon: 52.5, lat: 29.6, label: 'شیراز', tone: 'gold' }
    ]),
    P(['khurasan', 'jibal', 'azerbaijan'], [
      { lon: 59.6, lat: 36.3, label: 'مسجد گوهرشاد', tone: 'gold' },
      { lon: 48.8, lat: 36.4, label: 'سلطانیه', tone: 'turq' },
      { lon: 46.3, lat: 38.1, label: 'ربع رشیدی', tone: 'turq' }
    ]),
    P(['khurasan', 'transoxiana'], [{ lon: 62.2, lat: 34.3, label: 'کارگاه کتاب‌آرایی هرات', tone: 'gold' }])
  ],

  /* ── درس ۱۳: صفویه ──────────────────────────────────────────────────── */
  '13:تأسیس و تثبیت': [
    P(['azerbaijan'], [{ lon: 48.3, lat: 38.25, label: 'اردبیل', tone: 'gold' }]),
    P(['azerbaijan'], [{ lon: 46.3, lat: 38.1, label: 'تبریز · تاج‌گذاری', tone: 'gold' }], {
      arrows: [{ from: [48.3, 38.25], to: [46.3, 38.1], label: 'تاج‌گذاری' }]
    }),
    P(['azerbaijan', 'jibal'], [{ lon: 44.4, lat: 39.3, label: 'چالدران', tone: 'rose' }], {
      arrows: [{ from: [46.3, 38.1], to: [44.4, 39.3], label: 'چالدران', tone: 'rose' }]
    }),
    P(['jibal', 'azerbaijan'], [{ lon: 50.0, lat: 36.3, label: 'قزوین', tone: 'gold' }]),
    P(['jibal', 'fars'], [{ lon: 51.67, lat: 32.65, label: 'اصفهان · پایتخت', tone: 'gold' }], {
      arrows: [{ from: [50, 36.3], to: [51.67, 32.65], label: 'پایتخت' }]
    }),
    P(['fars', 'jibal'], [{ lon: 51.67, lat: 32.65, label: 'محاصرهٔ اصفهان', tone: 'rose' }], {
      arrows: [{ from: [61.9, 31.0], to: [51.67, 32.65], label: 'افغان‌های شورشی', tone: 'rose' }]
    })
  ],

  /* ── درس ۱۴: اصفهان ─────────────────────────────────────────────────── */
  '14:اصفهان؛ نصف جهان': [
    {
      planPins: [{ x: 50, y: 48, label: 'میدان نقش جهان', tone: 'gold' }],
      planLines: [
        { from: [39, 8], to: [39, 74], kind: 'axis', label: 'چهارباغ' },
        { from: [18, 35], to: [88, 35], kind: 'street', label: 'بازار قیصریه' }
      ]
    },
    {
      planPins: [
        { x: 48, y: 58, label: 'مسجد شاه', tone: 'gold' },
        { x: 58, y: 46, label: 'مسجد شیخ لطف‌الله', tone: 'turq' }
      ]
    },
    {
      planPins: [
        { x: 42, y: 46, label: 'عالی‌قاپو', tone: 'gold' },
        { x: 24, y: 60, label: 'چهل‌ستون', tone: 'turq' }
      ]
    },
    {
      planPins: [
        { x: 66, y: 74, label: 'سی‌وسه‌پل', tone: 'gold' },
        { x: 82, y: 78, label: 'پل خواجو', tone: 'turq' },
        { x: 50, y: 30, label: 'چهارباغ', tone: 'gold' }
      ]
    }
  ],

  /* ── درس ۱۵: قرون وسطا ──────────────────────────────────────────────── */
  '15:دو نیمهٔ روم': [
    P(['europe', 'byzantium', 'anatolia'], [
      { lon: 12.5, lat: 41.9, label: 'روم غربی', tone: 'gold' },
      { lon: 28.9, lat: 41.0, label: 'روم شرقی', tone: 'turq' }
    ]),
    P(['europe'], [], {
      ghost: ['byzantium'],
      arrows: [{ from: [12, 48], to: [12.5, 41.9], label: 'ژرمن‌ها', tone: 'rose' }]
    }),
    P(['europe'], [{ lon: 6.1, lat: 50.8, label: 'آخن', tone: 'gold' }], {
      arrows: [{ from: [6.1, 50.8], to: [12.5, 41.9], label: 'تاج‌گذاری شارلمانی' }]
    }),
    P(['europe'], [
      { lon: 2.3, lat: 48.9, label: 'املاک فئودالی', tone: 'gold' },
      { lon: 7.7, lat: 48.6, label: 'قلعه‌ها', tone: 'turq' }
    ])
  ],

  '15:مسیر صلیبیان': [
    P(['europe'], [{ lon: 3.1, lat: 45.8, label: 'کلرمون', tone: 'gold' }]),
    P(['europe', 'byzantium', 'anatolia', 'sham'], [
      { lon: 28.9, lat: 41.0, label: 'قسطنطنیه', tone: 'turq' }
    ], {
      arrows: [
        { from: [3.1, 45.8], to: [28.9, 41], label: 'به سوی شرق', tone: 'rose' },
        { from: [28.9, 41], to: [36.2, 36.2], label: 'شام', tone: 'rose' }
      ]
    }),
    P(['sham'], [{ lon: 35.2, lat: 31.8, label: 'اورشلیم', tone: 'gold' }]),
    P(['sham'], [{ lon: 35.07, lat: 32.92, label: 'عکا', tone: 'rose' }])
  ],

  /* ── درس ۱۶: عصر جدید ───────────────────────────────────────────────── */
  '16:عصر اکتشاف': [
    P([], [{ lon: 8.3, lat: 50.0, label: 'ماینتس · چاپ', tone: 'gold' }]),
    P([], [
      { lon: -70, lat: 22, label: 'کاراییب', tone: 'gold' },
      { lon: -6.9, lat: 37.2, label: 'پالوس', tone: 'turq' }
    ], { arrows: [{ from: [-6.9, 37.2], to: [-70, 22], label: 'کلمب', tone: 'rose' }] }),
    P([], [
      { lon: 18.5, lat: -34.4, label: 'دماغهٔ امید', tone: 'turq' },
      { lon: 75.8, lat: 15.0, label: 'هند', tone: 'gold' },
      { lon: -9.1, lat: 38.7, label: 'لیسبون', tone: 'gold' }
    ], { arrows: [{ from: [-9.1, 38.7], to: [75.8, 15], label: 'راه دریایی هند', tone: 'rose' }] }),
    P([], [{ lon: 18.6, lat: 53.0, label: 'لهستان · کوپرنیک', tone: 'gold' }])
  ]
}

/** اشیای درس ۱: حالا با مختصات واقعی روی نقشهٔ جغرافیایی نشان داده می‌شوند */
const ARTIFACTS: Record<string, MapSpec['artifacts']> = {}

/** نقشه‌های درس را با لایهٔ اصلاح برمی‌گرداند */
export function fixSpec(lesson: number, spec: MapSpec): MapSpec {
  const patches = MAP_FIXES[`${lesson}:${spec.title}`]
  if (!patches) return spec
  return {
    ...spec,
    ...(patches[0]?.planPins ? { mode: 'plan' as const } : {}),
    ...(ARTIFACTS[`${lesson}:${spec.title}`] ? { mode: 'plan' as const, artifacts: ARTIFACTS[`${lesson}:${spec.title}`] } : {}),
    phases: spec.phases.map((phase, i) => {
      const patch = patches[i]
      if (!patch) return phase
      return {
        ...phase,
        ...patch,
        regions: patch.regions ?? phase.regions,
        pins: patch.pins ?? phase.pins,
        arrows: patch.arrows ?? phase.arrows,
        ghost: patch.ghost ?? phase.ghost
      }
    })
  }
}

export const fixPlanMaps = (plan: LessonPlan): LessonPlan => ({
  ...plan,
  scenes: plan.scenes.map((scene) => ({
    ...scene,
    maps: scene.maps?.map((m) => ({ ...m, spec: fixSpec(plan.lesson, m.spec) }))
  }))
})
