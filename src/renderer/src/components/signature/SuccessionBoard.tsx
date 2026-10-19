import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Crown, Info } from 'lucide-react'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const PATHS = [
  {
    id: 'saqifa',
    title: 'راه سقیفه',
    who: 'ابوبکر',
    years: '۱۱–۱۳ ق',
    how: 'گروهی از انصار و چند مهاجر در سقیفه گرد آمدند و ابوبکر را برگزیدند؛ سپس در مسجد بیعت عمومی گرفته شد.',
    why: 'سرعت تصمیم، جلوگیری از شکاف میان مهاجر و انصار بود.',
    cost: 'گروهی از صحابه، از جمله بنی‌هاشم، بیعت را به تأخیر انداختند.',
    tone: 'gold'
  },
  {
    id: 'omar',
    title: 'راه شورا',
    who: 'عمر',
    years: '۱۳–۲۳ ق',
    how: 'ابوبکر در بیماری، عمر را نامزد کرد و مردم بیعت کردند. عمر پس از خود شورایی شش‌نفره گذاشت.',
    why: 'تجربهٔ بحران رِدّه نشان داد انتخاب بی‌سازوکار، خطر جنگ داخلی دارد.',
    cost: 'نهاد «شورا» شکل گرفت، اما مرز اختیاراتش روشن نشد.',
    tone: 'turq'
  },
  {
    id: 'ali',
    title: 'راه بیعت عمومی',
    who: 'علی (ع)',
    years: '۳۵–۴۰ ق',
    how: 'پس از کشته‌شدن عثمان، مردم در مدینه با علی بیعت کردند؛ اما شام و بخشی از کوفه بیعت نکردند.',
    why: 'مشروعیت از بیعت گستردهٔ مردم می‌آمد، نه از تعیین پیشین.',
    cost: 'جنگ جمل و صفین؛ دولت مرکزی ضعیف شد و خوارج پدید آمدند.',
    tone: 'rose'
  }
]

export function SuccessionBoard() {
  const [id, setId] = useState('saqifa')
  const p = PATHS.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="شجرهٔ قدرت · درس ۵"
      title="پس از پیامبر، خلافت چگونه ساخته شد؟"
      hint="سه مسیر متفاوت برای جانشینی وجود داشت. هر مسیر را انتخاب کن تا ببینی بر چه پایه‌ای ایستاد و چه هزینه‌ای بر جای گذاشت."
    >
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-gold/[0.06] px-3 py-2">
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-gold" />
          <span className="text-[0.8rem] font-bold">پیامبر (ص)</span>
          <span className="text-[0.6rem] text-faint">۱۱ ق · وفات</span>
        </div>
        <div className="flex gap-1.5">
          {PATHS.map((x) => (
            <button
              key={x.id}
              onClick={() => setId(x.id)}
              className={cn('rounded-md border px-2 py-1 text-[0.6rem] transition', id === x.id ? 'border-gold bg-gold/15 text-gold' : 'border-line text-faint hover:text-ink')}
            >
              {x.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-[1fr_1.15fr]">
        <div className="relative rounded-xl border border-line bg-bg/35 p-3">
          <div className="text-[0.58rem] tracking-widest text-faint">زنجیرهٔ چهار خلیفه</div>
          <div className="mt-2 flex items-stretch gap-1.5">
            {[
              { n: 'ابوبکر', y: '۱۱' },
              { n: 'عمر', y: '۱۳' },
              { n: 'عثمان', y: '۲۳' },
              { n: 'علی', y: '۳۵' }
            ].map((c, k) => (
              <div key={c.n} className="flex flex-1 flex-col items-center gap-1">
                <div className={cn('w-full rounded-lg border px-1 py-2 text-center', (id === 'saqifa' && k === 0) || (id === 'omar' && (k === 1 || k === 2)) || (id === 'ali' && k === 3) ? 'border-gold/60 bg-gold/12' : 'border-line bg-surface/40')}>
                  <div className="text-[0.68rem] font-bold">{c.n}</div>
                  <div className="text-[0.55rem] text-faint">{c.y} ق</div>
                </div>
                {k < 3 && <ArrowLeft size={10} className="rotate-180 text-faint" />}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-dashed border-line px-2 py-2 text-[0.65rem] leading-6 text-faint">
            نکته: هر سه خلیفهٔ نخست با «انتخاب گروهی از صحابه» آمدند، اما سازوکار هر بار متفاوت بود؛ همین تفاوت، ریشهٔ منازعهٔ سیاسی سدهٔ اول است.
          </div>
        </div>

        <motion.div key={p.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Tag tone={p.tone as 'gold' | 'turq' | 'rose'}>{p.title}</Tag>
            <Tag>{p.years}</Tag>
          </div>
          <h3 className="text-[1rem] font-black">{p.who}</h3>
          <p className="mt-1.5 text-[0.78rem] leading-7 text-muted">{p.how}</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-turq/25 bg-turq/5 px-2 py-1.5">
              <div className="flex items-center gap-1 text-[0.58rem] text-turq"><Info size={10} /> چرا؟</div>
              <p className="mt-0.5 text-[0.7rem] leading-6 text-muted">{p.why}</p>
            </div>
            <div className="rounded-lg border border-rose/25 bg-rose/5 px-2 py-1.5">
              <div className="text-[0.58rem] text-rose">هزینه</div>
              <p className="mt-0.5 text-[0.7rem] leading-6 text-muted">{p.cost}</p>
            </div>
          </div>
          <div className="mt-2 text-[0.58rem] text-faint">{fas(PATHS.indexOf(p) + 1)} از {fas(PATHS.length)} مسیر</div>
        </motion.div>
      </div>
    </SignatureStage>
  )
}
