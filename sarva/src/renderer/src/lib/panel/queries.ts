import { quizQuestionWeight } from '@/lib/quiz/weight'
import { quizBank, type QuizQuestion } from '@/platform/quiz-bank'
import { getCurrentUser } from '@/lib/auth/current-user'
import * as db from '@/platform/db'
import type {
  AruzAttempt,
  AruzOption,
  AruzQuestionType,
  Bookmark,
  BookmarkArea,
  ExamAttempt,
  PanelOverview,
  PanelUser,
  PracticeArea,
  RangAraAnswer,
  VocabAnswer
} from '@/lib/panel/types'

/**
 * خواندنِ پنل کاربر — نسخهٔ دسکتاپ.
 *
 * این همان `lib/panel/queries.ts`ِ سرواست با یک تفاوت: به‌جای ۲۱ کوئریِ SQL،
 * ردیف‌ها از فروشگاهِ محلی خوانده می‌شوند. امضاها، نام‌ها و **معنا**ی هر تابع
 * همان است، چون شانزده صفحهٔ پنل و چندین کامپوننت با همین نام‌ها صدایشان
 * می‌زنند و تغییرِ شکل یعنی بازنویسیِ همهٔ آن‌ها.
 *
 * ⚠️ ستون‌های فروشگاهِ محلی camelCase است (`isCorrect`, `answeredAt`) و نه
 * snake_caseِ دیتابیس (`is_correct`, `answered_at`)؛ پس هر جا نسخهٔ اصلی یک
 * ردیفِ خام می‌خواند، اینجا نامِ محلی نوشته شده.
 *
 * ⚠️ آن گاردِ عجیبِ `tehranDayAvailable` اینجا نیست. روی سرور لازم بود چون
 * `CONVERT_TZ` در MySQL اگر جدول‌های منطقهٔ زمانی بار نباشد **بی‌هیچ خطایی
 * NULL** برمی‌گرداند و همهٔ ردیف‌ها در یک سطل می‌افتادند — یعنی نمودار عددی
 * غلط نشان می‌داد. اینجا تاریخ با `Intl`ِ خودِ مرورگر و روی همین دستگاه
 * حساب می‌شود، پس همیشه درست است و آن حالتِ «unavailable» هرگز پیش نمی‌آید.
 */

// re-exported so pages can keep importing everything from one place
export * from '@/lib/panel/types'

/** روز به وقتِ تهران — همان منطقه‌ای که کلاینتِ سایت حساب می‌کرد. */
function tehranDay(iso: string): string | null {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  try {
    // `en-CA` میلادیِ مرتب با خط‌تیره می‌دهد: 2026-11-08
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(at)
  } catch {
    return at.toISOString().slice(0, 10)
  }
}

export async function getPanelUser(): Promise<PanelUser | null> {
  const user = await getCurrentUser()
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || 'دانش‌آموز',
    createdAt: user.createdAt
  }
}

/* ═════════════════════════════════════════════════════════════════ عروض ══ */

/**
 * تلاش‌های گذشتهٔ عروض، با هرچه مرور لازم دارد: صورت سؤال (بیت یا صوت)،
 * همهٔ گزینه‌ها، اینکه دانش‌آموز کدام را زد و کدام درست بود. بدون گزینه‌ها
 * چیزی برای گوش دادن دوباره نمی‌ماند — که کل هدف مرور یک آزمون سماعی است.
 */
