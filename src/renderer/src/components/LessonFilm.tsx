import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Compass,
  Layers,
  Pause,
  List,
  ListChecks,
  Maximize2,
  Minimize2,
  Play,
  Quote as QuoteIcon,
  Search,
  Sparkles,
  Target,
  TriangleAlert,
  Type,
  Volume2,
  VolumeX
} from 'lucide-react'
import type { Lesson, Section } from '../data/types'
import type { Beat, Panel, LessonPlan } from '../data/plans/types'
import type { Chapter } from '../data/types'
import { storyByLesson } from '../data/story'
import { bookQuote } from '../data/book/sections'
import { bookQuestionsOf, type BookQuestion } from '../data/book/examQuestions'
import { QuestionCards } from './BookQuestions'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { AtlasMap } from './AtlasMap'
import { TimelineStrip } from './scene/TimelineStrip'
import { PanelView } from './scene/Panels'
import { LessonSignature } from './signature'
import { MindMap, type MindBranch } from './scene/MindMap'

/* ────────────────────────────────────────────────────────────────────────
   «فیلم درس» — تنها چیزی که دانش‌آموز پس از ورود به درس می‌بیند.
   یک قاب در هر لحظه، با دکمه‌های جهت‌دار، بدون فهرست و بدون بخش‌های کنارِ هم.
   ──────────────────────────────────────────────────────────────────────── */

/** منبع هر قاب: متن کتاب (باید حفظ شود)، تدریس ما، یا نکتهٔ امتحانی */
type Src = 'book' | 'guide' | 'exam'

type Tagged = { src?: Src; book?: string }

type FrameBody =
  | { kind: 'cover'; art: string }
  | { kind: 'why'; title: string; text: string; essence?: string; outline?: string[] }
  | {
      kind: 'scene'
      n: number
      total: number
      title: string
      kicker?: string
      beat: string
      ask?: string
      art: string
      link?: string
      goals: string[]
    }
  | { kind: 'roadmap'; items: { n: number; title: string; goal: string }[] }
  | { kind: 'legend' }
  | { kind: 'terms'; items: { term: string; def: string }[]; part: number; parts: number }
  | { kind: 'qbank'; items: BookQuestion[]; scene?: string }
  | { kind: 'head'; kicker: string; title: string }
  | { kind: 'text'; kicker?: string; title?: string; body: string }
  | { kind: 'list'; kicker?: string; title?: string; items: string[]; numbered?: boolean }
  | { kind: 'table'; kicker?: string; title?: string; head: string[]; rows: string[][]; caption?: string }
  | { kind: 'cards'; kicker?: string; title?: string; items: { title: string; text: string }[] }
  | { kind: 'steps'; kicker?: string; title?: string; items: { title: string; text: string }[] }
  | { kind: 'quote'; text: string; source?: string }
  | { kind: 'note'; tone: 'tip' | 'warn'; title?: string; text: string }
  | { kind: 'remind'; text: string; scene: string }
  | { kind: 'map'; kicker: string; title: string; spec: NonNullable<LessonPlan['scenes'][number]['maps']>[number]['spec'] }
  | { kind: 'timeline'; title: string; ids: string[] }
  | { kind: 'panel'; panel: Panel }
  | { kind: 'takeaway'; text: string; scene: string }
  | { kind: 'signature' }
  | { kind: 'keypoints'; items: string[]; part: number; parts: number }
  | { kind: 'mind'; title: string; core: string; branches: MindBranch[] }
  | { kind: 'exam'; items: { q: string; a: string }[] }
  | { kind: 'danger'; items: { title: string; text: string }[] }
  | { kind: 'echo'; text: string }
  | { kind: 'end' }

type Frame = FrameBody & Tagged


const SENTENCE = /(?<=[.!؟…])\s+/

/** پاراگراف طولانی را به قاب‌های کوتاه می‌شکند تا هیچ‌وقت اسکرول لازم نشود */
function chunkText(text: string, max = 330): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return [clean]

  // جمله‌های بسیار بلند را از محل ویرگول و نقطه‌ویرگول هم می‌شکنیم
  const pieces: string[] = []
  for (const sentence of clean.split(SENTENCE)) {
    if (sentence.length <= max) {
      pieces.push(sentence)
      continue
    }
    let part = ''
    for (const clause of sentence.split(/(?<=[،؛:])\s+/)) {
      if (part && (part + ' ' + clause).length > max) {
        pieces.push(part.trim())
        part = clause
      } else {
        part = (part + ' ' + clause).trim()
      }
    }
    if (part) pieces.push(part.trim())
  }

  const out: string[] = []
  let buf = ''
  for (const s of pieces) {
    if (buf && (buf + ' ' + s).length > max) {
      out.push(buf.trim())
      buf = s
    } else {
      buf = (buf + ' ' + s).trim()
    }
  }
  if (buf) out.push(buf.trim())
  return out
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function sectionFrames(
  section: Section,
  kicker: string,
  opts: { lessonId: number; order: number }
): Frame[] {
  const frames: Frame[] = []
  const quote = bookQuote(opts.lessonId, section.title, opts.order)
  let quoteUsed = false
  const withQuote = (f: Frame & Tagged): Frame => {
    if (!quoteUsed && quote && (f.kind === 'text' || f.kind === 'list')) {
      quoteUsed = true
      return { ...f, book: quote }
    }
    return f
  }
  const title = section.title.replace(/^[۰-۹\d]+\.\s*/, '')
  let first = true
  const head = () => {
    const h = first ? title : `${title} (ادامه)`
    first = false
    return h
  }
  for (const b of section.blocks) {
    switch (b.t) {
      case 'p':
        chunkText(b.text).forEach((part, i) => {
          frames.push(withQuote({ kind: 'text', src: 'book', kicker, title: i === 0 ? head() : undefined, body: part }))
        })
        break
      case 'bullets': {
        // شمار بندها را با طول متن تنظیم می‌کنیم تا قاب از صفحه بلندتر نشود
        const groups: string[][] = []
        let cur: string[] = []
        let len = 0
        for (const it of b.items) {
          if (cur.length && (cur.length >= 3 || len + it.length > 430)) {
            groups.push(cur)
            cur = []
            len = 0
          }
          cur.push(it)
          len += it.length
        }
        if (cur.length) groups.push(cur)
        groups.forEach((items, i) => {
          frames.push(withQuote({ kind: 'list', src: 'book', kicker, title: i === 0 ? head() : undefined, items }))
        })
        break
      }
      case 'table':
        frames.push({ kind: 'table', src: 'book', kicker, title: head(), head: b.head, rows: b.rows, caption: b.caption })
        break
      case 'cards':
        chunk(b.items, 4).forEach((items, i) => {
          frames.push({ kind: 'cards', src: 'book', kicker, title: i === 0 ? head() : undefined, items })
        })
        break
      case 'steps':
        frames.push({ kind: 'steps', src: 'book', kicker, title: head(), items: b.items })
        break
      case 'quote':
        frames.push({ kind: 'quote', src: 'book', text: b.text, source: b.source })
        break
      case 'tip':
      case 'warn':
        frames.push({ kind: 'note', src: 'guide', tone: b.t, title: b.title, text: b.text })
        break
    }
  }
  return frames
}

