import { motion } from 'framer-motion'
import { fas } from '../../lib/utils'

export interface MindBranch {
  title: string
  note: string
}

/**
 * نقشهٔ ذهنِ درس — جمع‌بندی تصویری: یک هستهٔ مرکزی و شاخه‌هایی که
 * صحنه‌های درس را با جملهٔ کلیدی‌شان به هم می‌دوزند.
 */
export function MindMap({ core, title, branches }: { core: string; title: string; branches: MindBranch[] }) {
  const W = 1000
  const H = 620
  const cx = W / 2
  const cy = H / 2
  const list = branches.slice(0, 8)
  const perSide = Math.ceil(list.length / 2)
  const rowsY = (n: number, i: number) => {
    const top = 120
    const bottom = H - 120
    if (n === 1) return (top + bottom) / 2
    return top + ((bottom - top) * i) / (n - 1)
  }

  const nodes = list.map((b, i) => {
    const right = i % 2 === 0
    const sideCount = right ? Math.ceil(list.length / 2) : Math.floor(list.length / 2)
    const idx = Math.floor(i / 2)
    const y = rowsY(sideCount, idx)
    const x = right ? W - 210 : 210
    return { ...b, x, y, right, n: i + 1 }
  })

  return (
    <div className="mind">
      <svg viewBox={`0 0 ${W} ${H}`} className="mind__svg" role="img" aria-label={`نقشهٔ ذهن ${title}`}>
        <defs>
          <radialGradient id="mind-core" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--c-gold) 55%, transparent)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--c-gold) 12%, transparent)" />
          </radialGradient>
          <linearGradient id="mind-link" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="color-mix(in oklab, var(--c-gold) 70%, transparent)" />
            <stop offset="100%" stopColor="color-mix(in oklab, var(--c-gold) 20%, transparent)" />
          </linearGradient>
        </defs>

        {nodes.map((n, k) => {
          const x0 = n.right ? cx + 128 : cx - 128
          const y0 = cy
          const x1 = n.right ? n.x - 132 : n.x + 132
          const y1 = n.y
          const mx = (x0 + x1) / 2
          return (
            <motion.path
              key={`l-${k}`}
              d={`M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1}`}
              fill="none"
              stroke="url(#mind-link)"
              strokeWidth="1.6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.08 * k, ease: 'easeInOut' }}
            />
          )
        })}

        <g>
          <circle cx={cx} cy={cy} r="126" fill="none" stroke="color-mix(in oklab, var(--c-gold) 22%, transparent)" strokeDasharray="2 6" />
          <circle cx={cx} cy={cy} r="112" fill="url(#mind-core)" stroke="color-mix(in oklab, var(--c-gold) 55%, transparent)" strokeWidth="1.4" />
          <text x={cx} y={cy - 26} textAnchor="middle" fontSize="12" fill="var(--c-gold)" letterSpacing="1.5" style={{ fontFamily: 'Estedad, sans-serif' }}>
            جانِ درس
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--c-ink)" style={{ fontFamily: 'Estedad, sans-serif' }}>
            {title.length > 26 ? `${title.slice(0, 24)}…` : title}
          </text>
          <text x={cx} y={cy + 40} textAnchor="middle" fontSize="11.5" fill="var(--c-muted)" style={{ fontFamily: 'Estedad, sans-serif' }}>
            {core.length > 46 ? `${core.slice(0, 44)}…` : core}
          </text>
        </g>

        {nodes.map((n, k) => (
          <motion.g
            key={`n-${k}`}
            initial={{ opacity: 0, x: n.right ? 14 : -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.16 + 0.07 * k }}
          >
            <rect
              x={n.x - 128}
              y={n.y - 34}
              width="256"
              height="68"
              rx="14"
              fill="color-mix(in oklab, var(--c-surface2) 88%, transparent)"
              stroke="color-mix(in oklab, var(--c-gold) 26%, var(--c-line))"
            />
            <text x={n.right ? n.x - 112 : n.x + 112} y={n.y - 10} textAnchor={n.right ? 'start' : 'end'} fontSize="12.5" fontWeight="800" fill="var(--c-ink)" style={{ fontFamily: 'Estedad, sans-serif' }}>
              {fas(n.n)}. {n.title.length > 26 ? `${n.title.slice(0, 24)}…` : n.title}
            </text>
            <text x={n.right ? n.x - 112 : n.x + 112} y={n.y + 12} textAnchor={n.right ? 'start' : 'end'} fontSize="10.5" fill="var(--c-muted)" style={{ fontFamily: 'Estedad, sans-serif' }}>
              {n.note.length > 44 ? `${n.note.slice(0, 42)}…` : n.note}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  )
}
