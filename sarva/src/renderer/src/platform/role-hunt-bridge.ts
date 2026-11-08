import { buildRoleHuntRound } from '@/lib/role-hunt/round'
import type { RoleHuntRound } from '@/lib/role-hunt/types'
import type { GrammarCircuitQuestion } from '@/lib/grammar-circuit/types'

/**
 * «شکارِ نقش‌ها» — دورها از همان پرسش‌های «مدار دستور» ساخته می‌شوند.
 *
 * روی سرور این کار را `app/api/v1/role-hunt/rounds/route.ts` می‌کرد و پرسش‌ها
 * از دیتابیس می‌آمدند. اینجا همان تابعِ خالصِ خودِ سروا (`buildRoleHuntRound`)
 * روی بستهٔ seed اجرا می‌شود؛ منطقِ تشخیص ذره‌ای عوض نشده است.
 */

let pool: GrammarCircuitQuestion[] | null = null

async function loadPool(): Promise<GrammarCircuitQuestion[]> {
  if (pool) return pool
  const grades = ['dahom', 'yazdahom', 'davazdahom'] as const
  const out: GrammarCircuitQuestion[] = []

  for (const grade of grades) {
    const mod = await import(`@/data/seeds/grammar-circuit/${grade}-v1.json`)
    const rows = ((mod.default ?? mod) as { questions?: GrammarCircuitQuestion[] }[] | GrammarCircuitQuestion[])
    out.push(...(Array.isArray(rows) ? (rows as GrammarCircuitQuestion[]) : []))
  }

  pool = out
  return out
}

export async function buildRoleHuntRounds(count: number): Promise<RoleHuntRound[]> {
  const questions = await loadPool()
  if (!questions.length) return []

  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  const rounds: RoleHuntRound[] = []

  for (const question of shuffled) {
    if (rounds.length >= count) break
    try {
      const round = buildRoleHuntRound(question)
      if (round) rounds.push(round)
    } catch {
      // پرسشی که برای این بازی مناسب نیست (مصراعِ کوتاه، نقشِ مبهم) رد می‌شود.
    }
  }
  return rounds
}
