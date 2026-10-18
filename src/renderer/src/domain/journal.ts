import { addDaysIso, compareIso, isBetweenIso, isoToJalali, todayIso } from '../lib/jalali'
import { fa } from '../lib/digits'
import { ACCOUNT_MAP } from './catalogs'
import { contactOf, invoiceTotals } from './calc'
import { fiscalStart } from '../lib/period'
import type { AppData, Invoice } from './types'

export type JournalKind =
  | 'opening'
  | 'sale'
  | 'purchase'
  | 'paymentIn'
  | 'paymentOut'
  | 'expense'
  | 'transfer'
  | 'manual'

export interface JournalLine {
  code: string
  name: string
  description?: string
  debit: number
  credit: number
}

export interface JournalDoc {
  id: string
  no: number
  date: string
  description: string
  kind: JournalKind
  refId?: string
  lines: JournalLine[]
  manual?: boolean
}

export const JOURNAL_KIND_LABELS: Record<JournalKind, string> = {
  opening: 'افتتاحیه',
  sale: 'فروش',
  purchase: 'خرید',
  paymentIn: 'دریافت',
  paymentOut: 'پرداخت',
  expense: 'هزینه',
  transfer: 'انتقال',
  manual: 'سند دستی'
}

export function invoiceNoLabel(invoice: Invoice): string {
  return `${invoice.kind === 'sale' ? 'ف' : 'خ'}-${fa(invoice.no)}`
}

function accountName(code: string): string {
  return ACCOUNT_MAP[code]?.name ?? code
}

function cashCode(accountId: string, data: AppData): string {
  const account = data.accounts.find((item) => item.id === accountId)
  return account?.kind === 'bank' ? '1102' : '1101'
}

function line(code: string, debit: number, credit: number, description?: string): JournalLine {
  return { code, name: accountName(code), debit, credit, description }
}

