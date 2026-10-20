/**
 * متنِ خودِ کتاب درسی، بخش‌به‌بخش.
 *
 * چرا لازم است؟ چون دانش‌آموز باید بداند کدام جمله «متن کتاب» است و باید
 * بازتولیدش کند، و کدام جمله «توضیح ما» است برای فهمیدن. این ماژول متن
 * رسمی کتاب (book/full.json) را به بخش‌های درس تقسیم می‌کند تا هر قابِ
 * درس بتواند عین عبارت کتاب را نشان دهد.
 */
import book from './full.json'
import { normalizeFa } from '../../lib/utils'

type Block = { t: string; text: string }

export interface BookSection {
  lesson: number
  /** سرصفحهٔ کتاب */
  title: string
  /** بندهای متنی همان بخش (بدون پرسش و پاسخ‌نامه) */
  paras: string[]
}

const clean = (s: string) =>
  s
    .replace(/\u200f|\u200e/g, '')
    .replace(/\[[۰-۹\d]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** سرصفحه‌های شماره‌دار یا حرفی، تقسیم‌بندی طبیعی کتاب‌اند */
const isHeading = (b: Block) => b.t === 'h'

const STOP = new Set(
  'از به با در که و یا بر را این آن است بود شد شده می‌شود برای نیز تا هر چه خود های ها یک درون میان دربارهٔ دورهٔ عصر قرن سده بخش فصل درس'.split(
    /\s+/
  )
)

const tokens = (s: string) =>
  new Set(
    normalizeFa(s)
      .replace(/[^\u0600-\u06FF\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  )

const overlap = (a: Set<string>, b: Set<string>) => {
  let n = 0
  for (const w of a) if (b.has(w)) n++
  return n
}

function buildIndex(): Map<number, BookSection[]> {
  const index = new Map<number, BookSection[]>()
  for (const lesson of book as { id: number; blocks: Block[] }[]) {
    const sections: BookSection[] = []
    let current: BookSection = { lesson: lesson.id, title: 'درآمد', paras: [] }
    for (const b of lesson.blocks) {
      if (isHeading(b)) {
        if (current.paras.length) sections.push(current)
        current = { lesson: lesson.id, title: clean(b.text), paras: [] }
      } else if (b.t === 'p' || b.t === 'note') {
        const text = clean(b.text)
        if (text.length >= 40 && !/^(عنوان بخش|کتاب \/ تعریف)/.test(text)) current.paras.push(text)
      }
    }
    if (current.paras.length) sections.push(current)
    index.set(lesson.id, sections)
  }
  return index
}

export const bookSections = buildIndex()

/** شمارهٔ ترتیبی سرصفحه: «۲.» یا «ب.» یا «۳-» */
const ordinalOf = (title: string): string | null => {
  const m = title.trim().match(/^([۰-۹]+|[البپتجثحخدذرزژسشصضطظعغفقکگلمنوهی])\s*[.\-)]/)
  return m ? m[1] : null
}

/** بهترین بخشِ کتاب برای یک عنوانِ بخش در دادهٔ درس */
export function matchBookSection(lessonId: number, title: string): BookSection | null {
  const list = bookSections.get(lessonId)
  if (!list?.length) return null
  const want = tokens(title)
  const ord = ordinalOf(title)
  const score = (sec: BookSection) =>
    overlap(want, tokens(sec.title)) * 2.2 + overlap(want, tokens(sec.paras.join(' '))) * 0.35

  // ۱) هم‌شماره‌ها اول؛ اگر شماره‌ها یکی بود، متن تعیین می‌کند
  const sameNumber = ord ? list.filter((s) => ordinalOf(s.title) === ord) : []
  const pool = sameNumber.length ? sameNumber : list
  let best: BookSection | null = null
  let bestScore = 0
  for (const sec of pool) {
    const sc = score(sec)
    if (sc > bestScore) {
      bestScore = sc
      best = sec
    }
  }
  if (best && (bestScore >= 4 || sameNumber.length === 1)) return best

  // ۲) تطبیق آزاد
  let free: BookSection | null = null
  let freeScore = 0
  for (const sec of list) {
    const sc = score(sec)
    if (sc > freeScore) {
      freeScore = sc
      free = sec
    }
  }
  if (free && freeScore >= 4) return free

  // ۳) همان شماره، حتی بی‌تطبیق واژگانی
  return sameNumber[0] ?? null
}

/**
 * عین عبارت کتاب برای یک بخش درس.
 * اگر تطبیق عنوان سست بود، بخش هم‌جای همان شماره را می‌دهد تا هیچ‌گاه
 * متن بی‌ربط به اسم کتاب نشان داده نشود.
 */
export function bookQuote(lessonId: number, sectionTitle: string, _order = 0): string | null {
  // فقط وقتی عبارت کتاب را نشان می‌دهیم که بخش واقعاً تطبیق خورده باشد؛
  // بهتر است چیزی نگوییم تا اینکه بندِ نامرتبط را «عین کتاب» بنامیم
  const sec = matchBookSection(lessonId, sectionTitle)
  if (!sec) return null
  const para = sec.paras.find((p) => p.length >= 80) ?? sec.paras[0]
  return para ?? null
}

/** بخش‌های محتوایی کتاب (بی‌شماره‌های پرسش و پاسخ‌نامه) به ترتیب صفحه */
export const contentSectionsOf = (lessonId: number): BookSection[] =>
  (bookSections.get(lessonId) ?? []).filter(
    (s) => !/سؤال|پاسخ|امتحان|پرسش/.test(s.title) && s.paras.length > 0
  )

/** همهٔ متن کتاب یک درس — برای شمارش و جست‌وجو */
export const bookTextOf = (lessonId: number): string =>
  (bookSections.get(lessonId) ?? [])
    .map((s) => s.paras.join(' '))
    .join(' ')
    .slice(0, 20000)
