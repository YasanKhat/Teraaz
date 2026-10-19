import { Bookmark, BookmarkCheck, ChevronLeft, Clock3, Play, Sparkles, Target, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Lesson, Chapter } from '../data/types'
import type { LessonPlan, ChapterPlan } from '../data/plans/types'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas, readingTime } from '../lib/utils'

export interface LessonHeroProps {
  lesson: Lesson
  plan: LessonPlan
  chapter: Chapter
  chapterPlan: ChapterPlan
  idxInChapter: number
  sceneCount: number
  readPct: number
  completed: boolean
  isBookmarked: boolean
  speaking: boolean
  onStart: () => void
  onFilm: () => void
  onExam: () => void
  onSpeak: () => void
  onBookmark: () => void
  onPrint?: () => void
}

function Crumbs({ chapter, lesson, light = false }: { chapter: Chapter; lesson: Lesson; light?: boolean }) {
  return (
    <div className={cn('mb-2 flex flex-wrap items-center gap-2 text-[0.6rem]', light ? 'text-white/70' : 'text-faint')}>
      <button className={light ? 'transition hover:text-white' : 'transition hover:text-gold'} onClick={() => navigate('chapters')}>فهرست کتاب</button>
      <ChevronLeft size={10} className="rotate-180" />
      <button className={light ? 'transition hover:text-white' : 'transition hover:text-gold'} onClick={() => navigate(`chapter/${chapter.id}`)}>
        پردهٔ {fas(chapter.id)}: {chapter.title}
      </button>
      <ChevronLeft size={10} className="rotate-180" />
      <span className="text-gold">درس {fas(lesson.id)}</span>
    </div>
  )
}

function Meta({ p, tone = 'muted' }: { p: LessonHeroProps; tone?: 'muted' | 'light' }) {
  const base = tone === 'light' ? 'text-white/65' : 'text-faint'
  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-[0.56rem]', base)}>
      <span className="text-gold">درس {fas(p.idxInChapter + 1)} از {fas(p.chapterPlan.lessons.length)}</span>
      <span>·</span>
      <span>{p.lesson.span}</span>
      <span>·</span>
      <span className="flex items-center gap-0.5"><Clock3 size={10} /> {readingTime(p.lesson.minutes)}</span>
      {p.lesson.baram.final && <span className={tone === 'light' ? 'text-turq' : 'text-turq'}>· بارم نهایی {p.lesson.baram.final}</span>}
      {p.completed && <span className="text-turq">· خوانده‌شده</span>}
    </div>
  )
}

