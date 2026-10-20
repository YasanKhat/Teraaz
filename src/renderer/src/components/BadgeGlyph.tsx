import {
  Award,
  Clock3,
  Compass,
  Crown,
  Film,
  Flame,
  Landmark,
  Layers,
  PenLine,
  Sprout,
  Star,
  Target,
  User,
  Zap
} from 'lucide-react'
import type { BadgeIcon } from '../data/exams'

const MAP = {
  seed: Sprout,
  compass: Compass,
  landmark: Landmark,
  pen: PenLine,
  award: Award,
  flame: Flame,
  bolt: Zap,
  star: Star,
  cards: Layers,
  target: Target,
  clock: Clock3,
  film: Film,
  user: User,
  crown: Crown
} as const

/** نشان‌های دستاورد با نماد خطی، نه ایموجی */
export function BadgeGlyph({ icon, size = 15 }: { icon: BadgeIcon; size?: number }) {
  const Icon = MAP[icon] ?? Award
  return <Icon size={size} strokeWidth={1.7} />
}
