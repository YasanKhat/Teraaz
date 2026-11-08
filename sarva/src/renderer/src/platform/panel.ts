import * as db from './db'
import type { PanelOverview, PracticeArea } from '@/lib/panel/types'

/**
 * عددهای پنلِ کاربری.
 *
 * روی وب این‌ها با چند کوئریِ SQLِ تجمیعی و `CONVERT_TZ(…, 'Asia/Tehran')`
 * ساخته می‌شدند. اینجا همان تجمیع روی ردیف‌های محلی انجام می‌شود — و چون
 * منطقهٔ زمانیِ دستگاه همان منطقهٔ زمانیِ کاربر است، دیگر آن پرچمِ
 * `dayState: "unavailable"` معنایی ندارد: روزها همیشه درست‌اند.
 */

const AREAS: PracticeArea[] = ['aruz', 'vocab', 'exam', 'jasoos']

const ANSWER_TABLES: Record<PracticeArea, string[]> = {
  aruz: ['quiz_answers'],
  vocab: ['vocab_answers'],
  exam: [],
  jasoos: ['jasoos_answers']
}

export function panelOverview(userId: string | null): PanelOverview {
  if (!userId) {
    return {
      dayCounts: [],
      dayState: 'ok',
      counts: emptyCounts(),
      bookmarks: 0,
      exams: { attempts: 0, best: 0, average: 0 }
    }
  }

  const perDay = new Map<string, { total: number; correct: number }>()
  const counts = emptyCounts()

  const bump = (area: PracticeArea, day: string, correct: boolean) => {
    counts[area].total++
    if (correct) counts[area].correct++
    const key = `${day}|${area}`
    const row = perDay.get(key) ?? { total: 0, correct: 0 }
    row.total++
    if (correct) row.correct++
    perDay.set(key, row)
  }

  const dayOf = (iso: string) => String(iso ?? '').slice(0, 10)

  for (const area of AREAS) {
    for (const table of ANSWER_TABLES[area]) {
      for (const row of db.find<{ userId: string; createdAt: string; correct?: boolean; isCorrect?: boolean }>(
        table,
        (r) => r.userId === userId
      )) {
        bump(area, dayOf(row.createdAt), !!(row.correct ?? row.isCorrect))
      }
    }
  }

  // امتحان‌ها: هر تلاش یک ردیف با نمره.
  const attempts = db.find<{ userId: string; createdAt: string; totalScore: number; maxScore: number }>(
    'exam_attempts',
    (r) => r.userId === userId
  )
  for (const a of attempts) {
    counts.exam.total++
    if (a.maxScore > 0 && a.totalScore / a.maxScore >= 0.5) counts.exam.correct++
    bump('exam', dayOf(a.createdAt), a.maxScore > 0 && a.totalScore / a.maxScore >= 0.5)
  }

  const dayCounts = [...perDay.entries()].map(([key, v]) => {
    const [day, area] = key.split('|')
    return { day, area: area as PracticeArea, total: v.total, correct: v.correct }
  })

  const scores = attempts.filter((a) => a.maxScore > 0).map((a) => (a.totalScore / a.maxScore) * 20)

  return {
    dayCounts,
    dayState: 'ok',
    counts,
    bookmarks: db.find('bookmarks', (r) => r.userId === userId).length,
    exams: {
      attempts: attempts.length,
      best: scores.length ? Math.max(...scores) : 0,
      average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    }
  }
}

function emptyCounts(): Record<PracticeArea, { total: number; correct: number }> {
  const out = {} as Record<PracticeArea, { total: number; correct: number }>
  for (const area of AREAS) out[area] = { total: 0, correct: 0 }
  return out
}

/** آخرین تلاش‌های آزمونِ کاربر، برای جدولِ پنل. */
export function examAttempts(userId: string | null) {
  if (!userId) return []
  return db
    .find<{ id: string; examKey: string; totalScore: number; maxScore: number; createdAt: string }>(
      'exam_attempts',
      (r) => r.userId === userId
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({
      id: a.id,
      title: a.examKey,
      score: a.totalScore,
      maxScore: a.maxScore,
      createdAt: a.createdAt
    }))
}
