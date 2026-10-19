import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Compass, Landmark, ScrollText } from 'lucide-react'
import { fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const SHIFTS = [
  {
    id: 'human',
    n: 'انسان‌گرایی',
    icon: ScrollText,
    before: 'انسان در برابر تقدیر، موجودی گناهکار و بی‌اراده بود.',
    after: 'انسان محور اندیشه شد: توانایی، آزادی و مطالعهٔ متون کلاسیک.',
    names: 'لئوناردو برونی، پیکو دلا میراندولا',
    effect: 'هنر به انسان و طبیعت روی آورد: لئوناردو، میکل‌آنژ، رافائل.'
  },
  {
    id: 'print',
    n: 'چاپ',
    icon: BookOpen,
    before: 'کتاب با دست نوشته می‌شد؛ دانش در انحصار کلیسا و اشراف.',
    after: 'گوتنبرگ ۱۴۵۰ م: چاپ حروف سربی، سرعت و ارزانی کتاب.',
    names: 'یوهانس گوتنبرگ',
    effect: 'اندیشه سریع پخش شد؛ اصلاح دینی و خواندن شخصی ممکن شد.'
  },
  {
    id: 'geo',
    n: 'اکتشافات',
    icon: Compass,
    before: 'جهان در نقشه‌های قدیمی، کوچک و ناشناخته بود.',
    after: 'کلمب ۱۴۹۲، واسکو داگاما ۱۴۹۸، ماژلان: دریانوردی و تجارت جهانی.',
    names: 'کلمب، واسکو داگاما، ماژلان',
    effect: 'ثروت، قدرت و مرکز ثقل اقتصاد از مدیترانه به اقیانوس‌ها منتقل شد.'
  },
  {
    id: 'reform',
    n: 'اصلاح دینی',
    icon: Landmark,
    before: 'کلیسا مرجع یگانهٔ تفسیر و فروش آمرزش‌نامه.',
    after: 'لوتر ۱۵۱۷: نقد کلیسا و تکیه بر کتاب مقدس؛ پیدایش پروتستان.',
    names: 'مارتین لوتر، کالون',
    effect: 'اروپا به دو نیم شد؛ جنگ‌های مذهبی و بازآرایی سیاسی.'
  }
]

export function RenaissanceEngine() {
  const [id, setId] = useState('print')
  const s = SHIFTS.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="ماشین تغییر · درس ۱۶"
      title="رنسانس: چهار تغییر که جهان را جابه‌جا کرد"
      hint="هر تغییر را انتخاب کن و «پیش از آن» و «پس از آن» را کنار هم ببین. رنسانس یک تاریخ نیست؛ یک تغییر نگاه است."
      tone="gold"
    >
      <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {SHIFTS.map((x) => {
          const Icon = x.icon
          return (
            <button
              key={x.id}
              onClick={() => setId(x.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[0.68rem] transition ${x.id === id ? 'border-gold/60 bg-gold/10 text-gold' : 'border-line text-muted hover:text-ink'}`}
            >
              <Icon size={12} /> {x.n}
            </button>
          )
        })}
      </div>

      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-line bg-bg/30 p-3">
          <div className="text-[0.56rem] tracking-widest text-faint">پیش از</div>
          <p className="mt-1 text-[0.76rem] leading-7 text-muted">{s.before}</p>
        </div>
        <div className="flex items-center justify-center">
          <motion.span animate={{ x: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="grid size-8 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
            <ArrowLeft size={15} />
          </motion.span>
        </div>
        <div className="rounded-xl border border-gold/40 bg-gold/[0.07] p-3">
          <div className="text-[0.56rem] tracking-widest text-gold">پس از</div>
          <p className="mt-1 text-[0.76rem] leading-7 text-ink/85">{s.after}</p>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-line px-2.5 py-2">
          <div className="text-[0.56rem] tracking-widest text-faint">چهره‌ها</div>
          <div className="text-[0.74rem] leading-6 text-muted">{s.names}</div>
        </div>
        <div className="rounded-lg border border-turq/25 bg-turq/5 px-2.5 py-2">
          <div className="text-[0.56rem] tracking-widest text-turq">پیامد</div>
          <div className="text-[0.74rem] leading-6 text-muted">{s.effect}</div>
        </div>
      </div>
      <div className="mt-1.5 text-[0.55rem] text-faint">{fas(SHIFTS.indexOf(s) + 1)} از {fas(SHIFTS.length)} تغییر</div>
    </SignatureStage>
  )
}
