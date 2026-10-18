import { useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import {
  Banknote,
  CalendarDays,
  Download,
  Eye,
  FileText,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
  Wallet
} from 'lucide-react'
import clsx from 'clsx'
import {
  contactOf,
  invoiceRemaining,
  invoiceStatus,
  invoiceTotals,
  paidForInvoice,
  STATUS_META,
  currentStock
} from '../domain/calc'
import { invoiceNoLabel } from '../domain/journal'
import { PAYMENT_METHOD_LABELS } from '../domain/catalogs'
import {
  addDaysIso,
  formatJalali,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  todayIso
} from '../lib/jalali'
import { compact, money } from '../lib/format'
import { fa } from '../lib/digits'
import { downloadCsv } from '../lib/export'
import { useApp } from '../store/useApp'
import { confirmAction, toast, useNav } from '../store/ui'
import type { Invoice, InvoiceKind } from '../domain/types'
import {
  AmountInput,
  Avatar,
  Badge,
  Button,
  Card,
  DatePicker,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  SearchField,
  matchesSearch
} from '../components/kit'
import { InvoiceStatusBadge } from '../components/InvoiceStatus'
import { PaymentModal } from '../components/PaymentModal'

type PeriodKey = 'all' | 'thisMonth' | 'lastMonth' | 'last3'
type StatusFilter = 'all' | 'paid' | 'partial' | 'overdue' | 'open'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'thisMonth', label: 'این ماه' },
  { key: 'lastMonth', label: 'ماه قبل' },
  { key: 'last3', label: '۳ ماه اخیر' }
]

function dateRange(period: PeriodKey, today: string): { from: string; to: string } {
  const { jy, jm } = isoToJalali(today)
  if (period === 'thisMonth') {
    return { from: jalaliToIso(jy, jm, 1), to: today }
  }
  if (period === 'lastMonth') {
    const pm = jm === 1 ? 12 : jm - 1
    const py = jm === 1 ? jy - 1 : jy
    return {
      from: jalaliToIso(py, pm, 1),
      to: jalaliToIso(py, pm, jalaliMonthLength(py, pm))
    }
  }
  if (period === 'last3') {
    const total = jy * 12 + jm - 1 - 2
    const y = Math.floor(total / 12)
    const m = (total % 12) + 1
    return { from: jalaliToIso(y, m, 1), to: today }
  }
  return { from: jalaliToIso(jy, 1, 1), to: today }
}

