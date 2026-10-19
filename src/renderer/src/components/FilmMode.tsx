import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import type { Lesson } from '../data/types'
import type { LessonPlan } from '../data/plans/types'
import { art } from '../art'
import { cn, fas } from '../lib/utils'
import { HistoricMap } from './HistoricMap'

interface Shot {
  kind: 'title' | 'scene' | 'map' | 'end'
  title: string
  text: string
  image?: string
  kicker?: string
  mapSpec?: NonNullable<LessonPlan['scenes'][number]['maps']>[number]['spec']
}

const ART_ORDER: (keyof typeof art)[] = ['kaaba', 'badr', 'hikma', 'mongol', 'isfahan', 'renaissance', 'ch1', 'ch2', 'ch3', 'ch4']

function buildShots(lesson: Lesson, plan: LessonPlan): Shot[] {
  const shots: Shot[] = [
    {
      kind: 'title',
      kicker: `درس ${fas(lesson.id)} · ${lesson.span}`,
      title: lesson.title,
      text: plan.heroLine,
      image: art[plan.art]
    }
  ]

  let artIndex = ART_ORDER.indexOf(plan.art as keyof typeof art)

  plan.scenes.forEach((scene) => {
    const readPanel = scene.panels.find((p) => p.kind === 'read')
    const firstText =
      scene.takeaway ??
      (readPanel && readPanel.kind === 'read'
        ? readPanel.lead ?? readPanel.text ?? readPanel.bullets?.slice(0, 2).join('، ')
        : undefined) ??
      scene.panels
        .filter((p) => p.kind === 'read' || p.kind === 'quote' || p.kind === 'mnemonic')
        .map((p) => ('text' in p ? p.text : ''))
        .find(Boolean) ??
      lesson.keyPoints[0]

    const mapSpec = scene.maps?.[0]?.spec
    if (mapSpec) {
      shots.push({
        kind: 'map',
        kicker: 'نقشهٔ زنده',
        title: scene.title,
        text: mapSpec.phases[0]?.caption ?? firstText,
        mapSpec
      })
    } else {
      artIndex = (artIndex + 1) % ART_ORDER.length
      shots.push({
        kind: 'scene',
        kicker: `صحنهٔ ${fas(shots.length)}`,
        title: scene.title,
        text: String(firstText),
        image: art[ART_ORDER[artIndex]]
      })
    }
  })

  shots.push({
    kind: 'end',
    kicker: 'جمع‌بندی',
    title: plan.essence,
    text: lesson.keyPoints.slice(0, 3).join(' · '),
    image: art[plan.art]
  })

  return shots
}

const TEXT_MS = 8600

