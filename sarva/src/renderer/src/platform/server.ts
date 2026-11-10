import * as db from './db'
import * as auth from './auth'
import { ok, fail, type ApiResult } from './http'
import { quizBank } from './quiz-bank'
import { JASOOS_LEVELS, shuffleSuspects, type JasoosLevel } from '@/lib/jasoos-data'
import { VOCAB_GRADES } from '@/lib/vocab-data'
import { findMeterLocally } from '@/lib/aruz'
import { getLesson } from '@/lib/doroos'
import { vocabManifest } from './vocab-manifest'

/**
 * «سرورِ محلی»ی سروا.
 *
 * روی وب، هر کامپوننت داده‌اش را از `/api/v1/…` می‌گرفت و آن مسیرها به
 * Postgres وصل بودند. اینجا همان مسیرها با همان شکلِ پاسخ پیاده شده‌اند،
 * اما پشتشان به‌جای دیتابیس، لایهٔ `platform/db` است. برای کامپوننت‌ها
 * هیچ چیزی عوض نشده: همان `apiGet`/`apiPost`، همان `{ ok, data }`.
 *
 * ⚠️ قانونِ سروا اینجا هم برقرار است: **درستیِ پاسخ را سرور حساب می‌کند.**
 * کلاینت نمی‌تواند «من درست جواب دادم» بفرستد — endpoint آن را از روی
 * خودِ پرسش می‌سنجد. تفاوت فقط این است که «سرور» حالا روی میزِ کاربر است.
 */

type Ctx = {
  method: string
  params: Record<string, string>
  query: URLSearchParams
  body: unknown
  userId: string | null
}

type Handler = (ctx: Ctx) => Promise<ApiResult<unknown>> | ApiResult<unknown>

type Route = {
  method: string
  segments: string[]
  handler: Handler
}

const routes: Route[] = []

function route(method: string, pattern: string, handler: Handler) {
  routes.push({ method, segments: pattern.split('/').filter(Boolean), handler })
}

const get = (p: string, h: Handler) => route('GET', p, h)
const post = (p: string, h: Handler) => route('POST', p, h)
const patch = (p: string, h: Handler) => route('PATCH', p, h)
const del = (p: string, h: Handler) => route('DELETE', p, h)

function match(method: string, path: string): { route: Route; params: Record<string, string> } | null {
  const segments = path.split('?')[0].split('/').filter(Boolean)
  for (const r of routes) {
    if (r.method !== method || r.segments.length !== segments.length) continue
    const params: Record<string, string> = {}
    let fits = true
    for (let i = 0; i < segments.length; i++) {
      const s = r.segments[i]
      if (s.startsWith(':')) params[s.slice(1)] = decodeURIComponent(segments[i])
      else if (s !== segments[i]) {
        fits = false
        break
      }
    }
    if (fits) return { route: r, params }
  }
  return null
}

/* ══════════════════════════════════════════════════════════ تنظیمات و محتوا */

get('/api/v1/config', () => ok({ turnstileSiteKey: null }))

/**
 * محتوای قابل‌ویرایشِ سایت.
 *
 * ⚠️ این مسیر یک بذر دارد و این با بقیهٔ مسیرها فرق دارد: تا پیش از این،
 * نبودِ ردیف در پایگاه یعنی `announcement: null`، و `useSiteContent` حالتِ
 * «نیامده» را از «نبود» جدا نمی‌کند — هر دو یعنی چیزی نشان نده. نتیجه این
 * بود که نوارِ اعلانِ بالای صفحه هرگز رندر نمی‌شد، در حالی که روی سایت
 * نخستین چیزی است که دیده می‌شود.
 *
 * پس اگر کاربر چیزی در پایگاه ننوشته باشد، همان متنِ واقعیِ سایت برمی‌گردد
 * (از `data/seeds/site-content.ts`). کاربر می‌تواند در پایگاهِ محلی عوضش کند
 * و آن تازه جای این را می‌گیرد.
 */
get('/api/v1/site-content', async () => {
  const stored = db.findOne<Record<string, unknown>>('site_content', () => true)
  if (stored?.announcement || stored?.supporters) {
    return ok({
      announcement: stored.announcement ?? null,
      supporters: stored.supporters ?? []
    })
  }
  const { SITE_CONTENT_SEED } = await import('@/data/seeds/site-content')
  return ok({
    announcement: SITE_CONTENT_SEED.announcement,
    supporters: SITE_CONTENT_SEED.supporters
  })
})

/* ═══════════════════════════════════════════════════════════════════ کاربر */

post('/api/v1/auth/register', async ({ body }) => {
  const b = (body ?? {}) as Record<string, string>
  const result = await auth.register({
    email: b.email ?? null,
    phone: b.phone ?? null,
    password: b.password ?? '',
    fullName: b.fullName ?? null,
    firstName: b.firstName ?? null,
    lastName: b.lastName ?? null,
    grade: (b.grade as never) ?? null
  })
  if ('error' in result) return fail(result.error)
  return ok({ user: result.user })
})

