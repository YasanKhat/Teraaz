import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  MapPin,
  Search,
  SearchX,
  Sparkles
} from 'lucide-react'
import { figures, figureTypes } from '../data/figures'
import type { Figure } from '../data/types'
import { lessonById } from '../data/lessons'
import { timeline } from '../data/timeline'
import { bankItems } from '../data/bank'
import { chapterById } from '../data/chapters'
import { useProgress } from '../store/useProgress'
import { navigate } from '../lib/router'
import { cn, fas, normalizeFa } from '../lib/utils'
import { Empty, Modal } from './ui'

/** پرده‌ای که چهره در آن خوانده می‌شود — از نخستین درسی که در آن آمده است */
const chapterOf = (f: Figure) => lessonById(Math.min(...f.lessonIds))?.chapter ?? 1

/** نام کوتاه برای نشانِ حرفی */
const monogram = (name: string) => {
  const clean = name
    .replace(/\(.*?\)/g, '')
    .replace(/^(حضرت|امام|خواجه|شیخ|علامه|حکیم|سلطان|پاپ|میر)\s+/g, '')
    .replace(/^(ابن|ابو|ابونصر|ابوریحان)\s*/g, '')
    .trim()
  return clean.slice(0, 1) || name.slice(0, 1)
}

const LIFE = /(زاده|درگذشت|تولد|وفات|شهادت|حکومت|خلافت|سلطنت|بعثت|هجرت)/

