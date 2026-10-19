import { normalizeFa } from './utils'

export type Kind = 'h' | 'p' | 'note' | 'chart' | 'table' | 'ex' | 'q' | 'ans'
export interface BookBlock {
  t: Kind
  text: string
}
export interface BookLesson {
  id: number
  blocks: BookBlock[]
}
export interface BookSummary {
  lesson: number
  items: string[]
}

export interface PaperAnswer {
  n: string
  text: string
}

export interface Paper {
  id: string
  num: number
  term: string
  title: string
  minutes: number
  questions: string[]
  answers: PaperAnswer[]
}

export interface BookBank {
  tf: { lesson: number; text: string; answer: boolean }[]
  qa: { lesson: number; q: string; a: string }[]
}

let bookPromise: Promise<BookLesson[]> | null = null
let bankPromise: Promise<BookBank> | null = null
const byId: Record<number, BookLesson> = {}

export function loadBook(): Promise<BookLesson[]> {
  if (!bookPromise) {
    bookPromise = import('../data/book/full.json').then((mod) => {
      const list = (mod.default ?? mod) as unknown as BookLesson[]
      list.forEach((l) => (byId[l.id] = l))
      return list
    })
  }
  return bookPromise
}

export function bookLesson(id: number): BookLesson | undefined {
  return byId[id]
}

let summaryPromise: Promise<BookSummary[]> | null = null
const summaryById: Record<number, BookSummary> = {}

export function loadSummary(): Promise<BookSummary[]> {
  if (!summaryPromise) {
    summaryPromise = import('../data/book/summary.json').then((mod) => {
      const list = (mod.default ?? mod) as unknown as BookSummary[]
      list.forEach((l) => (summaryById[l.lesson] = l))
      return list
    })
  }
  return summaryPromise
}

export function bookSummary(id: number): BookSummary | undefined {
  return summaryById[id]
}

let papersPromise: Promise<Paper[]> | null = null
const paperIndex: Record<string, Paper> = {}

export function loadPapers(): Promise<Paper[]> {
  if (!papersPromise) {
    papersPromise = import('../data/book/papers.json').then((mod) => {
      const list = (mod.default ?? mod) as unknown as Paper[]
      list.forEach((p) => (paperIndex[p.id] = p))
      return list
    })
  }
  return papersPromise
}

export function paperById(id: string | undefined): Paper | undefined {
  return id ? paperIndex[id] : undefined
}

export function loadExamBank(): Promise<BookBank> {
  if (!bankPromise) {
    bankPromise = import('../data/book/exam.json').then((mod) => (mod.default ?? mod) as unknown as BookBank)
  }
  return bankPromise
}

export interface BookHit {
  lesson: number
  kind: Kind
  snippet: string
}

/** جست‌وجوی تمام‌متن در متن کتاب درسی */
export async function searchBook(query: string, limit = 6): Promise<BookHit[]> {
  const q = normalizeFa(query.trim())
  if (q.length < 3) return []
  const list = await loadBook()
  const hits: BookHit[] = []
  for (const lesson of list) {
    for (const b of lesson.blocks) {
      if (b.t === 'ex') continue
      const hay = normalizeFa(b.text)
      const idx = hay.indexOf(q)
      if (idx === -1) continue
      const start = Math.max(0, idx - 34)
      const end = Math.min(b.text.length, idx + 74)
      const snippet = `${start > 0 ? '…' : ''}${b.text.slice(start, end)}${end < b.text.length ? '…' : ''}`
      hits.push({ lesson: lesson.id, kind: b.t, snippet })
      break
    }
    if (hits.length >= limit * 3) break
  }
  return hits.slice(0, limit)
}
