import { compareIso, todayIso } from '../lib/jalali'
import type {
  AppData,
  CashAccount,
  Contact,
  Invoice,
  InvoiceLine,
  Payment,
  Product
} from './types'

export type InvoiceStatusKey = 'paid' | 'partial' | 'overdue' | 'open'

export interface InvoiceTotals {
  subtotal: number
  discount: number
  taxable: number
  tax: number
  total: number
  cost: number
}

export function lineGross(line: InvoiceLine): number {
  return Math.round(line.qty * line.price)
}

export function lineNet(line: InvoiceLine): number {
  return Math.round(line.qty * line.price * (1 - (line.discountPct || 0) / 100))
}

export function invoiceTotals(invoice: Invoice): InvoiceTotals {
  const subtotal = invoice.lines.reduce((sum, line) => sum + lineNet(line), 0)
  const discount = Math.min(Math.max(0, invoice.discount || 0), subtotal)
  const taxable = subtotal - discount
  const tax = Math.round((taxable * (invoice.taxRate || 0)) / 100)
  const cost = invoice.lines.reduce((sum, line) => sum + Math.round(line.qty * line.cost), 0)
  return { subtotal, discount, taxable, tax, total: taxable + tax, cost }
}

export function paidForInvoice(invoiceId: string, payments: Payment[]): number {
  return payments
    .filter((payment) => payment.invoiceId === invoiceId)
    .reduce((sum, payment) => sum + payment.amount, 0)
}

export function invoiceRemaining(invoice: Invoice, payments: Payment[]): number {
  return Math.max(0, invoiceTotals(invoice).total - paidForInvoice(invoice.id, payments))
}

export function invoiceStatus(
  invoice: Invoice,
  payments: Payment[],
  today = todayIso()
): InvoiceStatusKey {
  const remaining = invoiceRemaining(invoice, payments)
  if (remaining <= 0) return 'paid'
  if (invoice.dueDate < today) return 'overdue'
  if (paidForInvoice(invoice.id, payments) > 0) return 'partial'
  return 'open'
}

export const STATUS_META: Record<
  InvoiceStatusKey,
  { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  paid: { label: 'پرداخت‌شده', tone: 'success' },
  partial: { label: 'پرداخت جزئی', tone: 'warning' },
  overdue: { label: 'سرسید گذشته', tone: 'danger' },
  open: { label: 'در انتظار پرداخت', tone: 'neutral' }
}

export function currentStock(product: Product, data: Pick<AppData, 'invoices'>): number {
  if (product.category === 'خدمات') return 0
  let stock = product.openingStock
  for (const invoice of data.invoices) {
    for (const line of invoice.lines) {
      if (line.productId !== product.id) continue
      stock += invoice.kind === 'purchase' ? line.qty : -line.qty
    }
  }
  return stock
}

export type StockState = 'ok' | 'low' | 'out'

export function stockState(product: Product, data: Pick<AppData, 'invoices'>): StockState {
  if (product.category === 'خدمات') return 'ok'
  const stock = currentStock(product, data)
  if (stock <= 0) return 'out'
  if (product.minStock > 0 && stock <= product.minStock) return 'low'
  return 'ok'
}

export function inventoryValue(data: Pick<AppData, 'products' | 'invoices'>): number {
  return data.products.reduce(
    (sum, product) => sum + Math.max(0, currentStock(product, data)) * product.cost,
    0
  )
}

export function findByInvoice(data: AppData, invoiceId: string): Invoice | undefined {
  return data.invoices.find((invoice) => invoice.id === invoiceId)
}

export function contactOf(data: AppData, contactId: string): Contact | undefined {
  return data.contacts.find((contact) => contact.id === contactId)
}

export function contactBalance(contactId: string, data: AppData): number {
  let balance = 0
  for (const invoice of data.invoices) {
    if (invoice.contactId !== contactId) continue
    const remaining = invoiceRemaining(invoice, data.payments)
    balance += invoice.kind === 'sale' ? remaining : -remaining
  }
  return balance
}

export function contactSales(contactId: string, data: AppData): number {
  return data.invoices
    .filter((invoice) => invoice.contactId === contactId && invoice.kind === 'sale')
    .reduce((sum, invoice) => sum + invoiceTotals(invoice).total, 0)
}

export function contactInvoiceCount(contactId: string, data: AppData): number {
  return data.invoices.filter((invoice) => invoice.contactId === contactId).length
}

export interface AccountMovement {
  id: string
  date: string
  title: string
  subtitle?: string
  direction: 'in' | 'out'
  amount: number
  source: 'payment' | 'expense' | 'transfer'
  refId?: string
}

