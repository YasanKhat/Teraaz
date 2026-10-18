import { useEffect, useMemo, useRef, useState } from 'react'
import type * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight,
  CornerDownLeft,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import clsx from 'clsx'
import { PAGE_META, NAV_SECTIONS } from '../domain/navigation'
import { invoiceTotals, contactOf } from '../domain/calc'
import { formatJalali } from '../lib/jalali'
import { compact, money } from '../lib/format'
import { fa } from '../lib/digits'
import { useApp } from '../store/useApp'
import { useNav, useUi } from '../store/ui'
import { invoiceNoLabel } from '../domain/journal'
import { matchesSearch, normalizeSearch } from './kit'

interface PaletteItem {
  id: string
  group: string
  title: string
  subtitle?: string
  badge?: string
  icon: LucideIcon
  keywords?: string
  run: () => void
}

export function CommandPalette(): React.JSX.Element {
  const open = useUi((state) => state.paletteOpen)
  const setOpen = useUi((state) => state.setPaletteOpen)
  const navigate = useNav((state) => state.navigate)

  const data = useApp()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(timer)
  }, [open])

  const close = (): void => setOpen(false)

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = []

    const quick: PaletteItem[] = [
      {
        id: 'q-sale',
        group: 'دسترسی سریع',
        title: 'صدور فاکتور فروش',
        subtitle: 'ثبت فروش جدید',
        icon: Receipt,
        keywords: 'فروش invoice sales',
        run: () => {
          navigate('sales', { create: true })
          close()
        }
      },
      {
        id: 'q-purchase',
        group: 'دسترسی سریع',
        title: 'ثبت فاکتور خرید',
        subtitle: 'خرید از تأمین‌کننده',
        icon: ShoppingBag,
        keywords: 'خرید purchase',
        run: () => {
          navigate('purchases', { create: true })
          close()
        }
      },
      {
        id: 'q-expense',
        group: 'دسترسی سریع',
        title: 'ثبت هزینه',
        subtitle: 'هزینهٔ جدید',
        icon: Wallet,
        keywords: 'هزینه expense',
        run: () => {
          navigate('expenses', { create: true })
          close()
        }
      },
      {
        id: 'q-contact',
        group: 'دسترسی سریع',
        title: 'طرف‌حساب جدید',
        subtitle: 'مشتری یا تأمین‌کننده',
        icon: Users,
        keywords: 'مشتری تأمین کننده contact',
        run: () => {
          navigate('contacts', { create: true })
          close()
        }
      },
      {
        id: 'q-product',
        group: 'دسترسی سریع',
        title: 'کالا یا خدمت جدید',
        subtitle: 'افزودن به انبار',
        icon: Package,
        keywords: 'کالا محصول انبار product',
        run: () => {
          navigate('products', { create: true })
          close()
        }
      },
      {
        id: 'q-transfer',
        group: 'دسترسی سریع',
        title: 'انتقال بین حساب‌ها',
        subtitle: 'صندوق و بانک',
        icon: ArrowLeftRight,
        keywords: 'انتقال وجه transfer',
        run: () => {
          navigate('accounts', { create: true })
          close()
        }
      }
    ]
    list.push(...quick)

    for (const section of NAV_SECTIONS) {
      for (const page of section.items) {
        const meta = PAGE_META[page]
        list.push({
          id: `nav-${page}`,
          group: 'صفحه‌ها',
          title: meta.label,
          subtitle: meta.hint,
          icon: meta.icon,
          keywords: page,
          run: () => {
            navigate(page)
            close()
          }
        })
      }
    }

    const recentInvoices = [...data.invoices]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8)
    for (const invoice of recentInvoices) {
      const contact = contactOf(data, invoice.contactId)
      const totals = invoiceTotals(invoice)
      list.push({
        id: `inv-${invoice.id}`,
        group: 'فاکتورهای اخیر',
        title: `${invoice.kind === 'sale' ? 'فروش' : 'خرید'} ${invoiceNoLabel(invoice)}`,
        subtitle: `${contact?.name ?? '—'} · ${formatJalali(invoice.date, 'medium')}`,
        badge: `${compact(totals.total)} تومان`,
        icon: invoice.kind === 'sale' ? Receipt : ShoppingBag,
        keywords: `${invoiceNoLabel(invoice)} ${contact?.name ?? ''}`,
        run: () => {
          navigate('invoice', { id: invoice.id })
          close()
        }
      })
    }

    if (query.trim()) {
      for (const contact of data.contacts.slice(0, 12)) {
        list.push({
          id: `ct-${contact.id}`,
          group: 'طرف‌حساب‌ها',
          title: contact.name,
          subtitle: `${contact.kind === 'customer' ? 'مشتری' : 'تأمین‌کننده'}${contact.city ? ` · ${contact.city}` : ''}`,
          icon: Users,
          keywords: `${contact.phone} ${contact.company ?? ''}`,
          run: () => {
            navigate('contacts')
            close()
          }
        })
      }
      for (const product of data.products.slice(0, 12)) {
        list.push({
          id: `pr-${product.id}`,
          group: 'کالاها',
          title: product.name,
          subtitle: `${product.category} · ${money(product.price)} تومان`,
          icon: Package,
          keywords: `${product.code} ${product.category}`,
          run: () => {
            navigate('products')
            close()
          }
        })
      }
    }

    return list
  }, [data, navigate, query])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const needle = normalizeSearch(query)
    return items.filter((item) =>
      matchesSearch(`${item.title} ${item.subtitle ?? ''} ${item.keywords ?? ''}`, needle)
    )
  }, [items, query])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-palette-index="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((current) => Math.min(filtered.length - 1, current + 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((current) => Math.max(0, current - 1))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        filtered[active]?.run()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, active])

  const groups = useMemo(() => {
    const map = new Map<string, { item: PaletteItem; index: number }[]>()
    const order: string[] = []
    filtered.forEach((item, index) => {
      if (!map.has(item.group)) {
        map.set(item.group, [])
        order.push(item.group)
      }
      map.get(item.group)?.push({ item, index })
    })
    return order.map((group) => ({ group, entries: map.get(group) ?? [] }))
  }, [filtered])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close()
          }}
        >
          <motion.div
            className="palette"
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          >
            <div className="palette-input-wrap">
              <Search size={19} />
              <input
                ref={inputRef}
                className="palette-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جست‌وجوی فاکتور، طرف‌حساب، کالا یا صفحه…"
              />
              <span className="kbd">ESC</span>
            </div>

            <div className="palette-list" ref={listRef}>
              {filtered.length === 0 ? (
                <div className="palette-empty">
                  نتیجه‌ای برای «{query}» پیدا نشد.
                </div>
              ) : (
                groups.map(({ group, entries }) => (
                  <div key={group}>
                    <div className="palette-section">{group}</div>
                    {entries.map(({ item, index }) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          data-palette-index={index}
                          className={clsx('palette-item', index === active && 'active')}
                          onMouseEnter={() => setActive(index)}
                          onClick={item.run}
                        >
                          <span className="p-icon">
                            <Icon size={14} />
                          </span>
                          <span className="p-body">
                            <span className="p-title">{item.title}</span>
                            {item.subtitle ? <span className="p-sub" style={{ display: 'block' }}>{item.subtitle}</span> : null}
                          </span>
                          {item.badge ? <span className="p-badge num">{item.badge}</span> : null}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="palette-foot">
              <span>
                <CornerDownLeft size={11} /> رفتن
              </span>
              <span>↑ ↓ جابه‌جایی</span>
              <span className="spacer" />
              <span>{fa(filtered.length)} نتیجه</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
