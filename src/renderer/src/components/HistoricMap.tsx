import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import {
  H,
  W,
  arcPath,
  countryLabels,
  countryShapes,
  project,
  regionCenter,
  regionPath,
  regions,
  rivers,
  seas
} from '../lib/geo'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'

export interface MapPhase {
  title: string
  caption: string
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
  phases: MapPhase[]
}

const ACCENTS: Record<string, string> = {
  conquest: '#d8a840',
  steppe: '#c2553f',
  sea: '#3f9c95',
  europe: '#5b7fc7'
}

const TONES: Record<string, string> = {
  gold: '#e0b453',
  rose: '#cf6a52',
  turq: '#4aa8a0'
}

/** عرض تقریبی متن فارسی بر حسب اندازهٔ قلم (واحد SVG) */
const textW = (s: string, fs: number) => Math.max(18, s.length * fs * 0.56)

function Chip({
  x,
  y,
  text,
  fs,
  fill = 'rgba(12,20,34,0.82)',
  color = '#f5e9cc',
  stroke = 'rgba(224,180,83,0.45)',
  anchor = 'start',
  weight = 700
}: {
  x: number
  y: number
  text: string
  fs: number
  fill?: string
  color?: string
  stroke?: string
  anchor?: 'start' | 'middle' | 'end'
  weight?: number
}) {
  const w = textW(text, fs) + fs * 0.9
  const h = fs * 1.75
  const rx = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return (
    <g>
      <rect x={rx} y={y - h + fs * 0.32} width={w} height={h} rx={fs * 0.5} fill={fill} stroke={stroke} strokeWidth={0.7} />
      <text
        x={rx + w / 2}
        y={y}
        textAnchor="middle"
        fontSize={fs}
        fontWeight={weight}
        fill={color}
        style={{ fontFamily: 'Estedad, sans-serif' }}
      >
        {text}
      </text>
    </g>
  )
}

