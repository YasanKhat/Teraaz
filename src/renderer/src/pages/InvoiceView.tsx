import { useState } from 'react'
import type * as React from 'react'
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  FileQuestion,
  Printer,
  Receipt,
  Trash2
} from 'lucide-react'
import {
  accountLabel,
  contactOf,
  invoiceRemaining,
  invoiceStatus,
  invoiceTotals,
  paidForInvoice,
  STATUS_META
} from '../domain/calc'
import { invoiceNoLabel } from '../domain/journal'
import { PAYMENT_METHOD_LABELS } from '../domain/catalogs'
import { amountInWords, money } from '../lib/format'
import { fa } from '../lib/digits'
import { formatJalali } from '../lib/jalali'
import { useApp } from '../store/useApp'
import { confirmAction, toast, useNav } from '../store/ui'
import { Badge, Button, EmptyState } from '../components/kit'
import { LogoMark } from '../components/Logo'
import { PaymentModal } from '../components/PaymentModal'
import { InvoiceStatusBadge } from '../components/InvoiceStatus'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: '#e3f2e9', color: '#2c7655' },
  partial: { bg: '#fbf0da', color: '#a96f1f' },
  overdue: { bg: '#f9e6e3', color: '#b4453a' },
  open: { bg: '#f1efe9', color: '#6e7b74' }
}

