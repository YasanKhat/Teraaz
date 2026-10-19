import { useState } from 'react'
import { fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

const BRANCHES = [
  { id: 'arch', n: 'معماری', icon: '⌂', work: 'گنبد، ایوان، کاشی و گچ‌بری؛ مسجد گوهرشاد و آرامگاه‌ها', who: 'استادان خراسان و سمرقند', note: 'نقشهٔ چهارایوانی به نماد معماری ایرانی-اسلامی تبدیل شد.' },
  { id: 'paint', n: 'نگارگری', icon: '✧', work: 'مکتب هرات و تبریز؛ رنگ و ترکیب‌بندی ظریف', who: 'کمال‌الدین بهزاد و شاگردان', note: 'نگارگری، روایت شاهنامه و مجالس را تصویری کرد.' },
  { id: 'call', n: 'خوشنویسی', icon: 'ق', work: 'خط نستعلیق و تذهیب نسخه‌ها', who: 'میرعلی تبریزی (روایت مشهور)', note: 'کتاب، هم اثر هنری شد و هم رسانهٔ دانش.' },
  { id: 'lit', n: 'ادب و تاریخ', icon: '✎', work: 'شاهنامه، مثنوی، تاریخ‌نگاری درباری', who: 'فردوسی، مولوی، رشیدالدین', note: 'تاریخ‌نگاری از فهرست پادشاهان به روایت جامعه تبدیل شد.' }
]

export function ArtAtelier() {
  const [id, setId] = useState('paint')
  const b = BRANCHES.find((x) => x.id === id)!

  return (
    <SignatureStage
      kicker="کارگاه هنر · درس ۱۲"
      title="هنر دورهٔ مغول و تیموری: از ویرانه تا کتابخانه"
      hint="پس از ویرانی، حامیان تازه آمدند و هنر را بازساختند. یک شاخه را انتخاب کن و ببین چه چیزی ساخته شد."
      tone="gold"
    >
      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
        <div className="grid grid-cols-2 gap-2">
          {BRANCHES.map((x) => (
            <button
              key={x.id}
              onClick={() => setId(x.id)}
              className={`group relative overflow-hidden rounded-xl border p-3 text-start transition ${x.id === id ? 'border-gold/60 bg-gold/8' : 'border-line bg-bg/30 hover:border-gold/30'}`}
            >
              <div className="sig-ornament pointer-events-none absolute inset-0" />
              <div className="relative">
                <div className={`mb-1 text-[1.1rem] ${x.id === id ? 'text-gold' : 'text-faint'}`}>{x.icon}</div>
                <div className="text-[0.82rem] font-bold">{x.n}</div>
                <div className="mt-0.5 text-[0.6rem] leading-5 text-faint">{x.who}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-line bg-bg/40 p-3.5">
          <div className="sig-ornament pointer-events-none absolute inset-0 opacity-25" />
          <div className="relative">
            <Tag tone="gold">{b.n}</Tag>
            <div className="mt-2 text-[0.9rem] font-black">{b.work}</div>
            <div className="mt-1.5 text-[0.64rem] text-faint">چهره‌های شاخص: {b.who}</div>
            <div className="mt-2 rounded-lg border border-gold/25 bg-gold/6 px-2.5 py-2 text-[0.72rem] leading-6 text-muted">
              {b.note}
            </div>
            <div className="mt-2 text-[0.55rem] text-faint">{fas(BRANCHES.indexOf(b) + 1)} از {fas(BRANCHES.length)} شاخه</div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid gap-1.5 sm:grid-cols-3">
        {[
          ['حامی', 'سلطان و وزیر، سفارش‌دهندهٔ اثر بودند'],
          ['رسانه', 'کاغذ و کتاب، اثر را از دربار بیرون برد'],
          ['میراث', 'این سه، پایهٔ مکتب هنری صفوی شد']
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line px-2.5 py-1.5">
            <div className="text-[0.56rem] tracking-widest text-gold">{k}</div>
            <div className="text-[0.68rem] leading-6 text-muted">{v}</div>
          </div>
        ))}
      </div>
    </SignatureStage>
  )
}
