import { useState } from 'react'
import { AlertOctagon, CheckCircle2, ChevronLeft, FlaskConical } from 'lucide-react'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const STEPS = [
  {
    t: 'طرح پرسش',
    d: 'پرسش باید بسته و پاسخ‌پذیر باشد: «چرا ساسانیان در نهاوند شکست خوردند؟» نه «تاریخ ایران چه شد؟»',
    good: 'پرسش روشن، محدود به زمان و مکان.',
    bad: 'پرسش کلی که هیچ منبعی پاسخش را ندارد.'
  },
  {
    t: 'فرضیه',
    d: 'حدس روشن و آزمون‌پذیر: «ضعف ساختار حکومت ساسانی در سدهٔ هفتم، بیش از شمار لشکر، تعیین‌کننده بود.»',
    good: 'فرضیه‌ای که می‌توان آن را با شواهد رد یا تأیید کرد.',
    bad: 'فرضیه‌ای که هر نتیجه‌ای آن را تأیید کند.'
  },
  {
    t: 'گردآوری شواهد',
    d: 'منبع نوشتاری، مادی و شفاهی را کنار هم می‌گذاری؛ چند منبع مستقل بهتر از یک منبع پرجزئیات است.',
    good: 'چند منبع با دیدگاه‌های متفاوت.',
    bad: 'تکیه بر یک روایت چون «معروف‌تر» است.'
  },
  {
    t: 'نقد و سنجش',
    d: 'می‌پرسی چه کسی، کِی، برای چه نوشته و چه چیزی را نگفته است. سکوت منبع هم داده است.',
    good: 'سنجش سند، انگیزهٔ نویسنده و تناقض‌ها.',
    bad: 'پذیرش هر چه در کتاب آمده، بی‌پرسش.'
  },
  {
    t: 'نگارش یافته',
    d: 'روایت را با ارجاع می‌نویسی، شواهد مخالف را هم می‌آوری و مرز «دانسته» و «گمانه» را روشن می‌کنی.',
    good: 'نتیجهٔ مشروط، همراه با شاهد.',
    bad: 'قطعیت مطلق و حذف شواهد مخالف.'
  }
]

export function MethodLab() {
  const [i, setI] = useState(0)
  const s = STEPS[i]

  return (
    <SignatureStage
      kicker="کارگاه روش · درس ۲"
      title="پنج گام یک پژوهش، از پرسش تا روایت"
      hint="هر گام را باز کن؛ کنار توضیح، «چه چیزی پژوهش را نجات می‌دهد» و «کجا کار خراب می‌شود» آمده است."
      tone="turq"
    >
      <div className="flex flex-wrap items-stretch gap-1.5">
        {STEPS.map((x, k) => (
          <button
            key={x.t}
            onClick={() => setI(k)}
            className={cn(
              'group relative flex-1 rounded-xl border px-2 py-2 text-center transition',
              k === i ? 'border-turq/60 bg-turq/10' : 'border-line bg-bg/35 hover:border-turq/35'
            )}
          >
            <div className="mb-1 flex items-center justify-center gap-1">
              <span className={cn('grid size-5 place-items-center rounded-md text-[0.55rem] font-bold', k === i ? 'bg-turq/20 text-turq' : 'bg-ink/5 text-faint')}>{fas(k + 1)}</span>
              {k < STEPS.length - 1 && <ChevronLeft size={10} className="absolute -start-1.5 top-1/2 hidden -translate-y-1/2 text-faint sm:block" />}
            </div>
            <div className={cn('text-[0.68rem] font-semibold', k === i ? 'text-ink' : 'text-muted')}>{x.t}</div>
          </button>
        ))}
      </div>

      <div className="mb-2 flex gap-1"><Tag tone="gold">آزمون</Tag><Tag>تست</Tag></div>
      <div className="mt-3 grid gap-2.5 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] tracking-widest text-turq">
            <FlaskConical size={11} /> گام {fas(i + 1)} از {fas(STEPS.length)}
          </div>
          <h3 className="text-[0.95rem] font-bold">{s.t}</h3>
          <p className="mt-1.5 text-[0.78rem] leading-7 text-muted">{s.d}</p>
        </div>
        <div className="space-y-2">
          <div className="rounded-lg border border-turq/30 bg-turq/6 px-2.5 py-2">
            <div className="flex items-center gap-1 text-[0.6rem] text-turq"><CheckCircle2 size={11} /> پژوهش سالم</div>
            <p className="mt-0.5 text-[0.74rem] leading-6 text-muted">{s.good}</p>
          </div>
          <div className="rounded-lg border border-rose/30 bg-rose/6 px-2.5 py-2">
            <div className="flex items-center gap-1 text-[0.6rem] text-rose"><AlertOctagon size={11} /> دام رایج</div>
            <p className="mt-0.5 text-[0.74rem] leading-6 text-muted">{s.bad}</p>
          </div>
        </div>
      </div>
    </SignatureStage>
  )
}
