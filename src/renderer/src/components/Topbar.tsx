import { useEffect, useMemo, useRef } from 'react'
import type * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronLeft,
  Menu,
  Moon,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Sun
} from 'lucide-react'
import clsx from 'clsx'
import { PAGE_META } from '../domain/navigation'
import {
  contactOf,
  currentStock,
  invoiceRemaining,
  lowStockProducts,
  overduePurchases,
  overdueSales,
  stockState
} from '../domain/calc'
import { invoiceNoLabel } from '../domain/journal'
import { fa } from '../lib/digits'
import { compact, money } from '../lib/format'
import { formatJalali, relativeDay, todayIso } from '../lib/jalali'
import { useApp } from '../store/useApp'
import { useNav, useUi } from '../store/ui'
import type { Page } from '../store/ui'
import { Avatar, IconButton } from './kit'

interface AlertItem {
  id: string
  title: string
  sub: string
  amount?: string
  target: Page
  icon: typeof Receipt
  tone: 'danger' | 'warning'
}

export function Topbar(): React.JSX.Element {
  const page = useNav((state) => state.page)
  const navigate = useNav((state) => state.navigate)
  const paletteOpen = useUi((state) => state.paletteOpen)
  const setPaletteOpen = useUi((state) => state.setPaletteOpen)
  const notificationsOpen = useUi((state) => state.notificationsOpen)
  const setNotificationsOpen = useUi((state) => state.setNotificationsOpen)
  const setSidebarOpen = useUi((state) => state.setSidebarOpen)

  const settings = useApp((state) => state.settings)
  const updateSettings = useApp((state) => state.updateSettings)
  const data = useApp()

  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notificationsOpen) return
    const handler = (event: MouseEvent): void => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notificationsOpen, setNotificationsOpen])

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = []
    for (const invoice of overdueSales(data).slice(0, 3)) {
      const contact = contactOf(data, invoice.contactId)
      items.push({
        id: `os-${invoice.id}`,
        title: `فاکتور ${invoiceNoLabel(invoice)} سرسید گذشته`,
        sub: `${contact?.name ?? 'مشتری'} · ${relativeDay(invoice.dueDate)}`,
        amount: `${compact(invoiceRemaining(invoice, data.payments))} تومان`,
        target: 'sales',
        icon: Receipt,
        tone: 'danger'
      })
    }
    for (const invoice of overduePurchases(data).slice(0, 2)) {
      const contact = contactOf(data, invoice.contactId)
      items.push({
        id: `op-${invoice.id}`,
        title: `فاکتور خرید ${invoiceNoLabel(invoice)} سرسید گذشته`,
        sub: contact?.name ?? 'تأمین‌کننده',
        amount: `${compact(invoiceRemaining(invoice, data.payments))} تومان`,
        target: 'purchases',
        icon: ShoppingBag,
        tone: 'warning'
      })
    }
    for (const product of lowStockProducts(data).slice(0, 3)) {
      const state = stockState(product, data)
      items.push({
        id: `ls-${product.id}`,
        title: `${product.name} ${state === 'out' ? 'ناموجود شده' : 'کم‌موجود است'}`,
        sub: `موجودی ${fa(currentStock(product, data))} ${product.unit} · حداقل ${fa(product.minStock)}`,
        target: 'products',
        icon: Package,
        tone: 'warning'
      })
    }
    return items
  }, [data])

  const meta = PAGE_META[page]

  return (
    <header className="topbar">
      <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
        <IconButton
          icon={Menu}
          label="منو"
          className="mobile-only"
          onClick={() => setSidebarOpen(true)}
        />
        <div className="crumbs hide-mobile">
          <span>تراز</span>
          <ChevronLeft size={12} className="crumbs-sep" />
          <b>{meta.label}</b>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
          <Search size={16} />
          <span>جست‌وجو در تراز…</span>
          <span className="kbd">⌘ K</span>
        </button>

        <span className="badge badge-gold fiscal-chip" style={{ height: 32, gap: 6 }}>
          <CalendarDays size={13} />
          سال مالی {fa(settings.fiscalYear)}
        </span>

        <button
          className="btn btn-primary btn-sm hide-mobile"
          style={{ height: 38, borderRadius: 11 }}
          onClick={() => navigate('sales', { create: true })}
        >
          <Plus size={15} />
          فاکتور جدید
        </button>

        <IconButton
          icon={settings.theme === 'dark' ? Sun : Moon}
          label={settings.theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
          onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        />

        <div ref={notifRef} style={{ position: 'relative' }}>
          <IconButton
            icon={Bell}
            label="یادآوری‌ها"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
          </IconButton>
          {alerts.length > 0 ? <span className="notif-dot" /> : null}

          <AnimatePresence>
            {notificationsOpen ? (
              <motion.div
                className="notif-pop"
                initial={{ opacity: 0, y: -8, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: 0.17 }}
              >
                <div className="notif-head">
                  <b>یادآوری‌ها</b>
                  <span className="badge badge-neutral">{fa(alerts.length)} مورد</span>
                </div>
                <div className="notif-list">
                  {alerts.length === 0 ? (
                    <div className="empty" style={{ padding: '30px 16px' }}>
                      <div className="empty-title">همه‌چیز مرتب است</div>
                      <div className="empty-text">یادآوری فعالی وجود ندارد.</div>
                    </div>
                  ) : (
                    alerts.map((alert) => {
                      const Icon = alert.icon
                      return (
                        <button
                          key={alert.id}
                          className="notif-item"
                          onClick={() => {
                            navigate(alert.target)
                            setNotificationsOpen(false)
                          }}
                        >
                          <span
                            className={clsx('list-icon', alert.tone === 'danger' && 'danger')}
                            style={{ width: 30, height: 30, flex: '0 0 30px' }}
                          >
                            <Icon size={14} />
                          </span>
                          <span className="grow" style={{ minWidth: 0 }}>
                            <span className="notif-text">
                              <b>{alert.title}</b>
                            </span>
                            <div className="notif-time">{alert.sub}</div>
                          </span>
                          {alert.amount ? (
                            <span className="tiny num" style={{ color: 'var(--ink)' }}>
                              {alert.amount}
                            </span>
                          ) : null}
                        </button>
                      )
                    })
                  )}
                </div>
                <div className="notif-foot">
                  <button
                    className="btn btn-ghost btn-sm w-100"
                    onClick={() => {
                      navigate('reports')
                      setNotificationsOpen(false)
                    }}
                  >
                    مشاهدهٔ گزارش مطالبات
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <button
          onClick={() => navigate('settings')}
          style={{ border: 0, background: 'transparent', padding: 0, display: 'grid' }}
          aria-label="پروفایل کسب‌وکار"
        >
          <Avatar name={settings.company.owner} gold />
        </button>
      </div>
    </header>
  )
}
