import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Flame, Landmark, Swords } from 'lucide-react'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const WAVES = [
  {
    id: 'chengiz',
    t: 'موج ویرانی',
    year: '۶۱۶ ق',
    icon: Flame,
    tone: 'rose',
    title: 'حملهٔ چنگیز',
    text: 'پس از کشته‌شدن فرستادگان مغول در خوارزم، چنگیز به ایران آمد. شهرهای ماوراءالنهر و خراسان یکی‌یکی ویران شدند.',
    effect: 'کشتار گسترده، ویرانی شهرها و فروپاشی دولت خوارزمشاهی.'
  },
  {
    id: 'hulagu',
    t: 'موج فتح',
    year: '۶۵۴ ق',
    icon: Swords,
    tone: 'rose',
    title: 'هلاکو و پایان خلافت',
    text: 'هلاکو بغداد را در ۶۵۶ ق گرفت؛ خلافت عباسی پایان یافت و ایلخانان در ایران بر سر کار آمدند.',
    effect: 'مرکز سیاسی از بغداد به ایران منتقل شد — زمینهٔ یک دورهٔ تازه.'
  },
  {
    id: 'ghazan',
    t: 'موج سازندگی',
    year: '۶۹۴ ق',
    icon: Coins,
    tone: 'turq',
    title: 'غازان و اصلاحات',
    text: 'غازان مسلمان شد؛ اصلاحات مالی و اداری، بازسازی کشاورزی و رواج کتابت و هنر آغاز شد.',
    effect: 'وزیر رشیدالدین فضل‌الله، دیوان و تاریخ‌نگاری را نوسازی کرد.'
  },
  {
    id: 'timur',
    t: 'موج تازه',
    year: '۷۷۱–۸۰۷ ق',
    icon: Landmark,
    tone: 'gold',
    title: 'تیمور و هنر',
    text: 'تیمور با لشکرکشی ویرانگر آمد، اما جانشینانش (شاهرخ و گوهرشاد) حامیان بزرگ معماری و هنر شدند.',
    effect: 'سمرقند و هرات مرکز نگارگری، خط و معماری شدند.'
  }
]

export function MongolStorm() {
  const [id, setId] = useState('chengiz')
  const w = WAVES.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="موج‌نگار · درس ۱۱"
      title="ویرانی و ساخت، در یک قرن"
      hint="مغول فقط ویرانی نیاورد؛ تاریخ ایرانِ این دوره دو موج دارد: ویرانیِ حمله و سپس سازندگیِ ایلخانان و تیموریان. روی هر موج بزن."
      tone="rose"
    >
      <div className="relative mb-4 mt-1">
        <div className="absolute inset-x-0 top-4 h-px bg-line" />
        <div className="relative flex items-start justify-between gap-1">
          {WAVES.map((x, k) => {
            const Icon = x.icon
            const on = x.id === id
            return (
              <button key={x.id} onClick={() => setId(x.id)} className="group flex flex-1 flex-col items-center gap-1">
                <span className={cn('text-[0.58rem]', on ? 'text-gold' : 'text-faint')}>{x.year}</span>
                <span className={cn('grid size-8 place-items-center rounded-full border transition', on ? 'scale-110 border-gold bg-gold/15 text-gold' : 'border-line bg-surface text-faint group-hover:border-gold/40')}>
                  <Icon size={14} />
                </span>
                <span className={cn('text-center text-[0.58rem]', on ? 'font-bold text-ink' : 'text-faint')}>{x.t}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex gap-1">
          {WAVES.map((x) => (
            <motion.span key={x.id} className={cn('h-8 flex-1 rounded-t-md', x.tone === 'rose' ? 'bg-rose/25' : x.tone === 'turq' ? 'bg-turq/25' : 'bg-gold/25')} animate={{ opacity: x.id === id ? 1 : 0.4 }} />
          ))}
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Tag tone={w.tone as 'turq' | 'rose' | 'gold'}>{w.year}</Tag>
            <Tag>{w.t}</Tag>
          </div>
          <div className="text-[0.95rem] font-black">{w.title}</div>
          <p className="mt-1.5 text-[0.78rem] leading-7 text-muted">{w.text}</p>
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-3">
          <div className="text-[0.58rem] tracking-widest text-gold">پیامد</div>
          <p className="mt-1 text-[0.76rem] leading-7 text-muted">{w.effect}</p>
          <div className="mt-2 text-[0.55rem] text-faint">{fas(WAVES.indexOf(w) + 1)} از {fas(WAVES.length)} ایستگاه</div>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-dashed border-line px-2.5 py-2 text-[0.7rem] leading-6 text-faint">
        جملهٔ کلیدی برای نوشتن پاسخ: «حملهٔ مغول گسست بود، نه پایان؛ آنچه پس از آن ساخته شد، خود بخشی از تمدن ایرانی-اسلامی است.»
      </div>
    </SignatureStage>
  )
}
