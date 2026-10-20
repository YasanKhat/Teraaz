/* رندر نقشه‌ها به SVG برای بازبینی چشمی: npx vite-node tools/mapshot.tsx [شماره] */
import { renderToString } from 'react-dom/server'
import { writeFileSync } from 'node:fs'
import { AtlasView } from '../src/renderer/src/components/atlas/AtlasView'
import { allLessonPlans } from '../src/renderer/src/data/plans'

;(globalThis as any).window = { location: { hash: '' }, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {}, matchMedia: () => ({ matches: false }) }
;(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

const all = allLessonPlans.flatMap((p) => p.scenes.flatMap((s) => s.maps ?? []))
const only = process.argv[2] ? Number(process.argv[2]) : null
all.forEach((m, k) => {
  if (only !== null && k !== only) return
  const html = renderToString(<AtlasView spec={m.spec} chrome />)
  const anchor = html.indexOf('atlasx__svg')
  const start = html.lastIndexOf('<svg', anchor)
  const end = html.indexOf('</svg>', anchor) + 6
  let svg = html.slice(start, end)
  // پاک‌سازی ویژگی‌های تکراری و افزودن اندازه برای رسترسیون
  svg = svg.replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620">')
  // مرورگرها transform در style را روی <g> می‌پذیرند؛ رسترسیون نه. برای تصویر، به attribute تبدیل می‌کنیم
  svg = svg.replace(/style="transform:translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)\s*scale\(([\d.]+)\)"/g, 'transform="translate($1,$2) scale($3)"')
  writeFileSync(`/tmp/map-${k}.svg`, svg)
  console.log(k, m.spec.title, m.spec.phases.length)
})