export function SalesPage({ kind }: { kind: InvoiceKind }): React.JSX.Element {
  const isSale = kind === 'sale'
  const data = useApp()
  const addInvoice = useApp((state) => state.addInvoice)
  const deleteInvoice = useApp((state) => state.deleteInvoice)
  const navigate = useNav((state) => state.navigate)
  const createIntent = useNav((state) => state.create)
  const clearCreate = useNav((state) => state.clearCreate)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<PeriodKey>('thisMonth')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [contactFilter, setContactFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    if (createIntent) {
      setFormOpen(true)
      clearCreate()
    }
  }, [createIntent, clearCreate])

  const today = todayIso()
  const periodInvoices = useMemo(() => {
    const range = dateRange(period, today)
    return data.invoices
      .filter(
        (invoice) =>
          invoice.kind === kind && invoice.date >= range.from && invoice.date <= range.to
      )
      .sort((a, b) => (a.date === b.date ? b.no - a.no : a.date < b.date ? 1 : -1))
  }, [data.invoices, kind, period, today])

  const contacts = data.contacts.filter((contact) =>
    isSale ? contact.kind === 'customer' : contact.kind === 'supplier'
  )

  const filtered = useMemo(() => {
    return periodInvoices.filter((invoice) => {
      if (contactFilter !== 'all' && invoice.contactId !== contactFilter) return false
      if (status !== 'all' && invoiceStatus(invoice, data.payments, today) !== status) return false
      if (query.trim()) {
        const contact = contactOf(data, invoice.contactId)
        const haystack = `${invoiceNoLabel(invoice)} ${contact?.name ?? ''} ${contact?.company ?? ''} ${invoice.note ?? ''}`
        if (!matchesSearch(haystack, query)) return false
      }
      return true
    })
  }, [periodInvoices, contactFilter, status, query, data, today])

  const pageSize = 9
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => setPage(1), [query, period, status, contactFilter])

  const summary = useMemo(() => {
    let total = 0
    let paid = 0
    let remaining = 0
    for (const invoice of periodInvoices) {
      const totals = invoiceTotals(invoice)
      total += totals.total
      const paidAmount = paidForInvoice(invoice.id, data.payments)
      paid += Math.min(paidAmount, totals.total)
      remaining += invoiceRemaining(invoice, data.payments)
    }
    return { total, paid, remaining, count: periodInvoices.length }
  }, [periodInvoices, data.payments])

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: 0, paid: 0, partial: 0, overdue: 0, open: 0 }
    counts.all = periodInvoices.length
    for (const invoice of periodInvoices) {
      counts[invoiceStatus(invoice, data.payments, today)] += 1
    }
    return counts
  }, [periodInvoices, data.payments, today])

  const exportRows = (): void => {
    const rows: (string | number)[][] = [
      [
        'شماره',
        'نوع',
        isSale ? 'مشتری' : 'تأمین‌کننده',
        'تاریخ',
        'سرسید',
        'مبلغ کل',
        'پرداخت‌شده',
        'مانده',
        'وضعیت'
      ]
    ]
    for (const invoice of filtered) {
      const contact = contactOf(data, invoice.contactId)
      const totals = invoiceTotals(invoice)
      const statusMeta = STATUS_META[invoiceStatus(invoice, data.payments, today)]
      rows.push([
        invoiceNoLabel(invoice),
        isSale ? 'فروش' : 'خرید',
        contact?.name ?? '',
        formatJalali(invoice.date, 'numeric'),
        formatJalali(invoice.dueDate, 'numeric'),
        totals.total,
        paidForInvoice(invoice.id, data.payments),
        invoiceRemaining(invoice, data.payments),
        statusMeta.label
      ])
    }
    downloadCsv(
      `taraz-${isSale ? 'sales' : 'purchases'}-${today.replaceAll('-', '')}.csv`,
      rows
    )
    toast.success('خروجی CSV آماده شد', `${fa(filtered.length)} فاکتور در فایل ذخیره شد.`)
  }

  const removeInvoice = async (invoice: Invoice): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'حذف فاکتور',
      message: `فاکتور ${invoiceNoLabel(invoice)} و تمام پرداخت‌های مرتبط با آن حذف می‌شود. این کار قابل بازگشت نیست.`,
      confirmLabel: 'حذف فاکتور',
      danger: true
    })
    if (!confirmed) return
    deleteInvoice(invoice.id)
    toast.success('فاکتور حذف شد', `فاکتور ${invoiceNoLabel(invoice)} از دفتر خارج شد.`)
  }

  return (
    <div className="page">
      <PageHeader
        title={isSale ? 'فروش' : 'خرید'}
        subtitle={
          isSale
            ? 'فاکتورهای فروش، دریافت‌ها و مطالبات مشتریان — همه در یک نگاه.'
            : 'فاکتورهای خرید، پرداخت‌ها و بدهی به تأمین‌کنندگان.'
        }
        actions={
          <>
            <Button variant="ghost" icon={Download} onClick={exportRows}>
              خروجی CSV
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setFormOpen(true)}
            >
              {isSale ? 'فاکتور فروش جدید' : 'ثبت فاکتور خرید'}
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">{isSale ? 'جمع فروش دوره' : 'جمع خرید دوره'}</span>
            <span className={clsx('kpi-icon', isSale ? '' : 'blue')}>
              {isSale ? <Receipt size={16} /> : <ShoppingBag size={16} />}
            </span>
          </div>
          <div className="kpi-value">
            {compact(summary.total)}
            <span className="unit">{data.settings.currency}</span>
          </div>
          <div className="kpi-foot">
            <span>{fa(summary.count)} فاکتور ثبت‌شده</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">{isSale ? 'دریافت‌شده' : 'پرداخت‌شده'}</span>
            <span className="kpi-icon">
              <Wallet size={16} />
            </span>
          </div>
          <div className="kpi-value text-success">
            {compact(summary.paid)}
            <span className="unit">{data.settings.currency}</span>
          </div>
          <div className="kpi-foot">
            <span>
              {summary.total > 0 ? fa(Math.round((summary.paid / summary.total) * 100)) : fa(0)}٪ از
              مبلغ فاکتورها
            </span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">{isSale ? 'مانده مطالبات' : 'مانده بدهی'}</span>
            <span className="kpi-icon gold">
              <Banknote size={16} />
            </span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--gold)' }}>
            {compact(summary.remaining)}
            <span className="unit">{data.settings.currency}</span>
          </div>
          <div className="kpi-foot">
            <span>{fa(statusCounts.overdue)} فاکتور سرسید گذشته</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">میانگین فاکتور</span>
            <span className="kpi-icon violet">
              <FileText size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {compact(summary.count ? summary.total / summary.count : 0)}
            <span className="unit">{data.settings.currency}</span>
          </div>
          <div className="kpi-foot">
            <span>میانگین ارزش هر {isSale ? 'فروش' : 'خرید'}</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-head" style={{ flexWrap: 'wrap', paddingBottom: 14 }}>
          <div>
            <div className="card-title">فهرست فاکتورها</div>
            <div className="card-sub">فیلترها را برای دیدن دقیق‌تر فاکتورها ترکیب کنید.</div>
          </div>
          <div className="filter-group">
            <SearchField value={query} onChange={setQuery} placeholder="شماره فاکتور یا طرف‌حساب…" />
            <select
              className="select"
              style={{ width: 170, height: 38 }}
              value={contactFilter}
              onChange={(event) => setContactFilter(event.target.value)}
            >
              <option value="all">همه طرف‌حساب‌ها</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 0, paddingBottom: 14 }}>
          <div className="filter-bar">
            <div className="filter-group">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  className={clsx('chip', period === item.key && 'active')}
                  onClick={() => setPeriod(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="filter-group">
              {(['all', 'paid', 'partial', 'overdue', 'open'] as StatusFilter[]).map((key) => (
                <button
                  key={key}
                  className={clsx('chip', status === key && 'active')}
                  onClick={() => setStatus(key)}
                >
                  {key === 'all' ? 'همه وضعیت‌ها' : STATUS_META[key].label}
                  <span className="count">{fa(statusCounts[key])}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={isSale ? Receipt : ShoppingBag}
            title={query || status !== 'all' ? 'فاکتوری با این مشخصات پیدا نشد' : 'هنوز فاکتوری ثبت نشده'}
            text={
              query || status !== 'all'
                ? 'فیلترها را تغییر دهید یا عبارت جست‌وجو را کوتاه‌تر کنید.'
                : isSale
                  ? 'اولین فاکتور فروش را ثبت کنید تا درآمد و مطالبات شما شکل بگیرد.'
                  : 'اولین فاکتور خرید را ثبت کنید تا انبار و بدهی‌های شما به‌روز شود.'
            }
            action={
              !query && status === 'all' ? (
                <Button variant="primary" icon={Plus} onClick={() => setFormOpen(true)}>
                  {isSale ? 'ثبت فاکتور فروش' : 'ثبت فاکتور خرید'}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>فاکتور</th>
                    <th>{isSale ? 'مشتری' : 'تأمین‌کننده'}</th>
                    <th>تاریخ</th>
                    <th>سرسید</th>
                    <th>مبلغ کل</th>
                    <th>پرداخت‌شده</th>
                    <th>وضعیت</th>
                    <th className="text-end">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((invoice) => {
                    const contact = contactOf(data, invoice.contactId)
                    const totals = invoiceTotals(invoice)
                    const paid = paidForInvoice(invoice.id, data.payments)
                    const remaining = invoiceRemaining(invoice, data.payments)
                    const statusKey = invoiceStatus(invoice, data.payments, today)
                    return (
                      <tr
                        key={invoice.id}
                        className="clickable"
                        onClick={() => navigate('invoice', { id: invoice.id })}
                      >
                        <td>
                          <div className="cell-main ltr" style={{ display: 'inline-flex', direction: 'ltr' }}>
                            {invoiceNoLabel(invoice)}
                          </div>
                          <div className="cell-sub">{data.settings.currency}</div>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <Avatar name={contact?.name ?? '؟'} size="sm" gold={!isSale} />
                            <div>
                              <div className="c-name">{contact?.name ?? 'حذف‌شده'}</div>
                              <div className="c-sub">{contact?.company ?? contact?.city ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="num">{formatJalali(invoice.date, 'numeric')}</div>
                          <div className="cell-sub">
                            <CalendarDays size={10} style={{ display: 'inline', marginInlineEnd: 3 }} />
                            {formatJalali(invoice.date, 'short')}
                          </div>
                        </td>
                        <td>
                          <span
                            className={clsx(
                              'num',
                              statusKey === 'overdue' && 'text-danger'
                            )}
                          >
                            {formatJalali(invoice.dueDate, 'numeric')}
                          </span>
                        </td>
                        <td>
                          <div className="num cell-main">{money(totals.total)}</div>
                          {remaining > 0 ? (
                            <div className="cell-sub">مانده {compact(remaining)}</div>
                          ) : null}
                        </td>
                        <td>
                          <span className="num">{money(paid)}</span>
                        </td>
                        <td>
                          <InvoiceStatusBadge invoice={invoice} payments={data.payments} />
                        </td>
                        <td>
                          <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                            <button
                              className="icon-btn sm ghost"
                              title="مشاهده فاکتور"
                              onClick={() => navigate('invoice', { id: invoice.id })}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="icon-btn sm ghost"
                              title="ثبت پرداخت"
                              disabled={remaining <= 0}
                              onClick={() => setPaymentInvoice(invoice)}
                            >
                              <Banknote size={14} />
                            </button>
                            <button
                              className="icon-btn sm ghost"
                              title="حذف"
                              onClick={() => removeInvoice(invoice)}
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={setPage}
              total={filtered.length}
              pageSize={pageSize}
            />
          </>
        )}
      </Card>

      <InvoiceDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        kind={kind}
        onSave={(draft) => {
          const invoice = addInvoice(draft)
          toast.success(
            isSale ? 'فاکتور فروش صادر شد' : 'فاکتور خرید ثبت شد',
            `${invoiceNoLabel(invoice)} با موفقیت در دفتر ثبت شد.`
          )
          setFormOpen(false)
        }}
      />

      <PaymentModal
        invoice={paymentInvoice}
        open={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
      />
    </div>
  )
}

/* ── Invoice creation drawer ───────────────────────────────────────────── */
interface DraftLine {
  key: string
  productId: string
  qty: number
  price: number
  discountPct: number
}

const keyOf = (): string => Math.random().toString(36).slice(2, 9)

export function InvoiceDrawer({
  open,
  onClose,
  kind,
  onSave
}: {
  open: boolean
  onClose: () => void
  kind: InvoiceKind
  onSave: (draft: Omit<Invoice, 'id' | 'no' | 'createdAt'>) => void
}): React.JSX.Element {
  const data = useApp()
  const isSale = kind === 'sale'
  const contacts = data.contacts.filter((contact) =>
    isSale ? contact.kind === 'customer' : contact.kind === 'supplier'
  )

  const [contactId, setContactId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(addDaysIso(todayIso(), 30))
  const [lines, setLines] = useState<DraftLine[]>([
    { key: keyOf(), productId: '', qty: 1, price: 0, discountPct: 0 }
  ])
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(data.settings.vatRate)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setContactId('')
    setDate(todayIso())
    setDueDate(addDaysIso(todayIso(), 30))
    setLines([{ key: keyOf(), productId: '', qty: 1, price: 0, discountPct: 0 }])
    setDiscount(0)
    setTaxRate(data.settings.vatRate)
    setNote('')
    setError('')
  }, [open, data.settings.vatRate])

  const updateLine = (key: string, patch: Partial<DraftLine>): void => {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  const chooseProduct = (key: string, productId: string): void => {
    const product = data.products.find((item) => item.id === productId)
    updateLine(key, {
      productId,
      price: product ? (isSale ? product.price : product.cost) : 0
    })
    if (product) setSelectedProductId(product.id)
  }

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + Math.round(line.qty * line.price * (1 - line.discountPct / 100)),
        0
      ),
    [lines]
  )
  const validDiscount = Math.min(Math.max(0, discount), subtotal)
  const taxable = subtotal - validDiscount
  const tax = Math.round((taxable * taxRate) / 100)
  const total = taxable + tax

  const submit = (): void => {
    if (!contactId) {
      setError('طرف‌حساب را انتخاب کنید.')
      return
    }
    const prepared = lines.filter((line) => line.productId && line.qty > 0)
    if (prepared.length === 0) {
      setError('حداقل یک کالا یا خدمت با تعداد معتبر اضافه کنید.')
      return
    }
    if (prepared.some((line) => line.price <= 0)) {
      setError('برای همه ردیف‌ها مبلغ معتبر وارد کنید.')
      return
    }
    if (isSale) {
      for (const line of prepared) {
        const product = data.products.find((item) => item.id === line.productId)
        if (!product) continue
        if (product.category !== 'خدمات') {
          const available = currentStock(product, data)
          if (line.qty > available) {
            setError(`موجودی «${product.name}» کافی نیست؛ موجودی فعلی ${fa(available)} ${product.unit}.`)
            return
          }
        }
      }
    }
    if (dueDate < date) {
      setError('سرسید نمی‌تواند قبل از تاریخ صدور باشد.')
      return
    }

    onSave({
      kind,
      contactId,
      date,
      dueDate,
      lines: prepared.map((line) => {
        const product = data.products.find((item) => item.id === line.productId)
        return {
          id: keyOf(),
          productId: line.productId,
          title: product?.name ?? 'کالای آزاد',
          qty: line.qty,
          price: Math.round(line.price),
          discountPct: line.discountPct,
          cost: product?.cost ?? 0
        }
      }),
      discount: validDiscount,
      taxRate,
      note: note.trim() || undefined
    })
    setError('')
  }

  const contact = data.contacts.find((item) => item.id === contactId)
  const stockHintProduct = selectedProductId
    ? data.products.find((item) => item.id === selectedProductId)
    : null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isSale ? 'فاکتور فروش جدید' : 'فاکتور خرید جدید'}
      subtitle={
        isSale
          ? 'اقلام را اضافه کنید؛ مالیات و سود به‌صورت خودکار محاسبه می‌شود.'
          : 'خرید را ثبت کنید تا موجودی و بدهی تأمین‌کننده به‌روز شود.'
      }
      footer={
        <>
          <div className="tiny muted">
            جمع نهایی: <b className="num" style={{ color: 'var(--ink)' }}>{money(total)}</b>{' '}
            {data.settings.currency}
          </div>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" icon={Receipt} onClick={submit}>
            ثبت فاکتور
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label={isSale ? 'مشتری' : 'تأمین‌کننده'} required>
          <select
            className="select"
            value={contactId}
            onChange={(event) => setContactId(event.target.value)}
          >
            <option value="">انتخاب کنید…</option>
            {contacts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.company && item.company !== item.name ? ` — ${item.company}` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="تاریخ صدور">
          <DatePicker value={date} onChange={(value) => {
            setDate(value)
            if (dueDate < value) setDueDate(addDaysIso(value, 30))
          }} />
        </Field>
        <Field label="سرسید">
          <DatePicker value={dueDate} onChange={setDueDate} />
        </Field>
        <Field label="نرخ مالیات بر ارزش افزوده" hint="درصد از مبلغ پس از تخفیف">
          <div className="input-group">
            <input
              className="input ltr"
              type="number"
              min={0}
              max={100}
              value={taxRate}
              onChange={(event) => setTaxRate(Number(event.target.value) || 0)}
            />
            <span className="input-suffix">٪</span>
          </div>
        </Field>
        <Field label="توضیحات" className="full">
          <input
            className="input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="شماره سفارش، شرایط ارسال یا توضیح کوتاه…"
          />
        </Field>
      </div>

      <div className="form-section-title" style={{ marginTop: 20 }}>
        اقلام فاکتور
      </div>

      <div className="invoice-form-lines">
        <div className="invoice-form-head">
          <span>کالا / خدمت</span>
          <span>تعداد</span>
          <span>قیمت واحد</span>
          <span>تخفیف</span>
          <span>جمع</span>
          <span />
        </div>
        {lines.map((line) => {
          const product = data.products.find((item) => item.id === line.productId)
          const lineTotal = Math.round(line.qty * line.price * (1 - line.discountPct / 100))
          return (
            <div className="invoice-form-row" key={line.key}>
              <div className="line-product">
                <select
                  className="select"
                  value={line.productId}
                  onChange={(event) => chooseProduct(line.key, event.target.value)}
                >
                  <option value="">انتخاب کالا…</option>
                  {data.products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {product ? (
                  <div className="line-hint">
                    {product.code} · موجودی{' '}
                    {product.category === 'خدمات' ? 'بی‌نهایت' : fa(currentStock(product, data))}{' '}
                    {product.unit}
                  </div>
                ) : null}
              </div>
              <input
                className="input ltr"
                type="number"
                min={1}
                value={line.qty}
                onChange={(event) =>
                  updateLine(line.key, { qty: Math.max(1, Number(event.target.value) || 1) })
                }
              />
              <AmountInput
                value={line.price}
                onChange={(value) => updateLine(line.key, { price: value })}
                suffix=""
              />
              <div className="input-group">
                <input
                  className="input ltr"
                  type="number"
                  min={0}
                  max={100}
                  value={line.discountPct}
                  onChange={(event) =>
                    updateLine(line.key, {
                      discountPct: Math.min(100, Math.max(0, Number(event.target.value) || 0))
                    })
                  }
                />
                <span className="input-suffix">٪</span>
              </div>
              <div className="line-total num">{money(lineTotal)}</div>
              <button
                className="icon-btn sm ghost"
                onClick={() => {
                  if (lines.length === 1) {
                    setLines([{ key: keyOf(), productId: '', qty: 1, price: 0, discountPct: 0 }])
                  } else {
                    setLines((current) => current.filter((item) => item.key !== line.key))
                  }
                }}
                aria-label="حذف ردیف"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
        <div className="invoice-form-foot">
          <Button
            variant="soft"
            size="sm"
            icon={Plus}
            onClick={() =>
              setLines((current) => [
                ...current,
                { key: keyOf(), productId: '', qty: 1, price: 0, discountPct: 0 }
              ])
            }
          >
            افزودن ردیف
          </Button>
          {stockHintProduct && isSale && stockHintProduct.category !== 'خدمات' ? (
            <span className="tiny muted">
              موجودی «{stockHintProduct.name}»: {fa(currentStock(stockHintProduct, data))}{' '}
              {stockHintProduct.unit}
            </span>
          ) : null}
        </div>
      </div>

      <div className="invoice-form-summary">
        <div className="summary-row">
          <span>جمع اقلام</span>
          <b className="num">{money(subtotal)}</b>
        </div>
        <div className="summary-row">
          <span>تخفیف کل</span>
          <div style={{ width: 150 }}>
            <AmountInput value={discount} onChange={setDiscount} suffix="" />
          </div>
        </div>
        <div className="summary-row">
          <span>مالیات ({fa(taxRate)}٪)</span>
          <b className="num">{money(tax)}</b>
        </div>
        <div className="summary-row total">
          <span>مبلغ نهایی</span>
          <b className="num">{money(total)} <small>{data.settings.currency}</small></b>
        </div>
      </div>

      {contact ? (
        <div className="insight" style={{ marginTop: 14 }}>
          <Wallet size={15} />
          <div>
            {isSale ? 'فروش به' : 'خرید از'} <b>{contact.name}</b>
            {contact.phone ? ` · ${contact.phone}` : ''}
            {contact.city ? ` · ${contact.city}` : ''}
            <br />
            {lines.length} ردیف ثبت شده · نرخ مالیات {fa(taxRate)}٪ ·{' '}
            {PAYMENT_METHOD_LABELS.transfer} پس از ثبت قابل دریافت است.
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="field-error" style={{ marginTop: 10 }}>
          {error}
        </div>
      ) : null}
    </Drawer>
  )
}
