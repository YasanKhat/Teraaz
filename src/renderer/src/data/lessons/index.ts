import type { Lesson, QuizQ } from '../types'
import { lesson1, lesson2, lesson3, lesson4 } from './lessons-01-04'
import { lesson5, lesson6, lesson7, lesson8 } from './lessons-05-08'
import { lesson9, lesson10, lesson11, lesson12 } from './lessons-09-12'
import { lesson13, lesson14, lesson15, lesson16 } from './lessons-13-16'

export const lessons: Lesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
  lesson5,
  lesson6,
  lesson7,
  lesson8,
  lesson9,
  lesson10,
  lesson11,
  lesson12,
  lesson13,
  lesson14,
  lesson15,
  lesson16
]

export const lessonById = (id: number): Lesson | undefined => lessons.find((l) => l.id === id)
export const lessonBySlug = (slug: string): Lesson | undefined => lessons.find((l) => l.slug === slug)

export const allQuestions: QuizQ[] = lessons.flatMap((l) => l.quiz)

export const questionById = (id: string): QuizQ | undefined => allQuestions.find((q) => q.id === id)

export const lessonsByChapter = (chapter: number): Lesson[] => lessons.filter((l) => l.chapter === chapter)

export const totalMinutes = lessons.reduce((sum, l) => sum + l.minutes, 0)
