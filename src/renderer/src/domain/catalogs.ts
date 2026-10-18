export interface AccountDef {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  group: string
}

export const ACCOUNTS: AccountDef[] = [
  { code: '1101', name: 'صندوق', type: 'asset', group: 'دارایی جاری' },
  { code: '1102', name: 'بانک‌ها', type: 'asset', group: 'دارایی جاری' },
  { code: '1201', name: 'حساب‌های دریافتنی', type: 'asset', group: 'دارایی جاری' },
  { code: '1202', name: 'مالیات ارزش افزوده (قابل استرداد)', type: 'asset', group: 'دارایی جاری' },
  { code: '1301', name: 'موجودی کالا', type: 'asset', group: 'دارایی جاری' },
  { code: '1401', name: 'دارایی ثابت', type: 'asset', group: 'دارایی غیرجاری' },
  { code: '1402', name: 'استهلاک انباشته', type: 'asset', group: 'دارایی غیرجاری' },
  { code: '2101', name: 'حساب‌های پرداختنی', type: 'liability', group: 'بدهی جاری' },
  { code: '2201', name: 'مالیات ارزش افزوده (پرداختنی)', type: 'liability', group: 'بدهی جاری' },
  { code: '2301', name: 'حقوق و دستمزد پرداختنی', type: 'liability', group: 'بدهی جاری' },
  { code: '3101', name: 'سرمایه', type: 'equity', group: 'حقوق صاحبان سهام' },
  { code: '3901', name: 'سود و زیان انباشته', type: 'equity', group: 'حقوق صاحبان سهام' },
  { code: '4101', name: 'درآمد فروش', type: 'revenue', group: 'درآمدها' },
  { code: '4102', name: 'درآمد متفرقه', type: 'revenue', group: 'درآمدها' },
  { code: '5101', name: 'بهای تمام‌شده کالای فروش‌رفته', type: 'expense', group: 'بهای تمام‌شده' },
  { code: '6101', name: 'اجاره', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6102', name: 'حقوق و دستمزد', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6103', name: 'بازاریابی و تبلیغات', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6104', name: 'حمل و نقل', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6105', name: 'آب، برق و گاز', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6106', name: 'لوازم و ملزومات', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6107', name: 'تعمیر و نگهداری', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6108', name: 'مالیات و عوارض', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6109', name: 'استهلاک', type: 'expense', group: 'هزینه‌های عملیاتی' },
  { code: '6199', name: 'سایر هزینه‌ها', type: 'expense', group: 'هزینه‌های عملیاتی' }
]

export const ACCOUNT_MAP: Record<string, AccountDef> = Object.fromEntries(
  ACCOUNTS.map((account) => [account.code, account])
)

export const ACCOUNT_GROUPS: { label: string; accounts: AccountDef[] }[] = [
  'دارایی جاری',
  'دارایی غیرجاری',
  'بدهی جاری',
  'حقوق صاحبان سهام',
  'درآمدها',
  'بهای تمام‌شده',
  'هزینه‌های عملیاتی'
].map((group) => ({
  label: group,
  accounts: ACCOUNTS.filter((account) => account.group === group)
}))

export interface ExpenseCategory {
  key: string
  label: string
  code: string
  color: string
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { key: 'rent', label: 'اجاره', code: '6101', color: '#0E7C66' },
  { key: 'salary', label: 'حقوق و دستمزد', code: '6102', color: '#3D6C94' },
  { key: 'marketing', label: 'بازاریابی و تبلیغات', code: '6103', color: '#B5833C' },
  { key: 'shipping', label: 'حمل و نقل', code: '6104', color: '#79659B' },
  { key: 'utilities', label: 'آب، برق و گاز', code: '6105', color: '#3F8A7A' },
  { key: 'office', label: 'لوازم و ملزومات', code: '6106', color: '#A65E52' },
  { key: 'maintenance', label: 'تعمیر و نگهداری', code: '6107', color: '#6F7D46' },
  { key: 'tax', label: 'مالیات و عوارض', code: '6108', color: '#8C5B72' },
  { key: 'depreciation', label: 'استهلاک', code: '6109', color: '#5D6B70' },
  { key: 'other', label: 'سایر هزینه‌ها', code: '6199', color: '#8A7A63' }
]

export const EXPENSE_CATEGORY_MAP: Record<string, ExpenseCategory> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((category) => [category.key, category])
)

export const PRODUCT_CATEGORIES = [
  'فرش',
  'گلیم',
  'تابلو',
  'صنایع دستی',
  'اکسسوری',
  'خدمات',
  'بسته‌بندی'
] as const

export const PRODUCT_CATEGORY_COLORS: Record<string, string> = {
  فرش: '#0E7C66',
  گلیم: '#3D6C94',
  تابلو: '#B5833C',
  'صنایع دستی': '#79659B',
  اکسسوری: '#A65E52',
  خدمات: '#3F8A7A',
  'بسته‌بندی': '#6F7D46'
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت‌خوان',
  transfer: 'انتقال بانکی',
  cheque: 'چک'
}

export const ACCOUNT_COLORS = ['emerald', 'gold', 'blue', 'plum', 'rose', 'slate'] as const
export type AccountColor = (typeof ACCOUNT_COLORS)[number]

export const CURRENCIES = ['تومان', 'ریال'] as const
