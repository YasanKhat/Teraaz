import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayIso } from '../lib/jalali'
import type {
  AppData,
  CashAccount,
  Contact,
  ExpenseDraft,
  Invoice,
  InvoiceDraft,
  ManualJournalDraft,
  PaymentDraft,
  Product,
  Settings,
  Transfer
} from '../domain/types'
import { createEmptyData, createSeedData } from './seed'

const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export interface ActionResult {
  ok: boolean
  error?: string
}

interface AppStore extends AppData {
  addInvoice: (draft: InvoiceDraft) => Invoice
  deleteInvoice: (id: string) => void
  addPayment: (draft: PaymentDraft) => void
  deletePayment: (id: string) => void
  addExpense: (draft: ExpenseDraft) => void
  updateExpense: (id: string, patch: Partial<ExpenseDraft>) => void
  deleteExpense: (id: string) => void
  saveContact: (contact: Omit<Contact, 'createdAt' | 'id'> & { id?: string }) => void
  deleteContact: (id: string) => ActionResult
  saveProduct: (product: Omit<Product, 'createdAt' | 'id'> & { id?: string }) => void
  deleteProduct: (id: string) => ActionResult
  saveAccount: (account: Omit<CashAccount, 'createdAt' | 'id'> & { id?: string }) => void
  deleteAccount: (id: string) => ActionResult
  addTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt'>) => ActionResult
  addManualJournal: (draft: ManualJournalDraft) => ActionResult
  deleteManualJournal: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  updateCompany: (patch: Partial<Settings['company']>) => void
  resetDemo: () => void
  clearAll: () => void
  importData: (data: AppData) => ActionResult
}

function nextInvoiceNo(invoices: Invoice[], kind: Invoice['kind']): number {
  const numbers = invoices.filter((invoice) => invoice.kind === kind).map((invoice) => invoice.no)
  return numbers.length ? Math.max(...numbers) + 1 : 1001
}

function nextExpenseNo(expenses: { no: number }[]): number {
  return expenses.length ? Math.max(...expenses.map((expense) => expense.no)) + 1 : 5001
}

const seed = createSeedData()

