import type { ChapterPlan, LessonPlan } from './types'
import { ch1, ch2 } from './ch12'
import { ch3 } from './ch3'
import { ch4 } from './ch4'

export const chapterPlans: ChapterPlan[] = [ch1, ch2, ch3, ch4]

export const planByChapter = (n: number): ChapterPlan | undefined => chapterPlans.find((c) => c.chapter === n)

export const allLessonPlans: LessonPlan[] = chapterPlans.flatMap((c) => c.lessons)

export const planByLesson = (id: number): LessonPlan | undefined => allLessonPlans.find((p) => p.lesson === id)

export const planChapterOfLesson = (id: number): ChapterPlan | undefined =>
  chapterPlans.find((c) => c.lessons.some((l) => l.lesson === id))