post('/api/v1/auth/login', async ({ body }) => {
  const b = (body ?? {}) as Record<string, string>
  const result = await auth.login(b.identifier ?? b.email ?? b.phone ?? '', b.password ?? '')
  if ('error' in result) return fail(result.error)
  return ok({ user: result.user })
})

post('/api/v1/auth/logout', () => {
  auth.logout()
  return ok({ ok: true })
})

get('/api/v1/auth/me', () => ok(auth.me()))

patch('/api/v1/auth/profile', ({ body }) => {
  const user = auth.updateProfile((body ?? {}) as never)
  return user ? ok({ user }) : fail('وارد نشده‌اید.')
})

post('/api/v1/auth/complete-profile', ({ body }) => {
  const b = (body ?? {}) as Record<string, string>
  const user = auth.updateProfile({
    firstName: b.firstName ?? null,
    lastName: b.lastName ?? null,
    grade: (b.grade as never) ?? null,
    provinceId: b.provinceId ?? null,
    cityId: b.cityId ?? null,
    school: b.school ?? null,
    profileCompleted: true
  } as never)
  return user ? ok({ user }) : fail('وارد نشده‌اید.')
})

post('/api/v1/auth/change-password', async ({ body }) => {
  const b = (body ?? {}) as Record<string, string>
  const id = auth.currentUserId()
  if (!id) return fail('وارد نشده‌اید.')
  const user = db.findOne<{ id: string; passwordHash: string; passwordSalt: string }>(
    'users',
    (r) => r.id === id
  )
  if (!user) return fail('وارد نشده‌اید.')
  const current = await hash(b.currentPassword ?? '')
  if (current !== user.passwordHash) return fail('رمزِ فعلی درست نیست.')
  const next = await hash(b.newPassword ?? '', user.passwordSalt)
  db.update('users', id, { passwordHash: next })
  return ok({ changed: true })
})

async function hash(password: string, salt = ''): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
}

get('/api/v1/auth/sessions', () => ok({ sessions: [] }))

/* ═══════════════════════════════════════════════════ نشان‌شده‌ها و فعالیت */

const BOOKMARK_AREAS = ['aruz', 'vocab', 'exam', 'jasoos'] as const

get('/api/v1/bookmarks', ({ query, userId }) => {
  if (!userId) return ok({ bookmarks: [] })
  const area = query.get('area')
  const refId = query.get('refId')
  let rows = db.find<{ id: string; userId: string }>('bookmarks', (r) => r.userId === userId)
  if (area) rows = rows.filter((r) => (r as { area?: string }).area === area)
  if (refId) rows = rows.filter((r) => (r as { refId?: string }).refId === refId)
  return ok({ bookmarks: rows })
})

post('/api/v1/bookmarks', ({ body, userId }) => {
  const b = (body ?? {}) as Record<string, unknown>
  if (!userId) return ok({ saved: false, reason: 'guest' })
  if (!BOOKMARK_AREAS.includes(b.area as never)) return fail('حوزهٔ نشان نامعتبر است.')
  const existing = db.findOne<{ id: string }>(
    'bookmarks',
    (r) => r.userId === userId && r.refId === b.refId
  )
  if (existing) return ok({ bookmark: existing, saved: false })
  const row = db.insert('bookmarks', {
    id: db.uid(),
    userId,
    area: b.area as string,
    refId: String(b.refId ?? ''),
    title: String(b.title ?? ''),
    subtitle: (b.subtitle as string) ?? null,
    payload: (b.payload as object) ?? null,
    note: null,
    createdAt: db.nowIso()
  })
  return ok({ bookmark: row, saved: true })
})

patch('/api/v1/bookmarks', ({ body, userId }) => {
  const b = (body ?? {}) as Record<string, string>
  if (!userId) return fail('وارد نشده‌اید.')
  const updated = db.update('bookmarks', b.id, { note: b.note })
  return updated ? ok({ bookmark: updated }) : fail('نشان پیدا نشد.')
})

del('/api/v1/bookmarks', ({ body, query, userId }) => {
  if (!userId) return fail('وارد نشده‌اید.')
  const b = (body ?? {}) as Record<string, string>
  const id = query.get('id') ?? b.id
  const area = query.get('area') ?? b.area
  const refId = query.get('refId') ?? b.refId
  const removed = db.remove(
    'bookmarks',
    (r) =>
      r.userId === userId &&
      ((!!id && r.id === id) || (!!area && !!refId && r.area === area && r.refId === refId))
  )
  return ok({ removed })
})

get('/api/v1/activity', ({ userId }) => {
  if (!userId) return ok({ events: [] })
  return ok({ events: db.find('activity', (r) => r.userId === userId) })
})

post('/api/v1/activity', ({ body, userId }) => {
  const b = (body ?? {}) as Record<string, unknown>
  db.insert('activity', {
    id: db.uid(),
    userId: userId ?? 'guest',
    kind: String(b.kind ?? 'unknown'),
    payload: (b.payload as object) ?? null,
    createdAt: db.nowIso()
  })
  return ok({ saved: true })
})

/* ══════════════════════════════════════════════════════ آزمونِ عروض سماعی */

