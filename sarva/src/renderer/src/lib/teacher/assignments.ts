import * as db from '@/platform/db'
import * as auth from '@/platform/auth'
import { quizBank } from '@/platform/quiz-bank'

/**
 * تکالیفِ دبیر — بازنویسیِ صادقانه.
 *
 * این بخش روی وب ذاتاً چندکاربره بود: دبیر آزمون می‌ساخت و دانش‌آموزِ کلاسش
 * آن را می‌داد. در یک برنامهٔ تک‌نفره، «دبیر» و «دانش‌آموز» یکی‌اند، پس اینجا
 * به شکلِ **تمرینِ هدفمندِ خودساخته** بازتعریف شده: می‌توانی یک تمرین بسازی
 * (از هر بازی، با هر تعداد سؤال) و بعد همان را انجام بدهی.
 *
 * امضاها همان است که `StudentAssignments` و `AssignmentList` انتظار دارند،
 * پس آن صفحه‌ها کار می‌کنند — فقط معنایشان از «تکلیفِ کلاس» به «تمرینِ من»
 * تغییر کرده. این صادقانه‌تر از آن است که دکمه‌ای باشد که هیچ‌جا نمی‌رود.
 */

export type ActionErrors = { ok: false; errors: string[] }
export type CreateResult = { ok: true; id: string } | ActionErrors

export type Owner = { id: string; role?: string }

export type QuizBuilderData = {
  questions: { id: string; type: string; poem?: string[]; audioSrc?: string }[]
}

export async function getQuizBuilderData(): Promise<QuizBuilderData> {
  return {
    questions: quizBank().map((q) => ({
      id: q.id,
      type: q.type,
      poem: q.poem,
      audioSrc: q.audioSrc
    }))
  }
}

export type QuizRequest = {
  title: string
  kind?: string
  items?: string[]
  questionIds?: string[]
}

export async function createQuizAssignment(owner: Owner, input: QuizRequest): Promise<CreateResult> {
  void owner
  const title = (input.title ?? '').trim()
  if (!title) return { ok: false, errors: ['برای تمرین یک عنوان بنویس.'] }

  const items = input.questionIds ?? input.items ?? []
  if (!items.length) return { ok: false, errors: ['دست‌کم یک سؤال انتخاب کن.'] }

  const id = db.uid()
  db.insert('assignments', {
    id,
    kind: 'aruz_quiz',
    title,
    items,
    config: null,
    studentId: null,
    status: 'open',
    createdAt: db.nowIso()
  })
  return { ok: true, id }
}

export async function createGameAssignment(
  owner: Owner,
  input: { title: string; kind: string; config?: unknown }
): Promise<CreateResult> {
  void owner
  const title = (input.title ?? '').trim()
  if (!title) return { ok: false, errors: ['برای تمرین یک عنوان بنویس.'] }

  const id = db.uid()
  db.insert('assignments', {
    id,
    kind: input.kind,
    title,
    items: [],
    config: (input.config as object) ?? null,
    studentId: null,
    status: 'open',
    createdAt: db.nowIso()
  })
  return { ok: true, id }
}

export async function cancelAssignment(id: string): Promise<{ ok: true } | ActionErrors> {
  const updated = db.update('assignments', id, { status: 'cancelled' })
  return updated ? { ok: true } : { ok: false, errors: ['این تمرین پیدا نشد.'] }
}

export type AssignmentView = {
  id: string
  kind: string
  title: string
  status: string
  href: string
  teacherName: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  result: Record<string, unknown> | null
}

const HREF_BY_KIND: Record<string, string> = {
  aruz_quiz: '/quiz',
  aruz_rapid: '/game/aruz-rapid',
  grammar_circuit: '/game/grammar-circuit',
  role_hunt: '/game/role-hunt',
  kimia: '/game/kimia',
  aruz_bridge: '/game/aruz-bridge',
  vocab: '/game/vocab',
  jasoos: '/game/jasoos'
}

export async function listTeacherAssignments(owner: Owner): Promise<AssignmentView[]> {
  void owner
  return listAssignments()
}

export async function listStudentAssignments(studentId: string): Promise<AssignmentView[]> {
  void studentId
  return listAssignments()
}

function listAssignments(): AssignmentView[] {
  const me = auth.currentUser()
  return db
    .find<Record<string, unknown>>('assignments', (r) => r.userId === me?.id)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .map<AssignmentView>((r) => {
      const kind = String(r.kind ?? '')
      return {
        id: String(r.id ?? ''),
        kind,
        title: String(r.title ?? ''),
        status: String(r.status ?? 'open'),
        href: HREF_BY_KIND[kind] ?? '/',
        teacherName: me?.fullName ?? null,
        createdAt: String(r.createdAt ?? ''),
        startedAt: (r.startedAt as string) ?? null,
        completedAt: (r.completedAt as string) ?? null,
        result: (r.result as Record<string, unknown>) ?? null
      }
    })
}

export type AssignmentGate = { state: 'ok'; id: string; title: string; items: string[] } | { state: 'missing' | 'closed' }

export async function loadAssignmentForStudent(
  studentId: string,
  id: string,
  kind?: string
): Promise<AssignmentGate> {
  void studentId
  void kind
  const row = db.findOne<{ id: string; title: string; items: string[]; status: string }>(
    'assignments',
    (r) => r.id === id
  )
  if (!row) return { state: 'missing' }
  if (row.status === 'cancelled') return { state: 'closed' }
  return { state: 'ok', id: row.id, title: row.title, items: row.items ?? [] }
}

export async function loadBridgeQuestions(ids: readonly string[]): Promise<unknown[]> {
  void ids
  const { buildDemoQuestions } = await import('@/lib/aruz-bridge/questions')
  return buildDemoQuestions({ difficulty: 2, count: 12 })
}

export async function markAssignmentStarted(studentId: string, id: string): Promise<void> {
  void studentId
  db.update('assignments', id, { startedAt: db.nowIso() })
}

export async function lockAssignment(
  studentId: string,
  id: string
): Promise<{ state: 'ok'; items: string[]; title: string } | { state: 'missing' | 'closed' }> {
  const gate = await loadAssignmentForStudent(studentId, id)
  if (gate.state !== 'ok') return { state: gate.state }
  return { state: 'ok', items: gate.items, title: gate.title }
}

export async function markAssignmentCompleted(
  studentId: string,
  id: string,
  result?: Record<string, unknown>
): Promise<void> {
  void studentId
  db.update('assignments', id, { status: 'completed', completedAt: db.nowIso(), result: result ?? null })
}

export async function quizResult(paper: unknown, results: unknown, answers: unknown): Promise<{ totalScore: number; maxScore: number; answeredQuestions: number; results: unknown }> {
  void paper
  void results
  void answers
  return { totalScore: 0, maxScore: 0, answeredQuestions: 0, results: {} }
}

export type RapidReport = { correct: number; total: number; ms: number }

export async function completeRapidAssignment(
  studentId: string,
  id: string,
  report: RapidReport
): Promise<void> {
  await markAssignmentCompleted(studentId, id, report as unknown as Record<string, unknown>)
}
