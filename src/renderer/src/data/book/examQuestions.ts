/**
 * پرسش‌های خودِ کتاب درسی، با پاسخ.
 *
 * بانک خام (questionBank.json) از «سؤال‌های امتحانی» هر درس و پاسخ‌نامهٔ
 * انتهای کتاب ساخته شده است. این ماژول آن را به شکل خوانا برای فیلم درس و
 * صفحهٔ شب امتحان آماده می‌کند: نوع پرسش، متن، گزینه‌ها و پاسخ.
 */
import raw from '../questionBank.json'

type RawAnswer = {
  kind: 'tf' | 'option' | 'text'
  value?: boolean
  index?: number
  text?: string
}

interface RawItem {
  id: string
  n: number
  lesson: number
  type: string
  q: string
  options?: string[]
  a: RawAnswer
}

export interface BookQuestion {
  id: string
  n: number
  lesson: number
  kind: string
  kindLabel: string
  q: string
  options?: string[]
  /** پاسخِ آماده برای نمایش */
  answer: string
  /** درست/نادرست */
  truth?: boolean
}

const KIND_LABEL: Record<string, string> = {
  tf: 'درست / نادرست',
  mcq: 'چهارگزینه‌ای',
  match: 'جورکردنی',
  blank: 'جای خالی',
  short: 'پاسخ کوتاه',
  term: 'تعریف اصطلاح',
  compare: 'مقایسه',
  opinion: 'اظهار نظر',
  list: 'فهرست و طبقه‌بندی',
  essay: 'تشریحی'
}

const FA = '۰۱۲۳۴۵۶۷۸۹'
const toFa = (s: string) => s.replace(/\d/g, (d) => FA[Number(d)])

const clean = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/\s+([،؛.!؟])/g, '$1')
    .trim()

function toQuestion(row: RawItem): BookQuestion {
  const a = row.a ?? { kind: 'text', text: '' }
  let answer = clean(a.text ?? '')
  let truth: boolean | undefined
  if (a.kind === 'tf') {
    truth = !!a.value
    answer = truth ? 'درست' : 'نادرست'
  } else if (a.kind === 'option' && row.options && a.index != null) {
    answer = `${toFa(String(a.index + 1))}) ${row.options[a.index] ?? ''}`
  }
  return {
    id: row.id,
    n: row.n,
    lesson: row.lesson,
    kind: row.type,
    kindLabel: KIND_LABEL[row.type] ?? 'پرسش',
    q: clean(row.q),
    options: row.options,
    answer,
    truth
  }
}

const all: BookQuestion[] = (raw as { items: RawItem[] }).items.map(toQuestion)

export const bookQuestions = all.filter((q) => q.q.length > 12 && q.answer.length > 1)

export const bookQuestionsOf = (lesson: number): BookQuestion[] =>
  bookQuestions.filter((q) => q.lesson === lesson)

/** پرسش‌های کوتاه و پرتکرار هر درس — برای قاب‌های «پرسش کتاب» در فیلم */
export const examQuestionsOf = (lesson: number, limit = 8): BookQuestion[] => {
  const pool = bookQuestionsOf(lesson)
  const order = ['tf', 'mcq', 'blank', 'short', 'match', 'term', 'list', 'compare', 'opinion', 'essay']
  return [...pool]
    .sort((a, b) => {
      const d = order.indexOf(a.kind) - order.indexOf(b.kind)
      return d !== 0 ? d : a.n - b.n
    })
    .slice(0, limit)
}

export const bookQuestionStats = {
  total: bookQuestions.length,
  perLesson: (lesson: number) => bookQuestionsOf(lesson).length
}
