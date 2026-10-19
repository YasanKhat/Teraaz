import { useEffect, useMemo, useState } from 'react'
import world from 'world-atlas/countries-110m.json'
import { feature } from 'topojson-client'
import { Plus, Minus, RotateCcw, MapPin, X, ArrowLeft, Compass, Route as RouteIcon } from 'lucide-react'
import { cities, markers, routes } from '../data/map'
import { eras, eraById } from '../data/timeline'
import type { MapCity, MapMarker, MapRoute } from '../data/types'
import { lessonById } from '../data/lessons'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'

const W = 1000
const LON0 = 5
const LON1 = 83
const LAT0 = 4
const LAT1 = 57
const RAD = Math.PI / 180

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))
const MY0 = mercY(LAT1)
const MY1 = mercY(LAT0)
const H = (W * (MY1 - MY0)) / ((LON1 - LON0) * RAD)

const project = (lon: number, lat: number): [number, number] => [
  ((lon - LON0) / (LON1 - LON0)) * W,
  ((MY0 - mercY(lat)) / (MY0 - MY1)) * W
]

const regionNames: Record<string, string> = {
  '364': 'ایران',
  '682': 'عربستان',
  '792': 'ترکیه (عثمانی)',
  '818': 'مصر',
  '368': 'عراق',
  '760': 'شام',
  '724': 'اندلس (اسپانیا)',
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
  '376': 'فلسطین',
  '400': 'اردن',
  '422': 'لبنان',
  '887': 'یمن',
  '512': 'عمان',
  '784': 'امارات',
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
  '268': 'گرجستان'
}

