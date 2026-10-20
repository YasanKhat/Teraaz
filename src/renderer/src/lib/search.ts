import { lessons } from '../data/lessons'
import { figures } from '../data/figures'
import { timeline } from '../data/timeline'
import { chapters } from '../data/chapters'
import { bankItems, kindLabel } from '../data/bank'
import { normalizeFa } from './utils'

export interface SearchHit {
  type: 'درس' | 'چهره' | 'رویداد' | 'واژه' | 'بخش' | 'پرسش'
  title: string
  sub: string
  route: string
  icon: string
}

let cache: { text: string; hit: SearchHit }[] | null = null

function build() {
  if (cache) return cache
  const rows: { text: string; hit: SearchHit }[] = []
  lessons.forEach((l) => {
    rows.push({
      text: normalizeFa(`${l.title} ${l.subtitle} ${l.tagline} ${l.keyPoints.join(' ')} درس ${l.id}`),
      hit: { type: 'درس', title: l.title, sub: `درس ${l.id} · ${l.era}`, route: `lesson/${l.id}`, icon: '📖' }
    })
    l.terms.forEach((t) => {
      rows.push({
        text: normalizeFa(`${t.term} ${t.def} ${l.title}`),
        hit: { type: 'واژه', title: t.term, sub: t.def.slice(0, 60), route: `lesson/${l.id}?q=${encodeURIComponent(t.term)}`, icon: '🔖' }
      })
    })
  })
  figures.forEach((f) => {
    rows.push({
      text: normalizeFa(`${f.name} ${f.title} ${f.bio} ${f.works.join(' ')}`),
      hit: { type: 'چهره', title: f.name, sub: f.title, route: `archive/figures/${f.id}`, icon: '👤' }
    })
  })
  timeline.forEach((e) => {
    rows.push({
      text: normalizeFa(`${e.title} ${e.desc} ${e.date} ${e.place ?? ''}`),
      hit: { type: 'رویداد', title: e.title, sub: `${e.date} · ${e.cat}`, route: `archive/timeline/${e.id}`, icon: '🕰️' }
    })
  })
  bankItems.forEach((item) => {
    rows.push({
      text: normalizeFa(`${item.q} ${item.options?.join(' ') ?? ''} ${item.answer}`),
      hit: {
        type: 'پرسش',
        title: item.q.length > 78 ? `${item.q.slice(0, 76)}…` : item.q,
        sub: `درس ${item.lesson} · ${kindLabel(item.kind)}`,
        route: `bank/${item.lesson}?q=${encodeURIComponent(item.q.slice(0, 40))}`,
        icon: '❓'
      }
    })
  })
  chapters.forEach((c) => {
    rows.push({
      text: normalizeFa(`${c.title} ${c.subtitle} ${c.hint} فصل`),
      hit: { type: 'بخش', title: `فصل ${c.id}: ${c.title}`, sub: c.hint, route: `chapter/${c.id}`, icon: '🏛️' }
    })
  })
  cache = rows
  return rows
}

export function searchAll(query: string, limit = 12): SearchHit[] {
  const q = normalizeFa(query)
  if (q.length < 2) return []
  const rows = build()
  const scored = rows
    .map((r) => {
      const idx = r.text.indexOf(q)
      if (idx === -1) return null
      const titleBonus = normalizeFa(r.hit.title).includes(q) ? 30 : 0
      return { hit: r.hit, score: titleBonus + Math.max(0, 40 - idx / 4) + (r.hit.type === 'درس' ? 6 : 0) }
    })
    .filter(Boolean) as { hit: SearchHit; score: number }[]
  const seen = new Set<string>()
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((x) => {
      const k = `${x.hit.type}-${x.hit.title}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, limit)
    .map((x) => x.hit)
}