export async function getAruzAttempts(
  userId: string,
  offset = 0,
  limit = 5
): Promise<{ attempts: AruzAttempt[]; hasMore: boolean }> {
  const all = db
    .find<{ id: string; userId: string; total: number; correct: number; createdAt: string }>(
      'quiz_attempts',
      (r) => r.userId === userId
    )
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))

  const hasMore = all.length > offset + limit
  const page = all.slice(offset, offset + limit)
  if (page.length === 0) return { attempts: [], hasMore: false }

  const attemptIds = new Set(page.map((a) => a.id))
  const answerRows = db
    .find<{
      attemptId: string
      id: string
      isCorrect: boolean
      selectedOptionId: string | null
      questionId: string | null
      createdAt: string
      order: number
    }>('quiz_attempt_answers', (r) => attemptIds.has(r.attemptId as string))
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))

  // سؤال‌ها از بانک می‌آیند: همان ۱۱۳۹ پرسشی که در آزمون دیده شده‌اند.
  const bank = bankById()
  const byAttempt = new Map<string, AruzAttempt['answers']>()

  for (const r of answerRows) {
    const q = r.questionId ? bank.get(r.questionId as string) : undefined
    const options: AruzOption[] = (q?.options ?? []).map((o) => ({
      id: o.id,
      label: o.label ?? null,
      poem: o.poem ?? null,
      audioUrl: o.audioSrc ?? null,
      isCorrect: o.isCorrect
    }))

    const list = byAttempt.get(r.attemptId as string) ?? []
    list.push({
      id: r.id,
      isCorrect: !!r.isCorrect,
      selectedOptionId: r.selectedOptionId ?? null,
      questionId: r.questionId ?? null,
      type: (q?.type ?? null) as AruzQuestionType | null,
      poem: q?.poem ?? null,
      audioUrl: q?.audioSrc ?? null,
      options
    })
    byAttempt.set(r.attemptId as string, list)
  }

  return {
    attempts: page.map((a) => ({
      id: a.id,
      total: Number(a.total ?? 0),
      correct: Number(a.correct ?? 0),
      createdAt: a.createdAt,
      answers: byAttempt.get(a.id) ?? []
    })),
    hasMore
  }
}

/**
 * سؤال‌ها در یک جدول نیستند: همان ۱۱۳۹ پرسشِ بذر هستند و `quizBank()` آن‌ها
 * را یک بار می‌خواند. پس «سؤالِ این پاسخ کدام بود» با یک جست‌وجو در همان
 * بانک جواب داده می‌شود، نه با هیچ کوئری.
 */
function bankById(): Map<string, QuizQuestion> {
  return new Map(quizBank().map((q) => [q.id, q]))
}

/** نمرهٔ همهٔ تلاش‌ها، بدون پاسخ‌ها. */
export async function getAruzSummary(
  userId: string
): Promise<{ attempts: number; best: number; questions: number; correct: number }> {
  const rows = db.find<{ userId: string; total: number; correct: number }>(
    'quiz_attempts',
    (r) => r.userId === userId
  )
  const best = rows.reduce((max, r) => {
    const total = Number(r.total ?? 0)
    return total > 0 ? Math.max(max, Math.round((Number(r.correct ?? 0) * 100) / total)) : max
  }, 0)

  return {
    attempts: rows.length,
    best,
    questions: rows.reduce((n, r) => n + Number(r.total ?? 0), 0),
    correct: rows.reduce((n, r) => n + Number(r.correct ?? 0), 0)
  }
}

/** تاریخچهٔ خام هر پاسخ، برای نمودار فعالیت و streak. */
export async function getAruzActivity(userId: string): Promise<{ at: string; ok: boolean }[]> {
  return db
    .find<{ userId: string; isCorrect: boolean; answeredAt: string }>(
      'quiz_answers',
      (r) => r.userId === userId
    )
    .sort((a, b) => String(b.answeredAt ?? '').localeCompare(String(a.answeredAt ?? '')))
    .slice(0, 2000)
    .map((r) => ({ at: r.answeredAt, ok: !!r.isCorrect }))
}

export async function getAruzWeightAnswers(
  userId: string
): Promise<{ key: string; label: string; correct: boolean; at: string }[]> {
  const bank = bankById()
  const rows = db
    .find<{ userId: string; questionId: string; isCorrect: boolean; answeredAt: string }>(
      'quiz_answers',
      (r) => r.userId === userId
    )
    .sort((a, b) => String(b.answeredAt ?? '').localeCompare(String(a.answeredAt ?? '')))
    .slice(0, 3000)

  const out: { key: string; label: string; correct: boolean; at: string }[] = []
  for (const row of rows) {
    const q = bank.get(row.questionId as string)
    const options = q?.options ?? []
    const correctOption = options.find((o) => o.isCorrect) ?? null
    const weight = quizQuestionWeight({
      type: q?.type ?? null,
      poem: q?.poem ?? null,
      audioUrl: q?.audioSrc ?? null,
      correctLabel: correctOption?.label ?? null,
      correctAudioUrl: correctOption?.audioSrc ?? null
    })
    if (weight) out.push({ key: weight, label: weight, correct: !!row.isCorrect, at: row.answeredAt })
  }
  return out
}

/* ═════════════════════════════════════════════════════════════════ واژه ══ */