function geomPath(geom: any): string {
  if (!geom) return ''
  const ring = (coords: number[][]) =>
    coords
      .map((c, i) => {
        const [x, y] = project(c[0], c[1])
        return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ') + 'Z'
  if (geom.type === 'Polygon') return geom.coordinates.map(ring).join(' ')
  if (geom.type === 'MultiPolygon') return geom.coordinates.flatMap((p: number[][][]) => p.map(ring)).join(' ')
  return ''
}

function curve(points: [number, number][]): string {
  if (points.length < 2) return ''
  const pts = points.map(([lon, lat]) => project(lon, lat))
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1
    const bend = Math.min(60, len * 0.18)
    const cx = mx - (dy / len) * bend
    const cy = my + (dx / len) * bend
    d += ` Q${cx},${cy} ${x1},${y1}`
  }
  return d
}

type Selection = { kind: 'city'; data: MapCity } | { kind: 'marker'; data: MapMarker } | null

export function MapView() {
  const visit = useProgress((s) => s.visit)
  const [activeRoute, setActiveRoute] = useState<string | null>(null)
  const [sel, setSel] = useState<Selection>(null)
  const [zoom, setZoom] = useState(1)
  const [showCities, setShowCities] = useState(true)
  const [showMarkers, setShowMarkers] = useState(true)

  useEffect(() => {
    visit('map')
  }, [visit])

  const countries = useMemo(() => {
    const fc = feature(world as any, (world as any).objects.countries) as any
    return fc.features
      .map((f: any) => ({ id: String(f.id), name: f.properties?.name, d: geomPath(f.geometry) }))
      .filter((f: any) => f.d && f.d.length > 2)
  }, [])

  const highlighted = new Set(['364'])

  const routeColor = (r: MapRoute) => (activeRoute && activeRoute !== r.id ? 'transparent' : r.color)

  return (
    <div className="space-y-5">
      <div className="map-shell relative">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-gold" />
            <span className="text-sm font-bold">اطلس تاریخی</span>
            <span className="text-[0.65rem] text-faint">جهان اسلام و اروپا · سدهٔ ۵ تا ۱۸ م</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="chip" data-active={showCities} onClick={() => setShowCities((v) => !v)}>
              شهرها
            </button>
            <button className="chip" data-active={showMarkers} onClick={() => setShowMarkers((v) => !v)}>
              رویدادها
            </button>
            <span className="mx-1 h-4 w-px bg-line" />
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.3).toFixed(2)))} aria-label="بزرگ‌نمایی">
              <Plus size={15} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom((z) => Math.max(1, +(z - 0.3).toFixed(2)))} aria-label="کوچک‌نمایی">
              <Minus size={15} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(1)} aria-label="بازنشانی">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            role="img"
            aria-label="نقشهٔ تاریخی جهان اسلام و اروپا"
          >
            <defs>
              <radialGradient id="sea" cx="50%" cy="35%" r="75%">
                <stop offset="0%" stopColor="var(--c-lapis)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--c-lapis)" stopOpacity="0.02" />
              </radialGradient>
              <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            <rect width={W} height={H} fill="url(#sea)" />
            <g transform={`translate(${W / 2} ${H / 2}) scale(${zoom}) translate(${-W / 2} ${-H / 2})`}>
              {countries.map((c: any) => (
                <path
                  key={c.id}
                  d={c.d}
                  className="map-country"
                  fill={highlighted.has(c.id) ? 'var(--c-gold)' : 'var(--c-surface2)'}
                  fillOpacity={highlighted.has(c.id) ? 0.22 : 0.55}
                  stroke="var(--c-line)"
                  strokeWidth={0.6}
                >
                  <title>{regionNames[c.id] ?? c.name}</title>
                </path>
              ))}

              {routes.map((r) => {
                const active = !activeRoute || activeRoute === r.id
                return (
                  <path
                    key={r.id}
                    d={curve(r.points)}
                    fill="none"
                    stroke={routeColor(r)}
                    strokeWidth={activeRoute === r.id ? 3 : 1.8}
                    strokeOpacity={active ? 0.9 : 0.15}
                    strokeLinecap="round"
                    strokeDasharray="7 7"
                    className={active && activeRoute === r.id ? 'route-dash' : undefined}
                  />
                )
              })}

              {showCities &&
                cities.map((c) => {
                  const [x, y] = project(c.lon, c.lat)
                  const active = sel?.kind === 'city' && sel.data.id === c.id
                  return (
                    <g
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setSel({ kind: 'city', data: c })}
                      role="button"
                      aria-label={c.name}
                    >
                      <title>{`${c.name} — ${c.note}`}</title>
                      <circle cx={x} cy={y} r={12} fill="transparent" />
                      {active && <circle cx={x} cy={y} r={9} fill="var(--c-gold)" opacity={0.18} />}
                      <circle
                        cx={x}
                        cy={y}
                        r={c.major ? 3.6 : 2.4}
                        fill={active ? 'var(--c-gold)' : 'var(--c-ink)'}
                        fillOpacity={active ? 1 : 0.55}
                        stroke="var(--c-bg)"
                        strokeWidth={1}
                      />
                      {(c.major || zoom > 1.5) && (
                        <text
                          x={x + 6}
                          y={y + 3.5}
                          fontSize={c.major ? 11 : 9}
                          fill="var(--c-ink)"
                          fillOpacity={0.82}
                          style={{ fontFamily: 'Estedad, sans-serif' }}
                        >
                          {c.name}
                        </text>
                      )}
                    </g>
                  )
                })}

              {showMarkers &&
                markers.map((m) => {
                  const [x, y] = project(m.lon, m.lat)
                  const era = eraById(m.era)
                  const active = sel?.kind === 'marker' && sel.data.id === m.id
                  return (
                    <g
                      key={m.id}
                      className="cursor-pointer"
                      onClick={() => setSel({ kind: 'marker', data: m })}
                      role="button"
                      aria-label={m.name}
                    >
                      <title>{`${m.name} — ${m.detail}`}</title>
                      <rect
                        x={x - 4}
                        y={y - 4}
                        width={8}
                        height={8}
                        transform={`rotate(45 ${x} ${y})`}
                        fill={era.color}
                        fillOpacity={active ? 1 : 0.8}
                        stroke="var(--c-bg)"
                        strokeWidth={1}
                      />
                      {active && <circle cx={x} cy={y} r={11} fill={era.color} opacity={0.18} />}
                    </g>
                  )
                })}
            </g>
          </svg>

          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-line bg-bg/70 px-2.5 py-1.5 text-[0.6rem] text-faint backdrop-blur">
            برای جزئیات روی شهرها و نشانه‌ها بزن
          </div>

          {sel && (
            <div className="anim-up absolute inset-x-3 bottom-3 z-10 sm:inset-x-auto sm:left-4 sm:w-80">
              <div className="panel p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="kicker mb-0.5">{sel.kind === 'city' ? 'شهر تاریخی' : sel.data.kind}</div>
                    <h3 className="font-bold">{sel.data.name}</h3>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)} aria-label="بستن">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[0.78rem] leading-7 text-muted">
                  {'note' in sel.data ? sel.data.note : sel.data.detail}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sel.data.lessons.map((l) => {
                    const lesson = lessonById(l)
                    return (
                      <button
                        key={l}
                        className="chip"
                        onClick={() => navigate(`lesson/${l}`)}
                        title={lesson?.title}
                      >
                        درس {fas(l)}
                        <ArrowLeft size={11} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5 text-[0.62rem] text-faint">
          {eras.filter((e) => markers.some((m) => m.era === e.id)).map((e) => (
            <span key={e.id} className="flex items-center gap-1.5">
              <span className="size-2 rotate-45" style={{ background: e.color }} />
              {e.title}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="kicker mb-1">مسیرها</div>
            <h3 className="text-lg font-bold">لایه‌های تاریخی نقشه</h3>
          </div>
          {activeRoute && (
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveRoute(null)}>
              نمایش همه
            </button>
          )}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoute(activeRoute === r.id ? null : r.id)}
              className={cn(
                'card-hover rounded-xl border bg-surface/65 p-3.5 text-right',
                activeRoute === r.id ? 'border-gold/50' : 'border-line'
              )}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold" style={{ color: r.color }}>
                  <RouteIcon size={13} /> {eraById(r.era).title}
                </span>
                <span className="text-[0.6rem] text-faint">{fas(r.points.length)} نقطه</span>
              </div>
              <div className="text-[0.85rem] font-bold">{r.title}</div>
              <p className="mt-1 line-clamp-2 text-[0.68rem] leading-6 text-muted">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="surface flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[0.72rem] text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} className="text-gold" /> شهرهای مهم و میدان‌های نبرد، هر یک به درس مربوط وصل‌اند.
        </span>
        <span className="text-faint">مرزهای امروز، تنها برای جهت‌یابی است؛ مرزهای تاریخی در طول زمان تغییر کرده‌اند.</span>
      </div>
    </div>
  )
}
