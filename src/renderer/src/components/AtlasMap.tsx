import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { geoBounds, geoCentroid, geoGraticule, geoMercator, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { countryLabels, regions, rivers, seas } from '../lib/geo'
import { cn, fas } from '../lib/utils'

/* ────────────────────────────────────────────────────────────────────────
   اطلس تاریخی — نقشهٔ مرجع، نه طرح دستی.
   • کرانه‌ها و مرزها از دادهٔ جغرافیایی واقعی (Natural Earth / world-atlas)
   • هر قلمرو تا ساحل «بریده» می‌شود تا هیچ رنگ تاریخی روی دریا نریزد
   • دوربین روی گسترهٔ همان درس تنظیم می‌شود، نه کل جهان
   • برچسب‌ها با پرهیز از هم‌پوشانی و اندازهٔ خوانا چیده می‌شوند
   ──────────────────────────────────────────────────────────────────────── */

export interface PlanPin {
  x: number
  y: number
  label: string
  tone?: 'gold' | 'rose' | 'turq'
}

export interface MapPhase {
  title: string
  caption: string
  /** نشانه‌های نقشهٔ شهری (درصد از قاب) */
  planPins?: PlanPin[]
  /** خطوط نقشهٔ شهری: خیابان، رود، محور */
  planLines?: { from: [number, number]; to: [number, number]; kind?: 'street' | 'river' | 'axis'; label?: string }[]
  regions?: string[]
  countries?: string[]
  arrows?: { from: [number, number]; to: [number, number]; label?: string; tone?: 'gold' | 'rose' | 'turq'; bend?: number }[]
  pins?: { lon: number; lat: number; label: string; tone?: 'gold' | 'rose' | 'turq' }[]
  ghost?: string[]
}

export interface MapSpec {
  title: string
  kicker?: string
  palette?: 'conquest' | 'steppe' | 'sea' | 'europe'
  /** جغرافیای سیاسی پایه؛ در همهٔ گام‌ها کمرنگ دیده می‌شود */
  base?: string[]
  /** نقشهٔ شهری (طرح) به‌جای نقشهٔ جغرافیایی */
  mode?: 'geo' | 'plan'
  /** مدارک و اشیا روی نقشه: جای نمادینشان در ایران، نه مختصات واقعی */
  artifacts?: { x: number; y: number; label: string; kind: 'site' | 'monument' | 'object'; note?: string }[]
  phases: MapPhase[]
}

const PALETTE = {
  conquest: { main: '#d9a93f', soft: '#e7c979', sea: ['#12314c', '#0b2136', '#071827'], land: ['#efe3c6', '#e3d3b0', '#d6c39c'] },
  steppe: { main: '#c9563c', soft: '#e0856c', sea: ['#14334a', '#0c2337', '#081a28'], land: ['#eee1c4', '#e2d0ab', '#d3bf95'] },
  sea: { main: '#3f9c95', soft: '#79c3bc', sea: ['#10334a', '#0b2236', '#071827'], land: ['#eee5ca', '#e3d6b4', '#d5c49d'] },
  europe: { main: '#5b7fc7', soft: '#8fa9dd', sea: ['#122e49', '#0c2237', '#081827'], land: ['#eee4c8', '#e2d3ae', '#d4c199'] }
} as const

const TONES = { gold: '#e6bb58', rose: '#d0705a', turq: '#4fb0a7' } as const

const W = 1000
const H = 620
const PAD = 26

/* ── پایهٔ جغرافیایی، یک‌بار برای همیشه ─────────────────────────────────── */
const topo: any = world
const countriesFC: any = feature(topo, topo.objects.countries)
const landFC: any = feature(topo, topo.objects.land)
const borderMesh: any = (mesh as any)(topo, topo.objects.countries, (a: any, b: any) => a !== b)

const shapeById = new Map<string, any>()
countriesFC.features.forEach((f: any) => {
  if (f.id != null) shapeById.set(String(f.id), f)
})

const regionFeature = (id: string) => {
  const r = regions[id]
  if (!r) return null
  const ring = [...r.points, r.points[0]]
  return { type: 'Feature', properties: { id }, geometry: { type: 'Polygon', coordinates: [ring] } } as any
}

const labelWidth = (text: string, fs: number) => Math.max(16, text.length * fs * 0.56)

/** گسترهٔ جغرافیایی یک نقشه: همهٔ گام‌ها + کمی حاشیه، با حداقل اندازه */
function extentOf(spec: MapSpec) {
  const pts: [number, number][] = []
  const pushAll = (ids?: string[]) => ids?.forEach((id) => regions[id]?.points.forEach((pt) => pts.push(pt)))
  spec.phases.forEach((p) => {
    pushAll(p.regions)
    pushAll(p.ghost)
    p.pins?.forEach((pin) => pts.push([pin.lon, pin.lat]))
    p.arrows?.forEach((a) => pts.push(a.from, a.to))
    p.countries?.forEach((id) => {
      const f = shapeById.get(id)
      if (f) {
        const b = geoBounds(f)
        pts.push([b[0][0], b[0][1]], [b[1][0], b[1][1]])
      }
    })
  })
  if (!pts.length) {
    pushAll(spec.base)
    if (!pts.length) pts.push([30, 20], [70, 48])
  }
  const lons = pts.map((p) => p[0])
  const lats = pts.map((p) => p[1])
  let [minLon, maxLon] = [Math.min(...lons), Math.max(...lons)]
  let [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)]

  // حاشیهٔ طبیعی؛ نقشه نباید مثل برشِ چسبان به لبه بچسبد
  const padLon = Math.max(1.6, (maxLon - minLon) * 0.14)
  const padLat = Math.max(1.2, (maxLat - minLat) * 0.16)
  minLon -= padLon
  maxLon += padLon
  minLat -= padLat
  maxLat += padLat

  const cLon = (minLon + maxLon) / 2
  let cLat = (minLat + maxLat) / 2
  let spanLon = maxLon - minLon
  let spanLat = maxLat - minLat

  // نقشهٔ شهر: قابِ نزدیک، نه قابِ کشور
  if (spanLon < 6) {
    spanLon = Math.max(spanLon, 2.6)
    spanLat = Math.max(spanLat, 1.7)
  } else {
    spanLon = Math.max(spanLon, 15)
    spanLat = Math.max(spanLat, 10)
  }

  // هم‌نسبت‌کردن با قاب: مرکاتور، عرض را کشیده می‌کند
  const aspect = W / H
  const cos = Math.max(0.35, Math.cos((Math.PI / 180) * cLat))
  const latToLon = spanLat / cos
  if (spanLon / spanLat < aspect) spanLon = latToLon * aspect
  else spanLat = (spanLon / aspect) * cos

  cLat = Math.max(-48, Math.min(66, cLat))
  return {
    minLon: cLon - spanLon / 2,
    maxLon: cLon + spanLon / 2,
    minLat: cLat - spanLat / 2,
    maxLat: cLat + spanLat / 2,
    wide: spanLon > 26
  }
}

