import { seedExams } from '@/data/seeds/exam'
import type { SeedExam, SeedQuestion } from '@/data/seeds/exam/seed-types'
import type { ExamSummary } from '@/lib/exam/db-exam'

/**
 * آزمون‌های نهایی — مستقیماً از همان فایل‌های seedای که دیتابیسِ سایت را پر
 * می‌کنند (`lib/exam/seed-data`). بیست‌ودو برگهٔ واقعیِ امتحان نهایی، با
 * بارم، کلید و توضیحِ هر سؤال، روی دستگاهِ کاربر.
 *
 * ⚠️ کلیدِ پاسخ اینجا هست — همان‌طور که روی سرور بود. تفاوت این است که
 * «سرور» حالا همان دستگاه است، پس پنهان‌کاری معنایی ندارد: کسی که به این
 * پرونده دسترسی دارد به هر حال می‌تواند کلِ برنامه را بخواند.
 */

const byKey = new Map<string, SeedExam>(seedExams.map((e) => [e.examSession, e]))

export function listExams(): readonly SeedExam[] {
  return seedExams
}

export function examSummaries(): ExamSummary[] {
  return seedExams.map((exam) => ({
    examKey: exam.examSession,
    title: exam.title,
    grade: exam.grade,
    subject: exam.subject,
    totalScore: exam.totalScore,
    questionCount: exam.sections.reduce((n, s) => n + s.questions.length, 0),
    createdAt: null
  }))
}

export function examByKey(key: string): SeedExam | null {
  return byKey.get(key) ?? null
}

export function examQuestion(examKey: string, questionNumber: number): SeedQuestion | null {
  const exam = byKey.get(examKey)
  if (!exam) return null
  for (const section of exam.sections) {
    const q = section.questions.find((x) => x.number === questionNumber)
    if (q) return q
  }
  return null
}

/** نخستین آزمونِ فهرست برای مهمان کاملاً باز است — همان قاعدهٔ سایت. */
export function freeExamKey(): string | null {
  return seedExams[0]?.examSession ?? null
}
