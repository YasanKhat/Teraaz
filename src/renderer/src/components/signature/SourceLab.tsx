import { useState } from 'react'
import { BookOpenText, Coins, Mic, ScrollText, Stamp, TriangleAlert } from 'lucide-react'
import { fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

type Src = {
  id: string
  name: string
  kind: 'نوشتاری' | 'مادی' | 'شفاهی'
  icon: typeof ScrollText
  when: string
  near: 'هم‌زمان' | 'نزدیک' | 'دور'
  claim: string
  strength: string
  trap: string
  score: number
}

const SOURCES: Src[] = [
  {
    id: 'quran',
    name: 'قرآن کریم',
    kind: 'نوشتاری',
    icon: BookOpenText,
    when: 'سدهٔ ۱ ق',
    near: 'هم‌زمان',
    claim: 'رویدادهای صدر اسلام، پیمان‌ها و مناسبات اجتماعی را بازمی‌تاباند.',
    strength: 'متن هم‌زمان و ثبت‌شده؛ برای فهم باورها و روابط اجتماعی معتبرترین لایه.',
    trap: 'از آن برای جزئیات نظامی و آمار لشکر استفاده نکن؛ هدفش گزارش جنگ نیست.',
    score: 92
  },
  {
    id: 'coin',
    name: 'سکهٔ دورهٔ عبدالملک',
    kind: 'مادی',
    icon: Coins,
    when: '۷۷ ق',
    near: 'نزدیک',
    claim: 'ضرب سکهٔ اسلامی و حذف تصویر پادشاه، نشانهٔ استقلال سیاسی است.',
    strength: 'دادهٔ مادی و بی‌واسطه؛ کسی نمی‌تواند بعدها آن را جعل کند.',
    trap: 'سکه فقط «ادعای حاکم» را نشان می‌دهد، نه پذیرش عمومی مردم.',
    score: 84
  },
  {
    id: 'inscription',
    name: 'کتیبهٔ بنای مسجد',
    kind: 'مادی',
    icon: Stamp,
    when: 'سدهٔ ۲ ق',
    near: 'نزدیک',
    claim: 'نام بانی، تاریخ ساخت و القاب رسمی را ثبت می‌کند.',
    strength: 'تاریخ‌گذاری دقیق و قابل مقایسه با متن‌ها.',
    trap: 'کتیبه معمولاً خودستایی بانی است؛ سکوتش دربارهٔ مخالفان را جدی بگیر.',
    score: 78
  },
  {
    id: 'tabari',
    name: 'تاریخ طبری',
    kind: 'نوشتاری',
    icon: ScrollText,
    when: 'سدهٔ ۳–۴ ق',
    near: 'دور',
    claim: 'روایت‌های گوناگون فتوحات و خلافت را با سند گرد آورده است.',
    strength: 'جامع‌ترین گنجینهٔ روایت‌ها؛ سندها را نشان می‌دهد.',
    trap: 'حدود دو سده پس از رویداد نوشته شده؛ سندها را باید جدا سنجید.',
    score: 66
  },
  {
    id: 'oral',
    name: 'روایت شفاهی یک خاندان',
    kind: 'شفاهی',
    icon: Mic,
    when: 'امروز',
    near: 'دور',
    claim: 'خاطرهٔ خانوادگی از یک رویداد محلی را بازگو می‌کند.',
    strength: 'صدای مردم عادی و جزئیات زندگی روزانه را دارد.',
    trap: 'حافظه تغییر می‌کند؛ باید با سند نوشتاری یا مادی هم‌سنجی شود.',
    score: 44
  }
]

export function SourceLab() {
  const [id, setId] = useState('coin')
  const s = SOURCES.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="کارگاه منبع‌شناسی · درس ۱"
      title="یک منبع را بگیر، چهار پرسش از آن بپرس"
      hint="مورخ پیش از باور، منبع را می‌سنجد. هر منبع را انتخاب کن و ببین از چه فاصله‌ای سخن می‌گوید و کجا می‌تواند گمراهت کند."
    >
      <div className="grid gap-2.5 md:grid-cols-[1fr_1.05fr]">
        <div className="space-y-2">
          {SOURCES.map((x) => {
            const Icon = x.icon
            return (
              <button key={x.id} className="sig-card" data-on={x.id === id} onClick={() => setId(x.id)}>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-gold/25 bg-gold/8 text-gold">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="sig-card__title block">{x.name}</span>
                    <span className="sig-card__sub block">{x.kind} · {x.when} · فاصله: {x.near}</span>
                  </span>
                  <span className="text-[0.62rem] tabular-nums text-gold">{fas(x.score)}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Tag tone="gold">{s.kind}</Tag>
            <Tag>{s.when}</Tag>
            <Tag tone={s.near === 'هم‌زمان' ? 'turq' : s.near === 'دور' ? 'rose' : 'neutral'}>فاصله: {s.near}</Tag>
          </div>
          <p className="text-[0.8rem] leading-7 text-ink/85">{s.claim}</p>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[0.6rem] text-faint">
              <span>اعتبار برای این پرسش</span>
              <span className="tabular-nums text-gold">{fas(s.score)}٪</span>
            </div>
            <div className="sig-meter"><span style={{ width: `${s.score}%` }} /></div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-turq/25 bg-turq/5 px-2.5 py-2">
              <div className="text-[0.6rem] text-turq">چه چیزی را می‌شود با اطمینان گرفت</div>
              <p className="mt-0.5 text-[0.74rem] leading-6 text-muted">{s.strength}</p>
            </div>
            <div className="rounded-lg border border-rose/25 bg-rose/5 px-2.5 py-2">
              <div className="flex items-center gap-1 text-[0.6rem] text-rose"><TriangleAlert size={10} /> تلهٔ امتحانی</div>
              <p className="mt-0.5 text-[0.74rem] leading-6 text-muted">{s.trap}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-4">
        {['کی نوشته؟', 'کِی نوشته؟', 'برای چه کسی؟', 'با چه سندی؟'].map((q, k) => (
          <div key={q} className="rounded-lg border border-dashed border-gold/30 px-2 py-1.5 text-center text-[0.66rem] text-gold/90">
            <span className="me-1 text-[0.55rem] opacity-70">{fas(k + 1)}</span>{q}
          </div>
        ))}
      </div>
    </SignatureStage>
  )
}