/** واژه‌های معنادار یک متن، برای جفت‌کردن پرسش با صحنه */
const keyWords = (text: string) =>
  new Set(
    text
      .replace(/[^\u0600-\u06FF\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  )

/** بهترین پرسشِ استفاده‌نشدهٔ درس برای یک صحنه: بر پایهٔ هم‌پوشانی واژه‌ها */
function pickCheck(lesson: Lesson, scene: Beat, used: Set<string>): Lesson['quiz'][number] | null {
  const target = keyWords(
    (scene.sections ?? [])
      .map((n) => {
        const sec = lesson.sections[n]
        if (!sec) return ''
        return [sec.title, ...sec.blocks.map((b) => JSON.stringify(b))].join(' ')
      })
      .join(' ')
  )
  if (!target.size) return null
  let best: Lesson['quiz'][number] | null = null
  let bestScore = -1
  for (const q of lesson.quiz ?? []) {
    if (used.has(q.prompt)) continue
    let score = 0
    for (const w of keyWords(`${q.prompt} ${q.explain}`)) if (target.has(w)) score++
    if (score > bestScore) {
      bestScore = score
      best = q
    }
  }
  return best
}

/** کلیدواژه‌های یک بخش، برای جفت‌کردن «یادآور» با متن همان بخش */
function sectionWords(lesson: Lesson, idx: number): Set<string> {
  const sec = lesson.sections[idx]
  if (!sec) return new Set()
  return keyWords([sec.title, ...sec.blocks.map((b) => JSON.stringify(b))].join(' '))
}

/** نزدیک‌ترین نکتهٔ کلیدیِ درس به یک بخش — برای تکرارِ هدفمند در میانهٔ درس */
function remindFor(lesson: Lesson, idx: number, used: Set<string>): string | null {
  const words = sectionWords(lesson, idx)
  if (!words.size) return null
  let best: string | null = null
  let score = 0
  for (const kp of lesson.keyPoints) {
    if (used.has(kp)) continue
    let sc = 0
    for (const w of keyWords(kp)) if (words.has(w)) sc++
    if (sc > score) { score = sc; best = kp }
  }
  return score >= 3 ? best : null
}

/** نخستین جملهٔ معنادار یک بخش — برای وقتی که روایتِ دست‌نویس نداریم */
function leadOf(lesson: Lesson, idx: number, max = 240): string | null {
  const sec = lesson.sections[idx]
  if (!sec) return null
  const first = sec.blocks.find((b) => b.t === 'p') as { t: 'p'; text: string } | undefined
  const raw = first?.text ?? (sec.blocks.find((b) => b.t === 'bullets') as { t: 'bullets'; items: string[] } | undefined)?.items?.[0]
  if (!raw) return null
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const stop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('؟'), cut.lastIndexOf('؛'))
  return stop > 80 ? cut.slice(0, stop + 1) : `${cut.trim()}…`
}

export function buildReel(lesson: Lesson, plan: LessonPlan, story: ReturnType<typeof storyByLesson>): Frame[] {
  const frames: Frame[] = [{ kind: 'cover', src: 'guide', art: art[plan.art] }]
  if (lesson.why)
    frames.push({
      kind: 'why',
      src: 'guide',
      title: 'چرا این درس را می‌خوانیم؟',
      text: lesson.why,
      essence: plan.essence,
      outline: plan.scenes.map((sc) => sc.title).slice(0, 5)
    })
  const scenes = plan.scenes
  const total = scenes.length
  frames.push({
    kind: 'roadmap',
    src: 'guide',
    items: scenes.map((sc, k) => ({
      n: k + 1,
      title: sc.title,
      goal: sc.takeaway ?? lesson.keyPoints[k] ?? ''
    }))
  })
  /** پرسش‌هایی که در صحنه‌ها آمده‌اند تا سؤال تکراری نپرسیم */
  frames.push({ kind: 'legend', src: 'guide' })

  const usedChecks = new Set<string>()
  /** نکته‌هایی که یک‌بار به‌عنوان «یادآور» نشان داده شده‌اند */
  const usedReminders = new Set<string>()
  /** پرسش‌های کتاب که هنوز در جایی نیامده‌اند */
  const bookPool = bookQuestionsOf(lesson.id).slice(0, 24)
  scenes.forEach((sc) => sc.panels.forEach((p) => { if (p.kind === 'check') usedChecks.add(p.prompt) }))

  scenes.forEach((scene, si) => {
    const beat = story?.beats[si]
    // پرسش راهنما: اگر صحنه خودش پرسش ندارد، از بانک همین درس یکی می‌آوریم
    const ownCheck = scene.panels.find((p): p is Extract<Panel, { kind: 'check' }> => p.kind === 'check')
    const pickedCheck = ownCheck ?? pickCheck(lesson, scene, usedChecks)
    const derived = leadOf(lesson, (scene.sections ?? [])[0] ?? -1)
    const goals = (scene.sections ?? [])
      .map((n) => lesson.sections[n]?.title ?? '')
      .map((t) => t.replace(/^[۰-۹\d]+\.\s*/, '').trim())
      .filter((t) => t.length > 2)
      .slice(0, 4)
    const prev = si > 0 ? scenes[si - 1] : null
    const link =
      prev && si > 0
        ? si === 1
          ? `پس از این درس، نخستین ایستگاه «${scene.title}» است؛ از همین‌جا وارد ماجرا می‌شویم.`
          : `در صحنهٔ پیش، «${prev.title}» را خواندیم. حالا گرهٔ بعدی: «${scene.title}».`
        : undefined
    frames.push({
      kind: 'scene',
      src: 'guide',
      n: si + 1,
      total,
      title: scene.title,
      kicker: scene.kicker,
      // مقدمهٔ صحنه: روایت دست‌نویس، وگرنه جملهٔ آغازینِ خودِ متن درس
      beat: beat ?? derived ?? scene.takeaway ?? `در این صحنه، «${scene.title}» را از نزدیک می‌بینیم و می‌فهمیم چرا مهم است.`,
      ask: pickedCheck?.prompt,
      art: art[plan.art],
      link,
      goals
    })

    scene.maps?.forEach((m) => {
      frames.push({ kind: 'map', src: 'book', kicker: scene.title, title: m.spec.title, spec: m.spec })
    })

    if (scene.timeline) frames.push({ kind: 'timeline', src: 'book', title: scene.timeline.title, ids: scene.timeline.items })

    // پرسش‌ها و کارها را به همان بخشی می‌چسبانیم که از آن سؤال شده‌اند
    const sceneSections = scene.sections ?? []
    const panelsLeft = scene.panels.filter((p) => p.kind !== 'read')
    const perSection: Panel[][] = sceneSections.map(() => [])
    const leftovers: Panel[] = []
    for (const panel of panelsLeft) {
      const words = keyWords(JSON.stringify(panel))
      let bestAt = -1
      let bestScore = 0
      sceneSections.forEach((n, idx) => {
        const sw = sectionWords(lesson, n)
        let sc = 0
        for (const w of words) if (sw.has(w)) sc++
        if (sc > bestScore) { bestScore = sc; bestAt = idx }
      })
      if (bestScore >= 2 && bestAt >= 0) perSection[bestAt].push(panel)
      else leftovers.push(panel)
    }

    sceneSections.forEach((n, idx) => {
      const sec = lesson.sections[n]
      if (!sec) return
      const part = sectionFrames(sec, `درس ${fas(lesson.id)} · ${scene.title}`, { lessonId: lesson.id, order: n })
      frames.push(...part)
      // تکرارِ هدفمند: پس از هر بخشِ چندقابی، یک نکتهٔ کلیدی را دوباره می‌بینیم
      if (part.length >= 2) {
        const kp = remindFor(lesson, n, usedReminders)
        if (kp) {
          usedReminders.add(kp)
          frames.push({ kind: 'remind', src: 'guide', text: kp, scene: scene.title })
        }
      }
      // پرسشِ همین بخش، همان‌جا: کمی بعد از خواندن، نه یک‌جا در پایان صحنه
      perSection[idx].forEach((panel) =>
        frames.push({ kind: 'panel', src: panel.kind === 'check' ? 'exam' : 'guide', panel })
      )
    })

    // کارهای باقی‌ماندهٔ صحنه (که به بخش خاصی نمی‌چسبیدند)
    leftovers.forEach((panel) => frames.push({ kind: 'panel', src: panel.kind === 'check' ? 'exam' : 'guide', panel }))

    // یادآوری فعال: هر صحنه دست‌کم یک پرسش داشته باشد (اگر از بانک آورده‌ایم، همین‌جا می‌نشیند)
    if (!ownCheck && pickedCheck) {
      usedChecks.add(pickedCheck.prompt)
      frames.push({
        kind: 'panel',
        src: 'exam',
        panel: { kind: 'check', prompt: pickedCheck.prompt, options: pickedCheck.options, answer: pickedCheck.answer, explain: pickedCheck.explain }
      })
    }

    // پرسش‌های خودِ کتاب که به همین صحنه مربوط‌اند
    const sceneText = norm(
      [
        scene.title,
        ...(scene.sections ?? []).flatMap((n) => {
          const sec = lesson.sections[n]
          return sec ? [sec.title, ...sec.blocks.map((b) => JSON.stringify(b))] : []
        })
      ].join(' ')
    )
    const related = bookPool.filter((q) => sceneText.includes(norm(q.q).slice(0, 22)))
    if (related.length) {
      const picked = related.slice(0, 2)
      picked.forEach((q) => bookPool.splice(bookPool.indexOf(q), 1))
      frames.push({ kind: 'qbank', src: 'exam', items: picked, scene: scene.title })
    }

    // جمع‌بندی صحنه: اگر جمع‌بندیِ دست‌نویس نبود، از توضیحِ پرسش‌ها استفاده می‌کنیم
    const fallbackTake = [...scene.panels]
      .reverse()
      .find((p): p is Extract<Panel, { kind: 'check' }> => p.kind === 'check' && !!p.explain)?.explain
    const take = scene.takeaway ?? fallbackTake
    if (take) frames.push({ kind: 'takeaway', src: 'guide', text: take, scene: scene.title })
  })

  // پرسش‌های کتاب که به صحنه‌ای نچسبیدند — در «شب امتحانِ» همان درس
  if (bookPool.length) {
    frames.push({ kind: 'head', src: 'exam', kicker: 'پرسش‌های کتاب', title: 'از کتاب بپرس' })
    chunk(bookPool, 4).forEach((items) => frames.push({ kind: 'qbank', src: 'exam', items }))
  }

  // بخش‌های کتاب که در هیچ صحنه‌ای نیامده‌اند — هیچ چیز جا نمی‌ماند
  const used = new Set<number>()
  scenes.forEach((s) => (s.sections ?? []).forEach((n) => used.add(n)))
  const missing = lesson.sections.map((_, i) => i).filter((i) => !used.has(i))
  if (missing.length) {
    frames.push({ kind: 'head', src: 'guide', kicker: 'پیوست', title: 'بخش‌های تکمیلی درس' })
    missing.forEach((n) => {
      const sec = lesson.sections[n]
      if (sec) frames.push(...sectionFrames(sec, 'بخش تکمیلی', { lessonId: lesson.id, order: n }))
    })
  }

  frames.push({ kind: 'signature', src: 'guide' })

  // جمع‌بندی تصویری: کل درس در یک قاب
  frames.push({
    kind: 'mind',
    src: 'guide',
    title: lesson.title,
    core: plan.essence,
    branches: scenes.map((sc) => ({
      title: sc.title,
      note: sc.takeaway ?? lesson.keyPoints[0] ?? ''
    }))
  })

  chunk(lesson.terms, 3).forEach((items, i, all) => {
    frames.push({ kind: 'terms', src: 'book', items, part: i + 1, parts: all.length })
  })

  chunk(lesson.keyPoints, 5).forEach((items, i, all) => {
    frames.push({ kind: 'keypoints', src: 'exam', items, part: i + 1, parts: all.length })
  })

  chunk(plan.interview, 2).forEach((items) => frames.push({ kind: 'exam', src: 'exam', items }))
  if (plan.danger.length) frames.push({ kind: 'danger', src: 'exam', items: plan.danger.slice(0, 4) })
  if (story?.echo) frames.push({ kind: 'echo', src: 'guide', text: story.echo })
  frames.push({ kind: 'end', src: 'guide' })

  return frames
}

/* ── قاب‌ها ────────────────────────────────────────────────────────────── */

/** متن خواندنیِ یک قاب — برای روایت صوتی و برای جست‌وجو */
function textOfFrame(frame: Frame): string {
  const parts: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === 'string') parts.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach(walk)
  }
  walk(frame)
  return parts.join(' · ').replace(/\s+/g, ' ').trim()
}