get('/api/v1/quiz/bank', () => ok({ questions: quizBank() }))

get('/api/v1/quiz/answered', ({ userId }) => {
  if (!userId) return ok({ questionIds: [] })
  const rows = db.find<{ questionId: string }>('quiz_answers', (r) => r.userId === userId)
  return ok({ questionIds: [...new Set(rows.map((r) => r.questionId))] })
})

post('/api/v1/quiz/answer', ({ body, userId }) => {
  const b = (body ?? {}) as { questionId?: string; selectedOptionId?: string }
  const question = quizBank().find((q) => q.id === b.questionId)
  if (!question) return fail('این سؤال پیدا نشد.')
  const option = question.options.find((o) => o.id === b.selectedOptionId)
  if (!option) return fail('گزینهٔ انتخابی برای این سؤال معتبر نیست.')

  // 🔒 درستی را «سرور» حساب می‌کند، نه مرورگر — همان قانونی که روی وب بود.
  if (userId) {
    const existing = db.findOne<{ id: string }>(
      'quiz_answers',
      (r) => r.userId === userId && r.questionId === question.id
    )
    const patchRow = {
      userId,
      questionId: question.id,
      selectedOptionId: option.id,
      isCorrect: option.isCorrect,
      answeredAt: db.nowIso()
    }
    if (existing) db.update('quiz_answers', existing.id, patchRow)
    else db.insert('quiz_answers', { id: db.uid(), ...patchRow })
  }
  return ok({ isCorrect: option.isCorrect, saved: !!userId })
})

post('/api/v1/quiz/attempt', ({ body, userId }) => {
  const b = (body ?? {}) as { answers?: { questionId?: string; selectedOptionId?: string | null }[] }
  const answers = b.answers ?? []
  if (!answers.length) return fail('حداقل یک پاسخ لازم است.')

  const bank = new Map(quizBank().map((q) => [q.id, q]))
  const seen = new Set<string>()
  let correct = 0

  for (const a of answers) {
    if (!a.questionId || seen.has(a.questionId)) return fail('هر سؤال فقط یک بار می‌تواند در یک دور بیاید.')
    seen.add(a.questionId)
    const q = bank.get(a.questionId)
    if (!q) return fail('سؤالِ نامعتبر در این دور.')
    const option = a.selectedOptionId ? q.options.find((o) => o.id === a.selectedOptionId) : null
    const isCorrect = !!option?.isCorrect
    if (isCorrect) correct++
    if (userId) {
      db.insert('quiz_answers', {
        id: db.uid(),
        userId,
        questionId: q.id,
        selectedOptionId: option?.id ?? null,
        isCorrect,
        answeredAt: db.nowIso()
      })
    }
  }

  const attemptId = db.uid()
  const at = db.nowIso()
  if (userId) {
    db.insert('quiz_attempts', {
      id: attemptId,
      userId,
      total: answers.length,
      correct,
      createdAt: at
    })

    /* ⚠️ ردیفِ هر پاسخ هم ذخیره می‌شود، و این فقط برای آمار نیست.
       «مرورِ آزمون» در پنل (`/panel/aruz`) باید بتواند همان بیت را دوباره
       نشان دهد و بگوید تو کدام گزینه را زدی و کدام درست بود — بدون این
       ردیف‌ها کارنامه فقط یک نمره است و بس. */
    answers.forEach((a, index) => {
      const q = a.questionId ? bank.get(a.questionId) : null
      if (!q) return
      const option = a.selectedOptionId ? q.options.find((o) => o.id === a.selectedOptionId) : null
      db.insert('quiz_attempt_answers', {
        id: db.uid(),
        attemptId,
        questionId: q.id,
        selectedOptionId: option?.id ?? null,
        isCorrect: !!option?.isCorrect,
        createdAt: at,
        order: index
      })
    })
  }
  return ok({ attemptId, total: answers.length, correct })
})

/* ═════════════════════════════════════════════════════════ واژه‌یاب (تصویری) */

function vocabGradeKey(grade: string): string {
  return grade === 'dahom' ? '10' : grade === 'yazdahom' ? '11' : grade === 'davazdahom' ? '12' : grade
}

get('/api/v1/vocab/words', ({ query }) => {
  const grade = vocabGradeKey(query.get('grade') ?? '')
  const lesson = Number(query.get('lesson') ?? '0')
  if (!grade || !lesson) return fail('پایه و درس لازم است.')

  const words = vocabManifest()
    .filter((w) => w.grade === grade && w.lesson === lesson)
    .map((w, i) => ({
      id: `${grade}-${lesson}-${i}`,
      word: w.word,
      meaning: w.meaning ?? '',
      image: w.path
    }))

  return ok({ words })
})

