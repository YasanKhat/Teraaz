import { ArrowLeft, ArrowUpLeft, Check, Clock3, Play, Quote, Target } from 'lucide-react'
import { chapterPlans } from '../data/plans'
import { chapterById } from '../data/chapters'
import { lessonById } from '../data/lessons'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { ChapterSignature } from '../components/ChapterSignature'

export function Chapter({ id }: { id?: string }) {
  const ch = chapterPlans.find((c) => c.chapter === Number(id)) ?? chapterPlans[0]
  const completed = useProgress((s) => s.completed)
  const progress = useProgress((s) => s.lessonProgress)
  const ids = ch.lessons.map((l) => l.lesson)
  const done = ids.filter((x) => completed.includes(x)).length
  const pct = Math.round((done / ids.length) * 100)
  const next = ch.lessons.find((l) => !completed.includes(l.lesson)) ?? ch.lessons[0]
  const idx = chapterPlans.findIndex((c) => c.chapter === ch.chapter)
  const prev = chapterPlans[idx - 1]
  const after = chapterPlans[idx + 1]

  const accent = chapterById(ch.chapter).accent

  return (
    <div className="relative space-y-10">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] opacity-[0.16] blur-3xl"
        style={{ background: `radial-gradient(55% 100% at 70% 0%, ${accent}, transparent 70%)` }}
      />
      <button className="text-[0.62rem] text-faint hover:text-gold" onClick={() => navigate('chapters')}>
        ← فهرست کتاب
      </button>

      {/* ── پرده: تصویر در طاق، متن در کنار ─────────────────────── */}
      <header className="grid items-end gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="bignum leading-none">{fas(ch.chapter)}</span>
            <div>
              <div className="text-[0.56rem] tracking-[0.24em] text-gold">پردهٔ {fas(ch.chapter)}</div>
              <div className="text-[0.56rem] text-faint">{fas(ids.length)} درس · {fas(ch.lessons.reduce((n, l) => n + l.scenes.length, 0))} صحنه</div>
            </div>
          </div>
          <h1 className="display text-[2rem] leading-[2] md:text-[2.6rem]">{ch.tagline}</h1>
          <p className="mt-2 max-w-xl text-[0.86rem] leading-8 text-muted">{ch.intro}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="btn btn-gold" onClick={() => navigate(`lesson/${next.lesson}`)}>
              {pct === 0 ? 'آغاز پرده' : pct === 100 ? 'مرور از آغاز' : 'ادامه'} <ArrowLeft size={14} />
            </button>
            <button className="btn btn-sm" onClick={() => navigate(`recap/${ch.chapter}`)}>
              <Target size={13} /> بازخوانی و آزمون پرده
            </button>
            <span className="text-[0.6rem] text-faint">{fas(done)} از {fas(ids.length)} درس</span>
          </div>
          <div className="mt-3 h-px w-full max-w-md bg-line">
            <div className="h-px bg-gold" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="arch aspect-[3/4] max-h-[300px] md:justify-self-end">
          <img src={art[ch.art]} alt="" />
          <div className="arch__veil" />
          <div className="arch__frame" />
          <div className="absolute inset-x-0 bottom-0 p-3 text-[0.58rem] text-white/80">
            <span className="text-gold">پردهٔ {fas(ch.chapter)}</span> · {fas(pct)}٪ خوانده شده
          </div>
        </div>
      </header>

      <div className="ornate-rule"><span /></div>

      {/* ── امضای ساختاری این پرده (متفاوت در هر فصل) ─────────── */}
      <ChapterSignature chapter={ch.chapter} />

      {/* ── فیلم‌نامهٔ درس‌ها ───────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="kicker">فیلم‌نامه</div>
            <h2 className="text-[1.05rem] font-black">درس‌ها، به ترتیب روایت</h2>
          </div>
          <span className="text-[0.6rem] text-faint">هر درس، یک فیلم و یک متن</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {ch.lessons.map((lp) => {
            const l = lessonById(lp.lesson)
            if (!l) return null
            const isDone = completed.includes(l.id)
            const read = progress[l.id] ?? 0
            const checks = lp.scenes.reduce((n, s) => n + s.panels.filter((p) => p.kind === 'check').length, 0)
            const maps = lp.scenes.reduce((n, s) => n + (s.maps?.length ?? 0), 0)
            return (
              <article
                key={l.id}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-xl border bg-surface/25 transition hover:border-gold/35',
                  isDone ? 'border-turq/35' : 'border-line'
                )}
              >
                <button onClick={() => navigate(`lesson/${l.id}`)} className="flex flex-1 items-stretch gap-3 p-3 text-start">
                  <div className="relative w-[78px] shrink-0 overflow-hidden rounded-lg border border-line/60 sm:w-[92px]">
                    <img src={art[lp.art]} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/10 to-transparent" />
                    <span className="absolute bottom-1 start-1 rounded bg-bg/75 px-1.5 py-0.5 text-[0.54rem] font-bold text-gold">
                      درس {fas(l.id)}
                    </span>
                    {isDone && (
                      <span className="absolute top-1 end-1 grid size-4 place-items-center rounded-full bg-turq text-bg">
                        <Check size={10} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[0.52rem] text-faint">
                      <span>{l.span}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Clock3 size={9} /> {fas(l.minutes)}′</span>
                      <span>· {fas(lp.scenes.length)} صحنه</span>
                      {checks > 0 && <span className="text-gold/80">· {fas(checks)} خودآزمایی</span>}
                      {maps > 0 && <span className="text-turq">· {fas(maps)} نقشه</span>}
                    </div>
                    <h3 className="mt-1 text-[0.95rem] font-black leading-7 group-hover:text-gold">{l.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-[0.68rem] leading-6 text-muted">{lp.question}</p>
                  </div>
                </button>
                {read > 0 && !isDone && (
                  <div className="mx-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-line"><div className="h-px bg-gold" style={{ width: `${read}%` }} /></div>
                    <span className="text-[0.52rem] text-faint">{fas(read)}٪</span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-3 border-t border-line/70 px-3 py-2 text-[0.58rem]">
                  <button className="flex items-center gap-1 font-semibold text-gold/85 transition hover:text-gold" onClick={() => navigate(`film/${l.id}`)}>
                    <Play size={9} /> تماشای درس
                  </button>
                  <span className="h-3 w-px bg-line" />
                  <button className="flex items-center gap-1 text-faint transition hover:text-ink" onClick={() => navigate(`lesson/${l.id}`)}>
                    خواندن صحنه‌به‌صحنه <ArrowLeft size={9} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── جمع‌بندی پرده ─────────────────────────────────────── */}
      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="kicker mb-1">داوری پرده</div>
          <div className="flex items-start gap-2">
            <Quote size={14} className="mt-1 shrink-0 text-gold/60" />
            <p className="text-[0.88rem] leading-9 text-ink/85">{ch.summary.verdict}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gold/22 bg-gold/[0.04] p-4">
          <div className="text-[0.58rem] tracking-widest text-gold">برای شب امتحان</div>
          <p className="mt-1 text-[0.72rem] leading-6 text-muted">{ch.summary.lastNight[0]}</p>
          <button className="mt-2 flex items-center gap-1 text-[0.66rem] text-gold" onClick={() => navigate(`recap/${ch.chapter}`)}>
            همهٔ نکته‌های شب امتحان <ArrowUpLeft size={11} />
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[0.68rem]">
        {prev ? (
          <button className="text-muted hover:text-gold" onClick={() => navigate(`chapter/${prev.chapter}`)}>
            ← پردهٔ {fas(prev.chapter)}: {prev.tagline}
          </button>
        ) : <span />}
        {after ? (
          <button className="text-muted hover:text-gold" onClick={() => navigate(`chapter/${after.chapter}`)}>
            پردهٔ {fas(after.chapter)}: {after.tagline} →
          </button>
        ) : <span />}
      </div>
    </div>
  )
}