function Actions({ p, light = false }: { p: LessonHeroProps; light?: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button className="btn btn-gold flex-1 sm:flex-none" onClick={p.onStart}>
        <Sparkles size={14} /> {p.readPct > 40 ? 'ادامهٔ صحنه‌ها' : 'آغاز درس'} · {fas(p.sceneCount)} صحنه
      </button>
      <button className="btn btn-sm" onClick={p.onFilm}><Play size={13} /> تماشای درس</button>
      <button className="btn btn-sm" onClick={p.onExam}><Target size={13} /> آزمون درس</button>
      <button className="btn btn-ghost btn-sm" onClick={p.onSpeak} aria-label="شنیدن خلاصه">
        {p.speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
      <button className={cn('btn btn-ghost btn-sm', p.isBookmarked && 'text-gold')} onClick={p.onBookmark} aria-label="نشان‌کردن">
        {p.isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      </button>
      <span className={cn('ms-auto hidden items-center gap-2 text-[0.56rem] sm:flex', light ? 'text-white/55' : 'text-faint')}>
        <span>پیشرفت</span>
        <span className={cn('h-[3px] w-16 overflow-hidden rounded-full', light ? 'bg-white/20' : 'bg-line/70')}>
          <span className="block h-full rounded-full bg-gold" style={{ width: `${p.readPct}%` }} />
        </span>
        <span className="tabular-nums text-gold/90">{fas(p.readPct)}٪</span>
      </span>
    </div>
  )
}

/* ── پردهٔ ۱: برگهٔ سند؛ درس مثل یک پروندهٔ آرشیوی ── */
function DossierHero(p: LessonHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-line bg-surface/25">
      <div className="grid md:grid-cols-[1fr_210px]">
        <div className="p-4 md:p-6">
          <Crumbs chapter={p.chapter} lesson={p.lesson} />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Meta p={p} />
              <h1 className="mt-1.5 text-[1.7rem] font-black leading-[1.7] md:text-[2.05rem]">{p.lesson.title}</h1>
            </div>
            <div className="shrink-0 text-end">
              <div className="text-[0.5rem] tracking-[0.2em] text-faint">پروندهٔ</div>
              <div className="font-mono text-[1.5rem] leading-none text-gold/80">{String(p.lesson.id).padStart(2, '0')}</div>
            </div>
          </div>
          <p className="mt-2 max-w-2xl border-s-2 border-gold/40 ps-3 text-[0.88rem] leading-8 text-muted">{p.plan.question}</p>
          <Actions p={p} />
        </div>
        <div className="relative order-first h-28 md:order-last md:h-auto">
          <img src={art[p.plan.art]} alt="" className="size-full object-cover md:absolute md:inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent md:bg-gradient-to-l md:from-bg md:via-bg/30 md:to-transparent" />
          <div className="absolute bottom-2 start-2 rounded border border-gold/40 bg-bg/70 px-1.5 py-0.5 font-mono text-[0.5rem] tracking-widest text-gold">
            ARCH. {String(p.lesson.id).padStart(3, '0')}
          </div>
        </div>
      </div>
    </header>
  )
}

/* ── پردهٔ ۲: محراب؛ ستون طاق‌دار ── */
function ArchHero(p: LessonHeroProps) {
  return (
    <header className="grid items-end gap-6 md:grid-cols-[minmax(0,620px)_260px] md:justify-between">
      <div className="min-w-0">
        <Crumbs chapter={p.chapter} lesson={p.lesson} />
        <div className="flex items-start gap-3">
          <span className="bignum hidden shrink-0 leading-none sm:block">{fas(p.lesson.id)}</span>
          <div className="min-w-0 pt-1">
            <Meta p={p} />
            <h1 className="mt-1 text-[1.7rem] font-black leading-[1.7] md:text-[2.15rem]">{p.lesson.title}</h1>
          </div>
        </div>
        <p className="mt-2 max-w-2xl border-s-2 border-gold/40 ps-3 text-[0.88rem] leading-8 text-muted">{p.plan.question}</p>
        <Actions p={p} />
      </div>
      <div className="arch order-first aspect-[16/9] w-full max-h-[190px] md:order-last md:aspect-[3/4] md:max-h-[270px] md:w-auto">
        <img src={art[p.plan.art]} alt="" />
        <div className="arch__veil" />
        <div className="arch__frame" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="text-[0.52rem] tracking-[0.18em] text-gold">پردهٔ {fas(p.chapter.id)}</div>
          <div className="display mt-0.5 text-[1rem] leading-7 text-white">{p.chapter.title}</div>
        </div>
      </div>
    </header>
  )
}

/* ── پردهٔ ۳: پردهٔ سینمایی تمام‌عرض ── */
function CinematicHero(p: LessonHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-gold/20">
      <img src={art[p.plan.art]} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/82 to-[#080b12]/35" />
      <div className="relative p-4 pb-5 md:p-7">
        <Crumbs chapter={p.chapter} lesson={p.lesson} light />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Meta p={p} tone="light" />
            <h1 className="mt-1.5 text-[1.75rem] font-black leading-[1.7] text-white md:text-[2.2rem]">{p.lesson.title}</h1>
            <p className="mt-1.5 max-w-2xl text-[0.88rem] leading-8 text-white/75">{p.plan.question}</p>
          </div>
          <div className="hidden shrink-0 text-end md:block">
            <div className="font-mono text-[2.2rem] leading-none text-gold/70">{fas(p.lesson.id)}</div>
            <div className="mt-1 text-[0.5rem] tracking-[0.2em] text-white/45">درس</div>
          </div>
        </div>
        <Actions p={p} light />
      </div>
    </header>
  )
}

/* ── پردهٔ ۴: صفحهٔ کتاب چاپی؛ شمارهٔ لاتین و تصویر کوچک در حاشیه ── */
function EditorialHero(p: LessonHeroProps) {
  return (
    <header className="relative border-b border-line pb-5">
      <Crumbs chapter={p.chapter} lesson={p.lesson} />
      <div className="grid gap-5 md:grid-cols-[1fr_170px]">
        <div className="min-w-0">
          <Meta p={p} />
          <h1 className="mt-1.5 text-[1.75rem] font-black leading-[1.65] md:text-[2.2rem]">{p.lesson.title}</h1>
          <p className="mt-2 max-w-2xl text-[0.92rem] leading-9 text-muted">
            <span className="me-1.5 text-[1.05rem] text-gold/70">«</span>
            {p.plan.question}
            <span className="ms-1 text-[1.05rem] text-gold/70">»</span>
          </p>
          <Actions p={p} />
        </div>
        <div className="order-first md:order-last">
          <div className="relative h-28 w-full overflow-hidden rounded-md border border-line md:h-36">
            <img src={art[p.plan.art]} alt="" className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent px-2 py-1 font-mono text-[0.48rem] tracking-[0.14em] text-gold/85">
              CH {String(p.chapter.id).padStart(2, '0')} · LE {String(p.lesson.id).padStart(2, '0')}
            </div>
          </div>
          <div className="mt-2 hidden text-[0.5rem] leading-5 tracking-[0.16em] text-faint md:block">
            {p.lesson.span}
          </div>
        </div>
      </div>
    </header>
  )
}

export function LessonHero(props: LessonHeroProps) {
  const Cmp =
    props.chapter.id === 1 ? DossierHero : props.chapter.id === 2 ? ArchHero : props.chapter.id === 3 ? CinematicHero : EditorialHero
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Cmp {...props} />
    </motion.div>
  )
}
