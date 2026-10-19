import { useState } from 'react'
import { motion } from 'framer-motion'
import { fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

type Clan = {
  id: string
  name: string
  angle: number
  role: string
  stance: string
  fact: string
  tone: 'gold' | 'turq' | 'rose'
}

const CLANS: Clan[] = [
  { id: 'hashim', name: 'بنی‌هاشم', angle: 205, role: 'خاندان پیامبر', stance: 'پشتیبان، سپس دشمن‌شده', fact: 'پس از بعثت، ابوطالب پیمان حمایت بست؛ در شعب ابی‌طالب محاصره شدند.', tone: 'gold' },
  { id: 'umayya', name: 'بنی‌امیه', angle: 335, role: 'خاندان ثروت و تجارت', stance: 'مخالف سرسخت', fact: 'ابوسفیان و ابوجهل رهبری مخالفت اقتصادی و تبلیغاتی را داشتند.', tone: 'rose' },
  { id: 'makhzum', name: 'بنی‌مخزوم', angle: 30, role: 'خاندان جنگاوری', stance: 'دشمن در بدر و احد', fact: 'خالد بن ولید و عمرو بن هشام از این خاندان بودند; خالد بعدها مسلمان شد.', tone: 'rose' },
  { id: 'khazraj', name: 'خزرج و اوس', angle: 100, role: 'دو قبیلهٔ یثرب', stance: 'میزبان مدینه', fact: 'بیعت عقبه در همین دو قبیله رخ داد و راه هجرت را گشود.', tone: 'turq' },
  { id: 'thaqif', name: 'ثقبف طائف', angle: 150, role: 'رقیب تجاری', stance: 'مذاکره و سپس اسلام', fact: 'در سال نهم ق پذیرفتند؛ پذیرش طائف از اقتدار نظامی مکه نشان دارد.', tone: 'gold' },
  { id: 'kinana', name: 'کنانه و بنی‌بکر', angle: 260, role: 'قبایل پیرامون', stance: 'بی‌طرف و پیمان‌شکن', fact: 'پیمان حدیبیه با همین قبایل و پیمان‌شکنیِ بنی‌بکر با فتح مکه پیوند دارد.', tone: 'gold' }
]

export function MeccaRing() {
  const [id, setId] = useState('hashim')
  const c = CLANS.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="تجربهٔ میدانی · درس ۳"
      title="مکه: قدرت دور کعبه، نه در کعبه"
      hint="هر خاندان را از حلقهٔ دور کعبه انتخاب کن. مکه پیش از اسلام نه شهر نهادها بود و نه حکومت واحد: شبکه‌ای از خاندان‌ها که کعبه و تجارت، آن‌ها را به هم دوخته بود."
      tone="gold"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[340px]">
          <div className="absolute inset-0 rounded-full border border-dashed border-gold/25" />
          <div className="absolute inset-[18%] rounded-full border border-gold/15" />
          <div className="absolute left-1/2 top-1/2 grid size-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[0.6rem] border border-gold/50 bg-gold/12 text-center">
            <span className="text-[0.62rem] font-bold text-gold">کعبه</span>
          </div>
          {CLANS.map((cl) => {
            const rad = (cl.angle * Math.PI) / 180
            const r = 41
            const x = 50 + Math.cos(rad) * r
            const y = 50 + Math.sin(rad) * r
            const on = cl.id === id
            return (
              <button
                key={cl.id}
                onClick={() => setId(cl.id)}
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
                className={`absolute whitespace-nowrap rounded-lg border px-2 py-1 text-[0.6rem] transition ${
                  on
                    ? 'z-10 border-gold bg-gold text-bg shadow-lg'
                    : 'border-line bg-surface/80 text-muted backdrop-blur hover:border-gold/50 hover:text-ink'
                }`}
              >
                {cl.name}
              </button>
            )
          })}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-[0.56rem] text-faint">نمای شماتیک · جای دقیق خاندان‌ها روی حلقه مهم نیست</div>
        </div>

        <div className="rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Tag tone={c.tone}>{c.role}</Tag>
            <Tag>{c.stance}</Tag>
          </div>
          <h3 className="text-[1rem] font-black">{c.name}</h3>
          <p className="mt-1.5 text-[0.78rem] leading-7 text-muted">{c.fact}</p>

          <div className="mt-3 rounded-lg border border-gold/25 bg-gold/6 px-2.5 py-2">
            <div className="text-[0.6rem] text-gold">نکتهٔ امتحانی</div>
            <p className="mt-0.5 text-[0.74rem] leading-6 text-muted">
              «تاریخ مکه پیش از اسلام، تاریخ یک حکومت نیست؛ تاریخ موازنهٔ قبایل است.» این جمله را با سه نمونه (شعب ابی‌طالب،
              پیمان حدیبیه، فتح مکه) می‌توانی مستدل کنی.
            </p>
          </div>

          <div className="mt-3 flex gap-1">
            {CLANS.map((x) => (
              <motion.span
                key={x.id}
                layout
                className={`h-1 flex-1 rounded-full ${x.id === id ? 'bg-gold' : 'bg-line'}`}
              />
            ))}
          </div>
          <div className="mt-2 text-[0.56rem] text-faint">{fas(CLANS.length)} خاندان در این شبکه · یکی را انتخاب کن</div>
        </div>
      </div>
    </SignatureStage>
  )
}
