import type { ArtKey } from '../../art'
import type { MapSpec } from '../../components/HistoricMap'

export interface ReadPanel {
  kind: 'read'
  lead?: string
  text?: string
  bullets?: string[]
  steps?: { title: string; text: string }[]
}
export interface FiguresPanel {
  kind: 'figures'
  heading?: string
  ids: string[]
}
export interface ImagePanel {
  kind: 'image'
  art: ArtKey
  caption?: string
  overlay?: string
}
export interface ComparePanel {
  kind: 'compare'
  title: string
  left: { label: string; items: string[] }
  right: { label: string; items: string[] }
  verdict?: string
}
export interface MnemonicPanel {
  kind: 'mnemonic'
  title: string
  text: string
  hook?: string
}
export interface CheckPanel {
  kind: 'check'
  prompt: string
  options: string[]
  answer: number
  explain: string
}
export interface RecipePanel {
  kind: 'recipe'
  title: string
  intro?: string
  rows: { q: string; a: string }[]
}
export interface TablePanel {
  kind: 'table'
  title?: string
  head: string[]
  rows: string[][]
  caption?: string
}
export interface CardsPanel {
  kind: 'cards'
  title?: string
  items: { title: string; text: string }[]
}
export interface QuotePanel {
  kind: 'quote'
  text: string
  source?: string
}
export interface SourcesPanel {
  kind: 'sources'
  title?: string
  items: { kind: string; title: string; text: string }[]
}
export interface ChainPanel {
  kind: 'chain'
  title?: string
  items: { label: string; note: string }[]
}

export type Panel =
  | ReadPanel
  | FiguresPanel
  | ImagePanel
  | ComparePanel
  | MnemonicPanel
  | CheckPanel
  | RecipePanel
  | TablePanel
  | CardsPanel
  | QuotePanel
  | SourcesPanel
  | ChainPanel

export interface TimelineSpec {
  title: string
  items: string[]
}

export interface Beat {
  title: string
  kicker?: string
  /** فهرست شمارهٔ بخش‌های درس‌نامه که در این صحنه خوانده می‌شوند */
  sections?: number[]
  maps?: { spec: MapSpec; caption?: string }[]
  timeline?: TimelineSpec
  panels: Panel[]
  takeaway?: string
}

export interface LessonPlan {
  lesson: number
  art: ArtKey
  question: string
  essence: string
  heroLine: string
  scenes: Beat[]
  interview: { q: string; a: string }[]
  danger: { title: string; text: string }[]
  examRecipe: { title: string; rows: { q: string; a: string }[] }
}

export interface ChapterPlan {
  chapter: 1 | 2 | 3 | 4
  art: ArtKey
  tagline: string
  intro: string
  lessons: LessonPlan[]
  summary: {
    verdict: string
    bigIdeas: { title: string; text: string }[]
    chain: { label: string; note: string }[]
    lastNight: string[]
  }
}
