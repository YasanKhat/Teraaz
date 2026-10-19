import type { JSX } from "react"
import { ArtAtelier } from './ArtAtelier'
import { BaghdadCity } from './BaghdadCity'
import { FeudalOrder } from './FeudalOrder'
import { IranFront } from './IranFront'
import { IsfahanPlan } from './IsfahanPlan'
import { KnowledgeWeb } from './KnowledgeWeb'
import { MadinaPact } from './MadinaPact'
import { MeccaRing } from './MeccaRing'
import { MethodLab } from './MethodLab'
import { MongolStorm } from './MongolStorm'
import { RenaissanceEngine } from './RenaissanceEngine'
import { SafavidChain } from './SafavidChain'
import { SourceLab } from './SourceLab'
import { SuccessionBoard } from './SuccessionBoard'
import { ThreeCourts } from './ThreeCourts'
import { UmayyadBalance } from './UmayyadBalance'

/** تجربهٔ تعاملی ویژهٔ هر درس — هر درس، یک ابزار متفاوت */
const SIGNATURES: Record<number, () => JSX.Element> = {
  1: SourceLab,
  2: MethodLab,
  3: MeccaRing,
  4: MadinaPact,
  5: SuccessionBoard,
  6: UmayyadBalance,
  7: BaghdadCity,
  8: IranFront,
  9: KnowledgeWeb,
  10: ThreeCourts,
  11: MongolStorm,
  12: ArtAtelier,
  13: SafavidChain,
  14: IsfahanPlan,
  15: FeudalOrder,
  16: RenaissanceEngine
}

export function LessonSignature({ lesson }: { lesson: number }) {
  const Cmp = SIGNATURES[lesson]
  if (!Cmp) return null
  return <Cmp />
}
