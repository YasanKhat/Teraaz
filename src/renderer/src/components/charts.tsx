import { useId, useMemo, useRef, useState } from 'react'
import type * as React from 'react'
import { compact } from '../lib/format'

export interface Series {
  name: string
  color: string
  values: number[]
}

function niceMax(value: number): number {
  if (value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / Math.pow(10, exponent)
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * Math.pow(10, exponent)
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i]
    const next = points[i + 1]
    const midX = (current.x + next.x) / 2
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

/* ── Sparkline ─────────────────────────────────────────────────────────── */
export function Sparkline({
  values,
  color = 'var(--chart-1)',
  height = 38,
  fill = true,
  strokeWidth = 1.8
}: {
  values: number[]
  color?: string
  height?: number
  fill?: boolean
  strokeWidth?: number
}): React.JSX.Element {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const width = 200
  const pad = 3
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const points = values.map((value, index) => ({
    x: pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2),
    y: height - pad - ((value - min) / span) * (height - pad * 2)
  }))
  const line = smoothPath(points)
  const area = `${line} L ${points[points.length - 1]?.x ?? 0} ${height} L ${points[0]?.x ?? 0} ${height} Z`

  return (
    <svg
      className="spark-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={`sp-${rawId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#sp-${rawId})`} />
        </>
      ) : null}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* ── Area chart ────────────────────────────────────────────────────────── */
