import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayKey, daysAgoKey, levelFromXp } from '../lib/utils'

export type Theme = 'dark' | 'light'

export interface QuizRecord {
  correct: number
  total: number
  at: string
}

export interface ExamRecord {
  examId: string
  correct: number
  total: number
  at: string
  seconds: number
}

export interface CardState {
  box: number
  due: number
  seen: number
  known: number
}

export interface Settings {
  theme: Theme
  motion: boolean
  fontScale: number
  examDate: string
  examTitle: string
}

interface State {
  xp: number
  completed: number[]
  lessonProgress: Record<number, number>
  quizzes: Record<string, QuizRecord>
  exams: ExamRecord[]
  cards: Record<string, CardState>
  bookmarks: string[]
  notes: Record<number, string>
  days: string[]
  dailyXp: Record<string, number>
  quests: Record<string, string[]>
  visited: { timeline: boolean; map: boolean; figures: boolean }
  lastLesson: number | null
  settings: Settings
  addXp: (n: number) => void
  markQuest: (id: string, xp: number) => void
  completeLesson: (id: number) => void
  setLessonProgress: (id: number, value: number) => void
  recordQuiz: (id: string, correct: number, total: number) => void
  recordExam: (r: Omit<ExamRecord, 'at'>) => void
  reviewCard: (id: string, grade: 0 | 1 | 2 | 3) => void
  toggleBookmark: (id: string) => void
  saveNote: (lesson: number, text: string) => void
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  visit: (key: 'timeline' | 'map' | 'figures') => void
  setLastLesson: (id: number) => void
  reset: () => void
  importState: (raw: string) => boolean
}

const initial = {
  xp: 0,
  completed: [],
  lessonProgress: {},
  quizzes: {},
  exams: [],
  cards: {},
  bookmarks: [],
  notes: {},
  days: [],
  dailyXp: {},
  quests: {},
  visited: { timeline: false, map: false, figures: false },
  lastLesson: null,
  settings: {
    theme: 'dark' as Theme,
    motion: true,
    fontScale: 1,
    examDate: '2027-06-05',
    examTitle: 'امتحان نهایی خرداد'
  }
}

function touchToday(days: string[]): string[] {
  const t = todayKey()
  return days.includes(t) ? days : [...days, t]
}

export function streakLength(days: string[]): number {
  if (!days.length) return 0
  const set = new Set(days)
  if (!set.has(todayKey()) && !set.has(daysAgoKey(1))) return 0
  let n = 0
  let offset = set.has(todayKey()) ? 0 : 1
  while (set.has(daysAgoKey(offset))) {
    n++
    offset++
  }
  return n
}

export const useProgress = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      addXp: (n) =>
        set((s) => {
          const t = todayKey()
          return {
            xp: s.xp + n,
            days: touchToday(s.days),
            dailyXp: { ...s.dailyXp, [t]: (s.dailyXp[t] ?? 0) + n }
          }
        }),
      markQuest: (id, xp) =>
        set((s) => {
          const t = todayKey()
          const done = s.quests[t] ?? []
          if (done.includes(id)) return {}
          return {
            quests: { ...s.quests, [t]: [...done, id] },
            xp: s.xp + xp,
            days: touchToday(s.days),
            dailyXp: { ...s.dailyXp, [t]: (s.dailyXp[t] ?? 0) + xp }
          }
        }),
      completeLesson: (id) =>
        set((s) => {
          if (s.completed.includes(id)) return { lessonProgress: { ...s.lessonProgress, [id]: 100 } }
          const t = todayKey()
          return {
            completed: [...s.completed, id],
            lessonProgress: { ...s.lessonProgress, [id]: 100 },
            xp: s.xp + 60,
            days: touchToday(s.days),
            dailyXp: { ...s.dailyXp, [t]: (s.dailyXp[t] ?? 0) + 60 }
          }
        }),
      setLessonProgress: (id, value) =>
        set((s) => ({
          lessonProgress: { ...s.lessonProgress, [id]: Math.max(s.lessonProgress[id] ?? 0, Math.min(100, value)) }
        })),
      recordQuiz: (id, correct, total) =>
        set((s) => {
          const prev = s.quizzes[id]
          const best = prev && prev.correct / prev.total >= correct / total ? prev.correct : correct
          const t = todayKey()
          const gain = Math.max(0, correct - (prev?.correct ?? 0)) * 5
          return {
            quizzes: { ...s.quizzes, [id]: { correct: best, total, at: new Date().toISOString() } },
            xp: s.xp + gain,
            days: touchToday(s.days),
            dailyXp: { ...s.dailyXp, [t]: (s.dailyXp[t] ?? 0) + gain }
          }
        }),
      recordExam: (r) =>
        set((s) => {
          const t = todayKey()
          return {
            exams: [{ ...r, at: new Date().toISOString() }, ...s.exams].slice(0, 30),
            xp: s.xp + r.correct * 8,
            days: touchToday(s.days),
            dailyXp: { ...s.dailyXp, [t]: (s.dailyXp[t] ?? 0) + r.correct * 8 }
          }
        }),
      reviewCard: (id, grade) =>
        set((s) => {
          const prev = s.cards[id] ?? { box: 0, due: Date.now(), seen: 0, known: 0 }
          const box = grade === 0 ? 0 : grade === 1 ? Math.max(0, prev.box) : Math.min(4, prev.box + 1)
          const gaps = [0, 1, 2, 4, 8]
          const due = Date.now() + gaps[box] * 86400000
          const gain = grade === 0 ? 0 : 3
          const t = todayKey()
          return {
            cards: {
              ...s.cards,
              [id]: { box, due, seen: prev.seen + 1, known: prev.known + (grade > 1 ? 1 : 0) }
            },
            xp: s.xp + gain,
            days: touchToday(s.days),
            dailyXp: { ...s.dailyXp, [t]: (s.dailyXp[t] ?? 0) + gain }
          }
        }),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id]
        })),
      saveNote: (lesson, text) => set((s) => ({ notes: { ...s.notes, [lesson]: text } })),
      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      visit: (key) => set((s) => (s.visited[key] ? {} : { visited: { ...s.visited, [key]: true } })),
      setLastLesson: (id) => set({ lastLesson: id }),
      reset: () => set({ ...initial }),
      importState: (raw) => {
        try {
          const parsed = JSON.parse(raw)
          const data = parsed?.state ?? parsed
          if (typeof data !== 'object' || data === null) return false
          set({ ...initial, ...data, settings: { ...initial.settings, ...(data.settings ?? {}) } })
          return true
        } catch {
          return false
        }
      }
    }),
    {
      name: 'tabar-history-v1',
      version: 1,
      partialize: (s) => ({
        xp: s.xp,
        completed: s.completed,
        lessonProgress: s.lessonProgress,
        quizzes: s.quizzes,
        exams: s.exams,
        cards: s.cards,
        bookmarks: s.bookmarks,
        notes: s.notes,
        days: s.days,
        dailyXp: s.dailyXp,
        quests: s.quests,
        visited: s.visited,
        lastLesson: s.lastLesson,
        settings: s.settings
      })
    }
  )
)

export const useLevel = () => levelFromXp(useProgress((s) => s.xp))
export const useStreak = () => streakLength(useProgress((s) => s.days))
