import { useState } from 'react'
import { cn } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const DIMS = ['بنیان و مشروعیت', 'پایتخت و قدرت', 'نقطهٔ قوت', 'پایان کار'] as const

const ROWS = [
  {
    n: 'غزنویان',
    years: '۳۸۹–۵۸۲ ق',
    tone: 'gold',
    cells: {
      'بنیان و مشروعیت': 'از غلامان سامانی؛ مشروعیت را از خلیفهٔ عباسی گرفتند و خود را «غازی» خواندند.',
      'پایتخت و قدرت': 'غزنه؛ لشکر نیرومند و دربارِ شاعرپرور. محمود به هند لشکر کشید.',
      'نقطهٔ قوت': 'شعر و ادب فارسی (فردوسی)، اما قدرتشان به لشکر و غنیمت وابسته بود.',
      'پایان کار': 'در دندانقان ۴۳۱ ق از سلجوقیان شکست خوردند و به غزنه و هند عقب رفتند.'
    }
  },
  {
    n: 'سلجوقیان',
    years: '۴۲۹–۵۹۰ ق',
    tone: 'turq',
    cells: {
      'بنیان و مشروعیت': 'قبایل ترکمان از ماوراءالنهر؛ با پیروزی دندانقان و بیعت با خلیفه، «سلطان» شدند.',
      'پایتخت و قدرت': 'نیشابور، ری و اصفهان؛ وزارت ایرانی (نظام‌الملک) ستون ادارهٔ empire بود.',
      'نقطهٔ قوت': 'نظامیه‌ها، مدارس و وزرات؛ اوج پیوند سلطان ترک و دیوان ایرانی.',
      'پایان کار': 'جنگ داخلی، قدرت گرفتن خوارزمشاهیان و سپس ضربهٔ مغول.'
    }
  },
  {
    n: 'خوارزمشاهیان',
    years: '۴۷۰–۶۱۷ ق',
    tone: 'rose',
    cells: {
      'بنیان و مشروعیت': 'از غلامان سلجوقی؛ با ضعف سلاطین، خود را «خوارزمشاه» خواندند و به دنبال استقلال بودند.',
      'پایتخت و قدرت': 'گرگانج و سمرقند؛ قلمرو پهناور اما پیوند داخلی سست.',
      'نقطهٔ قوت': 'کشوری بزرگ در آستانهٔ حملهٔ مغول، با دیوان و لشکری ناهماهنگ.',
      'پایان کار': 'حملهٔ چنگیز ۶۱۶ ق؛ سلطان محمد فرار کرد و دولت در چند سال فروپاشید.'
    }
  }
]

export function ThreeCourts() {
  const [dim, setDim] = useState<(typeof DIMS)[number]>('نقطهٔ قوت')

  return (
    <SignatureStage
      kicker="مقایسهٔ سه دولت · درس ۱۰"
      title="سه دولت ترک‌تبار، سه پاسخ به یک پرسش"
      hint="غزنوی، سلجوقی و خوارزمشاهی هر سه از دل نظام غلامان برخاستند. یک محور را انتخاب کن و سه دولت را کنار هم ببین؛ پاسخ امتحان معمولاً از همین مقایسه می‌آید."
      tone="turq"
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {DIMS.map((d) => (
          <button
            key={d}
            onClick={() => setDim(d)}
            className={cn('rounded-lg border px-2.5 py-1 text-[0.68rem] transition', dim === d ? 'border-turq/60 bg-turq/12 text-turq' : 'border-line text-muted hover:text-ink')}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {ROWS.map((r) => (
          <div key={r.n} className="rounded-xl border border-line bg-bg/35 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-1">
              <Tag tone={r.tone as 'gold' | 'turq' | 'rose'}>{r.years}</Tag>
            </div>
            <div className="text-[0.92rem] font-black">{r.n}</div>
            <p className="mt-1.5 text-[0.74rem] leading-7 text-muted">{r.cells[dim]}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-lg border border-gold/25 bg-gold/[0.05] px-3 py-2 text-[0.72rem] leading-6 text-muted">
        <b className="text-ink">خط مشترک:</b> هر سه دولت با لشکر غلامان و مشروعیت خلیفه آغاز شدند؛ و هر سه، وقتی لشکر از دیوان
        جدا شد و مشروعیت به «زور» تکیه کرد، شکننده ماندند.
      </div>
    </SignatureStage>
  )
}
