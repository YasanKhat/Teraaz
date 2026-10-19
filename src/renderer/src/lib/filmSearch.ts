import { lessons } from '../data/lessons'
import { planByLesson } from '../data/plans'
import { storyByLesson } from '../data/story'
import { normalizeFa } from './utils'

/**
 * جست‌وجو در «متنِ فیلم درس‌ها».
 *
 * پیش‌تر جست‌وجو در متن خام کتاب انجام می‌شد؛ اما آن متن در فیلم بازنویسی شده است،
 * پس نتیجه به قابی نمی‌رسید که همان جمله را داشته باشد. اینجا فقط رشته‌هایی
 * جمع می‌شوند که واقعاً در قاب‌های فیلم دیده می‌شوند تا هر نتیجه، مقصد داشته باشد.
 */

export interface FilmHit {
  lesson: number
  lessonTitle: string
  snippet: string
}

/** رشته‌های خواندنیِ یک درس، به ترتیبی که در فیلم می‌آیند */
function stringsOf(lessonId: number): string[] {
  const lesson = lessons.find((l) => l.id === lessonId)
  const plan = planByLesson(lessonId)
  const story = storyByLesson(lessonId)
  if (!lesson || !plan) return []

  const out: string[] = []
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.trim().length > 2) out.push(v)
  }

  push(lesson.title)
  push(lesson.subtitle)
  push(lesson.tagline)
  push(lesson.why)
  lesson.keyPoints.forEach(push)
  lesson.sections.forEach((sec) => {
    push(sec.title)
    sec.blocks.forEach((b: any) => {
      push(b.text)
      push(b.caption)
      push(b.source)
      push(b.title)
      ;(b.items ?? []).forEach((it: any) => push(typeof it === 'string' ? it : `${it.title} ${it.text}`))
      ;(b.rows ?? []).forEach((r: any) => push((r ?? []).join(' ')))
      ;(b.head ?? []).forEach(push)
    })
  })
  push(plan.heroLine)
  push(plan.question)
  push(plan.essence)
  plan.scenes.forEach((scene) => {
    push(scene.title)
    push(scene.takeaway)
    push(story?.beats?.[plan.scenes.indexOf(scene)])
    scene.panels.forEach((p: any) => {
      push(p.title)
      push(p.lead)
      push(p.text)
      push(p.prompt)
      push(p.explain)
      push(p.verdict)
      push(p.caption)
      push(p.heading)
      push(p.intro)
      ;(p.items ?? []).forEach((it: any) => (typeof it === 'string' ? push(it) : push(`${it.title ?? it.label ?? ''} ${it.text ?? ''}`)))
      ;(p.rows ?? []).forEach((r: any) => push(`${r.q ?? r[0] ?? ''} ${r.a ?? (r as string[])[1] ?? ''}`))
      ;(p.head ?? []).forEach(push)
      ;(p.left?.items ?? []).forEach(push)
      ;(p.right?.items ?? []).forEach(push)
      push(p.left?.label)
      push(p.right?.label)
    })
  })
  plan.interview.forEach((x) => push(`${x.q} ${x.a}`))
  plan.danger.forEach((x) => push(`${x.title} ${x.text}`))
  plan.examRecipe.rows.forEach((x) => push(`${x.q} ${x.a}`))
  return out.filter((s, i, all) => all.indexOf(s) === i)
}

let cache: { lesson: number; originals: string[] }[] | null = null

function index() {
  if (cache) return cache
  cache = lessons.map((l) => ({ lesson: l.id, originals: stringsOf(l.id) }))
  return cache
}

export function searchFilm(query: string, limit = 5): FilmHit[] {
  const q = normalizeFa(query).trim()
  if (q.length < 3) return []
  const hits: FilmHit[] = []
  for (const row of index()) {
    const hit = row.originals
      .map((original) => ({ original, n: normalizeFa(original) }))
      .map((x) => ({ ...x, at: x.n.indexOf(q) }))
      .find((x) => x.at !== -1)
    if (!hit) continue
    const lesson = lessons.find((l) => l.id === row.lesson)!
    const text = hit.original.replace(/\s+/g, ' ').trim()
    const at = hit.at
    const from = Math.max(0, at - 45)
    hits.push({
      lesson: row.lesson,
      lessonTitle: lesson.title,
      snippet: (from > 0 ? '…' : '') + text.slice(from, from + 150) + (text.length > from + 150 ? '…' : '')
    })
    if (hits.length >= limit) break
  }
  return hits
}
