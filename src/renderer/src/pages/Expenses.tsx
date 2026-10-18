import { useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import {
  Download,
  Landmark,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  Wallet
} from 'lucide-react'
import clsx from 'clsx'
import { accountLabel } from '../domain/calc'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_MAP } from '../domain/catalogs'
import { formatJalali, todayIso } from '../lib/jalali'
import { compact, money } from '../lib/format'
import { fa } from '../lib/digits'
import { downloadCsv } from '../lib/export'
import { resolvePeriod } from '../lib/period'
import { useApp } from '../store/useApp'
import { confirmAction, toast, useNav } from '../store/ui'
import type { Expense } from '../domain/types'
import {
  AmountInput,
  Button,
  Card,
  DatePicker,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchField,
  matchesSearch
} from '../components/kit'
import { Donut } from '../components/charts'

type PeriodKey = 'thisMonth' | 'lastMonth' | 'last3' | 'fiscal'

const PERIODS: { key: PeriodKey; label: string; period: 'thisMonth' | 'lastMonth' | 'last3' | 'fiscal' }[] = [
  { key: 'thisMonth', label: 'این ماه', period: 'thisMonth' },
  { key: 'lastMonth', label: 'ماه قبل', period: 'lastMonth' },
  { key: 'last3', label: '۳ ماه اخیر', period: 'last3' },
  { key: 'fiscal', label: 'سال مالی', period: 'fiscal' }
]

