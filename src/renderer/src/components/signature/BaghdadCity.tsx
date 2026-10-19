import { useState } from 'react'
import { Landmark, Scroll, Shield, Store } from 'lucide-react'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const LAYERS = [
  {
    id: 'caliph',
    n: 'کاخ خلیفه',
    icon: Landmark,
    text: 'در مرکز شهر مدور؛ قدرت از نقطه‌ای ناشناخته برای مردم اعمال می‌شد. خلیفه از پشت پرده حکم می‌کرد.',
    tag: 'قدرت پنهان'
  },
  {
    id: 'mosque',
    n: 'مسجد جامع',
    icon: Shield,
    text: 'کنار کاخ؛ هم عبادتگاه و هم میدان مشروعیت سیاسی. خطبهٔ جمعه، رسانهٔ رسمی دولت بود.',
    tag: 'مشروعیت'
  },
  {
    id: 'diwan',
    n: 'دواوین',
    icon: Scroll,
    text: 'دیوان خراج، دیوان جیش و دیوان رسائل؛ الگوی اداری ایرانی که به خلافت رسید.',
    tag: 'ادارهٔ ایرانی'
  },
  {
    id: 'bazaar',
    n: 'بازار و کاروانسرا',
    icon: Store,
    text: 'حلقهٔ اقتصاد شهر؛ بغداد چهارراه راه‌های تجاری بود و ثروتش دانش و هنر را هم می‌کشید.',
    tag: 'اقتصاد'
  }
]

export function BaghdadCity() {
  const [id, setId] = useState('diwan')
  const l = LAYERS.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="کالبد شهر · درس ۷"
      title="بغداد: شهری دایره‌ای برای حکومتی متمرکز"
      hint="بغداد ۱۴۵ ق ساخته شد و الگوی شهرسازی عباسی شد. حلقه‌های شهر را انتخاب کن؛ هر حلقه یک سازوکار قدرت است."
      tone="turq"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[320px]">
          {LAYERS.map((x, k) => (
            <button
              key={x.id}
              onClick={() => setId(x.id)}
              className={cn(
                'absolute rounded-full border transition',
                x.id === id ? 'border-gold/70 bg-gold/12' : 'border-line hover:border-gold/40'
              )}
              style={{ inset: `${k * 11}%` }}
              aria-label={x.n}
            />
          ))}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-[0.58rem] tracking-widest text-faint">مدینة‌السلام</div>
              <div className="mt-0.5 text-[0.85rem] font-black text-gold">بغداد</div>
              <div className="text-[0.55rem] text-faint">۱۴۵ ق</div>
            </div>
          </div>
          {LAYERS.map((x, k) => (
            <span key={`d-${x.id}`} className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[0.55rem] text-faint" style={{ top: `${k * 11 + 1.5}%` }}>{x.n}</span>
          ))}
        </div>

        <div>
          <div className="mb-2 grid grid-cols-2 gap-1.5">
            {LAYERS.map((x) => {
              const Icon = x.icon
              return (
                <button
                  key={x.id}
                  onClick={() => setId(x.id)}
                  className={cn('flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[0.68rem] transition', x.id === id ? 'border-turq/55 bg-turq/10 text-turq' : 'border-line text-muted hover:text-ink')}
                >
                  <Icon size={12} /> {x.n}
                </button>
              )
            })}
          </div>
          <div className="rounded-xl border border-line bg-bg/40 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Tag tone="turq">{l.tag}</Tag>
            </div>
            <div className="text-[0.88rem] font-bold">{l.n}</div>
            <p className="mt-1 text-[0.76rem] leading-7 text-muted">{l.text}</p>
          </div>
          <div className="mt-2 rounded-lg border border-gold/25 bg-gold/[0.05] px-2.5 py-2 text-[0.7rem] leading-6 text-muted">
            <b className="text-ink">پیوند با درس:</b> شکوه بغداد و «عصر طلایی» عباسی، همان دوره‌ای است که ایرانیان در دیوان و وزارت
            نفوذ یافتند — از برمکیان تا خاندان‌های دیوانی بعدی.
          </div>
          <div className="mt-2 flex gap-1">
            {LAYERS.map((x) => <span key={x.id} className={cn('h-1 flex-1 rounded-full', x.id === id ? 'bg-gold' : 'bg-line')} />)}
          </div>
          <div className="mt-1 text-[0.55rem] text-faint">{fas(LAYERS.indexOf(l) + 1)} از {fas(LAYERS.length)} لایه</div>
        </div>
      </div>
    </SignatureStage>
  )
}