/** Builds the full double-entry journal from operational data. */
export function buildJournal(data: AppData, today = todayIso()): JournalDoc[] {
  const docs: JournalDoc[] = []
  const fiscal = fiscalStart(data.settings.fiscalYear)

  // ── Opening balances ────────────────────────────────────────────────
  const openingLines: JournalLine[] = []
  const cashOpening = data.accounts
    .filter((account) => account.kind === 'cash')
    .reduce((sum, account) => sum + account.opening, 0)
  const bankOpening = data.accounts
    .filter((account) => account.kind === 'bank')
    .reduce((sum, account) => sum + account.opening, 0)
  const inventoryOpening = data.products.reduce(
    (sum, product) => sum + Math.max(0, product.openingStock) * product.cost,
    0
  )

  if (cashOpening > 0) openingLines.push(line('1101', cashOpening, 0, 'مانده اول دوره صندوق'))
  if (bankOpening > 0) openingLines.push(line('1102', bankOpening, 0, 'مانده اول دوره بانک‌ها'))
  if (inventoryOpening > 0)
    openingLines.push(line('1301', inventoryOpening, 0, 'موجودی اول دوره کالا'))
  const capital = cashOpening + bankOpening + inventoryOpening
  if (capital > 0) openingLines.push(line('3101', 0, capital, 'سرمایه اول دوره'))

  if (openingLines.length > 0) {
    docs.push({
      id: 'opening',
      no: 0,
      date: fiscal,
      description: 'سند افتتاحیه — مانده‌های اول دوره',
      kind: 'opening',
      lines: openingLines
    })
  }

  // ── Sales & purchases ───────────────────────────────────────────────
  for (const invoice of data.invoices) {
    const totals = invoiceTotals(invoice)
    const contact = contactOf(data, invoice.contactId)
    const ref = invoiceNoLabel(invoice)
    const who = contact ? ` — ${contact.name}` : ''
    if (invoice.kind === 'sale') {
      // Services are not carried in inventory, so their estimated cost never
      // touches account 1301. Only stock-tracked lines produce COGS entries,
      // which keeps inventory valuation and the ledger in agreement.
      const inventoryCost = invoice.lines.reduce((sum, item) => {
        const product = data.products.find((entry) => entry.id === item.productId)
        return sum + (product && product.category !== 'خدمات' ? Math.round(item.qty * item.cost) : 0)
      }, 0)
      docs.push({
        id: `sale:${invoice.id}`,
        no: 0,
        date: invoice.date,
        description: `فروش ${ref}${who}`,
        kind: 'sale',
        refId: invoice.id,
        lines: [
          line('1201', totals.total, 0, 'طلب از مشتری'),
          line('4101', 0, totals.taxable, 'درآمد فروش'),
          line('2201', 0, totals.tax, 'مالیات بر ارزش افزوده'),
          ...(inventoryCost > 0
            ? [line('5101', inventoryCost, 0, 'بهای تمام‌شده'), line('1301', 0, inventoryCost, 'خروج کالا')]
            : [])
        ]
      })
    } else {
      // Inventory is carried at the line cost (the same basis the stock card
      // and product margins use). An invoice-level discount is therefore
      // booked separately as purchase discount income so the ledger stays
      // balanced and account 1301 always agrees with inventory valuation.
      const purchaseCost = invoice.lines.reduce((sum, item) => sum + Math.round(item.qty * item.cost), 0)
      const purchaseDiscount = Math.max(0, purchaseCost - totals.taxable)
      docs.push({
        id: `purchase:${invoice.id}`,
        no: 0,
        date: invoice.date,
        description: `خرید ${ref}${who}`,
        kind: 'purchase',
        refId: invoice.id,
        lines: [
          line('1301', purchaseCost, 0, 'ورود کالا'),
          line('1202', totals.tax, 0, 'مالیات ارزش افزوده'),
          ...(purchaseDiscount > 0
            ? [line('5101', 0, purchaseDiscount, 'تخفیف خرید')]
            : []),
          line('2101', 0, totals.total, 'بدهی به تأمین‌کننده')
        ]
      })
    }
  }

  // ── Payments ────────────────────────────────────────────────────────
  for (const payment of data.payments) {
    const invoice = data.invoices.find((item) => item.id === payment.invoiceId)
    const contact = contactOf(data, payment.contactId)
    const ref = invoice ? invoiceNoLabel(invoice) : ''
    const description =
      payment.direction === 'in'
        ? `دریافت از ${contact?.name ?? 'مشتری'} (${ref})`
        : `پرداخت به ${contact?.name ?? 'تأمین‌کننده'} (${ref})`
    const code = cashCode(payment.accountId, data)
    const account = data.accounts.find((item) => item.id === payment.accountId)
    docs.push({
      id: `payment:${payment.id}`,
      no: 0,
      date: payment.date,
      description,
      kind: payment.direction === 'in' ? 'paymentIn' : 'paymentOut',
      refId: payment.invoiceId,
      lines:
        payment.direction === 'in'
          ? [
              line(code, payment.amount, 0, `واریز به ${account?.name ?? 'حساب'}`),
              line('1201', 0, payment.amount, 'تسویه طلب')
            ]
          : [
              line('2101', payment.amount, 0, 'تسویه بدهی'),
              line(code, 0, payment.amount, `برداشت از ${account?.name ?? 'حساب'}`)
            ]
    })
  }

  // ── Expenses ────────────────────────────────────────────────────────
  for (const expense of data.expenses) {
    const category = data.settings ? EXPENSE_CODE(expense.category) : '6199'
    const code = cashCode(expense.accountId, data)
    const account = data.accounts.find((item) => item.id === expense.accountId)
    docs.push({
      id: `expense:${expense.id}`,
      no: 0,
      date: expense.date,
      description: `هزینه ${expense.title}`,
      kind: 'expense',
      refId: expense.id,
      lines: [
        line(category, expense.amount, 0, expense.title),
        line(code, 0, expense.amount, `پرداخت از ${account?.name ?? 'حساب'}`)
      ]
    })
  }

  // ── Transfers ───────────────────────────────────────────────────────
  for (const transfer of data.transfers) {
    const from = data.accounts.find((item) => item.id === transfer.fromId)
    const to = data.accounts.find((item) => item.id === transfer.toId)
    docs.push({
      id: `transfer:${transfer.id}`,
      no: 0,
      date: transfer.date,
      description: `انتقال وجه از ${from?.name ?? '—'} به ${to?.name ?? '—'}`,
      kind: 'transfer',
      refId: transfer.id,
      lines: [
        line(cashCode(transfer.toId, data), transfer.amount, 0, 'واریز'),
        line(cashCode(transfer.fromId, data), 0, transfer.amount, 'برداشت')
      ]
    })
  }

  // ── Manual vouchers ─────────────────────────────────────────────────
  for (const manual of data.manualJournals) {
    docs.push({
      id: `manual:${manual.id}`,
      no: 0,
      date: manual.date,
      description: manual.description,
      kind: 'manual',
      refId: manual.id,
      manual: true,
      lines: manual.lines.map((item) =>
        line(item.code, item.debit, item.credit, item.description)
      )
    })
  }

  docs.sort((a, b) => {
    if (a.kind === 'opening') return -1
    if (b.kind === 'opening') return 1
    const byDate = compareIso(a.date, b.date)
    if (byDate !== 0) return byDate
    return a.id.localeCompare(b.id)
  })

  return docs.map((doc, index) => ({ ...doc, no: index + 1 }))
}

