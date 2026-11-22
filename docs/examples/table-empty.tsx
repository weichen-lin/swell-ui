'use client'
import { Button, Table, type TableColumn } from '@weichenlin/swell-ui'

type Invoice = { id: string; customer: string }

const columns: TableColumn<Invoice>[] = [
  { id: 'id', header: 'Invoice', cell: (row) => row.id, rowHeader: true },
  { id: 'customer', header: 'Customer', cell: (row) => row.customer },
]

export default function TableEmpty() {
  return (
    <div className="w-full max-w-2xl">
      <Table
        title="Invoices"
        data={[]}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <div className="flex flex-col items-center gap-3">
            <span>No invoices yet.</span>
            <Button size="sm">Create invoice</Button>
          </div>
        }
        className="rounded-lg border border-border"
      />
    </div>
  )
}
