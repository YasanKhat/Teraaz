import DoroosHome from '@/components/UI/doroos/DoroosHome'
import { GRADES } from '@/lib/doroos'
import type { Grade } from '@/lib/doroos/types'

/** فهرستِ کتاب‌ها — همان `DoroosHome`ِ سایت، با همان کاتالوگ. */
export default function Doroos() {
  return <DoroosHome grades={GRADES as Grade[]} />
}
