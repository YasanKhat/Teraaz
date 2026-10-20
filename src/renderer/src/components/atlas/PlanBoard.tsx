import { H, W, type MapPhase, type MapSpec } from './engine'

/* ────────────────────────────────────────────────────────────────────────
   نقشهٔ شهری — تابلوی ساده و خوانا از یک شهر تاریخی (مثلاً اصفهان صفوی)
   • بلوک‌های بافت با فاصله از میدان و رود
   • محورها و خیابان‌های اصلی با برچسب
   • نشانه‌ها با شماره و کلید
   ──────────────────────────────────────────────────────────────────────── */

const river = (y: number) =>
  `M0,${y} C120,${y - 26} 240,${y + 20} 360,${y - 6} C470,${y - 30} 560,${y + 24} 680,${y + 6} C800,${y - 12} 900,${y + 18} ${W},${y - 4}`

export function PlanBoard({ spec, phase }: { spec: MapSpec; phase: MapPhase }) {
  const pins = phase.planPins ?? []
  const lines = phase.planLines ?? []
  const uid = `plan-${spec.title.replace(/\s/g, '')}`
  const riverY = H * 0.66

  // بافت شهری: بلوک‌های نامنظم اما با فاصله از میدان مرکزی و رود
  const blocks: { x: number; y: number; w: number; h: number }[] = []
  let seed = 17
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  const maidan = { x: W * 0.5, y: H * 0.42, w: 190, h: 96 }
  for (let gy = 0; gy < 11; gy++) {
    for (let gx = 0; gx < 17; gx++) {
      const w = 30 + rnd() * 16
      const h = 20 + rnd() * 12
      const x = 26 + gx * 56 + rnd() * 6
      const y = 30 + gy * 50 + rnd() * 5
      if (x + w > W - 26 || y + h > H - 26) continue
      const inMaidan =
        x + w > maidan.x - maidan.w / 2 - 18 &&
        x < maidan.x + maidan.w / 2 + 18 &&
        y + h > maidan.y - maidan.h / 2 - 14 &&
        y < maidan.y + maidan.h / 2 + 14
      if (inMaidan) continue
      if (y + h > riverY - 26 && y < riverY + 22) continue
      if (rnd() < 0.14) continue
      blocks.push({ x, y, w, h })
    }
  }

  return (
    <div className="atlasx__frame planboard">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="atlasx__svg" role="img" aria-label={`${spec.title} — ${phase.title}`}>
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#152b3c" />
            <stop offset="55%" stopColor="#0f2130" />
            <stop offset="100%" stopColor="#0a1a26" />
          </linearGradient>
          <linearGradient id={`${uid}-river`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2b6a80" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#3d8ba1" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2b6a80" stopOpacity="0.7" />
          </linearGradient>
          <pattern id={`${uid}-grid`} width="56" height="50" patternUnits="userSpaceOnUse">
            <path d="M56,0 L0,0 0,50" fill="none" stroke="#8fb6c8" strokeOpacity="0.05" strokeWidth="0.6" />
          </pattern>
        </defs>

        <rect width={W} height={H} fill={`url(#${uid}-bg)`} />
        <rect width={W} height={H} fill={`url(#${uid}-grid)`} />

        {/* رود */}
        <path d={river(riverY)} fill="none" stroke="#0a1a24" strokeOpacity="0.7" strokeWidth="26" strokeLinecap="round" />
        <path d={river(riverY)} fill="none" stroke={`url(#${uid}-river)`} strokeWidth="17" strokeLinecap="round" />
        <path d={river(riverY - 5)} fill="none" stroke="#a5dbe8" strokeOpacity="0.18" strokeWidth="1.2" strokeLinecap="round" />
        <text x={W - 44} y={riverY - 16} fontSize="10.5" fill="#9fd3e2" fillOpacity="0.7" textAnchor="end" style={{ fontFamily: 'Estedad, sans-serif' }}>
          زاینده‌رود
        </text>

        {/* بافت */}
        {blocks.map((b, k) => (
          <rect key={k} x={b.x} y={b.y} width={b.w} height={b.h} rx="2.5" fill="#d8c9a6" fillOpacity="0.1" stroke="#c9ab74" strokeOpacity="0.16" strokeWidth="0.6" />
        ))}

        {/* میدان مرکزی */}
        <rect
          x={maidan.x - maidan.w / 2}
          y={maidan.y - maidan.h / 2}
          width={maidan.w}
          height={maidan.h}
          rx="8"
          fill="#e9c069"
          fillOpacity="0.13"
          stroke="#e9c069"
          strokeOpacity="0.6"
          strokeWidth="1.4"
        />
        <text x={maidan.x} y={maidan.y + 4} textAnchor="middle" fontSize="12" fontWeight={800} fill="#f6e3ae" style={{ fontFamily: 'Estedad, sans-serif' }}>
          میدان نقش جهان
        </text>

        {/* محورها و خیابان‌ها */}
        {lines.map((l, k) => {
          const x1 = (l.from[0] / 1000) * W
          const y1 = (l.from[1] / 620) * H
          const x2 = (l.to[0] / 1000) * W
          const y2 = (l.to[1] / 620) * H
          const axis = l.kind === 'axis'
          const water = l.kind === 'river'
          return (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={water ? '#3d8ba1' : '#e9c069'} strokeOpacity={water ? 0.5 : 0.16} strokeWidth={axis ? 13 : 7} strokeLinecap="round" />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={water ? '#6fb6c8' : '#e9c069'} strokeOpacity={axis ? 0.85 : 0.5} strokeWidth={axis ? 2.4 : 1.2} strokeLinecap="round" />
              {axis && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f9efd8" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="1 8" />}
              {l.label && (
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle" fontSize="9.5" fontWeight={600} fill="#f4e6c6" stroke="#0a1a26" strokeWidth="3" paintOrder="stroke" style={{ fontFamily: 'Estedad, sans-serif' }}>
                  {l.label}
                </text>
              )}
            </g>
          )
        })}

        {/* نشانه‌ها */}
        {pins.map((p, k) => {
          const x = (p.x / 1000) * W
          const y = (p.y / 620) * H
          const tone = p.tone === 'rose' ? '#d9785f' : p.tone === 'turq' ? '#5cb9ae' : '#e9c069'
          return (
            <g key={k}>
              <circle cx={x} cy={y} r="10" fill={tone} fillOpacity="0.16" />
              <circle cx={x} cy={y} r="4" fill={tone} stroke="#08161f" strokeWidth="1.2" />
              <text x={x} y={y - 12} textAnchor="middle" fontSize="10.5" fontWeight={700} fill="#10220f" stroke="#f8eed6" strokeWidth="3" paintOrder="stroke" style={{ fontFamily: 'Estedad, sans-serif' }}>
                {p.label}
              </text>
            </g>
          )
        })}

        <rect x="0.6" y="0.6" width={W - 1.2} height={H - 1.2} rx="8" fill="none" stroke="#c9ab74" strokeOpacity="0.3" />
      </svg>
    </div>
  )
}

export default PlanBoard