function EXPENSE_CODE(category: string): string {
  const map: Record<string, string> = {
    rent: '6101',
    salary: '6102',
    marketing: '6103',
    shipping: '6104',
    utilities: '6105',
    office: '6106',
    maintenance: '6107',
    tax: '6108',
    depreciation: '6109',
    other: '6199'
  }
  return map[category] ?? '6199'
}

export interface AccountBalance {
  debit: number
  credit: number
}

export function accountBalances(docs: JournalDoc[], until?: string): Map<string, AccountBalance> {
  const balances = new Map<string, AccountBalance>()
  for (const doc of docs) {
    if (until && doc.date > until) continue
    for (const item of doc.lines) {
      const current = balances.get(item.code) ?? { debit: 0, credit: 0 }
      current.debit += item.debit
      current.credit += item.credit
      balances.set(item.code, current)
    }
  }
  return balances
}

export function netBalance(balance: AccountBalance | undefined): number {
  if (!balance) return 0
  return balance.debit - balance.credit
}

export function docDebit(doc: JournalDoc): number {
  return doc.lines.reduce((sum, item) => sum + item.debit, 0)
}

export function docCredit(doc: JournalDoc): number {
  return doc.lines.reduce((sum, item) => sum + item.credit, 0)
}

export function isBalanced(doc: JournalDoc): boolean {
  return Math.abs(docDebit(doc) - docCredit(doc)) < 1
}

export interface PnlLine {
  code: string
  name: string
  amount: number
}

export interface ProfitLossReport {
  revenue: PnlLine[]
  revenueTotal: number
  cogs: number
  grossProfit: number
  expenses: PnlLine[]
  expenseTotal: number
  netProfit: number
  docs: number
}

export function profitLoss(
  docs: JournalDoc[],
  from: string,
  to: string
): ProfitLossReport {
  const balances = new Map<string, number>()
  let docCount = 0
  for (const doc of docs) {
    if (!isBetweenIso(doc.date, from, to)) continue
    docCount += 1
    for (const item of doc.lines) {
      const current = balances.get(item.code) ?? 0
      balances.set(item.code, current + item.debit - item.credit)
    }
  }

  const revenue: PnlLine[] = []
  const expenses: PnlLine[] = []
  let cogs = 0

  for (const [code, balance] of balances) {
    const account = ACCOUNT_MAP[code]
    if (!account) continue
    if (account.type === 'revenue') {
      const amount = -balance
      if (Math.abs(amount) >= 1) revenue.push({ code, name: account.name, amount })
    } else if (account.type === 'expense') {
      const amount = balance
      if (Math.abs(amount) < 1) continue
      if (code === '5101') cogs += amount
      else expenses.push({ code, name: account.name, amount })
    }
  }

  revenue.sort((a, b) => b.amount - a.amount)
  expenses.sort((a, b) => b.amount - a.amount)

  const revenueTotal = revenue.reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0)

  return {
    revenue,
    revenueTotal,
    cogs,
    grossProfit: revenueTotal - cogs,
    expenses,
    expenseTotal,
    netProfit: revenueTotal - cogs - expenseTotal,
    docs: docCount
  }
}

