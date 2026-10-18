import { useMemo } from 'react'
import type * as React from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  Landmark,
  PackageSearch,
  Plus,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react'
import clsx from 'clsx'
import {
  accountBalance,
  contactOf,
  invoiceRemaining,
  invoiceTotals,
  lowStockProducts,
  overdueSales,
  receivableTotal
} from '../domain/calc'
import {
  buildJournal,
  invoiceNoLabel,
  monthCashflow,
  profitLoss
} from '../domain/journal'
import { EXPENSE_CATEGORY_MAP } from '../domain/catalogs'
import { diffDays, formatJalali, relativeDay, todayIso } from '../lib/jalali'
import { compact, money, percent } from '../lib/format'
import { fa } from '../lib/digits'
import { monthBuckets, previousRange, resolvePeriod, fiscalProgress } from '../lib/period'
import { useApp } from '../store/useApp'
import { useNav } from '../store/ui'
import type { Page } from '../store/ui'
import { Avatar, Badge, Button, Card, CountUp, PageHeader, Progress } from '../components/kit'
import { AreaChart, Donut, Sparkline } from '../components/charts'
import { InvoiceStatusBadge } from '../components/InvoiceStatus'

export function DashboardPage(): React.JSX.Element {
  const data = useApp()
  const navigate = useNav((state) => state.navigate)
  const today = todayIso()
  const settings = data.settings

  const docs = useMemo(() => buildJournal(data, today), [data, today])
  const month = useMemo(() => resolvePeriod('thisMonth', settings), [settings])
  const previous = useMemo(() => previousRange(month), [month])
  const six = useMemo(() => resolvePeriod('last6', settings), [settings])
  const buckets = useMemo(() => monthBuckets(six.from, six.to), [six])
  const pnl = useMemo(() => profitLoss(docs, month.from, month.to), [docs, month])
  const prevPnl = useMemo(() => profitLoss(docs, previous.from, previous.to), [docs, previous])

  const monthly = useMemo(
    () =>
      buckets.map((bucket) => {
        const report = profitLoss(docs, bucket.from, bucket.to)
        return {
          ...bucket,
          revenue: report.revenueTotal,
          cost: report.cogs + report.expenseTotal,
          profit: report.netProfit
        }
      }),
    [buckets, docs]
  )
  const cashflow = useMemo(() => monthCashflow(docs, buckets), [docs, buckets])
  const liquidity = data.accounts.reduce((sum, account) => sum + accountBalance(account.id, data), 0)
  const receivables = receivableTotal(data)
  const overdue = overdueSales(data)
  const lowStock = lowStockProducts(data)

  const collections = useMemo(
    () =>
      buckets.map((bucket) =>
        data.payments
          .filter(
            (payment) =>
              payment.direction === 'in' && payment.date >= bucket.from && payment.date <= bucket.to
          )
          .reduce((sum, payment) => sum + payment.amount, 0)
      ),
    [buckets, data.payments]
  )

  const monthlyExpenses = useMemo(() => {
    const map = new Map<string, number>()
    for (const expense of data.expenses) {
      if (expense.date < month.from || expense.date > month.to) continue
      map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount)
    }
    return [...map.entries()]
      .map(([key, amount]) => ({
        key,
        label: EXPENSE_CATEGORY_MAP[key]?.label ?? 'سایر',
        color: EXPENSE_CATEGORY_MAP[key]?.color ?? '#8A7A63',
        amount
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [data.expenses, month])
  const expenseDonut = useMemo(() => {
    if (monthlyExpenses.length <= 4) return monthlyExpenses
    return [
      ...monthlyExpenses.slice(0, 3),
      {
        key: 'rest',
        label: 'سایر دسته‌ها',
        color: '#9A9184',
        amount: monthlyExpenses.slice(3).reduce((sum, item) => sum + item.amount, 0)
      }
    ]
  }, [monthlyExpenses])
  const monthExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0)

  const recentInvoices = useMemo(
    () =>
      [...data.invoices]
        .sort((a, b) => (a.date === b.date ? b.no - a.no : a.date < b.date ? 1 : -1))
        .slice(0, 5),
    [data.invoices]
  )

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>()
    for (const invoice of data.invoices) {
      if (invoice.kind !== 'sale' || invoice.date < six.from || invoice.date > six.to) continue
      const totals = invoiceTotals(invoice)
      map.set(invoice.contactId, (map.get(invoice.contactId) ?? 0) + totals.total - totals.tax)
    }
    return [...map.entries()]
      .map(([id, amount]) => ({ id, amount, contact: contactOf(data, id) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
  }, [data, six])

  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; qty: number; amount: number }>()
    for (const invoice of data.invoices) {
      if (invoice.kind !== 'sale' || invoice.date < six.from || invoice.date > six.to) continue
      for (const line of invoice.lines) {
        const key = line.productId ?? line.title
        const current = map.get(key) ?? { title: line.title, qty: 0, amount: 0 }
        current.qty += line.qty
        current.amount += Math.round(line.qty * line.price * (1 - line.discountPct / 100))
        map.set(key, current)
      }
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 4)
  }, [data.invoices, six])

  const activity = useMemo(() => {
    const rows: {
      id: string
      date: string
      title: string
      sub: string
      amount: number
      direction: 'in' | 'out'
      kind: 'payment' | 'expense'
    }[] = []
    for (const payment of data.payments) {
      const invoice = data.invoices.find((item) => item.id === payment.invoiceId)
      const contact = invoice ? contactOf(data, invoice.contactId) : undefined
      rows.push({
        id: payment.id,
        date: payment.date,
        title: payment.direction === 'in' ? 'دریافت وجه' : 'پرداخت وجه',
        sub: `${contact?.name ?? 'طرف‌حساب'}${invoice ? ` · ${invoiceNoLabel(invoice)}` : ''}`,
        amount: payment.amount,
        direction: payment.direction,
        kind: 'payment'
      })
    }
    for (const expense of data.expenses) {
      rows.push({
        id: expense.id,
        date: expense.date,
        title: expense.title,
        sub: EXPENSE_CATEGORY_MAP[expense.category]?.label ?? 'هزینه',
        amount: expense.amount,
        direction: 'out',
        kind: 'expense'
      })
    }
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)
  }, [data])

  const saleCountMonth = data.invoices.filter(
    (invoice) => invoice.kind === 'sale' && invoice.date >= month.from && invoice.date <= month.to
  ).length
  const pendingCount = data.invoices.filter(
    (invoice) =>
      invoice.kind === 'sale' &&
      invoice.dueDate >= today &&
      invoiceRemaining(invoice, data.payments) > 0
  ).length
  const fiscal = fiscalProgress(settings, today)
  const profitMargin = pnl.revenueTotal > 0 ? (pnl.netProfit / pnl.revenueTotal) * 100 : 0
  const ownerFirst = settings.company.owner.split(' ')[0] || settings.company.owner

  const currentMonthLabel = formatJalali(today, 'monthYear')

  return (
    <div className="page">
      <PageHeader
        title="داشبورد"
        subtitle={`${formatJalali(today, 'long')} · سال مالی ${fa(settings.fiscalYear)}`}
        actions={
          <>
            <Button variant="ghost" icon={BarChart3} onClick={() => navigate('reports')}>
              گزارش‌ها
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => navigate('sales', { create: true })}>
              فاکتور فروش جدید
            </Button>
          </>
        }
      />

      <section className="hero">
        <div>
          <div className="hero-eyebrow">
            <span className="gold-line" />
            {settings.company.name} · سال مالی {fa(settings.fiscalYear)}
          </div>
          <div className="hero-greeting">سلام، {ownerFirst} !</div>
          <div className="hero-sub">
            {overdue.length > 0
              ? `${fa(overdue.length)} فاکتور از سرسید گذشته و ${fa(lowStock.length)} قلم کالا نیازمند تأمین است.`
              : 'همه‌چیز مرتب است؛ امروز یک روز خوب برای رشد است.'}
          </div>
          <div className="hero-balance-label">
            <Wallet size={12} /> موجودی نقد و بانک
          </div>
          <div className="hero-balance num">
            <CountUp value={liquidity} format={(value) => money(Math.round(value))} />
            <span className="unit">{settings.currency}</span>
          </div>
          <div className="hero-meta">
            {data.accounts.map((account) => (
              <div className="hero-account" key={account.id}>
                <span className="ico">
                  {account.kind === 'cash' ? <Wallet size={13} /> : <Landmark size={13} />}
                </span>
                <span>
                  {account.name}
                  <br />
                  <b className="num" style={{ color: '#f0e3c2', fontWeight: 600 }}>
                    {compact(accountBalance(account.id, data))}
                  </b>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-actions">
            <button className="hero-action" onClick={() => navigate('sales', { create: true })}>
              <Receipt size={13} /> فروش
            </button>
            <button className="hero-action" onClick={() => navigate('expenses', { create: true })}>
              <Wallet size={13} /> هزینه
            </button>
            <button className="hero-action" onClick={() => navigate('purchases', { create: true })}>
              <ShoppingBag size={13} /> خرید
            </button>
            <button className="hero-action" onClick={() => navigate('accounts', { create: true })}>
              <ArrowLeftRight size={13} /> انتقال
            </button>
          </div>

          <div className="hero-chart">
            <div className="hero-chart-head">
              <span>موجودی خزانه در ۶ ماه</span>
              <span className="num" style={{ color: '#f0e3c2' }}>
                {compact(liquidity)}
              </span>
            </div>
            <div style={{ height: 48 }}>
              <Sparkline
                values={cashflow.map((row) => row.balance)}
                color="#F1DCA9"
                height={48}
                strokeWidth={2}
              />
            </div>
            <div className="hero-progress">
              <div className="hero-progress-label">
                <span>پیشرفت سال مالی</span>
                <span className="num">{fa(Math.round(fiscal))}٪</span>
              </div>
              <Progress value={fiscal} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-kpi">
        <KpiCard
          label="فروش این ماه"
          value={pnl.revenueTotal}
          unit="تومان"
          icon={Receipt}
          trend={change(pnl.revenueTotal, prevPnl.revenueTotal)}
          foot={`${fa(saleCountMonth)} فاکتور · ${currentMonthLabel}`}
          spark={monthly.map((row) => row.revenue)}
        />
        <KpiCard
          label="سود خالص این ماه"
          value={pnl.netProfit}
          unit="تومان"
          icon={TrendingUp}
          tone="gold"
          trend={change(pnl.netProfit, prevPnl.netProfit)}
          foot={`حاشیه سود ${percent(profitMargin)}`}
          spark={monthly.map((row) => row.profit)}
          valueColor={pnl.netProfit < 0 ? 'var(--danger)' : undefined}
        />
        <KpiCard
          label="هزینه‌های این ماه"
          value={pnl.cogs + pnl.expenseTotal}
          unit="تومان"
          icon={Wallet}
          tone="blue"
          trend={change(pnl.cogs + pnl.expenseTotal, prevPnl.cogs + prevPnl.expenseTotal)}
          invert
          foot={`${fa(data.expenses.filter((e) => e.date >= month.from && e.date <= month.to).length)} هزینه ثبت‌شده`}
          spark={monthly.map((row) => row.cost)}
        />
        <KpiCard
          label="مطالبات باز"
          value={receivables}
          unit="تومان"
          icon={Users}
          tone="violet"
          trend={null}
          foot={`${fa(overdue.length)} فاکتور معوق · ${fa(pendingCount)} در انتظار`}
          spark={collections}
        />
      </div>

      <div className="dash-grid">
        <Card className="card-pad">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="card-title">روند فروش و هزینه</div>
              <div className="card-sub">۶ ماه اخیر · مبالغ به تومان</div>
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--chart-1)' }} />
                فروش
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--chart-2)' }} />
                هزینه و بهای تمام‌شده
              </span>
            </div>
          </div>
          <div className="mt-2">
            <AreaChart
              labels={monthly.map((row) => row.label)}
              series={[
                { name: 'فروش', color: 'var(--chart-1)', values: monthly.map((row) => row.revenue) },
                { name: 'هزینه', color: 'var(--chart-2)', values: monthly.map((row) => row.cost) }
              ]}
              height={250}
            />
          </div>
          <div className="divider" />
          <div className="grid grid-3 mt-2" style={{ gap: 12 }}>
            <MiniStat label="جمع فروش دوره" value={compact(monthly.reduce((sum, row) => sum + row.revenue, 0))} />
            <MiniStat
              label="جمع سود دوره"
              value={compact(monthly.reduce((sum, row) => sum + row.profit, 0))}
              tone="success"
            />
            <MiniStat
              label="میانگین فروش ماه"
              value={compact(monthly.length ? monthly.reduce((sum, row) => sum + row.revenue, 0) / monthly.length : 0)}
            />
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-start justify-between">
            <div>
              <div className="card-title">ترکیب هزینه‌ها</div>
              <div className="card-sub">{currentMonthLabel} · هزینه‌های عملیاتی</div>
            </div>
            <button
              className="icon-btn sm ghost"
              onClick={() => navigate('expenses')}
              aria-label="مشاهده هزینه‌ها"
            >
              <ArrowLeft size={15} />
            </button>
          </div>
          {expenseDonut.length === 0 ? (
            <div className="empty" style={{ padding: '36px 10px' }}>
              <div className="empty-title">هزینه‌ای ثبت نشده</div>
              <div className="empty-text">هزینه‌های این ماه را ثبت کنید تا ترکیب آن‌ها را ببینید.</div>
            </div>
          ) : (
            <>
              <Donut
                items={expenseDonut}
                centerLabel="جمع هزینه"
                centerValue={compact(monthExpense)}
                size={182}
                thickness={20}
              />
              <div className="donut-legend mt-2">
                {expenseDonut.map((item) => (
                  <div className="donut-row" key={item.key}>
                    <span className="legend-dot" style={{ background: item.color, width: 8, height: 8 }} />
                    <span className="d-name">{item.label}</span>
                    <span className="d-amount">{compact(item.amount)}</span>
                    <span className="d-pct">
                      {monthExpense > 0 ? fa(Math.round((item.amount / monthExpense) * 100)) : fa(0)}٪
                    </span>
                  </div>
                ))}
              </div>
              <div className="insight mt-2">
                <TrendingUp size={14} />
                <div>
                  بزرگ‌ترین هزینه این ماه «{monthlyExpenses[0]?.label}» با{' '}
                  {compact(monthlyExpenses[0]?.amount ?? 0)} تومان است.
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="dash-grid">
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">آخرین فاکتورها</div>
              <div className="card-sub">پنج فاکتور اخیر فروش و خرید</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('sales')}>
              همه فاکتورها <ChevronLeft size={13} />
            </button>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>فاکتور</th>
                    <th>طرف‌حساب</th>
                    <th>تاریخ</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => {
                    const contact = contactOf(data, invoice.contactId)
                    const totals = invoiceTotals(invoice)
                    return (
                      <tr
                        key={invoice.id}
                        className="clickable"
                        onClick={() => navigate('invoice', { id: invoice.id })}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="list-icon" style={{ width: 28, height: 28, flex: '0 0 28px' }}>
                              {invoice.kind === 'sale' ? <Receipt size={13} /> : <ShoppingBag size={13} />}
                            </span>
                            <span className="num cell-main">{invoiceNoLabel(invoice)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-main">{contact?.name ?? '—'}</div>
                          <div className="cell-sub">{invoice.kind === 'sale' ? 'فروش' : 'خرید'}</div>
                        </td>
                        <td className="num">{formatJalali(invoice.date, 'numeric')}</td>
                        <td className="num cell-main">{compact(totals.total)}</td>
                        <td>
                          <InvoiceStatusBadge invoice={invoice} payments={data.payments} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <div className="stack">
          <Card className="card-pad">
            <div className="flex items-start justify-between">
              <div>
                <div className="card-title">یادآوری‌ها</div>
                <div className="card-sub">چیزهایی که نباید فراموش شوند</div>
              </div>
              <Badge tone={overdue.length + lowStock.length > 0 ? 'warning' : 'success'} dot>
                {fa(overdue.length + lowStock.length)} مورد
              </Badge>
            </div>
            <div className="mt-2">
              {overdue.slice(0, 2).map((invoice) => {
                const contact = contactOf(data, invoice.contactId)
                return (
                  <button
                    key={invoice.id}
                    className="alert-row"
                    style={{ width: '100%', background: 'none', border: 0, textAlign: 'start', cursor: 'pointer' }}
                    onClick={() => navigate('invoice', { id: invoice.id })}
                  >
                    <span className="a-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                      <AlertTriangle size={13} />
                    </span>
                    <span className="grow">
                      <span className="a-title">فاکتور {invoiceNoLabel(invoice)} سرسید گذشته</span>
                      <span className="a-sub">
                        {contact?.name} · {fa(Math.abs(diffDays(invoice.dueDate, today)))} روز تأخیر
                      </span>
                    </span>
                    <span className="tiny num text-danger">
                      {compact(invoiceRemaining(invoice, data.payments))}
                    </span>
                  </button>
                )
              })}
              {lowStock.slice(0, 2).map((product) => (
                <button
                  key={product.id}
                  className="alert-row"
                  style={{ width: '100%', background: 'none', border: 0, textAlign: 'start', cursor: 'pointer' }}
                  onClick={() => navigate('products')}
                >
                  <span className="a-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                    <PackageSearch size={13} />
                  </span>
                  <span className="grow">
                    <span className="a-title">{product.name}</span>
                    <span className="a-sub">موجودی به حداقل رسیده است</span>
                  </span>
                  <ArrowLeft size={13} className="muted" />
                </button>
              ))}
              {overdue.length === 0 && lowStock.length === 0 ? (
                <div className="insight">
                  <Sparkles size={14} />
                  <div>هیچ یادآوری فعالی نیست؛ همه فاکتورها و موجودی‌ها در وضعیت مطلوب‌اند.</div>
                </div>
              ) : (
                <button
                  className="btn btn-ghost btn-sm w-100 mt-1"
                  onClick={() => navigate('reports')}
                >
                  مشاهدهٔ گزارش مطالبات
                </button>
              )}
            </div>
          </Card>

          <Card className="card-pad">
            <div className="flex items-start justify-between">
              <div>
                <div className="card-title">بهترین مشتریان</div>
                <div className="card-sub">۶ ماه اخیر · بر اساس فروش</div>
              </div>
              <button className="icon-btn sm ghost" onClick={() => navigate('contacts')} aria-label="طرف‌حساب‌ها">
                <Users size={14} />
              </button>
            </div>
            <div className="mt-2">
              {topCustomers.map((customer, index) => {
                const max = topCustomers[0]?.amount || 1
                return (
                  <div className="list-row" key={customer.id}>
                    <span className="tiny num muted" style={{ width: 14 }}>
                      {fa(index + 1)}
                    </span>
                    <Avatar name={customer.contact?.name ?? '؟'} size="sm" />
                    <span className="list-body">
                      <span className="list-title">{customer.contact?.name ?? 'حذف‌شده'}</span>
                      <span className="progress thin" style={{ marginTop: 4, display: 'block' }}>
                        <span
                          className="progress-bar"
                          style={{ width: `${Math.max(6, (customer.amount / max) * 100)}%`, display: 'block' }}
                        />
                      </span>
                    </span>
                    <span className="list-value">{compact(customer.amount)}</span>
                  </div>
                )
              })}
              {topCustomers.length === 0 ? (
                <div className="tiny muted">در این دوره فروشی ثبت نشده است.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-2">
        <Card className="card-pad">
          <div className="flex items-start justify-between">
            <div>
              <div className="card-title">پرفروش‌ترین کالاها</div>
              <div className="card-sub">۶ ماه اخیر · بر اساس مبلغ فروش</div>
            </div>
            <Badge tone="gold">{fa(topProducts.length)} قلم</Badge>
          </div>
          <div className="mt-2">
            {topProducts.map((product, index) => (
              <div className="list-row" key={product.title}>
                <span className="product-thumb" style={{ width: 32, height: 32, flex: '0 0 32px', fontSize: 9 }}>
                  {fa(index + 1)}
                </span>
                <span className="list-body">
                  <span className="list-title">{product.title}</span>
                  <span className="list-sub">{fa(product.qty)} عدد فروخته‌شده</span>
                </span>
                <span className="list-value">
                  {compact(product.amount)}
                  <small>تومان</small>
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-start justify-between">
            <div>
              <div className="card-title">آخرین فعالیت‌ها</div>
              <div className="card-sub">دریافت، پرداخت و هزینه</div>
            </div>
            <CalendarDays size={15} className="muted" />
          </div>
          <div className="mt-2">
            {activity.map((row) => (
              <div className="list-row" key={`${row.kind}-${row.id}`}>
                <span className={clsx('list-icon', row.direction === 'out' && 'danger')}>
                  {row.direction === 'in' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                </span>
                <span className="list-body">
                  <span className="list-title">{row.title}</span>
                  <span className="list-sub">
                    {row.sub} · {relativeDay(row.date, today)}
                  </span>
                </span>
                <span className={clsx('list-value num', row.direction === 'in' ? 'money-in' : 'money-out')}>
                  {row.direction === 'in' ? '+' : '−'}
                  {compact(row.amount)}
                  <small>تومان</small>
                </span>
              </div>
            ))}
            {activity.length === 0 ? <div className="tiny muted">هنوز فعالیتی ثبت نشده است.</div> : null}
          </div>
        </Card>
      </div>

      <div className="tiny muted" style={{ textAlign: 'center' }}>
        همهٔ مبالغ به {settings.currency} است · آخرین به‌روزرسانی: {formatJalali(today, 'long')}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  trend,
  foot,
  spark,
  invert,
  valueColor
}: {
  label: string
  value: number
  unit: string
  icon: typeof Receipt
  tone?: 'gold' | 'blue' | 'violet'
  trend: number | null
  foot: string
  spark: number[]
  invert?: boolean
  valueColor?: string
}): React.JSX.Element {
  const positive = trend === null ? null : invert ? trend < 0 : trend >= 0
  return (
    <Card className="kpi hover-lift">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={clsx('kpi-icon', tone)}>
          <Icon size={16} />
        </span>
      </div>
      <div className="kpi-value" style={{ color: valueColor }}>
        <CountUp value={value} format={(current) => compact(current)} />
        <span className="unit">{unit}</span>
      </div>
      <div className="kpi-foot">
        {trend !== null ? (
          <span className={clsx('trend', positive ? 'up' : 'down')}>
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {fa(Math.abs(Math.round(trend)))}٪
          </span>
        ) : null}
        <span>{foot}</span>
      </div>
      <div className="kpi-spark">
        <Sparkline values={spark.length > 1 ? spark : [0, ...spark]} color="var(--chart-1)" height={42} />
      </div>
    </Card>
  )
}

function MiniStat({
  label,
  value,
  tone
}: {
  label: string
  value: string
  tone?: 'success'
}): React.JSX.Element {
  return (
    <div>
      <div className="tiny muted">{label}</div>
      <div className={clsx('num strong', tone === 'success' && 'text-success')} style={{ fontSize: 14, marginTop: 2 }}>
        {value} <span className="tiny muted">تومان</span>
      </div>
    </div>
  )
}

function change(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / Math.abs(previous)) * 100
}
