import { geoGraticule, geoMercator, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { regions, rivers, seas, countryLabels } from '../../lib/geo'

/* ────────────────────────────────────────────────────────────────────────
   موتور نقشه — همه‌چیز یک‌بار حساب می‌شود.
   برخلاف نسخهٔ پیشین، هیچ مسیری هنگام حرکت دوربین یا عوض‌شدن گام دوباره
   ساخته نمی‌شود؛ فقط شفافیت لایه‌ها و transform عوض می‌شود.
   ──────────────────────────────────────────────────────────────────────── */

export const W = 1000
export const H = 620
export const PAD = 30

export interface PlanPin {
  x: number
  y: number
  label: string
  tone?: 'gold' | 'rose' | 'turq'
}

export interface MapPhase {
  title: string
  caption: string
  planPins?: PlanPin[]
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
  base?: string[]
  mode?: 'geo' | 'plan'
  artifacts?: { x: number; y: number; label: string; kind: 'site' | 'monument' | 'object'; note?: string }[]
  phases: MapPhase[]
}

export type Tone = 'gold' | 'rose' | 'turq'

export const PALETTES = {
  conquest: {
    main: '#c08a3e',
    deep: '#8c5f22',
    soft: '#e6c37a',
    wash: '#b98c46',
    line: '#7d5a24',
    sea: ['#123049', '#0a1e31', '#061523'],
    land: ['#f1e6cc', '#e6d8b6', '#d8c69f']
  },
  steppe: {
    main: '#b4563c',
    deep: '#843a26',
    soft: '#e2a189',
    wash: '#b06a4d',
    line: '#7c3d29',
    sea: ['#122e46', '#0a1c2e', '#061421'],
    land: ['#f0e5cb', '#e5d6b4', '#d7c49d']
  },
  sea: {
    main: '#3c8a80',
    deep: '#255f58',
    soft: '#8fd0c7',
    wash: '#6b9a8c',
    line: '#2c6a62',
    sea: ['#0f2f45', '#091d2f', '#05121e'],
    land: ['#efe6cc', '#e4d7b6', '#d6c59f']
  },
  europe: {
    main: '#6b74a8',
    deep: '#464f7d',
    soft: '#a9b3d8',
    wash: '#8d8b78',
    line: '#5b522f',
    sea: ['#112c45', '#0a1d30', '#05121f'],
    land: ['#efe5c9', '#e3d5b1', '#d4c19a']
  }
} as const

export const TONES: Record<Tone, string> = {
  gold: '#e9c069',
  rose: '#d9785f',
  turq: '#5cb9ae'
}

type Box = { minLon: number; maxLon: number; minLat: number; maxLat: number; wide: boolean }

const topo: any = world
const countriesFC: any = feature(topo, topo.objects.countries)
const landFC: any = feature(topo, topo.objects.land)
const borders: any = (mesh as any)(topo, topo.objects.countries, (a: any, b: any) => a !== b)
const shapeById = new Map<string, any>()
countriesFC.features.forEach((f: any) => {
  if (f.id != null) shapeById.set(String(f.id), f)
})

/** قلمروهای تاریخی: حلقهٔ بسته از نقطه‌های ساده‌شده */
const regionFeature = (id: string) => {
  const r = regions[id]
  if (!r) return null
  const ring = [...r.points, r.points[0]]
  return { type: 'Feature', properties: { id }, geometry: { type: 'Polygon', coordinates: [ring] } } as any
}

/* ── گسترهٔ نقشه ───────────────────────────────────────────────────────── */

function phasePoints(phase: MapPhase): [number, number][] {
  const pts: [number, number][] = []
  const pushAll = (ids?: string[]) => ids?.forEach((id) => regions[id]?.points.forEach((p) => pts.push(p)))
  pushAll(phase.regions)
  pushAll(phase.ghost)
  phase.pins?.forEach((p) => pts.push([p.lon, p.lat]))
  phase.arrows?.forEach((a) => pts.push(a.from, a.to))
  phase.countries?.forEach((id) => {
    const f = shapeById.get(id)
    if (f) {
      const b = geoBoundsOf(f)
      pts.push([b[0][0], b[0][1]], [b[1][0], b[1][1]])
    }
  })
  return pts
}

function geoBoundsOf(f: any): [[number, number], [number, number]] {
  let x0 = 180
  let y0 = 90
  let x1 = -180
  let y1 = -90
  const walk = (c: any) => {
    if (typeof c[0] === 'number') {
      x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0])
      y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1])
    } else c.forEach(walk)
  }
  walk(f.geometry.coordinates)
  return [[x0, y0], [x1, y1]]
}

