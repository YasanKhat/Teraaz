import { lessonById } from '../data/lessons'
import { chapterById } from '../data/chapters'
import { planByLesson } from '../data/plans'
import { navigate } from '../lib/router'
import { LessonFilm } from '../components/LessonFilm'

/**
 * ورود به درس = آغاز فیلم درس.
 * هیچ فهرست، واژه‌نامه یا بخشِ جداگانه‌ای در این صفحه نیست؛
 * همهٔ آموزش در قاب‌های پشت‌سرهمِ فیلم اتفاق می‌افتد.
 */
export function LessonExperience({ id, initialQuery = '' }: { id?: string; autoFilm?: boolean; openRead?: boolean; initialQuery?: string }) {
  const lesson = lessonById(Number(id))
  const plan = lesson ? planByLesson(lesson.id) : undefined
  const chapter = lesson ? chapterById(lesson.chapter) : undefined

  if (!lesson || !plan || !chapter) {
    return (
      <div className="surface p-8 text-center">
        <div className="text-lg font-bold">این درس پیدا نشد.</div>
        <button className="btn btn-gold mt-4" onClick={() => navigate('chapters')}>
          بازگشت به فصل‌ها
        </button>
      </div>
    )
  }

  return <LessonFilm lesson={lesson} plan={plan} chapter={chapter} jumpTo={initialQuery} />
}
