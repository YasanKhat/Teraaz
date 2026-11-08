import { useEffect, useState } from 'react'
import LessonPicker from '@/components/UI/doroos/LessonPicker'
import { getGrade } from '@/lib/doroos'
import type { Grade } from '@/lib/doroos/types'
import { NotFound } from './NotFound'

/** فهرستِ درس‌های یک کتاب.
 *
 *  روی وب این صفحه `generateStaticParams` داشت و پایه را از مسیر
 *  برمی‌داشت. اینجا همان کار را مسیریاب می‌کند و همان `LessonPicker` صدا
 *  زده می‌شود. */
export default function DoroosGrade({ gradeKey }: { gradeKey: string }) {
  const [grade, setGrade] = useState<Grade | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const found = getGrade(gradeKey)
    if (!found) setFailed(true)
    else setGrade(found as Grade)
  }, [gradeKey])

  if (failed) return <NotFound />
  if (!grade) return <div className="min-h-[60vh]" />
  return <LessonPicker grade={grade} />
}