export const useApp = create<AppStore>()(
  persist(
    (set, get) => ({
      ...seed,

      addInvoice: (draft) => {
        const invoice: Invoice = {
          ...draft,
          id: uid('inv'),
          no: nextInvoiceNo(get().invoices, draft.kind),
          createdAt: new Date().toISOString()
        }
        set((state) => ({ invoices: [...state.invoices, invoice] }))
        return invoice
      },

      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
          payments: state.payments.filter((payment) => payment.invoiceId !== id)
        })),

      addPayment: (draft) =>
        set((state) => ({
          payments: [
            ...state.payments,
            { ...draft, id: uid('pay'), createdAt: new Date().toISOString() }
          ]
        })),

      deletePayment: (id) =>
        set((state) => ({ payments: state.payments.filter((payment) => payment.id !== id) })),

      addExpense: (draft) =>
        set((state) => ({
          expenses: [
            ...state.expenses,
            {
              ...draft,
              id: uid('exp'),
              no: nextExpenseNo(state.expenses),
              createdAt: new Date().toISOString()
            }
          ]
        })),

      updateExpense: (id, patch) =>
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...patch } : expense
          )
        })),

      deleteExpense: (id) =>
        set((state) => ({ expenses: state.expenses.filter((expense) => expense.id !== id) })),

      saveContact: (contact) => {
        if (contact.id) {
          const id = contact.id
          set((state) => ({
            contacts: state.contacts.map((item) =>
              item.id === id ? { ...item, ...contact, id } : item
            )
          }))
        } else {
          const newContact: Contact = {
            ...contact,
            id: uid('ct'),
            createdAt: todayIso()
          }
          set((state) => ({ contacts: [...state.contacts, newContact] }))
        }
      },

      deleteContact: (id) => {
        const used = get().invoices.some((invoice) => invoice.contactId === id)
        if (used) {
          return { ok: false, error: 'این طرف‌حساب در فاکتورها استفاده شده و حذف‌شدنی نیست.' }
        }
        set((state) => ({ contacts: state.contacts.filter((contact) => contact.id !== id) }))
        return { ok: true }
      },

      saveProduct: (product) => {
        if (product.id) {
          const id = product.id
          set((state) => ({
            products: state.products.map((item) =>
              item.id === id ? { ...item, ...product, id } : item
            )
          }))
        } else {
          const newProduct: Product = {
            ...product,
            id: uid('pr'),
            createdAt: todayIso()
          }
          set((state) => ({ products: [...state.products, newProduct] }))
        }
      },

      deleteProduct: (id) => {
        const used = get().invoices.some((invoice) =>
          invoice.lines.some((line) => line.productId === id)
        )
        if (used) {
          return { ok: false, error: 'این کالا در فاکتورها استفاده شده و حذف‌شدنی نیست.' }
        }
        set((state) => ({ products: state.products.filter((product) => product.id !== id) }))
        return { ok: true }
      },

      saveAccount: (account) => {
        if (account.id) {
          const id = account.id
          set((state) => ({
            accounts: state.accounts.map((item) =>
              item.id === id ? { ...item, ...account, id } : item
            )
          }))
        } else {
          const newAccount: CashAccount = {
            ...account,
            id: uid('acc'),
            createdAt: todayIso()
          }
          set((state) => ({ accounts: [...state.accounts, newAccount] }))
        }
      },

      deleteAccount: (id) => {
        const state = get()
        if (state.accounts.length <= 1) {
          return { ok: false, error: 'حداقل یک حساب باید باقی بماند.' }
        }
        const used =
          state.payments.some((payment) => payment.accountId === id) ||
          state.expenses.some((expense) => expense.accountId === id) ||
          state.transfers.some((transfer) => transfer.fromId === id || transfer.toId === id)
        if (used) {
          return { ok: false, error: 'برای این حساب گردش مالی ثبت شده و قابل حذف نیست.' }
        }
        set((current) => ({ accounts: current.accounts.filter((account) => account.id !== id) }))
        return { ok: true }
      },

      addTransfer: (transfer) => {
        if (transfer.fromId === transfer.toId) {
          return { ok: false, error: 'حساب مبدأ و مقصد باید متفاوت باشند.' }
        }
        if (transfer.amount <= 0) {
          return { ok: false, error: 'مبلغ انتقال باید بیشتر از صفر باشد.' }
        }
        set((state) => ({
          transfers: [
            ...state.transfers,
            { ...transfer, id: uid('tr'), createdAt: new Date().toISOString() }
          ]
        }))
        return { ok: true }
      },

      addManualJournal: (draft) => {
        const lines = draft.lines.filter((line) => line.debit > 0 || line.credit > 0)
        if (lines.length < 2) {
          return { ok: false, error: 'سند باید حداقل دو ردیف داشته باشد.' }
        }
        const debit = lines.reduce((sum, line) => sum + line.debit, 0)
        const credit = lines.reduce((sum, line) => sum + line.credit, 0)
        if (Math.abs(debit - credit) > 1) {
          return { ok: false, error: 'جمع بدهکار و بستانکار سند برابر نیست.' }
        }
        set((state) => ({
          manualJournals: [
            ...state.manualJournals,
            { ...draft, lines, id: uid('mj'), createdAt: new Date().toISOString() }
          ]
        }))
        return { ok: true }
      },

      deleteManualJournal: (id) =>
        set((state) => ({
          manualJournals: state.manualJournals.filter((journal) => journal.id !== id)
        })),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      updateCompany: (patch) =>
        set((state) => ({
          settings: { ...state.settings, company: { ...state.settings.company, ...patch } }
        })),

      resetDemo: () => set({ ...createSeedData() }),

      clearAll: () => set({ ...createEmptyData() }),

      importData: (data) => {
        if (
          !data ||
          !Array.isArray(data.invoices) ||
          !Array.isArray(data.contacts) ||
          !Array.isArray(data.products) ||
          !Array.isArray(data.accounts) ||
          !data.settings
        ) {
          return { ok: false, error: 'ساختار فایل پشتیبان معتبر نیست.' }
        }
        set({
          version: 1,
          settings: { ...seed.settings, ...data.settings },
          accounts: data.accounts,
          contacts: data.contacts,
          products: data.products,
          invoices: data.invoices,
          payments: Array.isArray(data.payments) ? data.payments : [],
          expenses: Array.isArray(data.expenses) ? data.expenses : [],
          transfers: Array.isArray(data.transfers) ? data.transfers : [],
          manualJournals: Array.isArray(data.manualJournals) ? data.manualJournals : []
        })
        return { ok: true }
      }
    }),
    {
      name: 'taraz-ledger-v1',
      version: 1,
      partialize: (state) => ({
        version: state.version,
        settings: state.settings,
        accounts: state.accounts,
        contacts: state.contacts,
        products: state.products,
        invoices: state.invoices,
        payments: state.payments,
        expenses: state.expenses,
        transfers: state.transfers,
        manualJournals: state.manualJournals
      })
    }
  )
)
