import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, CircleHelp, Eye, Lightbulb, Quote, ScrollText, Sparkles, TriangleAlert, X } from 'lucide-react'
import type { Block, Section } from '../../data/types'
import type { Panel } from '../../data/plans/types'
import { figureById } from '../../data/figures'
import { art } from '../../art'
import { cn, fas } from '../../lib/utils'
import { useProgress } from '../../store/useProgress'

const Motion = motion.div

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <Motion
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Motion>
  )
}

/* ── بلوک‌های متن درس‌نامه ─────────────────────────────────────── */
export function Blocks({ section, accent }: { section: Section; accent: string }) {
  return (
    <div className="space-y-4">
      {section.blocks.map((b, i) => (
        <BlockView key={i} block={b} accent={accent} />
      ))}
    </div>
  )
}

function BlockView({ block, accent }: { block: Block; accent: string }) {
  switch (block.t) {
    case 'p':
      return <p className="lesson-prose">{block.text}</p>
    case 'bullets':
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[0.95rem] leading-8 text-muted">
              <span className="mt-3.5 size-1.5 shrink-0 rotate-45 rounded-[1px]" style={{ background: accent }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'tip':
    case 'warn':
      return (
        <div className={cn('scene-note', block.t === 'warn' && 'scene-note--warn')}>
          <div className="mb-1 flex items-center gap-1.5 text-[0.8rem] font-bold">
            {block.t === 'warn' ? <TriangleAlert size={13} className="text-rose" /> : <Lightbulb size={13} className="text-gold" />}
            {block.title ?? (block.t === 'warn' ? 'دقت کن' : 'نکته')}
          </div>
          <p className="text-[0.9rem] leading-8 text-muted">{block.text}</p>
        </div>
      )
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface/60">
          <table className="tbl">
            <thead>
              <tr>{block.head.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j} className={j === 0 ? 'font-semibold text-ink' : undefined}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && <div className="border-t border-line px-3 py-2 text-[0.65rem] text-faint">{block.caption}</div>}
        </div>
      )
    case 'quote':
      return (
        <blockquote className="scene-quote">
          {block.text}
          {block.source && <footer className="mt-2 text-[0.68rem] text-faint">— {block.source}</footer>}
        </blockquote>
      )
    case 'cards':
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {block.items.map((item, i) => (
            <div key={`${item.title}-${i}`} className="scene-mini">
              <div className="mb-1 text-[0.85rem] font-bold" style={{ color: accent }}>{item.title}</div>
              <p className="text-[0.82rem] leading-7 text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      )
    case 'steps':
      return (
        <div className="relative space-y-3 pe-6">
          <div className="absolute inset-y-2 end-[9px] w-px bg-line" />
          {block.items.map((item, i) => (
            <div key={`${item.title}-${i}`} className="relative">
              <span className="absolute -end-[23px] top-1 grid size-[18px] place-items-center rounded-full border text-[0.55rem] font-bold" style={{ borderColor: accent, color: accent, background: 'var(--c-bg)' }}>
                {fas(i + 1)}
              </span>
              <div className="scene-mini">
                <div className="text-[0.85rem] font-bold">{item.title}</div>
                <p className="mt-1 text-[0.8rem] leading-7 text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

/* ── پنل‌های تجربه ─────────────────────────────────────────────── */
export function PanelView({ panel, accent }: { panel: Panel; accent: string }) {
  switch (panel.kind) {
    case 'read':
      return (
        <div className="space-y-4">
          {panel.lead && <p className="scene-lead">{panel.lead}</p>}
          {panel.text && <p className="lesson-prose">{panel.text}</p>}
          {panel.bullets && (
            <ul className="space-y-2">
              {panel.bullets.map((b, i) => (
                <li key={i} className="flex gap-2.5 text-[0.92rem] leading-8 text-muted">
                  <span className="mt-3.5 size-1.5 shrink-0 rotate-45 rounded-[1px]" style={{ background: accent }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {panel.steps && (
            <div className="grid gap-2 sm:grid-cols-2">
              {panel.steps.map((s, i) => (
                <div key={`${s.title}-${i}`} className="scene-mini">
                  <div className="mb-1 flex items-center gap-2 text-[0.82rem] font-bold" style={{ color: accent }}>
                    <span className="grid size-5 place-items-center rounded-md bg-gold/10 text-[0.6rem]">{fas(i + 1)}</span>
                    {s.title}
                  </div>
                  <p className="text-[0.8rem] leading-7 text-muted">{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )

    case 'figures':
      return (
        <div>
          {panel.heading && <div className="kicker mb-2">{panel.heading}</div>}
          <div className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-3', panel.ids.length >= 4 && 'figure-grid--dense')}>
            {panel.ids.map((id, i) => {
              const f = figureById(id)
              if (!f) return null
              return (
                <figure key={`${id}-${i}`} className="figure-card">
                  <span className="figure-card__mono" style={{ color: f.accent, borderColor: `color-mix(in oklab, ${f.accent} 40%, transparent)`, background: `color-mix(in oklab, ${f.accent} 10%, transparent)` }}>
                    {f.name.replace(/^(حضرت |امام |خواجه |شیخ |ابن |ابو |علامه |سلطان )/, '').slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[0.86rem] font-bold">{f.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[0.68rem] leading-5 text-muted">{f.title}</div>
                    <div className="mt-1 text-[0.6rem] text-faint">{f.span}</div>
                  </div>
                  <p className="col-span-2 mt-2 border-t border-line pt-2 text-[0.68rem] leading-6 text-muted">{f.note}</p>
                </figure>
              )
            })}
          </div>
        </div>
      )

    case 'image':
      return (
        <figure className="scene-figure">
          <img src={art[panel.art]} alt={panel.caption ?? ''} loading="lazy" />
          <div className="scene-figure__veil" />
          {panel.caption && <figcaption>{panel.caption}</figcaption>}
        </figure>
      )

    case 'compare':
      return (
        <div className="compare">
          <div className="compare__title">{panel.title}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[panel.left, panel.right].map((side, i) => (
              <div key={side.label} className={cn('compare__side', i === 0 ? 'compare__side--a' : 'compare__side--b')}>
                <div className="compare__label">{side.label}</div>
                <ul className="space-y-1.5">
                  {side.items.map((it, k) => (
                    <li key={`${it}-${k}`} className="flex gap-2 text-[0.8rem] leading-6 text-muted">
                      <span className={cn('mt-2 size-1 shrink-0 rounded-full', i === 0 ? 'bg-turq' : 'bg-rose')} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {panel.verdict && (
            <div className="mt-2 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2 text-[0.76rem] leading-7 text-muted">
              <span className="me-1 font-bold text-gold">جمع‌بندی:</span>
              {panel.verdict}
            </div>
          )}
        </div>
      )

    case 'mnemonic':
      return (
        <div className="mnemonic">
          <div className="mnemonic__glow" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2 text-[0.66rem] tracking-widest text-gold">
              <Sparkles size={13} /> حافظه‌یار
            </div>
            <div className="text-[1rem] font-bold text-gold">{panel.title}</div>
            <p className="mt-1.5 text-[0.86rem] leading-8 text-muted">{panel.text}</p>
            {panel.hook && <div className="mt-2 inline-block rounded-md bg-bg/60 px-2 py-1 font-mono text-[0.72rem] text-ink/85" dir="ltr">{panel.hook}</div>}
          </div>
        </div>
      )

    case 'check':
      return <CheckCard panel={panel} />

    case 'recipe':
      return (
        <div className="recipe">
          <div className="mb-1 flex items-center gap-2 text-[0.8rem] font-bold">
            <ScrollText size={14} className="text-gold" /> {panel.title}
          </div>
          {panel.intro && <p className="mb-2 text-[0.76rem] leading-7 text-muted">{panel.intro}</p>}
          <div className="space-y-1.5">
            {panel.rows.map((r, i) => (
              <details key={`${r.q}-${i}`} className="recipe__row group">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[0.78rem] font-medium">
                  <span className="grid size-5 shrink-0 place-items-center rounded-md border border-gold/30 text-[0.55rem] text-gold">؟</span>
                  <span className="flex-1">{r.q}</span>
                  <ChevronDown size={13} className="text-faint transition group-open:rotate-180" />
                </summary>
                <p className="mt-1.5 border-s-2 border-gold/30 ps-3 text-[0.78rem] leading-7 text-muted">{r.a}</p>
              </details>
            ))}
          </div>
        </div>
      )

    case 'table':
      return (
        <div>
          {panel.title && <div className="kicker mb-2">{panel.title}</div>}
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="tbl">
              <thead><tr>{panel.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {panel.rows.map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j} className={j === 0 ? 'font-semibold text-ink' : undefined}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {panel.caption && <div className="mt-1 text-[0.62rem] text-faint">{panel.caption}</div>}
        </div>
      )

    case 'cards':
      return (
        <div>
          {panel.title && <div className="kicker mb-2">{panel.title}</div>}
          <div className="grid gap-2 sm:grid-cols-2">
            {panel.items.map((it, i) => (
              <div key={`${it.title}-${i}`} className="scene-mini">
                <div className="mb-1 text-[0.82rem] font-bold" style={{ color: accent }}>{it.title}</div>
                <p className="text-[0.8rem] leading-7 text-muted">{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'quote':
      return (
        <blockquote className="scene-quote scene-quote--large">
          <Quote size={16} className="mb-1 text-gold/60" />
          {panel.text}
          {panel.source && <footer className="mt-2 text-[0.66rem] text-faint">— {panel.source}</footer>}
        </blockquote>
      )

    case 'sources':
      return (
        <div>
          {panel.title && <div className="kicker mb-2">{panel.title}</div>}
          <div className="grid gap-2 sm:grid-cols-2">
            {panel.items.map((s, i) => (
              <div key={`${s.title}-${i}`} className="scene-mini">
                <div className="mb-0.5 text-[0.6rem] text-faint">{s.kind}</div>
                <div className="text-[0.82rem] font-bold">{s.title}</div>
                <p className="mt-0.5 text-[0.76rem] leading-6 text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'chain':
      return (
        <div>
          {panel.title && <div className="kicker mb-2">{panel.title}</div>}
          <div className="chain">
            {panel.items.map((it, i) => (
              <div key={`${it.label}-${i}`} className="chain__item">
                <div className="chain__num">{fas(i + 1)}</div>
                <div>
                  <div className="text-[0.84rem] font-bold">{it.label}</div>
                  <p className="text-[0.76rem] leading-6 text-muted">{it.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}

function CheckCard({ panel }: { panel: Extract<Panel, { kind: 'check' }> }) {
  const [picked, setPicked] = useState<number | null>(null)
  const addXp = useProgress((s) => s.addXp)
  const ok = picked === panel.answer

  return (
    <div className="check">
      <div className="mb-2 flex items-center gap-2 text-[0.7rem] font-semibold text-gold">
        <CircleHelp size={14} /> خودت را بسنج
      </div>
      <div className="text-[0.9rem] font-bold leading-8">{panel.prompt}</div>
      <div className="mt-2.5 grid gap-1.5">
        {panel.options.map((o, i) => {
          const state = picked === null ? 'idle' : i === panel.answer ? 'right' : picked === i ? 'wrong' : 'dim'
          return (
            <button
              key={i}
              onClick={() => {
                if (picked !== null) return
                setPicked(i)
                if (i === panel.answer) addXp(5)
              }}
              className={cn('check__opt', `check__opt--${state}`)}
            >
              <span className="check__bullet">{i === panel.answer && picked !== null ? <Check size={11} /> : picked === i ? <X size={11} /> : fas(i + 1)}</span>
              {o}
            </button>
          )
        })}
      </div>
      <AnimatePresence>
        {picked !== null && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className={cn('mt-2 rounded-lg border px-3 py-2 text-[0.76rem] leading-7', ok ? 'border-turq/30 bg-turq/5 text-muted' : 'border-rose/30 bg-rose/5 text-muted')}>
              <span className={cn('me-1 font-bold', ok ? 'text-turq' : 'text-rose')}>{ok ? 'درست!' : 'نه؛'}</span>
              {panel.explain}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {picked === null && <div className="mt-2 flex items-center gap-1 text-[0.6rem] text-faint"><Eye size={11} /> پاسخ درست ۵ امتیاز دارد</div>}
    </div>
  )
}
