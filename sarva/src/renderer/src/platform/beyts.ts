import type { Lesson } from '@/lib/doroos/types'
import { getLesson, GRADE_META } from '@/lib/doroos'
import { quizBank } from './quiz-bank'

/**
 * «بیت تصادفی» برای وزن‌یاب.
 *
 * روی وب این بیت از API عمومیِ گنجور می‌آمد. در یک برنامهٔ آفلاین آن مسیر
 * بسته است، پس بیت از دو منبعِ رویِ دستگاه می‌آید: ابیاتِ درسنامه (با نامِ
 * شاعر و کتابِ واقعی) و ابیاتِ بانکِ آزمونِ وزن. اگر اینترنت وصل باشد،
 * گنجور ابتدا تلاش می‌شود و این‌ها پشتیبان می‌مانند.
 */

export type Beyt = {
  poet: string
  book: string
  poem: string
  couplet: { first: string; second: string }
  meter?: string | null
  source: 'ganjoor' | 'doroos' | 'bank'
}

const GRADE_KEYS = ['dahom', 'yazdahom', 'davazdahom'] as const

function coupletsOf(lesson: Lesson): { first: string; second: string }[] {
  const out: { first: string; second: string }[] = []
  if (lesson.kind === 'poem') {
    for (const b of lesson.beyts) {
      if (b.hemistichs?.[0] && b.hemistichs[1]) {
        out.push({ first: b.hemistichs[0], second: b.hemistichs[1] })
      }
    }
  } else {
    for (const p of lesson.passages) {
      if (p.form === 'verse' && p.lines?.[0] && p.lines[1]) {
        out.push({ first: p.lines[0], second: p.lines[1] })
      }
    }
  }
  return out
}

export async function randomBeyt(): Promise<Beyt | null> {
  const online = await tryGanjoor()
  if (online) return online

  // دو سومِ مواقع از درسنامه (ابیاتِ کتابِ درسی، با شاعر و عنوان)؛
  // باقی از بانکِ آزمونِ وزن.
  if (Math.random() < 0.66) {
    const fromBook = await randomFromDoroos()
    if (fromBook) return fromBook
  }
  return randomFromBank()
}

async function randomFromDoroos(): Promise<Beyt | null> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const grade = GRADE_KEYS[Math.floor(Math.random() * GRADE_KEYS.length)]
    const lessonNumber = 1 + Math.floor(Math.random() * 18)
    const lesson = await getLesson(grade, lessonNumber)
    if (!lesson) continue

    const couplets = coupletsOf(lesson)
    if (!couplets.length) continue

    const couplet = couplets[Math.floor(Math.random() * couplets.length)]
    const meta = GRADE_META.find((g) => g.key === grade)

    return {
      poet: lesson.kind === 'poem' ? (lesson.poet ?? '—') : (lesson.author ?? '—'),
      book: meta?.book ?? '',
      poem: lesson.title ?? '',
      couplet,
      meter: null,
      source: 'doroos'
    }
  }
  return null
}

function randomFromBank(): Beyt | null {
  const withPoem = quizBank().filter((q) => q.poem && q.poem.length >= 2)
  if (!withPoem.length) return null
  const q = withPoem[Math.floor(Math.random() * withPoem.length)]
  return {
    poet: '—',
    book: '',
    poem: '',
    couplet: { first: q.poem![0], second: q.poem![1] },
    meter: null,
    source: 'bank'
  }
}

async function tryGanjoor(): Promise<Beyt | null> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null
  try {
    const res = await fetch('https://api.ganjoor.net/api/ganjoor/poem/random', {
      signal: AbortSignal.timeout(4000)
    })
    if (!res.ok) return null
    const poem = (await res.json()) as {
      fullTitle?: string
      poet?: { name?: string; nickname?: string }
      category?: { title?: string }
      plainText?: string
    }
    const lines = (poem.plainText ?? '').split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) return null
    return {
      poet: poem.poet?.nickname || poem.poet?.name || '—',
      book: poem.category?.title ?? '',
      poem: poem.fullTitle ?? '',
      couplet: { first: lines[0].trim(), second: lines[1].trim() },
      meter: null,
      source: 'ganjoor'
    }
  } catch {
    return null
  }
}
