import { useEffect, useRef, useState } from 'react'
import type * as React from 'react'
import {
  Building2,
  Check,
  Database,
  Download,
  HardDrive,
  Keyboard,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Wallet
} from 'lucide-react'
import clsx from 'clsx'
import { CURRENCIES } from '../domain/catalogs'
import { buildJournal } from '../domain/journal'
import { currentJalaliYear, todayIso } from '../lib/jalali'
import { downloadJson } from '../lib/export'
import { fa } from '../lib/digits'
import { useApp } from '../store/useApp'
import { confirmAction, toast } from '../store/ui'
import type { AppData } from '../domain/types'
import {
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  Switch
} from '../components/kit'
import { LogoMark } from '../components/Logo'

export function SettingsPage(): React.JSX.Element {
  const data = useApp()
  const updateSettings = useApp((state) => state.updateSettings)
  const updateCompany = useApp((state) => state.updateCompany)
  const resetDemo = useApp((state) => state.resetDemo)
  const clearAll = useApp((state) => state.clearAll)
  const importData = useApp((state) => state.importData)

  const fileRef = useRef<HTMLInputElement>(null)
  const [company, setCompany] = useState(data.settings.company)
  const [fiscalYear, setFiscalYear] = useState(data.settings.fiscalYear)
  const [currency, setCurrency] = useState(data.settings.currency)
  const [vatRate, setVatRate] = useState(data.settings.vatRate)

  useEffect(() => {
    setCompany(data.settings.company)
    setFiscalYear(data.settings.fiscalYear)
    setCurrency(data.settings.currency)
    setVatRate(data.settings.vatRate)
  }, [data.settings])

  const sizeKb = Math.max(
    1,
    Math.round(
      new Blob([
        JSON.stringify({
          settings: data.settings,
          accounts: data.accounts,
          contacts: data.contacts,
          products: data.products,
          invoices: data.invoices,
          payments: data.payments,
          expenses: data.expenses,
          transfers: data.transfers,
          manualJournals: data.manualJournals
        })
      ]).size / 1024
    )
  )

  const nowYear = currentJalaliYear()
  const yearOptions = Array.from({ length: 7 }, (_, index) => nowYear - 3 + index)

  const saveCompany = (): void => {
    if (!company.name.trim() || !company.owner.trim()) {
      toast.error('اطلاعات ناقص است', 'نام کسب‌وکار و نام مدیر را وارد کنید.')
      return
    }
    updateCompany(company)
    toast.success('هویت کسب‌وکار ذخیره شد', company.name)
  }

  const saveFinance = (): void => {
    if (vatRate < 0 || vatRate > 100) {
      toast.error('نرخ مالیات معتبر نیست', 'نرخ باید بین صفر تا ۱۰۰ باشد.')
      return
    }
    updateSettings({ fiscalYear, currency, vatRate })
    toast.success('تنظیمات مالی ذخیره شد', `سال مالی ${fa(fiscalYear)}`)
  }

  const exportBackup = (): void => {
    const backup: AppData = {
      version: data.version,
      settings: data.settings,
      accounts: data.accounts,
      contacts: data.contacts,
      products: data.products,
      invoices: data.invoices,
      payments: data.payments,
      expenses: data.expenses,
      transfers: data.transfers,
      manualJournals: data.manualJournals
    }
    downloadJson(`taraz-backup-${todayIso().replaceAll('-', '')}.json`, backup)
    toast.success('پشتیبان دانلود شد', 'فایل JSON شامل تمام داده‌های تراز است.')
  }

  const onImport = (file: File): void => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData
        const result = importData(parsed)
        if (!result.ok) {
          toast.error('بازیابی انجام نشد', result.error)
          return
        }
        toast.success('داده‌ها بازیابی شد', 'تمام اطلاعات از فایل پشتیبان جایگزین شد.')
      } catch {
        toast.error('فایل معتبر نیست', 'فایل انتخاب‌شده یک پشتیبان معتبر تراز نیست.')
      }
    }
    reader.readAsText(file)
  }

  const confirmResetDemo = async (): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'بازنشانی دادهٔ نمونه',
      message: 'تمام تغییرات شما حذف و داده‌های نمونهٔ گالری آریانا دوباره ساخته می‌شود. ادامه می‌دهید؟',
      confirmLabel: 'بازنشانی',
      danger: true
    })
    if (!confirmed) return
    resetDemo()
    toast.success('دادهٔ نمونه بازسازی شد', 'دفتر تراز با اطلاعات تازه آماده است.')
  }

  const confirmClear = async (): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'پاک‌سازی کامل داده‌ها',
      message:
        'همه فاکتورها، طرف‌حساب‌ها، کالاها، هزینه‌ها و اسناد حذف می‌شوند. هویت کسب‌وکار و تنظیمات باقی می‌ماند. این کار قابل بازگشت نیست.',
      confirmLabel: 'پاک‌سازی کامل',
      danger: true
    })
    if (!confirmed) return
    clearAll()
    toast.success('داده‌ها پاک شد', 'برای شروع، فاکتورها و اطلاعات خود را وارد کنید.')
  }

  const journalCount = buildJournal(data).length

  return (
    <div className="page">
      <PageHeader
        title="تنظیمات"
        subtitle="هویت کسب‌وکار، سال مالی، ظاهر برنامه و پشتیبان‌گیری — همه زیر یک سقف."
        actions={
          <Badge tone="gold" dot>
            نسخهٔ ۱٫۰ · تراز
          </Badge>
        }
      />

      <Card className="card-pad">
        <div className="flex items-center gap-3 mb-2">
          <span className="kpi-icon">
            <Building2 size={17} />
          </span>
          <div>
            <div className="card-title">هویت کسب‌وکار</div>
            <div className="card-sub">این اطلاعات در فاکتورها، گزارش‌ها و چاپ‌ها استفاده می‌شود.</div>
          </div>
        </div>
        <div className="form-grid mt-2">
          <Field label="نام کسب‌وکار" required>
            <input
              className="input"
              value={company.name}
              onChange={(event) => setCompany({ ...company, name: event.target.value })}
            />
          </Field>
          <Field label="نام مدیر" required>
            <input
              className="input"
              value={company.owner}
              onChange={(event) => setCompany({ ...company, owner: event.target.value })}
            />
          </Field>
          <Field label="شماره تماس">
            <input
              className="input ltr"
              value={company.phone}
              onChange={(event) => setCompany({ ...company, phone: event.target.value })}
            />
          </Field>
          <Field label="ایمیل">
            <input
              className="input ltr"
              value={company.email}
              onChange={(event) => setCompany({ ...company, email: event.target.value })}
            />
          </Field>
          <Field label="شناسه مالیاتی">
            <input
              className="input ltr"
              value={company.taxId}
              onChange={(event) => setCompany({ ...company, taxId: event.target.value })}
            />
          </Field>
          <Field label="نشانی" className="full">
            <input
              className="input"
              value={company.address}
              onChange={(event) => setCompany({ ...company, address: event.target.value })}
            />
          </Field>
        </div>
        <div className="flex items-center justify-end mt-2">
          <Button variant="primary" icon={Check} onClick={saveCompany}>
            ذخیرهٔ هویت کسب‌وکار
          </Button>
        </div>
      </Card>

      <div className="grid grid-2">
        <Card className="card-pad">
          <div className="flex items-center gap-3 mb-2">
            <span className="kpi-icon gold">
              <Wallet size={17} />
            </span>
            <div>
              <div className="card-title">مالی و مالیات</div>
              <div className="card-sub">سال مالی، واحد پول و نرخ مالیات پیش‌فرض</div>
            </div>
          </div>
          <div className="form-grid mt-2">
            <Field label="سال مالی">
              <select
                className="select"
                value={fiscalYear}
                onChange={(event) => setFiscalYear(Number(event.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {fa(year)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="واحد پول">
              <select
                className="select"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="نرخ مالیات بر ارزش افزوده" hint="درصد پیش‌فرض در فاکتورهای جدید">
              <div className="input-group">
                <input
                  className="input ltr"
                  type="number"
                  min={0}
                  max={100}
                  value={vatRate}
                  onChange={(event) => setVatRate(Number(event.target.value) || 0)}
                />
                <span className="input-suffix">٪</span>
              </div>
            </Field>
          </div>
          <div className="flex items-center justify-end mt-2">
            <Button variant="soft" icon={Check} onClick={saveFinance}>
              ذخیرهٔ تنظیمات مالی
            </Button>
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-center gap-3 mb-2">
            <span className="kpi-icon violet">
              <Sparkles size={17} />
            </span>
            <div>
              <div className="card-title">ظاهر و خوانایی</div>
              <div className="card-sub">تراز را شبیه خودتان کنید</div>
            </div>
          </div>

          <div className="tiny muted mb-2">پوستهٔ برنامه</div>
          <div className="grid grid-2" style={{ gap: 10 }}>
            <button
              className={clsx('theme-choice', data.settings.theme === 'light' && 'active')}
              onClick={() => updateSettings({ theme: 'light' })}
            >
              <span className="theme-preview light">
                <span className="tp-side" />
                <span className="tp-main">
                  <span className="tp-card" />
                  <span className="tp-line" />
                  <span className="tp-line short" />
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Sun size={14} /> روشن — کاغذ و زمرد
              </span>
            </button>
            <button
              className={clsx('theme-choice', data.settings.theme === 'dark' && 'active')}
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              <span className="theme-preview dark">
                <span className="tp-side" />
                <span className="tp-main">
                  <span className="tp-card" />
                  <span className="tp-line" />
                  <span className="tp-line short" />
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Moon size={14} /> تاریک — شب و طلا
              </span>
            </button>
          </div>

          <div className="divider mt-3 mb-2" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>نمایش اعداد فارسی</div>
              <div className="tiny muted">در گزارش‌ها و فاکتورها از ۱۲۳ استفاده شود</div>
            </div>
            <Switch
              checked={data.settings.persianDigits}
              onChange={(value) => updateSettings({ persianDigits: value })}
              label="اعداد فارسی"
            />
          </div>
          <div className="flex items-center justify-between gap-3 mt-2">
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>ذخیره‌سازی محلی</div>
              <div className="tiny muted">داده‌ها فقط در همین مرورگر/دستگاه می‌مانند</div>
            </div>
            <Badge tone="success" dot>
              فعال
            </Badge>
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card className="card-pad">
          <div className="flex items-center gap-3 mb-2">
            <span className="kpi-icon blue">
              <Database size={17} />
            </span>
            <div>
              <div className="card-title">داده‌ها و پشتیبان‌گیری</div>
              <div className="card-sub">نسخهٔ امن و کامل از دفتر خود بسازید</div>
            </div>
          </div>

          <div className="grid grid-3 mt-2" style={{ gap: 10 }}>
            <div className="mini-stat">
              <HardDrive size={14} />
              <div>
                <b className="num">{fa(sizeKb)} KB</b>
                <span>حجم داده</span>
              </div>
            </div>
            <div className="mini-stat">
              <ReceiptIcon />
              <div>
                <b className="num">{fa(data.invoices.length)}</b>
                <span>فاکتور</span>
              </div>
            </div>
            <div className="mini-stat">
              <ShieldCheck size={14} />
              <div>
                <b className="num">{fa(journalCount)}</b>
                <span>سند</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            <Button variant="soft" icon={Download} onClick={exportBackup}>
              دانلود پشتیبان
            </Button>
            <Button variant="ghost" icon={Upload} onClick={() => fileRef.current?.click()}>
              بازیابی از فایل
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onImport(file)
                event.target.value = ''
              }}
            />
          </div>

          <div className="divider mt-3 mb-2" />
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={confirmResetDemo}>
              بازنشانی دادهٔ نمونه
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              style={{ color: 'var(--danger)' }}
              onClick={confirmClear}
            >
              پاک‌سازی کامل
            </Button>
          </div>
          <div className="tiny muted mt-1">
            پیش از پاک‌سازی یا بازنشانی، یک فایل پشتیبان دانلود کنید.
          </div>
        </Card>

        <div className="stack">
          <Card className="card-pad">
            <div className="flex items-center gap-3 mb-2">
              <span className="kpi-icon">
                <Keyboard size={17} />
              </span>
              <div>
                <div className="card-title">میان‌برهای صفحه‌کلید</div>
                <div className="card-sub">برای کار سریع‌تر</div>
              </div>
            </div>
            <div className="shortcut-row">
              <span>جست‌وجوی سراسری</span>
              <span className="kbd">⌘ K</span>
            </div>
            <div className="shortcut-row">
              <span>بستن پنجره‌ها</span>
              <span className="kbd">Esc</span>
            </div>
            <div className="shortcut-row">
              <span>جابه‌جایی در نتایج</span>
              <span className="kbd">↑ ↓</span>
            </div>
            <div className="shortcut-row">
              <span>انتخاب نتیجه</span>
              <span className="kbd">Enter</span>
            </div>
          </Card>

          <Card className="card-pad" style={{ overflow: 'hidden' }}>
            <div className="flex items-center gap-3">
              <div className="brand-mark" style={{ background: 'var(--brand-grad)', width: 48, height: 48 }}>
                <LogoMark size={30} />
              </div>
              <div>
                <div className="card-title">تراز، نسخهٔ ۱٫۰</div>
                <div className="card-sub">دفترِ هوشمند کسب‌وکار</div>
              </div>
              <span className="spacer" />
              <Badge tone="gold">ساخته‌شده در ایران</Badge>
            </div>
            <div className="tiny muted mt-2" style={{ lineHeight: 2 }}>
              تراز یک نرم‌افزار حسابداری دوطرفه با تمرکز بر تجربهٔ فارسی، گزارش‌های مدیریتی و
              سادگی است. داده‌های شما بدون نیاز به اینترنت و سرور، روی همین دستگاه نگهداری
              می‌شود.
            </div>
            <div className="flex gap-2 mt-2">
              <Badge tone="neutral">Electron</Badge>
              <Badge tone="neutral">React 19</Badge>
              <Badge tone="neutral">TypeScript</Badge>
              <Badge tone="neutral">Offline-first</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ReceiptIcon(): React.JSX.Element {
  return <Wallet size={14} />
}