export function AreaChart({
  labels,
  series,
  height = 250,
  formatValue = (value: number) => compact(value, 1),
  className
}: {
  labels: string[]
  series: Series[]
  height?: number
  formatValue?: (value: number) => string
  className?: string
}): React.JSX.Element {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const width = 760
  const pad = { top: 18, right: 16, bottom: 30, left: 78 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const count = Math.max(labels.length, 2)
  const maxValue = Math.max(...series.flatMap((item) => item.values), 1)
  const max = niceMax(maxValue * 1.08)
  const ticks = 4

  const xFor = (index: number): number => pad.left + (index / Math.max(1, count - 1)) * innerW
  const yFor = (value: number): number => pad.top + innerH - (Math.max(0, value) / max) * innerH

  const paths = useMemo(
    () =>
      series.map((item) => {
        const points = item.values.map((value, index) => ({
          x: xFor(index),
          y: yFor(value)
        }))
        const line = smoothPath(points)
        const baseline = pad.top + innerH
        const area = points.length
          ? `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
          : ''
        return { ...item, line, area, points }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, height, max, labels.length]
  )

  const handleMove = (event: React.MouseEvent<SVGSVGElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const svgX = ratio * width
    const plotRatio = (svgX - pad.left) / innerW
    const index = Math.round(plotRatio * (count - 1))
    setHover(Math.max(0, Math.min(labels.length - 1, index)))
  }

  const hoverX = hover !== null ? xFor(hover) : 0
  const tooltipLeft = hover !== null ? (hoverX / width) * 100 : 0

  return (
    <div className={`chart-wrap ${className ?? ''}`} ref={wrapperRef}>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
      >
        <defs>
          {series.map((item, index) => (
            <linearGradient key={item.name} id={`grad-${rawId}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0.015" />
            </linearGradient>
          ))}
        </defs>

        {Array.from({ length: ticks + 1 }).map((_, tick) => {
          const value = (max / ticks) * tick
          const y = yFor(value)
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                className="chart-grid-line"
              />
              <text x={pad.left - 10} y={y + 3.5} className="chart-axis-label" textAnchor="end">
                {formatValue(value)}
              </text>
            </g>
          )
        })}

        {labels.map((label, index) => {
          const step = Math.ceil(labels.length / 9)
          if (index % step !== 0 && index !== labels.length - 1) return null
          return (
            <text
              key={label + index}
              x={xFor(index)}
              y={height - 7}
              className="chart-axis-label"
              textAnchor="middle"
            >
              {label}
            </text>
          )
        })}

        {paths.map((item, index) => (
          <g key={item.name}>
            <path d={item.area} fill={`url(#grad-${rawId}-${index})`} />
            <path
              d={item.line}
              className="chart-line"
              stroke={item.color}
              pathLength={1}
              style={{ animationDelay: `${index * 0.12}s` }}
            />
          </g>
        ))}

        {hover !== null ? (
          <g>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="var(--line-strong)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {paths.map((item) => (
              <circle
                key={item.name}
                cx={item.points[hover]?.x ?? 0}
                cy={item.points[hover]?.y ?? 0}
                r="4"
                fill={item.color}
                className="chart-dot"
                stroke={item.color}
              />
            ))}
          </g>
        ) : null}
      </svg>

      {hover !== null && labels[hover] ? (
        <div className="chart-tooltip" style={{ left: `${tooltipLeft}%` }}>
          <div className="tt-label">{labels[hover]}</div>
          {series.map((item) => (
            <div key={item.name} className="tt-row">
              <span className="flex items-center gap-2">
                <span className="tt-dot" style={{ background: item.color }} />
                {item.name}
              </span>
              <b>{formatValue(item.values[hover] ?? 0)}</b>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ── Grouped bars ──────────────────────────────────────────────────────── */
export function GroupedBars({
  labels,
  series,
  height = 210,
  formatValue = (value: number) => compact(value, 1)
}: {
  labels: string[]
  series: Series[]
  height?: number
  formatValue?: (value: number) => string
}): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null)
  const width = 700
  const pad = { top: 16, right: 12, bottom: 28, left: 48 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const groups = labels.length
  const max = niceMax(Math.max(...series.flatMap((item) => item.values), 1) * 1.05)
  const groupWidth = innerW / Math.max(1, groups)
  const barWidth = Math.min(20, (groupWidth * 0.58) / Math.max(1, series.length))
  const gap = 4
  const clusterWidth = series.length * barWidth + (series.length - 1) * gap

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img">
        {Array.from({ length: 4 }).map((_, tick) => {
          const value = (max / 4) * tick
          const y = pad.top + innerH - (value / max) * innerH
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid-line" />
              <text x={pad.left - 10} y={y + 3.5} className="chart-axis-label" textAnchor="end">
                {formatValue(value)}
              </text>
            </g>
          )
        })}

        {labels.map((label, groupIndex) => {
          const groupCenter = pad.left + groupWidth * groupIndex + groupWidth / 2
          return (
            <g
              key={label + groupIndex}
              onMouseEnter={() => setHover(groupIndex)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={pad.left + groupWidth * groupIndex}
                y={pad.top}
                width={groupWidth}
                height={innerH}
                fill="transparent"
              />
              {series.map((item, seriesIndex) => {
                const value = item.values[groupIndex] ?? 0
                const barHeight = Math.max(0, (value / max) * innerH)
                const x =
                  groupCenter -
                  clusterWidth / 2 +
                  seriesIndex * (barWidth + gap)
                return (
                  <rect
                    key={item.name}
                    x={x}
                    y={pad.top + innerH - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx={Math.min(5, barWidth / 2)}
                    fill={item.color}
                    opacity={hover === null || hover === groupIndex ? 0.92 : 0.38}
                    style={{ transition: 'opacity 150ms ease' }}
                  />
                )
              })}
              <text
                x={groupCenter}
                y={height - 7}
                className="chart-axis-label"
                textAnchor="middle"
                fill={hover === groupIndex ? 'var(--ink)' : undefined}
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null ? (
        <div
          className="chart-tooltip"
          style={{
            left: `${((pad.left + groupWidth * hover + groupWidth / 2) / width) * 100}%`
          }}
        >
          <div className="tt-label">{labels[hover]}</div>
          {series.map((item) => (
            <div key={item.name} className="tt-row">
              <span className="flex items-center gap-2">
                <span className="tt-dot" style={{ background: item.color }} />
                {item.name}
              </span>
              <b>{formatValue(item.values[hover] ?? 0)}</b>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ── Donut ─────────────────────────────────────────────────────────────── */
export function Donut({
  items,
  size = 188,
  thickness = 22,
  centerLabel,
  centerValue
}: {
  items: { label: string; value?: number; amount?: number; color: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}): React.JSX.Element {
  const amountOf = (item: { value?: number; amount?: number }): number => item.value ?? item.amount ?? 0
  const total = items.reduce((sum, item) => sum + amountOf(item), 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="donut-wrap" style={{ width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={thickness}
        />
        {total > 0
          ? items.map((item) => {
              const fraction = amountOf(item) / total
              const length = fraction * circumference
              const dash = `${Math.max(0, length - 3)} ${circumference - Math.max(0, length - 3)}`
              const element = (
                <circle
                  key={item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 600ms ease' }}
                />
              )
              offset += length
              return element
            })
          : null}
      </svg>
      <div className="donut-center">
        {centerLabel ? <div className="d-label">{centerLabel}</div> : null}
        {centerValue ? <div className="d-value">{centerValue}</div> : null}
      </div>
    </div>
  )
}

/* ── Trend mini bar chart ──────────────────────────────────────────────── */
export function MiniBars({
  values,
  color = 'var(--chart-1)',
  height = 34
}: {
  values: number[]
  color?: string
  height?: number
}): React.JSX.Element {
  const max = Math.max(...values, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {values.map((value, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: `${Math.max(6, (value / max) * 100)}%`,
            borderRadius: 3,
            background: color,
            opacity: index === values.length - 1 ? 1 : 0.28 + (index / values.length) * 0.4,
            transition: 'height 500ms ease'
          }}
        />
      ))}
    </div>
  )
}