export function HistoricMap({ spec, autoplay = false }: { spec: MapSpec; autoplay?: boolean }) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(autoplay)
  const visit = useProgress((s) => s.visit)
  const countries = useMemo(() => countryShapes(), [])
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  useEffect(() => {
    visit('map')
  }, [visit])

  useEffect(() => {
    if (autoplay) {
      setI(0)
      setPlaying(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, spec])

  useEffect(() => {
    if (!playing) return
    const ms = reduced ? 5200 : 3800
    const t = window.setInterval(() => {
      setI((v) => {
        if (v >= spec.phases.length - 1) {
          setPlaying(false)
          return v
        }
        return v + 1
      })
    }, ms)
    return () => window.clearInterval(t)
  }, [playing, spec.phases.length, reduced])

  /* گسترهٔ نقشه: کل گام‌ها + حاشیه؛ تا نقشه بی‌جهت نلرزد */
  const view = useMemo(() => {
    const lons: number[] = []
    const lats: number[] = []
    const add = (lon: number, lat: number) => {
      lons.push(lon)
      lats.push(lat)
    }
    spec.phases.forEach((p) => {
      p.regions?.forEach((id) => regions[id]?.points.forEach(([lon, lat]) => add(lon, lat)))
      p.ghost?.forEach((id) => regions[id]?.points.forEach(([lon, lat]) => add(lon, lat)))
      p.arrows?.forEach((a) => {
        add(a.from[0], a.from[1])
        add(a.to[0], a.to[1])
      })
      p.pins?.forEach((pin) => add(pin.lon, pin.lat))
    })
    if (lons.length < 2) {
      add(30, 50)
      add(70, 20)
    }
    let minLon = Math.min(...lons)
    let maxLon = Math.max(...lons)
    let minLat = Math.min(...lats)
    let maxLat = Math.max(...lats)
    // حاشیهٔ جغرافیایی: همیشه کمی از همسایگان دیده شود
    const padLon = Math.max(4, (maxLon - minLon) * 0.16)
    const padLat = Math.max(3, (maxLat - minLat) * 0.18)
    minLon -= padLon
    maxLon += padLon
    minLat -= padLat
    maxLat += padLat
    const spanLon = Math.max(maxLon - minLon, 34)
    const spanLat = Math.max(maxLat - minLat, 20)
    const cLon = (minLon + maxLon) / 2
    const cLat = (minLat + maxLat) / 2
    const [cx, cy] = project(cLon, cLat)
    const [ax] = project(cLon + spanLon / 2, cLat)
    const [, ay] = project(cLon, cLat + spanLat / 2)
    let w = Math.abs(ax - cx) * 2
    let h = Math.abs(ay - cy) * 2
    const ratio = 16 / 10
    if (w / h > ratio) h = w / ratio
    else w = h * ratio
    let x = cx - w / 2
    let y = cy - h / 2
    x = Math.max(-40, Math.min(x, W - w + 40))
    y = Math.max(-40, Math.min(y, H - h + 40))
    return { x, y, w, h }
  }, [spec])

  const fs = Math.max(7.5, Math.min(19, view.w / 62))
  const phase = spec.phases[Math.min(i, spec.phases.length - 1)]
  const accent = ACCENTS[spec.palette ?? 'conquest']
  const uid = useMemo(() => `m${Math.random().toString(36).slice(2, 7)}`, [])
  const inView = (lon: number, lat: number) => {
    const [x, y] = project(lon, lat)
    return x > view.x + 20 && x < view.x + view.w - 20 && y > view.y + 20 && y < view.y + view.h - 20
  }

  const allLand = useMemo(() => countries.map((c) => c.d).join(' '), [countries])

  return (
    <div className="atlas">
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

      <div className="atlas__frame">
        <svg
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid slice"
          className="atlas__svg"
          role="img"
          aria-label={`${spec.title} — ${phase.title}`}
        >
          <defs>
            <radialGradient id={`${uid}-sea`} cx="45%" cy="35%" r="85%">
              <stop offset="0%" stopColor="#17324f" />
              <stop offset="55%" stopColor="#112842" />
              <stop offset="100%" stopColor="#0a1a2c" />
            </radialGradient>
            <linearGradient id={`${uid}-land`} x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#efe4c9" />
              <stop offset="60%" stopColor="#e5d7b7" />
              <stop offset="100%" stopColor="#d8c8a3" />
            </linearGradient>
            <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id={`${uid}-hatch`} width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="7" stroke={accent} strokeWidth="1.5" strokeOpacity="0.35" />
            </pattern>
            <clipPath id={`${uid}-landclip`}>
              <path d={allLand} />
            </clipPath>
            <marker id={`${uid}-head`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L8,4.5 L0,9 z" fill={accent} />
            </marker>
          </defs>

          {/* دریا */}
          <rect x={view.x} y={view.y} width={view.w} height={view.h} fill={`url(#${uid}-sea)`} />

          {/* شبکهٔ مختصات */}
          <g opacity="0.16">
            {Array.from({ length: 13 }, (_, k) => {
              const x = (k + 1) * (W / 14)
              return <line key={`v${k}`} x1={x} y1={0} x2={x} y2={H} stroke="#8fb4d4" strokeWidth={0.4} />
            })}
            {Array.from({ length: 9 }, (_, k) => {
              const y = (k + 1) * (H / 10)
              return <line key={`h${k}`} x1={0} y1={y} x2={W} y2={y} stroke="#8fb4d4" strokeWidth={0.4} />
            })}
          </g>

          {/* خشکی */}
          <g>
            {countries.map((c) => (
              <path key={c.id} d={c.d} fill={`url(#${uid}-land)`} stroke="#a98d5e" strokeWidth={0.45} strokeOpacity={0.7} />
            ))}
          </g>

          {/* سایهٔ ساحل */}
          <g clipPath={`url(#${uid}-landclip)`} pointerEvents="none" opacity="0.16">
            <path d={allLand} fill="none" stroke="#6d5a37" strokeWidth={1.1} />
          </g>

          {/* نام کشورها (با پرهیز از هم‌پوشانی) */}
          <g pointerEvents="none">
            {(() => {
              const boxes: { x: number; y: number; w: number; h: number }[] = []
              const placed: { label: string; x: number; y: number; fs: number }[] = []
              for (const c of countryLabels) {
                if (!inView(c.lon, c.lat)) continue
                const [x, y] = project(c.lon, c.lat)
                const size = fs * 0.72
                const w = textW(c.label, size) * 1.06
                const h = size * 1.5
                const box = { x: x - w / 2, y: y - h / 2, w, h }
                const hits = boxes.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)
                if (hits) continue
                boxes.push(box)
                placed.push({ label: c.label, x, y, fs: size })
              }
              return placed.map((c) => (
                <text
                  key={c.label}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  fontSize={c.fs}
                  letterSpacing={c.fs * 0.1}
                  fill="#6a5734"
                  fillOpacity="0.55"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >
                  {c.label}
                </text>
              ))
            })()}
          </g>

          {/* رودها */}
          <g clipPath={`url(#${uid}-landclip)`} pointerEvents="none">
            {rivers.map((r) => {
              const d = r.points.map(([lon, lat], k) => {
                const [x, y] = project(lon, lat)
                return `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
              }).join(' ')
              return <path key={r.name} d={d} fill="none" stroke="#4b7f96" strokeWidth={Math.max(0.8, view.w / 620)} strokeOpacity="0.6" strokeLinecap="round" />
            })}
          </g>

          {/* نام دریاها */}
          <g pointerEvents="none">
            {seas.filter((s) => inView(s.lon, s.lat)).map((s) => {
              const [x, y] = project(s.lon, s.lat)
              return (
                <text
                  key={s.label}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontSize={fs * 0.66}
                  letterSpacing={fs * 0.18}
                  fill="#8fb6d8"
                  fillOpacity="0.7"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >
                  {s.label}
                </text>
              )
            })}
          </g>

          {/* قلمرو پیشین (کمرنگ) */}
          <g clipPath={`url(#${uid}-landclip)`}>
            {Object.keys(regions).map((id) => {
              if (!phase.ghost?.includes(id)) return null
              return (
                <motion.path
                  key={`g-${id}-${i}`}
                  d={regionPath(id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 0.6 }}
                  fill="#7a6a4a"
                  fillOpacity={0.1}
                  stroke="#8a7550"
                  strokeOpacity={0.55}
                  strokeWidth={0.9}
                  strokeDasharray="4 4"
                />
              )
            })}
          </g>

          {/* قلمرو این گام */}
          <g clipPath={`url(#${uid}-landclip)`}>
            {Object.keys(regions).map((id) => {
              if (!phase.regions?.includes(id)) return null
              return (
                <motion.g
                  key={`r-${id}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.55 }}
                >
                  <path d={regionPath(id)} fill={accent} fillOpacity={0.34} stroke={accent} strokeOpacity={0.95} strokeWidth={Math.max(1, view.w / 520)} />
                  <path d={regionPath(id)} fill={`url(#${uid}-hatch)`} />
                </motion.g>
              )
            })}
          </g>

          {/* کشورهای افزوده‌شده */}
          <g>
            {countries
              .filter((c) => phase.countries?.includes(c.id))
              .map((c) => (
                <path key={`hl-${c.id}`} d={c.d} fill={accent} fillOpacity={0.42} stroke={accent} strokeOpacity={0.8} strokeWidth={0.9} />
              ))}
          </g>

          {/* برچسب ناحیه‌های این گام */}
          <g pointerEvents="none">
            {(() => {
              const boxes: { x: number; y: number; w: number; h: number }[] = []
              phase.pins?.forEach((p) => {
                const [px, py] = project(p.lon, p.lat)
                boxes.push({ x: px - fs * 1.2, y: py - fs * 1.2, w: fs * 5.6, h: fs * 2.4 })
              })
              const out: { id: string; x: number; y: number; label: string }[] = []
              for (const id of phase.regions ?? []) {
                if (!regions[id]) continue
                const [rx, ry] = regionCenter(id)
                const label = regions[id].short ?? regions[id].label
                const w = textW(label, fs) + fs * 0.9
                const h = fs * 1.75
                let x = Math.max(view.x + w / 2, Math.min(view.x + view.w - w / 2, rx))
                let y = Math.max(view.y + fs * 2, Math.min(view.y + view.h - fs * 1.4, ry))
                const box = { x: x - w / 2, y: y - h * 0.7, w, h }
                const hits = (b: typeof box) => boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y)
                let tries = 0
                while (hits(box) && tries < 5) {
                  y -= fs * 1.9
                  box.y -= fs * 1.9
                  tries++
                }
                boxes.push(box)
                out.push({ id, x, y, label })
              }
              return out.map((o) => (
                <motion.g key={`label-${o.id}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                  <Chip x={o.x} y={o.y} text={o.label} fs={fs * 0.92} fill="rgba(14,22,36,0.8)" color="#f7ecd2" stroke="rgba(224,180,83,0.5)" anchor="middle" />
                </motion.g>
              ))
            })()}
          </g>

          {/* مسیرها */}
          <AnimatePresence>
            {phase.arrows?.map((a, k) => {
              const d = arcPath(a.from, a.to, a.bend ?? 0.2)
              const color = TONES[a.tone ?? 'gold']
              const [mx, my] = (() => {
                const [x0, y0] = project(a.from[0], a.from[1])
                const [x1, y1] = project(a.to[0], a.to[1])
                const bend = Math.min(70, Math.hypot(x1 - x0, y1 - y0) * (a.bend ?? 0.2))
                const len = Math.hypot(x1 - x0, y1 - y0) || 1
                return [(x0 + x1) / 2 - ((y1 - y0) / len) * bend, (y0 + y1) / 2 + ((x1 - x0) / len) * bend]
              })()
              return (
                <motion.g
                  key={`${i}-${k}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: k * 0.16 }}
                >
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={Math.max(2, view.w / 300)}
                    strokeLinecap="round"
                    strokeDasharray="1 0"
                    markerEnd={`url(#${uid}-head)`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduced ? 0 : 1.4, delay: k * 0.16, ease: 'easeInOut' }}
                    filter={reduced ? undefined : `url(#${uid}-glow)`}
                  />
                  {a.label && phase.arrows!.findIndex((x) => x.label === a.label) === k && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + k * 0.16 }}>
                      <Chip x={mx} y={my - fs * 0.4} text={a.label!} fs={fs * 0.86} fill="rgba(15,24,40,0.9)" color="#ffeec4" stroke="rgba(224,180,83,0.6)" anchor="middle" />
                    </motion.g>
                  )}
                </motion.g>
              )
            })}
          </AnimatePresence>

          {/* نشانه‌ها */}
          <AnimatePresence>
            {phase.pins?.map((p, k) => {
              const [x, y] = project(p.lon, p.lat)
              const color = TONES[p.tone ?? 'gold']
              const flip = x > view.x + view.w * 0.62
              const lx = flip ? x - fs * 1.9 : x + fs * 1.9
              return (
                <motion.g key={`${i}-pin-${k}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.25 + k * 0.1 }}>
                  {!reduced && <circle cx={x} cy={y} r={fs * 2.4} fill={color} fillOpacity={0.15} className="atlas__pulse" />}
                  <circle cx={x} cy={y} r={fs * 0.95} fill={color} fillOpacity={0.32} />
                  <circle cx={x} cy={y} r={fs * 0.42} fill="#20180d" stroke="#fbf1d6" strokeWidth={Math.max(0.8, fs * 0.14)} />
                  <line x1={x} y1={y} x2={lx} y2={y} stroke="rgba(240,224,190,0.55)" strokeWidth={0.8} />
                  <Chip x={lx} y={y + fs * 0.32} text={p.label} fs={fs * 0.86} anchor={flip ? 'end' : 'start'} />
                </motion.g>
              )
            })}
          </AnimatePresence>

          {/* گلِ نیم‌ساعت */}
          <g
            transform={`translate(${view.x + view.w - view.w * 0.075} ${view.y + view.h - view.w * 0.085}) scale(${(view.w * 0.00042).toFixed(4)})`}
            opacity="0.6"
            pointerEvents="none"
          >
            <circle r="40" fill="none" stroke="#d9c39a" strokeWidth="1.2" />
            <circle r="28" fill="none" stroke="#d9c39a" strokeWidth="0.8" strokeDasharray="2 4" />
            <path d="M0,-40 L8,0 L0,40 L-8,0 Z" fill="#d9c39a" fillOpacity="0.4" />
            <path d="M-40,0 L0,-8 L40,0 L0,8 Z" fill="#d9c39a" fillOpacity="0.22" />
            <text y="-50" textAnchor="middle" fontSize="17" fill="#d9c39a" style={{ fontFamily: 'Estedad, sans-serif' }}>شمال</text>
          </g>

          {/* پانویس: گام */}
          <g pointerEvents="none">
            {(() => {
              const badgeText = `گام ${fas(i + 1)} از ${fas(spec.phases.length)}`
              const bw = textW(badgeText, fs * 0.72) + fs * 1.8
              const bh = fs * 1.8
              const bx = view.x + fs * 1.4
              const by = view.y + view.h - fs * 2.9
              return (
                <>
                  <rect x={bx} y={by} width={bw} height={bh} rx={bh / 2} fill="rgba(9,17,29,0.78)" stroke="rgba(217,195,154,0.26)" strokeWidth={0.7} />
                  <text
                    x={bx + bw / 2}
                    y={by + bh * 0.69}
                    textAnchor="middle"
                    fontSize={fs * 0.72}
                    fill="#d9c39a"
                    style={{ fontFamily: 'Estedad, sans-serif' }}
                  >
                    {badgeText}
                  </text>
                </>
              )
            })()}
          </g>

          {/* وینیت */}
          <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="none" stroke="rgba(8,14,24,0.55)" strokeWidth={view.w / 40} pointerEvents="none" />
        </svg>

        <div className="atlas__legend">
          <span><i style={{ background: accent }} /> قلمرو این گام</span>
          <span><i className="dash" /> قلمرو پیشین</span>
          <span><i className="pin" /> شهر یا نقطهٔ کلیدی</span>
        </div>
      </div>

      <div className="atlas__caption">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className="atlas__step" style={{ background: accent }}>{fas(i + 1)}</span>
              <div className="text-[0.9rem] font-bold">{phase.title}</div>
            </div>
            <p className="mt-1.5 text-[0.78rem] leading-7 text-muted">{phase.caption}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="atlas__controls">
        <button className="map-btn" disabled={i === 0} onClick={() => { setPlaying(false); setI((v) => Math.max(0, v - 1)) }} aria-label="گام قبل">
          <ArrowRight size={15} />
        </button>
        <div className="flex flex-1 items-center gap-1.5">
          {spec.phases.map((p, k) => (
            <button
              key={k}
              onClick={() => { setPlaying(false); setI(k) }}
              aria-label={p.title}
              title={p.title}
              className={cn('h-1.5 flex-1 rounded-full transition-all duration-500', k <= i ? 'opacity-100' : 'opacity-25')}
              style={{ background: k === i ? accent : 'var(--c-line)' }}
            />
          ))}
        </div>
        <button className="map-btn" disabled={i === spec.phases.length - 1} onClick={() => { setPlaying(false); setI((v) => Math.min(spec.phases.length - 1, v + 1)) }} aria-label="گام بعد">
          <ArrowLeft size={15} />
        </button>
      </div>
    </div>
  )
}
