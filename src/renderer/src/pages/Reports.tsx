import { useMemo, useState } from 'react'
import type * as React from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CalendarRange,
  Download,
  Landmark,
  Printer,
  Receipt,
  Scale,
  TrendingUp,
  Wallet
} from 'lucide-react'
import clsx from 'clsx'
import {
  accountBalance,
  contactOf,
  invoiceRemaining,
  invoiceTotals,
  overduePurchases,
  overdueSales
} from '../domain/calc'
import {
  agingBuckets,
  balanceSheet,
  buildJournal,
  cashBalanceAt,
  invoiceNoLabel,
  monthCashflow,
  profitLoss
} from '../domain/journal'
import type { AgingBucket } from '../domain/journal'
import { PRODUCT_CATEGORY_COLORS, EXPENSE_CATEGORY_MAP, ACCOUNT_MAP } from '../domain/catalogs'
import { diffDays, formatJalali, todayIso } from '../lib/jalali'
import { compact, money, percent } from '../lib/format'
import { fa } from '../lib/digits'
import { downloadCsv } from '../lib/export'
import { monthBuckets, PERIOD_PRESETS, previousRange, resolvePeriod } from '../lib/period'
import type { PeriodPreset } from '../lib/period'
import { useApp } from '../store/useApp'
import { useNav } from '../store/ui'
import { Badge, Button, Card, EmptyState, PageHeader, Progress } from '../components/kit'
import { AreaChart, Donut, GroupedBars } from '../components/charts'
import { InvoiceStatusBadge } from '../components/InvoiceStatus'

type ReportTab = 'pnl' | 'balance' | 'cash' | 'aging' | 'sales' | 'vat'

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'pnl', label: 'سود و زیان' },
  { key: 'balance', label: 'ترازنامه' },
  { key: 'cash', label: 'جریان نقد' },
  { key: 'aging', label: 'مطالبات و بدهی‌ها' },
  { key: 'sales', label: 'تحلیل فروش' },
  { key: 'vat', label: 'ارزش افزوده' }
]