/** جای خوانا برای برچسب: چهار جهت را امتحان می‌کند و از هم‌پوشانی می‌پرهیزد */
function placeLabels<T extends { x: number; y: number; label: string }>(
  items: T[],
  unit = 1,
  obstacles: { x: number; y: number; label: string }[] = []
) {
  const wOf = (t: string) => (t.length * 7.4 + 6) * unit
  const boxes: { x0: number; y0: number; x1: number; y1: number }[] = obstacles.map((o) => ({
    x0: o.x - wOf(o.label) / 2,
    y0: o.y - 15 * unit,
    x1: o.x + wOf(o.label) / 2,
    y1: o.y + 4 * unit
  }))
  const out: (T & { dx: number; dy: number; anchor: 'start' | 'end' })[] = []
  const w = wOf
  for (const it of items) {
    const width = w(it.label)
    const d = 16 * unit
    const tries = [
      { dx: d, dy: 5 * unit, anchor: 'start' as const },
      { dx: -d, dy: 5 * unit, anchor: 'end' as const },
      { dx: d, dy: -13 * unit, anchor: 'start' as const },
      { dx: -d, dy: -13 * unit, anchor: 'end' as const },
      { dx: d, dy: 24 * unit, anchor: 'start' as const },
      { dx: -d, dy: 24 * unit, anchor: 'end' as const },
      { dx: d * 2.6, dy: 5 * unit, anchor: 'start' as const },
      { dx: -d * 2.6, dy: 5 * unit, anchor: 'end' as const },
      { dx: d * 2.6, dy: -20 * unit, anchor: 'start' as const },
      { dx: -d * 2.6, dy: -20 * unit, anchor: 'end' as const }
    ]
    let pick = tries[0]
    for (const t of tries) {
      const x0 = t.anchor === 'start' ? it.x + t.dx : it.x + t.dx - width
      const y0 = it.y + t.dy - 14
      const box = { x0, y0, x1: x0 + width, y1: y0 + 18 * unit }
      const hit = boxes.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0)
      if (!hit) {
        pick = t
        boxes.push(box)
        break
      }
    }
    out.push({ ...it, ...pick })
  }
  return out
}

