import { useState } from 'react'
import { Church, Crown, Shield, Wheat } from 'lucide-react'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const RANKS = [
  { id: 'king', n: 'پادشاه', icon: Crown, gift: 'زمین را به اربابان بزرگ می‌بخشد', gets: 'سرباز، وفاداری و مالیات غیرمستقیم', text: 'قدرت پادشاه بر وفاداری شخصی تکیه داشت، نه بر دیوان و ارتش دائمی.' },
  { id: 'lord', n: 'اربابان بزرگ', icon: Shield, gift: 'زمین را به شوالیه‌ها می‌سپارند', gets: 'خدمت نظامی و خراج', text: 'زمین، پول و قدرت را جایگزین نهاد اداری کرد؛ همین «فئودالیسم» است.' },
  { id: 'knight', n: 'شوالیه‌ها', icon: Shield, gift: 'امنیت محلی و جنگ', gets: 'زمین و حق بهرهٔ کشاورزان', text: 'شوالیه‌ها حلقهٔ نظامی جامعه بودند؛ بدون آن‌ها ارباب نمی‌توانست حکومت کند.' },
  { id: 'serf', n: 'کشاورزان', icon: Wheat, gift: 'کار، محصول و مالیات', gets: 'زمین برای کشت و امنیت محلی', text: 'اکثریت جامعه؛ وابسته به زمین و ارباب، با کمترین تحرک اجتماعی.' }
]

export function FeudalOrder() {
  const [id, setId] = useState('lord')
  const r = RANKS.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="ساختار جامعه · درس ۱۵"
      title="قرون وسطا: جامعه‌ای که با زمین بسته شده بود"
      hint="در اروپای قرون وسطا، قدرت با زمین اندازه‌گیری می‌شد. هر لایه را انتخاب کن تا بده‌بستان میان لایه‌ها را ببینی."
      tone="lapis"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className="space-y-1.5">
          {RANKS.map((x, k) => {
            const Icon = x.icon
            return (
              <button
                key={x.id}
                onClick={() => setId(x.id)}
                className={cn('flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 transition', x.id === id ? 'border-gold/60 bg-gold/10' : 'border-line bg-bg/30 hover:border-gold/30')}
                style={{ marginInlineStart: `${k * 6}px`, marginInlineEnd: `${(RANKS.length - 1 - k) * 6}px` }}
              >
                <Icon size={14} className={x.id === id ? 'text-gold' : 'text-faint'} />
                <span className="flex-1 text-[0.76rem] font-semibold">{x.n}</span>
                <Tag>{fas(RANKS.length - k)}</Tag>
              </button>
            )
          })}
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.05] px-2.5 py-2">
            <Church size={15} className="text-gold" />
            <div className="text-[0.68rem] leading-6 text-muted">
              <b className="text-ink">کلیسا</b> در کنار این هرم: زمین‌دار بزرگ، مرجع آموزش و مشروعیت‌بخش قدرت پادشاهان.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Tag tone="gold">{r.n}</Tag>
          </div>
          <p className="text-[0.78rem] leading-7 text-muted">{r.text}</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-turq/25 bg-turq/5 px-2 py-1.5">
              <div className="text-[0.58rem] text-turq">می‌دهد</div>
              <p className="mt-0.5 text-[0.7rem] leading-6 text-muted">{r.gift}</p>
            </div>
            <div className="rounded-lg border border-gold/25 bg-gold/5 px-2 py-1.5">
              <div className="text-[0.58rem] text-gold">می‌گیرد</div>
              <p className="mt-0.5 text-[0.7rem] leading-6 text-muted">{r.gets}</p>
            </div>
          </div>
          <div className="mt-2.5 text-[0.55rem] text-faint">{fas(RANKS.indexOf(r) + 1)} از {fas(RANKS.length)} لایه</div>
        </div>
      </div>
    </SignatureStage>
  )
}
