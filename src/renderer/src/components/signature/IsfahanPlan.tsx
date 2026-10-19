import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

type Spot = { id: string; n: string; x: number; y: number; year: string; text: string }

const SPOTS: Spot[] = [
  { id: 'meydan', n: 'میدان نقش جهان', x: 50, y: 50, year: '۱۰۰۷ ق', text: 'قلب شهر تازه: میدان عمومی برای بازی چوگان، بازار، و نمایش قدرت. چهار بنای بزرگ در چهار سوی آن.' },
  { id: 'shah', n: 'مسجد شاه', x: 34, y: 50, year: '۱۰۲۰ ق', text: 'مسجد جامع شهر، با گنبد بزرگ و کاشی‌کاری؛ نشانهٔ پیوند دین و دولت صفوی.' },
  { id: 'aliqapu', n: 'عالی‌قاپو', x: 66, y: 50, year: 'سدهٔ ۱۱ ق', text: 'کاخ بلند در ضلع غربی میدان؛ جایی که شاه از ایوانش رژه و بازی را می‌دید.' },
  { id: 'bazaar', n: 'بازار قیصریه', x: 50, y: 30, year: '۱۰۰۷ ق', text: 'دروازهٔ اقتصادی میدان؛ پیوند با راه‌های تجاری و بازارهای درون‌شهری.' },
  { id: 'bridge', n: 'سی‌وسه‌پل', x: 76, y: 82, year: 'سدهٔ ۱۱ ق', text: 'پل بر زاینده‌رود؛ هم عبور و هم یک بنای اجتماعی و تفریحی.' },
  { id: 'jolfa', n: 'محلهٔ جلفای نو', x: 24, y: 82, year: '۱۰۱۴ ق', text: 'محلهٔ ارامنه که شاه عباس به اصفهان آورد؛ نمونٔ سیاست جذب نیروی کار و تجارت.' }
]

export function IsfahanPlan() {
  const [id, setId] = useState('meydan')
  const s = SPOTS.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="نقشهٔ شهر · درس ۱۴"
      title="اصفهان: شهری که قدرت را به نمایش گذاشت"
      hint="شاه عباس پایتخت را جابه‌جا کرد تا هم از مرز عثمانی دور باشد و هم مرکز تازه‌ای بسازد. نشانه‌های شهر را انتخاب کن."
      tone="turq"
    >
      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-[linear-gradient(180deg,rgba(28,58,120,0.15),rgba(12,119,114,0.12))]">
          <div className="sig-ornament absolute inset-0 opacity-20" />
          {/* زاینده‌رود */}
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 75" preserveAspectRatio="none">
            <path d="M0 62 C20 58 44 66 62 60 S86 62 100 58" fill="none" stroke="#3f9c95" strokeOpacity="0.5" strokeWidth="1.4" />
            <path d="M0 65 C22 61 44 69 64 63 S88 65 100 61" fill="none" stroke="#3f9c95" strokeOpacity="0.25" strokeWidth="0.8" />
            <rect x="30" y="32" width="46" height="30" rx="2" fill="var(--c-bg)" fillOpacity="0.35" stroke="var(--c-gold)" strokeOpacity="0.35" strokeWidth="0.4" />
            {SPOTS.map((p) => (
              <line key={p.id} x1="50" y1="47" x2={p.x} y2={p.y * 0.75} stroke="var(--c-gold)" strokeOpacity={p.id === id ? 0.5 : 0.12} strokeWidth="0.35" />
            ))}
          </svg>
          {SPOTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setId(p.id)}
              style={{ left: `${p.x}%`, top: `${p.y * 0.75}%`, transform: 'translate(-50%,-50%)' }}
              className={`absolute flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[0.55rem] transition ${p.id === id ? 'z-10 border-gold bg-gold text-bg shadow-lg' : 'border-line bg-surface/90 text-muted backdrop-blur hover:border-gold/50'}`}
            >
              <MapPin size={9} /> {p.n}
            </button>
          ))}
          <div className="absolute bottom-1 left-2 text-[0.5rem] text-turq/80">زاینده‌رود</div>
          <div className="absolute left-1/2 top-[47%] -translate-x-1/2 text-[0.5rem] text-gold/70">میدان نقش جهان</div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap gap-1">
            {SPOTS.map((p) => (
              <button key={p.id} onClick={() => setId(p.id)} className={`rounded-md border px-1.5 py-0.5 text-[0.55rem] ${p.id === id ? 'border-turq/60 text-turq' : 'border-line text-faint'}`}>{p.n}</button>
            ))}
          </div>
          <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-line bg-bg/40 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Tag tone="turq">{s.year}</Tag>
            </div>
            <div className="text-[0.9rem] font-black">{s.n}</div>
            <p className="mt-1 text-[0.75rem] leading-7 text-muted">{s.text}</p>
          </motion.div>
          <div className="mt-2 rounded-lg border border-gold/25 bg-gold/[0.05] px-2.5 py-2 text-[0.68rem] leading-6 text-muted">
            <b className="text-ink">چرا مهم است؟</b> انتقال پایتخت به اصفهان، هم سیاسی بود (فاصله از عثمانی) و هم اقتصادی
            (پیوند با خلیج فارس)؛ میدان نقش جهان، صورت معماریِ همین سیاست است.
          </div>
          <div className="mt-1.5 text-[0.55rem] text-faint">{fas(SPOTS.indexOf(s) + 1)} از {fas(SPOTS.length)} نشانه</div>
        </div>
      </div>
    </SignatureStage>
  )
}
