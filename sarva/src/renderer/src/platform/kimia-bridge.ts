import { quizBank } from './quiz-bank'
import { splitArk, isKnownFoot, sequencePattern } from '@/lib/kimia/catalog'

/**
 * «کیمیای وزن» — ساختنِ دورها از بانکِ واقعیِ ابیات.
 *
 * روی سرور، بیت‌ها از جدولِ `questions` (همان بانکِ آزمونِ وزن) می‌آمدند و
 * ارکانِ درست از روی نشانیِ فایلِ صوتی به دست می‌آمد (`arkFromAudioUrl`).
 * اینجا همان منطق روی همان بانکِ seed اجرا می‌شود: بیتی که صدایش وزنِ
 * شناخته‌شده‌ای دارد، یک دورِ کیمیا می‌شود.
 */

export type KimiaRound = {
  id: string
  questionId: string
  poem: string[]
  ark: string
  feet: string[]
  audioSrc?: string
  slots: number
}

export type KimiaVerdict = {
  correct: boolean
  expected: string[]
  message: string
}

const rounds = new Map<string, KimiaRound>()

function audioToArk(url: string): string | null {
  const name = decodeURIComponent(url.split('/').pop() ?? '')
  const stem = name.replace(/\.mp3$/i, '')
  const ark = stem.replace(/-/g, ' ')
  const feet = splitArk(ark)
  if (!feet.length || !feet.every(isKnownFoot)) return null
  return ark
}

function candidates() {
  return quizBank().filter((q) => q.audioSrc && q.poem && q.poem.length >= 1)
}

export async function buildKimiaRound(): Promise<KimiaRound | null> {
  const pool = candidates()
  if (!pool.length) return null

  const question = pool[Math.floor(Math.random() * pool.length)]
  const ark = audioToArk(question.audioSrc ?? '')
  if (!ark) return null

  const feet = splitArk(ark)
  const round: KimiaRound = {
    id: 'kimia-' + question.id,
    questionId: question.id,
    poem: question.poem ?? [],
    ark,
    feet,
    audioSrc: question.audioSrc,
    slots: feet.length
  }
  rounds.set(round.id, round)
  return round
}

export async function judgeKimia(roundId: string, feet: string[]): Promise<KimiaVerdict | null> {
  const round = rounds.get(roundId)
  if (!round) return null

  const expected = round.feet
  const sameLength = feet.length === expected.length
  const same = sameLength && feet.every((f, i) => f === expected[i])
  const samePattern =
    !same && sequencePattern(feet) !== null && sequencePattern(feet) === sequencePattern(expected)

  return {
    correct: same,
    expected,
    message: same
      ? 'درست است — این همان وزنِ بیت است.'
      : samePattern
        ? 'نزدیک است: ارکان درست‌اند اما جایشان نه.'
        : sameLength
          ? 'ترکیب با این بیت جور نیست.'
          : 'تعدادِ ارکان با وزنِ بیت یکی نیست.'
  }
}

export async function revealKimia(roundId: string): Promise<string[] | null> {
  return rounds.get(roundId)?.feet ?? null
}
