import type * as React from 'react'
import { ArrowUpLeft, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { activePage, NAV_SECTIONS, PAGE_META } from '../domain/navigation'
import { lowStockProducts, overduePurchases, overdueSales } from '../domain/calc'
import { fa } from '../lib/digits'
import { useApp } from '../store/useApp'
import { useNav, useUi } from '../store/ui'
import { LogoMark } from './Logo'
import { Avatar } from './kit'

export function Sidebar(): React.JSX.Element {
  const page = useNav((state) => state.page)
  const navigate = useNav((state) => state.navigate)
  const sidebarOpen = useUi((state) => state.sidebarOpen)
  const setSidebarOpen = useUi((state) => state.setSidebarOpen)

  const invoices = useApp((state) => state.invoices)
  const payments = useApp((state) => state.payments)
  const products = useApp((state) => state.products)
  const settings = useApp((state) => state.settings)
  const data = useApp()

  const badges: Partial<Record<string, { count: number; alert?: boolean }>> = {
    sales: { count: overdueSales({ ...data, invoices, payments }).length, alert: true },
    purchases: { count: overduePurchases({ ...data, invoices, payments }).length, alert: true },
    products: { count: lowStockProducts({ ...data, products }).length, alert: true }
  }

  const current = activePage(page)

  return (
    <>
      {sidebarOpen ? (
        <div
          className="mobile-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 39,
            background: 'rgba(4,18,13,.45)',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside className={clsx('sidebar', sidebarOpen && 'open')}>
        <div className="sidebar-inner">
          <div className="brand">
            <div className="brand-mark">
              <LogoMark size={28} />
            </div>
            <div className="brand-text">
              <div className="brand-name">تراز</div>
              <div className="brand-tag">دفترِ هوشمند کسب‌وکار</div>
            </div>
          </div>

          <div className="nav-scroll">
            {NAV_SECTIONS.map((section) => (
              <div className="nav-section" key={section.label}>
                <div className="nav-label">{section.label}</div>
                {section.items.map((item) => {
                  const meta = PAGE_META[item]
                  const Icon = meta.icon
                  const badge = badges[item]
                  return (
                    <button
                      key={item}
                      className={clsx('nav-item', current === item && 'active')}
                      onClick={() => {
                        navigate(item)
                        setSidebarOpen(false)
                      }}
                    >
                      <Icon className="nav-icon" strokeWidth={1.8} />
                      <span>{meta.label}</span>
                      {badge && badge.count > 0 ? (
                        <span className={clsx('nav-badge', badge.alert && 'alert')}>
                          {fa(badge.count)}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="sidebar-card">
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <ShieldCheck size={14} style={{ color: '#e2c27c' }} />
              <div className="sidebar-card-title" style={{ margin: 0 }}>
                داده‌های شما، نزد شما
              </div>
            </div>
            <div className="sidebar-card-text">
              همهٔ اطلاعات فقط روی همین دستگاه ذخیره می‌شود؛ بدون سرور و بدون وابستگی.
            </div>
            <button
              className="nav-item"
              style={{ padding: '7px 0 0', fontSize: 10.5, color: '#e2c27c' }}
              onClick={() => {
                navigate('settings')
                setSidebarOpen(false)
              }}
            >
              <span>پشتیبان‌گیری و بازیابی</span>
              <ArrowUpLeft size={12} style={{ marginInlineStart: 'auto' }} />
            </button>
          </div>

          <div className="sidebar-foot">
            <button className="sidebar-user" onClick={() => navigate('settings')}>
              <Avatar name={settings.company.owner} gold />
              <div className="sidebar-user-text" style={{ minWidth: 0 }}>
                <div className="sidebar-user-name">{settings.company.owner}</div>
                <div className="sidebar-user-role">مدیر {settings.company.name}</div>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
