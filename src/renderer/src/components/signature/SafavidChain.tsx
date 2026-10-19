import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const SHAHS = [
  { n: 'شاه اسماعیل', y: '۹۰۷–۹۳۰ ق', tone: 'gold', t: 'بنیان‌گذار', text: 'با تکیه بر طریقت صفویه و حمایت قزلباش، تبریز را گرفت و تشیع را رسمی کرد.', key: 'آغاز دولت؛ چالدران ۹۲۰ ق.' },
  { n: 'شاه طهماسب', y: '۹۳۰–۹۸۴ ق', tone: 'turq', t: 'تثبیت', text: 'جنگ‌های طولانی با عثمانی و ازبک؛ پایتخت به قزوین منتقل شد.', key: 'دولت از نهضت به نهاد تبدیل شد.' },
  { n: 'شاه عباس', y: '۹۹۶–۱۰۳۸ ق', tone: 'gold', t: 'اوج', text: 'ارتش تازه، پایتخت به اصفهان ۱۰۰۷ ق، میدان نقش جهان و سی‌وسه‌پل.', key: 'قدرت مرکزی، تجارت و شکوه شهری.' },
  { n: 'شاه صفی', y: '۱۰۳۸–۱۰۵۲ ق', tone: 'rose', t: 'شروع افت', text: 'کاهش مشارکت قزلباش، جنگ با عثمانی و از دست رفتن بغداد.', key: 'ضعف دیوان و ارتش.' },
  { n: 'شاه سلطان حسین', y: '۱۱۰۵–۱۱۳۵ ق', tone: 'rose', t: 'فروپاشی', text: 'شورش افغان‌ها و سقوط اصفهان در ۱۱۳۵ ق.', key: 'پایان دولت صفوی.' }
]

export function SafavidChain() {
  const [i, setI] = useState(2)
  const s = SHAHS[i]

  return (
    <SignatureStage
      kicker="زنجیرهٔ شاهان · درس ۱۳"
      title="صفویه: از نهضت تا امپراتوری، و از اوج تا سقوط"
      hint="پنج ایستگاه را روی خط زمان انتخاب کن؛ هر شاه، یک تغییر ساختاری در دولت است، نه فقط یک نام در فهرست."
      tone="gold"
    >
      <div className="relative mb-3">
        <div className="absolute inset-x-0 top-[18px] h-px bg-line" />
        <div className="relative flex items-start justify-between gap-1">
          {SHAHS.map((x, k) => (
            <button key={x.n} onClick={() => setI(k)} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[0.54rem] text-faint">{x.y.split('–')[0]}</span>
              <span className={cn('grid size-9 place-items-center rounded-full border text-[0.56rem] font-bold transition', k === i ? 'scale-110 border-gold bg-gold text-bg' : 'border-line bg-surface text-faint hover:border-gold/40')}>
                {fas(k + 1)}
              </span>
              <span className={cn('text-center text-[0.58rem] leading-4', k === i ? 'font-bold text-ink' : 'text-faint')}>{x.n.replace('شاه ', '')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-[1.2fr_1fr]">
        <motion.div key={s.n} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Tag tone={s.tone as 'gold' | 'turq' | 'rose'}>{s.y}</Tag>
            <Tag>{s.t}</Tag>
          </div>
          <div className="text-[0.95rem] font-black">{s.n}</div>
          <p className="mt-1.5 text-[0.78rem] leading-7 text-muted">{s.text}</p>
        </motion.div>
        <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-3">
          <div className="text-[0.58rem] tracking-widest text-gold">نکتهٔ کلیدی</div>
          <p className="mt-1 text-[0.76rem] leading-7 text-muted">{s.key}</p>
          <div className="mt-2.5 flex gap-1">
            {SHAHS.map((x, k) => <span key={x.n} className={cn('h-1 flex-1 rounded-full', k <= i ? 'bg-gold/70' : 'bg-line')} />)}
          </div>
          <div className="mt-1.5 text-[0.55rem] text-faint">{fas(i + 1)} از {fas(SHAHS.length)} ایستگاه</div>
        </div>
      </div>
    </SignatureStage>
  )
}
