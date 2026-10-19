import type { ChapterPlan, LessonPlan } from './types'
import { ch1, ch2 } from './ch12'
import { ch3 } from './ch3'
import { ch4 } from './ch4'
import { fixPlanMaps } from './mapfixes'

/**
 * جغرافیای سیاسی پایهٔ هر درس.
 * هر نقشه باید از گام اول «جهانِ همان دوره» را نشان بدهد، نه یک صفحهٔ خالی.
 * این نواحی کمرنگ‌اند و قلمرو گام‌ها رویشان پررنگ می‌شود.
 */
const IRAN = ['iraq', 'jibal', 'fars', 'kerman', 'khurasan', 'azerbaijan', 'tabaristan', 'khuzestan']
const IRAN_WIDE = [...IRAN, 'transoxiana', 'caucasus']
const ARABIA = ['hejaz', 'yemen', 'jazira', 'sham', 'iraq', 'oman']
const ISLAM_WORLD = [
  ...IRAN_WIDE,
  'hejaz',
  'yemen',
  'jazira',
  'sham',
  'egypt',
  'maghrib',
  'andalus',
  'sind',
  'anatolia'
]
const EUROPE = ['europe', 'byzantium', 'anatolia', 'sham', 'egypt', 'maghrib', 'andalus']

const BASE: Record<number, string[]> = {
  1: IRAN,
  2: ISLAM_WORLD,
  3: ARABIA,
  4: ['hejaz', 'jazira', 'sham', 'iraq', 'yemen'],
  5: [...ISLAM_WORLD, 'byzantium'],
  6: ISLAM_WORLD,
  7: ISLAM_WORLD,
  8: [...IRAN_WIDE, 'jazira'],
  9: ISLAM_WORLD,
  10: [...IRAN_WIDE, 'anatolia'],
  11: [...IRAN_WIDE, 'jazira', 'anatolia'],
  12: [...IRAN_WIDE, 'jazira'],
  13: [...IRAN_WIDE, 'jazira', 'anatolia'],
  14: IRAN,
  15: EUROPE,
  16: [...EUROPE, 'europe', 'hejaz', 'iraq', 'sind']
}

const withBase = (plan: LessonPlan): LessonPlan => ({
  ...plan,
  scenes: plan.scenes.map((scene) => ({
    ...scene,
    maps: scene.maps?.map((m) => ({
      ...m,
      spec: { ...m.spec, base: m.spec.base ?? (BASE[plan.lesson] ?? IRAN) }
    }))
  }))
})

export const chapterPlans: ChapterPlan[] = [ch1, ch2, ch3, ch4].map((c) => ({
  ...c,
  lessons: c.lessons.map(fixPlanMaps).map(withBase)
}))

export const planByChapter = (n: number): ChapterPlan | undefined => chapterPlans.find((c) => c.chapter === n)

export const allLessonPlans: LessonPlan[] = chapterPlans.flatMap((c) => c.lessons)

export const planByLesson = (id: number): LessonPlan | undefined => allLessonPlans.find((p) => p.lesson === id)

export const planChapterOfLesson = (id: number): ChapterPlan | undefined =>
  chapterPlans.find((c) => c.lessons.some((l) => l.lesson === id))
