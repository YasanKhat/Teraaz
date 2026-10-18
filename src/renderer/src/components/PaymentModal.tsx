import { useEffect, useState } from 'react'
import type * as React from 'react'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Wallet } from 'lucide-react'
import {
  accountLabel,
  contactOf,
  invoiceRemaining,
  invoiceTotals,
  paidForInvoice
} from '../domain/calc'
import { invoiceNoLabel } from '../domain/journal'
import { PAYMENT_METHOD_LABELS } from '../domain/catalogs'
import { todayIso } from '../lib/jalali'
import { money } from '../lib/format'
import { fa } from '../lib/digits'
import { useApp } from '../store/useApp'
import { toast } from '../store/ui'
import type { Invoice, PaymentMethod } from '../domain/types'
import { AmountInput, Button, DatePicker, Field, Modal } from './kit'

export function PaymentModal({
  invoice,
  open,
  onClose
}: {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
}): React.JSX.Element {
  const data = useApp()
  const addPayment = useApp((state) => state.addPayment)

  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayIso())
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? '')
  const [method, setMethod] = useState<PaymentMethod>('transfer')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !invoice) return
    setAmount(invoiceRemaining(invoice, data.payments))
    setDate(todayIso())
    setAccountId(data.accounts.find((account) => account.kind === 'bank')?.id ?? data.accounts[0]?.id ?? '')
    setMethod('transfer')
    setNote('')
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id])

  if (!invoice) {
    return <Modal open={false} onClose={onClose} title="ثبت پرداخت">{null}</Modal>
  }

  const totals = invoiceTotals(invoice)
  const paid = paidForInvoice(invoice.id, data.payments)
  const remaining = invoiceRemaining(invoice, data.payments)
  const contact = contactOf(data, invoice.contactId)
  const isSale = invoice.kind === 'sale'

  const submit = (): void => {
    if (amount <= 0) {
      setError('مبلغ پرداخت باید بیشتر از صفر باشد.')
      return
    }
    if (amount > remaining) {
      setError('مبلغ پرداخت نمی‌تواند از مانده فاکتور بیشتر باشد.')
      return
    }
    if (!accountId) {
      setError('یک حساب برای ثبت پرداخت انتخاب کنید.')
      return
    }
    addPayment({
      invoiceId: invoice.id,
      contactId: invoice.contactId,
      direction: isSale ? 'in' : 'out',
      amount: Math.round(amount),
      date,
      accountId,
      method,
      note: note.trim() || undefined
    })
    toast.success(
      isSale ? 'دریافت با موفقیت ثبت شد' : 'پرداخت با موفقیت ثبت شد',
      `${money(amount)} تومان در فاکتور ${invoiceNoLabel(invoice)}`
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSale ? 'ثبت دریافت وجه' : 'ثبت پرداخت وجه'}
      subtitle={`فاکتور ${invoiceNoLabel(invoice)} · ${contact?.name ?? ''}`}
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button
            variant={remaining === 0 ? 'soft' : 'primary'}
            icon={isSale ? ArrowDownLeft : ArrowUpRight}
            onClick={submit}
            disabled={remaining === 0}
          >
            {isSale ? 'ثبت دریافت' : 'ثبت پرداخت'}
          </Button>
        </>
      }
    >
      {remaining === 0 ? (
        <div className="insight" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={16} />
          <div>این فاکتور به‌طور کامل تسویه شده است.</div>
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 18
        }}
      >
        <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
          <div className="tiny muted">مبلغ فاکتور</div>
          <div className="num strong" style={{ fontSize: 14, marginTop: 2 }}>
            {money(totals.total)}
          </div>
        </div>
        <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
          <div className="tiny muted">پرداخت‌شده</div>
          <div className="num strong text-success" style={{ fontSize: 14, marginTop: 2 }}>
            {money(paid)}
          </div>
        </div>
        <div className="card-pad" style={{ background: 'var(--accent-soft)', borderRadius: 14, border: '1px solid var(--accent-line)' }}>
          <div className="tiny muted">مانده</div>
          <div className="num strong text-accent" style={{ fontSize: 14, marginTop: 2 }}>
            {money(remaining)}
          </div>
        </div>
      </div>

      <div className="form-grid">
        <Field label="مبلغ پرداخت" required hint="حداکثر معادل مانده فاکتور">
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <Field label="تاریخ">
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="حساب دریافت / پرداخت" required>
          <select className="select" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {data.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="روش پرداخت">
          <select
            className="select"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="توضیح" className="full">
          <textarea
            className="textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثلاً شماره پیگیری یا توضیح دریافت…"
          />
        </Field>
      </div>

      {error ? (
        <div className="field-error" style={{ marginTop: 10 }}>
          {error}
        </div>
      ) : null}

      <div className="tiny muted" style={{ marginTop: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Wallet size={13} />
        مانده فعلی فاکتور: {money(remaining)} {data.settings.currency} · {fa(data.payments.filter((p) => p.invoiceId === invoice.id).length)} پرداخت ثبت‌شده
      </div>
    </Modal>
  )
}
