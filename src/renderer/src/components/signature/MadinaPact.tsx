import { useState } from 'react'
import { Handshake, Scale, ShieldCheck, Users } from 'lucide-react'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

type Clause = { id: string; title: string; text: string; who: ('مهاجر' | 'انصار' | 'یهود')[]; kind: 'حق' | 'تکلیف' | 'رابطه' }

const CLAUSES: Clause[] = [
  { id: 'ummah', title: 'یک امت', text: 'مهاجران و انصار و پیروان، امتی واحد شناخته می‌شوند؛ خون و پیمانشان از دیگر مردم جداست.', who: ['مهاجر', 'انصار'], kind: 'رابطه' },
  { id: 'blood', title: 'خون‌بها و دیه', text: 'هر گروه دیهٔ خود را بر پایهٔ رسم پیشین می‌پردازد؛ عدالت درون گروه با داوری پیامبر حل می‌شود.', who: ['مهاجر', 'انصار'], kind: 'تکلیف' },
  { id: 'jews', title: 'یهود در پیمان', text: 'یهود مدینه با مؤمنان در برابر دشمن مشترک هم‌پیمان‌اند و دین خود را دارند؛ حق شهروندی دارند.', who: ['یهود', 'انصار'], kind: 'حق' },
  { id: 'war', title: 'دفاع مشترک', text: 'مدینه در برابر حملهٔ بیرونی با همهٔ گروه‌ها دفاع می‌شود؛ پیمان‌شکنی، خروج از امت است.', who: ['مهاجر', 'انصار', 'یهود'], kind: 'تکلیف' },
  { id: 'arbiter', title: 'داوری پیامبر', text: 'اختلاف‌ها به پیامبر ارجاع می‌شود؛ مرجعیت سیاسی از قبیله به «امت» منتقل می‌شود.', who: ['مهاجر', 'انصار', 'یهود'], kind: 'رابطه' }
]

const GROUPS = ['همه', 'مهاجر', 'انصار', 'یهود'] as const

export function MadinaPact() {
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('همه')
  const [open, setOpen] = useState('ummah')
  const shown = CLAUSES.filter((c) => group === 'همه' || c.who.includes(group))

  return (
    <SignatureStage
      kicker="سند‌خوانی · درس ۴"
      title="پیمان مدینه: نخستین قانون اساسی یک «امت»"
      hint="پیمان مدینه فقط صلح میان دو قبیله نبود؛ چارچوب حقوق و تکالیف گروه‌های گوناگون در یک شهر بود. یک گروه را انتخاب کن و ببین چه چیزی به دست می‌آورد و چه چیزی می‌پذیرد."
      tone="turq"
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[0.68rem] transition',
              group === g ? 'border-turq/60 bg-turq/12 text-turq' : 'border-line text-muted hover:text-ink'
            )}
          >
            {g}
          </button>
        ))}
        <span className="ms-auto self-center text-[0.6rem] text-faint">{fas(shown.length)} بند</span>
      </div>

      <div className="space-y-2">
        {shown.map((c, i) => {
          const on = open === c.id
          const Icon = c.kind === 'حق' ? ShieldCheck : c.kind === 'تکلیف' ? Scale : Handshake
          return (
            <div key={c.id} className="overflow-hidden rounded-xl border border-line bg-bg/35">
              <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start" onClick={() => setOpen(on ? '' : c.id)}>
                <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-turq/30 bg-turq/8 text-turq">
                  <Icon size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8rem] font-bold">{c.title}</span>
                  <span className="mt-0.5 flex flex-wrap gap-1">
                    {c.who.map((w) => (
                      <span key={w} className="text-[0.55rem] text-faint">
                        {w}
                        {w !== c.who[c.who.length - 1] ? ' · ' : ''}
                      </span>
                    ))}
                  </span>
                </span>
                <Tag tone={c.kind === 'حق' ? 'turq' : c.kind === 'تکلیف' ? 'gold' : 'neutral'}>{c.kind}</Tag>
                <span className="text-[0.58rem] text-faint">{fas(i + 1)}</span>
              </button>
              {on && <p className="border-t border-line px-3 py-2.5 text-[0.76rem] leading-7 text-muted">{c.text}</p>}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-gold/25 bg-gold/[0.05] px-2.5 py-2">
        <Users size={13} className="mt-0.5 shrink-0 text-gold" />
        <p className="text-[0.72rem] leading-6 text-muted">
          <b className="text-ink">چرا مهم است؟</b> با این پیمان، پیامبر از «رهبر یک گروه» به «داور یک شهر» تبدیل شد. پرسش امتحانی
          معمولاً همین است: تفاوت مکه و مدینه در ساخت قدرت چه بود؟
        </p>
      </div>
    </SignatureStage>
  )
}
