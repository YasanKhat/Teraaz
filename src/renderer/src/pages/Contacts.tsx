import { useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
  UserRound,
  Users,
  Wallet
} from 'lucide-react'
import clsx from 'clsx'
import {
  contactBalance,
  contactInvoiceCount,
  invoiceRemaining,
  invoiceTotals
} from '../domain/calc'
import { invoiceNoLabel } from '../domain/journal'
import { formatJalali } from '../lib/jalali'
import { compact, money } from '../lib/format'
import { fa } from '../lib/digits'
import { useApp } from '../store/useApp'
import { confirmAction, toast, useNav } from '../store/ui'
import type { Contact, ContactKind } from '../domain/types'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SearchField,
  matchesSearch
} from '../components/kit'
import { InvoiceStatusBadge } from '../components/InvoiceStatus'

type Tab = 'all' | ContactKind

export function ContactsPage(): React.JSX.Element {
  const data = useApp()
  const saveContact = useApp((state) => state.saveContact)
  const deleteContact = useApp((state) => state.deleteContact)
  const navigate = useNav((state) => state.navigate)
  const createIntent = useNav((state) => state.create)
  const clearCreate = useNav((state) => state.clearCreate)

  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [detail, setDetail] = useState<Contact | null>(null)

  useEffect(() => {
    if (createIntent) {
      setEditing(null)
      setFormOpen(true)
      clearCreate()
    }
  }, [createIntent, clearCreate])

  const filtered = useMemo(() => {
    return data.contacts
      .filter((contact) => (tab === 'all' ? true : contact.kind === tab))
      .filter((contact) =>
        matchesSearch(
          `${contact.name} ${contact.company ?? ''} ${contact.phone} ${contact.city ?? ''} ${contact.email ?? ''}`,
          query
        )
      )
      .sort((a, b) => contactBalance(b.id, data) - contactBalance(a.id, data))
  }, [data, tab, query])

  const customers = data.contacts.filter((contact) => contact.kind === 'customer')
  const suppliers = data.contacts.filter((contact) => contact.kind === 'supplier')
  const receivables = data.invoices
    .filter((invoice) => invoice.kind === 'sale')
    .reduce((sum, invoice) => sum + invoiceRemaining(invoice, data.payments), 0)
  const payables = data.invoices
    .filter((invoice) => invoice.kind === 'purchase')
    .reduce((sum, invoice) => sum + invoiceRemaining(invoice, data.payments), 0)

  const remove = async (contact: Contact): Promise<void> => {
    const confirmed = await confirmAction({
      title: 'حذف طرف‌حساب',
      message: `«${contact.name}» حذف شود؟ اگر فاکتور مرتبط داشته باشد، حذف انجام نمی‌شود.`,
      confirmLabel: 'حذف',
      danger: true
    })
    if (!confirmed) return
    const result = deleteContact(contact.id)
    if (!result.ok) {
      toast.error('حذف انجام نشد', result.error)
      return
    }
    if (detail?.id === contact.id) setDetail(null)
    toast.success('طرف‌حساب حذف شد', contact.name)
  }

  return (
    <div className="page">
      <PageHeader
        title="طرف‌حساب‌ها"
        subtitle="مشتریان و تأمین‌کنندگان، مانده حساب و سابقهٔ همکاری — همه در یک دفتر زنده."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            طرف‌حساب جدید
          </Button>
        }
      />

      <div className="grid grid-4">
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">مشتریان</span>
            <span className="kpi-icon">
              <UserRound size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {fa(customers.length)}
            <span className="unit">نفر</span>
          </div>
          <div className="kpi-foot">
            <span>{compact(receivables)} تومان مطالبات باز</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">تأمین‌کنندگان</span>
            <span className="kpi-icon gold">
              <Building2 size={16} />
            </span>
          </div>
          <div className="kpi-value">
            {fa(suppliers.length)}
            <span className="unit">مجموعه</span>
          </div>
          <div className="kpi-foot">
            <span>{compact(payables)} تومان بدهی باز</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">مطالبات از مشتریان</span>
            <span className="kpi-icon blue">
              <Receipt size={16} />
            </span>
          </div>
          <div className="kpi-value text-success">{compact(receivables)}</div>
          <div className="kpi-foot">
            <span>مانده فاکتورهای فروش</span>
          </div>
        </Card>
        <Card className="kpi hover-lift">
          <div className="kpi-top">
            <span className="kpi-label">بدهی به تأمین‌کنندگان</span>
            <span className="kpi-icon violet">
              <ShoppingBag size={16} />
            </span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--gold)' }}>
            {compact(payables)}
          </div>
          <div className="kpi-foot">
            <span>مانده فاکتورهای خرید</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-head" style={{ paddingBottom: 14, flexWrap: 'wrap' }}>
          <div className="tabs" style={{ borderBottom: 0, gap: 6 }}>
            {([
              { key: 'all', label: 'همه', count: data.contacts.length },
              { key: 'customer', label: 'مشتریان', count: customers.length },
              { key: 'supplier', label: 'تأمین‌کنندگان', count: suppliers.length }
            ] as { key: Tab; label: string; count: number }[]).map((item) => (
              <button
                key={item.key}
                className={clsx('chip', tab === item.key && 'active')}
                onClick={() => setTab(item.key)}
              >
                {item.label}
                <span className="count">{fa(item.count)}</span>
              </button>
            ))}
          </div>
          <SearchField value={query} onChange={setQuery} placeholder="نام، شرکت یا شماره تماس…" />
        </div>

        <div className="card-body" style={{ paddingTop: 4 }}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="طرف‌حسابی پیدا نشد"
              text="عبارت جست‌وجو را تغییر دهید یا یک طرف‌حساب جدید بسازید."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setFormOpen(true)}>
                  طرف‌حساب جدید
                </Button>
              }
            />
          ) : (
            <div className="grid grid-3">
              {filtered.map((contact) => {
                const balance = contactBalance(contact.id, data)
                const isCustomer = contact.kind === 'customer'
                const count = contactInvoiceCount(contact.id, data)
                return (
                  <div
                    key={contact.id}
                    className="card contact-card hover-lift"
                    onClick={() => setDetail(contact)}
                  >
                    <div className="contact-top">
                      <Avatar name={contact.name} size="lg" gold={!isCustomer} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="contact-name">{contact.name}</div>
                        <div className="contact-meta">
                          <Phone size={10} />
                          <span className="ltr" style={{ direction: 'ltr' }}>
                            {fa(contact.phone)}
                          </span>
                        </div>
                        {contact.company ? (
                          <div className="contact-company mt-1">{contact.company}</div>
                        ) : null}
                      </div>
                      <Badge tone={isCustomer ? 'accent' : 'gold'} dot>
                        {isCustomer ? 'مشتری' : 'تأمین‌کننده'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 tiny muted">
                      {contact.city ? (
                        <span className="inline-note">
                          <MapPin size={11} /> {contact.city}
                        </span>
                      ) : null}
                      {contact.email ? (
                        <span className="inline-note" style={{ minWidth: 0 }}>
                          <Mail size={11} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.email}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="contact-foot">
                      <div>
                        <div className="contact-balance-label">
                          {isCustomer ? 'طلب از این مشتری' : 'بدهی به این تأمین‌کننده'}
                        </div>
                        <div
                          className="contact-balance num"
                          style={{
                            color:
                              balance > 0
                                ? isCustomer
                                  ? 'var(--success)'
                                  : 'var(--gold)'
                                : 'var(--muted)'
                          }}
                        >
                          {money(Math.abs(balance))}
                          <span className="tiny muted" style={{ fontWeight: 400, marginInlineStart: 4 }}>
                            تومان
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'end' }}>
                        <div className="tiny muted">{fa(count)} فاکتور</div>
                        <div className="flex gap-1 mt-1" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn sm ghost"
                            title="ویرایش"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditing(contact)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="icon-btn sm ghost"
                            title="حذف"
                            style={{ color: 'var(--danger)' }}
                            onClick={(event) => {
                              event.stopPropagation()
                              remove(contact)
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <ContactForm
        open={formOpen}
        contact={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={(draft) => {
          saveContact({ ...draft, id: editing?.id })
          toast.success(editing ? 'طرف‌حساب ویرایش شد' : 'طرف‌حساب جدید ساخته شد', draft.name)
          setFormOpen(false)
          setEditing(null)
        }}
      />

      <ContactDetailDrawer
        contact={detail}
        onClose={() => setDetail(null)}
        onEdit={(contact) => {
          setEditing(contact)
          setFormOpen(true)
          setDetail(null)
        }}
        onDelete={remove}
        onInvoice={(id) => navigate('invoice', { id })}
      />
    </div>
  )
}

function ContactForm({
  open,
  contact,
  onClose,
  onSave
}: {
  open: boolean
  contact: Contact | null
  onClose: () => void
  onSave: (draft: Omit<Contact, 'id' | 'createdAt'>) => void
}): React.JSX.Element {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ContactKind>('customer')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(contact?.name ?? '')
    setKind(contact?.kind ?? 'customer')
    setCompany(contact?.company ?? '')
    setPhone(contact?.phone ?? '')
    setEmail(contact?.email ?? '')
    setCity(contact?.city ?? '')
    setAddress(contact?.address ?? '')
    setNote(contact?.note ?? '')
    setError('')
  }, [open, contact])

  const submit = (): void => {
    if (!name.trim()) {
      setError('نام طرف‌حساب را وارد کنید.')
      return
    }
    onSave({
      name: name.trim(),
      kind,
      company: company.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      address: address.trim() || undefined,
      note: note.trim() || undefined
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? 'ویرایش طرف‌حساب' : 'طرف‌حساب جدید'}
      subtitle="مشتری یا تأمین‌کننده را با اطلاعات تماس کامل ثبت کنید."
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" icon={Users} onClick={submit}>
            {contact ? 'ذخیره تغییرات' : 'ساخت طرف‌حساب'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="نوع طرف‌حساب" required>
          <div className="segmented" style={{ width: '100%' }}>
            <button
              className={clsx('segment', kind === 'customer' && 'active')}
              style={{ flex: 1 }}
              onClick={() => setKind('customer')}
            >
              مشتری
            </button>
            <button
              className={clsx('segment', kind === 'supplier' && 'active')}
              style={{ flex: 1 }}
              onClick={() => setKind('supplier')}
            >
              تأمین‌کننده
            </button>
          </div>
        </Field>
        <Field label="نام" required>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="نام شخص یا مجموعه"
            autoFocus
          />
        </Field>
        <Field label="شرکت / برند">
          <input
            className="input"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="اختیاری"
          />
        </Field>
        <Field label="شماره تماس">
          <input
            className="input ltr"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="۰۹۱۲…"
          />
        </Field>
        <Field label="ایمیل">
          <input
            className="input ltr"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.ir"
          />
        </Field>
        <Field label="شهر">
          <input
            className="input"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="تهران"
          />
        </Field>
        <Field label="نشانی" className="full">
          <input
            className="input"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="نشانی کامل"
          />
        </Field>
        <Field label="یادداشت" className="full">
          <textarea
            className="textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="شرایط تسویه، توضیح همکاری یا هر نکتهٔ مهم…"
          />
        </Field>
      </div>
      {error ? <div className="field-error mt-1">{error}</div> : null}
    </Modal>
  )
}

function ContactDetailDrawer({
  contact,
  onClose,
  onEdit,
  onDelete,
  onInvoice
}: {
  contact: Contact | null
  onClose: () => void
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  onInvoice: (id: string) => void
}): React.JSX.Element {
  const data = useApp()
  const navigate = useNav((state) => state.navigate)
  const isCustomer = contact?.kind === 'customer'
  const invoices = contact
    ? data.invoices
        .filter((invoice) => invoice.contactId === contact.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
    : []
  const balance = contact ? contactBalance(contact.id, data) : 0
  const turnover = contact
    ? data.invoices
        .filter(
          (invoice) =>
            invoice.contactId === contact.id &&
            invoice.kind === (contact.kind === 'customer' ? 'sale' : 'purchase')
        )
        .reduce((sum, invoice) => sum + invoiceTotals(invoice).total, 0)
    : 0

  return (
    <Drawer
      open={Boolean(contact)}
      onClose={onClose}
      narrow
      title={contact?.name ?? ''}
      subtitle={contact?.company ?? (isCustomer ? 'مشتری' : 'تأمین‌کننده')}
      footer={
        contact ? (
          <>
            <Button
              variant="ghost"
              icon={Trash2}
              style={{ color: 'var(--danger)' }}
              onClick={() => onDelete(contact)}
            >
              حذف
            </Button>
            <div className="spacer" />
            <Button variant="soft" icon={Pencil} onClick={() => onEdit(contact)}>
              ویرایش
            </Button>
            <Button
              variant="primary"
              icon={Receipt}
              onClick={() => {
                onClose()
                navigate(contact.kind === 'customer' ? 'sales' : 'purchases', { create: true })
              }}
            >
              فاکتور جدید
            </Button>
          </>
        ) : null
      }
    >
      {contact ? (
        <div className="stack" style={{ gap: 16 }}>
          <div className="flex items-center gap-3">
            <Avatar name={contact.name} size="lg" gold={!isCustomer} />
            <div className="grow">
              <div className="flex gap-2 items-center">
                <Badge tone={isCustomer ? 'accent' : 'gold'} dot>
                  {isCustomer ? 'مشتری' : 'تأمین‌کننده'}
                </Badge>
                <span className="tiny muted">{fa(invoices.length)} فاکتور</span>
              </div>
              <div className="tiny muted mt-1">{contact.note ?? 'بدون یادداشت'}</div>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 10 }}>
            <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
              <div className="tiny muted">{isCustomer ? 'طلب از مشتری' : 'بدهی به تأمین‌کننده'}</div>
              <div className="num strong" style={{ fontSize: 16, marginTop: 2 }}>
                {money(Math.abs(balance))} <span className="tiny muted">تومان</span>
              </div>
            </div>
            <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
              <div className="tiny muted">{isCustomer ? 'مجموع فروش' : 'مجموع خرید'}</div>
              <div className="num strong" style={{ fontSize: 16, marginTop: 2 }}>
                {money(turnover)} <span className="tiny muted">تومان</span>
              </div>
            </div>
          </div>

          <div className="card-pad" style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
            <div className="flex flex-col gap-2 tiny">
              {contact.phone ? (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="muted" />
                  <span className="ltr">{fa(contact.phone)}</span>
                </div>
              ) : null}
              {contact.email ? (
                <div className="flex items-center gap-2">
                  <Mail size={13} className="muted" />
                  <span className="ltr">{contact.email}</span>
                </div>
              ) : null}
              {contact.city || contact.address ? (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="muted" />
                  <span>{[contact.city, contact.address].filter(Boolean).join('، ')}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="card-title mb-2">فاکتورها و مانده حساب</div>
            {invoices.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="فاکتور ثبت‌شده‌ای نیست"
                text="برای این طرف‌حساب هنوز فاکتوری صادر نشده است."
              />
            ) : (
              <div className="list">
                {invoices.map((invoice) => {
                  const totals = invoiceTotals(invoice)
                  const remaining = invoiceRemaining(invoice, data.payments)
                  return (
                    <button
                      className="list-row"
                      key={invoice.id}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--line)',
                        textAlign: 'start'
                      }}
                      onClick={() => {
                        onClose()
                        onInvoice(invoice.id)
                      }}
                    >
                      <span className={clsx('list-icon', invoice.kind === 'purchase' && 'gold')}>
                        {invoice.kind === 'sale' ? <Receipt size={14} /> : <ShoppingBag size={14} />}
                      </span>
                      <span className="list-body">
                        <span className="list-title ltr" style={{ display: 'block', direction: 'ltr' }}>
                          {invoiceNoLabel(invoice)}
                        </span>
                        <span className="list-sub">
                          {formatJalali(invoice.date, 'numeric')} · {money(totals.total)} تومان
                        </span>
                      </span>
                      <span className="list-value">
                        <InvoiceStatusBadge invoice={invoice} payments={data.payments} />
                        {remaining > 0 ? (
                          <small>مانده {compact(remaining)}</small>
                        ) : (
                          <small className="text-success">تسویه شده</small>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  )
}

