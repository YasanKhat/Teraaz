import { badges } from '../data/exams'
import { streakLength } from '../store/useProgress'
import { pct } from './utils'

interface BadgeInput {
  xp: number
  completed: number[]
  quizzes: Record<string, { correct: number; total: number }>
  exams: { examId: string; correct: number; total: number }[]
  cards: Record<string, { known: number }>
  days: string[]
  visited: { timeline: boolean; map: boolean; figures: boolean }
}

export function earnedBadges(s: BadgeInput): string[] {
  const known = Object.values(s.cards).reduce((sum, c) => sum + c.known, 0)
  const streak = streakLength(s.days)
  const map: Record<string, boolean> = {
    'first-lesson': s.completed.length >= 1,
    'five-lessons': s.completed.length >= 5,
    'all-lessons': s.completed.length >= 16,
    'first-quiz': Object.keys(s.quizzes).length >= 1,
    'perfect-quiz': Object.values(s.quizzes).some((q) => q.total > 0 && q.correct === q.total),
    'streak-3': streak >= 3,
    'streak-7': streak >= 7,
    'xp-1000': s.xp >= 1000,
    'all-cards': known >= 30,
    'exam-80': s.exams.some((e) => pct(e.correct, e.total) >= 80),
    timeline: s.visited.timeline,
    map: s.visited.map,
    figures: s.visited.figures,
    'final-exam': s.exams.some((e) => e.examId.startsWith('final') && pct(e.correct, e.total) >= 80)
  }
  return badges.filter((b) => map[b.rule]).map((b) => b.id)
}
