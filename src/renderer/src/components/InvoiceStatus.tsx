import type * as React from 'react'
import { invoiceStatus, STATUS_META } from '../domain/calc'
import type { Invoice, Payment } from '../domain/types'
import { Badge } from './kit'

export function InvoiceStatusBadge({
  invoice,
  payments,
  className
}: {
  invoice: Invoice
  payments: Payment[]
  className?: string
}): React.JSX.Element {
  const key = invoiceStatus(invoice, payments)
  const meta = STATUS_META[key]
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}