export function InvoiceView(): React.JSX.Element {
  const data = useApp()
  const id = useNav((state) => state.id)
  const navigate = useNav((state) => state.navigate)
  const deleteInvoice = useApp((state) => state.deleteInvoice)
  const deletePayment = useApp((state) => state.deletePayment)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const invoice = data.invoices.find((item) => item.id === id)
  const backPage = invoice?.kind === 'purchase' ? 'purchases' : 'sales'

  if (!invoice) {
    return (
      <div className="page">
        <EmptyState
          icon={FileQuestion}
          title="فاکتور پیدا نشد"
          text="ممکن است حذف شده باشد یا نشانی آن معتبر نباشد."
          action={
            <Button variant="primary" icon={ArrowRight} onClick={() => navigate('sales')}>
              بازگشت به فروش
            </Button>
          }
        />
      </div>
    )
  }

  const contact = contactOf(data, invoice.contactId)
  const totals = invoiceTotals(invoice)
  const paid = paidForInvoice(invoice.id, data.payments)
  const remaining = invoiceRemaining(invoice, data.payments)
  const statusKey = invoiceStatus(invoice, data.payments)
  const statusMeta = STATUS_META[statusKey]
  const statusColors = STATUS_COLORS[statusKey]
  const payments = data.payments
    .filter((payment) => payment.invoiceId === invoice.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const isSale = invoice.kind === 'sale'
  const trackingCode = `TZ-${invoice.date.replaceAll('-', '')}-${invoice.no}`

  const removeInvoice = async (): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'حذف فاکتور',
      message: `فاکتور ${invoiceNoLabel(invoice)} و پرداخت‌های مرتبط حذف شود؟`,
      confirmLabel: 'حذف فاکتور',
      danger: true
    })
    if (!confirmed) return
    deleteInvoice(invoice.id)
    toast.success('فاکتور حذف شد', invoiceNoLabel(invoice))
    navigate(backPage)
  }

  const removePayment = async (paymentId: string, amount: number): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'حذف پرداخت',
      message: `پرداخت ${money(amount)} تومانی حذف شود؟ مانده فاکتور و گزارش‌ها به‌روز می‌شود.`,
      confirmLabel: 'حذف پرداخت',
      danger: true
    })
    if (!confirmed) return
    deletePayment(paymentId)
    toast.success('پرداخت حذف شد')
  }

  return (
    <div className="page">
      <div className="page-head no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={ArrowRight} onClick={() => navigate(backPage)}>
            بازگشت
          </Button>
          <div>
            <div className="page-title" style={{ fontSize: 22 }}>
              فاکتور {invoiceNoLabel(invoice)}
            </div>
            <div className="page-sub">
              {contact?.name ?? 'طرف‌حساب'} · {formatJalali(invoice.date, 'medium')}
            </div>
          </div>
          <InvoiceStatusBadge invoice={invoice} payments={data.payments} />
        </div>
        <div className="page-actions">
          <Button variant="ghost" icon={Printer} onClick={() => window.print()}>
            چاپ / PDF
          </Button>
          <Button
            variant="soft"
            icon={Banknote}
            disabled={remaining <= 0}
            onClick={() => setPaymentOpen(true)}
          >
            ثبت پرداخت
          </Button>
          <Button variant="danger" icon={Trash2} onClick={removeInvoice}>
            حذف
          </Button>
        </div>
      </div>

      <div className="invoice-screen">
        <div className="invoice-paper print-root" id="invoice-print">
          <div className="invoice-head">
            <div className="invoice-brand">
              <div className="logo">
                <LogoMark size={29} />
              </div>
              <div>
                <div className="invoice-company">{data.settings.company.name}</div>
                <div className="invoice-company-sub">
                  {data.settings.company.address}
                  <br />
                  {data.settings.company.phone} · {data.settings.company.email}
                  {data.settings.company.taxId ? ` · شناسه مالیاتی ${data.settings.company.taxId}` : ''}
                </div>
              </div>
            </div>
            <div className="invoice-title-block">
              <div className="invoice-kind">{isSale ? 'فاکتور فروش' : 'فاکتور خرید'}</div>
              <div className="invoice-no">شماره {invoiceNoLabel(invoice)}</div>
              <div
                className="invoice-state"
                style={{
                  background: statusColors.bg,
                  color: statusColors.color,
                  padding: '3px 12px',
                  borderRadius: 99,
                  fontSize: 9.5,
                  fontWeight: 700
                }}
              >
                {statusMeta.label}
              </div>
            </div>
          </div>

          <div className="invoice-info">
            <div>
              <div className="invoice-info-label">{isSale ? 'صادرشده برای' : 'خریداری‌شده از'}</div>
              <div className="invoice-info-name">{contact?.name ?? '—'}</div>
              <div className="invoice-info-line">
                {contact?.company ? `${contact.company} · ` : ''}
                {contact?.city ?? ''}
                {contact?.address ? `، ${contact.address}` : ''}
                {contact?.phone ? <><br />{contact.phone}</> : null}
                {contact?.email ? <><br />{contact.email}</> : null}
              </div>
            </div>
            <div className="invoice-meta-grid">
              <div className="invoice-meta-item">
                <div className="m-label">تاریخ صدور</div>
                <div className="m-value num">{formatJalali(invoice.date, 'numeric')}</div>
              </div>
              <div className="invoice-meta-item">
                <div className="m-label">سرسید</div>
                <div className="m-value num">{formatJalali(invoice.dueDate, 'numeric')}</div>
              </div>
              <div className="invoice-meta-item">
                <div className="m-label">تعداد اقلام</div>
                <div className="m-value num">{fa(invoice.lines.length)} ردیف</div>
              </div>
              <div className="invoice-meta-item">
                <div className="m-label">کد پیگیری</div>
                <div className="m-value num" style={{ direction: 'ltr' }}>{trackingCode}</div>
              </div>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}>#</th>
                <th>شرح کالا / خدمت</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>تخفیف</th>
                <th style={{ textAlign: 'end' }}>مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, index) => (
                <tr key={line.id}>
                  <td className="num muted">{fa(index + 1)}</td>
                  <td>
                    <div className="strong">{line.title}</div>
                  </td>
                  <td className="num">{fa(line.qty)}</td>
                  <td className="num">{money(line.price)}</td>
                  <td className="num">{line.discountPct ? `${fa(line.discountPct)}٪` : '—'}</td>
                  <td className="num strong" style={{ textAlign: 'end' }}>
                    {money(Math.round(line.qty * line.price * (1 - line.discountPct / 100)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-summary">
            <div>
              <div className="invoice-note">
                <b>توضیحات: </b>
                {invoice.note ?? 'شرایط پرداخت طبق توافق طرفین است.'}
                <br />
                <b>تسویه: </b>
                {paid > 0
                  ? `${money(paid)} تومان پرداخت شده و مانده ${money(remaining)} تومان است.`
                  : 'هنوز پرداختی ثبت نشده است.'}
              </div>
              <div className="invoice-words">
                مبلغ به حروف: {amountInWords(totals.total, data.settings.currency)}
              </div>
              {payments.length > 0 ? (
                <div className="invoice-payments">
                  <div className="invoice-payments-title">سابقهٔ پرداخت‌ها</div>
                  {payments.map((payment) => (
                    <div className="payment-mini" key={payment.id}>
                      <span>
                        {formatJalali(payment.date, 'numeric')} ·{' '}
                        {PAYMENT_METHOD_LABELS[payment.method]} ·{' '}
                        {accountLabel(data.accounts.find((a) => a.id === payment.accountId) ?? data.accounts[0])}
                      </span>
                      <span className="num" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {money(payment.amount)}
                        <button
                          className="no-print"
                          onClick={() => removePayment(payment.id, payment.amount)}
                          style={{
                            border: 0,
                            background: 'transparent',
                            color: '#b4453a',
                            cursor: 'pointer',
                            display: 'inline-grid',
                            padding: 0
                          }}
                          title="حذف پرداخت"
                        >
                          <Trash2 size={10} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="invoice-totals">
              <div className="t-row">
                <span>جمع اقلام</span>
                <span>{money(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 ? (
                <div className="t-row">
                  <span>تخفیف</span>
                  <span>({money(totals.discount)})</span>
                </div>
              ) : null}
              <div className="t-row">
                <span>مبلغ مشمول مالیات</span>
                <span>{money(totals.taxable)}</span>
              </div>
              <div className="t-row">
                <span>مالیات بر ارزش افزوده ({fa(invoice.taxRate)}٪)</span>
                <span>{money(totals.tax)}</span>
              </div>
              <div className="t-row grand">
                <span>مبلغ کل</span>
                <span>{money(totals.total)} {data.settings.currency}</span>
              </div>
              {paid > 0 ? (
                <>
                  <div className="t-row">
                    <span>پرداخت‌شده</span>
                    <span>{money(paid)}</span>
                  </div>
                  <div className="t-row" style={{ fontWeight: 700 }}>
                    <span>مانده</span>
                    <span>{money(remaining)}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="invoice-signatures">
            <div className="signature">مهر و امضای فروشنده</div>
            <div className="signature">امضای خریدار</div>
          </div>

          <div className="invoice-stamp">
            <b>تراز</b>
            <span>سند معتبر</span>
            <span>{invoiceNoLabel(invoice)}</span>
          </div>

          <div className="invoice-foot-note">
            <span>
              این فاکتور با «تراز — دفتر هوشمند کسب‌وکار» صادر شده است. · کد پیگیری {trackingCode}
            </span>
            <span>{data.settings.company.name}</span>
          </div>
        </div>
      </div>

      <div className="no-print flex items-center justify-center gap-2 tiny muted">
        <CheckCircle2 size={13} />
        برای ذخیره به‌صورت PDF از گزینهٔ «چاپ / PDF» استفاده کنید.
      </div>

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} invoice={invoice} />
    </div>
  )
}
