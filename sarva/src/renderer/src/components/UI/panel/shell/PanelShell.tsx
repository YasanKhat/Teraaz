import { ToastContainer } from 'react-toastify'
import PanelQueryProvider from './PanelQueryProvider'
import PanelSidebar from './PanelSidebar'
import PanelTopbar from './PanelTopbar'
import { GeometricPattern } from '@/components/persian-patterns'
import styles from '../panel-design.module.css'

/**
 * پوستهٔ پنل: سایدبارِ ثابتِ راست + یک نوارِ بالا + ستونِ محتوا.
 *
 * این همان `app/panel/layout.tsx` است که به یک کامپوننت تبدیل شده، چون در
 * اینجا مسیریابیِ فایل‌محور نداریم و `App.tsx` خودش تصمیم می‌گیرد چه بپوشد.
 *
 * ⚠️ پنل از پوستهٔ سایت (`SiteChrome`) کنار گذاشته شده، درست مثل `/admin`؛
 * پس هدر و پاورقیِ سایت اینجا رندر نمی‌شوند. اگر این را برگردانی، دو نوارِ
 * چسبان روی هم می‌نشینند و دو جای متفاوت برای ناوبری درست می‌شود.
 *
 * ⚠️ `panel-scope` فقط یک کلاسِ تزئینی نیست: قاعدهٔ `* { line-height: 2 }`ِ
 * سراسریِ سایت را برای این زیردرخت پس می‌گیرد (دلیلش در globals.css است) و
 * عنوان‌ها را به قلمِ مربّع می‌سپارد. بدون آن هم فاصلهٔ خط‌ها اشتباه است و هم
 * قلمِ عنوان‌ها.
 */
export default function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className={`panel-scope flex min-h-dvh ${styles.shell}`}>
      <div aria-hidden="true" className={styles.pattern}>
        <GeometricPattern opacity={0.025} />
      </div>

      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <PanelQueryProvider>
        <PanelSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <PanelTopbar />
          <main
            id="panel-content"
            className={`mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-4 sm:px-6 lg:px-8 ${styles.content}`}
          >
            {children}
          </main>
        </div>
      </PanelQueryProvider>
    </div>
  )
}