export interface BalanceSheetReport {
  asOf: string
  assets: PnlLine[]
  liabilities: PnlLine[]
  equity: PnlLine[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  currentProfit: number
  balanced: boolean
}

export function balanceSheet(docs: JournalDoc[], asOf: string): BalanceSheetReport {
  const balances = accountBalances(docs, asOf)
  const assets: PnlLine[] = []
  const liabilities: PnlLine[] = []
  const equity: PnlLine[] = []
  let currentProfit = 0

  for (const [code, balance] of balances) {
    const account = ACCOUNT_MAP[code]
    if (!account) continue
    const net = balance.debit - balance.credit
    if (account.type === 'asset') {
      if (Math.abs(net) >= 1) assets.push({ code, name: account.name, amount: net })
    } else if (account.type === 'liability') {
      if (Math.abs(net) >= 1) liabilities.push({ code, name: account.name, amount: -net })
    } else if (account.type === 'equity') {
      if (Math.abs(net) >= 1) equity.push({ code, name: account.name, amount: -net })
    } else if (account.type === 'revenue' || account.type === 'expense') {
      currentProfit -= net
    }
  }

  assets.sort((a, b) => a.code.localeCompare(b.code))
  liabilities.sort((a, b) => a.code.localeCompare(b.code))
  equity.sort((a, b) => a.code.localeCompare(b.code))

  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0)
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0)
  const equityBase = equity.reduce((sum, item) => sum + item.amount, 0)
  const totalEquity = equityBase + currentProfit

  return {
    asOf,
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    currentProfit,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 2
  }
}

export interface TrialRow {
  code: string
  name: string
  debit: number
  credit: number
  balance: number
}

export function trialBalance(docs: JournalDoc[], until?: string): TrialRow[] {
  const balances = accountBalances(docs, until)
  const rows: TrialRow[] = []
  for (const [code, balance] of balances) {
    if (Math.abs(balance.debit) < 1 && Math.abs(balance.credit) < 1) continue
    rows.push({
      code,
      name: accountName(code),
      debit: balance.debit,
      credit: balance.credit,
      balance: balance.debit - balance.credit
    })
  }
  return rows.sort((a, b) => a.code.localeCompare(b.code))
}

export interface AgingBucket {
  label: string
  min: number
  max: number
  amount: number
  count: number
}

export function agingBuckets(
  data: AppData,
  kind: 'sale' | 'purchase',
  today = todayIso()
): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { label: 'جاری و آینده', min: -99999, max: 0, amount: 0, count: 0 },
    { label: '۱ تا ۳۰ روز', min: 1, max: 30, amount: 0, count: 0 },
    { label: '۳۱ تا ۶۰ روز', min: 31, max: 60, amount: 0, count: 0 },
    { label: 'بیش از ۶۰ روز', min: 61, max: 99999, amount: 0, count: 0 }
  ]

  for (const invoice of data.invoices) {
    if (invoice.kind !== kind) continue
    const totals = invoiceTotals(invoice)
    const paid = data.payments
      .filter((payment) => payment.invoiceId === invoice.id)
      .reduce((sum, payment) => sum + payment.amount, 0)
    const remaining = Math.max(0, totals.total - paid)
    if (remaining <= 0) continue
    const [y, m, d] = invoice.dueDate.split('-').map(Number)
    const [ty, tm, td] = today.split('-').map(Number)
    const due = Date.UTC(y, m - 1, d)
    const now = Date.UTC(ty, tm - 1, td)
    const late = Math.floor((now - due) / 86400000)
    const bucket = buckets.find((item) => late >= item.min && late <= item.max) ?? buckets[3]
    bucket.amount += remaining
    bucket.count += 1
  }

  return buckets
}

export function cashBalanceAt(docs: JournalDoc[], at: string): number {
  const balances = accountBalances(docs, at)
  return netBalance(balances.get('1101')) + netBalance(balances.get('1102'))
}

export function monthCashflow(
  docs: JournalDoc[],
  dims: { key: string; from: string; to: string; label: string }[]
): { key: string; label: string; inflow: number; outflow: number; net: number; balance: number }[] {
  let running = 0
  return dims.map((dim) => {
    const before = cashBalanceAt(docs, addDaysIso(dim.from, -1))
    running = before
    let inflow = 0
    let outflow = 0
    for (const doc of docs) {
      if (!isBetweenIso(doc.date, dim.from, dim.to)) continue
      if (doc.kind === 'transfer') continue
      for (const item of doc.lines) {
        if (item.code !== '1101' && item.code !== '1102') continue
        if (item.debit > item.credit) inflow += item.debit - item.credit
        else outflow += item.credit - item.debit
      }
    }
    running = before + inflow - outflow
    return { key: dim.key, label: dim.label, inflow, outflow, net: inflow - outflow, balance: running }
  })
}

export function jalaliMonthLabel(iso: string): string {
  return String(isoToJalali(iso).jm)
}
