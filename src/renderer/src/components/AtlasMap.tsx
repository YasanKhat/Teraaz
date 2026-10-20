import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Compass, Minus, Pause, Play, Plus, RotateCcw, Move } from 'lucide-react'
import { geoBounds, geoCentroid, geoGraticule, geoMercator, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import world from 'world-atlas/countries-50m.json'
import worldCoarse from 'world-atlas/countries-110m.json'
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
  conquest: { main: '#c98a2a', soft: '#e7c979', wash: '#a87a33', line: '#8f6a24', sea: ['#12314c', '#0b2136', '#071827'], land: ['#efe3c6', '#e3d3b0', '#d6c39c'] },
  steppe: { main: '#b04f36', soft: '#e0856c', wash: '#a3603f', line: '#8c4830', sea: ['#14334a', '#0c2337', '#081a28'], land: ['#eee1c4', '#e2d0ab', '#d3bf95'] },
  sea: { main: '#367f78', soft: '#79c3bc', wash: '#5c8778', line: '#2f6660', sea: ['#10334a', '#0b2236', '#071827'], land: ['#eee5ca', '#e3d6b4', '#d5c49d'] },
  europe: { main: '#6a6b9b', soft: '#8fa9dd', wash: '#8a7f6a', line: '#6b5233', sea: ['#122e49', '#0c2237', '#081827'], land: ['#eee4c8', '#e2d3ae', '#d4c199'] }
} as const

const TONES = { gold: '#e6bb58', rose: '#d0705a', turq: '#4fb0a7' } as const

