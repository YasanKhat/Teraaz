/*
 * Deterministic demo dataset for «گالری آریانا» — a Persian rug & handicraft
 * gallery. Seven months of realistic operating history: sales, purchases,
 * payments, expenses and treasury transfers.
 */

import { addDaysIso, isoToJalali, jalaliMonthLength, jalaliToIso, todayIso } from '../lib/jalali'
import { invoiceTotals } from '../domain/calc'
import type {
  AppData,
  CashAccount,
  Contact,
  Expense,
  Invoice,
  InvoiceLine,
  Payment,
  Product,
  Settings,
  Transfer
} from '../domain/types'

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(1405_1017)
const int = (min: number, max: number): number => Math.floor(rand() * (max - min + 1)) + min
const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)]

function at(iso: string, hour = 10): string {
  return `${iso}T${String(hour).padStart(2, '0')}:00:00`
}

const COMPANY = {
  name: 'گالری آریانا',
  owner: 'آریا کیانی',
  phone: '۰۲۱-۸۸۴۵۶۷۸۹',
  email: 'hello@aryana-gallery.ir',
  address: 'تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲۴',
  taxId: '۴۱۱۳۸۷۶۵۲'
}

const CUSTOMER_NAMES = [
  ['گالری نگار', 'نگار حسینی', 'تهران'],
  ['دکوراسیون مانا', 'مانا رضایی', 'تهران'],
  ['سارا محمدی', 'سارا محمدی', 'اصفهان'],
  ['امیر رستگار', 'امیر رستگار', 'شیراز'],
  ['خانه فرش پرشیا', 'کاوه پارسا', 'تهران'],
  ['استودیو هفت', 'هستی نوری', 'کرج'],
  ['مریم احمدی', 'مریم احمدی', 'مشهد'],
  ['هتل سنتی ارگ', 'پیمان صادقی', 'یزد'],
  ['نیلوفر کاظمی', 'نیلوفر کاظمی', 'تهران'],
  ['شرکت طراحی آرک', 'رضا مهرابی', 'تهران'],
  ['خانه هنر اصفهان', 'لیلا صفوی', 'اصفهان'],
  ['بوتیک ماه', 'نازنین قاسمی', 'رشت']
]

const SUPPLIER_NAMES = [
  ['کارگاه فرش تبریز', 'حسین یعقوبی', 'تبریز'],
  ['بافندگان نایین', 'محمد علوی', 'نایین'],
  ['گلیم شیراز', 'زهرا قشقایی', 'شیراز'],
  ['صنایع دستی اصفهان', 'علی خاتمی', 'اصفهان'],
  ['بسته‌بندی نقش', 'سعید کریمی', 'تهران'],
  ['باربری آریا', 'مجید رحیمی', 'تهران']
]

interface ProductSeed {
  name: string
  code: string
  category: string
  unit: string
  price: number
  cost: number
  opening: number
  min: number
  weight: number
}

const PRODUCT_SEEDS: ProductSeed[] = [
  { name: 'فرش دستباف تبریز ۶ متری', code: 'FR-601', category: 'فرش', unit: 'تخته', price: 148_000_000, cost: 94_000_000, opening: 6, min: 2, weight: 5 },
  { name: 'فرش کاشان ۹ متری', code: 'FR-901', category: 'فرش', unit: 'تخته', price: 235_000_000, cost: 156_000_000, opening: 4, min: 6, weight: 4 },
  { name: 'فرش نایین ۳ متری', code: 'FR-301', category: 'فرش', unit: 'تخته', price: 96_000_000, cost: 59_000_000, opening: 8, min: 2, weight: 5 },
  { name: 'گلیم قشقایی ۲×۳', code: 'GL-203', category: 'گلیم', unit: 'تخته', price: 34_500_000, cost: 20_500_000, opening: 18, min: 4, weight: 4 },
  { name: 'تابلو ترمه گل و مرغ', code: 'TB-101', category: 'تابلو', unit: 'عدد', price: 18_900_000, cost: 11_000_000, opening: 20, min: 5, weight: 3 },
  { name: 'سرویس سماور و استکان', code: 'SM-402', category: 'صنایع دستی', unit: 'سرویس', price: 12_400_000, cost: 7_400_000, opening: 15, min: 4, weight: 3 },
  { name: 'گلدان میناکاری', code: 'MK-115', category: 'صنایع دستی', unit: 'عدد', price: 8_600_000, cost: 4_900_000, opening: 24, min: 6, weight: 2 },
  { name: 'جعبه خاتم‌کاری', code: 'KH-701', category: 'صنایع دستی', unit: 'عدد', price: 22_000_000, cost: 13_000_000, opening: 10, min: 3, weight: 2 },
  { name: 'شال ترمه ابریشم', code: 'SH-910', category: 'اکسسوری', unit: 'عدد', price: 5_800_000, cost: 3_200_000, opening: 30, min: 22, weight: 2 },
  { name: 'تابلو خط نستعلیق', code: 'KL-505', category: 'تابلو', unit: 'عدد', price: 14_500_000, cost: 8_500_000, opening: 14, min: 4, weight: 3 },
  { name: 'رومیزی گلیم', code: 'RM-808', category: 'گلیم', unit: 'عدد', price: 4_200_000, cost: 2_300_000, opening: 40, min: 30, weight: 2 },
  { name: 'خدمات رفوگری و شست‌وشو', code: 'SRV-001', category: 'خدمات', unit: 'سرویس', price: 6_500_000, cost: 2_600_000, opening: 0, min: 0, weight: 1 },
  { name: 'بسته‌بندی و ارسال ویژه', code: 'PKG-001', category: 'بسته‌بندی', unit: 'عدد', price: 950_000, cost: 320_000, opening: 500, min: 50, weight: 1 }
]

