import { useMemo } from 'react'
import ExamRunner from '@/components/exam/ExamRunner'
import { toClientExam } from '@/lib/exam/client-exam'
import { examByKey, freeExamKey } from '@/platform/exams'
import { NotFound } from './NotFound'

/**
 * اجرای یک امتحان نهایی.
 *
 * همان `ExamRunner`ِ سایت با همان دو قاعده: کلیدِ پاسخ تا پیش از ارسال به
 * مرورگر نمی‌رود (`toClientExam`) و تصحیح را «سرورِ محلی» انجام می‌دهد.
 *
 * مهمان می‌تواند نخستین آزمونِ فهرست را کامل بدهد — همان قاعده‌ای که روی
 * وب بود تا کسی پیش از ثبت‌نام بتواند سایت را امتحان کند.
 */
export default function ExamRun({ examKey }: { examKey: string }) {
  const payload = useMemo(() => {
    const exam = examByKey(examKey)
    if (!exam) return null
    return { exam: toClientExam(exam), guestAllowed: freeExamKey() === examKey }
  }, [examKey])

  if (!payload) return <NotFound />

  return (
    <ExamRunner
      examKey={examKey}
      exam={payload.exam}
      guestAllowed={payload.guestAllowed}
    />
  )
}
