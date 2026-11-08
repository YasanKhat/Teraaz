import { Suspense, lazy, type ComponentType } from 'react'
import GameShell from '@/components/UI/games/GameShell'
import { NotFound } from './NotFound'

/**
 * دوازده بازیِ سروا.
 *
 * هر کدام همان کامپوننتِ واقعیِ سایت است که با `React.lazy` بار می‌شود —
 * درست همان کاری که `next/dynamic` روی وب می‌کرد. بازی‌هایی که در سایت با
 * `GameShell` پیچیده شده بودند اینجا هم همان پوسته را دارند.
 *
 * ⚠️ «پلِ وزن» صحنهٔ سه‌بعدی دارد. در یک برنامهٔ محلی WebGL در دسترس است،
 * پس همان صحنه اجرا می‌شود؛ اگر دستگاهی آن را نداشته باشد، خودِ بازی
 * پیامِ مناسبش را نشان می‌دهد.
 */

type GameEntry = {
  title: string
  component: ComponentType
  shell?: boolean
  dense?: boolean
}

const load = {
  jasoos: () => import('@/components/UI/jasoos/JasoosGame'),
  ninja: () => import('@/components/UI/ninja/NinjaGame'),
  pairs: () => import('@/components/UI/pairs/PairsGame'),
  vocab: () => import('@/components/UI/vocab/VocabGame'),
  'aruz-rapid': () => import('@/components/UI/aruz-rapid/RapidAruzGame'),
  'aruz-bridge': () => import('@/components/UI/aruz-bridge/AruzBridgeGame'),
  'grammar-circuit': () => import('@/components/UI/grammar-circuit/GrammarCircuitGame'),
  'role-hunt': () => import('@/components/UI/role-hunt/RoleHuntGame'),
  kimia: () => import('@/components/UI/kimia/KimiaGame'),
  'rang-ara': () => import('@/components/UI/rang-ara/RangAraGame'),
  'poets-shelf': () => import('@/components/UI/poets-shelf/PoetsShelfGame')
}

function lazyGame(key: keyof typeof load): ComponentType {
  return lazy(async () => {
    const mod = await load[key]()
    return { default: (mod as { default: ComponentType }).default }
  }) as ComponentType
}

const GAMES: Record<string, GameEntry> = {
  jasoos: { title: 'جاسوسِ نقش‌ها', component: lazyGame('jasoos'), shell: true },
  ninja: { title: 'نینجای دستور', component: lazyGame('ninja'), shell: true },
  pairs: { title: 'جفت‌های ادبی', component: lazyGame('pairs'), shell: true },
  vocab: { title: 'واژه‌یاب', component: lazyGame('vocab'), shell: true },
  'aruz-rapid': { title: 'تقطیع سریع', component: lazyGame('aruz-rapid') },
  'aruz-bridge': { title: 'پلِ وزن', component: lazyGame('aruz-bridge'), shell: true, dense: true },
  'grammar-circuit': { title: 'مدارِ دستور', component: lazyGame('grammar-circuit'), shell: true },
  'role-hunt': { title: 'شکارِ نقش‌ها', component: lazyGame('role-hunt'), shell: true },
  kimia: { title: 'کیمیای وزن', component: lazyGame('kimia'), shell: true },
  'rang-ara': { title: 'رنگ‌آرا', component: lazyGame('rang-ara'), shell: true },
  'poets-shelf': { title: 'قفسهٔ شاعران', component: lazyGame('poets-shelf'), shell: true }
}

function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function GameRoute({ slug }: { slug: string }) {
  const game = GAMES[slug]
  if (!game) return <NotFound />

  const Body = game.component

  const inner = (
    <Suspense fallback={<Loading />}>
      <Body />
    </Suspense>
  )

  if (!game.shell) return inner

  return (
    <GameShell title={game.title} dense={game.dense}>
      {inner}
    </GameShell>
  )
}

export const GAME_SLUGS = Object.keys(GAMES)
