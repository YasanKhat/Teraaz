import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import {
  H,
  W,
  arcPath,
  countryShapes,
  project,
  regionCenter,
  regionPath,
  regionNames,
  regions
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
    const ms = reduced ? 5200 : 3600
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
      add(-10, 58)
      add(90, 10)
    }
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const spanLon = Math.max(maxLon - minLon, 28)
    const spanLat = Math.max(maxLat - minLat, 16)
    const cLon = (minLon + maxLon) / 2
    const cLat = (minLat + maxLat) / 2
    const [cx, cy] = project(cLon, cLat)
    const [ax] = project(cLon + spanLon / 2, cLat)
    const [, ay] = project(cLon, cLat + spanLat / 2)
    let w = Math.abs(ax - cx) * 1.35
    let h = Math.abs(ay - cy) * 1.35
    const ratio = 16 / 9
    if (w / h > ratio) h = w / ratio
    else w = h * ratio
    let x = cx - w / 2
    let y = cy - h / 2
    // محدود کردن به گسترهٔ نقشه
    x = Math.max(-40, Math.min(x, W - w + 40))
    y = Math.max(-40, Math.min(y, H - h + 40))
    return { x, y, w, h }
  }, [spec])

  const fs = Math.max(8, Math.min(22, view.w / 58))

  const phase = spec.phases[Math.min(i, spec.phases.length - 1)]
  const accent = ACCENTS[spec.palette ?? 'conquest']
  const uid = useMemo(() => `m${Math.random().toString(36).slice(2, 7)}`, [])

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
        <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} preserveAspectRatio="xMidYMid meet" className="atlas__svg" role="img" aria-label={spec.title}>
          <defs>
            <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#1d3a5e" />
              <stop offset="55%" stopColor="#152c4a" />
              <stop offset="100%" stopColor="#0f2138" />
            </linearGradient>
            <linearGradient id={`${uid}-land`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e9d9b3" />
              <stop offset="55%" stopColor="#ddc89b" />
              <stop offset="100%" stopColor="#cdb384" />
            </linearGradient>
            <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={`${uid}-paper`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="n" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.07" />
              </feComponentTransfer>
              <feComposite in2="SourceGraphic" operator="over" />
            </filter>
            <marker id={`${uid}-head`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L7,4 L0,8 z" fill={accent} />
            </marker>
          </defs>

          <rect x={view.x} y={view.y} width={view.w} height={view.h} fill={`url(#${uid}-sea)`} />
          <g opacity="0.18" stroke="#9fc3e0" strokeWidth="0.5" fill="none">
            {Array.from({ length: 9 }, (_, k) => (
              <path
                key={`w${k}`}
                d={`M${view.x + (k * view.w) / 8} ${view.y + 14} q 12 6 24 0 t 24 0`}
                strokeDasharray="2 6"
              />
            ))}
          </g>

          {/* شبکهٔ طول و عرض جغرافیایی */}
          <g opacity="0.35">
            {Array.from({ length: 9 }, (_, k) => {
              const x = (k + 1) * (W / 10)
              return <line key={`v${k}`} x1={x} y1={0} x2={x} y2={H} stroke="#7f8fae" strokeWidth={0.4} />
            })}
            {Array.from({ length: 5 }, (_, k) => {
              const y = (k + 1) * (H / 6)
              return <line key={`h${k}`} x1={0} y1={y} x2={W} y2={y} stroke="#7f8fae" strokeWidth={0.4} />
            })}
          </g>

          {/* خشکی‌ها — کاغذ کهن روی دریای نیلی */}
          <g>
            {countries.map((c) => (
              <path key={c.id} d={c.d} fill={`url(#${uid}-land)`} stroke="#b59560" strokeWidth={0.55} strokeOpacity={0.85} />
            ))}
          </g>

          {/* مرز ناحیه‌های تاریخی — همیشه محو */}
          <g>
            {Object.keys(regions).map((id) => (
              <path key={`gl-${id}`} d={regionPath(id)} fill="none" stroke="#8a6d3b" strokeOpacity={0.28} strokeWidth={0.8} strokeDasharray="4 4" />
            ))}
          </g>

          {/* گام کنونی: سرزمین‌های افزوده‌شده */}
          <g>
            {Object.keys(regions).map((id) => {
              const active = phase.regions?.includes(id)
              const ghost = phase.ghost?.includes(id)
              if (!active && !ghost) return null
              return (
                <motion.path
                  key={`${id}-${active ? 'on' : 'ghost'}-${i}`}
                  d={regionPath(id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: active ? 1 : 0.55 }}
                  transition={{ duration: 0.7, delay: active ? 0.05 : 0 }}
                  fill={active ? accent : '#7d6a48'}
                  fillOpacity={active ? 0.62 : 0.1}
                  stroke={active ? '#5c4212' : '#7d6a48'}
                  strokeOpacity={active ? 0.9 : 0.45}
                  strokeWidth={active ? 1.4 : 0.8}
                  strokeDasharray={active ? undefined : '3 4'}
                  filter={active && !reduced ? `url(#${uid}-glow)` : undefined}
                />
              )
            })}
          </g>

          <g>
            {countries.filter((c) => phase.countries?.includes(c.id)).map((c) => (
              <path
                key={`hl-${c.id}`}
                d={c.d}
                fill={accent}
                fillOpacity={0.5}
                stroke="#5c4212"
                strokeWidth={0.9}
                style={{ transition: 'fill 0.9s ease, fill-opacity 0.9s ease' }}
              />
            ))}
          </g>

          {/* برچسب ناحیه‌های گام */}
          <g pointerEvents="none">
            {phase.regions?.map((id) => {
              const [rx, ry] = regionCenter(id)
              const label = regions[id]?.label ?? ''
              const half = Math.max(26, (label.length * fs * 0.62) / 2 + 6)
              const x = Math.max(view.x + half, Math.min(view.x + view.w - half, rx))
              const y = Math.max(view.y + 24, Math.min(view.y + view.h - 20, ry))
              return (
                <motion.text
                  key={`label-${id}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontSize={fs * 0.95}
                  fontWeight={800}
                  fill="#2b2113"
                  stroke="#efe0bd"
                  strokeWidth={2.4}
                  paintOrder="stroke"
                  style={{ fontFamily: 'Estedad, sans-serif' }}
                >
                  {regions[id]?.label}
                </motion.text>
              )
            })}
          </g>

          {/* مسیرهای لشکرکشی */}
          <AnimatePresence>
            {phase.arrows?.map((a, k) => {
              const d = arcPath(a.from, a.to, a.bend ?? 0.22)
              const color = TONES[a.tone ?? 'gold']
              const [tx, ty] = project(a.to[0], a.to[1])
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
                    strokeWidth={3}
                    strokeLinecap="round"
                    markerEnd={`url(#${uid}-head)`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduced ? 0 : 1.5, delay: k * 0.16, ease: 'easeInOut' }}
                    filter={reduced ? undefined : `url(#${uid}-glow)`}
                  />
                  {a.label && (
                    <text
                      x={tx + 10}
                      y={ty - 10}
                      fontSize={fs * 0.8}
                      fontWeight={700}
                      fill="#2b2113"
                      stroke="#e6d6b1"
                      strokeWidth={3}
                      paintOrder="stroke"
                      style={{ fontFamily: 'Estedad, sans-serif' }}
                    >
                      {a.label}
                    </text>
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
              return (
                <motion.g key={`${i}-pin-${k}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.25 + k * 0.1 }}>
                  {!reduced && <circle cx={x} cy={y} r={22} fill={color} fillOpacity={0.18} className="atlas__pulse" />}
                  <circle cx={x} cy={y} r={9} fill={color} fillOpacity={0.35} />
                  <circle cx={x} cy={y} r={4} fill="#2b2113" stroke="#f3e6c6" strokeWidth={1.6} />
                  <text
                    x={x + 11}
                    y={y + 4}
                    fontSize={fs * 0.78}
                    fontWeight={700}
                    fill="#2b2113"
                    stroke="#e6d6b1"
                    strokeWidth={3}
                    paintOrder="stroke"
                    style={{ fontFamily: 'Estedad, sans-serif' }}
                  >
                    {p.label}
                  </text>
                </motion.g>
              )
            })}
          </AnimatePresence>

          {/* گلِ نیم‌ساعت و مقیاس */}
          <g transform={`translate(${view.x + view.w - 96} ${view.y + view.h - 76}) scale(${Math.max(0.5, Math.min(1, 420 / view.w))})`} opacity="0.75">
            <circle r="34" fill="none" stroke="#d9c39a" strokeWidth="0.8" />
            <circle r="24" fill="none" stroke="#d9c39a" strokeWidth="0.5" strokeDasharray="2 3" />
            <path d="M0,-34 L7,0 L0,34 L-7,0 Z" fill="#d9c39a" fillOpacity="0.5" />
            <path d="M-34,0 L0,-7 L34,0 L0,7 Z" fill="#d9c39a" fillOpacity="0.3" />
            <text y="-40" textAnchor="middle" fontSize={11} fill="#d9c39a" style={{ fontFamily: 'Estedad, sans-serif' }}>شمال</text>
          </g>
          <g transform={`translate(${view.x + 22} ${view.y + view.h - 26})`} opacity="0.7">
            <line x1="0" y1="0" x2="86" y2="0" stroke="#d9c39a" strokeWidth="1.3" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#d9c39a" strokeWidth="1.3" />
            <line x1="86" y1="-4" x2="86" y2="4" stroke="#d9c39a" strokeWidth="1.3" />
            <text x="43" y="-8" textAnchor="middle" fontSize="9.5" fill="#d9c39a" style={{ fontFamily: 'Estedad, sans-serif' }}>مقیاس تقریبی</text>
          </g>
        </svg>
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