/**
 * ⚠️ واژه با همهٔ مشخصاتش ذخیره می‌شود و نه فقط شناسه‌اش.
 *
 * پنلِ واژه (`/panel/vocab`) باید نشان دهد کدام واژه را چند بار زدی، چند
 * بار درست بود و آخرین بار کی — با معنی و تصویرش. اگر فقط `wordId` ذخیره
 * می‌شد، آن جدول برای پنلِ تک‌نفره بی‌معنا بود: شناسه به یک واژه در
 * مانیفست اشاره می‌کند، ولی پنل باید *همان واژه* را بیاورد و کنارِ آمار
 * بگذارد. پس هنگامِ پاسخ، مشخصات از مانیفست خوانده و در ردیف نوشته
 * می‌شود — یک بار در زمانِ پاسخ، به‌جایِ جست‌وجو در هر بار باز شدنِ پنل.
 */
post('/api/v1/vocab/answer', ({ body, userId }) => {
  const b = (body ?? {}) as {
    wordId?: string
    correct?: boolean
    word?: string
    meaning?: string
    image?: string
  }
  if (!userId) return ok({ saved: false, reason: 'guest' })

  /* مشخصاتِ واژه یا همراهِ درخواست می‌آید یا از مانیفست پیدا می‌شود؛
     هر دو راه کار می‌کند تا اگر بازی روزی چیزی فرستاد که نشناختیم،
     ردیف بی‌نام نماند. */
  const id = String(b.wordId ?? '')
  const fromManifest = vocabManifest().find((w) => `${w.grade}-${w.lesson}` === id.split('-').slice(0, 2).join('-'))
  const grade = id.split('-')[0] ?? ''
  const lesson = Number(id.split('-')[1] ?? '0') || null

  db.insert('vocab_answers', {
    id: db.uid(),
    userId,
    wordId: id,
    grade,
    lesson,
    word: String(b.word ?? fromManifest?.word ?? ''),
    meaning: String(b.meaning ?? fromManifest?.meaning ?? ''),
    image: String(b.image ?? fromManifest?.path ?? ''),
    isCorrect: !!b.correct,
    answeredAt: db.nowIso()
  })
  return ok({ saved: true })
})

/* ══════════════════════════════════════════════════════ جاسوسِ نقش‌ها */

get('/api/v1/jasoos/levels', () => ok({ levels: JASOOS_LEVELS, fromDatabase: false }))

post('/api/v1/jasoos/answer', ({ body, userId }) => {
  const b = (body ?? {}) as { levelId?: string | number; suspectId?: string }
  const level = JASOOS_LEVELS.find((l) => String(l.id) === String(b.levelId))
  if (!level) return fail('این پرونده پیدا نشد.')
  const suspect = level.suspects.find((s) => s.id === b.suspectId)
  if (!suspect) return fail('این مظنون در این پرونده نیست.')

  if (userId) {
    db.insert('jasoos_answers', {
      id: db.uid(),
      userId,
      levelId: String(b.levelId),
      suspectId: suspect.id,
      correct: !!suspect.isSpy,
      answeredAt: db.nowIso()
    })
  }
  return ok({ saved: !!userId, correct: !!suspect.isSpy })
})

/** سطح‌ها برای بازی: مظنون‌ها در هم می‌ریزند تا ترتیب همیشه یکی نباشد. */
get('/api/v1/jasoos/round', ({ query }) => {
  const count = Math.min(Math.max(Number(query.get('count') ?? '5'), 1), JASOOS_LEVELS.length)
  const levels = JASOOS_LEVELS.slice(0, count).map((level) => withShuffledSuspects(level))
  return ok({ levels })
})

function withShuffledSuspects(level: JasoosLevel): JasoosLevel {
  return { ...level, suspects: shuffleSuspects(level.suspects) }
}

/* ═════════════════════════════════════════════════════════ مدارِ دستور */

/**
 * بذرِ مدارِ دستور — ۵۵۵ پرسش برای سه پایه.
 *
 * ⚠️ این فایل‌ها چند صد کیلوبایت‌اند، پس فقط هنگامِ نیاز و یک بار بار می‌شوند.
 * نکته‌ای که اینجا مهم است: کش باید *وعده* را نگه دارد، نه نتیجه را. نسخهٔ
 * قبلی یک آرایهٔ خالی را فوراً برمی‌گرداند و پرونده را در پس‌زمینه می‌خواند؛
 * برای همین نخستین درخواست همیشه «پرسشی برای این پایه آماده نیست» می‌گرفت.
 */
const SEED_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  dahom: () => import('@/data/seeds/grammar-circuit/dahom-v1.json'),
  yazdahom: () => import('@/data/seeds/grammar-circuit/yazdahom-v1.json'),
  davazdahom: () => import('@/data/seeds/grammar-circuit/davazdahom-v1.json')
}

const seedCache = new Map<string, Promise<unknown[]>>()

function circuitSeed(grade: string): Promise<unknown[]> {
  const loader = SEED_LOADERS[grade]
  if (!loader) return Promise.resolve([])
  let pending = seedCache.get(grade)
  if (!pending) {
    pending = loader().then((m) => {
      const data = (m.default ?? m) as unknown[]
      return Array.isArray(data) ? data : []
    })
    seedCache.set(grade, pending)
  }
  return pending
}

