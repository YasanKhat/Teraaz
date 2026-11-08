import { useEffect, useState } from 'react'
import ExamNightHub from '@/components/UI/shab-emtehan/ExamNightHub'
import { reviewGrades, type ReviewGrade } from '@/lib/doroos/exam-night'

/**
 * شبِ امتحان — مرورِ شبانه، از همان کاتالوگِ درس‌ها.
 *
 * روی وب این یک صفحهٔ سروری بود و `reviewGrades()` را همان‌جا صدا می‌زد. اینجا
 * همان تابع را صدا می‌زنیم، فقط نتیجه بعد از آماده‌شدن می‌آید — پس تا آن لحظه
 * یک نشانِ بارگذاری نشان می‌دهیم تا صفحه خالی دیده نشود.
 */
export default function ShabEmtehan() {
  const [grades, setGrades] = useState<ReviewGrade[] | null>(null)

  useEffect(() => {
    let alive = true
    void reviewGrades().then((list) => {
      if (alive) setGrades(list)
    })
    return () => {
      alive = false
    }
  }, [])

  if (!grades) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <ExamNightHub grades={grades} />
}
