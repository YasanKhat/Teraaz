import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Compass, Minus, Move, Plus, RotateCcw } from 'lucide-react'
import {
  H,
  W,
  TONES,
  buildAtlas,
  labelWidth,
  placeLabels,
  type LabelBox,
  type MapSpec,
  type Tone
} from './engine'
import { cn, fas } from '../../lib/utils'
import { PlanBoard } from './PlanBoard'

/* ────────────────────────────────────────────────────────────────────────
   نمایش نقشه — سبک، روان، و خوانا.
   • همهٔ گام‌ها از پیش ساخته‌اند؛ جابه‌جایی گام فقط شفافیت را عوض می‌کند
   • دوربین یک transform است؛ کشش و زوم بدون بازسازی درخت
   • برچسب‌ها فقط بعد از توقف حرکت بازچینش می‌شوند
   ──────────────────────────────────────────────────────────────────────── */

interface Props {
  spec: MapSpec
  autoPlay?: boolean
  chrome?: boolean
  onDone?: () => void
  initialPhase?: number
}

const dur = (ms: number) => `${ms}ms cubic-bezier(.33,1,.36,1)`

export function AtlasView({ spec, autoPlay, chrome = true, onDone, initialPhase = 0 }: Props) {
  const geom = useMemo(() => buildAtlas(spec), [spec])
  const [i, setI] = useState(initialPhase)
  const [playing, setPlaying] = useState(!!autoPlay)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [grabbing, setGrabbing] = useState(false)
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    setI(initialPhase)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [spec, initialPhase])

  /** شناسهٔ امن برای gradient/clipPath: نام فارسی و فاصله، url(#…) را می‌شکند */
  const uid = useMemo(() => {
    let h = 0
    for (let k = 0; k < spec.title.length; k++) h = (h * 31 + spec.title.charCodeAt(k)) >>> 0
    return `atlas${h.toString(36)}`
  }, [spec.title])

  const step = geom.phases[Math.min(i, geom.phases.length - 1)]
  const phase = step.phase
  const palette = geom.palette

  if (spec.mode === 'plan') {
    return (
      <div className="atlasx">
        {chrome && (
          <div className="atlasx__bar">
            <div className="min-w-0">
              {spec.kicker && <div className="atlasx__kicker">{spec.kicker}</div>}
              <div className="truncate text-[0.92rem] font-bold">{spec.title}</div>
            </div>
            <span className="atlasx__count">{fas(i + 1)} / {fas(geom.phases.length)}</span>
          </div>
        )}
        <PlanBoard spec={spec} phase={phase} />
        <div className="atlasx__caption">
          <div className="atlasx__captionTop">
            <span className="atlasx__step">{fas(i + 1)} / {fas(geom.phases.length)}</span>
            <span className="atlasx__stepTitle">{phase.title}</span>
            <div className="atlasx__nav atlas-ui">
              <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} aria-label="گام قبل"><ChevronRight size={15} /></button>
              <button onClick={() => setI((v) => Math.min(geom.phases.length - 1, v + 1))} disabled={i >= geom.phases.length - 1} aria-label="گام بعد"><ChevronLeft size={15} /></button>
            </div>
          </div>
          <p className="atlasx__captionText">{phase.caption}</p>
        </div>
      </div>
    )
  }

  /* ── دوربین ────────────────────────────────────────────────────────── */
  const camRef = useRef<SVGGElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const user = useRef({ x: 0, y: 0, k: 1 })
  const gesture = useRef(false)
  const idle = useRef<number | null>(null)

  const styleFor = useCallback(
    (u: { x: number; y: number; k: number }) => {
      const c = step.camera
      return `translate(${c.x * u.k + u.x}px, ${c.y * u.k + u.y}px) scale(${c.k * u.k})`
    },
    [phase]
  )

  const paint = () => {
    if (camRef.current) camRef.current.style.transform = styleFor(user.current)
  }

  const commit = useCallback(() => {
    if (idle.current) window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => {
      gesture.current = false
      svgRef.current?.classList.remove('is-gesturing')
      setZoom(user.current.k)
      setPan({ x: user.current.x, y: user.current.y })
    }, 150)
  }, [])

  const begin = () => {
    gesture.current = true
    svgRef.current?.classList.add('is-gesturing')
    if (idle.current) window.clearTimeout(idle.current)
  }

  useEffect(() => {
    user.current = { x: pan.x, y: pan.y, k: zoom }
    if (!gesture.current) paint()
  }, [i, pan, zoom, phase, styleFor])

  const clamp = (u: { x: number; y: number; k: number }) => {
    const k = Math.max(0.85, Math.min(5, u.k))
    const spanX = W * k
    const spanY = H * k
    const x = Math.min(W * 0.45, Math.max(W - spanX - W * 0.45, u.x))
    const y = Math.min(H * 0.45, Math.max(H - spanY - H * 0.45, u.y))
    return { x, y, k }
  }

  const toSvg = (e: { clientX: number; clientY: number }) => {
    const el = svgRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const s = Math.max(r.width / W, r.height / H)
    const ox = (r.width - W * s) / 2
    const oy = (r.height - H * s) / 2
    return { x: (e.clientX - r.left - ox) / s, y: (e.clientY - r.top - oy) / s }
  }

  const zoomAt = (sx: number, sy: number, factor: number) => {
    const u = user.current
    const k = Math.max(0.85, Math.min(5, u.k * factor))
    const f = k / u.k
    user.current = clamp({ k, x: sx - (sx - u.x) * f, y: sy - (sy - u.y) * f })
    begin()
    paint()
    commit()
  }

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = toSvg(e)
      if (!p) return
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec])

  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  /* ── پخش خودکار گام‌ها ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!playing) return
    if (i >= geom.phases.length - 1) {
      setPlaying(false)
      return
    }
    const t = window.setTimeout(() => setI((v) => Math.min(geom.phases.length - 1, v + 1)), 5200)
    return () => window.clearTimeout(t)
  }, [playing, i, geom.phases.length])

  useEffect(() => {
    if (i >= geom.phases.length - 1 && !playing) onDone?.()
  }, [i, playing, geom.phases.length, onDone])

  /* ── برچسب‌ها ──────────────────────────────────────────────────────── */
  const lk = Math.pow(zoom * step.camera.k, -0.62)
  const labelFont = 12.6 * lk
  const regionFont = 14.2 * lk

  const decorate = useMemo(() => {
    return geom.phases.map((ph) => {
      /* پلاک نامِ مسیرها: جای هر پلاک با جست‌وجوی کم‌تداخل انتخاب می‌شود */
      const boxes: LabelBox[] = []
      const arrowBox = (a: (typeof ph.arrows)[number]) => {
        const fs = labelFont * 0.86
        const parts = (a.label ?? '').split('←').map((t) => t.trim())
        const w =
          (parts[0]?.length ?? 0) * fs * 0.62 +
          (parts[1]?.length ?? 0) * fs * 0.62 +
          (parts[1] ? fs * 1.9 : 0) +
          16
        return { w, h: fs * 2.2 }
      }
      const hits = (b: LabelBox) =>
        boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y)
      const arrows = ph.arrows.map((a) => {
        if (!a.label) return a
        const { w, h } = arrowBox(a)
        const baseY = a.ly - h * 0.72
        const tries: [number, number][] = [
          [0, 0],
          [0, -h - 7],
          [0, h + 7],
          [w * 0.34, 0],
          [-w * 0.34, 0],
          [0, -2 * h - 14],
          [0, 2 * h + 14],
          [w * 0.55, -h - 7],
          [-w * 0.55, -h - 7]
        ]
        for (const [ox, oy] of tries) {
          const x = a.lx - w / 2 + ox
          const y = baseY + oy
          if (x < 8 || y < 8 || x + w > W - 8 || y + h > H - 10) continue
          if (!hits({ x, y, w, h })) {
            boxes.push({ x, y, w, h })
            return { ...a, lx: x + w / 2, ly: y + h * 0.72 }
          }
        }
        const first = { x: a.lx - w / 2, y: baseY, w, h }
        boxes.push(first)
        return a
      })
      const arrowBoxes = boxes.slice()
      const pinItems = ph.pins.map((p) => ({ x: p.x, y: p.y, label: p.label, tone: p.tone }))
      const placed = placeLabels(pinItems, labelFont, arrowBoxes)
      const allBoxes: LabelBox[] = [
        ...arrowBoxes,
        ...placed.map((p) => ({
          x: p.anchor === 'start' ? p.x + p.dx : p.x + p.dx - (labelWidth(p.label, labelFont * 0.95) + 10),
          y: p.y + p.dy - labelFont * 0.8 - 4,
          w: labelWidth(p.label, labelFont * 0.95) + 10,
          h: labelFont * 1.7 + 8
        }))
      ]
      const regionLabels = ph.regions
        .map((r) => ({ ...r, fs: regionFont }))
        .filter((r) => {
          const w = labelWidth(r.label, r.fs) + 16
          const h = r.fs * 2 + 10
          const box = { x: r.x - w / 2, y: r.y - h / 2, w, h }
          const hit = allBoxes.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)
          if (hit) return false
          allBoxes.push(box)
          return true
        })
      const seaLabels = geom.seas.filter((s) => {
        const w = labelWidth(s.label, labelFont * 0.82)
        const box = { x: s.x - 12, y: s.y - w / 2, w: 24, h: w }
        if (allBoxes.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)) return false
        allBoxes.push(box)
        return true
      })
      return { placed, regionLabels, seaLabels, arrows, arrowBoxes }
    })
  }, [geom, labelFont, regionFont])

  const active = decorate[Math.min(i, decorate.length - 1)]
  const stepCount = geom.phases.length

  const nav = (d: number) => {
    setPlaying(false)
    setI((v) => Math.max(0, Math.min(stepCount - 1, v + d)))
  }

  const resetView = () => {
    user.current = { x: 0, y: 0, k: 1 }
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="atlasx" style={{ ['--map-main' as string]: palette.main, ['--map-soft' as string]: palette.soft }}>
      {chrome && (
        <div className="atlasx__bar">
          <div className="min-w-0">
            {spec.kicker && <div className="atlasx__kicker">{spec.kicker}</div>}
            <div className="truncate text-[0.92rem] font-bold">{spec.title}</div>
          </div>
          <div className="atlasx__tools atlas-ui">
            <button className="map-btn" onClick={() => { setPlaying(false); setI(0); resetView() }} aria-label="از آغاز" title="از آغاز">
              <RotateCcw size={13} />
            </button>
            <button className="map-btn" onClick={() => zoomAt(W / 2, H / 2, 1.35)} aria-label="بزرگ‌نمایی" title="بزرگ‌نمایی">
              <Plus size={14} />
            </button>
            <button className="map-btn" onClick={() => zoomAt(W / 2, H / 2, 1 / 1.35)} aria-label="کوچک‌نمایی" title="کوچک‌نمایی">
              <Minus size={14} />
            </button>
            <span className="atlasx__count">{fas(i + 1)} / {fas(stepCount)}</span>
          </div>
        </div>
      )}

      <div className="atlasx__frame" data-grabbing={grabbing || undefined}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          className={cn('atlasx__svg', grabbing ? 'is-dragging' : 'is-grabbable')}
          role="img"
          aria-label={`${spec.title} — ${phase.title}`}
          onPointerDown={(e) => {
            if ((e.target as Element)?.closest('.atlas-ui')) return
            ;(e.currentTarget as SVGSVGElement).setPointerCapture?.(e.pointerId)
            drag.current = { x: e.clientX, y: e.clientY, moved: false }
            setGrabbing(true)
            begin()
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d) return
            const dx = e.clientX - d.x
            const dy = e.clientY - d.y
            if (!d.moved && Math.hypot(dx, dy) < 3) return
            d.moved = true
            const r = e.currentTarget.getBoundingClientRect()
            const s = Math.max(r.width / W, r.height / H)
            user.current = clamp({ k: user.current.k, x: user.current.x + dx / s, y: user.current.y + dy / s })
            paint()
            drag.current = { x: e.clientX, y: e.clientY, moved: true }
          }}
          onPointerUp={(e) => {
            const moved = drag.current?.moved
            drag.current = null
            setGrabbing(false)
            ;(e.currentTarget as SVGSVGElement).releasePointerCapture?.(e.pointerId)
            if (moved) commit()
            else { gesture.current = false; svgRef.current?.classList.remove('is-gesturing') }
          }}
          onPointerCancel={() => { drag.current = null; setGrabbing(false); commit() }}
          onDoubleClick={(e) => {
            const p = toSvg(e)
            if (p) zoomAt(p.x, p.y, e.shiftKey ? 1 / 1.6 : 1.6)
          }}
        >
          <defs>
            <linearGradient id={`${uid}-seagrad`} x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0%" stopColor={palette.sea[0]} />
              <stop offset="55%" stopColor={palette.sea[1]} />
              <stop offset="100%" stopColor={palette.sea[2]} />
            </linearGradient>
            <linearGradient id={`${uid}-landgrad`} x1="0.1" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor={palette.land[0]} />
              <stop offset="55%" stopColor={palette.land[1]} />
              <stop offset="100%" stopColor={palette.land[2]} />
            </linearGradient>
            <pattern id={`${uid}-paper`} width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="6" r="0.5" fill="#6b5634" fillOpacity="0.13" />
              <circle cx="17" cy="14" r="0.4" fill="#6b5634" fillOpacity="0.11" />
              <circle cx="24" cy="25" r="0.55" fill="#6b5634" fillOpacity="0.1" />
              <circle cx="10" cy="26" r="0.35" fill="#6b5634" fillOpacity="0.1" />
            </pattern>
            <clipPath id={`${uid}-frameclip`}>
              <rect x="0" y="0" width={W} height={H} rx="8" />
            </clipPath>
            <clipPath id={`${uid}-landclip`}>
              <path d={geom.land} />
            </clipPath>
            <radialGradient id={`${uid}-vig`} cx="50%" cy="45%" r="76%">
              <stop offset="62%" stopColor="#04121d" stopOpacity="0" />
              <stop offset="100%" stopColor="#04121d" stopOpacity="0.24" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill={`url(#${uid}-seagrad)`} />

          <g clipPath={`url(#${uid}-frameclip)`}>
            <g ref={camRef} className="atlasx__cam" style={{ transform: styleFor(user.current) }}>
              <path d={geom.graticuleFine} fill="none" stroke="#8fb4d4" strokeOpacity="0.06" strokeWidth="0.5" />
              <path d={geom.graticule} fill="none" stroke="#a5c6e0" strokeOpacity="0.11" strokeWidth="0.7" />

              {/* خشکی */}
              <path d={geom.land} transform="translate(0,3)" fill="#04182a" fillOpacity="0.45" />
              <path d={geom.land} fill={`url(#${uid}-landgrad)`} stroke="#6d5734" strokeOpacity="0.55" strokeWidth="0.7" />
              <path d={geom.land} fill={`url(#${uid}-paper)`} pointerEvents="none" />

              {/* مرزهای امروز، بسیار کم‌رنگ */}
              <path d={geom.borders} fill="none" stroke="#8a7043" strokeOpacity="0.2" strokeWidth="0.5" strokeDasharray="2 4" />

              {/* رودها */}
              <path d={geom.rivers} fill="none" stroke="#4d7f97" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />

              {/* جغرافیای پایه */}
              {geom.base.map((b) => (
                <g key={`base-${b.id}`} opacity="0.5">
                  <path d={b.d} fill={palette.main} fillOpacity="0.07" />
                  <path d={b.d} fill="none" stroke={palette.main} strokeOpacity="0.28" strokeWidth="0.8" strokeDasharray="5 4" />
                </g>
              ))}

              {/* گام‌ها: همه سوار شده‌اند؛ فقط شفافیت عوض می‌شود */}
              {geom.phases.map((ph, k) => {
                const on = k === i
                const past = k < i
                return (
                  <g key={`ph-${k}`} style={{ opacity: on ? 1 : past ? 0.16 : 0, transition: `opacity ${dur(on ? 620 : 380)}` }}>
                    {ph.ghosts.map((g) => (
                      <path key={`gh-${g.id}`} d={g.d} fill="#8a7550" fillOpacity="0.05" stroke="#7d6a47" strokeOpacity="0.4" strokeWidth="0.9" strokeDasharray="5 4" />
                    ))}
                    <g clipPath={`url(#${uid}-land)`}>
                      {ph.regions.map((r) => (
                        <g key={`rg-${r.id}`}>
                          <path d={r.d} fill={palette.wash} fillOpacity="0.26" />
                          <path d={r.d} fill="none" stroke={palette.main} strokeOpacity="0.3" strokeWidth="3.2" strokeLinejoin="round" />
                          <path d={r.d} fill="none" stroke={palette.line} strokeOpacity="0.85" strokeWidth="1.2" strokeLinejoin="round" />
                        </g>
                      ))}
                    </g>
                    <g clipPath={`url(#${uid}-land)`}>
                      {ph.countries.map((c) => (
                        <g key={`ct-${c.id}`}>
                          <path d={c.d} fill={palette.main} fillOpacity="0.2" />
                          <path d={c.d} fill="none" stroke={palette.main} strokeOpacity="0.7" strokeWidth="1.1" />
                        </g>
                      ))}
                    </g>

                    {/* مسیرها */}
                    {ph.arrows.map((a, n) => (
                      <g key={`ar-${k}-${n}`}>
                        <path d={a.d} fill="none" stroke={TONES[a.tone]} strokeOpacity="0.18" strokeWidth="7" strokeLinecap="round" />
                        <path
                          d={a.d}
                          fill="none"
                          stroke={TONES[a.tone]}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeDasharray="9 6"
                          className={on ? 'atlasx__route' : undefined}
                          style={{ animationDelay: `${n * 120}ms` }}
                        />
                        <circle r="3" fill={TONES[a.tone]}>
                          <animateMotion dur="4.4s" repeatCount="indefinite" path={a.d} begin={`${n * 0.4}s`} />
                        </circle>
                      </g>
                    ))}

                    {/* نشانه‌ها */}
                    {ph.pins.map((p, n) => (
                      <g key={`pn-${k}-${n}`}>
                        <circle cx={p.x} cy={p.y} r="10" fill={TONES[p.tone]} fillOpacity="0.14" />
                        <circle cx={p.x} cy={p.y} r="3.4" fill={TONES[p.tone]} stroke="#0b1b2b" strokeWidth="1.2" />
                      </g>
                    ))}
                  </g>
                )
              })}

              {/* نام‌ها: لایهٔ فعال، جدا از گام‌ها تا هنگام حرکت پنهان شوند */}
              <g pointerEvents="none" className="atlasx__labels">
                {geom.phases.map((ph, k) => {
                  const d = decorate[k]
                  if (!d) return null
                  const on = k === i
                  return (
                    <g key={`lb-${k}`} style={{ opacity: on ? 1 : 0, transition: `opacity ${dur(on ? 520 : 260)}` }}>
                      {d.seaLabels.map((s) => (
                        <text
                          key={`s-${s.label}`}
                          x={s.x}
                          y={s.y}
                          textAnchor="middle"
                          fontSize={labelFont * 0.82}
                          letterSpacing={labelFont * 0.18}
                          fill="#a8cde4"
                          fillOpacity="0.72"
                          fontStyle="italic"
                          transform={`rotate(-42 ${s.x} ${s.y})`}
                          style={{ fontFamily: 'Estedad, sans-serif' }}
                        >
                          {s.label}
                        </text>
                      ))}
                      {d.regionLabels.map((r) => (
                        <text
                          key={`r-${r.id}`}
                          x={r.x}
                          y={r.y}
                          textAnchor="middle"
                          fontSize={r.fs}
                          fontWeight={800}
                          letterSpacing="0.2"
                          fill="#2b1f08"
                          fillOpacity="0.92"
                          stroke="#f8eed6"
                          strokeOpacity="0.7"
                          strokeWidth={2.2 * lk}
                          paintOrder="stroke"
                          style={{ fontFamily: 'Estedad, sans-serif' }}
                        >
                          {r.label}
                        </text>
                      ))}
                      {d.placed.map((p, n) => {
                        const fs = labelFont * 0.95
                        const w = labelWidth(p.label, fs) + 10
                        const h = fs * 1.7 + 8
                        const bx = p.anchor === 'start' ? p.x + p.dx : p.x + p.dx - w
                        const by = p.y + p.dy - fs * 0.8 - 4
                        const ax = p.anchor === 'start' ? bx : bx + w
                        const ay = by + h / 2
                        return (
                          <g key={`pl-${k}-${n}`}>
                            <path
                              d={`M${p.x},${p.y} L${ax},${ay}`}
                              stroke="#c9ab74"
                              strokeOpacity="0.5"
                              strokeWidth={0.9}
                              fill="none"
                            />
                            <circle cx={p.x} cy={p.y} r="2.6" fill="#f6ecd6" fillOpacity="0.85" />
                            <text
                              x={bx + w / 2}
                              y={ay}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={fs}
                              fontWeight={700}
                              fill="#f9efd8"
                              stroke="#071c26"
                              strokeOpacity="0.92"
                              strokeWidth={fs * 0.62}
                              strokeLinejoin="round"
                              paintOrder="stroke"
                              style={{ fontFamily: 'Estedad, sans-serif' }}
                            >
                              {p.label}
                            </text>
                          </g>
                        )
                      })}
                      {d.arrows.map((a, n) => {
                        if (!a.label) return null
                        const parts = a.label.split('←').map((t) => t.trim())
                        const fs = labelFont * 0.86
                        const w = (parts[0]?.length ?? 0) * fs * 0.62 + (parts[1]?.length ?? 0) * fs * 0.62 + (parts[1] ? fs * 1.9 : 0) + 16
                        const h = fs * 2.2
                        return (
                          <g key={`al-${k}-${n}`} className="map-label">
                            <rect x={a.lx - w / 2} y={a.ly - h * 0.72} width={w} height={h} rx={h / 2} fill="#07161d" fillOpacity="0.82" stroke="#c9ab74" strokeOpacity="0.22" strokeWidth="0.6" />
                            {parts[1] ? (
                              <>
                                <text x={a.lx + 9} y={a.ly} textAnchor="start" fontSize={fs} fontWeight={700} fill="#f9efd8" style={{ fontFamily: 'Estedad, sans-serif' }}>{parts[0]}</text>
                                <path d={`M${a.lx - 9},${a.ly - fs * 0.26} L${a.lx + 5},${a.ly - fs * 0.26} M${a.lx - 1},${a.ly - fs * 0.26 - 2.6} L${a.lx + 5},${a.ly - fs * 0.26} L${a.lx - 1},${a.ly - fs * 0.26 + 2.6}`} fill="none" stroke="#e9c069" strokeWidth="1" strokeLinecap="round" />
                                <text x={a.lx - 13} y={a.ly} textAnchor="end" fontSize={fs} fontWeight={700} fill="#f9efd8" style={{ fontFamily: 'Estedad, sans-serif' }}>{parts[1]}</text>
                              </>
                            ) : (
                              <text x={a.lx} y={a.ly} textAnchor="middle" fontSize={fs} fontWeight={700} fill="#f9efd8" style={{ fontFamily: 'Estedad, sans-serif' }}>{parts[0]}</text>
                            )}
                          </g>
                        )
                      })}
                    </g>
                  )
                })}
              </g>

              {/* نام کشورها — کم‌رنگ، فقط برای جهت‌یابی */}
              <g pointerEvents="none" opacity="0.5">
                {geom.countryNames.slice(0, 26).map((c) => (
                  <text key={c.label} x={c.x} y={c.y} textAnchor="middle" fontSize={labelFont * 0.72} fill="#6a5738" style={{ fontFamily: 'Estedad, sans-serif' }}>
                    {c.label}
                  </text>
                ))}
              </g>
            </g>

            <rect x="0.6" y="0.6" width={W - 1.2} height={H - 1.2} rx="8" fill="none" stroke="#c9ab74" strokeOpacity="0.34" pointerEvents="none" />
          </g>

          {/* راهنمای شمال و مقیاس */}
          <g transform={`translate(${W - 52}, ${H - 118})`} opacity="0.82" pointerEvents="none">
            <circle r="21" fill="#071a29" fillOpacity="0.5" stroke="#c9ab74" strokeOpacity="0.4" />
            <path d="M0,-14 L4.6,2 L0,-1.6 L-4.6,2 Z" fill="#e9c069" />
            <path d="M0,14 L4.6,-2 L0,1.6 L-4.6,-2 Z" fill="#8fa6b5" fillOpacity="0.5" />
            <text y="32" textAnchor="middle" fontSize="8.5" fill="#e9c069" style={{ fontFamily: 'Estedad, sans-serif' }}>شمال</text>
          </g>
          <g transform={`translate(26, ${H - 30})`} opacity="0.85" pointerEvents="none">
            <rect x="-10" y="-19" width="176" height="30" rx="7" fill="#06161f" fillOpacity="0.5" />
            <line x1="0" y1="0" x2={130} y2="0" stroke="#e9c069" strokeWidth="1.4" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#e9c069" strokeWidth="1.4" />
            <line x1="65" y1="-3" x2="65" y2="3" stroke="#e9c069" strokeOpacity="0.6" strokeWidth="1" />
            <line x1="130" y1="-4" x2="130" y2="4" stroke="#e9c069" strokeWidth="1.4" />
            <text x="65" y="-8" textAnchor="middle" fontSize="9" fill="#f2e4c4" style={{ fontFamily: 'Estedad, sans-serif' }}>{fas(geom.scaleKm)} کیلومتر</text>
          </g>
        </svg>

        {grabbing && (
          <div className="atlasx__hintflag">
            <Move size={12} /> بکش تا جابه‌جا شود
          </div>
        )}

        {tip && <div className="atlasx__tip">{tip}</div>}
      </div>

      <div className="atlasx__caption">
        <div className="atlasx__captionTop">
          <span className="atlasx__step">{fas(i + 1)} / {fas(stepCount)}</span>
          <span className="atlasx__stepTitle">{phase.title}</span>
          <div className="atlasx__nav atlas-ui">
            <button onClick={() => nav(-1)} disabled={i === 0} aria-label="گام قبل"><ChevronRight size={15} /></button>
            <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'توقف' : 'پخش'} className={cn(playing && 'is-on')}>
              {playing ? '❙❙' : '▶'}
            </button>
            <button onClick={() => nav(1)} disabled={i >= stepCount - 1} aria-label="گام بعد"><ChevronLeft size={15} /></button>
          </div>
        </div>
        <p className="atlasx__captionText">{phase.caption}</p>
        {stepCount > 1 && (
          <div className="atlasx__dots atlas-ui">
            {geom.phases.map((p, k) => (
              <button
                key={`${p.phase.title}-${k}`}
                onClick={() => { setPlaying(false); setI(k); resetView() }}
                className={cn('atlasx__dot', k === i && 'is-on')}
                onMouseEnter={() => setTip(p.phase.title)}
                onMouseLeave={() => setTip(null)}
                aria-label={p.phase.title}
              />
            ))}
          </div>
        )}
      </div>

      {chrome && (
        <div className="atlasx__legend">
          {(phase.regions?.length ?? 0) > 0 && (
            <span><i style={{ background: palette.wash }} /> قلمرو این دوره</span>
          )}
          {(phase.ghost?.length ?? 0) > 0 && (
            <span><i className="dash" style={{ borderColor: '#8a7550' }} /> قلمرو پیشین</span>
          )}
          {(phase.pins?.length ?? 0) > 0 && <span><i className="pin" style={{ background: '#e9c069' }} /> شهر و نقطهٔ کلیدی</span>}
          {(phase.arrows?.length ?? 0) > 0 && <span><i className="line" style={{ background: '#d9785f' }} /> مسیر رویداد</span>}
          <span className="atlasx__hintj"><Compass size={10} /> بکش، اسکرول و دوبار کلیک برای زوم</span>
        </div>
      )}
    </div>
  )
}

export default AtlasView