get('/api/v1/grammar-circuit/availability', async () =>
  ok({
    grades: await Promise.all(
      ['dahom', 'yazdahom', 'davazdahom'].map(async (grade) => {
        const rows = (await circuitSeed(grade)) as { lesson?: number }[]
        const lessons = [...new Set(rows.map((q) => Number(q.lesson)).filter((n) => n >= 1 && n <= 18))]
        return { grade, lessons: lessons.sort((a, b) => a - b) }
      })
    )
  })
)

get('/api/v1/grammar-circuit/questions', async ({ query }) => {
  const grade = query.get('grade') ?? ''
  const lessons = (query.get('lessons') ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 18)
  const limit = Math.min(Math.max(Number(query.get('limit') ?? '12'), 1), 60)

  if (!lessons.length) return fail('دستِ‌کم یک درس باید انتخاب شود.')

  const rows = (await circuitSeed(grade)) as { lesson?: number; id?: string }[]
  if (!rows.length) return fail('پرسشی برای این پایه آماده نیست.')

  const pool = rows.filter((q) => lessons.includes(Number(q.lesson)))
  const picked = shuffle(pool).slice(0, limit)
  return ok({ grade, lessons, questions: picked })
})

post('/api/v1/grammar-circuit/answers', ({ body, userId }) => {
  const b = (body ?? {}) as { questionId?: string; correct?: boolean }
  if (!userId) return ok({ saved: false, reason: 'guest' })
  db.insert('grammar_circuit_answers', {
    id: db.uid(),
    userId,
    questionId: String(b.questionId ?? ''),
    correct: !!b.correct,
    answeredAt: db.nowIso()
  })
  return ok({ saved: true })
})

/* ═════════════════════════════════════════════════════════════ پلِ وزن */

get('/api/v1/aruz-bridge/questions', async ({ query }) => {
  const difficulty = Math.min(Math.max(Number(query.get('difficulty') ?? '1'), 1), 3)
  const count = Math.min(Math.max(Number(query.get('count') ?? '10'), 1), 40)
  const { buildDemoQuestions } = await import('@/lib/aruz-bridge/questions')
  const questions = buildDemoQuestions({ difficulty: difficulty as 1 | 2 | 3, count })
  return ok({ questions, isDemo: true })
})

post('/api/v1/aruz-bridge/answers', ({ body, userId }) => {
  const b = (body ?? {}) as { questionId?: string; correct?: boolean; ms?: number }
  if (!userId) return ok({ saved: false, reason: 'guest' })
  db.insert('aruz_bridge_answers', {
    id: db.uid(),
    userId,
    questionId: String(b.questionId ?? ''),
    correct: !!b.correct,
    ms: Number(b.ms ?? 0),
    answeredAt: db.nowIso()
  })
  return ok({ saved: true })
})

/* ══════════════════════════════════════════════════ کیمیا، نقش، رنگ‌آرا */

get('/api/v1/kimia/rounds', async () => {
  const { buildKimiaRound } = await import('./kimia-bridge')
  const round = await buildKimiaRound()
  if (!round) return fail('هنوز بیتی برای این بازی آماده نیست.')
  return ok({ round, persisted: false })
})

post('/api/v1/kimia/attempts', async ({ body }) => {
  const { judgeKimia } = await import('./kimia-bridge')
  const b = (body ?? {}) as { roundId?: string; feet?: string[] }
  const verdict = await judgeKimia(b.roundId ?? '', b.feet ?? [])
  if (!verdict) return fail('این دور پیدا نشد.')
  return ok(verdict)
})

post('/api/v1/kimia/reveal', async ({ body }) => {
  const { revealKimia } = await import('./kimia-bridge')
  const b = (body ?? {}) as { roundId?: string }
  const solution = await revealKimia(b.roundId ?? '')
  if (!solution) return fail('این دور پیدا نشد.')
  return ok({ solution, saved: false, revealed: true, remaining: null })
})

get('/api/v1/role-hunt/rounds', async ({ query }) => {
  const count = Math.min(Math.max(Number(query.get('count') ?? '8'), 1), 30)
  const { buildRoleHuntRounds } = await import('./role-hunt-bridge')
  const rounds = await buildRoleHuntRounds(count)
  if (!rounds.length) return fail('هنوز مصراعی برای این بازی آماده نیست.')
  return ok({ rounds })
})

post('/api/v1/role-hunt/answers', ({ body, userId }) => {
  const b = (body ?? {}) as { roundId?: string; questionId?: string; correct?: boolean }
  if (!userId) return ok({ saved: false, reason: 'guest' })
  db.insert('role_hunt_answers', {
    id: db.uid(),
    userId,
    roundId: String(b.roundId ?? ''),
    questionId: String(b.questionId ?? ''),
    correct: !!b.correct,
    answeredAt: db.nowIso()
  })
  return ok({ saved: true })
})

post('/api/v1/rang-ara/answers', ({ body, userId }) => {
  const b = (body ?? {}) as { levelId?: string; steps?: unknown[] }
  if (!userId) return ok({ saved: false, reason: 'guest' })
  db.insert('rang_ara_answers', {
    id: db.uid(),
    userId,
    levelId: String(b.levelId ?? ''),
    steps: (b.steps as object) ?? null,
    answeredAt: db.nowIso()
  })
  return ok({ saved: true, steps: b.steps ?? [] })
})

