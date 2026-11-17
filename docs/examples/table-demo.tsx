'use client'
import { Table, type TableColumn } from '@weichenlin/swell-ui'

type Invoice = { id: string; customer: string; status: string; amount: number }

const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Acme Corp', status: 'Paid', amount: 250 },
  { id: 'INV-002', customer: 'Globex', status: 'Pending', amount: 150 },
  { id: 'INV-003', customer: 'Initech', status: 'Paid', amount: 350 },
]

const columns: TableColumn<Invoice>[] = [
  { id: 'id', header: 'Invoice', cell: (row) => row.id, rowHeader: true },
  { id: 'customer', header: 'Customer', cell: (row) => row.customer },
  { id: 'status', header: 'Status', cell: (row) => row.status },
  { id: 'amount', header: 'Amount', cell: (row) => `$${row.amount.toFixed(2)}`, numeric: true },
]

export default function TableDemo() {
  return (
    <div className="w-full max-w-2xl">
      <Table
        title="Invoices"
        data={invoices}
        columns={columns}
        getRowId={(row) => row.id}
        className="rounded-lg border border-border"
      />
    </div>
  )
}
