import * as db from '@/platform/db'
import * as auth from '@/platform/auth'
import type { VocabAnswer } from '@/lib/panel/types'

/**
 * پاسخ‌های واژه‌یاب در پنل.
 *
 * روی وب: `getVocabAnswers(user.id, offset, PAGE_SIZE)` از دیتابیس.
 * اینجا: همان پنجره‌بندی روی ردیف‌های محلی.
 */

const PAGE_SIZE = 150

export async function loadMoreVocabAnswers(
  offset: number
): Promise<{ answers: VocabAnswer[]; hasMore: boolean }> {
  const user = auth.currentUser()
  if (!user) return { answers: [], hasMore: false }
  const safe = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0

  const rows = db
    .find<Record<string, unknown>>('vocab_answers', (r) => r.userId === user.id)
    .sort((a, b) => String(b.answeredAt ?? '').localeCompare(String(a.answeredAt ?? '')))

  const page = rows.slice(safe, safe + PAGE_SIZE)

  const answers: VocabAnswer[] = page.map((r) => ({
    id: String(r.id ?? ''),
    grade: String(r.grade ?? ''),
    lesson: (r.lesson as number) ?? null,
    word: String(r.word ?? ''),
    meaning: String(r.meaning ?? ''),
    image: String(r.image ?? ''),
    isCorrect: !!r.isCorrect,
    answeredAt: String(r.answeredAt ?? '')
  }))

  return { answers, hasMore: safe + PAGE_SIZE < rows.length }
}