export async function getVocabAnswers(
  userId: string,
  offset = 0,
  limit = 150
): Promise<{ answers: VocabAnswer[]; hasMore: boolean }> {
  const all = db
    .find<Record<string, unknown>>('vocab_answers', (r) => r.userId === userId)
    .sort((a, b) => String(b.answeredAt ?? '').localeCompare(String(a.answeredAt ?? '')))

  const hasMore = all.length > offset + limit
  return {
    answers: all.slice(offset, offset + limit).map(toVocabAnswer),
    hasMore
  }
}

function toVocabAnswer(r: Record<string, unknown>): VocabAnswer {
  // ⚠️ `isCorrect` نامِ ستونِ محلی است؛ `correct` نامی است که ردیف‌های قدیمی
  // (و مسیرِ جاسوس) می‌نویسند. هر دو پذیرفته می‌شود تا پنل با ردیف‌های
  // پیش از این اصلاح هم کار کند.
  const ok = r.isCorrect ?? r.correct
  return {
    id: String(r.id ?? ''),
    grade: String(r.grade ?? ''),
    lesson: (r.lesson as number | null) ?? null,
    word: String(r.word ?? ''),
    meaning: String(r.meaning ?? ''),
    image: String(r.image ?? ''),
    isCorrect: !!ok,
    answeredAt: String(r.answeredAt ?? '')
  }
}

export async function getVocabLessonWords(userId: string): Promise<
  { grade: string; lesson: number; word: string; total: number; correct: number; lastOk: boolean; lastAt: string }[]
> {
  const rows = db
    .find<Record<string, unknown>>('vocab_answers', (r) => r.userId === userId)
    .sort((a, b) => String(b.answeredAt ?? '').localeCompare(String(a.answeredAt ?? '')))

  const byWord = new Map<string, ReturnType<typeof toVocabAnswer>[]>()
  for (const r of rows) {
    const a = toVocabAnswer(r)
    if (!a.word) continue
    const key = `${a.grade}|${a.lesson ?? 0}|${a.word}`
    const list = byWord.get(key)
    if (list) list.push(a)
    else byWord.set(key, [a])
  }

  return [...byWord.values()].slice(0, 5000).map((list) => {
    const head = list[0]
    return {
      grade: head.grade,
      lesson: Number(head.lesson ?? 0),
      word: head.word,
      total: list.length,
      correct: list.filter((a) => a.isCorrect).length,
      lastOk: head.isCorrect,
      lastAt: head.answeredAt
    }
  })
}

export async function getVocabLessonTotals(): Promise<
  { grade: string; lesson: number; words: number }[]