/** تاریخ‌ها، سده‌ها و واژه‌های کلیدی را در متن برجسته می‌کند تا چشم بایستد */
export const Emph = ({ text, terms }: { text: string; terms?: string[] }) => {
  const nodes = useMemo(() => {
    const keys = (terms ?? []).filter((t) => t.length > 3).slice(0, 24)
    const escaped = keys.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const re = new RegExp(`(«[^»]{2,40}»|[۰-۹]+(?:\\.|[۰-۹])*\\s*(?:ق\\.?|قبل از میلاد|میلادی|هجری)|${escaped.join('|')})`, 'g')
    const out: React.ReactNode[] = []
    let last = 0
    for (const m of text.matchAll(re)) {
      const k = m.index ?? 0
      if (k > last) out.push(text.slice(last, k))
      const v = m[0]
      const quoted = v.startsWith('«')
      out.push(
        <b key={`${k}-${v}`} className={quoted ? 'film-em film-em--quote' : 'film-em'}>
          {v}
        </b>
      )
      last = k + v.length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
  }, [text, terms])
  return <>{nodes}</>
}

const norm = (s: string) => s.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim()

/** واژه‌های تازه‌ای که در همین قاب به کار رفته‌اند — پانوشتِ کوتاه، نه واژه‌نامه */
function glossOf(frame: Frame, lesson: Lesson): { term: string; def: string }[] {
  const text = JSON.stringify(frame)
  return lesson.terms
    .filter((t) => t.term.length > 2 && text.includes(t.term))
    .slice(0, 2)
    .map((t) => ({ term: t.term, def: t.def }))
}

function Stage({
  frame,
  lesson,
  accent,
  resumeAt,
  onJump
}: {
  frame: Frame
  lesson: Lesson
  accent: string
  resumeAt?: number
  onJump?: (i: number) => void
}) {
  const gloss = glossOf(frame, lesson)
  const body = renderStage(frame, lesson, accent, { resumeAt, onJump })
  return (
    <div className="film-stage" data-kind={frame.kind}>
      <div className="film-stage__tag">
        <SourceTag src={frame.src} />
      </div>
      {body}
      {gloss.length > 0 && (
        <div className="film-gloss">
          {gloss.map((g) => (
            <span key={g.term} className="film-gloss__item">
              <b>{g.term}:</b> {g.def}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const SRC_META = {
  book: { label: 'از کتاب', hint: 'همین را باید بازتولید کنی', tone: 'gold' },
  guide: { label: 'توضیح ما', hint: 'برای فهمیدن، نه حفظ‌کردن', tone: 'turq' },
  exam: { label: 'نکتهٔ امتحانی', hint: 'پرسش و پاسخِ خودِ کتاب', tone: 'rose' }
} as const

/** نشانِ منبعِ قاب: کتاب / تدریس ما / امتحان */
export function SourceTag({ src }: { src?: Src }) {
  const meta = SRC_META[src ?? 'guide']
  return (
    <span className={cn('film-src', `film-src--${meta.tone}`)} title={meta.hint}>
      {src === 'book' ? <BookOpen size={10} /> : src === 'exam' ? <Target size={10} /> : <Sparkles size={10} />}
      {meta.label}
    </span>
  )
}

/** عین عبارت کتاب — بازشو، تا با توضیح ما اشتباه نشود */
function BookQuote({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn('film-quote', open && 'is-open')}>
      <button className="film-quote__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <BookOpen size={12} />
        عین عبارت کتاب
        <ChevronLeft size={12} className={cn('film-quote__chev', open && 'is-open')} />
      </button>
      {open && <p className="film-quote__text">{text}</p>}
    </div>
  )
}

function renderStage(
  frame: Frame,
  lesson: Lesson,
  accent: string,
  { resumeAt, onJump }: { resumeAt?: number; onJump?: (i: number) => void }
) {
  switch (frame.kind) {
    case 'cover':
      return (
        <div className="film-frame film-cover" style={{ backgroundImage: `url(${frame.art})` }}>
          <div className="film-cover__veil" />
          <div className="film-cover__inner">
            <div className="film-kicker">
              درس {fas(lesson.id)} · {lesson.span} · {fas(lesson.minutes)} دقیقه
            </div>
            <h1 className="film-cover__title">{lesson.title}</h1>
            <p className="film-cover__sub">{lesson.subtitle}</p>
            <p className="film-cover__hook">{lesson.hook}</p>
            <div className="film-cover__actions">
              {typeof resumeAt === 'number' && resumeAt > 1 && (
                <button className="film-cover__resume" onClick={() => onJump?.(resumeAt)}>
                  <Play size={14} /> ادامه از قاب {fas(resumeAt + 1)}
                </button>
              )}
              <div className="film-cover__hint">
                <ChevronLeft size={15} /> با دکمه‌های جهت‌دار جلو برو؛ هر قاب یک قدم از درس است
              </div>
            </div>
          </div>
        </div>
      )

    case 'why':
      return (
        <div className="film-frame film-frame--why">
          <span className="film-why__ornament" aria-hidden="true" />
          <div className="film-body film-body--wide">
            <div className="film-kicker">
              <Compass size={12} /> راهنمای آغاز
            </div>
            <h3 className="film-h3">{frame.title}</h3>
            <p className="film-prose">{frame.text}</p>
            {frame.essence && <p className="film-why__essence">«{frame.essence}»</p>}
            {frame.outline && frame.outline.length > 0 && (
              <div className="film-why__outline">
                <span className="film-why__outlineLabel">مسیر این درس</span>
                {frame.outline.map((t, i) => (
                  <span key={t + i} className="film-why__step">
                    <b>{fas(i + 1)}</b>
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="film-faint">در قاب‌های بعد، همین درس را قدم‌به‌قدم با هم می‌خوانیم؛ هیچ پیش‌زمینه‌ای لازم نیست.</div>
          </div>
        </div>
      )

    case 'scene':
      return (
        <div className="film-frame film-scene" style={{ backgroundImage: `url(${frame.art})` }}>
          <div className="film-cover__veil" />
          <div className="film-scene__inner">
            <div className="film-scene__num">
              صحنهٔ {fas(frame.n)} از {fas(frame.total)}
            </div>
            <h2 className="film-scene__title">{frame.title}</h2>
            {frame.kicker && <div className="film-scene__kicker">{frame.kicker}</div>}
            {frame.link && <p className="film-scene__link">{frame.link}</p>}
            <p className="film-prose film-prose--lead">{frame.beat}</p>
            {frame.goals.length > 0 && (
              <ul className="film-scene__goals">
                {frame.goals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            )}
            {frame.ask && (
              <div className="film-ask">
                <span className="film-ask__label">پرسش راهنما</span>
                <span className="film-ask__q">{frame.ask}</span>
                <span className="film-ask__hint">پاسخش را در همین صحنه پیدا کن.</span>
              </div>
            )}
          </div>
        </div>
      )

    case 'roadmap':
      return (
        <div className="film-frame film-frame--copy film-frame--scroll">
          <div className="film-body film-body--wide">
            <div className="film-kicker">نقشهٔ راه درس</div>
            <h3 className="film-h3">در این درس از کجا به کجا می‌رویم؟</h3>
            <ol className="film-roadmap">
              {frame.items.map((it) => (
                <li key={it.n}>
                  <span className="film-roadmap__n">{fas(it.n)}</span>
                  <span className="film-roadmap__body">
                    <b>{it.title}</b>
                    {it.goal && <em>{it.goal}</em>}
                  </span>
                </li>
              ))}
            </ol>
            <p className="film-faint" style={{ marginTop: '0.7rem' }}>
              هر ایستگاه با یک پرسش آغاز می‌شود و با یک جملهٔ جمع‌بندی بسته می‌شود؛ میان راه هم از خودت می‌پرسیم.
            </p>
          </div>
        </div>
      )

    case 'legend':
      return (
        <div className="film-frame film-frame--copy">
          <div className="film-body">
            <div className="film-kicker">راهنمای درس</div>
            <h3 className="film-h3">چه چیزی از کتاب است و چه چیزی توضیح ما؟</h3>
            <div className="film-legend">
              <div className="film-legend__row">
                <SourceTag src="book" />
                <p>
                  جمله‌هایی که <b>در کتاب درسی</b> آمده‌اند؛ در امتحان باید همین‌ها را بازتولید کنی. روی هر قابِ
                  کتابی، دکمهٔ «عین عبارت کتاب» هم هست.
                </p>
              </div>
              <div className="film-legend__row">
                <SourceTag src="guide" />
                <p>
                  <b>توضیح و تدریس ما</b>: مثال، داستان، پیوند میان رویدادها. برای فهمیدن است؛ لازم نیست کلمه‌به‌کلمه
                  حفظ شود.
                </p>
              </div>
              <div className="film-legend__row">
                <SourceTag src="exam" />
                <p>
                  <b>نکته و پرسش امتحانی</b>: پرسش‌های خودِ کتاب با پاسخ، و نکته‌هایی که در آزمون تکرار می‌شوند.
                </p>
              </div>
            </div>
            <p className="film-faint">
              از دکمهٔ «فقط کتاب» در بالای صفحه می‌توانی همهٔ توضیح‌های ما را کنار بگذاری و فقط متنِ کتاب را ببینی.
            </p>
          </div>
        </div>
      )

    case 'qbank':
      return (
        <div className="film-frame film-frame--scroll film-frame--copy">
          <div className="film-body film-body--wide">
            <div className="film-kicker">{frame.scene ? `پرسش کتاب · ${frame.scene}` : 'پرسش‌های کتاب'}</div>
            <h3 className="film-h3">کتاب از تو چه می‌پرسد؟</h3>
            <QuestionCards items={frame.items} />
          </div>
        </div>
      )

    case 'head':
      return (
        <div className="film-frame film-center" style={{ backgroundImage: `url(${art[lesson.id <= 4 ? 'ch1' : lesson.id <= 8 ? 'ch2' : lesson.id <= 12 ? 'ch3' : 'ch4']})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="film-cover__veil" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="film-kicker">{frame.kicker}</div>
            <h2 className="film-h2" style={{ color: '#f8ecd2' }}>{frame.title}</h2>
            <p className="film-prose" style={{ color: 'rgba(246,236,214,0.7)', textAlign: 'center', marginTop: '0.4rem' }}>
              بخش‌هایی از کتاب که در قاب‌های پیشین جا نشدند — به همین ترتیب ادامه بده.
            </p>
          </div>
        </div>
      )

    case 'text':
      return (
        <div className="film-frame film-frame--copy">
          <div className="film-body">
            {frame.kicker && <div className="film-kicker">{frame.kicker}</div>}
            {frame.title && <h3 className="film-h3">{frame.title}</h3>}
            <p className="film-prose">
              <Emph text={frame.body} terms={lesson.terms.map((t) => t.term)} />
            </p>
            {frame.book && <BookQuote text={frame.book} />}
          </div>
        </div>
      )

    case 'list':
      return (
        <div className="film-frame film-frame--scroll film-frame--copy">
          <div className="film-body">
            {frame.kicker && <div className="film-kicker">{frame.kicker}</div>}
            {frame.title && <h3 className="film-h3">{frame.title}</h3>}
            <ul className={cn('film-list', frame.numbered && 'film-list--num')}>
              {frame.items.map((it, i) => (
                <li key={i}>
                  <span className="film-list__mark">{frame.numbered ? fas(i + 1) : ''}</span>
                  <span>
                    <Emph text={it} terms={lesson.terms.map((t) => t.term)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )

    case 'table':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body film-body--wide">
            {frame.kicker && <div className="film-kicker">{frame.kicker}</div>}
            {frame.title && <h3 className="film-h3">{frame.title}</h3>}
            <div className="film-tableWrap">
              <table className="film-table">
                <thead>
                  <tr>{frame.head.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {frame.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => <td key={j}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {frame.caption && <div className="film-faint">{frame.caption}</div>}
          </div>
        </div>
      )

    case 'cards':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body film-body--wide">
            {frame.kicker && <div className="film-kicker">{frame.kicker}</div>}
            {frame.title && <h3 className="film-h3">{frame.title}</h3>}
            <div className={cn('film-cards', frame.items.length > 2 && 'film-cards--grid')}>
              {frame.items.map((it, i) => (
                <div key={i} className="film-card">
                  <div className="film-card__title">{it.title}</div>
                  <p>{it.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'steps':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body">
            {frame.kicker && <div className="film-kicker">{frame.kicker}</div>}
            {frame.title && <h3 className="film-h3">{frame.title}</h3>}
            <ol className="film-steps">
              {frame.items.map((it, i) => (
                <li key={i}>
                  <span className="film-steps__n">{fas(i + 1)}</span>
                  <div>
                    <div className="font-bold text-ink">{it.title}</div>
                    <p>{it.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )

    case 'quote':
      return (
        <div className="film-frame film-center film-frame--stage">
          <blockquote className={cn('film-quote', frame.text.length > 190 && 'film-quote--long')}>
            <QuoteIcon size={22} className="mb-3 text-gold/70" />
            <p>{frame.text}</p>
            {frame.source && <cite>— {frame.source}</cite>}
          </blockquote>
        </div>
      )

    case 'note':
      return (
        <div className="film-frame film-center film-frame--note">
          <div className={cn('film-note', frame.tone === 'warn' && 'film-note--warn')}>
            <span className="film-note__watermark" aria-hidden="true">
              {frame.tone === 'warn' ? <TriangleAlert size={70} strokeWidth={1.1} /> : <Sparkles size={70} strokeWidth={1.1} />}
            </span>
            <div className="film-note__head">
              {frame.tone === 'warn' ? <TriangleAlert size={16} /> : <Sparkles size={16} />}
              {frame.title ?? (frame.tone === 'warn' ? 'دقت کن' : 'نکته')}
            </div>
            <p>{frame.text}</p>
          </div>
        </div>
      )

    case 'map':
      return (
        <div className="film-frame film-frame--map">
          <div className="film-mapHead">
            <div className="film-kicker">{frame.kicker}</div>
            <h3 className="film-h3">{frame.title}</h3>
          </div>
          <AtlasMap spec={frame.spec} autoPlay chrome={false} />
        </div>
      )

    case 'timeline':
      return (
        <div className="film-frame">
          <div className="film-body film-body--wide">
            <div className="film-kicker">خط زمان</div>
            <h3 className="film-h3">{frame.title}</h3>
            <TimelineStrip ids={frame.ids} />
          </div>
        </div>
      )

    case 'panel':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body film-body--wide">
            <PanelView panel={frame.panel} accent={accent} />
          </div>
        </div>
      )

    case 'terms':
      return (
        <div className="film-frame film-frame--scroll film-frame--copy">
          <div className="film-body">
            <div className="film-kicker">
              اصطلاح‌های همین درس {frame.parts > 1 ? `· بخش ${fas(frame.part)} از ${fas(frame.parts)}` : ''}
            </div>
            <h3 className="film-h3">این‌ها را باید بتوانی تعریف کنی</h3>
            <dl className="film-terms">
              {frame.items.map((t) => (
                <div key={t.term} className="film-terms__row">
                  <dt>{t.term}</dt>
                  <dd>{t.def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )

    case 'remind':
      return (
        <div className="film-frame film-frame--copy">
          <div className="film-body">
            <div className="film-remind">
              <span className="film-remind__tag">
                <Sparkles size={11} /> به یاد بسپار
              </span>
              <p className="film-remind__text">{frame.text}</p>
              <span className="film-remind__from">از درسنامهٔ «{frame.scene}»</span>
            </div>
          </div>
        </div>
      )

    case 'takeaway':
      return (
        <div className="film-frame film-center film-frame--stage">
          <div className="film-take">
            <div className="film-take__label">
              <Sparkles size={13} /> جمع‌بندی · {frame.scene}
            </div>
            <p>{frame.text}</p>
          </div>
        </div>
      )

    case 'signature':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body film-body--wide">
            <div className="film-kicker">کارگاه تعاملی</div>
            <h3 className="film-h3">با دست خودت، درس را لمس کن</h3>
            <LessonSignature lesson={lesson.id} />
          </div>
        </div>
      )

    case 'keypoints':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body film-body--wide">
            <div className="film-kicker">
              <Layers size={12} /> آنچه باید در ذهن بماند {frame.parts > 1 ? `(${fas(frame.part)} از ${fas(frame.parts)})` : ''}
            </div>
            <ul className="film-list film-list--check">
              {frame.items.map((it, i) => (
                <li key={i}>
                  <Check size={15} className="mt-1.5 shrink-0 text-gold" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )

    case 'mind':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body film-body--wide">
            <div className="film-kicker">
              <Layers size={12} /> نقشهٔ ذهنِ درس · یک نگاه، تمام مسیر
            </div>
            <MindMap core={frame.core} title={frame.title} branches={frame.branches} />
            <p className="film-faint" style={{ textAlign: 'center', marginTop: '0.4rem' }}>
              اگر می‌توانی این نقشه را با جمله‌های خودت بازگو کنی، درس را فهمیده‌ای.
            </p>
          </div>
        </div>
      )

    case 'exam':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body">
            <div className="film-kicker">
              <CircleHelp size={12} /> آنچه ممتحن می‌پرسد
            </div>
            <div className="film-exam">
              {frame.items.map((it, i) => (
                <details key={i} className="film-exam__item">
                  <summary>
                    <span className="film-exam__q">{it.q}</span>
                    <ChevronLeft size={15} className="film-exam__arrow" />
                  </summary>
                  <p>{it.a}</p>
                </details>
              ))}
            </div>
            <div className="film-faint">روی هر پرسش بزن تا پاسخش باز شود.</div>
          </div>
        </div>
      )

    case 'danger':
      return (
        <div className="film-frame film-frame--scroll">
          <div className="film-body film-body--wide">
            <div className="film-kicker">
              <TriangleAlert size={12} /> دام‌های رایج
            </div>
            <div className="film-cards film-cards--grid">
              {frame.items.map((d, i) => (
                <div key={i} className="film-card film-card--warn">
                  <div className="film-card__title">{d.title}</div>
                  <p>{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'echo':
      return (
        <div className="film-frame film-center film-frame--stage">
          <div className="film-echo">
            <span className="film-echo__mark" aria-hidden="true"><QuoteIcon size={22} /></span>
            <p>{frame.text}</p>
          </div>
        </div>
      )

    case 'end':
      return (
        <div className="film-frame film-center">
          <div className="film-end">
            <Compass size={30} className="mx-auto mb-3 text-gold/80" />
            <h2 className="film-h2">درس {fas(lesson.id)} تمام شد</h2>
            <p className="film-prose" style={{ textAlign: 'center' }}>
              حالا می‌توانی خودت را بسنجی؛ یا مستقیم بروی سراغ درس بعد.
            </p>
            <div className="film-end__actions">
              <button className="btn btn-gold" onClick={() => navigate(`quiz/lesson-${lesson.id}`)}>
                <Target size={14} /> آزمون این درس
              </button>
              <button className="btn btn-ghost" onClick={() => navigate(`bank/${lesson.id}`)}>
                <ListChecks size={14} /> همهٔ سؤال‌های این درس
              </button>
              {lesson.id < 16 ? (
                <button className="btn btn-ghost" onClick={() => navigate(`lesson/${lesson.id + 1}`)}>
                  درس بعد <ArrowLeft size={14} />
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={() => navigate('chapters')}>
                  فهرست درس‌ها <ArrowLeft size={14} />
                </button>
              )}
            </div>
            <p className="film-faint" style={{ marginTop: '0.8rem' }}>
              اگر جایی را نفهمیدی، با دکمهٔ جهت‌دار به همان قاب برگرد؛ همه‌چیز همین‌جاست.
            </p>
          </div>
        </div>
      )
  }
}

/* ── پوستهٔ فیلم ───────────────────────────────────────────────────────── */

export function LessonFilm({
  lesson,
  plan,
  chapter,
  jumpTo
}: {
  lesson: Lesson
  plan: LessonPlan
  chapter: Chapter
  jumpTo?: string
}) {
  const story = storyByLesson(lesson.id)
  const frames = useMemo(() => buildReel(lesson, plan, story), [lesson, plan, story])
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [voice, setVoice] = useState(false)
  const [searchHit, setSearchHit] = useState<string | null>(null)
  /** صافی منبع: همه / آنچه از کتاب است / توضیح‌های ما */
  const [scope, setScope] = useState<'all' | 'book' | 'guide'>('all')
  /** اندازهٔ خواندن: کوچک، معمولی، درشت */
  const [read, setRead] = useState<'sm' | 'md' | 'lg'>(() => {
    try {
      const v = localStorage.getItem('tabar:filmRead')
      return v === 'sm' || v === 'lg' ? v : 'md'
    } catch {
      return 'md'
    }
  })
  const [menu, setMenu] = useState(false)
  /** تمام‌صفحه: قاب درس کل پنجره را می‌گیرد تا چشم فقط روی درس باشد */
  const [full, setFull] = useState(() => {
    try { return localStorage.getItem('tabar:filmFull') === '1' } catch { return false }
  })
  const frame = frames[Math.min(i, frames.length - 1)]
  const accent = lesson.accent
  const done = useProgress((s) => s.completed.includes(lesson.id))
  const completeLesson = useProgress((s) => s.completeLesson)
  const setProgress = useProgress((s) => s.setLessonProgress)
  const setLastLesson = useProgress((s) => s.setLastLesson)
  const saveReadPos = useProgress((s) => s.saveReadPos)

  /* جای ادامهٔ درس — فقط یک‌بار هنگام ورود خوانده می‌شود تا حین تماشا نپرد */
  const savedAt = useRef<number | null>(null)
  if (savedAt.current === null) {
    const fraction = useProgress.getState().readPos[lesson.id] ?? 0
    const guess = Math.round(fraction * frames.length) - 1
    savedAt.current = guess > 1 && guess < frames.length - 2 ? guess : 0
  }

  /* تمام‌صفحهٔ واقعی: هم کلاس چیدمان، هم درخواست fullscreen از مرورگر */
  const shellRef = useRef<HTMLDivElement | null>(null)
  const wantFull = useRef(false)

  useEffect(() => {
    document.documentElement.dataset.filmFull = full ? 'on' : 'off'
    try { localStorage.setItem('tabar:filmFull', full ? '1' : '0') } catch { /* بی‌اهمیت */ }
    const el = shellRef.current
    if (full && wantFull.current && el && !document.fullscreenElement) {
      el.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => { /* مرورگر اجازه نداد؛ چیدمان ثابت کافی است */ })
    }
    if (!full && document.fullscreenElement) document.exitFullscreen?.().catch(() => { /* بی‌اهمیت */ })
    return () => { document.documentElement.dataset.filmFull = 'off' }
  }, [full])

  /* اگر کاربر با Esc مرورگر از تمام‌صفحهٔ بومی بیرون آمد، حالت ما هم هم‌گام شود */
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setFull(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('tabar:filmRead', read)
    } catch {
      /* بی‌اهمیت */
    }
  }, [read])

  const cycleRead = () => setRead((v) => (v === 'md' ? 'lg' : v === 'lg' ? 'sm' : 'md'))

  /* بستن فهرست صحنه‌ها با Esc یا کلیک بیرون */
  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('.film-menu') && !t.closest('[data-menu-toggle]')) setMenu(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [menu])

  const toggleFull = useCallback(() => {
    setFull((v) => {
      wantFull.current = !v
      return !v
    })
  }, [])

  useEffect(() => {
    setLastLesson(lesson.id)
    window.scrollTo({ top: 0 })
    savedAt.current = null
  }, [lesson.id, setLastLesson])

  useEffect(() => {
    setI(0)
    setDir(1)
    setPlaying(false)
    savedAt.current = null
    setSearchHit(null)

    const needle = jumpTo && jumpTo.trim().length > 1 ? norm(jumpTo) : ''
    if (needle) {
      const hit = frames.findIndex((f, k) => k > 0 && norm(textOfFrame(f)).includes(needle))
      if (hit > 0) {
        setI(hit)
        setSearchHit(jumpTo!.trim())
      } else {
        /* جست‌وجو در این درس نتیجه نداد؛ از قاب اول شروع می‌کنیم و چیپ را نمی‌گذاریم */
        setSearchHit(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, jumpTo, frames])

  const go = useCallback(
    (next: number) => {
      setI((cur) => {
        const target = Math.max(0, Math.min(frames.length - 1, next))
        setDir(target >= cur ? 1 : -1)
        return target
      })
    },
    [frames.length]
  )

  /** قاب‌هایی که با صافی فعلی دیده می‌شوند */
  const shown = useMemo(() => {
    const keep = (f: Frame) => (scope === 'all' ? true : scope === 'book' ? f.src !== 'guide' : f.src !== 'book')
    const list = frames.map((_, k) => k).filter((k) => keep(frames[k]))
    return list.length ? list : frames.map((_, k) => k)
  }, [frames, scope])
  const pos = Math.max(0, shown.indexOf(i))

  const next = useCallback(() => go(shown[Math.min(shown.length - 1, pos + 1)]), [go, shown, pos])
  const prev = useCallback(() => go(shown[Math.max(0, pos - 1)]), [go, shown, pos])

  /* با عوض‌شدن صافی، به نزدیک‌ترین قابِ دیدنی می‌رویم */
  useEffect(() => {
    if (scope === 'all') return
    if (shown.includes(i)) return
    go(shown[Math.min(pos < 0 ? 0 : pos, shown.length - 1)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  useEffect(() => {
    const pct = Math.round(((pos + 1) / shown.length) * 100)
    if (!done) setProgress(lesson.id, Math.max(8, Math.min(96, pct)))
    if (pos > 0) saveReadPos(lesson.id, (pos + 1) / shown.length)
    if (i === frames.length - 1 && !done) completeLesson(lesson.id)
  }, [i, pos, shown.length, lesson.id, done, setProgress, completeLesson, saveReadPos])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); next() }
      if (e.key === 'ArrowRight') { e.preventDefault(); prev() }
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
      if (e.key === 'Escape') {
        if (full) { wantFull.current = false; setFull(false); return }
        navigate(`chapter/${lesson.chapter}`)
      }
      if (e.key.toLowerCase() === 'f') {
        wantFull.current = !full
        setFull((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, lesson.chapter, full])

  /* پخش خودکار: هر قاب به اندازهٔ متنش می‌ماند؛ با روایت صوتی، هم‌قدم با خواندن */
  const dwell = useMemo(() => {
    const text = voice ? textOfFrame(frame) : JSON.stringify(frame)
    const words = text.split(/\s+/).filter(Boolean).length
    return voice
      ? Math.max(7000, Math.min(60000, words * 430 + 2200))
      : Math.max(6500, Math.min(15000, words * 190))
  }, [frame, voice])

  useEffect(() => {
    if (!playing) return
    if (i >= frames.length - 1) { setPlaying(false); return }
    const t = window.setTimeout(() => next(), dwell)
    return () => window.clearTimeout(t)
  }, [playing, i, dwell, next, frames.length])

  /* روایت صوتی همین قاب — برای کسی که ترجیح می‌دهد گوش بدهد */
  useEffect(() => {
    if (!voice) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const text = textOfFrame(frame)
    if (!text) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text.slice(0, 900))
    utter.lang = 'fa-IR'
    utter.rate = 0.98
    window.speechSynthesis.speak(utter)
    return () => window.speechSynthesis.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, i])

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  // کشیدن انگشت روی موبایل: به چپ = جلو
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
    }
    touch.current = null
  }

  const sceneOf = (() => {
    for (let k = i; k >= 0; k--) {
      const f = frames[k]
      if (f.kind === 'scene') return { n: f.n, total: f.total, title: f.title }
    }
    return null
  })()

  const segments = useMemo(() => {
    const out: { n: number; title: string; start: number; end: number }[] = []
    shown.forEach((k) => {
      const f = frames[k]
      if (f.kind === 'scene') out.push({ n: f.n, title: f.title, start: k, end: k })
      else if (out.length) out[out.length - 1].end = k
      else out.push({ n: 0, title: 'پیش‌درآمد درس', start: k, end: k })
    })
    return out
  }, [frames, shown])

  return (
    <div
      ref={shellRef}
      className={cn('film', full && 'is-full')}
      data-read={read}
      style={{ ['--film-accent' as string]: accent }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* سرصفحه */}
      <div className="film__top">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => navigate(`chapter/${lesson.chapter}`)} className="film__back" aria-label="بازگشت به فصل">
            <ChevronRight size={16} />
          </button>
          <div className="min-w-0">
            <div className="film__crumb">
              فصل {fas(chapter.id)} · {chapter.title}
            </div>
            <div className="film__titleBlock">
              <span className="film__lessonNo">درس {fas(lesson.id)}</span>
              <span className="film__lessonTitle">{lesson.title}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="film-scope" role="group" aria-label="صافی منبع">
            {([
              ['all', 'همه'],
              ['book', 'کتاب'],
              ['guide', 'توضیح ما']
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setScope(id)} data-active={scope === id} title={id === 'book' ? 'فقط متن و پرسش‌های کتاب' : id === 'guide' ? 'فقط توضیح‌های ما' : 'همهٔ قاب‌ها'}>
                {label}
              </button>
            ))}
          </div>
          {searchHit && (
            <button className="film__search" onClick={() => setSearchHit(null)} title="پاک‌کردن جست‌وجو">
              <Search size={11} /> {searchHit}
              <span>×</span>
            </button>
          )}
          <button
            className="film__back"
            onClick={cycleRead}
            aria-label="اندازهٔ خواندن"
            title={`اندازهٔ متن: ${read === 'sm' ? 'کوچک' : read === 'lg' ? 'درشت' : 'معمولی'}`}
          >
            <Type size={15} />
          </button>
          <div className="relative">
            <button
              className={cn('film__back', menu && 'is-on')}
              onClick={() => setMenu((v) => !v)}
              aria-label="فهرست صحنه‌ها"
              title="فهرست صحنه‌ها"
              data-menu-toggle
            >
              <List size={15} />
            </button>
            {menu && (
              <div className="film-menu">
                <div className="film-menu__head">فهرست درس</div>
                <div className="film-menu__list">
                  {segments.map((seg) => {
                    const percent = Math.round(((Math.min(Math.max(i - seg.start + 1, 0), seg.end - seg.start + 1)) / (seg.end - seg.start + 1)) * 100)
                    return (
                      <button
                        key={seg.start}
                        className={cn('film-menu__item', i >= seg.start && i <= seg.end && 'is-now')}
                        onClick={() => {
                          go(seg.start)
                          setMenu(false)
                        }}
                      >
                        <span className="film-menu__n">{seg.n ? fas(seg.n) : '·'}</span>
                        <span className="film-menu__title">{seg.title}</span>
                        <span className="film-menu__bar">
                          <span style={{ width: `${percent}%` }} />
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="film-menu__foot">
                  <button onClick={() => { go(frames.length - 1); setMenu(false) }}>پایان درس</button>
                  <span>{fas(segments.length)} صحنه · {fas(frames.length)} قاب</span>
                </div>
              </div>
            )}
          </div>
          <button
            className={cn('film__back', full && 'is-on')}
            onClick={toggleFull}
            aria-label={full ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
            title={full ? 'خروج از تمام‌صفحه (Esc)' : 'تمام‌صفحهٔ درس (F)'}
          >
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <div className="film__counter">
            {fas(pos + 1)} <span>/</span> {fas(shown.length)}
          </div>
        </div>
      </div>

      {/* نوار صحنه‌ها: جای هر صحنه و پیشرفتِ درونش، یک نگاه */}
      <div className="film__rail" aria-hidden>
        {segments.map((seg) => {
          const count = seg.end - seg.start + 1
          const inside = Math.min(Math.max(i - seg.start + 1, 0), count)
          return (
            <button
              key={seg.start}
              onClick={() => go(seg.start)}
              className={cn('film__seg', i > seg.end && 'is-past', i >= seg.start && i <= seg.end && 'is-now')}
              style={{ flexGrow: count }}
              title={seg.title}
            >
              <span className="film__segFill" style={{ width: `${(inside / count) * 100}%` }} />
              <span className="film__segLabel">{seg.n ? fas(seg.n) : '▪'}</span>
            </button>
          )
        })}
      </div>

      {/* صحنه */}
      <div className="film__stage">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={i}
            custom={dir}
            initial={{ opacity: 0, x: dir > 0 ? -38 : 38 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir > 0 ? 28 : -28 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="film__slide"
          >
            <Stage
              frame={frame}
              lesson={lesson}
              accent={accent}
              resumeAt={savedAt.current ?? 0}
              onJump={(k) => { savedAt.current = 0; go(k) }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* کنترل‌ها */}
      <div className="film__controls">
        <div className="film__nav">
          <button className="film__arrow" onClick={prev} disabled={i === 0} aria-label="قاب قبل">
            <ChevronRight size={22} />
          </button>
          <button
            className={cn('film__play', playing && 'is-on')}
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'توقف پخش' : 'پخش خودکار'}
            title={playing ? 'توقف' : 'پخش خودکار'}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="film__arrow film__arrow--next" onClick={next} disabled={i >= frames.length - 1} aria-label="قاب بعد">
            <ChevronLeft size={22} />
          </button>
          <button
            className={cn('film__play', voice && 'is-on')}
            onClick={() => setVoice((v) => !v)}
            aria-label={voice ? 'خاموش‌کردن روایت' : 'روشن‌کردن روایت صوتی'}
            title={voice ? 'خاموش‌کردن روایت' : 'روایت صوتی'}
          >
            {voice ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>

        <div className="film__where">
          {sceneOf ? (
            <>
              <span className="film__whereKicker">صحنهٔ {fas(sceneOf.n)} از {fas(sceneOf.total)}</span>
              <span className="film__whereTitle">{sceneOf.title}</span>
            </>
          ) : (
            <span className="film__whereTitle">{frame.kind === 'cover' ? 'آغاز درس' : frame.kind === 'end' ? 'پایان درس' : 'جمع‌بندی و آزمون'}</span>
          )}
        </div>

        <div className="film__progress" aria-hidden>
          <span style={{ width: `${((pos + 1) / shown.length) * 100}%` }} />
        </div>

        <div className="film__hint">
          <ArrowRight size={12} /> <ArrowLeft size={12} /> کلیدهای جهت · فاصله: پخش
        </div>
      </div>
    </div>
  )
}