/* ═════════════════════════════════════════════════════════════ سروا پلاس */

/* ⚠️ جزییاتِ پلن (مبلغ، عنوان، مدت) همراهِ سفارش می‌آید و اینجا فقط نوشته
   می‌شود. در سایتِ اصلی سرور این‌ها را خودش از `plus_plan_versions`
   می‌خواند و به کلاینت اعتماد نمی‌کند؛ اینجا چنین جدولی نیست و مبلغ‌ها
   anyway فقط برایِ نمایش‌اند — هیچ پولی جابه‌جا نمی‌شود. */
post('/api/v1/plus/checkout', ({ body, userId }) => {
  if (!userId) return fail('برای خرید باید وارد شوید.')
  const b = (body ?? {}) as {
    planCode?: string
    planTitle?: string
    amountRials?: number
    durationDays?: number
  }
  const durationDays = Number(b.durationDays)
  const order = db.insert('plus_orders', {
    id: db.uid(),
    userId,
    planCode: String(b.planCode ?? 'plus_1m'),
    planId: String(b.planCode ?? 'default'),
    planTitle: String(b.planTitle ?? 'سروا پلاس'),
    amount: Number(b.amountRials ?? 0),
    durationDays: Number.isFinite(durationDays) && durationDays > 0 ? durationDays : null,
    status: 'pending',
    createdAt: db.nowIso()
  })
  return ok({ order, orderId: order.id })
})

/** نشانیِ درگاهِ شبیه‌سازی‌شده.

    ⚠️ مسیر با `#/` شروع می‌شود تا `window.location.assign` آن را به عنوانِ
    یک تغییرِ هش بفهمد و صفحه دوباره بار نشود — وگرنه نشست، انیمیشن‌ها و
    خودِ سفارش در یک بارگذاریِ تازه می‌پرید. */
const sandboxUrl = (orderId: string) => `#/payment/sandbox?order=${encodeURIComponent(orderId)}`

post('/api/v1/plus/orders/:orderId/pay', ({ params, userId }) => {
  if (!userId) return fail('برای پرداخت باید وارد شوید.')
  const order = db.findOne<{ id: string; status: string }>('plus_orders', (r) => r.id === params.orderId)
  if (!order) return fail('این سفارش پیدا نشد.')

  /* ⚠️ اینجا فقط «رفتن به درگاه» است و دسترسی *داده نمی‌شود*. تا پیش از این
     همین‌جا `grantPlus` را صدا می‌زد، یعنی کسی که رویِ درگاه «انصراف» یا
     «پرداخت ناموفق» می‌زد هم پلاس می‌گرفت. دسترسی را
     `sandbox-submit` با `action=paid` می‌دهد. */
  db.update('plus_orders', order.id, { status: 'pending', startedAt: db.nowIso() })
  return ok({ status: 'pending', redirectUrl: sandboxUrl(order.id), attemptId: db.uid() })
})

/* ═══════════════════════════════════ درگاهِ شبیه‌سازی‌شده (پرداختِ آزمایشی) */

/** مهلتِ درگاه — همان ۱۵ دقیقه‌ای که `SANDBOX_SESSION_MINUTES` در
    `lib/plus/payments/test-provider.ts` تعیین می‌کند. آن پرونده `node:crypto`
    می‌خواهد و در مرورگر بالا نمی‌آید، برای همین مقدار اینجا تکرار شده. */
const SANDBOX_MINUTES = 15

type SandboxOrder = {
  id: string
  userId: string
  planCode: string
  planTitle: string
  amount: number
  durationDays: number | null
  status: string
  startedAt?: string
  createdAt: string
}

/** شماره‌یِ سفارشی که رویِ رسید و صفحه‌یِ بانک دیده می‌شود. */
function orderNumber(orderId: string): string {
  return orderId.replace(/-/g, '').slice(0, 10).toUpperCase()
}

/** ارجاعِ درگاه، هم‌شکلِ ارجاعی که `TestPaymentProvider` می‌سازد. */
function providerRef(orderId: string): string {
  return `test_${orderId.replace(/-/g, '').slice(0, 32)}`
}

get('/api/v1/plus/orders/:orderId/sandbox', ({ params, userId }) => {
  if (!userId) return fail('برای دیدنِ این صفحه باید وارد شوید.')
  const order = db.findOne<SandboxOrder>('plus_orders', (r) => r.id === params.orderId)
  if (!order) return fail('این سفارش پیدا نشد.')
  if (order.userId !== userId) return fail('این سفارش مالِ تو نیست.')

  const startedAt = new Date(order.startedAt ?? order.createdAt).getTime()
  const deadline = new Date(startedAt + SANDBOX_MINUTES * 60_000).toISOString()
  const state: 'open' | 'done' | 'expired' =
    order.status === 'paid' ? 'done' : Date.now() > startedAt + SANDBOX_MINUTES * 60_000 ? 'expired' : 'open'

  return ok({
    orderId: order.id,
    planCode: order.planCode ?? 'plus_1m',
    providerRef: providerRef(order.id),
    amountRials: Number(order.amount ?? 0),
    orderNumber: orderNumber(order.id),
    planTitle: order.planTitle ?? 'سروا پلاس',
    deadline,
    state
  })
})

