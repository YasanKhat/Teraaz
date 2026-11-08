/**
 * واژه‌های تصویردارِ کتاب‌ها.
 *
 * روی سرور، واژه‌ها در جدولِ `vocab_words` بودند و از پنل مدیریت پر می‌شدند؛
 * تصویرها هم در پوشهٔ آپلود. اینجا تصویرها همان پرونده‌های واقعیِ سایت هستند
 * (`public/vocab-images/grade-10/1/تالاب.webp`) و فهرستشان یک‌بار توسط
 * `npm run fetch:assets` استخراج و در `public/vocab-manifest.json` نوشته
 * می‌شود — بنابراین واژهٔ تازه فقط با انداختنِ یک تصویر در پوشه پیدا می‌شود.
 *
 * معنیِ هر واژه از **خودِ درسنامه** می‌آید: همان خط‌های «قلمرو زبانی» که
 * نویسندهٔ درس برای همان واژه نوشته است. این بهتر از یک جدولِ جداست، چون
 * معنی هیچ‌وقت از متنِ کتاب جا نمی‌ماند.
 */

export type VocabEntry = {
  grade: string
  lesson: number
  word: string
  path: string
  meaning?: string
}

let cache: VocabEntry[] | null = null
let loading: Promise<VocabEntry[]> | null = null

export function vocabManifestSync(): VocabEntry[] {
  return cache ?? []
}

export function vocabManifest(): VocabEntry[] {
  if (cache) return cache
  if (!loading) {
    loading = fetch('vocab-manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        cache = Array.isArray(data) ? (data as VocabEntry[]) : []
        return cache
      })
      .catch(() => {
        cache = []
        return cache
      })
  }
  return []
}

/** معنیِ واژه از قلمرو زبانیِ همان درس.
 *
 *  خط‌ها به دو شکل می‌آیند: «واژه: معنی» یا «واژه: معنی؛ واژهٔ دیگر: معنی».
 *  هردو را می‌شکافیم تا همان متنی برسد که زیرِ بیت در سایت دیده می‌شد. */
export function meaningFromLessonNotes(word: string, notes: readonly string[]): string | undefined {
  const target = word.replace(/[\u064b-\u065f]/g, '').trim()
  for (const note of notes) {
    for (const part of note.split(/[؛;]/)) {
      const m = part.match(/^\s*([^:]{1,40})\s*[:：]\s*(.+)$/)
      if (!m) continue
      const head = m[1].replace(/[\u064b-\u065f]/g, '').trim()
      if (head === target) return m[2].trim()
      // «غلغله‌زن، چهره‌نما و تیزپا: …» — چند واژه با یک معنیِ مشترک
      if (head.split(/[،,]/).some((h) => h.replace(/[\u064b-\u065f]/g, '').trim() === target)) {
        return m[2].trim()
      }
    }
  }
  return undefined
}
