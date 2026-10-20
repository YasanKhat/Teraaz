import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Compass,
  Layers,
  Pause,
  ListChecks,
  Play,
  Quote as QuoteIcon,
  Search,
  Sparkles,
  Target,
  TriangleAlert,
  Volume2,
  VolumeX
} from 'lucide-react'
import type { Lesson, Section } from '../data/types'
import type { Panel, LessonPlan } from '../data/plans/types'
import type { Chapter } from '../data/types'
import { storyByLesson } from '../data/story'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { AtlasMap } from './AtlasMap'
import { TimelineStrip } from './scene/TimelineStrip'
import { PanelView } from './scene/Panels'
import { LessonSignature } from './signature'

/* ────────────────────────────────────────────────────────────────────────
   «فیلم درس» — تنها چیزی که دانش‌آموز پس از ورود به درس می‌بیند.
   یک قاب در هر لحظه، با دکمه‌های جهت‌دار، بدون فهرست و بدون بخش‌های کنارِ هم.
   ──────────────────────────────────────────────────────────────────────── */

type Frame =
  | { kind: 'cover'; art: string }
  | { kind: 'why'; title: string; text: string; essence?: string; outline?: string[] }
  | { kind: 'scene'; n: number; total: number; title: string; kicker?: string; beat: string; art: string }
  | { kind: 'head'; kicker: string; title: string }
  | { kind: 'text'; kicker?: string; title?: string; body: string }
  | { kind: 'list'; kicker?: string; title?: string; items: string[]; numbered?: boolean }
  | { kind: 'table'; kicker?: string; title?: string; head: string[]; rows: string[][]; caption?: string }
  | { kind: 'cards'; kicker?: string; title?: string; items: { title: string; text: string }[] }
  | { kind: 'steps'; kicker?: string; title?: string; items: { title: string; text: string }[] }
  | { kind: 'quote'; text: string; source?: string }
  | { kind: 'note'; tone: 'tip' | 'warn'; title?: string; text: string }
  | { kind: 'map'; kicker: string; title: string; spec: NonNullable<LessonPlan['scenes'][number]['maps']>[number]['spec'] }
  | { kind: 'timeline'; title: string; ids: string[] }
  | { kind: 'panel'; panel: Panel }
  | { kind: 'takeaway'; text: string; scene: string }
  | { kind: 'signature' }
  | { kind: 'keypoints'; items: string[]; part: number; parts: number }
  | { kind: 'exam'; items: { q: string; a: string }[] }
  | { kind: 'danger'; items: { title: string; text: string }[] }
  | { kind: 'echo'; text: string }
  | { kind: 'end' }

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

function sectionFrames(section: Section, kicker: string): Frame[] {
  const frames: Frame[] = []
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
          frames.push({ kind: 'text', kicker, title: i === 0 ? head() : undefined, body: part })
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
          frames.push({ kind: 'list', kicker, title: i === 0 ? head() : undefined, items })
        })
        break
      }
      case 'table':
        frames.push({ kind: 'table', kicker, title: head(), head: b.head, rows: b.rows, caption: b.caption })
        break
      case 'cards':
        chunk(b.items, 4).forEach((items, i) => {
          frames.push({ kind: 'cards', kicker, title: i === 0 ? head() : undefined, items })
        })
        break
      case 'steps':
        frames.push({ kind: 'steps', kicker, title: head(), items: b.items })
        break
      case 'quote':
        frames.push({ kind: 'quote', text: b.text, source: b.source })
        break
      case 'tip':
      case 'warn':
        frames.push({ kind: 'note', tone: b.t, title: b.title, text: b.text })
        break
    }
  }
  return frames
}

