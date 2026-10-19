import world from 'world-atlas/countries-110m.json'
import { feature } from 'topojson-client'

/* ── پروجکشن مرکاتور ساده برای منطقهٔ جهان اسلام و اروپا ───────────────── */
export const W = 1000
const LON0 = -12
const LON1 = 92
const LAT0 = 8
const LAT1 = 60
const RAD = Math.PI / 180
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))
const MY0 = mercY(LAT1) // شمالی‌ترین عرض → بالای نقشه
const MY1 = mercY(LAT0) // جنوبی‌ترین عرض → پایین نقشه
const LONSPAN = (LON1 - LON0) * RAD
/** ارتفاع نقشه با همان مقیاس افقی (مرکاتور واقعی) */
export const H = (W * (MY0 - MY1)) / LONSPAN

export const project = (lon: number, lat: number): [number, number] => [
  ((lon - LON0) / (LON1 - LON0)) * W,
  ((MY0 - mercY(lat)) / (MY0 - MY1)) * H
]

export const regionNames: Record<string, string> = {
  '364': 'ایران',
  '682': 'عربستان',
  '792': 'ترکیه',
  '818': 'مصر',
  '368': 'عراق',
  '760': 'سوریه',
  '724': 'اسپانیا',
  '380': 'ایتالیا',
  '250': 'فرانسه',
  '826': 'انگلستان',
  '276': 'آلمان',
  '300': 'یونان',
  '004': 'افغانستان',
  '860': 'ازبکستان',
  '795': 'ترکمنستان',
  '398': 'قزاقستان',
  '586': 'پاکستان',
  '356': 'هند',
  '620': 'پرتغال',
  '400': 'اردن',
  '422': 'لبنان',
  '887': 'یمن',
  '512': 'عمان',
  '634': 'قطر',
  '414': 'کویت',
  '788': 'تونس',
  '504': 'مراکش',
  '012': 'الجزایر',
  '434': 'لیبی',
  '729': 'سودان',
  '643': 'روسیه',
  '031': 'آذربایجان',
  '051': 'ارمنستان',
  '268': 'گرجستان',
  '616': 'لهستان',
  '528': 'هلند',
  '056': 'بلژیک',
  '040': 'اتریش',
  '348': 'مجارستان',
  '203': 'چک',
  '705': 'اسلوونی',
  '191': 'کرواسی'
}

