import seed from '@/data/seeds/aruz-questions.json'

/**
 * بانکِ سؤالِ «آزمون وزن شعر» (/quiz) — ساخته‌شده از همان فایلِ seedای که
 * روی سرور جدولِ `questions` را پر می‌کند.
 *
 * ⚠️ چرا شناسه‌ها از روی محتوا ساخته می‌شوند و نه تصادفی: پاسخ‌های کاربر با
 * `question_id` ذخیره می‌شوند. اگر در هر بار بالا آمدن برنامه شناسهٔ تازه‌ای
 * ساخته می‌شد، تاریخچهٔ کاربر بی‌صدا پوچ می‌شد — همان اتفاقی که با هر
 * seed‌زدنِ دوبارهٔ دیتابیس می‌افتاد.
 */

export type QuestionType =
  | 'audio-to-poem'
  | 'audio-to-pattern'
  | 'poem-to-audio'
  | 'pattern-to-audio'
  | 'audio-to-weight'
  | 'weight-to-audio'

export type QuizOption = {
  id: string
  poem?: string[]
  label?: string
  audioSrc?: string
  isCorrect: boolean
  x: number
}

export type QuizQuestion = {
  id: string
  type: QuestionType
  poem?: string[]
  audioSrc?: string
  options: QuizOption[]
}

type SeedOption = {
  poem?: string[]
  audioUrl?: string
  label?: string
  isCorrect: boolean
  x: number
}

type SeedQuestion = {
  type: string
  difficulty?: string
  poem?: string[]
  audioUrl?: string
  options: SeedOption[]
}

/** یکسان‌سازیِ نویسه‌ها، تا «ي» و «ی» دو سؤالِ متفاوت به نظر نرسند. */
function norm(s: string): string {
  return s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[ً-ْٰ]/g, '').replace(/\s+/g, ' ').trim()
}

let cache: QuizQuestion[] | null = null

export function quizBank(): QuizQuestion[] {
  if (cache) return cache

  const questions = seed as SeedQuestion[]

  cache = questions.map((q, index) => {
    const stem = q.type.startsWith('audio')
      ? (q.audioUrl ?? '')
      : norm((q.poem ?? []).join(' / '))
    const opts = q.options
      .map((o) => (o.audioUrl ? o.audioUrl : norm((o.poem ?? []).join(' / '))))
      .sort()
      .join('|')

    // یک هشِ کوتاهِ پایدار — باید در هر اجرا یکسان باشد.
    const fingerprint = `${q.type}::${stem}::${opts}::${index}`
    const id = stableId(fingerprint)

    return {
      id,
      type: q.type as QuestionType,
      poem: q.poem,
      audioSrc: q.audioUrl,
      options: q.options.map((o, i) => ({
        id: `${id}-o${i}`,
        poem: o.poem,
        label: o.label,
        audioSrc: o.audioUrl,
        isCorrect: !!o.isCorrect,
        x: o.x ?? (i + 1) * 10
      }))
    }
  })

  return cache
}

function stableId(input: string): string {
  // FNV-1aِ ۳۲ بیتی، نوشته‌شده به‌صورت هگز — کوتاه، پایدار و بی‌نیاز از WebCrypto.
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  const hex = h.toString(16).padStart(8, '0')
  const hex2 = (h ^ (h >>> 13)).toString(16).padStart(8, '0')
  return `${hex}-${hex2.slice(0, 4)}-4${hex2.slice(5, 8)}-a${hex.slice(0, 3)}-${(hex + hex2).slice(0, 12)}`
}

/** فقط سؤال‌هایی که صدایشان واقعاً در بسته هست — سؤالی که صدا ندارد در
 *  آزمونِ شنیداری یک کارتِ لال است. */
export function quizBankWithAudio(): QuizQuestion[] {
  return quizBank().filter((q) => q.audioSrc || q.options.some((o) => o.audioSrc))
}