export function accountMovements(accountId: string, data: AppData): AccountMovement[] {
  const movements: AccountMovement[] = []

  for (const payment of data.payments) {
    if (payment.accountId !== accountId) continue
    const invoice = findByInvoice(data, payment.invoiceId)
    const contact = invoice ? contactOf(data, invoice.contactId) : undefined
    movements.push({
      id: payment.id,
      date: payment.date,
      title: payment.direction === 'in' ? 'دریافت وجه' : 'پرداخت وجه',
      subtitle: contact?.name ?? 'طرف‌حساب',
      direction: payment.direction,
      amount: payment.amount,
      source: 'payment',
      refId: payment.invoiceId
    })
  }

  for (const expense of data.expenses) {
    if (expense.accountId !== accountId) continue
    movements.push({
      id: expense.id,
      date: expense.date,
      title: expense.title,
      subtitle: 'هزینه',
      direction: 'out',
      amount: expense.amount,
      source: 'expense'
    })
  }

  for (const transfer of data.transfers) {
    if (transfer.fromId === accountId) {
      movements.push({
        id: transfer.id,
        date: transfer.date,
        title: 'انتقال وجه',
        subtitle: 'به ' + (data.accounts.find((a) => a.id === transfer.toId)?.name ?? 'حساب دیگر'),
        direction: 'out',
        amount: transfer.amount,
        source: 'transfer'
      })
    }
    if (transfer.toId === accountId) {
      movements.push({
        id: transfer.id,
        date: transfer.date,
        title: 'انتقال وجه',
        subtitle: 'از ' + (data.accounts.find((a) => a.id === transfer.fromId)?.name ?? 'حساب دیگر'),
        direction: 'in',
        amount: transfer.amount,
        source: 'transfer'
      })
    }
  }

  return movements.sort((a, b) => compareIso(a.date, b.date))
}

export function accountBalance(accountId: string, data: AppData): number {
  const account = data.accounts.find((item) => item.id === accountId)
  if (!account) return 0
  return accountMovements(accountId, data).reduce(
    (sum, movement) => sum + (movement.direction === 'in' ? movement.amount : -movement.amount),
    account.opening
  )
}

export function totalLiquidity(data: AppData): number {
  return data.accounts.reduce((sum, account) => sum + accountBalance(account.id, data), 0)
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function expenseTotal(data: AppData, from?: string, to?: string): number {
  return data.expenses
    .filter((expense) => (!from || expense.date >= from) && (!to || expense.date <= to))
    .reduce((sum, expense) => sum + expense.amount, 0)
}

export function salesTotal(data: AppData, from?: string, to?: string): number {
  return data.invoices
    .filter(
      (invoice) =>
        invoice.kind === 'sale' &&
        (!from || invoice.date >= from) &&
        (!to || invoice.date <= to)
    )
    .reduce((sum, invoice) => sum + invoiceTotals(invoice).total, 0)
}

export function purchasesTotal(data: AppData, from?: string, to?: string): number {
  return data.invoices
    .filter(
      (invoice) =>
        invoice.kind === 'purchase' &&
        (!from || invoice.date >= from) &&
        (!to || invoice.date <= to)
    )
    .reduce((sum, invoice) => sum + invoiceTotals(invoice).total, 0)
}

export function grossProfit(data: AppData, from?: string, to?: string): number {
  return data.invoices
    .filter(
      (invoice) =>
        invoice.kind === 'sale' &&
        (!from || invoice.date >= from) &&
        (!to || invoice.date <= to)
    )
    .reduce((sum, invoice) => {
      const totals = invoiceTotals(invoice)
      return sum + (totals.total - totals.tax - totals.cost)
    }, 0)
}

export function receivableTotal(data: AppData): number {
  return data.invoices
    .filter((invoice) => invoice.kind === 'sale')
    .reduce((sum, invoice) => sum + invoiceRemaining(invoice, data.payments), 0)
}

export function payableTotal(data: AppData): number {
  return data.invoices
    .filter((invoice) => invoice.kind === 'purchase')
    .reduce((sum, invoice) => sum + invoiceRemaining(invoice, data.payments), 0)
}

export function overdueSales(data: AppData, today = todayIso()): Invoice[] {
  return data.invoices
    .filter(
      (invoice) =>
        invoice.kind === 'sale' &&
        invoice.dueDate < today &&
        invoiceRemaining(invoice, data.payments) > 0
    )
    .sort((a, b) => compareIso(a.dueDate, b.dueDate))
}

export function overduePurchases(data: AppData, today = todayIso()): Invoice[] {
  return data.invoices
    .filter(
      (invoice) =>
        invoice.kind === 'purchase' &&
        invoice.dueDate < today &&
        invoiceRemaining(invoice, data.payments) > 0
    )
    .sort((a, b) => compareIso(a.dueDate, b.dueDate))
}

export function lowStockProducts(data: AppData): Product[] {
  return data.products.filter((product) => {
    if (product.category === 'خدمات') return false
    const state = stockState(product, data)
    return state === 'low' || state === 'out'
  })
}

export function accountLabel(account: CashAccount): string {
  return account.bank ? `${account.name} · ${account.bank}` : account.name
}

export function maskCard(card?: string): string {
  if (!card) return '—'
  const clean = card.replace(/\D/g, '')
  if (clean.length < 8) return card
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`
}

export function todayLabel(): string {
  return todayIso()
}