function frameBox(pts: [number, number][]): Box {
  let minLon = Math.min(...pts.map((p) => p[0]))
  let maxLon = Math.max(...pts.map((p) => p[0]))
  let minLat = Math.min(...pts.map((p) => p[1]))
  let maxLat = Math.max(...pts.map((p) => p[1]))
  const padLon = Math.max(1.4, (maxLon - minLon) * 0.12)
  const padLat = Math.max(1.1, (maxLat - minLat) * 0.14)
  minLon -= padLon; maxLon += padLon; minLat -= padLat; maxLat += padLat

  const cLon = (minLon + maxLon) / 2
  let cLat = (minLat + maxLat) / 2
  let spanLon = maxLon - minLon
  let spanLat = maxLat - minLat

  if (spanLon < 6) {
    spanLon = Math.max(spanLon, 2.6)
    spanLat = Math.max(spanLat, 1.7)
  } else {
    spanLon = Math.max(spanLon, 15)
    spanLat = Math.max(spanLat, 10)
  }

  const aspect = W / H
  const cos = Math.max(0.35, Math.cos((Math.PI / 180) * cLat))
  if (spanLon / spanLat < aspect) spanLon = (spanLat / cos) * aspect
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

export function extentOf(spec: MapSpec): Box {
  const pts = spec.phases.flatMap(phasePoints)
  if (pts.length) return frameBox(pts)
  const base: [number, number][] = []
  spec.base?.forEach((id) => regions[id]?.points.forEach((p) => base.push(p)))
  return frameBox(base.length ? base : [[30, 20], [70, 48]] as [number, number][])
}

/** مرکاتور دقیق: گستره را بدون اتکا به fitExtent در قاب می‌نشاند */
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
  const spanX = Math.max(1e-6, Math.max(...xs) - Math.min(...xs))
  const spanY = Math.max(1e-6, Math.max(...ys) - Math.min(...ys))
  const s = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY)
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2
  return geoMercator().center([cLon, cLat]).scale(s).translate([W / 2 - cx * s, H / 2 - cy * s])
}

/** دوربین گام: گسترهٔ همان گام را پر می‌کند */
export function cameraFor(phase: MapPhase, project: (p: [number, number]) => [number, number] | null, cap: number) {
  const pts = phasePoints(phase)
  if (pts.length < 2) return { x: 0, y: 0, k: 1 }
  const fb = frameBox(pts)
  const corners: [number, number][] = [
    [fb.minLon, fb.minLat],
    [fb.maxLon, fb.minLat],
    [fb.maxLon, fb.maxLat],
    [fb.minLon, fb.maxLat]
  ]
  const proj = corners.map((c) => project(c)).filter((p): p is [number, number] => !!p)
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

/* ── چیدمان برچسب: جلوگیری از هم‌پوشانی، با اولویت نشانه‌های مهم ────────── */

export interface LabelBox { x: number; y: number; w: number; h: number }

export const labelWidth = (text: string, fs: number) =>
  Math.max(14, text.replace(/[\u064B-\u0652\u200c]/g, '').length * fs * 0.68)

/** جای خوانا برای نام: راست، چپ، بالا، پایین، و در آخر دورتر */
export function placeLabels<T extends { x: number; y: number; label: string }>(
  items: T[],
  fs: number,
  obstacles: LabelBox[] = []
): (T & { dx: number; dy: number; anchor: 'start' | 'end' })[] {
  const boxes = obstacles.map((o) => ({ ...o }))
  const out: (T & { dx: number; dy: number; anchor: 'start' | 'end' })[] = []
  const hits = (b: LabelBox) =>
    boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y)
  const gap = fs * 1.05 + 6
  const tries = [
    { dx: gap, dy: fs * 0.4, anchor: 'start' as const },
    { dx: -gap, dy: fs * 0.4, anchor: 'end' as const },
    { dx: gap, dy: -fs * 0.85, anchor: 'start' as const },
    { dx: -gap, dy: -fs * 0.85, anchor: 'end' as const },
    { dx: gap, dy: fs * 1.5, anchor: 'start' as const },
    { dx: -gap, dy: fs * 1.5, anchor: 'end' as const },
    { dx: gap * 1.9, dy: fs * 0.4, anchor: 'start' as const },
    { dx: -gap * 1.9, dy: fs * 0.4, anchor: 'end' as const },
    { dx: gap * 1.9, dy: -fs * 1.5, anchor: 'start' as const },
    { dx: -gap * 1.9, dy: -fs * 1.5, anchor: 'end' as const },
    { dx: gap * 2.6, dy: fs * 1.5, anchor: 'start' as const },
    { dx: -gap * 2.6, dy: fs * 1.5, anchor: 'end' as const }
  ]
  for (const it of items) {
    const w = labelWidth(it.label, fs) + 14
    const h = fs * 1.7 + 8
    let pick: (typeof tries)[number] | null = null
    // نقطهٔ خودِ نشانه هم مانع است تا پلاک روی نشانهٔ دیگری نیفتد
    const mark: LabelBox = { x: it.x - 6, y: it.y - 6, w: 12, h: 12 }
    boxes.push(mark)
    for (const t of tries) {
      const x = t.anchor === 'start' ? it.x + t.dx : it.x + t.dx - w
      const y = it.y + t.dy - fs * 0.8 - 4
      // بیرون از کادر نقشه نرو
      if (x < 8 || y < 8 || x + w > W - 8 || y + h > H - 10) continue
      if (!hits({ x, y, w, h })) {
        pick = t
        boxes.push({ x, y, w, h })
        break
      }
    }
    if (!pick) continue // جای بی‌تداخل نبود: نام را نشان نمی‌دهیم، فقط نشانه می‌ماند
    out.push({ ...it, ...pick })
  }
  return out
}

