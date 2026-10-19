import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { project, regionPath, regions, shapeById } from '../../lib/geo'
import { cn, fas } from '../../lib/utils'
import { SignatureStage, Tag } from './kit'

type Step = { region: string; when: string; place: string; text: string }

const STEPS: Step[] = [
  { region: 'iraq', when: '۱۵ ق', place: 'قادسیه و جلولا', text: 'نخستین شکست بزرگ در قادسیه؛ میان‌رودان (سواد) به دست مسلمانان افتاد. یک سال بعد جلولا هم سقوط کرد.' },
  { region: 'khuzestan', when: '۱۷ ق', place: 'شوشتر و اهواز', text: 'مقاومت هرمزان در شوشتر شکسته شد؛ خوزستان گشوده شد و دروازهٔ فلات ایران باز شد.' },
  { region: 'jibal', when: '۲۱ ق', place: 'نهاوند', text: 'نبرد نهاوند، «فتح‌الفتوح» خوانده شد. با این شکست، سرنوشت حکومت ساسانی قطعی شد.' },
  { region: 'fars', when: 'دههٔ ۲۰ ق', place: 'اصطخر و شیراز', text: 'مرکز آیینی و اداری ساسانیان یکی‌یکی گشوده شد؛ اصطخر و تخت جمشید در همین موج از دست رفت.' },
  { region: 'kerman', when: 'دههٔ ۲۰–۳۰ ق', place: 'کرمان و مکران', text: 'پیشروی به سمت جنوب شرقی، راه را برای رسیدن به سیستان و سپس خراسان هموار کرد.' },
  { region: 'khurasan', when: '۳۰–۳۲ ق', place: 'مرو و نیشابور', text: 'یزدگرد سوم در مرو کشته شد (۳۱ ق). آخرین پادشاه ساسانی رفت و مقاومت متمرکز فروپاشید.' },
  { region: 'transoxiana', when: 'سدهٔ ۱ ق', place: 'بخارا و سمرقند', text: 'فتح آن سوی جیحون سال‌ها طول کشید؛ بازگشت‌های پیاپی نشان می‌دهد فتح یک‌باره نبود.' }
]

const RESIST = ['tabaristan', 'azerbaijan']

const SHORT: Record<string, string> = {
  iraq: 'سواد و عراق',
  khuzestan: 'خوزستان',
  jibal: 'جبال و ری',
  fars: 'فارس',
  kerman: 'کرمان',
  khurasan: 'خراسان',
  transoxiana: 'ماوراءالنهر',
  tabaristan: 'طبرستان',
  azerbaijan: 'آذربایجان'
}