/** مسیر نرمِ بسته از نقطه‌های صفحه (کاتمول‌رام → بزیه): مرزهای تاریخی لبهٔ تیز ندارند */
function smoothClosed(pts: [number, number][], tension = 1): string {
  const n = pts.length
  if (n < 3) return ''
  const at = (i: number) => pts[((i % n) + n) % n]
  const r = (v: number) => Math.round(v * 10) / 10
  let d = `M${r(pts[0][0])},${r(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension
    d += `C${r(c1x)},${r(c1y)} ${r(c2x)},${r(c2y)} ${r(p2[0])},${r(p2[1])}`
  }
  return `${d}Z`
}

const W = 1000
const H = 620
const PAD = 26

/* ── پایهٔ جغرافیایی، یک‌بار برای همیشه ─────────────────────────────────── */
const topo: any = world
const countriesFC: any = feature(topo, topo.objects.countries)
const landFC: any = feature(topo, topo.objects.land)
/** خشکی بی‌جنوبگان: قطب جنوب در اطلس تاریخی فقط قاب را شلوغ می‌کند */
const landNoAntarctica: any = {
  type: 'FeatureCollection',
  features: countriesFC.features.filter((f: any) => Number(f.id) !== 10)
}
const borderMesh: any = (mesh as any)(topo, topo.objects.countries, (a: any, b: any) => a !== b)

/** خشکیِ ساده (۱۱۰m) فقط برای ماسک‌کردن قلمروها: سبک و سریع */
const coarseTopo: any = worldCoarse
const coarseLand: any = {
  type: 'FeatureCollection',
  features: (feature(coarseTopo, coarseTopo.objects.countries) as any).features.filter((f: any) => Number(f.id) !== 10)
}

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

/** حاشیه و هم‌نسبت‌سازی: هر گستره را به قابی پرکشیده با همان نسبت قاب بدل می‌کند */
function frameBox(pts: [number, number][], padFactor = 1) {
  const lons = pts.map((p) => p[0])
  const lats = pts.map((p) => p[1])
  let [minLon, maxLon] = [Math.min(...lons), Math.max(...lons)]
  let [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)]

  // حاشیهٔ طبیعی؛ نقشه نباید مثل برشِ چسبان به لبه بچسبد
  const padLon = Math.max(1.6, (maxLon - minLon) * 0.14) * padFactor
  const padLat = Math.max(1.2, (maxLat - minLat) * 0.16) * padFactor
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

/** نقاط تعیین‌کنندهٔ گسترهٔ یک گام: قلمرو، نشانه‌ها و مسیرها */
function phasePoints(phase: MapPhase): [number, number][] {
  const pts: [number, number][] = []
  const pushAll = (ids?: string[]) => ids?.forEach((id) => regions[id]?.points.forEach((pt) => pts.push(pt)))
  pushAll(phase.regions)
  pushAll(phase.ghost)
  phase.pins?.forEach((pin) => pts.push([pin.lon, pin.lat]))
  phase.arrows?.forEach((a) => pts.push(a.from, a.to))
  phase.countries?.forEach((id) => {
    const f = shapeById.get(id)
    if (f) {
      const b = geoBounds(f)
      pts.push([b[0][0], b[0][1]], [b[1][0], b[1][1]])
    }
  })
  return pts
}

/** گسترهٔ جغرافیایی یک نقشه: همهٔ گام‌ها + کمی حاشیه، با حداقل اندازه */
function extentOf(spec: MapSpec) {
  const pts = spec.phases.flatMap(phasePoints)
  if (!pts.length) {
    const base: [number, number][] = []
    spec.base?.forEach((id) => regions[id]?.points.forEach((pt) => base.push(pt)))
    pts.push(...(base.length ? base : ([[30, 20], [70, 48]] as [number, number][])))
  }
  return frameBox(pts)
}

type Box = { minLon: number; maxLon: number; minLat: number; maxLat: number; wide: boolean }

/** تصویر مرکاتوری: گسترهٔ نقشه را دقیقاً در قاب می‌نشاند (بدون تکیه بر fitExtent) */
export function projectionFor(b: Box) {
  const minLat = Math.max(-56, b.minLat)
  const maxLat = Math.min(78, b.maxLat)
  let minLon = b.minLon
  let maxLon = b.maxLon
  if (maxLon - minLon > 360) {
    const c = (minLon + maxLon) / 2
    minLon = c - 180
    maxLon = c + 180
  }
  const cLon = (minLon + maxLon) / 2
  const cLat = (minLat + maxLat) / 2
  const unit = geoMercator().center([cLon, cLat]).scale(1).translate([0, 0])
  const corners: [number, number][] = [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat]
  ]
  const pts = corners.map((c) => unit(c)).filter((p): p is [number, number] => !!p)
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const wSpan = Math.max(1e-6, Math.max(...xs) - Math.min(...xs))
  const hSpan = Math.max(1e-6, Math.max(...ys) - Math.min(...ys))
  const s = Math.min((W - 2 * PAD) / wSpan, (H - 2 * PAD) / hSpan)
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2
  return geoMercator()
    .center([cLon, cLat])
    .scale(s)
    .translate([W / 2 - cx * s, H / 2 - cy * s])
}

/** دوربین یک گام: مقیاس و جابه‌جایی لازم تا گسترهٔ همان گام قاب را پر کند */
export function cameraFor(phase: MapPhase, projection: (p: [number, number]) => [number, number] | null, cap: number) {
  const pts = phasePoints(phase)
  if (pts.length < 2) return { x: 0, y: 0, k: 1 }
  const fb = frameBox(pts, 0.45)
  const corners: [number, number][] = [
    [fb.minLon, fb.minLat],
    [fb.maxLon, fb.minLat],
    [fb.maxLon, fb.maxLat],
    [fb.minLon, fb.maxLat]
  ]
  const proj = corners.map((c) => projection(c)).filter((p): p is [number, number] => !!p)
  if (proj.length < 2) return { x: 0, y: 0, k: 1 }
  const xs = proj.map((p) => p[0])
  const ys = proj.map((p) => p[1])
  const rx0 = Math.min(...xs)
  const rx1 = Math.max(...xs)
  const ry0 = Math.min(...ys)
  const ry1 = Math.max(...ys)
  const raw = Math.min((W - 2 * PAD) / Math.max(1, rx1 - rx0), (H - 2 * PAD) / Math.max(1, ry1 - ry0))
  const k = Math.max(1, Math.min(cap, raw))
  const cx = (rx0 + rx1) / 2
  const cy = (ry0 + ry1) / 2
  return { x: W / 2 - cx * k, y: H / 2 - cy * k, k }
}

export const ATLAS_FRAME = { W, H, PAD, extentOf }

/** جای خوانا برای برچسب: چهار جهت را امتحان می‌کند و از هم‌پوشانی می‌پرهیزد */
function placeLabels<T extends { x: number; y: number; label: string }>(
  items: T[],
  unit = 1,
  obstacles: { x: number; y: number; label: string }[] = [],
  avoid: { x: number; y: number }[] = []
) {
  const wOf = (t: string) => (t.length * 7.4 + 6) * unit
  const boxes: { x0: number; y0: number; x1: number; y1: number }[] = obstacles.map((o) => ({
    x0: o.x - wOf(o.label) / 2,
    y0: o.y - 15 * unit,
    x1: o.x + wOf(o.label) / 2,
    y1: o.y + 4 * unit
  }))
  // خودِ نشانه‌ها هم نباید زیر متن‌ها پنهان شوند
  for (const a of avoid) {
    boxes.push({ x0: a.x - 9 * unit, y0: a.y - 9 * unit, x1: a.x + 9 * unit, y1: a.y + 9 * unit })
  }
  const out: (T & { dx: number; dy: number; anchor: 'start' | 'end' | 'middle' })[] = []
  const widthOf = (t: string) => wOf(t)
  const d = 15 * unit
  // چند جهت و چند فاصله؛ اولویت با کنارِ نشانه، بعد بالا/پایین
  const dirs: { dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }[] = [
    { dx: d, dy: 4.5 * unit, anchor: 'start' },
    { dx: -d, dy: 4.5 * unit, anchor: 'end' },
    { dx: d, dy: -10 * unit, anchor: 'start' },
    { dx: -d, dy: -10 * unit, anchor: 'end' },
    { dx: d, dy: 20 * unit, anchor: 'start' },
    { dx: -d, dy: 20 * unit, anchor: 'end' },
    { dx: 2.2 * d, dy: 4.5 * unit, anchor: 'start' },
    { dx: -2.2 * d, dy: 4.5 * unit, anchor: 'end' },
    { dx: 2.2 * d, dy: -16 * unit, anchor: 'start' },
    { dx: -2.2 * d, dy: -16 * unit, anchor: 'end' },
    { dx: 2.2 * d, dy: 26 * unit, anchor: 'start' },
    { dx: -2.2 * d, dy: 26 * unit, anchor: 'end' },
    { dx: 3.4 * d, dy: 4.5 * unit, anchor: 'start' },
    { dx: -3.4 * d, dy: 4.5 * unit, anchor: 'end' },
    { dx: 3.4 * d, dy: -22 * unit, anchor: 'start' },
    { dx: -3.4 * d, dy: -22 * unit, anchor: 'end' },
    { dx: 3.4 * d, dy: 32 * unit, anchor: 'start' },
    { dx: -3.4 * d, dy: 32 * unit, anchor: 'end' },
    { dx: 0.6 * d, dy: -30 * unit, anchor: 'middle' },
    { dx: 0.6 * d, dy: 38 * unit, anchor: 'middle' }
  ]
  for (const it of items) {
    const width = widthOf(it.label)
    let pick: { dx: number; dy: number; anchor: 'start' | 'end' | 'middle' } | null = null
    let leastOverlap = Number.POSITIVE_INFINITY
    for (const t of dirs) {
      const x0 = t.anchor === 'start' ? it.x + t.dx : t.anchor === 'middle' ? it.x + t.dx - width / 2 : it.x + t.dx - width
      const y0 = it.y + t.dy - 14 * unit
      const box = { x0, y0, x1: x0 + width, y1: y0 + 18 * unit }
      const overlap = boxes.reduce((sum, b) => {
        const ox = Math.max(0, Math.min(box.x1, b.x1) - Math.max(box.x0, b.x0))
        const oy = Math.max(0, Math.min(box.y1, b.y1) - Math.max(box.y0, b.y0))
        return sum + ox * oy
      }, 0)
      if (overlap < leastOverlap) {
        leastOverlap = overlap
        pick = t
      }
      if (overlap === 0) break
    }
    const chosen = pick ?? dirs[0]
    const x0 = chosen.anchor === 'start' ? it.x + chosen.dx : chosen.anchor === 'middle' ? it.x + chosen.dx - width / 2 : it.x + chosen.dx - width
    boxes.push({ x0, y0: it.y + chosen.dy - 14 * unit, x1: x0 + width, y1: it.y + chosen.dy + 4 * unit })
    out.push({ ...it, ...chosen })
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
  /** بافت شهری: بلوک‌های ریز نمادین، دور از محور و میدان و رود */
  const blocks = useMemo(() => {
    if (!isCity) return [] as { x: number; y: number; w: number; h: number }[]
    const out: { x: number; y: number; w: number; h: number }[] = []
    let seed = 20240517
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    for (let n = 0; n < 420; n++) {
      const x = -off + 26 + rnd() * (vbW - 64)
      const y = 54 + rnd() * 512
      if (y > 396 && y < 528) continue
      if (Math.abs(x - 390) < 40) continue
      if (x > 404 && x < 606 && y > 216 && y < 388) continue
      out.push({ x, y, w: 16 + rnd() * 30, h: 11 + rnd() * 19 })
    }
    return out
  }, [isCity, off, vbW])

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
          <linearGradient id={`${uid}-board`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#16283a" />
            <stop offset="52%" stopColor="#101f2c" />
            <stop offset="100%" stopColor="#0a1622" />
          </linearGradient>
          <radialGradient id={`${uid}-halo`} cx="50%" cy="42%" r="66%">
            <stop offset="0%" stopColor="#2f5d7a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2f5d7a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-vig`} cx="50%" cy="46%" r="76%">
            <stop offset="60%" stopColor="#020a12" stopOpacity="0" />
            <stop offset="100%" stopColor="#020a12" stopOpacity="0.55" />
          </radialGradient>
          <pattern id={`${uid}-grid`} width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M25 0H0V25" fill="none" stroke="#7fb0c9" strokeOpacity="0.09" strokeWidth="0.6" />
          </pattern>
          <pattern id={`${uid}-grid5`} width="125" height="125" patternUnits="userSpaceOnUse">
            <path d="M125 0H0V125" fill="none" stroke="#9fc6da" strokeOpacity="0.14" strokeWidth="0.8" />
          </pattern>
          <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f8bab" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2b6b88" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-board)`} />
        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-halo)`} />
        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-grid)`} />
        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-grid5)`} />

        {/* باغ‌ها: لکه‌های سبزِ کم‌رنگ، مثل نقشهٔ باغ‌های شهری */}
        <g opacity="0.5">
          <ellipse cx={150 - off * 0.6} cy="140" rx="120" ry="82" fill="#2f5a4c" fillOpacity="0.45" />
          <ellipse cx={860 + off * 0.55} cy="520" rx="112" ry="74" fill="#2f5a4c" fillOpacity="0.38" />
          {off > 0 && (
            <>
              <ellipse cx={640 - off * 0.1} cy="86" rx="140" ry="64" fill="#2f5a4c" fillOpacity="0.28" />
              <ellipse cx={330 + off * 0.15} cy="566" rx="160" ry="72" fill="#2f5a4c" fillOpacity="0.24" />
            </>
          )}
        </g>

        {/* بافت شهری */}
        {isCity && (
          <g fill="#4a6a83" fillOpacity="0.2">
            {blocks.map((b, k) => (
              <rect key={`b-${k}`} x={b.x} y={b.y} width={b.w} height={b.h} rx="2" />
            ))}
          </g>
        )}

        {/* زاینده‌رود — فقط نقشهٔ اصفهان */}
        {isCity && (
          <g transform={`translate(500,0) scale(${vbW / 1000},1) translate(-500,0)`}>
            <path d="M-20 470 C 180 430, 380 505, 560 458 S 860 425, 1020 452" fill="none" stroke="#0b2434" strokeOpacity="0.75" strokeWidth="46" strokeLinecap="round" />
            <path d="M-20 470 C 180 430, 380 505, 560 458 S 860 425, 1020 452" fill="none" stroke={`url(#${uid}-water)`} strokeWidth="30" strokeLinecap="round" />
            <path d="M-20 470 C 180 430, 380 505, 560 458 S 860 425, 1020 452" fill="none" stroke="#8fd0e4" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
          </g>
        )}
        {isCity && (
          <g fill="#dcc38a" stroke="#8a7444" strokeWidth="0.8">
            {[[655, 452, -9], [818, 476, -6]].map(([bx, by, rot], k) => (
              <g key={`br-${k}`} transform={`translate(${bx} ${by}) rotate(${rot})`}>
                <rect x="-7" y="-26" width="14" height="52" rx="2" fillOpacity="0.9" />
                <line x1="-7" y1="-13" x2="7" y2="-13" strokeOpacity="0.5" />
                <line x1="-7" y1="13" x2="7" y2="13" strokeOpacity="0.5" />
              </g>
            ))}
          </g>
        )}
        {isCity && (
          <text
            x={186} y={444} textAnchor="middle" fontSize={13.5 * unit} fill="#bfe6f2" opacity="0.95"
            stroke="#081420" strokeWidth={2.6 * unit} paintOrder="stroke" letterSpacing="0.6"
            style={{ fontFamily: 'Estedad, sans-serif' }}
          >زاینده‌رود</text>
        )}

        {/* محورها و خیابان‌ها */}
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
          const axis = l.kind === 'axis'
          const street = l.kind === 'street'
          const river = l.kind === 'river'
          return (
            <g key={k}>
              {axis && (
                <>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d8ab53" strokeOpacity="0.16" strokeWidth="16" strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d8ab53" strokeOpacity="0.85" strokeWidth="2.6" strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f6e3ae" strokeOpacity="0.55" strokeWidth="0.9" strokeDasharray="1 9" strokeLinecap="round" />
                </>
              )}
              {street && (
                <>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9d7dd" strokeOpacity="0.08" strokeWidth="14" strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9d7dd" strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="9 6" strokeLinecap="round" />
                </>
              )}
              {river && (
                <>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1d4a60" strokeOpacity="0.8" strokeWidth="26" strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4d94b1" strokeOpacity="0.7" strokeWidth="12" strokeLinecap="round" />
                </>
              )}
              {l.label && (
                <text
                  x={bx1 + (bx2 - bx1) * (l.kind === 'axis' ? 0.16 : compact ? 0.24 : 0.5)}
                  y={by1 + (by2 - by1) * (l.kind === 'axis' ? 0.16 : compact ? 0.24 : 0.5) - 11 * unit}
                  textAnchor="middle" fontSize={13 * unit} fontWeight={700}
                  fill="#f4e6c4" stroke="#081420" strokeWidth={2.6 * unit} paintOrder="stroke" letterSpacing="0.4"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >{l.label}</text>
              )}
            </g>
          )
        })}

        {/* میدان نقش جهان — فقط نقشهٔ اصفهان */}
        {isCity && (
          <>
            <rect x="420" y="238" width="160" height="118" rx="6" fill="#d8ab53" fillOpacity="0.1" stroke="#d8ab53" strokeOpacity="0.5" strokeWidth="1.2" />
            <rect x="428" y="246" width="144" height="102" rx="4" fill="none" stroke="#d8ab53" strokeOpacity="0.26" strokeWidth="0.8" strokeDasharray="4 4" />
            {index > 0 && !pins.some((p) => p.x > 42 && p.x < 58 && p.y > 40 && p.y < 56) && (
              <text x={compact ? 760 : 500} y="376" textAnchor="middle" fontSize={12 * unit} fill="#e8d3a6" opacity="0.9" stroke="#081420" strokeWidth={3.6 * unit} paintOrder="stroke" style={{ fontFamily: 'Estedad, sans-serif' }}>میدان نقش جهان</text>
            )}
          </>
        )}

        {/* نشانه‌ها */}
        {(compact
          ? marks.map((m, k) => (
              <g key={`n-${k}`}>
                <circle cx={m.x} cy={m.y} r={badgeR * 1.6} fill={m.tone} fillOpacity="0.14" />
                <circle cx={m.x} cy={m.y} r={badgeR} fill={m.tone} fillOpacity="0.9" stroke="#0a1420" strokeWidth={1.6 / Math.max(0.4, px)} />
                <text
                  x={m.x} y={m.y + badgeFs * 0.35} textAnchor="middle" fontSize={badgeFs} fontWeight={800} fill="#12212e"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >{fas(k + 1)}</text>
              </g>
            ))
          : placeLabels(marks, unit, lineLabels).map((m, k) => (
              <g key={`n-${k}`}>
                <circle cx={m.x} cy={m.y} r="19" fill={m.tone} fillOpacity="0.13" />
                <circle cx={m.x} cy={m.y} r="10" fill="none" stroke={m.tone} strokeOpacity="0.5" strokeWidth="1.2" />
                <circle cx={m.x} cy={m.y} r="4.6" fill={m.tone} stroke="#081420" strokeWidth="1.4" style={{ filter: `url(#${uid}-glow)` }} />
                <text
                  x={m.x + m.dx} y={m.y + m.dy} textAnchor={m.anchor} fontSize={14 * unit} fontWeight={800} fill="#f8ecd2"
                  stroke="#081420" strokeWidth={3.2 * unit} paintOrder="stroke" letterSpacing="0.3"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >{m.label}</text>
              </g>
            )))}

        {/* قاب، گوشه‌ها و مقیاس */}
        <rect x={-off + 1} y="1" width={vbW - 2} height="618" fill="none" stroke="#c9ab74" strokeOpacity="0.34" />
        {[
          [-off + 1, 1, 1, 1], [off + 999, 1, -1, 1], [-off + 1, 619, 1, -1], [off + 999, 619, -1, -1]
        ].map(([x, y, sx, sy], k) => (
          <path
            key={`c-${k}`}
            d={`M${x + 22 * sx},${y} L${x},${y} L${x},${y + 22 * sy}`}
            fill="none" stroke="#d8ab53" strokeOpacity="0.6" strokeWidth="2"
          />
        ))}
        <g transform={`translate(${off + 944}, 56)`} opacity="0.9">
          <circle r="21" fill="#0a1622" fillOpacity="0.6" stroke="#c9ab74" strokeOpacity="0.42" />
          <circle r="14" fill="none" stroke="#c9ab74" strokeOpacity="0.16" />
          <path d="M0,-13 L5,2 L0,-1 L-5,2 Z" fill="#e6c579" />
          <text y="15" textAnchor="middle" fontSize="8.5" fill="#e6c579" style={{ fontFamily: 'Estedad, sans-serif' }}>ش</text>
        </g>
        <g transform="translate(38, 578)" opacity="0.95">
          <rect x="-12" y="-18" width="150" height="32" rx="8" fill="#0a1622" fillOpacity="0.6" />
          <line x1="0" y1="0" x2="118" y2="0" stroke="#e6c579" strokeWidth="1.6" />
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#e6c579" strokeWidth="1.6" />
          <line x1="118" y1="-5" x2="118" y2="5" stroke="#e6c579" strokeWidth="1.6" />
          <line x1="59" y1="0" x2="59" y2="4" stroke="#e6c579" strokeOpacity="0.7" strokeWidth="1" />
          <text x="59" y="-7" textAnchor="middle" fontSize={10.5 * unit} fill="#f4e6c6" style={{ fontFamily: 'Estedad, sans-serif' }}>{isCity ? 'حدود ۵۰۰ متر' : 'نمای نمادین'}</text>
        </g>
        <g transform={`translate(${-off + 22}, 26)`}>
          <rect width={Math.min(vbW - 44, 330)} height="46" rx="8" fill="#0a1622" fillOpacity="0.55" stroke="#c9ab74" strokeOpacity="0.22" />
          <text x="14" y="20" fontSize={11.5 * unit} fontWeight={800} fill="#f2e2bd" style={{ fontFamily: 'Estedad, sans-serif' }}>{spec.title}</text>
          <text x="14" y="36" fontSize={9.5 * unit} fill="#a9c2ce" style={{ fontFamily: 'Estedad, sans-serif' }}>
            {isCity ? 'طرح نمادین شهر؛ جای بناها تقریبی است' : 'طرح نمادین؛ جای هر نشانه تقریبی است'}
          </text>
        </g>
        <rect x={-off} width={vbW} height="620" fill={`url(#${uid}-vig)`} pointerEvents="none" />
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
  { from: [39, 8], to: [39, 74], kind: 'axis', label: 'چهارباغ' },
  { from: [18, 35], to: [88, 35], kind: 'street', label: 'بازار' }
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
  const projection = useMemo(() => projectionFor(box), [box])

  /* ── دوربین هر گام: روی همان گامی که روایت می‌شود زوم و مرکز می‌کند ──── */
  const camera = useMemo(
    () => cameraFor(phase, projection, wrapW < 560 ? 1.3 : 1.7),
    [phase, projection, wrapW]
  )

  /* ── کاربر هم می‌تواند نقشه را بکشد و زوم کند (روی دوربینِ گام) ──── */
  const [user, setUser] = useState({ x: 0, y: 0, k: 1 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  useEffect(() => {
    setUser({ x: 0, y: 0, k: 1 })
  }, [i, spec])

  /** ترکیب دوربین گام با زوم/کشش کاربر */
  const view = useMemo(
    () => ({
      k: camera.k * user.k,
      x: camera.x * user.k + user.x,
      y: camera.y * user.k + user.y
    }),
    [camera, user]
  )

  const clampUser = (u: { x: number; y: number; k: number }) => {
    const k = Math.max(0.7, Math.min(6, u.k))
    // اجازه نده نقشه کامل از قاب بیرون برود
    const spanX = W * k
    const spanY = H * k
    const x = Math.min(0.55 * W, Math.max(W - spanX - 0.55 * W, u.x))
    const y = Math.min(0.55 * H, Math.max(H - spanY - 0.55 * H, u.y))
    return { x, y, k }
  }

  /** زوم روی نشانگر ماوس: نقطهٔ زیر ماوس ثابت می‌ماند */
  const zoomAt = (sx: number, sy: number, factor: number) => {
    setUser((u) => {
      const k = Math.max(0.7, Math.min(6, u.k * factor))
      const f = k / u.k
      return clampUser({ k, x: sx - (sx - u.x) * f, y: sy - (sy - u.y) * f })
    })
  }

  const zoomCenter = (factor: number) => zoomAt(W / 2, H / 2, factor)

  const toSvg = (e: { clientX: number; clientY: number }) => {
    const el = wrapRef.current?.querySelector('svg')
    if (!el) return null
    const r = el.getBoundingClientRect()
    // با preserveAspectRatio="slice" قاب بزرگ‌تر از قاب دید است؛ مقیاس بر پایهٔ همان
    const scale = Math.max(r.width / W, r.height / H)
    const offX = (r.width - W * scale) / 2
    const offY = (r.height - H * scale) / 2
    return { x: (e.clientX - r.left - offX) / scale, y: (e.clientY - r.top - offY) / scale }
  }

  useEffect(() => {
    const el = wrapRef.current?.querySelector('svg')
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (spec.mode === 'plan') return
      e.preventDefault()
      const p = toSvg(e)
      if (!p) return
      const factor = Math.exp(-e.deltaY * 0.0016)
      zoomAt(p.x, p.y, factor)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapW, i, spec])

  /* متن‌ها با زوم کم‌تر بزرگ می‌شوند تا از حد خوانا نگذرند */
  const lk = Math.pow(camera.k, -0.78)

  const path = useMemo(() => geoPath(projection), [projection])
  const graticuleMinor = useMemo(() => path(geoGraticule().step([5, 5])() as any) ?? '', [path])
  const graticuleMajor = useMemo(() => path(geoGraticule().step([30, 30])() as any) ?? '', [path])
  const landPath = useMemo(() => path(landNoAntarctica) ?? '', [path])
  const landClipPath = useMemo(() => path(coarseLand) ?? '', [path])
  /** قلمروها با منحنی نرم رسم می‌شوند، نه خط‌شکن */
  const regionPath = useMemo(() => {
    const cache = new Map<string, string>()
    return (id: string) => {
      const hit = cache.get(id)
      if (hit !== undefined) return hit
      const r = regions[id]
      const pts = (r ? r.points : []).map((pt) => projection(pt)).filter(Boolean) as [number, number][]
      const d = pts.length >= 3 ? smoothClosed(pts, 0.95) : ''
      cache.set(id, d)
      return d
    }
  }, [projection])
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

  /** برچسبی که با دوربینِ گام از قاب بیرون می‌زند، نیمه‌بریده دیده می‌شود؛ پس کنارش می‌گذاریم */
  const inFrame = (box: { x: number; y: number; w: number; h: number }) => {
    const x0 = box.x * view.k + view.x
    const y0 = box.y * view.k + view.y
    const x1 = x0 + box.w * view.k
    const y1 = y0 + box.h * view.k
    return x0 >= 3 && y0 >= 3 && x1 <= W - 3 && y1 <= H - 3
  }

  /** نشانه‌های گام؛ برچسبشان با پرهیز از هم‌پوشانی چیده می‌شود */
  const placedPins = useMemo(() => {
    const items = (phase.pins ?? [])
      .map((pin) => {
        const p = projection([pin.lon, pin.lat])
        return p ? { ...pin, x: p[0], y: p[1], mx: p[0], my: p[1] } : null
      })
      .filter((v): v is NonNullable<typeof v> & { x: number; y: number; mx: number; my: number } => !!v)

    // نشانه‌های بسیار نزدیک (مثلاً مکه و طائف) روی هم می‌افتند؛ کمی از هم بازشان می‌کنیم
    const gap = 26
    for (let pass = 0; pass < 26; pass++) {
      let moved = false
      for (let a = 0; a < items.length; a++) {
        for (let b = a + 1; b < items.length; b++) {
          const A = items[a]
          const B = items[b]
          let dx = B.mx - A.mx
          let dy = B.my - A.my
          let d = Math.hypot(dx, dy)
          if (d >= gap) continue
          if (d < 0.001) {
            dx = Math.cos(a * 2.1)
            dy = Math.sin(a * 2.1)
            d = 1
          }
          const push = (gap - d) / 2 + 0.4
          const ux = dx / d
          const uy = dy / d
          A.mx -= ux * push
          A.my -= uy * push
          B.mx += ux * push
          B.my += uy * push
          moved = true
        }
      }
      if (!moved) break
    }

    const others = items.map((v) => ({ x: v.mx, y: v.my }))
    return placeLabels(items as any, unit * lk, [], others) as (typeof items[number] & {
      dx: number
      dy: number
      anchor: 'start' | 'end' | 'middle'
    })[]
  }, [phase, projection, unit, lk])

  /** کادر برچسب نشانه‌ها؛ مانعِ چیدن برچسب نواحی و کشورها */
  const pinBoxes = useMemo(
    () =>
      placedPins.map((p) => {
        const w = (p.label.length * 7.4 + 6) * unit * lk
        const x0 = p.anchor === 'start' ? p.mx + p.dx : p.anchor === 'middle' ? p.mx + p.dx - w / 2 : p.mx + p.dx - w
        return { x: x0 - 4, y: p.my + p.dy - 14 * unit * lk - 3, w: w + 8, h: 18 * unit * lk + 6 }
      }),
    [placedPins, unit, lk]
  )

  /** اگر برچسب نشانه‌ها در قاب کوچک جا نشود، شماره + کلید می‌آید تا هیچ نامی روی نام دیگر نیفتد */
  const pinsCrowded = useMemo(() => {
    const boxes = pinBoxes
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        const A = boxes[a]
        const B = boxes[b]
        const overlapX = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)
        const overlapY = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y)
        if (overlapX > 4 && overlapY > 4) return true
      }
    }
    return false
  }, [pinBoxes])

  const seaLabels = useMemo(
    () => seas.filter((s) => inView(s.lon, s.lat)).map((s) => ({ ...s, p: projection([s.lon, s.lat])! })),
    [projection]
  )

  /* برچسب قلمروها: اندازهٔ خوانا + پرهیز از هم‌پوشانی */
  /** ردیف‌های راهنمای نقشه بر پایهٔ عناصر همین گام */
  const legendRows = useMemo(() => {
    const rows: { label: string; color: string; kind: 'fill' | 'ghost' | 'pin' | 'arrow' }[] = []
    if (phase.regions?.length) rows.push({ label: 'قلمرو این گام', color: palette.wash, kind: 'fill' })
    if (phase.ghost?.length) rows.push({ label: 'قلمرو پیشین', color: '#8d7550', kind: 'ghost' })
    if (phase.pins?.length) rows.push({ label: 'شهر / نشانه', color: TONES.gold, kind: 'pin' })
    if (phase.arrows?.length) rows.push({ label: 'مسیر رویداد', color: TONES[phase.arrows[0].tone ?? 'gold'], kind: 'arrow' })
    return rows
  }, [phase, palette])

  const placedRegionLabels = useMemo(() => {
    const out: { id: string; label: string; x: number; y: number; ghost: boolean; on: boolean; fs: number }[] = []
    const boxes: { x: number; y: number; w: number; h: number }[] = pinBoxes.map((b) => ({ ...b }))
    for (const r of regionLabels) {
      const fs = (r.on ? 14 : 12) * lk
      const w = labelWidth(r.label, fs) * 1.14 + 8
      const h = fs * 2.1 + 6
      // اگر مرکز ناحیه شلوغ بود، کمی این‌سو و آن‌سو را امتحان کن تا نام قلمرو حذف نشود
      const offsets: [number, number][] = [
        [0, 0],
        [0, 34],
        [0, -34],
        [34, 0],
        [-34, 0],
        [26, 26],
        [-26, 26],
        [26, -26],
        [-26, -26],
        [0, 62],
        [0, -62]
      ]
      let placed = false
      for (const [ox, oy] of offsets) {
        const box = { x: r.x + ox - w / 2, y: r.y + oy - h / 2, w, h }
        if (!inFrame(box)) continue
        if (boxes.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)) continue
        boxes.push(box)
        out.push({ ...r, x: r.x + ox, y: r.y + oy, fs })
        placed = true
        break
      }
      if (!placed && r.on) {
        // قلمرو این گام هر جا باشد باید نامش دیده شود
        out.push({ ...r, fs })
      }
    }
    return out
  }, [regionLabels, pinBoxes, view, lk])

  const geoLabels = useMemo(() => {
    const placed: { text: string; x: number; y: number; fs: number; kind: 'country' | 'sea'; rotate?: number }[] = []
    const boxes: { x: number; y: number; w: number; h: number }[] = [
      ...pinBoxes.map((b) => ({ ...b })),
      ...placedRegionLabels.map((r) => ({ x: r.x - labelWidth(r.label, r.fs) / 2, y: r.y - r.fs, w: labelWidth(r.label, r.fs), h: r.fs * 2.1 }))
    ]
    const push = (text: string, x: number, y: number, fs: number, kind: 'country' | 'sea', rotate?: number) => {
      const w = (rotate ? fs * 1.3 : labelWidth(text, fs)) * 1.12
      const h = rotate ? labelWidth(text, fs) : fs * 1.9
      const box = rotate
        ? { x: x - w / 2, y: y - h / 2, w, h }
        : { x: x - w / 2, y: y - h / 2, w, h }
      if (!inFrame(box)) return
      if (boxes.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)) return
      boxes.push(box)
      placed.push({ text, x, y, fs, kind, rotate })
    }
    // اول دریاها: در پس‌زمینه و کج، مثل اطلس‌های چاپی
    for (const s of seaLabels) push(s.label, s.p[0], s.p[1], 9.5 * lk, 'sea', -52)
    // بعد نام سرزمین‌های امروز
    if (!zoomedIn) return placed
    for (const c of countryLabels) {
      if (!inView(c.lon, c.lat)) continue
      const p = projection([c.lon, c.lat])!
      push(c.label, p[0], p[1], 10 * lk, 'country')
    }
    return placed
  }, [projection, seaLabels, zoomedIn, pinBoxes, placedRegionLabels, view, lk])

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
          className={cn('atlas__svg', dragging ? 'is-dragging' : 'is-grabbable')}
          role="img"
          aria-label={`${spec.title} — ${phase.title}`}
          onPointerDown={(e) => {
            if ((e.target as Element)?.closest('.atlas-ui')) return
            ;(e.currentTarget as SVGSVGElement).setPointerCapture?.(e.pointerId)
            drag.current = { x: e.clientX, y: e.clientY, moved: false }
            setDragging(true)
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d) return
            const dx = e.clientX - d.x
            const dy = e.clientY - d.y
            if (!d.moved && Math.hypot(dx, dy) < 3) return
            d.moved = true
            const r = e.currentTarget.getBoundingClientRect()
            const scale = Math.max(r.width / W, r.height / H)
            setUser((u) => clampUser({ k: u.k, x: u.x + dx / scale, y: u.y + dy / scale }))
            drag.current = { x: e.clientX, y: e.clientY, moved: true }
          }}
          onPointerUp={(e) => {
            drag.current = null
            setDragging(false)
            ;(e.currentTarget as SVGSVGElement).releasePointerCapture?.(e.pointerId)
          }}
          onPointerCancel={() => { drag.current = null; setDragging(false) }}
          onDoubleClick={(e) => {
            const p = toSvg(e)
            if (p) zoomAt(p.x, p.y, 1.55)
          }}
        >
          <defs>
            <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0.15" y2="1">
              <stop offset="0%" stopColor={palette.sea[0]} />
              <stop offset="52%" stopColor={palette.sea[1]} />
              <stop offset="100%" stopColor={palette.sea[2]} />
            </linearGradient>
            <radialGradient id={`${uid}-seagl`} cx="48%" cy="26%" r="58%">
              <stop offset="0%" stopColor="#5aa3c2" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#5aa3c2" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${uid}-land`} x1="0.08" y1="0" x2="0.82" y2="1">
              <stop offset="0%" stopColor={palette.land[0]} />
              <stop offset="54%" stopColor={palette.land[1]} />
              <stop offset="100%" stopColor={palette.land[2]} />
            </linearGradient>
            <linearGradient id={`${uid}-terr`} x1="0.1" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor={palette.wash} stopOpacity="0.46" />
              <stop offset="55%" stopColor={palette.wash} stopOpacity="0.4" />
              <stop offset="100%" stopColor={palette.wash} stopOpacity="0.34" />
            </linearGradient>
            <radialGradient id={`${uid}-vig`} cx="50%" cy="44%" r="78%">
              <stop offset="62%" stopColor="#03121e" stopOpacity="0" />
              <stop offset="100%" stopColor="#03121e" stopOpacity="0.42" />
            </radialGradient>
            <linearGradient id={`${uid}-railtint`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#03121e" stopOpacity="0.2" />
              <stop offset="16%" stopColor="#03121e" stopOpacity="0" />
              <stop offset="84%" stopColor="#03121e" stopOpacity="0" />
              <stop offset="100%" stopColor="#03121e" stopOpacity="0.24" />
            </linearGradient>
            <pattern id={`${uid}-hatch`} width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="7" stroke={palette.main} strokeWidth="0.9" strokeOpacity="0.16" />
            </pattern>
            {/* بافت کاغذی خشکی: نقطه‌های ریز، تا نقشه تخت نباشد */}
            <pattern id={`${uid}-grain`} width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="4" r="0.7" fill="#6b5634" fillOpacity="0.16" />
              <circle cx="14" cy="11" r="0.55" fill="#6b5634" fillOpacity="0.13" />
              <circle cx="21" cy="20" r="0.8" fill="#6b5634" fillOpacity="0.12" />
              <circle cx="8" cy="21" r="0.5" fill="#6b5634" fillOpacity="0.1" />
            </pattern>
            {/* موج‌های کم‌رنگ دریا */}
            <pattern id={`${uid}-waves`} width="96" height="26" patternUnits="userSpaceOnUse">
              <path d="M0,13 C16,7 32,7 48,13 C64,19 80,19 96,13" fill="none" stroke="#9fd0e8" strokeOpacity="0.055" strokeWidth="1.1" />
              <path d="M0,24 C16,18 32,18 48,24 C64,30 80,30 96,24" fill="none" stroke="#9fd0e8" strokeOpacity="0.035" strokeWidth="1" />
            </pattern>
            {/* سایهٔ نرم خشکی روی دریا */}
            <filter id={`${uid}-landsink`} x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#03121e" floodOpacity="0.55" />
            </filter>
            <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.1" />
            </filter>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id={`${uid}-landclip`}>
              <path d={landClipPath} />
            </clipPath>
            <clipPath id={`${uid}-framelip`}>
              <rect x="0" y="0" width={W} height={H} rx="7" />
            </clipPath>
            <marker id={`${uid}-head`} markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto">
              <path d="M0,0 L10,5.5 L0,11 z" fill={palette.main} />
            </marker>
            <marker id={`${uid}-head-rose`} markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto">
              <path d="M0,0 L10,5.5 L0,11 z" fill={TONES.rose} />
            </marker>
            <marker id={`${uid}-head-turq`} markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto">
              <path d="M0,0 L10,5.5 L0,11 z" fill={TONES.turq} />
            </marker>
          </defs>

          {/* دریا: عمق، بازتاب نور و موج‌های کم‌رنگ */}
          <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-sea)`} />
          <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-waves)`} />
          <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-seagl)`} />

          <g clipPath={`url(#${uid}-framelip)`}>
            <motion.g
              initial={false}
              animate={{ x: view.x, y: view.y, scale: view.k }}
              transition={reduced || dragging ? { duration: 0 } : { duration: 1.15, ease: [0.33, 1, 0.36, 1] }}
              style={{ originX: 0, originY: 0, transformBox: 'view-box', transformOrigin: '0px 0px' }}
            >
              {/* شبکهٔ مختصات: خطوط فرعی و اصلی */}
              <path d={graticuleMinor} fill="none" stroke="#8fb4d4" strokeOpacity="0.07" strokeWidth="0.5" />
              <path d={graticuleMajor} fill="none" stroke="#9dc0dd" strokeOpacity="0.13" strokeWidth="0.7" />

              {/* خشکی: لبهٔ روشن از سمت دریا، سایهٔ نرم به سمت داخل */}
              <g filter={`url(#${uid}-landsink)`}>
                <path d={landPath} fill={`url(#${uid}-land)`} stroke="#6d5734" strokeOpacity="0.7" strokeWidth="0.9" />
              </g>
              <g clipPath={`url(#${uid}-landclip)`} pointerEvents="none">
                <path d={landPath} fill={`url(#${uid}-grain)`} />
              </g>
              <g clipPath={`url(#${uid}-landclip)`} pointerEvents="none">
                <path d={landPath} fill="none" stroke="#fff6e2" strokeOpacity="0.34" strokeWidth="1.6" />
                <path d={landPath} fill="none" stroke="#5b4527" strokeOpacity="0.14" strokeWidth="5" />
              </g>

              {/* مرزهای امروز: خیلی کم‌رنگ، فقط برای جهت‌یابی */}
              <path d={borderPath} fill="none" stroke="#6f5a37" strokeOpacity="0.2" strokeWidth="0.55" strokeDasharray="2.5 3.5" />

              {/* رودها */}
              <g clipPath={`url(#${uid}-landclip)`} pointerEvents="none">
                {rivers.map((r) => {
                  const d = path({ type: 'LineString', coordinates: r.points } as any)
                  if (!d) return null
                  return <path key={r.name} d={d} fill="none" stroke="#3f7f9c" strokeWidth="1.05" strokeOpacity="0.6" strokeLinecap="round" />
                })}
              </g>

              {/* قلمروهای پایه: زمینهٔ سیاسی این دوره */}
              <g clipPath={`url(#${uid}-landclip)`}>
                {[...new Set(spec.base ?? [])]
                  .filter((id) => !phase.regions?.includes(id) && !phase.ghost?.includes(id))
                  .map((id) => {
                    const d = regionPath(id)
                    if (!d) return null
                    return (
                      <g key={`base-${id}`}>
                        <path d={d} fill={palette.main} fillOpacity="0.055" />
                        <path d={d} fill="none" stroke={palette.line} strokeOpacity="0.24" strokeWidth="0.8" strokeDasharray="5 5" />
                      </g>
                    )
                  })}
              </g>

              {/* قلمرو پیشین: خاطرهٔ گام قبلی */}
              <g clipPath={`url(#${uid}-landclip)`}>
                {(phase.ghost ?? []).map((id) => {
                  const d = regionPath(id)
                  if (!d) return null
                  return (
                    <motion.path
                      key={`g-${id}`}
                      d={d}
                      fill="#8a7550"
                      fillOpacity="0.06"
                      stroke="#8d7550"
                      strokeOpacity="0.34"
                      strokeWidth="0.9"
                      strokeDasharray="4 5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                  )
                })}
              </g>

              {/* قلمرو این گام: پررنگ، با هاشور و خطِ جان‌گرفته */}
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
                    const d = regionPath(id)
                    if (!d) return null
                    return (
                      <g key={`r-${id}`}>
                        <path d={d} fill={`url(#${uid}-terr)`} style={{ mixBlendMode: 'multiply' }} />
                        <path d={d} fill={`url(#${uid}-hatch)`} opacity="0.5" />
                        <path d={d} fill="none" stroke={palette.soft} strokeOpacity="0.5" strokeWidth="4.5" filter={`url(#${uid}-soft)`} />
                        <motion.path
                          d={d}
                          fill="none"
                          stroke={palette.line}
                          strokeOpacity="0.92"
                          strokeWidth="1.55"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.1, ease: 'easeInOut' }}
                        />
                      </g>
                    )
                  })}
                </motion.g>
              </AnimatePresence>

              {/* کشورهای افزوده‌شده در این گام */}
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
                      <path d={d} fill={palette.main} fillOpacity="0.26" />
                      <path d={d} fill="none" stroke={palette.main} strokeOpacity="0.8" strokeWidth="1.3" />
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
                        strokeOpacity="0.28"
                        strokeWidth="7"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.1, delay: 0.12 * k }}
                      />
                      <motion.path
                        d={d}
                        fill="none"
                        stroke={tone}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeDasharray="8 5"
                        markerEnd={`url(#${uid}-head${a.tone === 'rose' ? '-rose' : a.tone === 'turq' ? '-turq' : ''})`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.95 }}
                        transition={{ duration: 1, delay: 0.12 * k }}
                        style={{ filter: `url(#${uid}-glow)` }}
                      />
                      {a.label && (
                        <text
                          x={(x0 + x1) / 2 + dx * 0.05}
                          y={(y0 + y1) / 2 + dy * 0.05 - 9 * lk}
                          textAnchor="middle"
                          fontSize={11 * unit * lk}
                          fontWeight={700}
                          fill="#f9efd8"
                          stroke="#0b1b2b"
                          strokeWidth={3.6 * lk * unit}
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

              {/* شهرها و نشانه‌ها: اول نقطه‌ها، بعد نام‌ها تا اسم‌ها زیر هم نیفتند */}
              <g>
                {!pinsCrowded && placedPins.map((pin, k) => {
                  const tone = TONES[pin.tone ?? 'gold']
                  const shifted = Math.hypot(pin.mx - pin.x, pin.my - pin.y) > 0.6
                  return (
                    <motion.g
                      key={`pm-${k}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.07 * k, duration: 0.4 }}
                      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    >
                      {shifted && (
                        <line x1={pin.x} y1={pin.y} x2={pin.mx} y2={pin.my} stroke={tone} strokeOpacity="0.55" strokeWidth={0.9 * unit} />
                      )}
                      <circle cx={pin.mx} cy={pin.my} r={12} fill={tone} fillOpacity="0.16" />
                      <circle cx={pin.mx} cy={pin.my} r={7.5} fill="none" stroke={tone} strokeOpacity="0.55" strokeWidth="1.1" className="atlas-pin__ring" />
                      <circle cx={pin.mx} cy={pin.my} r={3.6} fill={tone} stroke="#0b1b2b" strokeWidth="1.2" />
                    </motion.g>
                  )
                })}
              </g>
              <g pointerEvents="none">
                {pinsCrowded
                  ? placedPins.map((pin, k) => {
                      const tone = TONES[pin.tone ?? 'gold']
                      const r = 9.5
                      // نشانه‌های نزدیک: به‌جای نام، شماره روی خودِ نشانه؛ کلید در پانوشت
                      const bx = pin.mx
                      const by = pin.my
                      return (
                        <g key={`pn-${k}`}>
                          <line x1={pin.x} y1={pin.y} x2={bx} y2={by} stroke={tone} strokeOpacity="0.55" strokeWidth="1" />
                          <circle cx={bx} cy={by} r={r + 2.4} fill={tone} fillOpacity="0.18" />
                          <circle cx={bx} cy={by} r={r} fill={tone} stroke="#0b1b2b" strokeWidth="1.2" />
                          <text
                            x={bx}
                            y={by + r * 0.36}
                            textAnchor="middle"
                            fontSize={r * 1.15}
                            fontWeight={800}
                            fill="#10202e"
                            style={{ fontFamily: 'Estedad, sans-serif' }}
                          >
                            {fas(k + 1)}
                          </text>
                        </g>
                      )
                    })
                  : placedPins.map((pin, k) => {
                  const tone = TONES[pin.tone ?? 'gold']
                  const labelW = pin.label.length * 7.4 * unit * lk
                  const rawX = pin.mx + pin.dx
                  const labelX =
                    pin.anchor === 'start'
                      ? Math.min(rawX, W - 10 - labelW)
                      : pin.anchor === 'middle'
                        ? Math.min(Math.max(rawX, 10 + labelW / 2), W - 10 - labelW / 2)
                        : Math.max(rawX, 10 + labelW)
                  return (
                    <motion.text
                      key={`pl-${k}`}
                      x={labelX}
                      y={pin.my + pin.dy}
                      textAnchor={pin.anchor}
                      fontSize={12 * unit * lk}
                      fontWeight={800}
                      fill="#15202c"
                      stroke="#f9efd8"
                      strokeWidth={4 * lk * unit}
                      paintOrder="stroke"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.12 + 0.05 * k, duration: 0.35 }}
                      style={{ fontFamily: 'Estedad, sans-serif' }}
                    >
                      {pin.label}
                    </motion.text>
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
                    letterSpacing={0.4}
                    fill={r.ghost ? '#6d5c3d' : r.on ? '#241a06' : '#5f4d2c'}
                    fillOpacity={r.ghost ? 0.62 : r.on ? 0.97 : 0.76}
                    stroke="#f8efd9"
                    strokeOpacity={r.on ? 0.8 : 0.5}
                    strokeWidth={2.6 * lk * unit}
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
                    letterSpacing={l.kind === 'sea' ? l.fs * 0.24 : l.fs * 0.08}
                    fontStyle={l.kind === 'sea' ? 'italic' : undefined}
                    fill={l.kind === 'sea' ? '#b6d6ea' : '#6a5738'}
                    fillOpacity={l.kind === 'sea' ? 0.78 : 0.62}
                    transform={l.rotate ? `rotate(${l.rotate} ${l.x} ${l.y})` : undefined}
                    style={{ fontFamily: 'Estedad, sans-serif' }}
                  >
                    {l.text}
                  </text>
                ))}
              </g>
            </motion.g>

            {/* هالهٔ تاریک لبه‌ها و قاب */}
            <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-vig)`} pointerEvents="none" />
            <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-railtint)`} pointerEvents="none" />
            <rect x="0.6" y="0.6" width={W - 1.2} height={H - 1.2} rx="7" fill="none" stroke="#c9ab74" strokeOpacity="0.4" pointerEvents="none" />
            <rect x="5.5" y="5.5" width={W - 11} height={H - 11} rx="4" fill="none" stroke="#c9ab74" strokeOpacity="0.12" pointerEvents="none" />
          </g>

          {/* راهنمای نقشه */}
          {(phase.regions?.length || phase.ghost?.length || phase.pins?.length || phase.arrows?.length) ? (
            <g transform="translate(18, 20)" pointerEvents="none">
              <rect width="188" height={14 + legendRows.length * 19} rx="9" fill="#061a29" fillOpacity="0.72" stroke="#c9ab74" strokeOpacity="0.28" />
              <text x="12" y="16" fontSize="9" fill="#e6c579" letterSpacing="1.2" style={{ fontFamily: 'Estedad, sans-serif' }}>راهنما</text>
              {legendRows.map((row, k) => (
                <g key={row.label} transform={`translate(12, ${22 + k * 19})`}>
                  {row.kind === 'fill' && (
                    <>
                      <rect width="16" height="11" rx="2.5" fill={row.color} fillOpacity="0.5" stroke={row.color} strokeOpacity="0.9" />
                    </>
                  )}
                  {row.kind === 'ghost' && (
                    <rect width="16" height="11" rx="2.5" fill="none" stroke={row.color} strokeOpacity="0.8" strokeDasharray="3 2.5" />
                  )}
                  {row.kind === 'pin' && (
                    <>
                      <circle cx="8" cy="5.5" r="4.6" fill={row.color} fillOpacity="0.2" />
                      <circle cx="8" cy="5.5" r="2.2" fill={row.color} />
                    </>
                  )}
                  {row.kind === 'arrow' && (
                    <path d="M0,5.5 Q8,-1 16,5.5" fill="none" stroke={row.color} strokeWidth="1.6" strokeDasharray="4 2.5" />
                  )}
                  <text x="24" y="9" fontSize="9.5" fill="#e8ddc6" style={{ fontFamily: 'Estedad, sans-serif' }}>{row.label}</text>
                </g>
              ))}
            </g>
          ) : null}

          {/* راهنمای شمال */}
          <g transform={`translate(${W - 44}, 48)`} opacity="0.9" pointerEvents="none">
            <circle r="19" fill="#061a29" fillOpacity="0.6" stroke="#c9ab74" strokeOpacity="0.42" />
            <circle r="13" fill="none" stroke="#c9ab74" strokeOpacity="0.16" />
            <path d="M0,-12.5 L4.6,2 L0,-1 L-4.6,2 Z" fill="#e6c579" />
            <text y="14.5" textAnchor="middle" fontSize="8" fill="#e6c579" style={{ fontFamily: 'Estedad, sans-serif' }}>ش</text>
          </g>

          {/* مقیاس */}
          <g transform={`translate(32, ${H - 26})`} pointerEvents="none">
            {(() => {
              const effKm = kmPerPx / camera.k
              const target = 118 * effKm
              const nice = [50, 100, 200, 250, 500, 750, 1000, 1500, 2000, 3000, 4000].reduce(
                (best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best),
                100
              )
              const px = nice / effKm
              return (
                <>
                  <rect x="-10" y="-17" width={px + 72} height="30" rx="8" fill="#061a29" fillOpacity="0.55" />
                  <line x1="0" y1="0" x2={px} y2="0" stroke="#e6c579" strokeWidth="1.5" />
                  <line x1="0" y1="-4.5" x2="0" y2="4.5" stroke="#e6c579" strokeWidth="1.5" />
                  <line x1={px} y1="-4.5" x2={px} y2="4.5" stroke="#e6c579" strokeWidth="1.5" />
                  <line x1={px / 2} y1="0" x2={px / 2} y2="3.5" stroke="#e6c579" strokeOpacity="0.7" strokeWidth="1" />
                  <text x={px / 2} y="-7" textAnchor="middle" fontSize="9.5" fill="#f4e6c6" style={{ fontFamily: 'Estedad, sans-serif' }}>
                    {fas(nice)} کیلومتر
                  </text>
                </>
              )
            })()}
          </g>
        </svg>


        {/* ابزارهای نقشه: زوم، بازگشت به قاب گام */}
        <div className="atlas-ui atlas__tools">
          <button className="atlas__tool" onClick={() => zoomCenter(1.35)} aria-label="بزرگ‌نمایی" title="بزرگ‌نمایی">
            <Plus size={15} />
          </button>
          <button className="atlas__tool" onClick={() => zoomCenter(1 / 1.35)} aria-label="کوچک‌نمایی" title="کوچک‌نمایی">
            <Minus size={15} />
          </button>
          <button
            className="atlas__tool"
            onClick={() => setUser({ x: 0, y: 0, k: 1 })}
            aria-label="بازگشت به نمای گام"
            title="بازگشت به نمای گام"
            data-off={user.k === 1 && user.x === 0 && user.y === 0}
          >
            <Compass size={15} />
          </button>
        </div>
        <div className="atlas-ui atlas__hint">
          <Move size={12} /> بکشید و زوم کنید · دوبار کلیک: نزدیک‌تر
        </div>

        {/* پانوشت گام */}
        <div className="atlas__caption">
          {stepCount > 1 && (
            <button
              className="atlas__nav"
              onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)) }}
              disabled={i === 0}
              aria-label="گام قبل"
            >
              <ChevronRight size={16} />
            </button>
          )}
          <div className="atlas__captionMain">
            <div className="flex items-center gap-2">
              <span className="atlas__step">{fas(i + 1)} / {fas(stepCount)}</span>
              <span className="atlas__stepTitle">{phase.title}</span>
            </div>
            <p className="atlas__captionText">{phase.caption}</p>
            {pinsCrowded && placedPins.length > 0 && (
              <div className="atlas__pinInline">
                {placedPins.map((pin, k) => (
                  <span key={`ki-${k}`}>
                    <b style={{ background: TONES[pin.tone ?? 'gold'] }}>{fas(k + 1)}</b>
                    {pin.label}
                  </span>
                ))}
              </div>
            )}
          </div>
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
          {stepCount > 1 && (
            <button
              className="atlas__nav"
              onClick={() => { setPlaying(false); setI(Math.min(stepCount - 1, i + 1)) }}
              disabled={i === stepCount - 1}
              aria-label="گام بعد"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default AtlasMap
