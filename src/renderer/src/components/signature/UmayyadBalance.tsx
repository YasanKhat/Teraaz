import { useState } from 'react'
import { Scale } from 'lucide-react'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const FORCES = [
  {
    id: 'shia',
    n: 'شیعیان',
    demand: 'خلافت در خاندان پیامبر',
    action: 'قیام‌های علوی: کربلا ۶۱ ق، قیام مختار ۶۶ ق',
    outcome: 'سرکوب شدند، اما جریان سیاسی-مذهبی زنده ماند',
    tone: 'rose'
  },
  {
    id: 'kharij',
    n: 'خوارج',
    demand: 'خلافت فقط با ایمان و عدالت، نه نسب',
    action: 'ترور سیاسی؛ کشتن علی (ع)، و شورش‌های پیاپی',
    outcome: 'به گروه‌های تندرو و میانه‌رو تقسیم شدند',
    tone: 'gold'
  },
  {
    id: 'mawali',
    n: 'موالی',
    demand: 'برابری با اعراب در حقوق و مالیات',
    action: 'نارضایتی در ایران و خراسان؛ زمینه‌سازی برای عباسیان',
    outcome: 'ستون اصلی سقوط امویان شدند',
    tone: 'turq'
  },
  {
    id: 'qays',
    n: 'رقابت قبیلگی',
    demand: 'سهم بیشتر از قدرت و بیت‌المال',
    action: 'کشمکش یمنی و قیسی در دستگاه خلافت',
    outcome: 'دولت را از درون فرسود',
    tone: 'gold'
  }
]

export function UmayyadBalance() {
  const [id, setId] = useState('mawali')
  const f = FORCES.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="موازنهٔ قدرت · درس ۶"
      title="امویان: دولتی که بر چهار شکاف ایستاده بود"
      hint="امویان با نیروی شام حکومت کردند، اما چهار فشار هم‌زمان دولت را می‌فرسود. یکی را انتخاب کن."
      tone="rose"
    >
      <div className="grid gap-2.5 md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-1.5">
          {FORCES.map((x) => (
            <button
              key={x.id}
              className={cn('flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-start transition', x.id === id ? 'border-gold/55 bg-gold/10' : 'border-line bg-bg/30 hover:border-gold/30')}
              onClick={() => setId(x.id)}
            >
              <Scale size={13} className={x.id === id ? 'text-gold' : 'text-faint'} />
              <span className="flex-1 text-[0.78rem] font-semibold">{x.n}</span>
              <span className="text-[0.6rem] text-faint">{x.demand}</span>
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-line bg-bg/40 p-3.5">
          <Tag tone={f.tone as 'gold' | 'turq' | 'rose'}>{f.n}</Tag>
          <div className="mt-2 space-y-2">
            <div>
              <div className="text-[0.58rem] tracking-widest text-faint">خواسته</div>
              <p className="text-[0.78rem] leading-6 text-ink/85">{f.demand}</p>
            </div>
            <div>
              <div className="text-[0.58rem] tracking-widest text-faint">کنش</div>
              <p className="text-[0.78rem] leading-6 text-muted">{f.action}</p>
            </div>
            <div className="rounded-lg border border-gold/25 bg-gold/6 px-2 py-1.5">
              <div className="text-[0.58rem] text-gold">نتیجه</div>
              <p className="text-[0.72rem] leading-6 text-muted">{f.outcome}</p>
            </div>
          </div>
          <div className="mt-2.5 flex gap-1">
            {FORCES.map((x) => <span key={x.id} className={cn('h-1 flex-1 rounded-full', x.id === id ? 'bg-gold' : 'bg-line')} />)}
          </div>
          <div className="mt-1.5 text-[0.55rem] text-faint">{fas(FORCES.indexOf(f) + 1)} از {fas(FORCES.length)} فشار</div>
        </div>
      </div>
    </SignatureStage>
  )
}