export function FilmMode({
  lesson,
  plan,
  open,
  onClose
}: {
  lesson: Lesson
  plan: LessonPlan
  open: boolean
  onClose: () => void
}) {
  const shots = useMemo(() => buildShots(lesson, plan), [lesson, plan])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [voice, setVoice] = useState(false)
  const [progress, setProgress] = useState(0)
  const startedAt = useRef(0)
  const elapsed = useRef(0)
  const raf = useRef<number | null>(null)
  const shot = shots[Math.min(index, shots.length - 1)]

  const duration = useMemo(() => {
    if (!shot) return TEXT_MS
    if (shot.kind === 'map') return (shot.mapSpec?.phases.length ?? 3) * 3600 + 2600
    if (shot.kind === 'title') return 7000
    if (shot.kind === 'end') return 12000
    return TEXT_MS
  }, [shot])

  useEffect(() => {
    if (!open) {
      setIndex(0)
      setProgress(0)
      setPlaying(true)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [open])

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= shots.length - 1) {
        setPlaying(false)
        return i
      }
      return i + 1
    })
    elapsed.current = 0
    setProgress(0)
  }, [shots.length])

  const prev = () => {
    setIndex((i) => Math.max(0, i - 1))
    elapsed.current = 0
    setProgress(0)
  }

  const restart = () => {
    setIndex(0)
    elapsed.current = 0
    setProgress(0)
    setPlaying(true)
  }

  /* جایگزینی تایمر با requestAnimationFrame تا نوار پیشرفت نرم باشد */
  useEffect(() => {
    if (!open) return
    startedAt.current = performance.now()
    if (!playing) return
    const step = (now: number) => {
      const p = Math.min(1, (elapsed.current + (now - startedAt.current)) / duration)
      setProgress(p)
      if (p >= 1) {
        elapsed.current = 0
        startedAt.current = now
        next()
        return
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      elapsed.current += performance.now() - startedAt.current
    }
  }, [open, playing, duration, index, next])

  /* خواندن متن هر صحنه */
  useEffect(() => {
    if (!open || !voice || !shot) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const text = shot.kind === 'map' ? `${shot.title}. ${shot.mapSpec?.phases[0]?.caption ?? ''}` : `${shot.title}. ${shot.text}`
    const utter = new SpeechSynthesisUtterance(text.slice(0, 420))
    utter.lang = 'fa-IR'
    utter.rate = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
    return () => window.speechSynthesis.cancel()
  }, [open, voice, index, shot])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      }
      if (e.key === 'ArrowLeft') next()
      if (e.key === 'ArrowRight') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, next, onClose])

  if (!open || !shot) return null

  return createPortal(
    <div className="cinema" role="dialog" aria-modal aria-label={`تماشای درس ${lesson.title}`}>
      {/* پس‌زمینه */}
      <AnimatePresence mode="sync">
        {shot.kind !== 'map' && shot.image && (
          <motion.div
            key={`bg-${index}`}
            className="cinema__bg"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1.14 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.2 }, scale: { duration: duration / 1000 + 4, ease: 'linear' } }}
            style={{ backgroundImage: `url(${shot.image})` }}
          />
        )}
      </AnimatePresence>
      <div className="cinema__veil" />
      <div className="cinema__grain" />

      {/* نوارهای پیشرفت */}
      <div className="cinema__bars">
        {shots.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              setIndex(i)
              elapsed.current = 0
              setProgress(0)
            }}
            className="cinema__bar"
            aria-label={s.title}
          >
            <span style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }} />
          </button>
        ))}
      </div>

      {/* سرصفحه */}
      <div className="cinema__top">
        <div className="flex items-center gap-2 text-[0.62rem] text-white/60">
          <Sparkles size={12} className="text-gold" />
          <span>تبار · تماشای درس</span>
          <span className="text-white/25">/</span>
          <span>{lesson.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={cn('cinema__btn', voice && 'text-gold')}
            onClick={() => setVoice((v) => !v)}
            aria-label={voice ? 'خاموش‌کردن روایت' : 'روشن‌کردن روایت'}
            title="روایت صوتی"
          >
            {voice ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button className="cinema__btn" onClick={onClose} aria-label="بستن">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* محتوا */}
      <div className="cinema__stage" data-kind={shot.kind}>
        {shot.kind === 'map' && shot.mapSpec ? (
          <motion.div
            key={`map-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="cinema__mapWrap"
          >
            <div className="cinema__mapHead">
              <div className="cinema__kicker">{shot.kicker} · {fas(index + 1)} از {fas(shots.length)}</div>
              <h2 className="cinema__title display">{shot.title}</h2>
            </div>
            <div className="cinema__map">
              <HistoricMap spec={shot.mapSpec} autoplay />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`text-${index}`}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="cinema__caption"
          >
            <div className="cinema__kicker">
              {shot.kicker ?? `صحنهٔ ${fas(index + 1)}`} <span className="text-white/25">·</span>{' '}
              {fas(index + 1)} از {fas(shots.length)}
            </div>
            <h2 className="cinema__title display">{shot.title}</h2>
            <p className="cinema__text">{shot.text}</p>
          </motion.div>
        )}

        {shot.kind === 'end' && (
          <div className="cinema__end">
            <button className="btn btn-gold" onClick={() => { onClose(); }}>
              <Play size={14} /> ادامهٔ درس به‌صورت صحنه‌به‌صحنه
            </button>
          </div>
        )}
      </div>

      {/* کنترل‌ها */}
      <div className="cinema__controls">
        <button className="cinema__btn" onClick={prev} disabled={index === 0} aria-label="صحنهٔ قبل">
          <ChevronRight size={18} />
        </button>
        <button className="cinema__play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'توقف' : 'پخش'}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="cinema__btn" onClick={next} disabled={index >= shots.length - 1} aria-label="صحنهٔ بعد">
          <ChevronLeft size={18} />
        </button>
        <span dir="ltr" className="mx-2 text-[0.58rem] text-white/40">{fas(index + 1)} / {fas(shots.length)}</span>
        <button className="cinema__btn" onClick={restart} aria-label="از ابتدا">
          <RotateCcw size={15} />
        </button>
        <span className="ms-auto hidden text-[0.58rem] text-white/35 sm:block">
          کلید فاصله: توقف/پخش · کلیدهای جهت: جابه‌جایی · Esc: خروج
        </span>
      </div>
    </div>,
    document.body
  )
}
