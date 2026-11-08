import { useEffect, useState } from 'react'
import LessonView from '@/components/UI/doroos/LessonView'
import { getGrade, getLesson, parseLessonNumber, isLessonInBook } from '@/lib/doroos'
import type { Grade, Lesson } from '@/lib/doroos/types'
import { Link } from '@/app/router'
import { NotFound } from './NotFound'

/**
 * یک درس — همان سه حالتی که صفحهٔ وب داشت:
 *
 *   ۱) پایه یا شماره بی‌معنی است      → «پیدا نشد»
 *   ۲) درس در کتاب هست، محتوا نه     → «به‌زودی»
 *   ۳) محتوا هست                     → خودِ درس
 *
 * ⚠️ تفاوتِ مهم با وب: آنجا «تحلیلِ بیت» (نقشِ دستوری و آرایه‌ها) پشتِ
 * سروا پلاس بود و از `/api/v1/doroos/analysis` می‌آمد. اینجا کلِ محتوا روی
 * دستگاهِ خودِ کاربر است، پس `toPublicLesson` صدا زده نمی‌شود — درس با
 * نقش‌ها و آرایه‌های کاملش نمایش داده می‌شود.
 */
export default function DoroosLesson({ gradeKey, lessonNo }: { gradeKey: string; lessonNo: string }) {
  const [state, setState] = useState<{ grade: Grade; lesson: Lesson } | null>(null)
  const [status, setStatus] = useState<'loading' | 'missing' | 'pending' | 'ready'>('loading')

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setState(null)

    const grade = getGrade(gradeKey)
    const number = parseLessonNumber(lessonNo)

    if (!grade || number === null || !isLessonInBook(number)) {
      setStatus('missing')
      return
    }

    void (async () => {
      const lesson = await getLesson(gradeKey, number)
      if (!alive) return
      if (!lesson) {
        setStatus('pending')
        return
      }
      setState({ grade: grade as Grade, lesson })
      setStatus('ready')
    })()

    return () => {
      alive = false
    }
  }, [gradeKey, lessonNo])

  if (status === 'missing') return <NotFound />

  if (status === 'pending') {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-black text-foreground">این درس هنوز نوشته نشده</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          این درس در کتاب هست، ولی شرحش هنوز آماده نیست. به‌محض نوشته‌شدن اینجا می‌آید.
        </p>
        <Link
          href={`/doroos/${gradeKey}`}
          className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground"
        >
          برگشت به فهرستِ کتاب
        </Link>
      </div>
    )
  }

  if (status === 'loading' || !state) {
    return <div className="min-h-[60vh]" aria-busy="true" />
  }

  return <LessonView grade={state.grade} lesson={state.lesson} />
}