export function buildReel(lesson: Lesson, plan: LessonPlan, story: ReturnType<typeof storyByLesson>): Frame[] {
  const frames: Frame[] = [{ kind: 'cover', art: art[plan.art] }]
  if (lesson.why)
    frames.push({
      kind: 'why',
      title: 'چرا این درس را می‌خوانیم؟',
      text: lesson.why,
      essence: plan.essence,
      outline: plan.scenes.map((sc) => sc.title).slice(0, 5)
    })
  const scenes = plan.scenes
  const total = scenes.length

  scenes.forEach((scene, si) => {
    const beat = story?.beats[si]
    frames.push({
      kind: 'scene',
      n: si + 1,
      total,
      title: scene.title,
      kicker: scene.kicker,
      beat:
        beat ??
        scene.takeaway ??
        'در این بخش، مهم‌ترین نکته‌های این صحنه را با هم مرور می‌کنیم.',
      art: art[plan.art]
    })

    scene.maps?.forEach((m) => {
      frames.push({ kind: 'map', kicker: scene.title, title: m.spec.title, spec: m.spec })
    })

    if (scene.timeline) frames.push({ kind: 'timeline', title: scene.timeline.title, ids: scene.timeline.items })

    ;(scene.sections ?? []).forEach((n) => {
      const sec = lesson.sections[n]
      if (sec) frames.push(...sectionFrames(sec, `درس ${fas(lesson.id)} · ${scene.title}`))
    })

    scene.panels
      .filter((p) => p.kind !== 'read')
      .forEach((panel) => {
        if (panel.kind === 'check') {
          frames.push({ kind: 'panel', panel })
          return
        }
        frames.push({ kind: 'panel', panel })
      })

    if (scene.takeaway) frames.push({ kind: 'takeaway', text: scene.takeaway, scene: scene.title })
  })

  // بخش‌های کتاب که در هیچ صحنه‌ای نیامده‌اند — هیچ چیز جا نمی‌ماند
  const used = new Set<number>()
  scenes.forEach((s) => (s.sections ?? []).forEach((n) => used.add(n)))
  const missing = lesson.sections.map((_, i) => i).filter((i) => !used.has(i))
  if (missing.length) {
    frames.push({ kind: 'head', kicker: 'پیوست', title: 'بخش‌های تکمیلی درس' })
    missing.forEach((n) => {
      const sec = lesson.sections[n]
      if (sec) frames.push(...sectionFrames(sec, 'بخش تکمیلی'))
    })
  }

  frames.push({ kind: 'signature' })

  chunk(lesson.keyPoints, 5).forEach((items, i, all) => {
    frames.push({ kind: 'keypoints', items, part: i + 1, parts: all.length })
  })

  chunk(plan.interview, 2).forEach((items) => frames.push({ kind: 'exam', items }))
  if (plan.danger.length) frames.push({ kind: 'danger', items: plan.danger.slice(0, 4) })
  if (story?.echo) frames.push({ kind: 'echo', text: story.echo })
  frames.push({ kind: 'end' })

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
            <p className="film-prose film-prose--lead">{frame.beat}</p>
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
            <p className="film-prose">{frame.body}</p>
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
                  <span>{it}</span>
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
            <span className="film-note__watermark" aria-hidden="true">{frame.tone === 'warn' ? '!' : '✦'}</span>
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
            <span className="film-echo__mark" aria-hidden="true">❝</span>
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

  const next = useCallback(() => go(i + 1), [go, i])
  const prev = useCallback(() => go(i - 1), [go, i])

  useEffect(() => {
    const pct = Math.round(((i + 1) / frames.length) * 100)
    if (!done) setProgress(lesson.id, Math.max(8, Math.min(96, pct)))
    if (i > 0) saveReadPos(lesson.id, (i + 1) / frames.length)
    if (i === frames.length - 1 && !done) completeLesson(lesson.id)
  }, [i, frames.length, lesson.id, done, setProgress, completeLesson, saveReadPos])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); next() }
      if (e.key === 'ArrowRight') { e.preventDefault(); prev() }
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
      if (e.key === 'Escape') navigate(`chapter/${lesson.chapter}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, lesson.chapter])

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

  return (
    <div
      className="film"
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
          {searchHit && (
            <button className="film__search" onClick={() => setSearchHit(null)} title="پاک‌کردن جست‌وجو">
              <Search size={11} /> {searchHit}
              <span>×</span>
            </button>
          )}
          <div className="film__counter">
            {fas(i + 1)} <span>/</span> {fas(frames.length)}
          </div>
        </div>
      </div>

      {/* نشانگرهای قاب */}
      <div className="film__rail" aria-hidden>
        {frames.map((f, k) => (
          <button
            key={k}
            onClick={() => go(k)}
            className={cn('film__tick', k < i && 'is-past', k === i && 'is-now', f.kind === 'map' && 'is-map', f.kind === 'scene' && 'is-scene')}
            title={f.kind === 'scene' ? f.title : undefined}
            aria-label={`قاب ${k + 1}`}
          />
        ))}
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
          <span style={{ width: `${((i + 1) / frames.length) * 100}%` }} />
        </div>

        <div className="film__hint">
          <ArrowRight size={12} /> <ArrowLeft size={12} /> کلیدهای جهت · فاصله: پخش
        </div>
      </div>
    </div>
  )
}
