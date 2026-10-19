import { ArrowLeft, Check, Clock3 } from 'lucide-react'
import type { Lesson } from '../data/types'
import { chapterById } from '../data/chapters'
import { navigate } from '../lib/router'
import { cn, fas } from '../lib/utils'
import { useProgress } from '../store/useProgress'

export function LessonCard({ lesson, compact }: { lesson: Lesson; compact?: boolean }) {
  const completed = useProgress((s) => s.completed.includes(lesson.id))
  const progress = useProgress((s) => s.lessonProgress[lesson.id] ?? 0)
  const chapter = chapterById(lesson.chapter)

  return (
    <button
      onClick={() => navigate(`lesson/${lesson.id}`)}
      className="card-hover group relative overflow-hidden rounded-2xl border border-line bg-surface/70 p-4 text-right"
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      <div
        className="pointer-events-none absolute -left-8 -top-10 size-32 rounded-full opacity-[0.14] blur-2xl transition group-hover:opacity-25"
        style={{ background: lesson.accent }}
      />
      <div className="relative flex items-start gap-3.5">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-xl border text-lg font-black"
          style={{
            color: lesson.accent,
            borderColor: `color-mix(in oklab, ${lesson.accent} 35%, var(--c-line))`,
            background: `color-mix(in oklab, ${lesson.accent} 10%, transparent)`
          }}
        >
          {completed ? <Check size={20} /> : fas(lesson.id)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[0.64rem] text-faint">
            <span>{chapter.title}</span>
            <span>·</span>
            <span>{lesson.era}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-[0.95rem] font-bold leading-6">{lesson.title}</h3>
          {!compact && <p className="mt-1 line-clamp-2 text-[0.75rem] leading-6 text-muted">{lesson.tagline}</p>}
        </div>
      </div>

      <div className="relative mt-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[0.65rem] text-faint">
          <span className="flex items-center gap-1">
            <Clock3 size={11} /> {fas(lesson.minutes)} دقیقه
          </span>
          <span className="flex items-center gap-1">
            {'●'.repeat(lesson.level)}
            <span className="opacity-25">{'●'.repeat(3 - lesson.level)}</span>
          </span>
          {lesson.baram.final && <span className="tag">بارم {lesson.baram.final}</span>}
        </div>
        <span className="flex items-center gap-1 text-[0.7rem] text-gold opacity-0 transition group-hover:opacity-100">
          خواندن <ArrowLeft size={13} />
        </span>
      </div>

      <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-line">
        <div
          className={cn('h-full rounded-full transition-all', completed && 'bg-turq')}
          style={{ width: `${progress}%`, background: completed ? undefined : lesson.accent }}
        />
      </div>
    </button>
  )
}