export function FiguresGallery() {
  const [type, setType] = useState<string>('همه')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const visit = useProgress((s) => s.visit)
  const markQuest = useProgress((s) => s.markQuest)
  const bookmarks = useProgress((s) => s.bookmarks)
  const toggleBookmark = useProgress((s) => s.toggleBookmark)

  useEffect(() => {
    visit('figures')
  }, [visit])

  const list = useMemo(() => {
    const needle = normalizeFa(q.trim())
    return figures.filter((f) => {
      if (type !== 'همه' && f.type !== type) return false
      if (!needle) return true
      return normalizeFa(`${f.name} ${f.title} ${f.place} ${f.bio} ${f.works.join(' ')}`).includes(needle)
    })
  }, [type, q])

  /* قفسه‌ها: هر چهره در پرده‌ای که خوانده می‌شود، تا ترتیب مطالعه حفظ شود */
  const shelves = useMemo(() => {
    const order = [1, 2, 3, 4]
    return order
      .map((c) => ({
        chapter: c,
        title: chapterById(c)?.title ?? `پردهٔ ${fas(c)}`,
        accent: chapterById(c)?.accent ?? '#C9A227',
        rows: list
          .filter((f) => chapterOf(f) === c)
          .sort((a, b) => Math.min(...a.lessonIds) - Math.min(...b.lessonIds))
      }))
      .filter((s) => s.rows.length > 0)
  }, [list])

  const counts = useMemo(() => {
    const m: Record<string, number> = { همه: figures.length }
    for (const f of figures) m[f.type] = (m[f.type] ?? 0) + 1
    return m
  }, [])

  const active = figures.find((f) => f.id === open)
  const activeIndex = active ? figures.findIndex((f) => f.id === active.id) : -1
  const stepFigure = (d: number) => {
    const next = figures[(activeIndex + d + figures.length) % figures.length]
    if (next) setOpen(next.id)
  }

  return (
    <div>
      {/* ── جست‌وجو و صافی گونه‌ها ───────────────────────────────────── */}
      <div className="fig-tools">
        <div className="fig-search">
          <Search size={15} className="text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="نام، شهر یا نقش…"
            aria-label="جست‌وجوی چهره"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="پاک‌کردن" className="text-faint hover:text-ink">
              ×
            </button>
          )}
        </div>
        <div className="fig-chips">
          {figureTypes.map((t) => (
            <button key={t} className="chip shrink-0" data-active={type === t} onClick={() => setType(t)}>
              {t}
              <span className="text-[0.6rem] opacity-60">{fas(counts[t] ?? 0)}</span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={<SearchX size={26} />} title="چهره‌ای پیدا نشد" desc="عبارت دیگری را امتحان کن یا صافی را بردار." />
      ) : (
        <div className="fig-shelves">
          {shelves.map((shelf) => (
            <section key={shelf.chapter} className="fig-shelf">
              <header className="fig-shelf__head">
                <span className="fig-shelf__no" style={{ color: shelf.accent, borderColor: `color-mix(in oklab, ${shelf.accent} 40%, transparent)` }}>
                  {fas(shelf.chapter)}
                </span>
                <div className="min-w-0">
                  <div className="fig-shelf__title">{shelf.title}</div>
                  <div className="fig-shelf__sub">{fas(shelf.rows.length)} چهره در این پرده</div>
                </div>
                <span className="fig-shelf__rule" style={{ background: `linear-gradient(to left, ${shelf.accent}55, transparent)` }} />
              </header>

              <div className="fig-grid">
                {shelf.rows.map((f) => {
                  const saved = bookmarks.includes(`figure-${f.id}`)
                  const lessons = f.lessonIds.map((id) => lessonById(id)).filter(Boolean)
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setOpen(f.id)
                        markQuest('q-fact', 15)
                      }}
                      className="fig-card"
                      style={{ ['--fig-accent' as string]: f.accent }}
                    >
                      <span className="fig-card__glow" aria-hidden />
                      <span className="fig-card__arch">
                        <span className="fig-card__mono">{monogram(f.name)}</span>
                        <span className="fig-card__archLine" aria-hidden />
                      </span>
                      <span className="fig-card__body">
                        <span className="fig-card__name">{f.name}</span>
                        <span className="fig-card__title">{f.title}</span>
                        <span className="fig-card__meta">
                          <span className="fig-card__span">{f.span}</span>
                          {f.place && (
                            <span className="fig-card__place">
                              <MapPin size={9} /> {f.place.split('،')[0]}
                            </span>
                          )}
                        </span>
                        <span className="fig-card__foot">
                          <span className="fig-card__type">{f.type}</span>
                          <span className="fig-card__lessons">
                            {lessons.slice(0, 2).map((l) => (
                              <span key={l!.id}>درس {fas(l!.id)}</span>
                            ))}
                          </span>
                          {saved && <Bookmark size={10} className="text-gold" />}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={!!active} onClose={() => setOpen(null)} title={active?.name}>
        {active && (
          <FigureDetail
            figure={active}
            saved={bookmarks.includes(`figure-${active.id}`)}
            onBookmark={() => toggleBookmark(`figure-${active.id}`)}
            onPrev={() => stepFigure(-1)}
            onNext={() => stepFigure(1)}
            onClose={() => setOpen(null)}
          />
        )}
      </Modal>
    </div>
  )
}

/* ── پروندهٔ یک چهره: شناسنامه، زندگینامه، آثار، گره‌های زمانی و پرسش‌ها ── */

function FigureDetail({
  figure: f,
  saved,
  onBookmark,
  onPrev,
  onNext,
  onClose
}: {
  figure: Figure
  saved: boolean
  onBookmark: () => void
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  /* رویدادهای خط زمان که نام یا لقب این چهره در آن‌ها آمده است */
  const events = useMemo(() => {
    const keys = [f.name.replace(/\(.*?\)/g, '').trim(), ...f.name.split(/[\s()]+/).filter((w) => w.length > 3)]
    return timeline
      .filter((e) => keys.some((k) => k.length > 3 && `${e.title} ${e.desc}`.includes(k)))
      .sort((a, b) => a.year - b.year)
      .slice(0, 5)
  }, [f])

  /* پرسش‌هایی که نام این چهره در متنشان هست */
  const questions = useMemo(() => {
    const key = f.name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(-1)[0]
    if (!key || key.length < 3) return []
    return bankItems.filter((i) => i.q.includes(key)).slice(0, 4)
  }, [f])

  const lifeLines = f.bio
    .split(/(?<=[.!؟])\s+/)
    .filter((s) => LIFE.test(s))
    .slice(0, 3)

  return (
    <div className="fig-detail" style={{ ['--fig-accent' as string]: f.accent }}>
      <div className="fig-detail__head">
        <span className="fig-detail__arch">
          <span>{monogram(f.name)}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="fig-detail__eyebrow">{f.type}</div>
          <h3 className="fig-detail__name">{f.name}</h3>
          <p className="fig-detail__title">{f.title}</p>
          <div className="fig-detail__facts">
            <span>
              <CalendarDays size={11} /> {f.span}
            </span>
            {f.place && (
              <span>
                <MapPin size={11} /> {f.place}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="fig-detail__bio">
        {f.bio.split(/(?<=[.!؟])\s+/).map((sentence, i) => (
          <p key={i} className={i === 0 ? 'is-lead' : undefined}>
            {sentence}
          </p>
        ))}
      </div>

      {lifeLines.length > 0 && (
        <div className="fig-detail__strip">
          {lifeLines.map((line, i) => (
            <span key={i} className="fig-detail__stripItem">
              <Clock3 size={11} /> {line.replace(/\.$/, '')}
            </span>
          ))}
        </div>
      )}

      {f.works.length > 0 && (
        <div>
          <div className="fig-detail__label">آنچه از او ماند</div>
          <div className="fig-detail__works">
            {f.works.map((w) => (
              <span key={w} className="fig-work">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="fig-note">
        <span className="fig-note__tag">
          <Sparkles size={11} /> نکتهٔ امتحانی
        </span>
        <p>{f.note}</p>
      </div>

      {events.length > 0 && (
        <div>
          <div className="fig-detail__label">گره‌های زمانی</div>
          <ul className="fig-events">
            {events.map((e) => (
              <li key={e.id}>
                <span className="fig-events__date">{e.date}</span>
                <span className="fig-events__title">{e.title}</span>
                <span className="fig-events__cat">{e.cat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="fig-detail__label">در کدام درس‌ها؟</div>
        <div className="flex flex-wrap gap-1.5">
          {f.lessonIds.map((lid) => {
            const l = lessonById(lid)
            if (!l) return null
            return (
              <button
                key={lid}
                onClick={() => {
                  onClose()
                  navigate(`lesson/${lid}`)
                }}
                className="chip"
              >
                <BookOpen size={12} /> درس {fas(lid)}: {l.title}
              </button>
            )
          })}
        </div>
      </div>

      {questions.length > 0 && (
        <div>
          <div className="fig-detail__label">پرسش‌های مرتبط</div>
          <ul className="fig-questions">
            {questions.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onClose()
                    navigate(`bank/${item.lesson}?q=${encodeURIComponent(item.q.slice(0, 40))}`)
                  }}
                >
                  <ListChecks size={12} /> {item.q.length > 92 ? `${item.q.slice(0, 90)}…` : item.q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="fig-detail__foot">
        <div className="flex items-center gap-1.5">
          <button className="fig-nav" onClick={onPrev} aria-label="چهرهٔ پیشین">
            <ChevronRight size={15} />
          </button>
          <button className="fig-nav" onClick={onNext} aria-label="چهرهٔ بعدی">
            <ChevronLeft size={15} />
          </button>
          <button className={cn('btn btn-sm', saved ? 'btn-ghost text-gold' : 'btn-ghost')} onClick={onBookmark}>
            <Bookmark size={12} /> {saved ? 'نشان‌شده' : 'نشان‌کردن'}
          </button>
        </div>
        <button className="btn btn-gold btn-sm" onClick={onClose}>
          بستن <ArrowLeft size={13} />
        </button>
      </div>
    </div>
  )
}
