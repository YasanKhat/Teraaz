import { Fragment, useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FilePlus2,
  Layers,
  Plus,
  Scale,
  Search,
  Trash2,
  X
} from 'lucide-react'
import clsx from 'clsx'
import { ACCOUNTS, ACCOUNT_GROUPS, ACCOUNT_MAP } from '../domain/catalogs'
import {
  accountBalances,
  balanceSheet,
  buildJournal,
  docCredit,
  docDebit,
  isBalanced,
  JOURNAL_KIND_LABELS,
  netBalance,
  trialBalance
} from '../domain/journal'
import type { JournalDoc, JournalKind, TrialRow } from '../domain/journal'
import { fiscalEnd, fiscalStart } from '../lib/period'
import { formatJalali, todayIso } from '../lib/jalali'
import { money } from '../lib/format'
import { fa } from '../lib/digits'
import { downloadCsv } from '../lib/export'
import { useApp } from '../store/useApp'
import { confirmAction, toast, useNav } from '../store/ui'
import type { ManualJournalLine } from '../domain/types'
import {
  AmountInput,
  Badge,
  Button,
  Card,
  DatePicker,
  Drawer,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pagination,
  SearchField,
  matchesSearch
} from '../components/kit'

type Tab = 'journal' | 'trial' | 'accounts'

