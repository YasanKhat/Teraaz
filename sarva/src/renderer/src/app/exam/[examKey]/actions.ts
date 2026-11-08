import { formatCorrectAnswer } from '@/lib/exam/format-answer'
import { gradePart } from '@/lib/exam/grading'
import { regradeAttempt } from '@/lib/exam/regrade'
import { examByKey, examQuestion } from '@/platform/exams'
import * as auth from '@/platform/auth'
import * as db from '@/platform/db'
import type { PartResult, QuestionResult } from '@/lib/exam/result-types'

/**
 * تصحیحِ آزمون — همان `app/exam/[examKey]/actions.ts`ِ سایت، بی‌کم‌وکاست،
 * با یک تفاوت: به‌جای پنج کوئری به Postgres، برگه از `platform/exams` می‌آید.
 *
 * ⚠️ همان دو قاعده‌ی سایت اینجا هم برقرار است:
 *
 *   ۱) کلیدِ پاسخ هرگز به کلاینت پیش از ارسال نمی‌رود (صفحه فقط
 *      `toClientExam` را می‌گیرد).
 *   ۲) نمره را «سرور» از روی برگهٔ واقعی حساب می‌کند
 *      (`regradeAttempt`)، نه از روی چیزی که مرورگر فرستاده.
 */

/** یک سؤال را تصحیح می‌کند و کلیدش را نمایش می‌دهد — بلافاصله پس از ارسالِ
 *  همان سؤال، تا بازخورد همان لحظه برسد نه در پایانِ برگه. */
export async function submitQuestion(
  examKey: string,
  questionNumber: number,
  answers: Record<number, unknown>
): Promise<QuestionResult> {
  const question = examQuestion(examKey, questionNumber)
  if (!question) throw new Error(`Unknown question: ${examKey}#${questionNumber}`)

  const parts: PartResult[] = question.parts.map((part, partIndex) => {
    if (part.gradingMode === 'exact_match') {
      const graded = gradePart(part, partIndex, answers[partIndex])
      return {
        label: part.label,
        score: graded.score,
        maxScore: graded.maxScore,
        status: graded.status,
        correctAnswerText: formatCorrectAnswer(part)
      }
    }
    // بخش‌های تشریحی خودکار تصحیح نمی‌شوند: دانش‌آموز پاسخِ درست را
    // می‌بیند و خودش نمره می‌دهد. این روی وب هم رفتارِ قطعی بود.
    return {
      label: part.label,
      score: 0,
      maxScore: part.score,
      status: 'needs_review',
      correctAnswerText: formatCorrectAnswer(part),
      selfGrade: true
    }
  })

  return { number: question.number, parts }
}

const MIN_ANSWERED_RATIO = 2 / 3

export type AttemptSaveResult =
  | { saved: true }
  | { saved: false; reason: 'guest' | 'too_few' | 'unknown_exam' }

export async function submitExamAttempt(
  examKey: string,
  questionResults: Record<number, QuestionResult>,
  answers?: Record<string, unknown>
): Promise<AttemptSaveResult> {
  const user = auth.currentUser()
  if (!user) return { saved: false, reason: 'guest' }

  const paper = examByKey(examKey)
  if (!paper) return { saved: false, reason: 'unknown_exam' }

  const safeAnswers: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(answers ?? {})) {
    if (Object.keys(safeAnswers).length >= 5000) break
    if (!/^\d{1,4}:\d{1,3}$/.test(key)) continue
    safeAnswers[key] = typeof value === 'string' ? value.slice(0, 4000) : value
  }

  const totalQuestions = paper.sections.reduce((n, s) => n + s.questions.length, 0)
  const { totalScore, maxScore, answeredQuestions, results } = regradeAttempt(
    paper,
    questionResults ?? {},
    safeAnswers
  )

  if (totalQuestions > 0 && answeredQuestions < Math.ceil(totalQuestions * MIN_ANSWERED_RATIO)) {
    return { saved: false, reason: 'too_few' }
  }
  if (maxScore === 0) return { saved: false, reason: 'too_few' }

  db.insert('exam_attempts', {
    id: db.uid(),
    userId: user.id,
    examKey,
    totalScore,
    maxScore,
    questionResults: results as unknown as object,
    answers: safeAnswers as unknown as object,
    createdAt: db.nowIso()
  })

  return { saved: true }
}
