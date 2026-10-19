import { useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, CheckCircle2, Clock3 } from 'lucide-react'
import { lessons } from '../data/lessons'
import { baramTable, chapters, examBlueprint } from '../data/chapters'
import { useProgress } from '../store/useProgress'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { ChapterMotif, ProgressRing, SectionHead } from '../components/ui'
import { LessonCard } from '../components/LessonCard'

export function Lessons({ chapterId }: { chapterId?: string }) {
  const completed = useProgress((s) => s.completed)
  const [active, setActive] = useState<number | null>(chapterId ? Number(chapterId) : null)
  const progress = Math.round((completed.length / lessons.length) * 100)

  const list = useMemo(() => (active ? lessons.filter((l) => l.chapter === active) : lessons), [active])
  const totalMinutes = lessons.reduce((s, l) => s + l.minutes, 0)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.8rem] border border-line bg-gradient-to-bl from-surface/85 to-transparent px-5 py-7 md:px-8">
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="kicker mb-2">درس‌نامه‌ها</div>
            <h1 className="display text-[1.85rem] md:text-[2.2rem]">
              شانزده ایستگاه، یک <span className="gold-text">روایت</span>.
            </h1>
            <p className="mt-3 text-[0.86rem] leading-8 text-muted">
              هر درس با یک روایت کوتاه شروع می‌شود، با نکات امتحانی و حافظه‌یار ادامه پیدا می‌کند و با آزمون و کارت‌های مرور تثبیت می‌شود.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-[0.7rem] text-faint">
              <span className="flex items-center gap-1"><BookOpen size={13} /> {fas(lessons.length)} درس</span>
              <span className="flex items-center gap-1"><Clock3 size={13} /> حدود {fas(Math.round(totalMinutes / 60))} ساعت محتوا</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={13} /> {fas(completed.length)} درس کامل‌شده</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} size={116}>
              <div>
                <div className="text-xl font-black">{fas(progress)}٪</div>
                <div className="text-[0.58rem] text-faint">مسیر</div>
              </div>
            </ProgressRing>
          </div>
        </div>
      </section>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        <button className="chip shrink-0" data-active={active === null} onClick={() => setActive(null)}>
          همهٔ درس‌ها
        </button>
        {chapters.map((c) => (
          <button key={c.id} className="chip shrink-0" data-active={active === c.id} onClick={() => setActive(c.id)}>
            <span className="size-2 rounded-full" style={{ background: c.accent }} />
            فصل {fas(c.id)}: {c.title}
          </button>
        ))}
      </div>

      {chapters
        .filter((c) => !active || c.id === active)
        .map((c) => {
          const items = list.filter((l) => l.chapter === c.id)
          const done = items.filter((l) => completed.includes(l.id)).length
          return (
            <section key={c.id}>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl border border-line bg-surface2/60">
                  <ChapterMotif motif={c.motif} className="size-6 opacity-70" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">فصل {fas(c.id)}: {c.title}</h2>
                  <p className="text-[0.68rem] text-faint">{c.subtitle} · {fas(done)} از {fas(items.length)} خوانده شده</p>
                </div>
                <div className="ms-auto hidden text-[0.65rem] text-faint sm:block">{c.hint}</div>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((l) => (
                  <LessonCard key={l.id} lesson={l} />
                ))}
              </div>
            </section>
          )
        })}

      <section>
        <SectionHead
          kicker="راهبرد امتحان"
          title="بارم‌بندی نوبت اول و دوم"
          desc="بدان از هر درس چند نمره می‌آید تا وقتت را هوشمندانه تقسیم کنی. این جدول بر پایهٔ جدول بارم کتاب است."
        />
        <div className="surface overflow-x-auto p-4">
          <table className="tbl">
            <thead>
              <tr>
                <th>درس</th>
                <th>موضوع</th>
                <th>نوبت اول</th>
                <th>نوبت دوم</th>
                <th className="hidden sm:table-cell">اولویت</th>
              </tr>
            </thead>
            <tbody>
              {baramTable.map((row) => {
                const lesson = lessons.find((l) => l.id === row.lesson)
                const finalScore = row.final && row.final !== '—' ? parseFloat(row.final.replace('٫', '.')) : 0
                return (
                  <tr key={row.lesson}>
                    <td className="font-bold text-gold">{fas(row.lesson)}</td>
                    <td>{lesson?.title}</td>
                    <td>{row.mid ?? '—'}</td>
                    <td>{row.final ?? '—'}</td>
                    <td className="hidden sm:table-cell">
                      <span className={cn('tag', finalScore >= 2 && 'border-rose/40 text-rose')}>
                        {finalScore >= 2 ? 'پُرنمره' : finalScore >= 1.5 ? 'متوسط' : finalScore > 0 ? 'کم‌نمره' : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-2.5 md:grid-cols-2">
          {examBlueprint.map((b) => (
            <div key={b.row} className="surface flex items-start gap-3 p-3.5">
              <span className="tag shrink-0">{b.score} نمره</span>
              <div>
                <div className="text-[0.82rem] font-semibold">{b.row}</div>
                <div className="text-[0.68rem] leading-6 text-muted">{b.types}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button className="btn btn-gold" onClick={() => navigate('quiz')}>
            رفتن به آزمون‌ها <ArrowLeft size={15} />
          </button>
        </div>
      </section>
    </div>
  )
}
