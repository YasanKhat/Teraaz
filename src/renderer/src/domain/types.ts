export type Theme = 'light' | 'dark'

export interface CompanyProfile {
  name: string
  owner: string
  phone: string
  email: string
  address: string
  taxId: string
}

export interface Settings {
  theme: Theme
  persianDigits: boolean
  fiscalYear: number
  currency: string
  vatRate: number
  company: CompanyProfile
}

export interface CashAccount {
  id: string
  name: string
  kind: 'cash' | 'bank'
  bank?: string
  card?: string
  iban?: string
  opening: number
  color: string
  createdAt: string
}

export type ContactKind = 'customer' | 'supplier'

export interface Contact {
  id: string
  name: string
  kind: ContactKind
  company?: string
  phone: string
  email?: string
  city?: string
  address?: string
  note?: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  code: string
  category: string
  unit: string
  price: number
  cost: number
  openingStock: number
  minStock: number
  createdAt: string
}

export interface InvoiceLine {
  id: string
  productId: string | null
  title: string
  qty: number
  price: number
  discountPct: number
  cost: number
}

export type InvoiceKind = 'sale' | 'purchase'

export interface Invoice {
  id: string
  no: number
  kind: InvoiceKind
  contactId: string
  date: string
  dueDate: string
  lines: InvoiceLine[]
  discount: number
  taxRate: number
  note?: string
  createdAt: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'cheque'

export interface Payment {
  id: string
  invoiceId: string
  contactId: string
  direction: 'in' | 'out'
  date: string
  amount: number
  accountId: string
  method: PaymentMethod
  note?: string
  createdAt: string
}

export interface Expense {
  id: string
  no: number
  date: string
  title: string
  category: string
  amount: number
  accountId: string
  vendor?: string
  note?: string
  createdAt: string
}

export interface Transfer {
  id: string
  date: string
  fromId: string
  toId: string
  amount: number
  note?: string
  createdAt: string
}

export interface ManualJournalLine {
  id: string
  code: string
  description?: string
  debit: number
  credit: number
}

export interface ManualJournal {
  id: string
  date: string
  description: string
  lines: ManualJournalLine[]
  createdAt: string
}

export interface AppData {
  version: number
  settings: Settings
  accounts: CashAccount[]
  contacts: Contact[]
  products: Product[]
  invoices: Invoice[]
  payments: Payment[]
  expenses: Expense[]
  transfers: Transfer[]
  manualJournals: ManualJournal[]
}

export type InvoiceDraft = Omit<Invoice, 'id' | 'no' | 'createdAt'>
export type ExpenseDraft = Omit<Expense, 'id' | 'no' | 'createdAt'>
export type PaymentDraft = Omit<Payment, 'id' | 'createdAt'>
export type ManualJournalDraft = Omit<ManualJournal, 'id' | 'createdAt'>