> {
  const seen = new Map<string, number>()
  for (const w of vocabWords()) {
    const key = `${w.grade}|${w.lesson}`
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  return [...seen.entries()].map(([key, words]) => {
    const [grade, lesson] = key.split('|')
    return { grade, lesson: Number(lesson), words }
  })
}

let wordsCache: { grade: string; lesson: number }[] | null = null
function vocabWords(): { grade: string; lesson: number }[] {
  if (!wordsCache) {
    wordsCache = db.find<{ grade: string; lesson: number }>('vocab_words', () => true)
  }
  return wordsCache
}

export async function getVocabSummary(
  userId: string
): Promise<{ grade: string; ok: boolean; at: string }[]> {
  return db
    .find<Record<string, unknown>>('vocab_answers', (r) => r.userId === userId)
    .sort((a, b) => String(b.answeredAt ?? '').localeCompare(String(a.answeredAt ?? '')))
    .slice(0, 5000)
    .map((r) => ({
      grade: String(r.grade ?? ''),
      ok: !!(r.isCorrect ?? r.correct),
      at: String(r.answeredAt ?? '')
    }))
}

/* ══════════════════════════════════════════════════════════════ رنگ‌آرا ══ */

export async function getRangAraAnswers(userId: string): Promise<RangAraAnswer[]> {
  return db
    .find<Record<string, unknown>>('rang_ara_answers', (r) => r.userId === userId)
    .sort((a, b) => String(b.answeredAt ?? '').localeCompare(String(a.answeredAt ?? '')))
    .slice(0, 3000)
    .map((r) => ({
      playId: String(r.playId ?? r.id ?? ''),
      verseKey: String(r.verseKey ?? r.levelId ?? ''),
      grade: (r.grade as string | null) ?? null,
      lesson: (r.lesson as number | null) ?? null,
      verse: String(r.verse ?? ''),
      step: Number(r.step ?? r.stepIndex ?? 0),
      concept: String(r.concept ?? ''),
      mistakes: Number(r.mistakes ?? 0),
      isCorrect: !!(r.isCorrect ?? r.correct),
      answeredAt: String(r.answeredAt ?? '')
    }))
}

export async function getRangAraLessonTotals(): Promise<
  { grade: string; lesson: number; verses: number }[]
> {
  const seen = new Map<string, number>()
  for (const v of db.find<Record<string, unknown>>('rang_ara_verses', () => true)) {
    if (!v.grade) continue
    const key = `${v.grade}|${v.lesson ?? 0}`
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  return [...seen.entries()].map(([key, verses]) => {
    const [grade, lesson] = key.split('|')
    return { grade, lesson: Number(lesson), verses }
  })
}

/* ═══════════════════════════════════════════════════════════════ امتحان ══ */

export async function getExamStats(
  userId: string
): Promise<{ attempts: number; best: number; average: number }> {
  const rows = db.find<Record<string, unknown>>('exam_attempts', (r) => r.userId === userId)
  const best = rows.reduce((max, r) => {
    const maxScore = Number(r.maxScore ?? 0)
    return maxScore > 0
      ? Math.max(max, Math.round((Number(r.totalScore ?? 0) * 100) / maxScore))
      : max
  }, 0)
  const totalMax = rows.reduce((n, r) => n + Number(r.maxScore ?? 0), 0)
  const totalScore = rows.reduce((n, r) => n + Number(r.totalScore ?? 0), 0)

  return {
    attempts: rows.length,
    best,
    average: totalMax ? Math.round((totalScore * 100) / totalMax) : 0
  }
}

export async function getExamAttemptDetail(
  userId: string,
  attemptId: string
): Promise<{ questionResults: Record<string, unknown>; answers: Record<string, unknown> } | null> {
  const row = db.findOne<Record<string, unknown>>(
    'exam_attempts',
    (r) => r.id === attemptId && r.userId === userId
  )
  if (!row) return null
  return {
    questionResults: (row.questionResults as Record<string, unknown>) ?? {},
    answers: (row.answers as Record<string, unknown>) ?? {}
  }
}

export async function getExamAttempts(userId: string, limit = 500): Promise<ExamAttempt[]> {
  return db
    .find<Record<string, unknown>>('exam_attempts', (r) => r.userId === userId)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, limit)
    .map((r) => ({
      id: String(r.id ?? ''),
      examTitle: String(r.examTitle ?? 'آزمون'),
      examKey: (r.examKey as string | null) ?? null,
      answers: (r.answers as Record<string, unknown> | null) ?? null,
      totalScore: Number(r.totalScore ?? 0),
      maxScore: Number(r.maxScore ?? 0),
      createdAt: String(r.createdAt ?? ''),
      results: (r.questionResults as ExamAttempt['results']) ?? {}
    }))
}

/* ════════════════════════════════════════════════════════════════ نمای کلی ══ */

/** شش حوزهٔ فعالیت — همان UNION ALLِ شش جدول در نسخهٔ اصلی. */
const ACTIVITY: { area: PracticeArea; table: string }[] = [
  { area: 'aruz', table: 'quiz_answers' },
  { area: 'vocab', table: 'vocab_answers' },
  { area: 'jasoos', table: 'jasoos_answers' },
  { area: 'jasoos', table: 'grammar_circuit_answers' },
  { area: 'jasoos', table: 'role_hunt_answers' },
  { area: 'rangAra', table: 'rang_ara_answers' }
]

export async function getPanelOverview(userId: string): Promise<PanelOverview> {
  const dayCounts: PanelOverview['dayCounts'] = []
  const counts: PanelOverview['counts'] = {
    aruz: { total: 0, correct: 0 },
    vocab: { total: 0, correct: 0 },
    jasoos: { total: 0, correct: 0 },
    rangAra: { total: 0, correct: 0 },
    exam: { total: 0, correct: 0 }
  }

  /* ⚠️ تجمیعِ روز اینجا در حافظه انجام می‌شود، نه در SQL. روی سرور این کار
     را پایگاه می‌کرد تا یازده هزار ردیف به مرورگر نیاید؛ در یک برنامهٔ
     تک‌نفره کلِ داده همین‌جاست و رفت‌وبرگشتی در کار نیست. حاصل همان است:
     یک سطل به‌ازای هر روزِ تهران، و شمارنده‌ها از جمعِ همان‌ها. */
  const byDay = new Map<string, { area: PracticeArea; day: string; total: number; correct: number }>()

  for (const { area, table } of ACTIVITY) {
    const rows = db.find<Record<string, unknown>>(table, (r) => r.userId === userId)
    for (const r of rows) {
      const at = String(r.answeredAt ?? r.createdAt ?? '')
      if (!at) continue
      const ok = !!(r.isCorrect ?? r.correct)
      counts[area].total += 1
      if (ok) counts[area].correct += 1

      const day = tehranDay(at)
      if (!day) continue
      const key = `${day}|${area}`
      const bucket = byDay.get(key)
      if (bucket) {
        bucket.total += 1
        if (ok) bucket.correct += 1
      } else {
        byDay.set(key, { area, day, total: 1, correct: ok ? 1 : 0 })
      }
    }
  }

  dayCounts.push(
    ...[...byDay.values()].sort((a, b) => a.day.localeCompare(b.day) || a.area.localeCompare(b.area))
  )

  const exams = await getExamStats(userId)
  counts.exam.total = exams.attempts
  counts.exam.correct = exams.best

  return {
    dayCounts,
    /* روی سرور سه حالت داشت (آماده / ناموجود / بی‌داده) چون گروه‌بندیِ روز
       می‌توانست بی‌سروصدا غلط از آب دربیاید. اینجا همیشه درست است. */
    dayState: dayCounts.length === 0 ? 'no_data' : 'ready',
    counts,
    bookmarks: db.find('user_bookmarks', (r) => r.userId === userId).length,
    exams
  }
}

/* ═════════════════════════════════════════════════════════════ نشان‌شده‌ها ══ */

export async function getBookmarks(
  userId: string,
  area?: BookmarkArea,
  /** ⚠️ محافظ است، نه صفحه‌بندی: یک کاربرِ واقعی پانصد نشانه نمی‌گذارد. */
  limit = 500
): Promise<Bookmark[]> {
  return db
    .find<Record<string, unknown>>(
      'user_bookmarks',
      (r) => r.userId === userId && (!area || r.area === area)
    )
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, limit)
    .map((r) => ({
      id: String(r.id ?? ''),
      area: r.area as BookmarkArea,
      refId: String(r.refId ?? ''),
      title: String(r.title ?? ''),
      subtitle: (r.subtitle as string | null) ?? null,
      payload: (r.payload as Record<string, unknown>) ?? {},
      note: (r.note as string | null) ?? null,
      createdAt: String(r.createdAt ?? '')
    }))
}