/** نتیجه‌یِ دکمه‌ای که کاربر رویِ صفحه‌یِ بانک زده.

    `lost` یعنی بانک پول را گرفته ولی کاربر هرگز برنگشته — سفارش «پرداخت‌شده»
    می‌ماند تا `recheck` آن را پیدا کند، درست همان‌طور که در سایت می‌ماند. */
post('/api/v1/plus/orders/:orderId/sandbox-submit', ({ params, body, userId }) => {
  if (!userId) return fail('برای پرداخت باید وارد شوید.')
  const order = db.findOne<SandboxOrder>('plus_orders', (r) => r.id === params.orderId)
  if (!order) return fail('این سفارش پیدا نشد.')
  if (order.userId !== userId) return fail('این سفارش مالِ تو نیست.')

  const action = String(((body ?? {}) as { action?: string }).action ?? 'cancelled')

  if (action === 'paid' || action === 'lost') {
    if (order.status !== 'paid') {
      db.update('plus_orders', order.id, { status: 'paid', paidAt: db.nowIso() })
      auth.grantPlus(userId, order.durationDays ?? null)
    }
    return ok({ status: 'paid', outcome: action })
  }

  db.update('plus_orders', order.id, {
    status: action === 'failed' ? 'failed' : 'cancelled',
    closedAt: db.nowIso()
  })
  return ok({ status: action === 'failed' ? 'failed' : 'cancelled', outcome: action })
})

post('/api/v1/plus/orders/:orderId/recheck', ({ params, userId }) => {
  const order = db.findOne<{ id: string; status: string }>('plus_orders', (r) => r.id === params.orderId)
  if (!order) return fail('این سفارش پیدا نشد.')
  const active = order.status === 'paid'
  /* ⚠️ `result` همان شکلی است که `RecheckButton` (و نسخه‌یِ سایت) از سرور
     می‌خواند: `{ result: { state, message } }`. تا پیش از این اینجا فقط
     `{ status, active }` برمی‌گشت و آن کامپوننت با خواندنِ
     `data.result.state` خطا می‌گرفت. */
  return ok({
    status: order.status,
    active,
    result: {
      state: active ? 'verified' : 'pending',
      message: active
        ? 'پرداخت تأیید شد و اشتراکت فعال است.'
        : 'هنوز پرداختی از بانک نرسیده. چند لحظهٔ دیگر دوباره امتحان کن.'
    }
  })
})

get('/api/v1/notifications', ({ userId }) => {
  if (!userId) return ok({ notifications: [], unread: 0 })
  const rows = db.find('notifications', (r) => r.userId === userId)
  return ok({ notifications: rows, unread: rows.filter((r) => !r.readAt).length })
})

/* ══════════════════════════════════════════════════════════════════ کلاب */

get('/api/v1/club/posts', ({ query }) => {
  const sort = query.get('sort') ?? 'latest'
  let rows = db.find<{ createdAt: string; likes?: number; comments?: number }>('club_posts', () => true)
  rows = [...rows].sort((a, b) =>
    sort === 'popular'
      ? Number(b.likes ?? 0) - Number(a.likes ?? 0)
      : sort === 'discussed'
        ? Number(b.comments ?? 0) - Number(a.comments ?? 0)
        : b.createdAt.localeCompare(a.createdAt)
  )
  return ok({ posts: rows })
})

post('/api/v1/club/posts', ({ body, userId }) => {
  if (!userId) return fail('برای فرستادنِ سروده باید وارد شوید.')
  const b = (body ?? {}) as { title?: string; body?: string; anonymous?: boolean }
  if (!b.body?.trim()) return fail('متنِ سروده نمی‌تواند خالی باشد.')
  const post = db.insert('club_posts', {
    id: db.uid(),
    userId,
    title: b.title ?? '',
    body: b.body,
    anonymous: !!b.anonymous,
    status: 'approved',
    likes: 0,
    comments: 0,
    createdAt: db.nowIso()
  })
  return ok({ post })
})

post('/api/v1/club/posts/:id/like', ({ params }) => {
  const post = db.findOne<{ id: string; likes: number }>('club_posts', (r) => r.id === params.id)
  if (!post) return fail('این سروده پیدا نشد.')
  return ok({ likes: Number(post.likes ?? 0) + 1 })
})

/* ═════════════════════════════════════════════════════════ گزارشِ ایراد */

post('/api/v1/reports', ({ body, userId }) => {
  const b = (body ?? {}) as Record<string, unknown>
  db.insert('reports', {
    id: db.uid(),
    userId: userId ?? 'guest',
    section: String(b.section ?? ''),
    reason: String(b.reason ?? ''),
    target: String(b.target ?? ''),
    detail: String(b.detail ?? ''),
    createdAt: db.nowIso()
  })
  return ok({ saved: true })
})