function ring(coords: number[][]): string {
  return (
    coords.map((c, i) => {
      const [x, y] = project(c[0], c[1])
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ') + 'Z'
  )
}

function geomPath(geom: any): string {
  if (!geom) return ''
  if (geom.type === 'Polygon') return geom.coordinates.map(ring).join(' ')
  if (geom.type === 'MultiPolygon') return geom.coordinates.flatMap((p: number[][][]) => p.map(ring)).join(' ')
  return ''
}

export interface CountryShape {
  id: string
  name: string
  d: string
}

let cache: CountryShape[] | null = null
export function countryShapes(): CountryShape[] {
  if (cache) return cache
  const fc = feature(world as any, (world as any).objects.countries) as any
  const used = new Set<string>()
  const shapes: CountryShape[] = fc.features
    .map((f: any, i: number) => {
      const raw = f.id != null ? String(f.id) : ''
      const base = raw || `x-${f.properties?.name ?? i}`
      let id = base
      let n = 2
      while (used.has(id)) id = `${base}-${n++}`
      used.add(id)
      return { id, name: f.properties?.name, d: geomPath(f.geometry) }
    })
    .filter((f: CountryShape) => f.d.length > 2)
  cache = shapes
  return shapes
}

export const shapeById = (id: string): string => countryShapes().find((c) => c.id === id)?.d ?? ''

/* ── پیکره‌های تاریخی (تقریبی) برای نمایش گام‌به‌گام فتوحات ───────────── */
export const regions: Record<string, { label: string; points: [number, number][] }> = {
  hejaz: {
    label: 'حجاز',
    points: [[36.6, 29.4], [39.2, 30.6], [43.2, 29.2], [43.4, 25], [39.6, 20.8], [36.4, 22.4], [34.9, 26.2]]
  },
  sham: {
    label: 'شام',
    points: [[34.6, 36.8], [38.2, 37.6], [42.2, 36.4], [42.1, 32], [38.2, 30.4], [34.9, 31.2]]
  },
  iraq: {
    label: 'عراق',
    points: [[38.6, 37.3], [43.2, 37.4], [46.2, 35.4], [48.7, 33], [48.6, 30], [47, 29.4], [44, 29.9], [40, 31.4]]
  },
  khuzestan: {
    label: 'خوزستان',
    points: [[47.4, 33.1], [50.3, 32.9], [50.5, 29.8], [48.4, 29.7], [47.3, 31]]
  },
  jibal: {
    label: 'جبال و ری',
    points: [[45.8, 37.1], [50.2, 37.6], [54.2, 36.6], [56.2, 34], [56, 31.8], [52, 30.8], [48, 31.8], [45.8, 34]]
  },
  fars: {
    label: 'فارس',
    points: [[50, 31.2], [54.2, 31.2], [55.6, 28], [55, 26.4], [51, 26.9], [49.7, 29.4]]
  },
  kerman: {
    label: 'کرمان و مکران',
    points: [[55, 31.6], [58.2, 32.1], [62.2, 31], [62.4, 25.6], [57, 25.3], [54.4, 27]]
  },
  khurasan: {
    label: 'خراسان',
    points: [[54.6, 37.6], [58.2, 38.6], [61.4, 37.4], [64.2, 37], [66.2, 34.8], [63, 32.8], [59, 31.8], [56, 33], [55, 35]]
  },
  transoxiana: {
    label: 'ماوراءالنهر',
    points: [[61, 42.2], [66, 43.2], [72, 42], [73, 37], [70, 34.8], [66, 34.9], [63, 36], [61, 39]]
  },
  tabaristan: {
    label: 'طبرستان و دیلم',
    points: [[48.6, 37.3], [52.2, 38], [55.2, 37.2], [55, 35.9], [52, 35.7], [49, 36.1]]
  },
  azerbaijan: {
    label: 'آذربایجان',
    points: [[44, 39.7], [48.2, 40.1], [50, 38.9], [49.5, 36.9], [47, 36.4], [44.4, 37.4]]
  },
  egypt: {
    label: 'مصر',
    points: [[24, 31.6], [32.2, 31.6], [35.2, 29], [34.2, 23], [25, 21.8]]
  },
  maghrib: {
    label: 'شمال آفریقا',
    points: [[-10, 35.8], [10, 37.4], [25, 32], [25, 24], [-10, 27]]
  },
  andalus: {
    label: 'اندلس',
    points: [[-9.6, 43.6], [3.4, 42.6], [0.2, 38], [-6, 36], [-9.6, 38.4]]
  },
  anatolia: {
    label: 'آناتولی',
    points: [[26, 41], [36, 42], [44, 40.4], [45, 37.4], [36, 35.8], [28, 36.4]]
  },
  caucasus: {
    label: 'قفقاز',
    points: [[40, 43.6], [46, 43], [50, 41.4], [49, 39.4], [44, 39.6], [40, 41.6]]
  }
}

export const regionPath = (id: string): string => {
  const r = regions[id]
  if (!r) return ''
  return r.points.map(([lon, lat], i) => {
    const [x, y] = project(lon, lat)
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') + 'Z'
}

/** منحنی نرم بین دو نقطه با مقدار انحراف (bend) */
export function arcPath(from: [number, number], to: [number, number], bend = 0.22): string {
  const [x0, y0] = project(from[0], from[1])
  const [x1, y1] = project(to[0], to[1])
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const k = Math.min(70, len * bend)
  const cx = (x0 + x1) / 2 - (dy / len) * k
  const cy = (y0 + y1) / 2 + (dx / len) * k
  return `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
}

export function routePath(points: [number, number][]): string {
  if (points.length < 2) return ''
  const pts = points.map(([lon, lat]) => project(lon, lat))
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1
    const bend = Math.min(26, len * 0.16)
    const cx = mx - (dy / len) * bend
    const cy = my + (dx / len) * bend
    d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  return d
}

/** مرکز تقریبی هر ناحیه برای برچسب‌گذاری روی نقشه */
export function regionCenter(id: string): [number, number] {
  const r = regions[id]
  if (!r) return [0, 0]
  const pts = r.points.map(([lon, lat]) => project(lon, lat))
  const x = pts.reduce((a, p) => a + p[0], 0) / pts.length
  const y = pts.reduce((a, p) => a + p[1], 0) / pts.length
  return [x, y]
}
