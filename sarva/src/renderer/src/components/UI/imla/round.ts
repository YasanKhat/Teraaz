export type Word = { id: string; word: string; wrong: string[]; sentence: string; meaning: string; why: string; level: number; grade: string; lesson: number }
export type Item = { word: Word; shown: string; isCorrectSpelling: boolean }
export const ROUND_MAX = 20
export const livesFor = (length: number) => length >= 15 ? 5 : 3
function shuffle<T>(input: readonly T[], random: () => number): T[] {
  const result = [...input]
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]] }
  return result
}
// Mirrors the site's published round builder: select randomly, then order by
// difficulty and show roughly half of the selected words misspelled.
export function buildRound(bank: Word[], grade: string, lessons: number[], random = Math.random): Item[] {
  const words = shuffle(bank.filter(w => w.grade === grade && lessons.includes(w.lesson)), random).slice(0, ROUND_MAX).sort((a,b) => a.level - b.level)
  const wrongCount = Math.floor(words.length / 2) + (words.length % 2 && random() < .5 ? 1 : 0)
  const wrongIndices = new Set(shuffle(words.map((_,i) => i), random).slice(0, wrongCount))
  return words.map((word,i) => {
    const wrong = wrongIndices.has(i) && word.wrong.length > 0
    return { word, shown: wrong ? word.wrong[Math.floor(random() * word.wrong.length)] : word.word, isCorrectSpelling: !wrong }
  })
}
