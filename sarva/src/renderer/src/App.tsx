import { Suspense, useEffect, lazy, type ComponentType } from 'react'
import { usePathname } from '@/app/router'
import Header from '@/components/UI/Header'
import Footer from '@/components/UI/Footer'
import AnnouncementBar from '@/components/site/AnnouncementBar'
import { GeometricPattern } from '@/components/persian-patterns'
import LogoReveal from '@/components/UI/LogoReveal'
import { NavigationProgress } from '@/components/UI/NavigationProgress'
import { SiteContentProvider } from '@/lib/site/use-site-content'
import PanelShell from '@/components/UI/panel/shell/PanelShell'
import * as db from '@/platform/db'
import * as auth from '@/platform/auth'


import HomePage from '@/components/home/HomePage'
import Doroos from '@/pages/Doroos'
import DoroosGrade from '@/pages/DoroosGrade'
import DoroosLesson from '@/pages/DoroosLesson'
import Learn from '@/pages/Learn'
import VaznYab from '@/pages/VaznYab'
import Aruz from '@/pages/Aruz'
import Quiz from '@/pages/Quiz'
import Games from '@/pages/Games'
import GameRoute from '@/pages/GameRoute'
import Exam from '@/pages/Exam'
import ExamRun from '@/pages/ExamRun'
import Guide from '@/pages/Guide'
import Timeline from '@/pages/Timeline'
import ShabEmtehan from '@/pages/ShabEmtehan'
import Club from '@/pages/Club'
import Plus from '@/pages/Plus'
import Panel from '@/pages/Panel'
import Auth from '@/pages/Auth'
import Admin from '@/pages/Admin'
import { NotFound } from '@/pages/NotFound'
import ErrorBoundary from '@/components/UI/ErrorBoundary'

/**
 * سروا — مسیریاب و پوسته.
 *
 * این فایل جانشینِ `app/layout.tsx` + `components/SiteChrome.tsx` + مسیریابیِ
 * فایل‌محورِ Next است. قاعده‌های همان فایل‌ها اینجا هم برقرارند:
 *
 *   • شکلِ درخت با عوض‌شدنِ حالت تغییر نمی‌کند (وگرنه React کلِ زیردرخت را
 *     برمی‌چیند و بازی وسطِ اجرا از نو ساخته می‌شود)؛ فقط *محتوای* هر جایگاه
 *     شرطی است و `false` یک جایگاهِ خالیِ معتبر است.
 *   • پاورقیِ بزرگ با بازیِ در جریان رقابت نمی‌کند.
 *   • نقشِ هندسیِ ثابتِ سایت روی صفحهٔ کهکشان (که پس‌زمینهٔ خودش را دارد)
 *     کنار می‌رود.
 */

const AruzLazy = Aruz as ComponentType
const About = lazy(() => import('@/pages/About')) as ComponentType

/** صفحه‌هایی که پوسته را جمع می‌کنند تا بازی تمامِ پنجره را داشته باشد. */
function chromeModeFor(path: string): 'off' | 'compact' | 'fullscreen' {
  if (/^\/game\/[^/]+$/.test(path)) return 'fullscreen'
  if (path === '/game' || path.startsWith('/exam/')) return 'compact'
  return 'off'
}

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function render(path: string): JSX.Element {
  const seg = path.split('/').filter(Boolean)

  if (seg.length === 0) return <HomePage />

  switch (seg[0]) {
    case 'doroos':
      if (seg.length === 1) return <Doroos />
      if (seg.length === 2) return <DoroosGrade gradeKey={seg[1]} />
      return <DoroosLesson gradeKey={seg[1]} lessonNo={seg[2]} />

    case 'learn':
      return <Learn slug={seg[1]} />

    case 'vazn-yab':
      return <VaznYab />
    case 'aruz':
      return <AruzLazy />
    case 'quiz':
      return <Quiz />

    case 'game':
      return seg.length === 1 ? <Games /> : <GameRoute slug={seg[1]} />

    case 'exam':
      return seg.length === 1 ? <Exam /> : <ExamRun examKey={seg[1]} />

    case 'panel':
      return <Panel />
    case 'auth':
      return <Auth />
    case 'about':
      return (
        <Suspense fallback={<PageLoading />}>
          <About />
        </Suspense>
      )
    case 'guide':
      return <Guide />
    case 'timeline':
      return <Timeline />
    case 'shab-emtehan':
      return <ShabEmtehan />
    case 'sarvaclub':
      return <Club />
    case 'plus':
      return <Plus />
    case 'admin':
      return <Admin />

    default:
      return <NotFound />
  }
}

export default function App() {
  const path = usePathname()
  const chrome = chromeModeFor(path)
  const isGalaxy = path === '/game'
  /** پنل و مدیریت پوستهٔ خودشان را دارند و هدر/پاورقیِ سایت را نمی‌خواهند. */
  const isPanel = path === '/panel' || path.startsWith('/panel/')

  // نخستین مدیر: اگر هیچ حسابی نیست، یکی ساخته می‌شود تا پنلِ مدیریت از همان
  // راه‌اندازیِ اول در دسترس باشد (همان نقشی که seed-admin.mjs روی سرور داشت).
  useEffect(() => {
    void auth.ensureBootstrapAdmin()
    return () => db.flushNow()
  }, [])

  // منوی الکترون مسیر می‌فرستد؛ اینجا به مسیریاب وصل می‌شود.
  useEffect(() => {
    if (window.sarva?.onNavigate) return window.sarva.onNavigate(navigateTo)
    return undefined
  }, [])

  // بالا آمدنِ هر صفحه از اول — همان رفتاری که کاربر از وب انتظار دارد.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [path])

  return (
    <>
      <LogoReveal />

      {/* ⚠️ «در حال رفتن»ِ سراسری برای جابه‌جاییِ صفحه‌ها — همان حسِ nprogressِ
          سایت. داخلِ Suspense است چون خودش مسیریاب را می‌خواند. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {isPanel ? (
        /* پنل پوستهٔ خودش را دارد: سایدبار، یک نوارِ بالا، و بس. هدر و
           پاورقیِ سایت اینجا رندر نمی‌شوند. */
        <ErrorBoundary resetKey={path}>
          <Suspense fallback={<PageLoading />}>
            <PanelShell>{render(path)}</PanelShell>
          </Suspense>
        </ErrorBoundary>
      ) : (
        <SiteContentProvider>
          {/* بالاترین چیزِ صفحه، بالاتر از هدر و در جریانِ عادیِ صفحه — نه
              شناور رویش. در حالتِ تمام‌صفحهٔ بازی کنار می‌رود، چون آنجا
              هیچ‌چیز جز بازی نباید باشد. */}
          {chrome !== 'fullscreen' && <AnnouncementBar />}
          {chrome !== 'fullscreen' && <Header compact={chrome === 'compact'} />}

          <main className="flex-1">
            {/* خطای یک صفحه نباید کلِ برنامه را سفید کند؛ هر مسیر را جدا می‌گیریم. */}
            <ErrorBoundary resetKey={path}>
              <Suspense fallback={<PageLoading />}>{render(path)}</Suspense>
            </ErrorBoundary>
          </main>

          {/* پاورقیِ بزرگ نباید با بازیِ در جریان رقابت کند. */}
          {chrome === 'off' && <Footer />}
          {chrome !== 'fullscreen' && !isGalaxy && (
            <GeometricPattern className="fixed z-10 h-screen text-gold" opacity={0.06} />
          )}
        </SiteContentProvider>
      )}
    </>
  )
}

function navigateTo(path: string) {
  window.location.hash = path.startsWith('/') ? path : '/' + path
}