export function ExpensesPage(): React.JSX.Element {
  const data = useApp()
  const addExpense = useApp((state) => state.addExpense)
  const updateExpense = useApp((state) => state.updateExpense)
  const deleteExpense = useApp((state) => state.deleteExpense)
  const navigate = useNav((state) => state.navigate)
  const createIntent = useNav((state) => state.create)
  const clearCreate = useNav((state) => state.clearCreate)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [period, setPeriod] = useState<PeriodKey>('thisMonth')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  useEffect(() => {
    if (createIntent) {
      setEditing(null)
      setFormOpen(true)
      clearCreate()
    }
  }, [createIntent, clearCreate])

  const range = useMemo(() => {
    const preset = PERIODS.find((item) => item.key === period)?.period ?? 'thisMonth'
    return resolvePeriod(preset, data.settings)
  }, [period, data.settings])

  const periodExpenses = useMemo(
    () =>
      data.expenses
        .filter((expense) => expense.date >= range.from && expense.date <= range.to)
        .sort((a, b) => (a.date === b.date ? b.no - a.no : a.date < b.date ? 1 : -1)),
    [data.expenses, range]
  )

  const filtered = useMemo(() => {
    return periodExpenses.filter((expense) => {
      if (category !== 'all' && expense.category !== category) return false
      if (!query.trim()) return true
      const cat = EXPENSE_CATEGORY_MAP[expense.category]?.label ?? ''
      return matchesSearch(`${expense.title} ${expense.vendor ?? ''} ${cat} ${expense.note ?? ''}`, query)
    })
  }, [periodExpenses, category, query])

  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [query, category, period])

  const total = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const expense of periodExpenses) {
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
  }, [periodExpenses])

  const donutItems =
    byCategory.length > 5
      ? [
          ...byCategory.slice(0, 4),
          {
            key: 'other-rest',
            label: 'سایر موارد',
            color: '#9A9184',
            amount: byCategory.slice(4).reduce((sum, item) => sum + item.amount, 0)
          }
        ]
      : byCategory

  const topCategory = byCategory[0]
  const thisMonth = resolvePeriod('thisMonth', data.settings)
  const thisMonthTotal = data.expenses
    .filter((expense) => expense.date >= thisMonth.from && expense.date <= thisMonth.to)
    .reduce((sum, expense) => sum + expense.amount, 0)

  const remove = async (expense: Expense): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'حذف هزینه',
      message: `هزینه «${expense.title}» با مبلغ ${money(expense.amount)} تومان حذف می‌شود. این کار سند حسابداری مرتبط را نیز حذف می‌کند.`,
      confirmLabel: 'حذف هزینه',
      danger: true
    })
    if (!confirmed) return
    deleteExpense(expense.id)
    toast.success('هزینه حذف شد', expense.title)
  }

  const exportRows = (): void => {
    const rows: (string | number)[][] = [
      ['عنوان', 'دسته', 'تاریخ', 'حساب', 'فروشنده', 'مبلغ', 'توضیح']
    ]
    for (const expense of filtered) {
      rows.push([
        expense.title,
        EXPENSE_CATEGORY_MAP[expense.category]?.label ?? '',
        formatJalali(expense.date, 'numeric'),
        accountLabel(data.accounts.find((account) => account.id === expense.accountId) ?? data.accounts[0]),
        expense.vendor ?? '',
        expense.amount,
        expense.note ?? ''
      ])
    }
    downloadCsv(`taraz-expenses-${todayIso().replaceAll('-', '')}.csv`, rows)
    toast.success('خروجی CSV آماده شد')
  }

  return (
    <div className="page">
      <PageHeader
        title="هزینه‌ها"
        subtitle="هزینه‌های عملیاتی را ثبت و ترکیب آن‌ها را تحلیل کنید؛ هر هزینه به‌صورت خودکار سند می‌خورد."
        actions={
          <>
            <Button variant="ghost" icon={Download} onClick={exportRows}>
              خروجی CSV
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              ثبت هزینه
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">هزینه {range.label}</span>
            <span className="kpi-icon gold">
              <Wallet size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {compact(total)}
            <span className="unit">تومان</span>
          </div>
          <div className="kpi-foot">
            <span>{fa(periodExpenses.length)} هزینه ثبت‌شده</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">هزینه این ماه</span>
            <span className="kpi-icon">
              <TrendingDown size={16} />
            </span>
          </div>
          <div className="kpi-value">{compact(thisMonthTotal)}</div>
          <div className="kpi-foot">
            <span>
              {total > 0 ? fa(Math.round((thisMonthTotal / total) * 100)) : fa(0)}٪ از هزینه‌های دوره
            </span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">بزرگ‌ترین دسته</span>
            <span className="kpi-icon blue">
              <Receipt size={16} />
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: 20 }}>
            {topCategory?.label ?? '—'}
          </div>
          <div className="kpi-foot">
            <span>{topCategory ? `${compact(topCategory.amount)} تومان` : 'هنوز هزینه‌ای نیست'}</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">میانگین هر هزینه</span>
            <span className="kpi-icon violet">
              <Wallet size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {compact(periodExpenses.length ? total / periodExpenses.length : 0)}
            <span className="unit">تومان</span>
          </div>
          <div className="kpi-foot">
            <span>در {range.label}</span>
          </div>
        </Card>
      </div>

      <div className="report-split">
        <Card>
          <div className="card-head" style={{ paddingBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="card-title">دفتر هزینه‌ها</div>
              <div className="card-sub">جست‌وجو و فیلتر بر اساس دسته و دوره</div>
            </div>
            <SearchField value={query} onChange={setQuery} placeholder="عنوان یا فروشنده…" />
          </div>
          <div className="card-pad" style={{ paddingTop: 0, paddingBottom: 12 }}>
            <div className="filter-bar">
              <div className="filter-group">
                {PERIODS.map((item) => (
                  <button
                    key={item.key}
                    className={clsx('chip', period === item.key && 'active')}
                    onClick={() => setPeriod(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <select
                className="select"
                style={{ width: 180, height: 36 }}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">همه دسته‌ها</option>
                {EXPENSE_CATEGORIES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="هزینه‌ای مطابق فیلترها نیست"
              text="دسته یا دوره دیگری را انتخاب کنید یا اولین هزینه را ثبت کنید."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setFormOpen(true)}>
                  ثبت هزینه
                </Button>
              }
            />
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>عنوان هزینه</th>
                      <th>دسته</th>
                      <th>تاریخ</th>
                      <th>حساب</th>
                      <th>مبلغ</th>
                      <th className="text-end">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((expense) => {
                      const cat = EXPENSE_CATEGORY_MAP[expense.category]
                      const account = data.accounts.find((item) => item.id === expense.accountId)
                      return (
                        <tr key={expense.id}>
                          <td>
                            <div className="cell-main">{expense.title}</div>
                            <div className="cell-sub">{expense.vendor ?? 'بدون فروشنده'}</div>
                          </td>
                          <td>
                            <BadgeWithDot color={cat?.color ?? '#8A7A63'} label={cat?.label ?? 'سایر'} />
                          </td>
                          <td className="num">{formatJalali(expense.date, 'numeric')}</td>
                          <td className="tiny">{account ? accountLabel(account) : '—'}</td>
                          <td className="num cell-main">{money(expense.amount)}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="icon-btn sm ghost"
                                title="ویرایش"
                                onClick={() => {
                                  setEditing(expense)
                                  setFormOpen(true)
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="icon-btn sm ghost"
                                title="حذف"
                                onClick={() => remove(expense)}
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageCount={pageCount}
                onChange={setPage}
                total={filtered.length}
                pageSize={pageSize}
              />
            </>
          )}
        </Card>

        <Card className="card-pad">
          <div className="card-title" style={{ marginBottom: 2 }}>
            ترکیب هزینه‌ها
          </div>
          <div className="card-sub" style={{ marginBottom: 12 }}>
            {range.label} · {fa(total)} تومان
          </div>
          {donutItems.length === 0 ? (
            <EmptyState icon={Landmark} title="داده‌ای برای نمایش نیست" />
          ) : (
            <>
              <Donut
                items={donutItems}
                centerLabel="جمع هزینه‌ها"
                centerValue={compact(total)}
                size={184}
                thickness={20}
              />
              <div className="donut-legend mt-2">
                {donutItems.map((item) => (
                  <div className="donut-row" key={item.key}>
                    <span className="legend-dot" style={{ background: item.color, width: 8, height: 8 }} />
                    <span className="d-name">{item.label}</span>
                    <span className="d-amount">{compact(item.amount)}</span>
                    <span className="d-pct">
                      {total > 0 ? fa(Math.round((item.amount / total) * 100)) : fa(0)}٪
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-ghost btn-sm w-100 mt-2"
                onClick={() => navigate('reports')}
              >
                تحلیل کامل در گزارش‌ها
              </button>
            </>
          )}
        </Card>
      </div>

      <ExpenseForm
        open={formOpen}
        expense={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={(draft) => {
          if (editing) {
            updateExpense(editing.id, draft)
            toast.success('هزینه ویرایش شد', draft.title)
          } else {
            addExpense(draft)
            toast.success('هزینه ثبت شد', `${money(draft.amount)} تومان برای «${draft.title}»`)
          }
          setFormOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function BadgeWithDot({ color, label }: { color: string; label: string }): React.JSX.Element {
  return (
    <span className="badge badge-neutral" style={{ gap: 6, fontWeight: 500 }}>
      <span className="dot" style={{ background: color }} />
      {label}
    </span>
  )
}

function ExpenseForm({
  open,
  expense,
  onClose,
  onSave
}: {
  open: boolean
  expense: Expense | null
  onClose: () => void
  onSave: (draft: {
    date: string
    title: string
    category: string
    amount: number
    accountId: string
    vendor?: string
    note?: string
  }) => void
}): React.JSX.Element {
  const data = useApp()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('rent')
  const [amount, setAmount] = useState(0)
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? '')
  const [date, setDate] = useState(todayIso())
  const [vendor, setVendor] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(expense?.title ?? '')
    setCategory(expense?.category ?? 'rent')
    setAmount(expense?.amount ?? 0)
    setAccountId(expense?.accountId ?? data.accounts[0]?.id ?? '')
    setDate(expense?.date ?? todayIso())
    setVendor(expense?.vendor ?? '')
    setNote(expense?.note ?? '')
    setError('')
  }, [open, expense, data.accounts])

  const submit = (): void => {
    if (!title.trim()) {
      setError('عنوان هزینه را وارد کنید.')
      return
    }
    if (amount <= 0) {
      setError('مبلغ هزینه باید بیشتر از صفر باشد.')
      return
    }
    if (!accountId) {
      setError('حساب پرداخت را انتخاب کنید.')
      return
    }
    onSave({
      title: title.trim(),
      category,
      amount: Math.round(amount),
      accountId,
      date,
      vendor: vendor.trim() || undefined,
      note: note.trim() || undefined
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}
      subtitle="هزینه از حساب انتخاب‌شده کسر می‌شود و سند آن خودکار ثبت می‌گردد."
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" icon={Wallet} onClick={submit}>
            {expense ? 'ذخیره تغییرات' : 'ثبت هزینه'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="عنوان هزینه" required className="full">
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً اجاره نمایشگاه مهر"
          />
        </Field>
        <Field label="دسته‌بندی" required>
          <select
            className="select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="مبلغ" required>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <Field label="حساب پرداخت" required>
          <select
            className="select"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            {data.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="تاریخ">
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="فروشنده / دریافت‌کننده">
          <input
            className="input"
            value={vendor}
            onChange={(event) => setVendor(event.target.value)}
            placeholder="اختیاری"
          />
        </Field>
        <Field label="توضیحات" className="full">
          <textarea
            className="textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="جزئیات، شماره فاکتور یا توضیح داخلی…"
          />
        </Field>
      </div>
      {error ? <div className="field-error mt-1">{error}</div> : null}
    </Modal>
  )
}
