import { useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  Wallet
} from 'lucide-react'
import clsx from 'clsx'
import {
  accountBalance,
  accountLabel,
  accountMovements,
  maskCard,
  totalLiquidity
} from '../domain/calc'
import { ACCOUNT_COLORS } from '../domain/catalogs'
import type { AccountColor } from '../domain/catalogs'
import { formatJalali, todayIso } from '../lib/jalali'
import { compact, money } from '../lib/format'
import { fa } from '../lib/digits'
import { useApp } from '../store/useApp'
import { confirmAction, toast, useNav } from '../store/ui'
import type { CashAccount } from '../domain/types'
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
  matchesSearch
} from '../components/kit'
import { Sparkline } from '../components/charts'
import { SearchField } from '../components/kit'

export function AccountsPage(): React.JSX.Element {
  const data = useApp()
  const saveAccount = useApp((state) => state.saveAccount)
  const deleteAccount = useApp((state) => state.deleteAccount)
  const addTransfer = useApp((state) => state.addTransfer)
  const createIntent = useNav((state) => state.create)
  const clearCreate = useNav((state) => state.clearCreate)

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(data.accounts[0]?.id ?? '')
  const [transferOpen, setTransferOpen] = useState(false)
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<CashAccount | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (createIntent) {
      setTransferOpen(true)
      clearCreate()
    }
  }, [createIntent, clearCreate])

  useEffect(() => {
    if (!data.accounts.some((account) => account.id === selectedId)) {
      setSelectedId(data.accounts[0]?.id ?? '')
    }
  }, [data.accounts, selectedId])

  const selected = data.accounts.find((account) => account.id === selectedId) ?? data.accounts[0]
  const total = totalLiquidity(data)
  const cashTotal = data.accounts
    .filter((account) => account.kind === 'cash')
    .reduce((sum, account) => sum + accountBalance(account.id, data), 0)
  const bankTotal = data.accounts
    .filter((account) => account.kind === 'bank')
    .reduce((sum, account) => sum + accountBalance(account.id, data), 0)

  const movements = useMemo(() => {
    if (!selected) return []
    let running = selected.opening
    return accountMovements(selected.id, data)
      .map((movement) => {
        running += movement.direction === 'in' ? movement.amount : -movement.amount
        return { ...movement, balance: running }
      })
      .reverse()
  }, [selected, data])

  const filteredMovements = useMemo(
    () =>
      movements.filter((movement) =>
        matchesSearch(`${movement.title} ${movement.subtitle ?? ''} ${movement.amount}`, query)
      ),
    [movements, query]
  )
  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(filteredMovements.length / pageSize))
  const paged = filteredMovements.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [query, selectedId])

  const removeAccount = async (account: CashAccount): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'حذف حساب',
      message: `حساب «${accountLabel(account)}» حذف شود؟ اگر گردش مالی داشته باشد حذف انجام نمی‌شود.`,
      confirmLabel: 'حذف حساب',
      danger: true
    })
    if (!confirmed) return
    const result = deleteAccount(account.id)
    if (!result.ok) {
      toast.error('حذف انجام نشد', result.error)
      return
    }
    toast.success('حساب حذف شد', accountLabel(account))
  }

  return (
    <div className="page">
      <PageHeader
        title="صندوق و بانک"
        subtitle="موجودی، گردش و انتقال وجه بین حساب‌ها؛ همه چیز شفاف و قابل پیگیری."
        actions={
          <>
            <Button
              variant="soft"
              icon={Plus}
              onClick={() => {
                setEditingAccount(null)
                setAccountFormOpen(true)
              }}
            >
              حساب جدید
            </Button>
            <Button variant="primary" icon={ArrowLeftRight} onClick={() => setTransferOpen(true)}>
              انتقال وجه
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">موجودی کل خزانه</span>
            <span className="kpi-icon">
              <Wallet size={16} />
            </span>
          </div>
          <div className="kpi-value">{compact(total)}</div>
          <div className="kpi-foot">
            <span>{fa(data.accounts.length)} حساب فعال</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">موجودی نقد</span>
            <span className="kpi-icon gold">
              <Banknote size={16} />
            </span>
          </div>
          <div className="kpi-value">{compact(cashTotal)}</div>
          <div className="kpi-foot">
            <span>صندوق‌های فروشگاه</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">موجودی بانک‌ها</span>
            <span className="kpi-icon blue">
              <Landmark size={16} />
            </span>
          </div>
          <div className="kpi-value">{compact(bankTotal)}</div>
          <div className="kpi-foot">
            <span>{fa(data.accounts.filter((account) => account.kind === 'bank').length)} حساب بانکی</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">گردش این حساب</span>
            <span className="kpi-icon violet">
              <ArrowLeftRight size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {fa(movements.length)}
            <span className="unit">تراکنش</span>
          </div>
          <div className="kpi-foot">
            <span>{selected ? accountLabel(selected) : '—'}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-3">
        {data.accounts.map((account) => {
          const balance = accountBalance(account.id, data)
          const movementCount = accountMovements(account.id, data).length
          return (
            <div
              key={account.id}
              className={clsx('account-card', `tone-${account.color}`, account.id === selectedId && 'is-selected')}
              style={{
                cursor: 'pointer',
                outline: account.id === selectedId ? '2px solid var(--gold-line)' : 'none',
                outlineOffset: 3
              }}
              onClick={() => setSelectedId(account.id)}
            >
              <div className="account-top">
                <div>
                  <div className="account-bank">
                    {account.kind === 'cash' ? 'صندوق نقدی' : account.bank ? `بانک ${account.bank}` : 'حساب بانکی'}
                  </div>
                  <div className="account-name">{account.name}</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="account-chip" />
                </div>
              </div>

              <div>
                <div className="account-balance-label">موجودی قابل استفاده</div>
                <div className="account-balance num">
                  {money(balance)}
                  <span className="unit">تومان</span>
                </div>
              </div>

              <div className="account-bottom">
                <div>
                  <div className="account-number">{maskCard(account.card)}</div>
                  <div className="tiny" style={{ color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
                    {fa(movementCount)} گردش ثبت‌شده
                  </div>
                </div>
                <div className="account-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="account-action"
                    title="انتقال از این حساب"
                    onClick={() => {
                      setSelectedId(account.id)
                      setTransferOpen(true)
                    }}
                  >
                    <ArrowLeftRight size={13} />
                  </button>
                  <button
                    className="account-action"
                    title="ویرایش"
                    onClick={() => {
                      setEditingAccount(account)
                      setAccountFormOpen(true)
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="account-action"
                    title="حذف"
                    onClick={() => removeAccount(account)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Card>
        <div className="card-head" style={{ paddingBottom: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="card-title">
              گردش حساب {selected ? `— ${selected.name}` : ''}
            </div>
            <div className="card-sub">
              {selected
                ? `افتتاحیه ${money(selected.opening)} تومان · موجودی فعلی ${money(accountBalance(selected.id, data))} تومان`
                : 'حسابی انتخاب نشده است'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SearchField value={query} onChange={setQuery} placeholder="جست‌وجو در گردش…" />
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="گردشی ثبت نشده"
            text="با ثبت فاکتور، دریافت، هزینه یا انتقال، گردش این حساب شکل می‌گیرد."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>شرح</th>
                    <th>نوع</th>
                    <th>واریز</th>
                    <th>برداشت</th>
                    <th>مانده</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((movement) => (
                    <tr key={`${movement.source}-${movement.id}-${movement.direction}`}>
                      <td className="num">{formatJalali(movement.date, 'numeric')}</td>
                      <td>
                        <div className="cell-main">{movement.title}</div>
                        <div className="cell-sub">{movement.subtitle}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {movement.source === 'payment'
                            ? 'پرداخت فاکتور'
                            : movement.source === 'expense'
                              ? 'هزینه'
                              : 'انتقال'}
                        </span>
                      </td>
                      <td>
                        {movement.direction === 'in' ? (
                          <span className="num money-in">{money(movement.amount)}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        {movement.direction === 'out' ? (
                          <span className="num money-out">{money(movement.amount)}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="num cell-main">{money(movement.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              onChange={setPage}
              total={filteredMovements.length}
              pageSize={pageSize}
            />
          </>
        )}
      </Card>

      <TransferModal
        open={transferOpen}
        defaultFrom={selected?.id}
        onClose={() => setTransferOpen(false)}
        onSubmit={(draft) => {
          const result = addTransfer(draft)
          if (!result.ok) {
            toast.error('انتقال انجام نشد', result.error)
            return
          }
          toast.success(
            'انتقال وجه ثبت شد',
            `${money(draft.amount)} تومان بین حساب‌ها جابه‌جا شد.`
          )
          setTransferOpen(false)
        }}
      />

      <AccountForm
        open={accountFormOpen}
        account={editingAccount}
        onClose={() => {
          setAccountFormOpen(false)
          setEditingAccount(null)
        }}
        onSubmit={(draft) => {
          saveAccount({ ...draft, id: editingAccount?.id })
          toast.success(editingAccount ? 'حساب ویرایش شد' : 'حساب جدید ساخته شد', draft.name)
          setAccountFormOpen(false)
          setEditingAccount(null)
        }}
      />
    </div>
  )
}

function TransferModal({
  open,
  defaultFrom,
  onClose,
  onSubmit
}: {
  open: boolean
  defaultFrom?: string
  onClose: () => void
  onSubmit: (draft: {
    fromId: string
    toId: string
    amount: number
    date: string
    note?: string
  }) => void
}): React.JSX.Element {
  const data = useApp()
  const [fromId, setFromId] = useState(defaultFrom ?? data.accounts[0]?.id ?? '')
  const [toId, setToId] = useState(
    data.accounts.find((account) => account.id !== defaultFrom && account.kind === 'cash')?.id ??
      data.accounts.find((account) => account.id !== defaultFrom)?.id ??
      ''
  )
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayIso())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const from = defaultFrom ?? data.accounts[0]?.id ?? ''
    setFromId(from)
    setToId(
      data.accounts.find((account) => account.id !== from && account.kind === 'cash')?.id ??
        data.accounts.find((account) => account.id !== from)?.id ??
        ''
    )
    setAmount(0)
    setDate(todayIso())
    setNote('')
    setError('')
  }, [open, defaultFrom, data.accounts])

  const sourceBalance = fromId ? accountBalance(fromId, data) : 0

  const submit = (): void => {
    if (!fromId || !toId) {
      setError('حساب مبدأ و مقصد را انتخاب کنید.')
      return
    }
    if (fromId === toId) {
      setError('حساب مبدأ و مقصد باید متفاوت باشند.')
      return
    }
    if (amount <= 0) {
      setError('مبلغ انتقال باید بیشتر از صفر باشد.')
      return
    }
    if (amount > sourceBalance) {
      setError('موجودی حساب مبدأ برای این انتقال کافی نیست.')
      return
    }
    onSubmit({ fromId, toId, amount: Math.round(amount), date, note: note.trim() || undefined })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="انتقال وجه"
      subtitle="جابه‌جایی وجه بین صندوق و حساب‌های بانکی، با ثبت خودکار سند."
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" icon={ArrowLeftRight} onClick={submit}>
            ثبت انتقال
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="از حساب" required>
          <select className="select" value={fromId} onChange={(event) => setFromId(event.target.value)}>
            {data.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)} — {compact(accountBalance(account.id, data))} تومان
              </option>
            ))}
          </select>
        </Field>
        <Field label="به حساب" required>
          <select className="select" value={toId} onChange={(event) => setToId(event.target.value)}>
            {data.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="مبلغ" required hint={`موجودی مبدأ: ${money(sourceBalance)} تومان`}>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <Field label="تاریخ">
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="توضیح" className="full">
          <input
            className="input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثلاً تأمین صندوق فروشگاه"
          />
        </Field>
      </div>
      {error ? <div className="field-error mt-1">{error}</div> : null}
    </Modal>
  )
}

function AccountForm({
  open,
  account,
  onClose,
  onSubmit
}: {
  open: boolean
  account: CashAccount | null
  onClose: () => void
  onSubmit: (draft: Omit<CashAccount, 'id' | 'createdAt'>) => void
}): React.JSX.Element {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'cash' | 'bank'>('bank')
  const [bank, setBank] = useState('')
  const [card, setCard] = useState('')
  const [iban, setIban] = useState('')
  const [opening, setOpening] = useState(0)
  const [color, setColor] = useState<AccountColor>('emerald')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(account?.name ?? '')
    setKind(account?.kind ?? 'bank')
    setBank(account?.bank ?? '')
    setCard(account?.card ?? '')
    setIban(account?.iban ?? '')
    setOpening(account?.opening ?? 0)
    setColor((account?.color as AccountColor) ?? 'emerald')
    setError('')
  }, [open, account])

  const submit = (): void => {
    if (!name.trim()) {
      setError('نام حساب را وارد کنید.')
      return
    }
    onSubmit({
      name: name.trim(),
      kind,
      bank: kind === 'bank' ? bank.trim() || undefined : undefined,
      card: kind === 'bank' ? card.replace(/\s/g, '') || undefined : undefined,
      iban: kind === 'bank' ? iban.trim() || undefined : undefined,
      opening: Math.round(opening),
      color
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account ? 'ویرایش حساب' : 'حساب جدید'}
      subtitle="صندوق نقدی یا حساب بانکی خود را اضافه کنید."
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" icon={Landmark} onClick={submit}>
            {account ? 'ذخیره تغییرات' : 'ساخت حساب'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="نوع حساب" required className="full">
          <div className="segmented" style={{ width: '100%' }}>
            <button
              className={clsx('segment', kind === 'cash' && 'active')}
              style={{ flex: 1 }}
              onClick={() => setKind('cash')}
            >
              صندوق نقدی
            </button>
            <button
              className={clsx('segment', kind === 'bank' && 'active')}
              style={{ flex: 1 }}
              onClick={() => setKind('bank')}
            >
              حساب بانکی
            </button>
          </div>
        </Field>
        <Field label="نام حساب" required>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={kind === 'bank' ? 'بانک ملت — جاری' : 'صندوق فروشگاه'}
            autoFocus
          />
        </Field>
        <Field label="موجودی افتتاحیه">
          <AmountInput value={opening} onChange={setOpening} />
        </Field>
        {kind === 'bank' ? (
          <>
            <Field label="نام بانک">
              <input
                className="input"
                value={bank}
                onChange={(event) => setBank(event.target.value)}
                placeholder="ملت، سامان، پاسارگاد…"
              />
            </Field>
            <Field label="شماره کارت">
              <input
                className="input ltr"
                value={card}
                onChange={(event) => setCard(event.target.value)}
                placeholder="6104 3378 …"
              />
            </Field>
            <Field label="شبا" className="full">
              <input
                className="input ltr"
                value={iban}
                onChange={(event) => setIban(event.target.value)}
                placeholder="IR…"
              />
            </Field>
          </>
        ) : null}
        <Field label="رنگ کارت" className="full">
          <div className="flex gap-2">
            {ACCOUNT_COLORS.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={item}
                onClick={() => setColor(item)}
                className={`account-card tone-${item}`}
                style={{
                  width: 44,
                  height: 44,
                  minHeight: 0,
                  borderRadius: 12,
                  padding: 0,
                  outline: color === item ? '2px solid var(--gold)' : 'none',
                  outlineOffset: 2
                }}
              />
            ))}
          </div>
        </Field>
      </div>
      {error ? <div className="field-error mt-1">{error}</div> : null}
      <div className="insight mt-2">
        <Building2 size={15} />
        <div>
          موجودی افتتاحیه به‌عنوان مانده اول دوره در سرمایه ثبت می‌شود و در گزارش‌ها لحاظ می‌گردد.
        </div>
      </div>
    </Modal>
  )
}