/** نقشهٔ شهری — طرح خوانا از شهر، با رود، محور، بلوک‌ها و نشانه‌ها */
function CityPlan({ spec, phase, index }: { spec: MapSpec; phase: MapPhase; index: number }) {
  const wrapRef = useRef<SVGSVGElement>(null)
  const [wrapW, setWrapW] = useState(1000)
  const [wrapH, setWrapH] = useState(620)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      setWrapW(entry.contentRect.width || 1000)
      setWrapH(entry.contentRect.height || 620)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const isCity = /اصفهان/.test(spec.title)
  const lines = isCity ? phase.planLines ?? BASE_PLAN_LINES : phase.planLines ?? []
  const pins = phase.planPins ?? []
  const uid = `plan-${index}-${index}`
  /** کادر نقشه با نسبت تصویر قاب هم‌اندازه می‌شود تا هیچ برچسبی از لبه بیرون نزند */
  const vbW = Math.max(1000, Math.round(620 * (wrapW / Math.max(140, wrapH))))
  const off = (vbW - 1000) / 2
  /** هر واحد نقشه چند پیکسل روی صفحه است */
  const px = wrapW / vbW
  const unit = Math.min(2.4, Math.max(1, 11 / (12 * Math.max(0.3, px))))
  /** وقتی نقشه کوچک رندر می‌شود، نام‌ها جای نمی‌گنجند؛ شماره + کلید می‌آید */
  const narrow = wrapW < 680
  const compact = px < 0.82
  const badgeR = compact ? Math.min(30, 13 / Math.max(0.35, px)) : 6.5
  const badgeFs = Math.min(23, 12 / Math.max(0.35, px))
  /** برچسب خیابان‌ها و محورها هم جای می‌گیرند و نباید با نام نشانه‌ها تلاقی کنند */
  const lineLabels = lines
    .filter((l) => l.label)
    .map((l) => ({
      x: (l.from[0] * 10 + l.to[0] * 10) / 2,
      y: (l.from[1] * 6.2 + l.to[1] * 6.2) / 2 - 9 * unit,
      label: l.label!
    }))
  const marks = [
    ...(spec.artifacts ?? []).map((a) => ({
      x: a.x * 10,
      y: a.y * 6.2,
      label: a.label,
      tone: a.kind === 'site' ? TONES.gold : a.kind === 'monument' ? TONES.turq : TONES.rose
    })),
    ...pins.map((p) => ({ x: p.x * 10, y: p.y * 6.2, label: p.label, tone: TONES[p.tone ?? 'gold'] }))
  ]
  return (
    <div className="atlas__frame">
      <svg ref={wrapRef} viewBox={`${-off} 0 ${vbW} 620`} preserveAspectRatio="xMidYMid meet" className="atlas__svg" role="img" aria-label={`${spec.title} — ${phase.title}`}>
        <defs>
          <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2e9d2" />
            <stop offset="100%" stopColor="#e0d2ae" />
          </linearGradient>
          <pattern id={`${uid}-grid`} width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M46 0H0V46" fill="none" stroke="#b9a173" strokeOpacity="0.16" strokeWidth="1" />
          </pattern>
          <pattern id={`${uid}-blocks`} width="86" height="70" patternUnits="userSpaceOnUse">
            <rect x="6" y="6" width="30" height="24" rx="2" fill="#c9b68c" fillOpacity="0.4" />
            <rect x="48" y="8" width="30" height="20" rx="2" fill="#c9b68c" fillOpacity="0.32" />
            <rect x="14" y="40" width="34" height="22" rx="2" fill="#c9b68c" fillOpacity="0.36" />
            <rect x="54" y="38" width="24" height="26" rx="2" fill="#c9b68c" fillOpacity="0.28" />
          </pattern>
        </defs>

        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-paper)`} />
        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-blocks)`} opacity="0.3" />
        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-grid)`} />

        {/* حاشیهٔ چپ: یادداشت طرح */}
        {off > 150 && (
          <g pointerEvents="none" opacity="0.62" textAnchor="middle">
            <text x={-off * 0.56} y={96} fontSize={13 * unit} fontWeight={700} fill="#7a6845" style={{ fontFamily: 'Estedad, sans-serif' }}>
              {isCity ? 'طرح نمادین شهر' : 'طرح نمادینِ نمونه‌ها'}
            </text>
            <text x={-off * 0.56} y={96 + 24 * unit} fontSize={11 * unit} fill="#8a7752" style={{ fontFamily: 'Estedad, sans-serif' }}>
              {isCity ? 'جای بناها تقریبی است؛ برای دیدن نسبتشان' : 'جای هر نشانه تقریبی است؛ برای مقایسهٔ گونه‌ها'}
            </text>
            <line
              x1={-off * 0.56 - 100 * unit} x2={-off * 0.56 + 100 * unit}
              y1={108 + 24 * unit} y2={108 + 24 * unit}
              stroke="#b79a63" strokeOpacity="0.5" strokeWidth="1.2"
            />
          </g>
        )}

        {/* باغ‌ها */}
        <ellipse cx={140 - off * 0.7} cy="150" rx="130" ry="95" fill="#9cae7d" fillOpacity="0.22" />
        <ellipse cx={880 + off * 0.7} cy="520" rx="120" ry="80" fill="#9cae7d" fillOpacity="0.18" />
        {off > 0 && (
          <>
            <ellipse cx={640 - off * 0.15} cy="90" rx="150" ry="70" fill="#9cae7d" fillOpacity="0.14" />
            <ellipse cx={300 + off * 0.2} cy="560" rx="170" ry="80" fill="#9cae7d" fillOpacity="0.12" />
          </>
        )}

        {/* زاینده‌رود — فقط نقشهٔ اصفهان */}
        {isCity && (
          <g transform={`translate(500,0) scale(${vbW / 1000},1) translate(-500,0)`}>
            <path d="M-20 470 C 180 430, 380 505, 560 458 S 860 425, 1020 452" fill="none" stroke="#4f8ba3" strokeOpacity="0.45" strokeWidth="30" strokeLinecap="round" />
            <path d="M-20 470 C 180 430, 380 505, 560 458 S 860 425, 1020 452" fill="none" stroke="#9dcbd8" strokeOpacity="0.75" strokeWidth="12" strokeLinecap="round" />
          </g>
        )}
        {isCity && (
          <text
            x={180} y={452} textAnchor="middle" fontSize={13 * unit} fill="#2f6a80" opacity="0.85"
            stroke="#e9e0c6" strokeWidth={4 * unit} paintOrder="stroke"
            style={{ fontFamily: 'Estedad, sans-serif' }}
          >زاینده‌رود</text>
        )}

        {/* محورها */}
        {lines.map((l, k) => {
          const bx1 = l.from[0] * 10
          const by1 = l.from[1] * 6.2
          const bx2 = l.to[0] * 10
          const by2 = l.to[1] * 6.2
          const len = Math.hypot(bx2 - bx1, by2 - by1) || 1
          const ext = off + 80
          const x1 = bx1 - ((bx2 - bx1) / len) * ext
          const y1 = by1 - ((by2 - by1) / len) * ext
          const x2 = bx2 + ((bx2 - bx1) / len) * ext
          const y2 = by2 + ((by2 - by1) / len) * ext
          const street = l.kind === 'street'
          return (
            <g key={k}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={l.kind === 'river' ? '#4f8ba3' : l.kind === 'axis' ? '#a9812f' : '#9a8659'}
                strokeOpacity={street ? 0.55 : 0.85}
                strokeWidth={l.kind === 'axis' ? 6 : street ? 3 : 4}
                strokeDasharray={street ? '12 7' : undefined}
                strokeLinecap="round"
              />
              {l.label && (
                <text
                  x={bx1 + (bx2 - bx1) * (compact ? 0.22 : 0.5)}
                  y={by1 + (by2 - by1) * (compact ? 0.22 : 0.5) - 9 * unit}
                  textAnchor="middle" fontSize={13 * unit}
                  fill="#6b5a38" stroke="#f7eed8" strokeWidth={3.6 * unit} paintOrder="stroke"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >{l.label}</text>
              )}
            </g>
          )
        })}

        {/* میدان نقش جهان — فقط نقشهٔ اصفهان */}
        {isCity && (
          <>
            <rect x="420" y="238" width="160" height="118" rx="5" fill="#e8d8ad" fillOpacity="0.5" stroke="#a9812f" strokeOpacity="0.8" strokeWidth="3" />
            {index > 0 && !pins.some((p) => p.x > 42 && p.x < 58 && p.y > 40 && p.y < 56) && (
              <text x={compact ? 760 : 500} y="376" textAnchor="middle" fontSize={12 * unit} fill="#6b5a38" opacity="0.75" style={{ fontFamily: 'Estedad, sans-serif' }}>میدان نقش جهان</text>
            )}
          </>
        )}

        {/* اشیا، نشانه‌ها و برچسب‌ها */}
        {(compact
          ? marks.map((m, k) => (
              <g key={`n-${k}`}>
                <circle cx={m.x} cy={m.y} r={badgeR * 1.5} fill={m.tone} fillOpacity="0.16" />
                <circle cx={m.x} cy={m.y} r={badgeR} fill={m.tone} stroke="#3a2c12" strokeWidth={1.6 / Math.max(0.4, px)} />
                <text
                  x={m.x} y={m.y + badgeFs * 0.35} textAnchor="middle" fontSize={badgeFs} fontWeight="800" fill="#241a06"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >{fas(k + 1)}</text>
              </g>
            ))
          : placeLabels(marks, unit, lineLabels).map((m, k) => (
              <g key={`n-${k}`}>
                <circle cx={m.x} cy={m.y} r="21" fill={m.tone} fillOpacity="0.12" />
                <circle cx={m.x} cy={m.y} r="6.5" fill={m.tone} stroke="#3a2c12" strokeWidth="1.5" />
                <text
                  x={m.x + m.dx} y={m.y + m.dy} textAnchor={m.anchor} fontSize={15 * unit} fontWeight="800" fill="#241a06"
                  stroke="#f9f1dc" strokeWidth={4.4 * unit} paintOrder="stroke"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >{m.label}</text>
              </g>
            )))}

        {/* راهنما و مقیاس */}
        <g transform="translate(944, 556)" opacity="0.85">
          <circle r="20" fill="#0d2033" fillOpacity="0.07" stroke="#a9812f" strokeOpacity="0.55" />
          <path d="M0,-13 L5,2 L0,-1 L-5,2 Z" fill="#8d6d24" />
        </g>
        <g transform="translate(44, 586)" opacity="0.85">
          <line x1="0" y1="0" x2="118" y2="0" stroke="#8d6d24" strokeWidth="2" />
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#8d6d24" strokeWidth="2" />
          <line x1="118" y1="-5" x2="118" y2="5" stroke="#8d6d24" strokeWidth="2" />
          <text x="59" y="-9" textAnchor="middle" fontSize={11 * unit} fill="#6b5a38" style={{ fontFamily: 'Estedad, sans-serif' }}>۵۰۰ متر</text>
        </g>
        <rect x="1" y="1" width="998" height="618" fill="none" stroke="#b79a63" strokeOpacity="0.45" />
      </svg>
      {compact && marks.length > 0 && (
        <div className="atlas__pinKey">
          {marks.map((m, k) => (
            <span key={`k-${k}`}>
              <b style={{ background: m.tone }}>{fas(k + 1)}</b>
              {m.label}
            </span>
          ))}
        </div>
      )}
      <div className="atlas__caption">
        <div className="flex items-center gap-2">
          <span className="atlas__step">{fas(index + 1)} / {fas(spec.phases.length)}</span>
          <span className="atlas__stepTitle">{phase.title}</span>
        </div>
        <p className="atlas__captionText">{phase.caption}</p>
        {spec.artifacts && (
          <div className="atlas__legendInline">
            <span><i style={{ background: TONES.gold }} /> مکان رویداد</span>
            <span><i style={{ background: TONES.turq }} /> بنا و اثر</span>
            <span><i style={{ background: TONES.rose }} /> شیء و دست‌ساخته</span>
          </div>
        )}
      </div>
    </div>
  )
}

const BASE_PLAN_LINES: NonNullable<MapPhase['planLines']> = [
  { from: [50, 18], to: [50, 82], kind: 'axis', label: 'چهارباغ' },
  { from: [18, 48], to: [82, 48], kind: 'street', label: 'بازار' }
]

export function AtlasMap({
  spec,
  autoPlay = false,
  chrome = true,
  onDone
}: {
  spec: MapSpec
  autoPlay?: boolean
  chrome?: boolean
  onDone?: () => void
}) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(autoPlay)
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const phase = spec.phases[Math.min(i, spec.phases.length - 1)]
  const palette = PALETTE[spec.palette ?? 'conquest']
  const uid = useMemo(() => `atlas-${Math.random().toString(36).slice(2, 8)}`, [])
  const wrapRef = useRef<HTMLDivElement>(null)
  const [wrapW, setWrapW] = useState(1000)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setWrapW(entry.contentRect.width || W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  /** بزرگ‌نمایی متن روی صفحه‌های کوچک تا برچسب‌ها خوانا بمانند */
  const unit = Math.min(2.1, Math.max(1, (W / Math.max(320, wrapW)) * 0.86))

  useEffect(() => {
    setI(0)
    setPlaying(autoPlay)
  }, [spec, autoPlay])

  useEffect(() => {
    if (!playing) return
    if (i >= spec.phases.length - 1) return
    const t = window.setInterval(() => {
      setI((v) => {
        if (v >= spec.phases.length - 1) {
          setPlaying(false)
          return v
        }
        return v + 1
      })
    }, reduced ? 5600 : 4200)
    return () => window.clearInterval(t)
  }, [playing, i, spec.phases.length, reduced])

  useEffect(() => {
    if (i >= spec.phases.length - 1 && !playing) onDone?.()
  }, [i, playing, spec.phases.length, onDone])

  /* ── دوربین و مسیرها ─────────────────────────────────────────────────── */
  const box = useMemo(() => extentOf(spec), [spec])
  const zoomedIn = !box.wide
  const projection = useMemo(() => {
    const b = box
    const frame = {
      type: 'Polygon',
      coordinates: [[
        [b.minLon, b.maxLat],
        [b.maxLon, b.maxLat],
        [b.maxLon, b.minLat],
        [b.minLon, b.minLat],
        [b.minLon, b.maxLat]
      ]]
    } as any
    return geoMercator().fitExtent([[PAD, PAD], [W - PAD, H - PAD]], frame)
  }, [box])

  const path = useMemo(() => geoPath(projection), [projection])
  const graticulePath = useMemo(() => path(geoGraticule().step([5, 5])() as any) ?? '', [path])
  const landPath = useMemo(() => path(landFC) ?? '', [path])
  const borderPath = useMemo(() => path(borderMesh as any) ?? '', [path])
  const spherePath = useMemo(() => path({ type: 'Sphere' } as any) ?? '', [path])

  const pxPerDeg = (projection.scale() * Math.PI) / 180
  const kmPerPx = (111.32 * Math.cos((projection.invert?.([W / 2, H / 2])?.[1] ?? 30) * (Math.PI / 180))) / pxPerDeg || 1

  const inView = (lon: number, lat: number) => {
    const p = projection([lon, lat])
    return !!p && p[0] > PAD && p[0] < W - PAD && p[1] > PAD && p[1] < H - PAD
  }

  const clampFs = (base: number) => Math.max(11, Math.min(24, base))

  /* برچسب نواحی: مرکز واقعی چندضلعی، نه میانگین نقطه‌ها */
  const regionLabels = useMemo(() => {
    return Object.keys(regions)
      .filter((id) => phase.regions?.includes(id) || phase.ghost?.includes(id) || spec.base?.includes(id))
      .filter((id, k, all) => all.indexOf(id) === k)
      .map((id) => {
        const f = regionFeature(id)
        if (!f) return null
        const c = geoCentroid(f as any) as [number, number]
        const p = projection(c)
        if (!p) return null
        const ghost = !!phase.ghost?.includes(id)
        const on = !!phase.regions?.includes(id)
        return { id, label: regions[id].short ?? regions[id].label, x: p[0], y: p[1], ghost, on }
      })
      .filter((v): v is { id: string; label: string; x: number; y: number; ghost: boolean; on: boolean } => !!v)
  }, [phase, projection])

  const seaLabels = useMemo(
    () => seas.filter((s) => inView(s.lon, s.lat)).map((s) => ({ ...s, p: projection([s.lon, s.lat])! })),
    [projection]
  )

  const geoLabels = useMemo(() => {
    const placed: { text: string; x: number; y: number; fs: number; kind: 'country' | 'sea'; rotate?: number }[] = []
    const boxes: { x: number; y: number; w: number; h: number }[] = []
    const push = (text: string, x: number, y: number, fs: number, kind: 'country' | 'sea', rotate?: number) => {
      const w = (rotate ? fs * 1.3 : labelWidth(text, fs)) * 1.12
      const h = rotate ? labelWidth(text, fs) : fs * 1.9
      const box = rotate
        ? { x: x - w / 2, y: y - h / 2, w, h }
        : { x: x - w / 2, y: y - h / 2, w, h }
      if (boxes.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)) return
      boxes.push(box)
      placed.push({ text, x, y, fs, kind, rotate })
    }
    // اول دریاها: در پس‌زمینه و کج، مثل اطلس‌های چاپی
    for (const s of seaLabels) push(s.label, s.p[0], s.p[1], 9.5, 'sea', -52)
    // بعد نام سرزمین‌های امروز
    if (!zoomedIn) return placed
    for (const c of countryLabels) {
      if (!inView(c.lon, c.lat)) continue
      const p = projection([c.lon, c.lat])!
      push(c.label, p[0], p[1], 10, 'country')
    }
    return placed
  }, [projection, seaLabels, zoomedIn])

  /* برچسب قلمروها: اندازهٔ خوانا + پرهیز از هم‌پوشانی */
  const placedRegionLabels = useMemo(() => {
    const out: { id: string; label: string; x: number; y: number; ghost: boolean; on: boolean; fs: number }[] = []
    const boxes: { x: number; y: number; w: number; h: number }[] = []
    for (const r of regionLabels) {
      const fs = r.on ? 14 : 12
      const w = labelWidth(r.label, fs) * 1.14
      const h = fs * 2.1
      const box = { x: r.x - w / 2, y: r.y - h / 2, w, h }
      if (boxes.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)) continue
      boxes.push(box)
      out.push({ ...r, fs })
    }
    return out
  }, [regionLabels])

  const fs = clampFs(W / 62)
  const stepCount = spec.phases.length

  return (
    <div className="atlas" data-atlas>
      {chrome && (
        <div className="atlas__bar">
          <div className="min-w-0">
            {spec.kicker && <div className="atlas__kicker">{spec.kicker}</div>}
            <div className="truncate text-[0.95rem] font-bold">{spec.title}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="map-btn" onClick={() => { setPlaying(false); setI(0) }} aria-label="از آغاز">
              <RotateCcw size={14} />
            </button>
            <button
              className={cn('map-btn', playing && 'map-btn--on')}
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'توقف' : 'پخش'}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>
      )}

      {spec.mode === 'plan' ? (
        <CityPlan spec={spec} phase={phase} index={i} />
      ) : (
      <div className="atlas__frame" ref={wrapRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          className="atlas__svg"
          role="img"
          aria-label={`${spec.title} — ${phase.title}`}
        >
          <defs>
            <radialGradient id={`${uid}-sea`} cx="42%" cy="30%" r="90%">
              <stop offset="0%" stopColor={palette.sea[0]} />
              <stop offset="58%" stopColor={palette.sea[1]} />
              <stop offset="100%" stopColor={palette.sea[2]} />
            </radialGradient>
            <linearGradient id={`${uid}-land`} x1="0" y1="0" x2="0.75" y2="1">
              <stop offset="0%" stopColor={palette.land[0]} />
              <stop offset="55%" stopColor={palette.land[1]} />
              <stop offset="100%" stopColor={palette.land[2]} />
            </linearGradient>
            <linearGradient id={`${uid}-terr`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={palette.soft} stopOpacity="0.55" />
              <stop offset="100%" stopColor={palette.main} stopOpacity="0.5" />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id={`${uid}-hatch`} width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke={palette.main} strokeWidth="1.2" strokeOpacity="0.22" />
            </pattern>
            <clipPath id={`${uid}-landclip`}>
              <path d={landPath} />
            </clipPath>
            <clipPath id={`${uid}-framelip`}>
              <rect x="0" y="0" width={W} height={H} rx="6" />
            </clipPath>
            <marker id={`${uid}-head`} markerWidth="10" markerHeight="10" refX="8.5" refY="5" orient="auto">
              <path d="M0,0 L9,5 L0,10 z" fill={palette.main} />
            </marker>
            <marker id={`${uid}-head-rose`} markerWidth="10" markerHeight="10" refX="8.5" refY="5" orient="auto">
              <path d="M0,0 L9,5 L0,10 z" fill={TONES.rose} />
            </marker>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-sea)`} />
          <g clipPath={`url(#${uid}-framelip)`}>
            {/* خطوط نصف‌النهار و مدار */}
            <path d={graticulePath} fill="none" stroke="#8fb4d4" strokeOpacity="0.13" strokeWidth="0.6" />

            {/* خشکی */}
            <path d={landPath} fill={`url(#${uid}-land)`} stroke="#a58a5c" strokeOpacity="0.55" strokeWidth="0.7" />
            {/* مرزهای امروز، بسیار کمرنگ: فقط برای جهت‌یابی */}
            <path d={borderPath} fill="none" stroke="#8a7043" strokeOpacity="0.32" strokeWidth="0.55" strokeDasharray="3 3" />

            {/* سایهٔ ساحل */}
            <g clipPath={`url(#${uid}-landclip)`} pointerEvents="none" opacity="0.22">
              <path d={landPath} fill="none" stroke="#5d4c2c" strokeWidth="2.2" />
            </g>

            {/* رودها */}
            <g clipPath={`url(#${uid}-landclip)`} pointerEvents="none">
              {rivers.map((r) => {
                const d = path({ type: 'LineString', coordinates: r.points } as any)
                if (!d) return null
                return <path key={r.name} d={d} fill="none" stroke="#4c7e97" strokeWidth="1.1" strokeOpacity="0.55" strokeLinecap="round" />
              })}
            </g>

            {/* جغرافیای سیاسی پایه: قلمرو دولت‌های این دوره */}
            <g clipPath={`url(#${uid}-landclip)`}>
              {[...new Set(spec.base ?? [])]
                .filter((id) => !phase.regions?.includes(id) && !phase.ghost?.includes(id))
                .map((id) => {
                  const f = regionFeature(id)
                  const d = f ? path(f) : ''
                  if (!d) return null
                  return (
                    <g key={`base-${id}`}>
                      <path d={d} fill={palette.main} fillOpacity="0.1" />
                      <path d={d} fill="none" stroke={palette.main} strokeOpacity="0.4" strokeWidth="0.9" strokeDasharray="6 4" />
                    </g>
                  )
                })}
            </g>

            {/* قلمرو پیشین */}
            <g clipPath={`url(#${uid}-landclip)`}>
              {(phase.ghost ?? []).map((id) => {
                const f = regionFeature(id)
                const d = f ? path(f) : ''
                if (!d) return null
                return (
                  <path key={`g-${id}`} d={d} fill="#8a7550" fillOpacity="0.07" stroke="#7d6a47" strokeOpacity="0.5" strokeWidth="0.9" strokeDasharray="5 4" />
                )
              })}
            </g>

            {/* قلمرو این گام */}
            <AnimatePresence mode="sync">
              <motion.g
                key={`regions-${i}`}
                clipPath={`url(#${uid}-landclip)`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
              >
                {(phase.regions ?? []).map((id) => {
                  const f = regionFeature(id)
                  const d = f ? path(f) : ''
                  if (!d) return null
                  return (
                    <g key={`r-${id}`}>
                      <path d={d} fill={`url(#${uid}-terr)`} />
                      <path d={d} fill={`url(#${uid}-hatch)`} />
                      <path d={d} fill="none" stroke={palette.main} strokeOpacity="0.9" strokeWidth="1.5" strokeLinejoin="round" />
                    </g>
                  )
                })}
              </motion.g>
            </AnimatePresence>

            {/* کشورهای افزوده‌شده */}
            <motion.g
              key={`countries-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              clipPath={`url(#${uid}-landclip)`}
            >
              {(phase.countries ?? []).map((id) => {
                const f = shapeById.get(id)
                const d = f ? path(f) : ''
                if (!d) return null
                return (
                  <g key={`c-${id}`}>
                    <path d={d} fill={palette.main} fillOpacity="0.3" />
                    <path d={d} fill="none" stroke={palette.main} strokeOpacity="0.85" strokeWidth="1.4" />
                  </g>
                )
              })}
            </motion.g>

            {/* مسیرها و پیکان‌ها */}
            <g pointerEvents="none">
              {(phase.arrows ?? []).map((a, k) => {
                const p0 = projection(a.from)
                const p1 = projection(a.to)
                if (!p0 || !p1) return null
                const [x0, y0] = p0
                const [x1, y1] = p1
                const dx = x1 - x0
                const dy = y1 - y0
                const len = Math.hypot(dx, dy) || 1
                const bend = (a.bend ?? 0.2) * len
                const cx = (x0 + x1) / 2 - (dy / len) * bend
                const cy = (y0 + y1) / 2 + (dx / len) * bend
                const d = `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`
                const tone = TONES[a.tone ?? 'gold']
                return (
                  <g key={`a-${k}`}>
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={tone}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeDasharray="7 5"
                      markerEnd={`url(#${uid}-head${a.tone === 'rose' ? '-rose' : ''})`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.95 }}
                      transition={{ duration: 0.9, delay: 0.15 * k }}
                      style={{ filter: `url(#${uid}-glow)` }}
                    />
                    {a.label && (
                      <text
                        x={(x0 + x1) / 2 + dx * 0.05}
                        y={(y0 + y1) / 2 + dy * 0.05 - 8}
                        textAnchor="middle"
                        fontSize={11 * unit}
                        fontWeight={700}
                        fill="#f7ecd2"
                        stroke="#0b1b2b"
                        strokeWidth="3.4"
                        paintOrder="stroke"
                        style={{ fontFamily: 'Estedad, sans-serif' }}
                      >
                        {a.label}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>

            {/* شهرها و نقطه‌های کلیدی */}
            <g>
              {(phase.pins ?? []).map((pin, k) => {
                const p = projection([pin.lon, pin.lat])
                if (!p) return null
                const [x, y] = p
                const tone = TONES[pin.tone ?? 'gold']
                const labelX = x + 11
                return (
                  <motion.g
                    key={`p-${k}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * k, duration: 0.4 }}
                  >
                    <circle cx={x} cy={y} r={11} fill={tone} fillOpacity="0.16" />
                    <circle cx={x} cy={y} r={4.2} fill={tone} stroke="#0d1f30" strokeWidth="1.1" />
                    <text
                      x={labelX}
                      y={y + 5 * unit}
                      fontSize={12 * unit}
                      fontWeight={800}
                      fill="#0f1f2f"
                      stroke="#f6ecd4"
                      strokeWidth="4"
                      paintOrder="stroke"
                      style={{ fontFamily: 'Estedad, sans-serif' }}
                    >
                      {pin.label}
                    </text>
                  </motion.g>
                )
              })}
            </g>

            {/* نام نواحی تاریخی */}
            <g pointerEvents="none">
              {placedRegionLabels.map((r) => (
                <text
                  key={r.id}
                  x={r.x}
                  y={r.y}
                  textAnchor="middle"
                  fontSize={r.fs * unit}
                  fontWeight={800}
                  letterSpacing="0.3"
                  fill={r.ghost ? '#6d5c3d' : r.on ? '#241a06' : '#5a4a2b'}
                  fillOpacity={r.ghost ? 0.55 : r.on ? 0.95 : 0.58}
                  stroke="#f6ecd6"
                  strokeOpacity={r.on ? 0.75 : 0.45}
                  strokeWidth="2.6"
                  paintOrder="stroke"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >
                  {r.label}
                </text>
              ))}
            </g>

            {/* نام کشورها و دریاها */}
            <g pointerEvents="none">
              {geoLabels.map((l) => (
                <text
                  key={`${l.kind}-${l.text}`}
                  x={l.x}
                  y={l.y}
                  textAnchor="middle"
                  fontSize={l.fs * unit}
                  letterSpacing={l.kind === 'sea' ? l.fs * 0.22 : l.fs * 0.06}
                  fill={l.kind === 'sea' ? '#9cc2e2' : '#6a5738'}
                  fillOpacity={l.kind === 'sea' ? 0.5 : 0.55}
                  transform={l.rotate ? `rotate(${l.rotate} ${l.x} ${l.y})` : undefined}
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >
                  {l.text}
                </text>
              ))}
            </g>

            {/* قاب داخلی */}
            <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="#b79a63" strokeOpacity="0.35" />
          </g>

          {/* راهنمای شمال */}
          <g transform={`translate(${W - 46}, ${H - 112})`} opacity="0.7">
            <circle r="20" fill="#0d2033" fillOpacity="0.55" stroke="#c9ab74" strokeOpacity="0.45" />
            <path d="M0,-14 L5,2 L0,-1 L-5,2 Z" fill="#e6c579" />
            <text y="15" textAnchor="middle" fontSize="9" fill="#e6c579" style={{ fontFamily: 'Estedad, sans-serif' }}>ش</text>
          </g>

          {/* مقیاس */}
          <g transform={`translate(30, ${H - 26})`} opacity="0.9">
            {(() => {
              const target = 120 * kmPerPx
              const nice = [50, 100, 200, 250, 500, 750, 1000, 1500, 2000, 3000, 4000].reduce(
                (best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best),
                100
              )
              const px = nice / kmPerPx
              return (
                <>
                  <rect x="-8" y="-16" width={px + 70} height="30" rx="6" fill="#0b1c2c" fillOpacity="0.5" />
                  <line x1="0" y1="0" x2={px} y2="0" stroke="#e6c579" strokeWidth="1.6" />
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#e6c579" strokeWidth="1.6" />
                  <line x1={px} y1="-4" x2={px} y2="4" stroke="#e6c579" strokeWidth="1.6" />
                  <text x={px / 2} y="-6" textAnchor="middle" fontSize="9.5" fill="#f4e6c6" style={{ fontFamily: 'Estedad, sans-serif' }}>
                    {fas(nice)} کیلومتر
                  </text>
                </>
              )
            })()}
          </g>


        </svg>

        {/* پانوشت گام */}
        <div className="atlas__caption">
          <div className="flex items-center gap-2">
            <span className="atlas__step">{fas(i + 1)} / {fas(stepCount)}</span>
            <span className="atlas__stepTitle">{phase.title}</span>
          </div>
          <p className="atlas__captionText">{phase.caption}</p>
          {stepCount > 1 && (
            <div className="atlas__dots">
              {spec.phases.map((p, k) => (
                <button
                  key={p.title + k}
                  onClick={() => { setPlaying(false); setI(k) }}
                  className={cn('atlas__dot', k === i && 'atlas__dot--on')}
                  aria-label={p.title}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default AtlasMap
