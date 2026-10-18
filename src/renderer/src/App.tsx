import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { CommandPalette } from './components/CommandPalette'
import { ConfirmHost, Splash, ToastHost } from './components/kit'
import { PAGE_META } from './domain/navigation'
import { setPersianDigits } from './lib/digits'
import { useApp } from './store/useApp'
import { useNav, useUi } from './store/ui'
import { DashboardPage } from './pages/Dashboard'
import { SalesPage } from './pages/Sales'
import { ExpensesPage } from './pages/Expenses'
import { ContactsPage } from './pages/Contacts'
import { ProductsPage } from './pages/Products'
import { AccountsPage } from './pages/Accounts'
import { JournalPage } from './pages/Journal'
import { ReportsPage } from './pages/Reports'
import { SettingsPage } from './pages/Settings'
import { InvoiceView } from './pages/InvoiceView'

const SPLASH_KEY = 'taraz-booted'

export default function App(): React.JSX.Element {
  const page = useNav((state) => state.page)
  const id = useNav((state) => state.id)
  const settings = useApp((state) => state.settings)
  const setPaletteOpen = useUi((state) => state.setPaletteOpen)
  const paletteOpen = useUi((state) => state.paletteOpen)

  const [booting, setBooting] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(SPLASH_KEY)
    } catch {
      return true
    }
  })

  // Persian digits are a module-level formatting switch; sync before children render.
  setPersianDigits(settings.persianDigits)

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  useEffect(() => {
    document.title = `تراز | ${PAGE_META[page].label}`
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [page, id])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBooting(false)
      try {
        sessionStorage.setItem(SPLASH_KEY, '1')
      } catch {
        // storage might be unavailable; the splash just shows once per reload
      }
    }, 1450)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(!paletteOpen)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, setPaletteOpen])

  const renderPage = (): React.JSX.Element => {
    switch (page) {
      case 'sales':
        return <SalesPage kind="sale" />
      case 'purchases':
        return <SalesPage kind="purchase" />
      case 'expenses':
        return <ExpensesPage />
      case 'contacts':
        return <ContactsPage />
      case 'products':
        return <ProductsPage />
      case 'accounts':
        return <AccountsPage />
      case 'journal':
        return <JournalPage />
      case 'reports':
        return <ReportsPage />
      case 'settings':
        return <SettingsPage />
      case 'invoice':
        return <InvoiceView />
      case 'dashboard':
      default:
        return <DashboardPage />
    }
  }

  return (
    <>
      <AnimatePresence>{booting ? <Splash key="splash" /> : null}</AnimatePresence>

      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <Topbar />
          <main className="content">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${page}-${id ?? 'root'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <CommandPalette />
      <ToastHost />
      <ConfirmHost />
    </>
  )
}