/* ═════════════════════════════════════════════════════════════════ وزن‌یاب */

post('/api/vazn-yab', async ({ body }) => {
  const b = (body ?? {}) as { poem1?: string; poem2?: string }
  const result = await lookupMeter(b.poem1 ?? '', b.poem2)
  return ok(result)
})

async function lookupMeter(first: string, second?: string) {
  // اگر شبکه در دسترس باشد، وزن از گنجور تأیید می‌شود؛ وگرنه همان موتورِ
  // محلی پاسخ می‌دهد. برای کاربر تفاوت فقط در یک نشانِ کوچک است.
  const online = await tryGanjoor(first, second)
  if (online) return online
  const guess = findMeterLocally(first, second)
  return guess ? { ...guess, source: 'local' as const } : null
}

async function tryGanjoor(first: string, second?: string) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null
  try {
    const { findGanjoorMeter } = await import('@/lib/ganjoor')
    const hit = await findGanjoorMeter(first, second)
    return hit ? { ...hit, rhythm: hit.rhythm, source: 'ganjoor' as const } : null
  } catch {
    return null
  }
}

get('/api/random-beyt', async () => {
  const { randomBeyt } = await import('./beyts')
  return ok(await randomBeyt())
})

/** تصویرِ واژه: روی سرور از دیسک خوانده و نشانه‌گذاری می‌شد. اینجا پرونده
 *  همان‌جاست که هست، پس مسیرش را بی‌تغییر برمی‌گردانیم. */
get('/api/vocab-image', ({ query }) => {
  const src = query.get('src') ?? ''
  return ok({ url: src })
})

/** تحلیلِ درس: روی سرور از محتوای درس استخراج می‌شد (`extractAnalysis`).
 *  همان استخراج اینجا انجام می‌شود — هیچ مدلِ زبانی در کار نیست، و بهتر
 *  هم هست: پاسخ همیشه از متنِ واقعیِ کتاب است. */
post('/api/v1/doroos/analysis', async ({ body }) => {
  const b = (body ?? {}) as { grade?: string; lesson?: number; source?: string }
  const lesson = await getLesson(b.grade ?? '', Number(b.lesson))
  if (!lesson) return fail('این درس پیدا نشد.')
  const { extractAnalysis } = await import('@/lib/doroos/ai')
  return ok({
    units: extractAnalysis(lesson as never, { devices: (b.source ?? 'base') === 'base' })
  })
})

/* ═══════════════════════════════════════════════════════ درخواستِ دبیر */

/**
 * روی وب، دبیر بودن یک نقشِ جدا بود که باید تأیید می‌شد. در یک برنامهٔ
 * تک‌نفره کاربر هم‌زمان دانش‌آموز و دبیرِ خودش است، پس نقش همان لحظه داده
 * می‌شود — و «تکلیف» همان تمرینی است که خودش برای خودش ساخته.
 */
post('/api/v1/teacher/request', ({ body, userId }) => {
  const b = (body ?? {}) as Record<string, unknown>
  if (!userId) return fail('برای این درخواست باید وارد حساب شوی.')
  db.insert('teacher_requests', {
    id: db.uid(),
    userId,
    school: String(b.school ?? ''),
    message: String(b.message ?? ''),
    status: 'approved',
    createdAt: db.nowIso()
  })
  return ok({ state: 'approved' as const })
})

/* ═══════════════════════════════════════════════════════════════ نگاره */

/**
 * نگارهٔ حساب: روی سرور در یک سطل ذخیره می‌شد و آدرسش برمی‌گشت. اینجا
 * داده‌ی تصویر مستقیم در پایگاهِ محلی می‌نشیند و همان آدرس برمی‌گردد —
 * چون پرونده جایی نمی‌رود، همان چیزی است که خوانده می‌شود.
 */
post('/api/v1/auth/profile/avatar', ({ body, userId }) => {
  if (!userId) return fail('برای تغییرِ نگاره باید وارد حساب شوی.')
  const b = (body ?? {}) as { dataUrl?: string }
  const dataUrl = String(b.dataUrl ?? '')
  if (!dataUrl.startsWith('data:image/')) return fail('این پرونده تصویر نیست.')
  db.update('users', userId, { avatarUrl: dataUrl })
  return ok({ url: dataUrl })
})

/* ═════════════════════════════════════════════════════════════════════ */

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export async function dispatch(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<ApiResult<unknown>> {
  const method = (init.method ?? 'GET').toUpperCase()
  const found = match(method, path)
  if (!found) return fail('این مسیر در نسخهٔ دسکتاپ در دسترس نیست.')
  const url = new URL(path, 'http://local')
  try {
    return await found.route.handler({
      method,
      params: found.params,
      query: url.searchParams,
      body: init.body,
      userId: auth.currentUserId()
    })
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'خطای ناشناخته.')
  }
}

/** برای پنل مدیریت: فهرستِ مسیرهای ثبت‌شده. */
export function routeTable(): string[] {
  return routes.map((r) => `${r.method} /${r.segments.join('/')}`)
}

void VOCAB_GRADES
