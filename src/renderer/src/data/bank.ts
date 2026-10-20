import { lessons } from './lessons'
import { allLessonPlans } from './plans'
import tfBank from './tfBank.json'

export type BankKind = 'tf' | 'mcq' | 'term' | 'short'

export interface BankItem {
  id: string
  lesson: number
  kind: BankKind
  q: string
  options?: string[]
  /** گزینهٔ درست برای چهاگزینهای و درست/نادرست */
  correct?: number
  /** پاسخ کوتاه یا تشریحی */
  answer: string
  note?: string
}

const KIND_LABEL: Record<BankKind, string> = {
  tf: 'درست / نادرست',
  mcq: 'چهارگزینه‌ای',
  term: 'تعریف اصطلاح',
  short: 'پاسخ کوتاه و تشریحی',
}

export const kindLabel = (kind: BankKind) => KIND_LABEL[kind]

interface TfRow {
  id: string
  n: number
  lesson: number
  text: string
  value: boolean
  note: string
}

const tfItems: BankItem[] = (tfBank.items as TfRow[]).map((row) => ({
  id: `bank-${row.id}`,
  lesson: row.lesson,
  kind: 'tf',
  q: row.text,
  options: ['درست', 'نادرست'],
  correct: row.value ? 0 : 1,
  answer: row.value ? 'درست' : 'نادرست',
  note: row.note
}))

const mcqItems: BankItem[] = lessons.flatMap((lesson) =>
  lesson.quiz.map((q, i) => {
    // پرسش دوگزینه‌ای، در واقع درست/نادرست است؛ برچسبش هم باید همان باشد
    const twoWay = q.options.length === 2
    return {
      id: `bank-${lesson.id}-mcq-${q.id ?? i + 1}`,
      lesson: lesson.id,
      kind: (twoWay ? 'tf' : 'mcq') as BankKind,
      q: q.prompt,
      options: q.options,
      correct: q.answer,
      answer: q.options[q.answer] ?? '',
      note: q.explain
    }
  })
)

const termItems: BankItem[] = lessons.flatMap((lesson) =>
  lesson.terms.map((t, i) => ({
    id: `bank-${lesson.id}-term-${i + 1}`,
    lesson: lesson.id,
    kind: 'term' as const,
    q: `«${t.term}» را تعریف کنید.`,
    answer: t.def
  }))
)

const shortItems: BankItem[] = allLessonPlans.flatMap((plan) => {
  const recipe = plan.examRecipe.rows.map((row, i) => ({
    id: `bank-${plan.lesson}-short-r${i + 1}`,
    lesson: plan.lesson,
    kind: 'short' as const,
    q: row.q,
    answer: row.a
  }))
  const talk = plan.interview.map((row, i) => ({
    id: `bank-${plan.lesson}-short-i${i + 1}`,
    lesson: plan.lesson,
    kind: 'short' as const,
    q: row.q,
    answer: row.a
  }))
  return [...recipe, ...talk]
})

export const bankItems: BankItem[] = [...tfItems, ...mcqItems, ...termItems, ...shortItems]

export const bankByLesson = (lesson: number) => bankItems.filter((i) => i.lesson === lesson)

export const bankCounts = (() => {
  const perLesson: Record<number, number> = {}
  const perKind: Record<BankKind, number> = { tf: 0, mcq: 0, term: 0, short: 0 }
  for (const item of bankItems) {
    perLesson[item.lesson] = (perLesson[item.lesson] ?? 0) + 1
    perKind[item.kind]++
  }
  return { perLesson, perKind, total: bankItems.length }
})()