export function JournalPage(): React.JSX.Element {
  const data = useApp()
  const addManualJournal = useApp((state) => state.addManualJournal)
  const deleteManualJournal = useApp((state) => state.deleteManualJournal)
  const createIntent = useNav((state) => state.create)
  const clearCreate = useNav((state) => state.clearCreate)

  const [tab, setTab] = useState<Tab>('journal')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | JournalKind>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [voucherOpen, setVoucherOpen] = useState(false)
  const [ledgerCode, setLedgerCode] = useState<string | null>(null)

  const today = todayIso()
  const docs = useMemo(() => buildJournal(data, today), [data, today])
  const totalDebit = docs.reduce((sum, doc) => sum + docDebit(doc), 0)
  const totalCredit = docs.reduce((sum, doc) => sum + docCredit(doc), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 2
  const fyStart = fiscalStart(data.settings.fiscalYear)
  const fyEnd = fiscalEnd(data.settings.fiscalYear)
  const sheet = useMemo(() => balanceSheet(docs, today), [docs, today])

  useEffect(() => {
    if (createIntent) {
      setVoucherOpen(true)
      clearCreate()
    }
  }, [createIntent, clearCreate])

  const filtered = useMemo(
    () =>
      docs
        .filter((doc) => (kind === 'all' ? true : doc.kind === kind))
        .filter((doc) => {
          if (!query.trim()) return true
          const accountNames = doc.lines.map((line) => line.name).join(' ')
          return matchesSearch(`${doc.no} ${doc.description} ${JOURNAL_KIND_LABELS[doc.kind]} ${accountNames}`, query)
        })
        .sort((a, b) => b.no - a.no),
    [docs, kind, query]
  )

  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [query, kind])

  const trial = useMemo(() => trialBalance(docs), [docs])
  const trialDebit = trial.reduce((sum, row) => sum + row.debit, 0)
  const trialCredit = trial.reduce((sum, row) => sum + row.credit, 0)
  const balances = useMemo(() => accountBalances(docs), [docs])

  const removeVoucher = async (doc: JournalDoc): Promise<void> => {
    if (!doc.manual || !doc.refId) return
    const confirmed = await confirmAction({
      title: 'حذف سند دستی',
      message: `سند ${fa(doc.no)} «${doc.description}» حذف شود؟ اسناد خودکار فاکتورها حذف نمی‌شوند.`,
      confirmLabel: 'حذف سند',
      danger: true
    })
    if (!confirmed) return
    deleteManualJournal(doc.refId)
    setExpanded(null)
    toast.success('سند دستی حذف شد')
  }

  const exportTrial = (): void => {
    const rows: (string | number)[][] = [['کد حساب', 'نام حساب', 'بدهکار', 'بستانکار', 'مانده']]
    for (const row of trial) {
      rows.push([row.code, row.name, row.debit, row.credit, row.balance])
    }
    downloadCsv(`taraz-trial-balance-${today.replaceAll('-', '')}.csv`, rows)
    toast.success('تراز آزمایشی خروجی گرفته شد')
  }

  return (
    <div className="page">
      <PageHeader
        title="دفتر روزنامه"
        subtitle="هر فروش، خرید، هزینه و پرداخت یک سند متوازن می‌سازد؛ دفتر شما همیشه تراز است."
        actions={
          <>
            <Badge tone={balanced ? 'success' : 'danger'} dot>
              {balanced ? 'دفتر تراز است' : 'عدم تراز'}
            </Badge>
            <Button variant="primary" icon={FilePlus2} onClick={() => setVoucherOpen(true)}>
              سند دستی جدید
            </Button>
          </>
        }
      />

      <div className="grid grid-4">
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">تعداد اسناد</span>
            <span className="kpi-icon">
              <BookOpen size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {fa(docs.length)}
            <span className="unit">سند</span>
          </div>
          <div className="kpi-foot">
            <span>شامل سند افتتاحیه</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">جمع بدهکار</span>
            <span className="kpi-icon blue">
              <Scale size={16} />
            </span>
          </div>
          <div className="kpi-value">{money(totalDebit)}</div>
          <div className="kpi-foot">
            <span>تومان در تمام اسناد</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">جمع بستانکار</span>
            <span className="kpi-icon gold">
              <Scale size={16} />
            </span>
          </div>
          <div className="kpi-value">{money(totalCredit)}</div>
          <div className="kpi-foot">
            <span>تومان در تمام اسناد</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">ترازنامه</span>
            <span className="kpi-icon violet">
              <Check size={16} />
            </span>
          </div>
          <div className="kpi-value" style={{ color: sheet.balanced ? 'var(--success)' : 'var(--danger)' }}>
            {sheet.balanced ? 'متوازن' : 'مغایرت'}
          </div>
          <div className="kpi-foot">
            <span>دارایی = بدهی + سرمایه</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-head" style={{ paddingBottom: 0, flexWrap: 'wrap' }}>
          <div className="tabs" style={{ borderBottom: 0 }}>
            {([
              { key: 'journal', label: 'دفتر روزنامه' },
              { key: 'trial', label: 'تراز آزمایشی' },
              { key: 'accounts', label: 'کدینگ حساب‌ها' }
            ] as { key: Tab; label: string }[]).map((item) => (
              <button
                key={item.key}
                className={clsx('chip', tab === item.key && 'active')}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="filter-group" style={{ paddingBottom: 12 }}>
            {tab === 'journal' ? (
              <>
                <SearchField value={query} onChange={setQuery} placeholder="شرح، شماره سند یا حساب…" />
                <select
                  className="select"
                  style={{ width: 150, height: 38 }}
                  value={kind}
                  onChange={(event) => setKind(event.target.value as 'all' | JournalKind)}
                >
                  <option value="all">همه انواع</option>
                  {Object.entries(JOURNAL_KIND_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            {tab === 'trial' ? (
              <Button variant="ghost" icon={Download} onClick={exportTrial}>
                خروجی CSV
              </Button>
            ) : null}
          </div>
        </div>

        {tab === 'journal' && (
          <div className="card-body" style={{ paddingTop: 8 }}>
            <div className="tiny muted mb-2" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge tone="neutral">سال مالی {fa(data.settings.fiscalYear)}</Badge>
              <span>
                دوره {formatJalali(fyStart, 'numeric')} تا {formatJalali(fyEnd, 'numeric')} · اسناد خودکار
                فاکتورها قابل ویرایش مستقیم نیستند.
              </span>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="سندی پیدا نشد"
                text="عبارت جست‌وجو یا نوع سند را تغییر دهید."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 120 }}>شماره سند</th>
                        <th>تاریخ</th>
                        <th>شرح</th>
                        <th>نوع</th>
                        <th>بدهکار</th>
                        <th>بستانکار</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((doc) => {
                        const open = expanded === doc.id
                        return (
                          <Fragment key={doc.id}>
                            <tr
                              key={doc.id}
                              className="clickable"
                              onClick={() => setExpanded(open ? null : doc.id)}
                            >
                              <td>
                                <span className="badge badge-neutral num">سند {fa(doc.no)}</span>
                              </td>
                              <td className="num">{formatJalali(doc.date, 'numeric')}</td>
                              <td>
                                <div className="cell-main">{doc.description}</div>
                                <div className="cell-sub">{fa(doc.lines.length)} ردیف</div>
                              </td>
                              <td>
                                <KindBadge kind={doc.kind} />
                              </td>
                              <td className="num cell-main">{money(docDebit(doc))}</td>
                              <td className="num cell-main">{money(docCredit(doc))}</td>
                              <td>
                                <span className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                                  {isBalanced(doc) ? (
                                    <Check size={13} className="text-success" />
                                  ) : (
                                    <X size={13} className="text-danger" />
                                  )}
                                  {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                              </td>
                            </tr>
                            {open ? (
                              <tr key={`${doc.id}-detail`}>
                                <td colSpan={7} style={{ padding: 0, background: 'var(--surface-2)' }}>
                                  <div style={{ padding: '8px 18px 16px' }}>
                                    <table className="table" style={{ fontSize: 11 }}>
                                      <thead>
                                        <tr>
                                          <th>کد / حساب</th>
                                          <th>توضیح</th>
                                          <th>بدهکار</th>
                                          <th>بستانکار</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {doc.lines.map((line, index) => (
                                          <tr key={`${line.code}-${index}`}>
                                            <td>
                                              <span className="num tiny muted">{line.code}</span>{' '}
                                              <span className="cell-main">{line.name}</span>
                                            </td>
                                            <td className="tiny muted">{line.description ?? '—'}</td>
                                            <td className="num">{line.debit ? money(line.debit) : '—'}</td>
                                            <td className="num">{line.credit ? money(line.credit) : '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    {doc.manual ? (
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="tiny muted">
                                          سند دستی — قابل حذف و بازسازی
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="danger"
                                          icon={Trash2}
                                          onClick={() => removeVoucher(doc)}
                                        >
                                          حذف سند
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="tiny muted mt-1">
                                        این سند به‌صورت خودکار از فاکتور یا پرداخت مرتبط ساخته شده است.
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
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
          </div>
        )}

        {tab === 'trial' && (
          <div className="card-body" style={{ paddingTop: 16 }}>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div>
                <div className="card-title">تراز آزمایشی</div>
                <div className="card-sub">جمع بدهکار و بستانکار همه حساب‌ها در تاریخ {formatJalali(today, 'medium')}</div>
              </div>
              <Badge tone={Math.abs(trialDebit - trialCredit) < 2 ? 'success' : 'danger'} dot>
                {Math.abs(trialDebit - trialCredit) < 2
                  ? 'تراز است'
                  : `مغایرت ${money(Math.abs(trialDebit - trialCredit))}`}
              </Badge>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>کد حساب</th>
                    <th>نام حساب</th>
                    <th>گردش بدهکار</th>
                    <th>گردش بستانکار</th>
                    <th>مانده</th>
                    <th>ماهیت</th>
                  </tr>
                </thead>
                <tbody>
                  {trial.map((row) => (
                    <tr
                      key={row.code}
                      className="clickable"
                      onClick={() => setLedgerCode(row.code)}
                    >
                      <td className="num">{row.code}</td>
                      <td className="cell-main">{row.name}</td>
                      <td className="num">{money(row.debit)}</td>
                      <td className="num">{money(row.credit)}</td>
                      <td className="num cell-main">{money(Math.abs(row.balance))}</td>
                      <td>
                        <span className={clsx('badge', row.balance >= 0 ? 'badge-info' : 'badge-violet')}>
                          {row.balance >= 0 ? 'بدهکار' : 'بستانکار'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-2" style={{ fontWeight: 700, fontSize: 12 }}>
              <span>جمع کل</span>
              <span className="num">
                بدهکار {money(trialDebit)} · بستانکار {money(trialCredit)}
              </span>
            </div>
          </div>
        )}

        {tab === 'accounts' && (
          <div className="card-body" style={{ paddingTop: 16 }}>
            <div className="tiny muted mb-2">
              روی هر حساب کلیک کنید تا دفتر معین آن را ببینید. مانده‌ها بر مبنای تمام اسناد تا امروز است.
            </div>
            <div className="grid grid-2">
              {ACCOUNT_GROUPS.map((group) => (
                <div
                  key={group.label}
                  className="card"
                  style={{ boxShadow: 'none', borderRadius: 16 }}
                >
                  <div className="card-pad" style={{ paddingBottom: 10 }}>
                    <div className="flex items-center justify-between">
                      <div className="card-title">{group.label}</div>
                      <Layers size={15} className="muted" />
                    </div>
                  </div>
                  <div className="card-body" style={{ paddingTop: 0 }}>
                    {group.accounts.map((account) => {
                      const balance = netBalance(balances.get(account.code))
                      return (
                        <button
                          key={account.code}
                          className="report-row"
                          style={{ width: '100%', background: 'none', borderInline: 0, borderTop: 0, cursor: 'pointer', textAlign: 'start' }}
                          onClick={() => setLedgerCode(account.code)}
                        >
                          <span className="flex items-center gap-2">
                            <span className="num tiny muted">{account.code}</span>
                            <span className="r-name">{account.name}</span>
                          </span>
                          <span
                            className="r-amount"
                            style={{ color: balance === 0 ? 'var(--muted)' : balance > 0 ? 'var(--info)' : 'var(--violet)' }}
                          >
                            {money(Math.abs(balance))}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <VoucherModal
        open={voucherOpen}
        onClose={() => setVoucherOpen(false)}
        onSave={(draft) => {
          const result = addManualJournal(draft)
          if (!result.ok) {
            toast.error('ثبت سند انجام نشد', result.error)
            return
          }
          toast.success('سند دستی ثبت شد', draft.description)
          setVoucherOpen(false)
        }}
      />

      <LedgerDrawer code={ledgerCode} docs={docs} onClose={() => setLedgerCode(null)} />
    </div>
  )
}

function KindBadge({ kind }: { kind: JournalKind }): React.JSX.Element {
  const tone =
    kind === 'sale'
      ? 'success'
      : kind === 'purchase'
        ? 'gold'
        : kind === 'expense'
          ? 'danger'
          : kind === 'manual'
            ? 'violet'
            : kind === 'opening'
              ? 'info'
              : 'neutral'
  return (
    <Badge tone={tone as 'success'} dot>
      {JOURNAL_KIND_LABELS[kind]}
    </Badge>
  )
}

function VoucherModal({
  open,
  onClose,
  onSave
}: {
  open: boolean
  onClose: () => void
  onSave: (draft: {
    date: string
    description: string
    lines: ManualJournalLine[]
  }) => void
}): React.JSX.Element {
  const [date, setDate] = useState(todayIso())
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<ManualJournalLine[]>([
    { id: '1', code: '1101', debit: 0, credit: 0, description: '' },
    { id: '2', code: '4102', debit: 0, credit: 0, description: '' }
  ])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(todayIso())
    setDescription('')
    setLines([
      { id: Math.random().toString(36).slice(2, 8), code: '1101', debit: 0, credit: 0, description: '' },
      { id: Math.random().toString(36).slice(2, 8), code: '4102', debit: 0, credit: 0, description: '' }
    ])
    setError('')
  }, [open])

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)
  const difference = totalDebit - totalCredit
  const isBalancedVoucher = Math.abs(difference) < 1 && totalDebit > 0

  const update = (id: string, patch: Partial<ManualJournalLine>): void => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  const autoBalance = (): void => {
    if (Math.abs(difference) < 1) return
    setLines((current) => [
      ...current,
      {
        id: Math.random().toString(36).slice(2, 8),
        code: difference > 0 ? '4102' : '6199',
        debit: difference < 0 ? -difference : 0,
        credit: difference > 0 ? difference : 0,
        description: 'ردیف تراز خودکار'
      }
    ])
  }

  const submit = (): void => {
    if (!description.trim()) {
      setError('شرح سند را وارد کنید.')
      return
    }
    const prepared = lines.filter((line) => line.debit > 0 || line.credit > 0)
    if (prepared.length < 2) {
      setError('سند باید حداقل دو ردیف با مبلغ داشته باشد.')
      return
    }
    if (!isBalancedVoucher) {
      setError(`سند تراز نیست؛ اختلاف ${money(Math.abs(difference))} تومان است.`)
      return
    }
    onSave({ date, description: description.trim(), lines: prepared })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="سند دستی جدید"
      subtitle="برای ثبت اصلاحات، افتتاحیه یا رویدادهایی که فاکتور ندارند."
      size="xwide"
      footer={
        <>
          <div className="tiny muted">
            بدهکار {money(totalDebit)} · بستانکار {money(totalCredit)}
            {Math.abs(difference) > 0 ? (
              <span className="text-danger"> · اختلاف {money(Math.abs(difference))}</span>
            ) : null}
          </div>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" icon={FilePlus2} onClick={submit} disabled={!isBalancedVoucher}>
            ثبت سند
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="شرح سند" required className="full">
          <input
            className="input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="مثلاً ثبت استهلاک تجهیزات نمایشگاه"
            autoFocus
          />
        </Field>
        <Field label="تاریخ">
          <DatePicker value={date} onChange={setDate} />
        </Field>
      </div>

      <div className="form-section-title" style={{ marginTop: 18 }}>
        ردیف‌های سند
      </div>

      <div className="voucher-lines">
        <div className="voucher-head">
          <span>حساب</span>
          <span>توضیح</span>
          <span>بدهکار</span>
          <span>بستانکار</span>
          <span />
        </div>
        {lines.map((line) => (
          <div className="voucher-row" key={line.id}>
            <select
              className="select"
              value={line.code}
              onChange={(event) => update(line.id, { code: event.target.value })}
            >
              {ACCOUNT_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.accounts.map((account) => (
                    <option key={account.code} value={account.code}>
                      {account.code} — {account.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input
              className="input"
              value={line.description ?? ''}
              onChange={(event) => update(line.id, { description: event.target.value })}
              placeholder="اختیاری"
            />
            <AmountInput
              value={line.debit}
              onChange={(value) => update(line.id, { debit: value, credit: value > 0 ? 0 : line.credit })}
              suffix=""
            />
            <AmountInput
              value={line.credit}
              onChange={(value) => update(line.id, { credit: value, debit: value > 0 ? 0 : line.debit })}
              suffix=""
            />
            <button
              className="icon-btn sm ghost"
              onClick={() =>
                setLines((current) =>
                  current.length <= 2 ? current : current.filter((item) => item.id !== line.id)
                )
              }
              aria-label="حذف ردیف"
              style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <div className="voucher-foot">
          <Button
            variant="soft"
            size="sm"
            icon={Plus}
            onClick={() =>
              setLines((current) => [
                ...current,
                {
                  id: Math.random().toString(36).slice(2, 8),
                  code: '1101',
                  debit: 0,
                  credit: 0,
                  description: ''
                }
              ])
            }
          >
            افزودن ردیف
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Scale}
            onClick={autoBalance}
            disabled={Math.abs(difference) < 1}
          >
            تراز خودکار
          </Button>
          <span className="spacer" />
          <Badge tone={isBalancedVoucher ? 'success' : 'warning'} dot>
            {isBalancedVoucher ? 'سند متوازن است' : `اختلاف ${money(Math.abs(difference))}`}
          </Badge>
        </div>
      </div>

      {error ? <div className="field-error mt-1">{error}</div> : null}
    </Modal>
  )
}

function LedgerDrawer({
  code,
  docs,
  onClose
}: {
  code: string | null
  docs: JournalDoc[]
  onClose: () => void
}): React.JSX.Element {
  const account = code ? ACCOUNT_MAP[code] : undefined
  const rows: {
    id: string
    date: string
    description: string
    docNo: number
    descriptionLine?: string
    debit: number
    credit: number
    balance: number
  }[] = []

  if (code) {
    let running = 0
    for (const doc of docs) {
      for (const line of doc.lines) {
        if (line.code !== code) continue
        running += line.debit - line.credit
        rows.push({
          id: `${doc.id}-${rows.length}`,
          date: doc.date,
          description: doc.description,
          docNo: doc.no,
          descriptionLine: line.description,
          debit: line.debit,
          credit: line.credit,
          balance: running
        })
      }
    }
  }

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0)
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0)

  return (
    <Drawer
      open={Boolean(code)}
      onClose={onClose}
      title={account ? account.name : ''}
      subtitle={account ? `کد حساب ${account.code} · ${account.group}` : ''}
      footer={
        account ? (
          <>
            <span className="tiny muted">
              گردش بدهکار {money(totalDebit)} · گردش بستانکار {money(totalCredit)}
            </span>
            <span className="spacer" />
            <Badge tone={totalDebit - totalCredit >= 0 ? 'info' : 'violet'} dot>
              مانده {money(Math.abs(totalDebit - totalCredit))} {totalDebit - totalCredit >= 0 ? 'بدهکار' : 'بستانکار'}
            </Badge>
          </>
        ) : null
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={Search} title="گردشی برای این حساب نیست" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>شرح</th>
                <th>بدهکار</th>
                <th>بستانکار</th>
                <th>مانده</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((row) => (
                <tr key={row.id}>
                  <td className="num">
                    {formatJalali(row.date, 'numeric')}
                    <div className="cell-sub">سند {fa(row.docNo)}</div>
                  </td>
                  <td>
                    <div className="cell-main">{row.description}</div>
                    {row.descriptionLine ? <div className="cell-sub">{row.descriptionLine}</div> : null}
                  </td>
                  <td className="num">{row.debit ? money(row.debit) : '—'}</td>
                  <td className="num">{row.credit ? money(row.credit) : '—'}</td>
                  <td className="num cell-main">{money(Math.abs(row.balance))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Drawer>
  )
}
