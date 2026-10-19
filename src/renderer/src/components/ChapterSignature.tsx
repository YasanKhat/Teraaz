import { motion } from 'framer-motion'
import { ArrowLeft, BookMarked, Crown, Landmark, Swords } from 'lucide-react'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'

/* هر پرده یک «امضای ساختاری» متفاوت دارد؛ نه یک قالب تکراری. */

function Frame({ kicker, title, note, children }: { kicker: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-surface/35 px-4 py-5 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="kicker mb-1">{kicker}</div>
          <h2 className="text-[1rem] font-black">{title}</h2>
        </div>
        {note && <span className="text-[0.6rem] text-faint">{note}</span>}
      </div>
      {children}
    </section>
  )
}

function SourceFamilies() {
  const families = [
    {
      icon: Landmark,
      t: 'غیرنوشتاری',
      tone: 'text-turq',
      items: [
        { n: 'محوطه و بنا', d: 'مکان رویداد (غار حرا، اُحُد، چالدران) و اثر برجای‌مانده (نقش جهان، گوهرشاد)' },
        { n: 'ابزار و دست‌ساخته', d: 'پوشاک، ظرف، جنگ‌افزار، ساز، مجسمه؛ گواه فرهنگ و آداب' },
        { n: 'آثار شفاهی', d: 'اسطوره، خاطره، مَثَل، دوبیتی، لالایی' }
      ]
    },
    {
      icon: BookMarked,
      t: 'نوشتاری',
      tone: 'text-gold',
      items: [
        { n: 'کتاب‌های تاریخی', d: 'پنج گونه: عمومی، محلی، سلسله‌ای، تک‌نگاری، منظوم' },
        { n: 'سفرنامه و جغرافیا', d: 'زندگی اجتماعی، راه‌ها، آب‌وهوا، کالاها' },
        { n: 'ادبیات، سیاست‌نامه، سند و سکه', d: 'شعر و نثر، آیین کشورداری، فرمان و معاهده، نوشتهٔ روی سکه' }
      ]
    }
  ]
  const books = ['عمومی — تاریخ طبری', 'محلی — تاریخ سیستان', 'سلسله‌ای — تاریخ بیهقی', 'تک‌نگاری — عجایب‌المقدور', 'منظوم — شاهنامه']
  return (
    <div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {families.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-line bg-bg/30 p-3.5"
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={f.tone} />
                <span className="text-[0.82rem] font-black">{f.t}</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {f.items.map((it) => (
                  <div key={it.n}>
                    <div className="text-[0.7rem] font-bold text-muted">{it.n}</div>
                    <p className="text-[0.62rem] leading-5 text-faint">{it.d}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
      <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
        {books.map((b) => (
          <span key={b} className="shrink-0 rounded-lg border border-gold/25 bg-gold/5 px-2.5 py-1 text-[0.6rem] text-muted">
            {b}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProphecyRoute() {
  const stops = [
    { y: '۶۱۰ م', t: 'مکه', d: 'بعثت در غار حرا', lesson: 3, tone: 'turq' },
    { y: '۶۲۲ م', t: 'مدینه', d: 'هجرت و بنیان امت', lesson: 4, tone: 'gold' },
    { y: '۶۳۲ م', t: 'مدینه', d: 'رحلت پیامبر و خلافت', lesson: 5, tone: 'gold' },
    { y: '۶۶۱ م', t: 'دمشق', d: 'خلافت اموی', lesson: 6, tone: 'rose' },
    { y: '۷۶۲ م', t: 'بغداد', d: 'پایتخت عباسیان', lesson: 7, tone: 'lapis' }
  ]
  return (
    <div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1">
        {stops.map((s, i) => (
          <motion.button
            key={s.t + s.y}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(`lesson/${s.lesson}`)}
            className="group min-w-[132px] flex-1 rounded-xl border border-line bg-bg/30 p-3 text-start transition hover:border-gold/40"
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-[0.58rem]', s.tone === 'turq' ? 'text-turq' : s.tone === 'rose' ? 'text-rose' : s.tone === 'lapis' ? 'text-lapis' : 'text-gold')}>{s.y}</span>
              <span className="text-[0.52rem] text-faint">درس {fas(s.lesson)}</span>
            </div>
            <div className="mt-1 text-[0.9rem] font-black">{s.t}</div>
            <div className="text-[0.6rem] leading-5 text-muted">{s.d}</div>
            <span className="mt-1 flex items-center gap-1 text-[0.54rem] text-gold/0 transition group-hover:text-gold/90">
              رفتن <ArrowLeft size={9} />
            </span>
          </motion.button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[0.56rem] text-faint">
        <span className="h-px flex-1 bg-line" />
        <span>مسیر قدرت: از یک شهر تا یک امپراتوری</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  )
}

function DynastyChain() {
  const rows = [
    { t: 'طاهریان', y: '۲۰۵ ق', n: 9 },
    { t: 'صفاریان', y: '۲۵۳ ق', n: 9 },
    { t: 'سامانیان', y: '۲۶۱ ق', n: 9 },
    { t: 'غزنویان', y: '۳۶۷ ق', n: 10 },
    { t: 'سلجوقیان', y: '۴۲۹ ق', n: 10 },
    { t: 'خوارزمشاهیان', y: '۵۹۵ ق', n: 10 },
    { t: 'ایلخانان', y: '۶۵۶ ق', n: 11 },
    { t: 'تیموریان', y: '۷۷۱ ق', n: 12 },
    { t: 'صفویه', y: '۹۰۷ ق', n: 13 }
  ]
  return (
    <div>
      <div className="no-scrollbar -mx-1 flex items-end gap-1 overflow-x-auto pb-2">
        {rows.map((r, i) => (
          <button key={r.t} onClick={() => navigate(`lesson/${r.n}`)} className="group flex min-w-[86px] flex-1 flex-col items-center">
            <span className="text-[0.54rem] tabular-nums text-faint">{r.y}</span>
            <span
              className="mt-1 w-full rounded-t-md border-x border-t border-gold/25 bg-gradient-to-t from-gold/10 to-gold/35 transition group-hover:to-gold/60"
              style={{ height: `${18 + (i % 4) * 10}px` }}
            />
            <span className="mt-1.5 text-center text-[0.62rem] font-semibold text-muted group-hover:text-gold">{r.t}</span>
          </button>
        ))}
      </div>
      <p className="mt-1 text-[0.62rem] leading-6 text-faint">
        نُه سلسله، دوازده قرن؛ ایرانِ پس از اسلام هر بار از دل یک فروپاشی، خودش را از نو می‌سازد. روی هر ستون بزن تا درسش را ببینی.
      </p>
    </div>
  )
}

function TwoWorlds() {
  const west = [
    { y: '۴۷۶ م', t: 'پایان روم غربی' },
    { y: '۸۰۰ م', t: 'شارلمانی' },
    { y: '۱۰۹۶ م', t: 'جنگ‌های صلیبی' },
    { y: '۱۴۵۳ م', t: 'پایان بیزانس' }
  ]
  const east = [
    { y: '۳۳۰ م', t: 'کنستانتین' },
    { y: '۵۲۷ م', t: 'قانون‌نامهٔ ژوستینین' },
    { y: '۱۰۵۴ م', t: 'شکاف بزرگ کلیسا' },
    { y: '۱۴۵۳ م', t: 'قسطنطنیه، عثمانی' }
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        { title: 'غرب لاتینی', items: west, icon: Crown, tone: 'rose' },
        { title: 'شرق بیزانسی', items: east, icon: Landmark, tone: 'lapis' }
      ].map((side) => {
        const Icon = side.icon
        return (
          <div key={side.title} className="rounded-xl border border-line bg-bg/30 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[0.74rem] font-bold">
              <Icon size={14} className={side.tone === 'rose' ? 'text-rose' : 'text-lapis'} /> {side.title}
            </div>
            <div className="space-y-1.5">
              {side.items.map((e) => (
                <div key={e.t} className="flex items-center gap-2 text-[0.66rem]">
                  <span className="w-12 shrink-0 tabular-nums text-faint">{e.y}</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-muted">{e.t}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2 text-[0.66rem] text-muted">
        <Swords size={13} className="text-gold" /> دو دنیا که هم‌زمان می‌زیستند؛ رنسانس از گفت‌وگوی همین دو جهان زاده شد.
      </div>
    </div>
  )
}

export function ChapterSignature({ chapter }: { chapter: number }) {
  if (chapter === 1) {
    return (
      <Frame kicker="کارگاه مورخ" title="منبع، دو خانواده دارد" note="درس ۱">
        <SourceFamilies />
      </Frame>
    )
  }
  if (chapter === 2) {
    return (
      <Frame kicker="مسیر قدرت" title="از مکه تا بغداد" note="درس ۲ تا ۷">
        <ProphecyRoute />
      </Frame>
    )
  }
  if (chapter === 3) {
    return (
      <Frame kicker="زنجیرهٔ سلسله‌ها" title="ایران، هر بار از نو" note="درس ۸ تا ۱۴">
        <DynastyChain />
      </Frame>
    )
  }
  return (
    <Frame kicker="دو جهان" title="شرق و غرب، در یک نگاه" note="درس ۱۵ و ۱۶">
      <TwoWorlds />
    </Frame>
  )
}