export function IranFront() {
  const [i, setI] = useState(1)
  const shape = useMemo(() => shapeById('364'), [])
  const view = useMemo(() => {
    const pts: [number, number][] = [
      [44.2, 40.4],
      [64.6, 40.4],
      [64.6, 24.6],
      [44.2, 24.6]
    ]
    const mapped = pts.map(([lon, lat]) => project(lon, lat))
    const xs = mapped.map((p) => p[0])
    const ys = mapped.map((p) => p[1])
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    const w = Math.max(...xs) - x
    const h = Math.max(...ys) - y
    const pad = 10
    return { x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 }
  }, [])

  const active = STEPS[i - 1]
  const doneRegions = STEPS.slice(0, i).map((s) => s.region)

  return (
    <SignatureStage
      kicker="نقشهٔ زنده · درس ۸"
      title="ایران، منطقه‌به‌منطقه از دست می‌رود"
      hint="هر گام، یک شکاف تازه در نقشهٔ دولت ساسانی است. مناطق اشغال‌شده با رنگ سرخ روشن می‌شوند؛ نواحی مقاوم (طبرستان و آذربایجان) با خط‌چین می‌مانند."
      tone="rose"
    >
      <div className="space-y-2.5 lg:hidden">
        <div className="flex items-center gap-1.5">
          <button className="map-btn" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))} aria-label="گام قبل"><ChevronRight size={14} /></button>
          <button className="map-btn" disabled={i >= STEPS.length} onClick={() => setI((v) => Math.min(STEPS.length, v + 1))} aria-label="گام بعد"><ChevronLeft size={14} /></button>
          <div className="ms-auto text-[0.62rem] text-faint">گام {fas(i)} از {fas(STEPS.length)}</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
        <div className="lg:hidden">{/* spacer */}</div>
        <div className="relative overflow-hidden rounded-xl border border-[#d9c39a]/25 bg-[#0b1526] lg:col-start-2 lg:row-start-1">
          <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="block h-auto w-full">
            <defs>
              <filter id="iran-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <pattern id="iran-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#e8d6a8" strokeWidth="1.1" strokeOpacity="0.55" />
              </pattern>
            </defs>

            <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="#0b1526" />
            <g opacity="0.4">
              {Array.from({ length: 9 }, (_, k) => (
                <line key={k} x1={view.x + (k * view.w) / 9} y1={view.y} x2={view.x + (k * view.w) / 9} y2={view.y + view.h} stroke="#7f8fae" strokeWidth={0.4} />
              ))}
              {Array.from({ length: 6 }, (_, k) => (
                <line key={`h${k}`} x1={view.x} y1={view.y + (k * view.h) / 6} x2={view.x + view.w} y2={view.y + (k * view.h) / 6} stroke="#7f8fae" strokeWidth={0.4} />
              ))}
            </g>

            {/* بدنهٔ ایران: خاک سرزمین هنوز آزاد */}
            <path d={shape} fill="#e6d5ae" stroke="#a98f5d" strokeWidth={1.4} />

            {/* نواحی ازدست‌رفته */}
            {STEPS.map((s, k) => {
              const on = k < i
              if (!on) return null
              return (
                <motion.path
                  key={s.region}
                  d={regionPath(s.region)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.45 }}
                  fill="#c9503a"
                  fillOpacity={0.62}
                  stroke="#7c2c1d"
                  strokeWidth={1}
                  filter="url(#iran-glow)"
                />
              )
            })}

            {/* نواحی مقاوم */}
            {RESIST.map((id) => (
              <path key={id} d={regionPath(id)} fill="url(#iran-hatch)" fillOpacity={0.25} stroke="#d9c39a" strokeOpacity={0.5} strokeWidth={0.9} strokeDasharray="4 3" />
            ))}

            {/* برچسب‌ها */}
            {Object.keys(regions).map((id) => {
              const done = doneRegions.includes(id)
              if (id !== 'iraq' && !STEPS.some((s) => s.region === id) && !RESIST.includes(id)) return null
              const pts = regions[id].points.map(([lon, lat]) => project(lon, lat))
              const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length
              const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length
              return (
                <text
                  key={`t-${id}`}
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={800}
                  fill={done ? '#2b0f09' : RESIST.includes(id) ? '#e6d5ae' : '#7d6a48'}
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >
                  {SHORT[id] ?? regions[id].label}
                </text>
              )
            })}

            <path d={shape} fill="none" stroke="#7a5a2a" strokeWidth={2} />
          </svg>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#d9c39a]/20 px-2.5 py-1.5 text-[0.58rem] text-[#d9c39a]">
            <span className="flex items-center gap-1"><Flag size={10} /> گام {fas(i)}: {active.place}</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-[#c9503a]" /> از دست رفته</span>
              <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm border border-dashed border-[#d9c39a] bg-[#e6d5ae]/20" /> مقاوم</span>
            </span>
          </div>
        </div>

        <div className="lg:col-start-1 lg:row-start-1">
          <div className="mb-2 hidden items-center gap-1.5 lg:flex">
            <button className="map-btn" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))} aria-label="گام قبل"><ChevronRight size={14} /></button>
            <button className="map-btn" disabled={i >= STEPS.length} onClick={() => setI((v) => Math.min(STEPS.length, v + 1))} aria-label="گام بعد"><ChevronLeft size={14} /></button>
            <div className="ms-auto text-[0.6rem] text-faint">گام {fas(i)} از {fas(STEPS.length)}</div>
          </div>

          <div className="space-y-1">
            {STEPS.map((s, k) => {
              const done = k < i
              const now = k === i - 1
              return (
                <button
                  key={s.region}
                  onClick={() => setI(k + 1)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-start transition',
                    now ? 'border-rose/60 bg-rose/12' : done ? 'border-line bg-bg/25' : 'border-dashed border-line opacity-60 hover:opacity-100'
                  )}
                >
                  <span className={cn('grid size-4 shrink-0 place-items-center rounded text-[0.5rem]', done ? 'bg-rose/25 text-rose' : 'bg-ink/5 text-faint')}>{fas(k + 1)}</span>
                  <span className={cn('flex-1 text-[0.72rem]', done || now ? 'font-semibold' : 'text-muted')}>{SHORT[s.region]}</span>
                  <span className="text-[0.58rem] text-faint">{s.when}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-2.5 rounded-xl border border-line bg-bg/40 p-3">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Tag tone="rose">{active.when}</Tag>
              <Tag>{active.place}</Tag>
            </div>
            <p className="text-[0.76rem] leading-7 text-muted">{active.text}</p>
          </div>
          <p className="mt-2 text-[0.62rem] leading-6 text-faint">
            توجه: سقوط دولت ساسانی با «اسلام‌آوردن تدریجی ایرانیان» یکی نیست؛ این دو فرایند جدا و چند قرنی‌اند. طبرستان و
            آذربایجان هم سال‌ها مقاومت کردند.
          </p>
        </div>
      </div>
    </SignatureStage>
  )
}
