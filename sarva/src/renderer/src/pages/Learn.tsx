import LearnHub from '@/components/learn/hub/LearnHub'
import LessonPlayer from '@/components/learn/LessonPlayer'
import { LESSONS, LESSON_GROUPS, lessonCard, lessonBySlug } from '@/lib/learn'
import { NotFound } from './NotFound'

/**
 * درسنامهٔ تعاملیِ آرایه و دستور.
 *
 * یازده درسِ دستور (نهاد تا صفت) و شش درسِ آرایه (تشبیه تا متناقض‌نما) —
 * همه با همان `LessonPlayer`ِ سایت و همان محتوا.
 *
 * ⚠️ روی وب بعضی درس‌ها پشتِ «ورود» بودند. اینجا نیازی نیست: کلِ محتوا روی
 * دستگاهِ خودِ کاربر است و گیت فقط مانع می‌ساخت.
 */
export default function Learn({ slug }: { slug?: string }) {
  if (!slug) return <LearnHub groups={LESSON_GROUPS} cards={LESSONS.map(lessonCard)} />

  const lesson = lessonBySlug(slug)
  if (!lesson) return <NotFound />
  return <LessonPlayer lesson={lesson} />
}