export function ReportsPage(): React.JSX.Element {
  const data = useApp()
  const navigate = useNav((state) => state.navigate)
  const [preset, setPreset] = useState<PeriodPreset>('last6')
  const [tab, setTab] = useState<ReportTab>('pnl')

  const today = todayIso()
  const range = useMemo(() => resolvePeriod(preset, data.settings), [preset, data.settings])
  const prev = useMemo(() => previousRange(range), [range])
  const docs = useMemo(() => buildJournal(data, today), [data, today])
  const pnl = useMemo(() => profitLoss(docs, range.from, range.to), [docs, range])
  const prevPnl = useMemo(() => profitLoss(docs, prev.from, prev.to), [docs, prev])
  const sheet = useMemo(() => balanceSheet(docs, range.to), [docs, range.to])
  const buckets = useMemo(() => monthBuckets(range.from, range.to), [range])
  const cashflow = useMemo(() => monthCashflow(docs, buckets), [docs, buckets])

  const margin = pnl.revenueTotal > 0 ? (pnl.netProfit / pnl.revenueTotal) * 100 : 0
  const prevMargin =
    prevPnl.revenueTotal > 0 ? (prevPnl.netProfit / prevPnl.revenueTotal) * 100 : 0

  const agingSales = useMemo(() => agingBuckets(data, 'sale', today), [data, today])
  const agingPurchases = useMemo(() => agingBuckets(data, 'purchase', today), [data, today])
  const arTotal = agingSales.reduce((sum, bucket) => sum + bucket.amount, 0)
  const apTotal = agingPurchases.reduce((sum, bucket) => sum + bucket.amount, 0)
  const overdueAr = agingSales.slice(1).reduce((sum, bucket) => sum + bucket.amount, 0)
  const overdueAp = agingPurchases.slice(1).reduce((sum, bucket) => sum + bucket.amount, 0)

  const monthly = useMemo(
    () =>
      buckets.map((bucket) => {
        const report = profitLoss(docs, bucket.from, bucket.to)
        return {
          key: bucket.key,
          label: bucket.label,
          revenue: report.revenueTotal,
          cost: report.cogs + report.expenseTotal,
          profit: report.netProfit
        }
      }),
    [buckets, docs]
  )

  const salesInvoices = useMemo(
    () =>
      data.invoices
        .filter(
          (invoice) =>
            invoice.kind === 'sale' && invoice.date >= range.from && invoice.date <= range.to
        )
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.invoices, range]
  )

  const salesByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const invoice of salesInvoices) {
      for (const line of invoice.lines) {
        const product = data.products.find((item) => item.id === line.productId)
        const category = product?.category ?? 'خدمات'
        const net = Math.round(line.qty * line.price * (1 - line.discountPct / 100))
        map.set(category, (map.get(category) ?? 0) + net)
      }
    }
    return [...map.entries()]
      .map(([label, amount]) => ({
        label,
        amount,
        color: PRODUCT_CATEGORY_COLORS[label] ?? '#8A7A63'
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [salesInvoices, data.products])

  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; qty: number; amount: number }>()
    for (const invoice of salesInvoices) {
      for (const line of invoice.lines) {
        const key = line.productId ?? line.title
        const current = map.get(key) ?? { title: line.title, qty: 0, amount: 0 }
        current.qty += line.qty
        current.amount += Math.round(line.qty * line.price * (1 - line.discountPct / 100))
        map.set(key, current)
      }
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [salesInvoices])

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>()
    for (const invoice of salesInvoices) {
      const totals = invoiceTotals(invoice)
      map.set(invoice.contactId, (map.get(invoice.contactId) ?? 0) + totals.total - totals.tax)
    }
    return [...map.entries()]
      .map(([id, amount]) => ({ id, amount, contact: contactOf(data, id) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [salesInvoices, data])

  const vatMonthly = useMemo(
    () =>
      buckets.map((bucket) => {
        let output = 0
        let input = 0
        for (const invoice of data.invoices) {
          if (invoice.date < bucket.from || invoice.date > bucket.to) continue
          const totals = invoiceTotals(invoice)
          if (invoice.kind === 'sale') output += totals.tax
          else input += totals.tax
        }
        return { ...bucket, output, input, net: output - input }
      }),
    [buckets, data.invoices]
  )

  const outputVat = vatMonthly.reduce((sum, row) => sum + row.output, 0)
  const inputVat = vatMonthly.reduce((sum, row) => sum + row.input, 0)

  const printReport = (): void => window.print()

  const exportReport = (): void => {
    let rows: (string | number)[][] = []
    if (tab === 'pnl') {
      rows = [['بخش', 'حساب', 'مبلغ']]
      pnl.revenue.forEach((line) => rows.push(['درآمد', line.name, line.amount]))
      rows.push(['درآمد', 'جمع درآمد', pnl.revenueTotal])
      rows.push(['بهای تمام‌شده', 'بهای تمام‌شده کالای فروش‌رفته', pnl.cogs])
      rows.push(['سود', 'سود ناخالص', pnl.grossProfit])
      pnl.expenses.forEach((line) => rows.push(['هزینه', line.name, line.amount]))
      rows.push(['هزینه', 'جمع هزینه‌ها', pnl.expenseTotal])
      rows.push(['سود', 'سود خالص', pnl.netProfit])
    } else if (tab === 'balance') {
      rows = [['بخش', 'حساب', 'مبلغ']]
      sheet.assets.forEach((line) => rows.push(['دارایی', line.name, line.amount]))
      sheet.liabilities.forEach((line) => rows.push(['بدهی', line.name, line.amount]))
      sheet.equity.forEach((line) => rows.push(['سرمایه', line.name, line.amount]))
      rows.push(['سرمایه', 'سود و زیان دوره', sheet.currentProfit])
    } else if (tab === 'cash') {
      rows = [['ماه', 'ورودی', 'خروجی', 'خالص', 'موجودی پایان']]
      cashflow.forEach((row) =>
        rows.push([row.label, row.inflow, row.outflow, row.net, row.balance])
      )
    } else if (tab === 'aging') {
      rows = [['دوره', 'مطالبات', 'تعداد', 'بدهی‌ها', 'تعداد']]
      agingSales.forEach((bucket, index) =>
        rows.push([
          bucket.label,
          bucket.amount,
          bucket.count,
          agingPurchases[index]?.amount ?? 0,
          agingPurchases[index]?.count ?? 0
        ])
      )
    } else if (tab === 'sales') {
      rows = [['ماه', 'درآمد', 'هزینه و بهای تمام‌شده', 'سود']]
      monthly.forEach((row) => rows.push([row.label, row.revenue, row.cost, row.profit]))
      rows.push([])
      rows.push(['دسته', 'مبلغ'])
      salesByCategory.forEach((row) => rows.push([row.label, row.amount]))
    } else {
      rows = [['ماه', 'مالیات فروش', 'مالیات خرید', 'خالص پرداختنی']]
      vatMonthly.forEach((row) => rows.push([row.label, row.output, row.input, row.net]))
      rows.push(['جمع', outputVat, inputVat, outputVat - inputVat])
    }
    downloadCsv(
      `taraz-report-${tab}-${range.from}-${range.to}.csv`,
      rows
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="گزارش‌ها"
        subtitle="از دفتر دوطرفه تا ترازنامه و جریان نقد؛ عددهایی که پشت هر تصمیم می‌ایستند."
        actions={
          <>
            <Button variant="ghost" icon={Download} onClick={exportReport}>
              خروجی CSV
            </Button>
            <Button variant="soft" icon={Printer} onClick={printReport}>
              چاپ گزارش
            </Button>
          </>
        }
      />

      <Card className="no-print" style={{ padding: '14px 18px' }}>
        <div className="filter-bar">
          <div className="filter-group">
            <span className="tiny muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <CalendarRange size={13} /> دوره گزارش:
            </span>
            {PERIOD_PRESETS.filter((item) => item.key !== 'all').map((item) => (
              <button
                key={item.key}
                className={clsx('chip', preset === item.key && 'active')}
                onClick={() => setPreset(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="tiny muted num">
            {formatJalali(range.from, 'medium')} تا {formatJalali(range.to, 'medium')}
          </span>
        </div>
        <div className="filter-group mt-2" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          {TABS.map((item) => (
            <button
              key={item.key}
              className={clsx('chip', tab === item.key && 'active')}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="print-root" id="report-print">
        <div className="print-only print-report-head">
          <div>
            <b>{data.settings.company.name}</b>
            <span> · {data.settings.company.address}</span>
          </div>
          <div>
            گزارش {TABS.find((item) => item.key === tab)?.label} · {formatJalali(range.from, 'medium')} تا{' '}
            {formatJalali(range.to, 'medium')}
          </div>
        </div>

        {tab === 'balance' ? (
          <div className="grid grid-4">
            <Metric label="جمع دارایی‌ها" value={compact(sheet.totalAssets)} hint="تومان" icon={Landmark} />
            <Metric label="جمع بدهی‌ها" value={compact(sheet.totalLiabilities)} hint="تومان" icon={Wallet} tone="gold" />
            <Metric label="حقوق صاحبان سهام" value={compact(sheet.totalEquity)} hint="تومان" icon={Scale} tone="violet" />
            <Metric
              label="وضعیت تراز"
              value={sheet.balanced ? 'متوازن' : 'مغایرت'}
              hint={sheet.balanced ? 'دارایی = بدهی + سرمایه' : 'نیازمند بررسی'}
              icon={BadgeCheck}
              tone={sheet.balanced ? 'blue' : undefined}
            />
          </div>
        ) : tab === 'aging' ? (
          <div className="grid grid-4">
            <Metric label="مطالبات باز" value={compact(arTotal)} hint="تومان" icon={ArrowDownRight} />
            <Metric label="مطالبات معوق" value={compact(overdueAr)} hint="تومان" icon={Receipt} tone="gold" />
            <Metric label="بدهی باز" value={compact(apTotal)} hint="تومان" icon={ArrowUpRight} tone="violet" />
            <Metric label="بدهی معوق" value={compact(overdueAp)} hint="تومان" icon={Wallet} tone="blue" />
          </div>
        ) : (
          <div className="grid grid-4">
            <Metric
              label="درآمد دوره"
              value={compact(pnl.revenueTotal)}
              hint="تومان · قبل از مالیات"
              icon={ArrowDownRight}
              change={changePercent(pnl.revenueTotal, prevPnl.revenueTotal)}
            />
            <Metric
              label="سود ناخالص"
              value={compact(pnl.grossProfit)}
              hint={`حاشیه ${percent(pnl.revenueTotal ? (pnl.grossProfit / pnl.revenueTotal) * 100 : 0)}`}
              icon={TrendingUp}
              tone="gold"
              change={changePercent(pnl.grossProfit, prevPnl.grossProfit)}
            />
            <Metric
              label="سود خالص"
              value={compact(pnl.netProfit)}
              hint={`حاشیه ${percent(margin)}`}
              icon={BadgeCheck}
              tone="violet"
              change={changePercent(pnl.netProfit, prevPnl.netProfit)}
            />
            <Metric
              label="هزینه‌های دوره"
              value={compact(pnl.cogs + pnl.expenseTotal)}
              hint="بهای تمام‌شده + عملیاتی"
              icon={Wallet}
              tone="blue"
              change={changePercent(pnl.cogs + pnl.expenseTotal, prevPnl.cogs + prevPnl.expenseTotal)}
              invert
            />
          </div>
        )}

        {tab === 'pnl' && (
          <div className="stack mt-2">
            <div className="report-split">
              <Card className="report-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="card-title">صورت سود و زیان</div>
                    <div className="card-sub">
                      {formatJalali(range.from, 'medium')} تا {formatJalali(range.to, 'medium')}
                    </div>
                  </div>
                  <Badge tone={pnl.netProfit >= 0 ? 'success' : 'danger'} dot>
                    {pnl.netProfit >= 0 ? 'سودده' : 'زیان‌ده'}
                  </Badge>
                </div>

                <div className="report-section-title">درآمدها</div>
                {pnl.revenue.map((line) => (
                  <div className="report-row" key={line.code}>
                    <span className="r-name">
                      {line.name}
                      <span className="r-sub">{line.code}</span>
                    </span>
                    <span className="r-amount">{money(line.amount)}</span>
                  </div>
                ))}
                {pnl.revenue.length === 0 ? <div className="tiny muted">درآمدی ثبت نشده است.</div> : null}
                <div className="report-row subtotal">
                  <span className="r-name">جمع درآمد</span>
                  <span className="r-amount">{money(pnl.revenueTotal)}</span>
                </div>

                <div className="report-section-title">بهای تمام‌شده</div>
                <div className="report-row">
                  <span className="r-name">بهای تمام‌شده کالای فروش‌رفته</span>
                  <span className="r-amount">({money(pnl.cogs)})</span>
                </div>
                <div className="report-row subtotal">
                  <span className="r-name">سود ناخالص</span>
                  <span className="r-amount">{money(pnl.grossProfit)}</span>
                </div>

                <div className="report-section-title">هزینه‌های عملیاتی</div>
                {pnl.expenses.map((line) => (
                  <div className="report-row" key={line.code}>
                    <span className="r-name">
                      {line.name}
                      <span className="r-sub">{line.code}</span>
                    </span>
                    <span className="r-amount">({money(line.amount)})</span>
                  </div>
                ))}
                {pnl.expenses.length === 0 ? <div className="tiny muted">هزینه عملیاتی ثبت نشده است.</div> : null}
                <div className="report-row subtotal">
                  <span className="r-name">جمع هزینه‌های عملیاتی</span>
                  <span className="r-amount">({money(pnl.expenseTotal)})</span>
                </div>

                <div className="report-row total">
                  <span className="r-name">سود (زیان) خالص دوره</span>
                  <span className="r-amount" style={{ color: pnl.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {money(pnl.netProfit)}
                  </span>
                </div>

                <div className="report-note">
                  <Scale size={14} />
                  <span>
                    حاشیه سود خالص {percent(margin)} و حاشیه سود ناخالص{' '}
                    {percent(pnl.revenueTotal ? (pnl.grossProfit / pnl.revenueTotal) * 100 : 0)} است.
                    دوره قبل: سود خالص {compact(prevPnl.netProfit)} تومان با حاشیه {percent(prevMargin)}.
                  </span>
                </div>
              </Card>

              <div className="stack">
                <Card className="report-card">
                  <div className="card-title mb-2">تحلیل عمودی</div>
                  <div className="compare-bars">
                    <CompareRow
                      name="درآمد"
                      amount={pnl.revenueTotal}
                      ratio={100}
                      color="accent"
                    />
                    <CompareRow
                      name="بهای تمام‌شده"
                      amount={pnl.cogs}
                      ratio={pnl.revenueTotal ? (pnl.cogs / pnl.revenueTotal) * 100 : 0}
                      color="gold"
                    />
                    <CompareRow
                      name="هزینه عملیاتی"
                      amount={pnl.expenseTotal}
                      ratio={pnl.revenueTotal ? (pnl.expenseTotal / pnl.revenueTotal) * 100 : 0}
                      color="blue"
                    />
                    <CompareRow
                      name="سود خالص"
                      amount={pnl.netProfit}
                      ratio={pnl.revenueTotal ? (pnl.netProfit / pnl.revenueTotal) * 100 : 0}
                      color="accent"
                    />
                  </div>
                  <div className="report-note">
                    <BarChart3 size={14} />
                    <span>هر ستون نسبت به درآمد دوره محاسبه شده است؛ جمع هزینه‌ها و سود برابر درآمد است.</span>
                  </div>
                </Card>

                <Card className="report-card">
                  <div className="card-title mb-2">مقایسه با دوره قبل</div>
                  <div className="compare-bars">
                    <CompareRow
                      name="درآمد"
                      amount={pnl.revenueTotal}
                      ratio={prevPnl.revenueTotal ? Math.min(100, (pnl.revenueTotal / prevPnl.revenueTotal) * 50) : 100}
                      color="accent"
                      suffix={`قبل: ${compact(prevPnl.revenueTotal)}`}
                    />
                    <CompareRow
                      name="سود خالص"
                      amount={pnl.netProfit}
                      ratio={prevPnl.netProfit > 0 ? Math.min(100, (pnl.netProfit / prevPnl.netProfit) * 50) : 100}
                      color="gold"
                      suffix={`قبل: ${compact(prevPnl.netProfit)}`}
                    />
                    <CompareRow
                      name="هزینه‌ها"
                      amount={pnl.cogs + pnl.expenseTotal}
                      ratio={
                        prevPnl.cogs + prevPnl.expenseTotal > 0
                          ? Math.min(100, ((pnl.cogs + pnl.expenseTotal) / (prevPnl.cogs + prevPnl.expenseTotal)) * 50)
                          : 100
                      }
                      color="blue"
                      suffix={`قبل: ${compact(prevPnl.cogs + prevPnl.expenseTotal)}`}
                    />
                  </div>
                </Card>
              </div>
            </div>

            <Card className="report-card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="card-title">روند ماهانه سود</div>
                  <div className="card-sub">درآمد و سود خالص هر ماه در دوره انتخابی</div>
                </div>
                <div className="chart-legend">
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--chart-1)' }} /> درآمد
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--chart-2)' }} /> سود خالص
                  </span>
                </div>
              </div>
              <AreaChart
                labels={monthly.map((item) => item.label)}
                series={[
                  { name: 'درآمد', color: 'var(--chart-1)', values: monthly.map((item) => item.revenue) },
                  { name: 'سود خالص', color: 'var(--chart-2)', values: monthly.map((item) => item.profit) }
                ]}
                height={240}
              />
            </Card>
          </div>
        )}

        {tab === 'balance' && (
          <div className="stack mt-2">
            <div className="grid grid-2">
              <Card className="report-card">
                <div className="card-title mb-2">دارایی‌ها</div>
                {sheet.assets.map((line) => (
                  <div className="report-row" key={line.code}>
                    <span className="r-name">
                      {line.name}
                      <span className="r-sub">{line.code}</span>
                    </span>
                    <span className="r-amount">{money(line.amount)}</span>
                  </div>
                ))}
                <div className="report-row total">
                  <span className="r-name">جمع دارایی‌ها</span>
                  <span className="r-amount">{money(sheet.totalAssets)}</span>
                </div>
              </Card>
              <Card className="report-card">
                <div className="card-title mb-2">بدهی‌ها و حقوق صاحبان سهام</div>
                <div className="report-section-title">بدهی‌ها</div>
                {sheet.liabilities.map((line) => (
                  <div className="report-row" key={line.code}>
                    <span className="r-name">
                      {line.name}
                      <span className="r-sub">{line.code}</span>
                    </span>
                    <span className="r-amount">{money(line.amount)}</span>
                  </div>
                ))}
                <div className="report-row subtotal">
                  <span className="r-name">جمع بدهی‌ها</span>
                  <span className="r-amount">{money(sheet.totalLiabilities)}</span>
                </div>
                <div className="report-section-title">حقوق صاحبان سهام</div>
                {sheet.equity.map((line) => (
                  <div className="report-row" key={line.code}>
                    <span className="r-name">
                      {line.name}
                      <span className="r-sub">{line.code}</span>
                    </span>
                    <span className="r-amount">{money(line.amount)}</span>
                  </div>
                ))}
                <div className="report-row">
                  <span className="r-name">
                    سود و زیان دوره
                    <span className="r-sub">سود انباشته محاسبه‌شده</span>
                  </span>
                  <span className="r-amount">{money(sheet.currentProfit)}</span>
                </div>
                <div className="report-row total">
                  <span className="r-name">جمع بدهی و سرمایه</span>
                  <span className="r-amount">{money(sheet.totalLiabilities + sheet.totalEquity)}</span>
                </div>
              </Card>
            </div>
            <Card className="report-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="card-title">کنترل تراز</div>
                  <div className="card-sub">در تاریخ {formatJalali(range.to, 'medium')}</div>
                </div>
                <Badge tone={sheet.balanced ? 'success' : 'danger'} dot>
                  {sheet.balanced ? 'ترازنامه متوازن است' : 'مغایرت در ترازنامه'}
                </Badge>
              </div>
              <div className="grid grid-3 mt-2">
                <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14 }}>
                  <div className="tiny muted">جمع دارایی</div>
                  <div className="num strong">{money(sheet.totalAssets)}</div>
                </div>
                <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14 }}>
                  <div className="tiny muted">بدهی + سرمایه</div>
                  <div className="num strong">
                    {money(sheet.totalLiabilities + sheet.totalEquity)}
                  </div>
                </div>
                <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14 }}>
                  <div className="tiny muted">اختلاف</div>
                  <div className={clsx('num strong', sheet.balanced ? 'text-success' : 'text-danger')}>
                    {money(Math.abs(sheet.totalAssets - sheet.totalLiabilities - sheet.totalEquity))}
                  </div>
                </div>
              </div>
              <div className="report-note">
                <Landmark size={14} />
                <span>
                  موجودی کالا بر مبنای بهای تمام‌شده و مانده فعلی انبار محاسبه شده و سود دوره به حقوق
                  صاحبان سهام افزوده شده است.
                </span>
              </div>
            </Card>
          </div>
        )}

        {tab === 'cash' && (
          <div className="stack mt-2">
            <Card className="report-card">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div>
                  <div className="card-title">جریان نقدی ماهانه</div>
                  <div className="card-sub">ورود و خروج وجه در صندوق و بانک‌ها</div>
                </div>
                <div className="chart-legend">
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--chart-1)' }} /> ورودی
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: 'var(--chart-5)' }} /> خروجی
                  </span>
                </div>
              </div>
              <GroupedBars
                labels={cashflow.map((row) => row.label)}
                series={[
                  { name: 'ورودی', color: 'var(--chart-1)', values: cashflow.map((row) => row.inflow) },
                  { name: 'خروجی', color: 'var(--chart-5)', values: cashflow.map((row) => row.outflow) }
                ]}
                height={230}
              />
            </Card>
            <div className="grid grid-2">
              <Card className="report-card">
                <div className="card-title mb-2">جدول جریان نقد</div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ماه</th>
                        <th>ورودی</th>
                        <th>خروجی</th>
                        <th>خالص</th>
                        <th>مانده پایان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashflow.map((row) => (
                        <tr key={row.key}>
                          <td className="cell-main">{row.label}</td>
                          <td className="num money-in">{money(row.inflow)}</td>
                          <td className="num money-out">{money(row.outflow)}</td>
                          <td className={clsx('num', row.net >= 0 ? 'money-in' : 'money-out')}>
                            {money(row.net)}
                          </td>
                          <td className="num cell-main">{money(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card className="report-card">
                <div className="card-title mb-2">موجودی خزانه</div>
                <div className="tiny muted mb-2">مانده در پایان دوره</div>
                <div className="num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>
                  {money(cashBalanceAt(docs, range.to))}
                  <span className="tiny muted" style={{ fontWeight: 400, marginInlineStart: 5 }}>
                    تومان
                  </span>
                </div>
                <div className="divider mt-2 mb-2" />
                {data.accounts.map((account) => {
                  const balance = accountBalance(account.id, data)
                  return (
                    <div className="report-row" key={account.id}>
                      <span className="r-name">
                        {account.name}
                        <span className="r-sub">{account.kind === 'cash' ? 'صندوق' : 'بانک'}</span>
                      </span>
                      <span className="r-amount">
                        {money(balance)}
                        <span className="r-sub">مانده فعلی</span>
                      </span>
                    </div>
                  )
                })}
                <div className="report-note">
                  <Wallet size={14} />
                  <span>
                    برای مشاهده گردش هر حساب به بخش «صندوق و بانک» بروید. انتقال بین حساب‌ها اثر خالص
                    ندارد.
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'aging' && (
          <div className="stack mt-2">
            <div className="grid grid-2">
              <Card className="report-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="card-title">سنی مطالبات مشتریان</div>
                    <div className="card-sub">جمع {money(arTotal)} تومان</div>
                  </div>
                  <Badge tone="warning">{fa(overdueSales(data).length)} معوق</Badge>
                </div>
                {agingSales.map((bucket) => (
                  <AgingRow key={bucket.label} bucket={bucket} total={arTotal} />
                ))}
              </Card>
              <Card className="report-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="card-title">سنی بدهی به تأمین‌کنندگان</div>
                    <div className="card-sub">جمع {money(apTotal)} تومان</div>
                  </div>
                  <Badge tone="danger">{fa(overduePurchases(data).length)} معوق</Badge>
                </div>
                {agingPurchases.map((bucket) => (
                  <AgingRow key={bucket.label} bucket={bucket} total={apTotal} tone="gold" />
                ))}
              </Card>
            </div>

            <Card className="report-card">
              <div className="card-title mb-2">فاکتورهای معوق</div>
              {overdueSales(data).length === 0 && overduePurchases(data).length === 0 ? (
                <EmptyState icon={BadgeCheck} title="فاکتور معوقی وجود ندارد" text="همه فاکتورها در سرسید یا تسویه شده‌اند." />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>فاکتور</th>
                        <th>طرف‌حساب</th>
                        <th>نوع</th>
                        <th>سرسید</th>
                        <th>تأخیر</th>
                        <th>مانده</th>
                        <th>وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...overdueSales(data), ...overduePurchases(data)].map((invoice) => {
                        const contact = contactOf(data, invoice.contactId)
                        const days = diffDays(invoice.dueDate, today)
                        return (
                          <tr
                            key={invoice.id}
                            className="clickable"
                            onClick={() => navigate('invoice', { id: invoice.id })}
                          >
                            <td className="num cell-main ltr">{invoiceNoLabel(invoice)}</td>
                            <td>{contact?.name ?? '—'}</td>
                            <td>
                              <Badge tone={invoice.kind === 'sale' ? 'accent' : 'gold'}>
                                {invoice.kind === 'sale' ? 'فروش' : 'خرید'}
                              </Badge>
                            </td>
                            <td className="num">{formatJalali(invoice.dueDate, 'numeric')}</td>
                            <td className="num text-danger">{fa(days)} روز</td>
                            <td className="num cell-main">{money(invoiceRemaining(invoice, data.payments))}</td>
                            <td>
                              <InvoiceStatusBadge invoice={invoice} payments={data.payments} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === 'sales' && (
          <div className="stack mt-2">
            <div className="report-split">
              <Card className="report-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="card-title">روند فروش و سود</div>
                    <div className="card-sub">{fa(salesInvoices.length)} فاکتور در دوره</div>
                  </div>
                </div>
                <AreaChart
                  labels={monthly.map((row) => row.label)}
                  series={[
                    { name: 'درآمد', color: 'var(--chart-1)', values: monthly.map((row) => row.revenue) },
                    { name: 'سود خالص', color: 'var(--chart-2)', values: monthly.map((row) => row.profit) }
                  ]}
                  height={230}
                />
              </Card>
              <Card className="report-card">
                <div className="card-title mb-2">ترکیب فروش بر اساس دسته</div>
                {salesByCategory.length === 0 ? (
                  <EmptyState icon={BarChart3} title="فروشی در این دوره نیست" />
                ) : (
                  <>
                    <Donut
                      items={salesByCategory}
                      centerLabel="فروش دوره"
                      centerValue={compact(pnl.revenueTotal)}
                      size={170}
                      thickness={19}
                    />
                    <div className="donut-legend mt-2">
                      {salesByCategory.map((item) => {
                        const total = salesByCategory.reduce((sum, row) => sum + row.amount, 0)
                        return (
                          <div className="donut-row" key={item.label}>
                            <span className="legend-dot" style={{ background: item.color, width: 8, height: 8 }} />
                            <span className="d-name">{item.label}</span>
                            <span className="d-amount">{compact(item.amount)}</span>
                            <span className="d-pct">
                              {total > 0 ? fa(Math.round((item.amount / total) * 100)) : fa(0)}٪
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <div className="grid grid-2">
              <Card className="report-card">
                <div className="card-title mb-2">پرفروش‌ترین اقلام</div>
                {topProducts.length === 0 ? (
                  <EmptyState icon={BarChart3} title="کالایی فروخته نشده" />
                ) : (
                  topProducts.map((product, index) => {
                    const max = topProducts[0].amount || 1
                    return (
                      <div className="report-row" key={product.title}>
                        <span className="r-name">
                          {index + 1}. {product.title}
                          <span className="r-sub">{fa(product.qty)} عدد فروش</span>
                        </span>
                        <span className="r-amount">
                          {money(product.amount)}
                          <span className="r-sub">{compact(product.amount)} تومان</span>
                        </span>
                      </div>
                    )
                  })
                )}
              </Card>
              <Card className="report-card">
                <div className="card-title mb-2">بهترین مشتریان</div>
                {topCustomers.length === 0 ? (
                  <EmptyState icon={BarChart3} title="مشتری‌ای در دوره نیست" />
                ) : (
                  topCustomers.map((customer) => (
                    <div className="report-row" key={customer.id}>
                      <span className="r-name">
                        {customer.contact?.name ?? 'حذف‌شده'}
                        <span className="r-sub">{customer.contact?.city ?? '—'}</span>
                      </span>
                      <span className="r-amount">{money(customer.amount)}</span>
                    </div>
                  ))
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === 'vat' && (
          <div className="stack mt-2">
            <div className="grid grid-3">
              <Card className="report-card">
                <div className="tiny muted">مالیات فروش (خروجی)</div>
                <div className="num" style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                  {money(outputVat)}
                </div>
                <div className="tiny muted">تومان در دوره</div>
              </Card>
              <Card className="report-card">
                <div className="tiny muted">مالیات خرید (ورودی)</div>
                <div className="num" style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                  {money(inputVat)}
                </div>
                <div className="tiny muted">قابل تهاتر و استرداد</div>
              </Card>
              <Card className="report-card" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }}>
                <div className="tiny" style={{ color: 'var(--accent)' }}>
                  خالص مالیات پرداختنی
                </div>
                <div className="num" style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: 'var(--accent)' }}>
                  {money(Math.max(0, outputVat - inputVat))}
                </div>
                <div className="tiny" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                  {outputVat - inputVat < 0 ? 'اعتبار مالیاتی' : 'تومان قابل پرداخت'}
                </div>
              </Card>
            </div>
            <Card className="report-card">
              <div className="card-title mb-2">مالیات بر ارزش افزوده به تفکیک ماه</div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ماه</th>
                      <th>مالیات فروش</th>
                      <th>مالیات خرید</th>
                      <th>خالص</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vatMonthly.map((row) => (
                      <tr key={row.key}>
                        <td className="cell-main">{row.label}</td>
                        <td className="num">{money(row.output)}</td>
                        <td className="num">{money(row.input)}</td>
                        <td className="num cell-main">{money(row.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="report-note">
                <Receipt size={14} />
                <span>
                  مالیات فروش از فاکتورهای فروش و مالیات خرید از فاکتورهای خرید همان دوره محاسبه شده
                  است. این گزارش جایگزین اظهارنامه رسمی نیست.
                </span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  change,
  invert
}: {
  label: string
  value: string
  hint?: string
  icon: typeof TrendingUp
  tone?: 'gold' | 'violet' | 'blue'
  change?: number | null
  invert?: boolean
}): React.JSX.Element {
  const positive = change !== null && change !== undefined ? (invert ? change < 0 : change >= 0) : null
  return (
    <Card className="kpi hover-lift">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={clsx('kpi-icon', tone)}>
          <Icon size={16} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        {change !== null && change !== undefined ? (
          <span className={clsx('trend', positive ? 'up' : 'down')}>
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {fa(Math.abs(Math.round(change)))}٪
          </span>
        ) : null}
        <span>{hint}</span>
      </div>
    </Card>
  )
}

function CompareRow({
  name,
  amount,
  ratio,
  color,
  suffix
}: {
  name: string
  amount: number
  ratio: number
  color: 'accent' | 'gold' | 'blue'
  suffix?: string
}): React.JSX.Element {
  return (
    <div className="compare-row">
      <span className="c-name">{name}</span>
      <div className="compare-track">
        <div
          className={clsx('compare-fill', color === 'gold' && 'gold')}
          style={{
            width: `${Math.min(100, Math.max(2, ratio))}%`,
            background:
              color === 'blue'
                ? 'linear-gradient(90deg, var(--chart-3), var(--info))'
                : undefined
          }}
        />
      </div>
      <span className="c-val num">
        {compact(amount)}
        {suffix ? <span className="r-sub">{suffix}</span> : null}
      </span>
    </div>
  )
}

function AgingRow({
  bucket,
  total,
  tone
}: {
  bucket: AgingBucket
  total: number
  tone?: 'gold'
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex items-center justify-between mb-1" style={{ fontSize: 11 }}>
        <span className="muted">
          {bucket.label} <span className="tiny">({fa(bucket.count)} فاکتور)</span>
        </span>
        <span className="num strong">{money(bucket.amount)}</span>
      </div>
      <Progress
        value={total > 0 ? (bucket.amount / total) * 100 : 0}
        tone={tone === 'gold' ? 'gold' : 'accent'}
        className="thin"
      />
    </div>
  )
}

function changePercent(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / Math.abs(previous)) * 100
}