export function createSeedData(): AppData {
  const today = todayIso()
  const { jy, jm: currentMonth, jd: currentDay } = isoToJalali(today)

  const settings: Settings = {
    theme: 'light',
    persianDigits: true,
    fiscalYear: jy,
    currency: 'تومان',
    vatRate: 10,
    company: { ...COMPANY }
  }

  const accounts: CashAccount[] = [
    {
      id: 'acc-cash',
      name: 'صندوق فروشگاه',
      kind: 'cash',
      opening: 120_000_000,
      color: 'emerald',
      createdAt: at(jalaliToIso(jy, 1, 1), 9)
    },
    {
      id: 'acc-mellat',
      name: 'بانک ملت',
      kind: 'bank',
      bank: 'ملت',
      card: '6104337812459087',
      iban: 'IR120120000000001234567890',
      opening: 1_850_000_000,
      color: 'blue',
      createdAt: at(jalaliToIso(jy, 1, 1), 9)
    },
    {
      id: 'acc-saman',
      name: 'بانک سامان',
      kind: 'bank',
      bank: 'سامان',
      card: '6219861012345678',
      iban: 'IR980560000000009876543210',
      opening: 480_000_000,
      color: 'gold',
      createdAt: at(jalaliToIso(jy, 1, 1), 9)
    }
  ]

  const contacts: Contact[] = []
  CUSTOMER_NAMES.forEach(([name, owner, city], index) => {
    contacts.push({
      id: `ct-c${index + 1}`,
      name,
      kind: 'customer',
      company: name === owner ? undefined : name,
      phone: `0912${String(3400000 + index * 7341).slice(0, 7)}`,
      email: `customer${index + 1}@example.ir`,
      city,
      address: `${city}، خیابان اصلی، پلاک ${10 + index * 7}`,
      note: index === 0 ? 'مشتری وفادار — تسویه معمولاً تا ۲۰ روز' : undefined,
      createdAt: at(jalaliToIso(jy, 1, 1), 9)
    })
  })
  SUPPLIER_NAMES.forEach(([name, owner, city], index) => {
    contacts.push({
      id: `ct-s${index + 1}`,
      name,
      kind: 'supplier',
      company: name,
      phone: `0912${String(7100000 + index * 5321).slice(0, 7)}`,
      email: `supplier${index + 1}@example.ir`,
      city,
      address: `${city}، بازار هنر، پلاک ${22 + index * 5}`,
      createdAt: at(jalaliToIso(jy, 1, 1), 9)
    })
  })

  const products: Product[] = PRODUCT_SEEDS.map((item, index) => ({
    id: `pr-${index + 1}`,
    name: item.name,
    code: item.code,
    category: item.category,
    unit: item.unit,
    price: item.price,
    cost: item.cost,
    openingStock: item.opening,
    minStock: item.min,
    createdAt: at(jalaliToIso(jy, 1, 1), 9)
  }))

  const stock = new Map<string, number>()
  products.forEach((product) => stock.set(product.id, product.openingStock))
  const isUnlimited = (product: Product): boolean =>
    product.category === 'خدمات' || product.category === 'بسته‌بندی'

  const invoices: Invoice[] = []
  const payments: Payment[] = []
  const expenses: Expense[] = []
  const transfers: Transfer[] = []

  let saleNo = 1000
  let purchaseNo = 1000
  let expenseNo = 5000
  let paymentCounter = 0

  const bankAccounts = ['acc-mellat', 'acc-mellat', 'acc-saman']
  const inAccounts = ['acc-mellat', 'acc-mellat', 'acc-saman', 'acc-cash']
  const methods: Record<string, string[]> = {
    'acc-mellat': ['transfer', 'card'],
    'acc-saman': ['transfer', 'card'],
    'acc-cash': ['cash']
  }

  const addPayment = (
    invoice: Invoice,
    amount: number,
    date: string,
    direction: 'in' | 'out'
  ): void => {
    paymentCounter += 1
    const accountId = pick(direction === 'out' ? bankAccounts : inAccounts)
    payments.push({
      id: `pay-${paymentCounter}`,
      invoiceId: invoice.id,
      contactId: invoice.contactId,
      direction,
      date: date > today ? today : date,
      amount: Math.max(0, Math.round(amount)),
      accountId,
      method: pick(methods[accountId]) as Payment['method'],
      createdAt: at(date > today ? today : date, 13)
    })
  }

  const addInvoicePayments = (invoice: Invoice, kind: 'sale' | 'purchase'): void => {
    const totals = invoiceTotals(invoice)
    const age = Math.round(
      (Date.parse(today) - Date.parse(invoice.date)) / 86400000
    )
    let paid = 0

    if (kind === 'purchase') {
      // Purchases follow a deterministic settlement rhythm so the demo always
      // shows a healthy mix of open, partial and settled supplier bills.
      if (invoice.no % 8 === 0) paid = 0
      else if (invoice.no % 6 === 0)
        paid = Math.round((totals.total * 0.55) / 100_000) * 100_000
      else paid = totals.total
    } else {
      const roll = rand()
      const fullyPaidChance = age > 60 ? 0.9 : 0.6
      if (roll < fullyPaidChance) {
        paid = totals.total
      } else if (roll < fullyPaidChance + 0.22) {
        paid = Math.round((totals.total * (rand() * 0.45 + 0.3)) / 100_000) * 100_000
      }
    }

    if (paid <= 0) return

    const date = addDaysIso(invoice.date, int(0, 22))
    if (rand() < 0.35 && paid === totals.total && totals.total > 60_000_000) {
      const first = Math.round((paid * 0.55) / 100_000) * 100_000
      addPayment(invoice, first, date, kind === 'sale' ? 'in' : 'out')
      addPayment(invoice, paid - first, addDaysIso(date, int(4, 18)), kind === 'sale' ? 'in' : 'out')
    } else {
      addPayment(invoice, paid, date, kind === 'sale' ? 'in' : 'out')
    }
  }

  const makeSalesForMonth = (month: number, maxDay: number): void => {
    const count = int(8, 12)
    for (let i = 0; i < count; i += 1) {
      const day = int(2, maxDay)
      const date = jalaliToIso(jy, month, day)
      if (date > today) continue
      const contact = pick(contacts.filter((item) => item.kind === 'customer'))
      const lineCount = rand() < 0.55 ? 1 : rand() < 0.85 ? 2 : 3
      const lines: InvoiceLine[] = []
      const used = new Set<string>()

      for (let l = 0; l < lineCount; l += 1) {
        let product: Product | null = null
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const candidate = pick(products)
          if (used.has(candidate.id)) continue
          if (!isUnlimited(candidate) && (stock.get(candidate.id) ?? 0) < 1) continue
          product = candidate
          break
        }
        if (!product) {
          product = products[products.length - 1]
        }
        if (used.has(product.id)) continue
        used.add(product.id)

        const maxQty = isUnlimited(product)
          ? product.category === 'بسته‌بندی'
            ? 2
            : 1
          : Math.min(3, stock.get(product.id) ?? 1)
        const qty = maxQty <= 1 ? 1 : int(1, maxQty)
        if (!isUnlimited(product)) {
          stock.set(product.id, (stock.get(product.id) ?? 0) - qty)
        }
        const discountPct = rand() < 0.16 ? int(4, 12) : 0
        lines.push({
          id: `sl-${saleNo}-${l}`,
          productId: product.id,
          title: product.name,
          qty,
          price: product.price,
          discountPct,
          cost: product.cost
        })
      }

      if (lines.length === 0) continue
      saleNo += 1
      const subtotal = lines.reduce(
        (sum, line) => sum + line.qty * line.price * (1 - line.discountPct / 100),
        0
      )
      const discount =
        rand() < 0.14 ? Math.round((subtotal * int(1, 4) * 0.01) / 100_000) * 100_000 : 0
      const invoice: Invoice = {
        id: `inv-s${saleNo}`,
        no: saleNo,
        kind: 'sale',
        contactId: contact.id,
        date,
        dueDate: addDaysIso(date, int(25, 45)),
        lines,
        discount,
        taxRate: settings.vatRate,
        note: rand() < 0.22 ? 'ارسال با باربری — بسته‌بندی ویژه' : undefined,
        createdAt: at(date, 11)
      }
      invoices.push(invoice)
      addInvoicePayments(invoice, 'sale')
    }
  }

  const makePurchasesForMonth = (month: number, maxDay: number): void => {
    const count = int(3, 4)
    for (let i = 0; i < count; i += 1) {
      const day = int(1, Math.min(24, maxDay))
      const date = jalaliToIso(jy, month, day)
      if (date > today) continue
      const contact = pick(contacts.filter((item) => item.kind === 'supplier'))
      const count2 = int(1, 3)
      const lines: InvoiceLine[] = []
      const used = new Set<string>()

      for (let l = 0; l < count2; l += 1) {
        const candidates = products.filter(
          (product) => product.category !== 'خدمات' && product.category !== 'بسته‌بندی'
        )
        const product = pick(candidates)
        if (used.has(product.id)) continue
        used.add(product.id)
        const qty = int(2, 6)
        stock.set(product.id, (stock.get(product.id) ?? 0) + qty)
        lines.push({
          id: `pl-${purchaseNo}-${l}`,
          productId: product.id,
          title: product.name,
          qty,
          price: product.cost,
          discountPct: 0,
          cost: product.cost
        })
      }
      if (lines.length === 0) continue
      purchaseNo += 1
      const invoice: Invoice = {
        id: `inv-p${purchaseNo}`,
        no: purchaseNo,
        kind: 'purchase',
        contactId: contact.id,
        date,
        dueDate: addDaysIso(date, 40),
        lines,
        discount: 0,
        taxRate: settings.vatRate,
        createdAt: at(date, 9)
      }
      invoices.push(invoice)
      addInvoicePayments(invoice, 'purchase')
    }
  }

  const makeExpensesForMonth = (month: number, maxDay: number): void => {
    const planned: { day: number; title: string; category: string; amount: number; accountId: string; vendor?: string }[] = [
      { day: 2, title: 'اجاره نمایشگاه و انبار', category: 'rent', amount: 55_000_000, accountId: 'acc-mellat' },
      { day: 5, title: 'حقوق و دستمزد تیم فروش', category: 'salary', amount: 96_000_000, accountId: 'acc-mellat' },
      { day: 9, title: 'تولید محتوا و تبلیغات اینستاگرام', category: 'marketing', amount: 18_500_000, accountId: 'acc-saman', vendor: 'استودیو رسانه نور' },
      { day: 13, title: 'آب، برق و گرمایش', category: 'utilities', amount: 7_400_000, accountId: 'acc-mellat' },
      { day: 16, title: 'حمل و بسته‌بندی سفارش‌ها', category: 'shipping', amount: 9_600_000, accountId: 'acc-cash', vendor: 'باربری آریا' },
      { day: 20, title: 'لوازم اداری و پذیرایی', category: 'office', amount: 4_300_000, accountId: 'acc-cash' },
      { day: 24, title: 'سرویس و نگهداری سیستم روشنایی', category: 'maintenance', amount: 6_500_000, accountId: 'acc-mellat' }
    ]
    if (month % 3 === 0) {
      planned.push({
        day: 22,
        title: 'عوارض شهرداری و مالیات مشاغل',
        category: 'tax',
        amount: 14_000_000,
        accountId: 'acc-mellat'
      })
    }
    for (const item of planned) {
      if (item.day > maxDay) continue
      const date = jalaliToIso(jy, month, item.day)
      if (date > today) continue
      expenseNo += 1
      expenses.push({
        id: `exp-${expenseNo}`,
        no: expenseNo,
        date,
        title: item.title,
        category: item.category,
        amount: item.amount,
        accountId: item.accountId,
        vendor: item.vendor,
        createdAt: at(date, 15)
      })
    }
  }

  for (let month = 1; month <= currentMonth; month += 1) {
    const monthLength = jalaliMonthLength(jy, month)
    const maxDay = month === currentMonth ? currentDay : monthLength
    makePurchasesForMonth(month, maxDay)
    makeSalesForMonth(month, maxDay)
    makeExpensesForMonth(month, maxDay)

    if (month < currentMonth) {
      const day = int(3, 8)
      const date = jalaliToIso(jy, month, day)
      transfers.push({
        id: `tr-${month}`,
        date,
        fromId: 'acc-mellat',
        toId: 'acc-cash',
        amount: 20_000_000,
        note: 'تأمین صندوق فروشگاه',
        createdAt: at(date, 12)
      })
    }
  }

  return {
    version: 1,
    settings,
    accounts,
    contacts,
    products,
    invoices: invoices.sort((a, b) => (a.date < b.date ? -1 : 1)),
    payments,
    expenses,
    transfers,
    manualJournals: []
  }
}

export function createEmptyData(): AppData {
  const seed = createSeedData()
  return {
    ...seed,
    contacts: [],
    products: [],
    invoices: [],
    payments: [],
    expenses: [],
    transfers: [],
    manualJournals: [],
    accounts: seed.accounts.map((account) => ({ ...account, opening: 0 }))
  }
}