/* ── هندسهٔ آمادهٔ یک نقشه (یک‌بار برای هر spec) ────────────────────────── */

export interface PhaseGeom {
  /** گام اصلی، با عنوان و توضیحش؛ برای پانویس و راهنما */
  phase: MapPhase
  regions: { id: string; d: string; label: string; x: number; y: number }[]
  ghosts: { id: string; d: string }[]
  countries: { id: string; d: string }[]
  arrows: { d: string; tone: Tone; label?: string; lx: number; ly: number; len: number }[]
  pins: { x: number; y: number; label: string; tone: Tone; dx: number; dy: number; anchor: 'start' | 'end' }[]
  camera: { x: number; y: number; k: number }
}

export interface AtlasGeom {
  spec: MapSpec
  palette: typeof PALETTES[keyof typeof PALETTES]
  box: Box
  width: number
  height: number
  land: string
  borders: string
  graticule: string
  graticuleFine: string
  base: { id: string; d: string; label: string; x: number; y: number }[]
  rivers: string
  seas: { label: string; x: number; y: number }[]
  countryNames: { label: string; x: number; y: number }[]
  phases: PhaseGeom[]
  scaleKm: number
}

const memo = new WeakMap<MapSpec, AtlasGeom>()

export function buildAtlas(spec: MapSpec): AtlasGeom {
  const hit = memo.get(spec)
  if (hit) return hit

  const palette = PALETTES[spec.palette ?? 'conquest']
  const box = extentOf(spec)
  const projection = projectionFor(box)
  const path = geoPath(projection)
  const project = (p: [number, number]): [number, number] | null => {
    const q = projection(p)
    return q ? [q[0], q[1]] : null
  }

  const land = path(landFC) ?? ''
  const bordersD = path(borders as any) ?? ''
  const graticule = path(geoGraticule().step([30, 30])() as any) ?? ''
  const graticuleFine = path(geoGraticule().step([10, 10])() as any) ?? ''
  const riversD = rivers
    .map((r) => path({ type: 'LineString', coordinates: r.points } as any))
    .filter(Boolean)
    .join(' ')

  const cap = 1.7

  const phases: PhaseGeom[] = spec.phases.map((phase) => {
    const regionOut: PhaseGeom['regions'] = []
    for (const id of phase.regions ?? []) {
      const d = path(regionFeature(id) as any)
      if (!d) continue
      const pt = regions[id]?.points ?? []
      let sx = 0
      let sy = 0
      for (const p of pt) {
        const q = project(p)
        if (q) { sx += q[0]; sy += q[1] }
      }
      regionOut.push({
        id,
        d,
        label: regions[id]?.short ?? regions[id]?.label ?? id,
        x: pt.length ? sx / pt.length : W / 2,
        y: pt.length ? sy / pt.length : H / 2
      })
    }
    const ghosts = (phase.ghost ?? [])
      .map((id) => ({ id, d: path(regionFeature(id) as any) ?? '' }))
      .filter((g) => !!g.d)
    const countries = (phase.countries ?? [])
      .map((id) => {
        const f = shapeById.get(id)
        return { id, d: f ? path(f) ?? '' : '' }
      })
      .filter((c) => !!c.d)

    const arrows = (phase.arrows ?? []).flatMap((a) => {
      const p0 = project(a.from)
      const p1 = project(a.to)
      if (!p0 || !p1) return []
      const [x0, y0] = p0
      const [x1, y1] = p1
      const dx = x1 - x0
      const dy = y1 - y0
      const len = Math.hypot(dx, dy) || 1
      const bend = (a.bend ?? 0.2) * len
      const cx = (x0 + x1) / 2 - (dy / len) * bend
      const cy = (y0 + y1) / 2 + (dx / len) * bend
      return [{
        d: `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`,
        tone: (a.tone ?? 'gold') as Tone,
        label: a.label,
        lx: (x0 + x1) / 2 + dx * 0.04,
        ly: (y0 + y1) / 2 + dy * 0.04 - 12,
        len
      }]
    })

    const camera = cameraFor(phase, project, cap)
    const fs = 12.5
    const pinItems = (phase.pins ?? []).flatMap((p) => {
      const q = project([p.lon, p.lat])
      return q ? [{ x: q[0], y: q[1], label: p.label, tone: (p.tone ?? 'gold') as Tone }] : []
    })
    // مانع‌ها: پلاک برچسب مسیرها، تا نام شهر روی آن نیفتد
    const arrowBoxes: LabelBox[] = arrows
      .filter((a) => !!a.label)
      .map((a) => ({ x: a.lx - (a.label!.length * 5.6) - 8, y: a.ly - 14, w: a.label!.length * 11.2 + 16, h: 22 }))
    const placed = placeLabels(pinItems, fs, arrowBoxes)
    const pins = placed.map((p) => ({ x: p.x, y: p.y, label: p.label, tone: p.tone, dx: p.dx, dy: p.dy, anchor: p.anchor }))

    return { phase, regions: regionOut, ghosts, countries, arrows, pins, camera }
  })

  const base = (spec.base ?? []).flatMap((id) => {
    const d = path(regionFeature(id) as any)
    if (!d) return []
    const pt = regions[id]?.points ?? []
    let sx = 0
    let sy = 0
    for (const p of pt) {
      const q = project(p)
      if (q) { sx += q[0]; sy += q[1] }
    }
    return [{ id, d, label: regions[id]?.short ?? regions[id]?.label ?? '', x: pt.length ? sx / pt.length : W / 2, y: pt.length ? sy / pt.length : H / 2 }]
  })

  const seasD = seas
    .map((s) => {
      const q = project([s.lon, s.lat])
      return q ? { label: s.label, x: q[0], y: q[1] } : null
    })
    .filter((v): v is { label: string; x: number; y: number } => !!v)

  const countryNames = countryLabels
    .map((c) => {
      const q = project([c.lon, c.lat])
      return q ? { label: c.label, x: q[0], y: q[1] } : null
    })
    .filter((v): v is { label: string; x: number; y: number } => !!v)

  const pxPerDeg = (projection.scale() * Math.PI) / 180
  const centerLat = projection.invert?.([W / 2, H / 2])?.[1] ?? 32
  const kmPerPx = (111.32 * Math.cos((centerLat * Math.PI) / 180)) / pxPerDeg || 1
  const target = 130 * kmPerPx
  const scaleKm = [50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000].reduce(
    (best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best),
    100
  )

  const geom: AtlasGeom = {
    spec,
    palette,
    box,
    width: W,
    height: H,
    land,
    borders: bordersD,
    graticule,
    graticuleFine,
    base,
    rivers: riversD,
    seas: seasD,
    countryNames,
    phases,
    scaleKm
  }
  memo.set(spec, geom)
  return geom
}

export { regions, seas }
