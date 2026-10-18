import {
  BarChart3,
  BookOpen,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import type { Page } from '../store/ui'

export const PAGE_META: Record<Page, { label: string; icon: LucideIcon; hint: string }> = {
  dashboard: { label: 'داشبورد', icon: LayoutDashboard, hint: 'نمای کلی کسب‌وکار' },
  sales: { label: 'فروش', icon: Receipt, hint: 'فاکتورها و دریافت‌ها' },
  purchases: { label: 'خرید', icon: ShoppingBag, hint: 'فاکتورهای خرید' },
  expenses: { label: 'هزینه‌ها', icon: Wallet, hint: 'هزینه‌های عملیاتی' },
  contacts: { label: 'طرف‌حساب‌ها', icon: Users, hint: 'مشتریان و تأمین‌کنندگان' },
  products: { label: 'کالا و خدمات', icon: Package, hint: 'انبار و قیمت‌گذاری' },
  accounts: { label: 'صندوق و بانک', icon: Landmark, hint: 'خزانه و گردش وجه' },
  journal: { label: 'دفتر روزنامه', icon: BookOpen, hint: 'اسناد و تراز آزمایشی' },
  reports: { label: 'گزارش‌ها', icon: BarChart3, hint: 'تحلیل‌های مالی' },
  settings: { label: 'تنظیمات', icon: Settings, hint: 'هویت و پیکربندی' },
  invoice: { label: 'فاکتور', icon: FileText, hint: 'نمایش و چاپ فاکتور' }
}

export const NAV_SECTIONS: { label: string; items: Page[] }[] = [
  { label: 'مرور', items: ['dashboard'] },
  { label: 'عملیات', items: ['sales', 'purchases', 'expenses'] },
  { label: 'ارتباطات', items: ['contacts'] },
  { label: 'انبار', items: ['products'] },
  { label: 'مالی', items: ['accounts', 'journal', 'reports'] },
  { label: 'سیستم', items: ['settings'] }
]

export function activePage(page: Page): Page {
  if (page === 'invoice') return 'sales'
  return page
}
