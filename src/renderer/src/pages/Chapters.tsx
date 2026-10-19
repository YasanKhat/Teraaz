import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpLeft, Check, Clock3, Map as MapIcon, Target } from 'lucide-react'
import { chapterPlans } from '../data/plans'
import { lessonById } from '../data/lessons'
import { art } from '../art'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'

export function Chapters() {
  const completed = useProgress((s) => s.completed)
  const [open, setOpen] = useState<number | null>(1)

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 mt-2 text-center">
        <div className="ornate-rule mb-4"><span /></div>
        <div className="kicker mb-2">فهرست کتاب</div>
        <h1 className="display text-[1.9rem] leading-[2.2] md:text-[2.4rem]">چهار پرده، شانزده درس</h1>
        <p className="mx-auto mt-2 max-w-xl text-[0.82rem] leading-8 text-muted">
          این فهرست را می‌توانی مثل نسخهٔ خطی ورق بزنی: هر پرده را باز کن، درس‌ها را ببین و از هر جا که خواستی شروع کن.
        </p>
        <div className="ornate-rule mt-4"><span /></div>
      </header>

      <div>
        {chapterPlans.map((ch, idx) => {
          const ids = ch.lessons.map((l) => l.lesson)
          const done = ids.filter((id) => completed.includes(id)).length
          const pct = Math.round((done / ids.length) * 100)
          const minutes = ids.reduce((s, id) => s + (lessonById(id)?.minutes ?? 0), 0)
          const maps = ch.lessons.reduce((s, l) => s + l.scenes.reduce((n, sc) => n + (sc.maps?.length ?? 0), 0), 0)
          const isOpen = open === ch.chapter
          return (
            <motion.article
              key={ch.chapter}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: idx * 0.04 }}
              className="border-t border-line py-4 first:border-t-0"
            >
              <button className="flex w-full items-start gap-3 text-start md:gap-5" onClick={() => setOpen(isOpen ? null : ch.chapter)} aria-expanded={isOpen}>
                <span className="bignum shrink-0">{fas(ch.chapter)}</span>
                <span className="min-w-0 flex-1 pt-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.56rem] tracking-[0.2em] text-gold">پردهٔ {fas(ch.chapter)}</span>
                    <span className="text-[0.56rem] text-faint">{fas(ids.length)} درس</span>
                    <span className="text-[0.56rem] text-faint">· {fas(minutes)} دقیقه</span>
                    {maps > 0 && <span className="flex items-center gap-0.5 text-[0.56rem] text-turq"><MapIcon size={9} /> {fas(maps)} نقشه</span>}
                  </span>
                  <span className="mt-0.5 block text-[1.12rem] font-black leading-8">{ch.tagline}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[0.72rem] leading-6 text-muted">{ch.intro}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="relative h-px flex-1 bg-line">
                      <span className="absolute inset-y-0 start-0 bg-gold" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-[0.56rem] tabular-nums text-faint">{fas(done)}/{fas(ids.length)}</span>
                  </span>
                </span>
                <span className="hidden shrink-0 overflow-hidden rounded-[46%_46%_0.6rem_0.6rem/34%_34%_0.6rem_0.6rem] border border-gold/25 sm:block">
                  <img src={art[ch.art]} alt="" className={cn('size-[86px] object-cover transition duration-700', isOpen ? 'scale-105' : 'opacity-70 grayscale-[30%]')} loading="lazy" />
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 ps-0 md:ps-16">
                  {ch.lessons.map((lp) => {
                    const l = lessonById(lp.lesson)
                    if (!l) return null
                    const isDone = completed.includes(l.id)
                    const scenes = lp.scenes.length
                    const checks = lp.scenes.reduce((n, s) => n + s.panels.filter((p) => p.kind === 'check').length, 0)
                    return (
                      <button key={l.id} onClick={() => navigate(`lesson/${l.id}`)} className="toc-row group">
                        <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border text-[0.5rem]', isDone ? 'border-turq/50 bg-turq/15 text-turq' : 'border-line text-faint')}>
                          {isDone ? <Check size={10} /> : fas(l.id)}
                        </span>
                        <span className="min-w-0">
                          <span className="text-[0.82rem] font-semibold group-hover:text-gold">{l.title}</span>
                          <span className="toc-row__leader mx-2 inline-block w-10 align-bottom" />
                          <span className="text-[0.6rem] text-faint">{fas(scenes)} صحنه · {fas(checks)} خودآزمایی</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-[0.56rem] text-faint">
                          <Clock3 size={10} /> {fas(l.minutes)}′
                        </span>
                      </button>
                    )
                  })}
                  <div className="mt-2 flex flex-wrap items-center gap-2 ps-7">
                    <button className="btn btn-gold btn-sm" onClick={() => navigate(`lesson/${ch.lessons.find((l) => !completed.includes(l.lesson))?.lesson ?? ids[0]}`)}>
                      {pct === 100 ? 'مرور پرده' : pct === 0 ? 'آغاز پرده' : 'ادامه'}
                    </button>
                    <button className="btn btn-sm" onClick={() => navigate(`chapter/${ch.chapter}`)}>
                      صفحهٔ پرده <ArrowUpLeft size={12} />
                    </button>
                    <button className="btn btn-sm" onClick={() => navigate(`recap/${ch.chapter}`)}>
                      <Target size={12} /> بازخوانی و آزمون فصل
                    </button>
                  </div>
                </div>
              )}
            </motion.article>
          )
        })}
        <div className="border-t border-line pt-4 text-center text-[0.62rem] text-faint">
          هر درس را می‌توانی مستقل بخوانی؛ اما ترتیب پرده‌ها، داستان کتاب است.
        </div>
      </div>
    </div>
  )
}
