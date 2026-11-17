'use client'
import { Table, type TableColumn } from '@weichenlin/swell-ui'
import { useState } from 'react'

type Invoice = { id: string; customer: string; status: string; amount: number }

const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Acme Corp', status: 'Paid', amount: 250 },
  { id: 'INV-002', customer: 'Globex', status: 'Pending', amount: 150 },
  { id: 'INV-003', customer: 'Initech', status: 'Paid', amount: 350 },
  { id: 'INV-004', customer: 'Umbrella', status: 'Overdue', amount: 450 },
  { id: 'INV-005', customer: 'Hooli', status: 'Paid', amount: 550 },
  { id: 'INV-006', customer: 'Stark Ltd', status: 'Pending', amount: 200 },
]

const columns: TableColumn<Invoice>[] = [
  { id: 'id', header: 'Invoice', cell: (row) => row.id, rowHeader: true, sortable: true },
  { id: 'customer', header: 'Customer', cell: (row) => row.customer, sortable: true },
  { id: 'status', header: 'Status', cell: (row) => row.status },
  {
    id: 'amount',
    header: 'Amount',
    cell: (row) => `$${row.amount.toFixed(2)}`,
    numeric: true,
    sortable: true,
  },
]

export default function TablePagination() {
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 3
  const rows = invoices.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
  return (
    <div className="w-full max-w-2xl">
      <Table
        title="Invoices"
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        pagination={{
          pageIndex,
          pageSize,
          rowCount: invoices.length,
          onPageChange: setPageIndex,
        }}
        className="rounded-lg border border-border"
      />
    </div>
  )
}
