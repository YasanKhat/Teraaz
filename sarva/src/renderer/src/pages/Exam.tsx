import { useMemo } from 'react'
import ExamBrowser from '@/components/exam/ExamBrowser'
import { examSummaries } from '@/platform/exams'

/** امتحان‌های نهایی — برگه‌ها از همان seedهای سایت می‌آیند، با بارم و کلید. */
export default function Exam() {
  const exams = useMemo(() => examSummaries(), [])
  return <ExamBrowser exams={exams} />
}
