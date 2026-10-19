import { ArrowLeft, ArrowUpLeft, BookMarked, Check, Clock3, Landmark, ScrollText, Sparkles, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'

interface HeroProps {
  chapter: number
  tagline: string
  intro: string
  image: string
  lessonCount: number
  sceneCount: number
  done: number
  pct: number
  nextLesson: number
  onExam: () => void
}

function Actions({ pct, nextLesson, done, lessonCount, onExam, tone = 'gold' }: Omit<HeroProps, 'chapter' | 'tagline' | 'intro' | 'image' | 'sceneCount'> & { tone?: 'gold' | 'plain' }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={cn('btn', tone === 'gold' ? 'btn-gold' : 'btn')} onClick={() => navigate(`lesson/${nextLesson}`)}>
        {pct === 0 ? 'آغاز پرده' : pct === 100 ? 'مرور از آغاز' : 'ادامه'} <ArrowLeft size={14} />
      </button>
      <button className="btn btn-sm" onClick={onExam}>
        <Target size={13} /> بازخوانی و آزمون پرده
      </button>
      <span className="text-[0.6rem] text-faint">{fas(done)} از {fas(lessonCount)} درس</span>
    </div>
  )
}

/* ── پردهٔ ۱: کارگاه مورخ؛ بدون عکس، با کاغذ خط‌دار و حاشیه‌نویسی ── */
function ScholarHero(p: HeroProps) {
  return (
    <header className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--c-surface)_70%,transparent),transparent)] px-5 py-7 md:px-9 md:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, transparent 0 31px, color-mix(in oklab, var(--c-gold) 40%, transparent) 31px 32px)'
          }}
        />
        <div className="relative grid gap-6 md:grid-cols-[1fr_190px]">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[0.56rem] tracking-[0.24em] text-gold">
              <ScrollText size={11} /> پردهٔ {fas(p.chapter)} · کارگاه مورخ
            </div>
            <h1 className="display text-[2rem] leading-[1.95] md:text-[2.55rem]">{p.tagline}</h1>
            <p className="mt-2 max-w-xl text-[0.86rem] leading-8 text-muted">{p.intro}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.58rem] text-faint">
              <span>{fas(p.lessonCount)} درس</span>
              <span>{fas(p.sceneCount)} صحنه</span>
              <span className="flex items-center gap-1"><Clock3 size={10} /> {fas(p.done)} درس تمام‌شده</span>
            </div>
            <div className="mt-4">
              <Actions {...p} onExam={p.onExam} />
            </div>
          </div>
          <div className="relative hidden self-start rounded-lg border border-gold/25 bg-bg/40 p-3 md:block">
            <div className="mb-1 flex items-center gap-1 text-[0.52rem] text-gold"><BookMarked size={10} /> حاشیهٔ نسخه</div>
            <p className="text-[0.62rem] leading-7 text-muted">
              «هر خبر را با شش پرسش بسنج: چه کسی، چه وقت، کجا، چه گفت، چرا، و از چه راهی رسید؟»
            </p>
            <div className="mt-2 border-t border-dashed border-line pt-1.5 text-[0.5rem] text-faint">از درس ۲ — روش پژوهش</div>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ── پردهٔ ۲: طاق محرابی بلند، تصویر در ستون کنار ── */
function MihrabHero(p: HeroProps) {
  return (
    <header className="grid items-end gap-6 md:grid-cols-[minmax(0,600px)_240px] md:gap-10">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="bignum leading-none">{fas(p.chapter)}</span>
          <div>
            <div className="text-[0.56rem] tracking-[0.24em] text-gold">پردهٔ {fas(p.chapter)}</div>
            <div className="text-[0.56rem] text-faint">{fas(p.lessonCount)} درس · {fas(p.sceneCount)} صحنه</div>
          </div>
        </div>
        <h1 className="display text-[2rem] leading-[2] md:text-[2.6rem]">{p.tagline}</h1>
        <p className="mt-2 max-w-xl text-[0.86rem] leading-8 text-muted">{p.intro}</p>
        <div className="mt-4"><Actions {...p} onExam={p.onExam} /></div>
        <div className="mt-3 h-px w-full max-w-md bg-line">
          <div className="h-px bg-gold" style={{ width: `${p.pct}%` }} />
        </div>
      </div>
      <div className="arch aspect-[3/4] max-h-[320px] md:justify-self-end">
        <img src={p.image} alt="" />
        <div className="arch__veil" />
        <div className="arch__frame" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-[0.58rem] text-white/80">
          <span className="text-gold">پردهٔ {fas(p.chapter)}</span> · {fas(p.pct)}٪ خوانده شده
        </div>
      </div>
    </header>
  )
}

/* ── پردهٔ ۳: نواری سینمایی؛ تصویر تمام‌عرض زیر متن ── */
function CinematicHero(p: HeroProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-line">
      <img src={p.image} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/88 to-bg/45" />
      <div className="relative px-5 py-7 md:px-8 md:py-9">
        <div className="flex flex-wrap items-center gap-3 text-[0.56rem]">
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/35 px-2 py-0.5 text-gold">
            <Sparkles size={10} /> پردهٔ {fas(p.chapter)}
          </span>
          <span className="text-faint">{fas(p.lessonCount)} درس · {fas(p.sceneCount)} صحنه · {fas(p.pct)}٪</span>
        </div>
        <h1 className="display mt-2 max-w-2xl text-[2rem] leading-[2] md:text-[2.6rem]">{p.tagline}</h1>
        <p className="mt-2 max-w-xl text-[0.86rem] leading-8 text-ink/80">{p.intro}</p>
        <div className="mt-4"><Actions {...p} onExam={p.onExam} /></div>
      </div>
    </header>
  )
}

/* ── پردهٔ ۴: دو ستون، شرق و غرب، با قوس دوگانه ── */
function TwinHero(p: HeroProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-line bg-surface/30">
      <div className="grid md:grid-cols-[1.25fr_1fr]">
        <div className="p-5 md:p-8">
          <div className="mb-2 flex items-center gap-2 text-[0.56rem] tracking-[0.24em] text-gold">
            <Landmark size={11} /> پردهٔ {fas(p.chapter)} · دو جهان
          </div>
          <h1 className="display text-[2rem] leading-[1.95] md:text-[2.5rem]">{p.tagline}</h1>
          <p className="mt-2 max-w-lg text-[0.86rem] leading-8 text-muted">{p.intro}</p>
          <div className="mt-4"><Actions {...p} onExam={p.onExam} tone="plain" /></div>
        </div>
        <div className="relative hidden min-h-[240px] md:block">
          <img src={p.image} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--c-surface)] via-transparent to-transparent opacity-60" />
          <div className="absolute inset-y-0 end-[22%] w-px bg-gold/40" />
          <span className="absolute end-[6%] top-1/2 -translate-y-1/2 rotate-180 text-[0.5rem] tracking-[0.3em] text-gold/80 [writing-mode:vertical-rl]">شرق بیزانسی</span>
          <span className="absolute end-[27%] top-1/2 -translate-y-1/2 rotate-180 text-[0.5rem] tracking-[0.3em] text-ink/60 [writing-mode:vertical-rl]">غرب لاتینی</span>
        </div>
        <div className="relative h-36 md:hidden">
          <img src={p.image} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </div>
      </div>
    </header>
  )
}

export function ChapterHero(props: HeroProps) {
  const Cmp = props.chapter === 1 ? ScholarHero : props.chapter === 2 ? MihrabHero : props.chapter === 3 ? CinematicHero : TwinHero
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Cmp {...props} />
    </motion.div>
  )
}
