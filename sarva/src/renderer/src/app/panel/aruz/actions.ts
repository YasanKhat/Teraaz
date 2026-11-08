import * as db from '@/platform/db'
import * as auth from '@/platform/auth'
import type { AruzAttempt, AruzAnswer } from '@/lib/panel/types'

/**
 * تلاش‌های آزمونِ عروض در پنل.
 *
 * روی وب: `getAruzAttempts(user.id, offset, PAGE_SIZE)` از دیتابیس.
 * اینجا: همان پنجره‌بندی روی ردیف‌های محلی.
 */

const PAGE_SIZE = 5

export async function loadMoreAruzAttempts(
  offset: number
): Promise<{ attempts: AruzAttempt[]; hasMore: boolean }> {
  const user = auth.currentUser()
  if (!user) return { attempts: [], hasMore: false }
  const safe = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0

  const attempts = db
    .find<{ id: string; userId: string; total: number; correct: number; createdAt: string }>(
      'quiz_attempts',
      (r) => r.userId === user.id
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const rows = attempts.slice(safe, safe + PAGE_SIZE)
  const answers = db.find<Record<string, unknown>>('quiz_answers', (r) => r.userId === user.id)

  const out: AruzAttempt[] = rows.map((a) => ({
    id: a.id,
    total: a.total,
    correct: a.correct,
    createdAt: a.createdAt,
    answers: answers
      .filter((r) => String(r.attemptId ?? '') === a.id)
      .map<AruzAnswer>((r) => ({
        id: String(r.id ?? ''),
        questionId: String(r.questionId ?? ''),
        selectedOptionId: (r.selectedOptionId as string) ?? null,
        isCorrect: !!r.isCorrect,
        answeredAt: String(r.answeredAt ?? '')
      }))
  }))

  return { attempts: out, hasMore: safe + PAGE_SIZE < attempts.length }
}
