import { ArrowLeft, ArrowUpLeft, Check, Clock3, Library, ListChecks, Play, Quote, Target } from 'lucide-react'
import { chapterPlans } from '../data/plans'
import { chapterById } from '../data/chapters'
import { lessonById } from '../data/lessons'
import { art, type ArtKey } from '../art'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'
import { ChapterSignature } from '../components/ChapterSignature'
import { ChapterHero } from '../components/ChapterHero'
import { ChapterTimeline } from '../components/ChapterTimeline'
import { baramTable } from '../data/chapters'

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
  const lessonArt = (() => {
    const cycle: ArtKey[] = ['kaaba', 'badr', 'hikma', 'mongol', 'isfahan', 'renaissance', 'ch1', 'ch2', 'ch3', 'ch4']
    const used = new Set<ArtKey>()
    const map = new Map<number, ArtKey>()
    ch.lessons.forEach((lp) => {
      let key = lp.art
      if (used.has(key)) key = cycle.find((k) => !used.has(k)) ?? key
      used.add(key)
      map.set(lp.lesson, key)
    })
    return map
  })()
  const imgOf = (lessonId: number, fallback: ArtKey): ArtKey => lessonArt.get(lessonId) ?? fallback
  const layout: 'card' | 'wide' | 'compact' | 'poster' =
    ch.chapter === 2 ? 'wide' : ch.chapter === 3 ? 'compact' : ch.chapter === 4 ? 'poster' : 'card'

  return (
    <div className="relative space-y-10">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] opacity-[0.16] blur-3xl"
        style={{ background: `radial-gradient(55% 100% at 70% 0%, ${accent}, transparent 70%)` }}
      />
      <button className="text-[0.62rem] text-faint hover:text-gold" onClick={() => navigate('chapters')}>
        ← فهرست کتاب
      </button>

      <ChapterHero
        chapter={ch.chapter}
        tagline={ch.tagline}
        intro={ch.intro}
        image={art[ch.art]}
        lessonCount={ids.length}
        sceneCount={ch.lessons.reduce((n, l) => n + l.scenes.length, 0)}
        done={done}
        pct={pct}
        nextLesson={next.lesson}
        onExam={() => navigate(`recap/${ch.chapter}`)}
      />

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

        <div className={cn('grid gap-3', layout === 'wide' ? 'grid-cols-1' : layout === 'compact' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2')}>
          {ch.lessons.map((lp) => {
            const l = lessonById(lp.lesson)
            if (!l) return null
            const isDone = completed.includes(l.id)
            const read = progress[l.id] ?? 0
            const checks = lp.scenes.reduce((n, s) => n + s.panels.filter((p) => p.kind === 'check').length, 0)
            const maps = lp.scenes.reduce((n, s) => n + (s.maps?.length ?? 0), 0)
            const meta = (
              <div className="flex flex-wrap items-center gap-1.5 text-[0.52rem] text-faint">
                <span>{l.span}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Clock3 size={9} /> {fas(l.minutes)}′</span>
                <span>· {fas(lp.scenes.length)} صحنه</span>
                {checks > 0 && <span className="text-gold/80">· {fas(checks)} خودآزمایی</span>}
                {maps > 0 && <span className="text-turq">· {fas(maps)} نقشه</span>}
              </div>
            )
            const actions = (
              <div className="mt-2 flex items-center gap-3 border-t border-line/70 px-3 py-2 text-[0.58rem]">
                <button className="flex items-center gap-1 font-semibold text-gold/85 transition hover:text-gold" onClick={() => navigate(`film/${l.id}`)}>
                  <Play size={9} /> تماشای درس
                </button>
                <span className="h-3 w-px bg-line" />
                <button className="flex items-center gap-1 text-faint transition hover:text-ink" onClick={() => navigate(`lesson/${l.id}`)}>
                  خواندن صحنه‌به‌صحنه <ArrowLeft size={9} />
                </button>
                <button className="flex items-center gap-1 text-faint transition hover:text-turq" onClick={() => navigate(`book/${l.id}`)} title="متن کامل کتاب درسی، خط‌به‌خط و خلاصه">
                  <Library size={9} /> متن کتاب
                </button>
                <button className="ms-auto flex items-center gap-1 text-faint transition hover:text-gold" onClick={() => navigate(`bank/${l.id}`)} title="همهٔ سؤال‌های این درس">
                  <ListChecks size={9} /> سؤال‌ها
                </button>
              </div>
            )

            if (layout === 'wide') {
              return (
                <article key={l.id} className={cn('group flex flex-col overflow-hidden rounded-xl border bg-surface/25 transition hover:border-gold/35 sm:flex-row', isDone ? 'border-turq/35' : 'border-line')}>
                  <button onClick={() => navigate(`lesson/${l.id}`)} className="relative w-full shrink-0 overflow-hidden sm:w-[300px]">
                    <img src={art[imgOf(l.id, lp.art)]} alt="" className="h-32 w-full object-cover transition duration-700 group-hover:scale-[1.04] sm:h-full" />
                    <div className="absolute inset-0 bg-gradient-to-l from-bg/70 via-bg/10 to-transparent" />
                    <span className="absolute bottom-2 start-2 rounded bg-bg/75 px-1.5 py-0.5 text-[0.54rem] font-bold text-gold">درس {fas(l.id)}</span>
                  </button>
                  <div className="min-w-0 flex-1 p-3.5">
                    <button onClick={() => navigate(`lesson/${l.id}`)} className="w-full text-start">
                      {meta}
                      <h3 className="mt-1 text-[0.98rem] font-black leading-7 group-hover:text-gold">{l.title}</h3>
                      <p className="mt-0.5 line-clamp-2 text-[0.7rem] leading-6 text-muted">{lp.question}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.58rem] text-faint">
                        {lp.scenes.slice(0, 4).map((sc) => (
                          <span key={sc.title} className="flex items-center gap-1">
                            <span className="size-1 rounded-full bg-gold/60" /> {sc.title}
                          </span>
                        ))}
                      </div>
                    </button>
                    {read > 0 && !isDone && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${read}%` }} /></div>
                        <span className="text-[0.52rem] text-faint">{fas(read)}٪</span>
                      </div>
                    )}
                    {actions}
                  </div>
                </article>
              )
            }

            if (layout === 'compact') {
              return (
                <article key={l.id} className={cn('group flex flex-col rounded-xl border px-3 py-2.5 transition hover:border-gold/35', isDone ? 'border-turq/35' : 'border-line')}>
                  <button onClick={() => navigate(`lesson/${l.id}`)} className="text-start">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[0.56rem] font-bold tabular-nums text-gold">{fas(l.id)}</span>
                      {read > 0 && <span className="text-[0.5rem] tabular-nums text-faint">{fas(read)}٪</span>}
                    </div>
                    <h3 className="mt-0.5 text-[0.86rem] font-black leading-6 group-hover:text-gold">{l.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-[0.64rem] leading-5 text-muted">{lp.question}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[0.5rem] text-faint">
                      <span>{fas(lp.scenes.length)} صحنه</span>
                      <span>·</span>
                      <span>{fas(l.minutes)}′</span>
                      {maps > 0 && <span className="text-turq">· {fas(maps)} نقشه</span>}
                    </div>
                  </button>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/60 pt-1.5 text-[0.52rem]">
                    <button className="flex items-center gap-1 text-gold/85 hover:text-gold" onClick={() => navigate(`film/${l.id}`)}><Play size={9} /> تماشا</button>
                    <button className="flex items-center gap-1 text-faint hover:text-ink" onClick={() => navigate(`lesson/${l.id}`)}>خواندن <ArrowLeft size={9} /></button>
                  </div>
                </article>
              )
            }

            if (layout === 'poster') {
              return (
                <article key={l.id} className="group relative overflow-hidden rounded-xl border border-gold/20">
                  <img
                    src={art[imgOf(l.id, lp.art)]}
                    alt=""
                    className="absolute inset-0 size-full object-cover transition duration-[1200ms] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/72 to-[#080b12]/15" />
                  <div className="relative p-4 pt-16">
                    <button onClick={() => navigate(`lesson/${l.id}`)} className="w-full text-start">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.54rem] font-bold tracking-widest text-gold">درس {fas(l.id)}</span>
                        {isDone && <Check size={12} className="text-turq" />}
                      </div>
                      <h3 className="mt-1 text-[1.1rem] font-black leading-8 text-white">{l.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[0.7rem] leading-6 text-white/75">{lp.question}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.52rem] text-white/55">
                        <span>{l.span}</span>
                        <span>·</span>
                        <span>{fas(lp.scenes.length)} صحنه</span>
                        <span>·</span>
                        <span>{fas(l.minutes)}′</span>
                        {maps > 0 && <span className="text-turq/90">· {fas(maps)} نقشه</span>}
                      </div>
                    </button>
                    <div className="mt-3 flex items-center gap-3 border-t border-white/15 pt-2 text-[0.58rem]">
                      <button className="flex items-center gap-1 font-semibold text-gold transition hover:text-gold2" onClick={() => navigate(`film/${l.id}`)}>
                        <Play size={9} /> تماشای درس
                      </button>
                      <span className="h-3 w-px bg-white/20" />
                      <button className="flex items-center gap-1 text-white/65 transition hover:text-white" onClick={() => navigate(`lesson/${l.id}`)}>
                        خواندن صحنه‌به‌صحنه <ArrowLeft size={9} />
                      </button>
                    </div>
                  </div>
                </article>
              )
            }

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
                    <img src={art[imgOf(l.id, lp.art)]} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
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
                    {meta}
                    <h3 className="mt-1 text-[0.95rem] font-black leading-7 group-hover:text-gold">{l.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-[0.68rem] leading-6 text-muted">{lp.question}</p>
                  </div>
                </button>
                {read > 0 && !isDone && (
                  <div className="mx-3 flex items-center gap-2">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold" style={{ width: `${read}%` }} /></div>
                    <span className="text-[0.52rem] text-faint">{fas(read)}٪</span>
                  </div>
                )}
                {actions}
              </article>
            )
          })}
        </div>
      </section>

      {/* ── سالشمار و بارم این پرده ────────────────────────────── */}
      <section className="grid gap-5 md:grid-cols-[1.35fr_1fr]">
        <ChapterTimeline lessons={ids} accent={accent} />
        <div className="rounded-xl border border-line bg-surface/35 p-4">
          <div className="kicker mb-2">بارم‌بندی این پرده</div>
          <div className="space-y-1.5">
            {ids.map((lid) => {
              const row = baramTable.find((b) => b.lesson === lid)
              const l = lessonById(lid)
              if (!l) return null
              return (
                <div key={lid} className="flex items-center justify-between gap-2 text-[0.7rem]">
                  <button className="min-w-0 truncate text-start text-ink/85 hover:text-gold" onClick={() => navigate(`lesson/${lid}`)}>
                    {fas(lid)}. {l.title}
                  </button>
                  <span className="flex shrink-0 items-center gap-2 text-[0.58rem]">
                    {row?.mid && <span className="text-turq">نوبت اول {row.mid}</span>}
                    {row?.final && <span className="text-gold">نهایی {row.final}</span>}
                  </span>
                </div>
              )
            })}
          </div>
          <button className="mt-3 flex items-center gap-1 text-[0.66rem] text-gold" onClick={() => navigate(`recap/${ch.chapter}`)}>
            شب امتحان این پرده <ArrowUpLeft size={11} />
          </button>
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