/**
 * فعالیتِ روزانهٔ عروض، تجمیع‌شده.
 *
 * ⚠️ چرا جای `getAruzActivity`: آن تابع ردیف‌های *خام* می‌آورد تا کلاینت
 * خودش روزها را بشمارد. اینجا روزها پیشاپیش شمرده می‌شوند و همان سی عدد
 * برمی‌گردد.
 */
export async function getAruzDayCounts(
  userId: string,
  days = 400
): Promise<{ day: string; total: number; correct: number }[]> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const byDay = new Map<string, { day: string; total: number; correct: number }>()

  for (const r of db.find<Record<string, unknown>>('quiz_answers', (x) => x.userId === userId)) {
    const at = String(r.answeredAt ?? '')
    if (!at || new Date(at).getTime() < since) continue
    const day = tehranDay(at)
    if (!day) continue
    const bucket = byDay.get(day) ?? { day, total: 0, correct: 0 }
    bucket.total += 1
    if (r.isCorrect ?? r.correct) bucket.correct += 1
    byDay.set(day, bucket)
  }

  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
}

/** آخرین پاسخ — یک مقدار، نه یک فهرست. */
export async function getAruzLastAnsweredAt(userId: string): Promise<string | null> {
  const rows = db
    .find<{ userId: string; answeredAt: string }>('quiz_answers', (r) => r.userId === userId)
    .map((r) => r.answeredAt)
    .filter(Boolean)
    .sort()
  return rows.length ? rows[rows.length - 1] : null
}
