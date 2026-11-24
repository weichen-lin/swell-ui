import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Badge, type BadgeTone } from '../src/components/badge'
import { Button } from '../src/components/button'
import { Card } from '../src/components/card'
import { Table, type TableColumn, type TableSort } from '../src/components/table'
import { Box, Plus, Search } from './_helpers/story-icons'

type Deployment = {
  service: string
  environment: string
  status: 'Ready' | 'Building' | 'Failed'
  updated: string
  duration: number | undefined
}

const deployments: Deployment[] = [
  {
    service: 'deploy-gateway',
    environment: 'Production',
    status: 'Ready',
    updated: '06:14',
    duration: 38,
  },
  {
    service: 'billing-api',
    environment: 'Production',
    status: 'Ready',
    updated: '06:02',
    duration: 64,
  },
  {
    service: 'identity-service',
    environment: 'Staging',
    status: 'Building',
    updated: '05:47',
    duration: undefined,
  },
  {
    service: 'worker-events',
    environment: 'Production',
    status: 'Failed',
    updated: '05:33',
    duration: 83,
  },
  {
    service: 'asset-pipeline',
    environment: 'Preview',
    status: 'Ready',
    updated: '05:21',
    duration: 26,
  },
  {
    service: 'merchant-admin',
    environment: 'Staging',
    status: 'Ready',
    updated: '05:08',
    duration: 47,
  },
  {
    service: 'notifications',
    environment: 'Production',
    status: 'Ready',
    updated: '04:56',
    duration: 36,
  },
  {
    service: 'edge-router',
    environment: 'Staging',
    status: 'Building',
    updated: '04:42',
    duration: undefined,
  },
  {
    service: 'reporting-job',
    environment: 'Production',
    status: 'Ready',
    updated: '04:36',
    duration: 76,
  },
]

const emptyDeployments: Deployment[] = []
const tone: Record<Deployment['status'], BadgeTone> = {
  Ready: 'success',
  Building: 'warning',
  Failed: 'danger',
}

const columns: readonly TableColumn<Deployment>[] = [
  {
    id: 'service',
    header: 'Service',
    sortable: true,
    rowHeader: true,
    cell: ({ service }) => (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <Box aria-hidden className="size-3.5 shrink-0 text-fg-muted" />
        {service}
      </span>
    ),
  },
  {
    id: 'environment',
    header: 'Environment',
    className: 'text-fg-muted',
    cell: ({ environment }) => environment,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ status }) => (
      <Badge size="sm" tone={tone[status]}>
        {status}
      </Badge>
    ),
  },
  {
    id: 'updated',
    header: 'Updated',
    sortable: true,
    className: 'whitespace-nowrap text-fg-muted tabular-nums',
    cell: ({ updated }) => `${updated} UTC`,
  },
  {
    id: 'duration',
    header: 'Duration',
    sortable: true,
    numeric: true,
    className: 'whitespace-nowrap',
    cell: ({ duration }) => {
      if (duration === undefined) return '—'
      return `${Math.floor(duration / 60)}m ${String(duration % 60).padStart(2, '0')}s`
    },
  },
]

function compareDeployments(a: Deployment, b: Deployment, sort: TableSort) {
  const sign = sort.direction === 'asc' ? 1 : -1
  if (sort.id === 'duration') {
    if (a.duration === undefined) return b.duration === undefined ? 0 : 1
    if (b.duration === undefined) return -1
    return (a.duration - b.duration) * sign
  }

  const field = sort.id === 'updated' ? 'updated' : 'service'
  return a[field].localeCompare(b[field]) * sign
}

const getRowId = (row: Deployment) => row.service
const pageSize = 6

function BasicTable() {
  return (
    <Table
      data={deployments}
      columns={columns}
      getRowId={getRowId}
      title="Deployments"
      tableClassName="min-w-xl"
    />
  )
}

function DeploymentsTable({
  startEmpty = false,
  initialQuery = '',
}: {
  startEmpty?: boolean
  initialQuery?: string
}) {
  const [data, setData] = useState(startEmpty ? emptyDeployments : deployments)
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<TableSort | null>({ id: 'updated', direction: 'desc' })
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedIds, setSelectedIds] = useState(
    () => new Set<string>(startEmpty || initialQuery ? [] : ['billing-api']),
  )

  const term = query.trim().toLowerCase()
  const matching = data.filter((row) =>
    [row.service, row.environment, row.status].some((value) => value.toLowerCase().includes(term)),
  )
  const ordered = sort ? matching.toSorted((a, b) => compareDeployments(a, b, sort)) : matching
  const visible = ordered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  return (
    <Table
      data={visible}
      columns={columns}
      getRowId={getRowId}
      title="Deployments"
      tableClassName="min-w-2xl"
      search={{
        value: query,
        onChange: (value) => {
          setQuery(value)
          setPageIndex(0)
        },
      }}
      sorting={{
        value: sort,
        onChange: (value) => {
          setSort(value)
          setPageIndex(0)
        },
      }}
      pagination={{ pageIndex, pageSize, rowCount: matching.length, onPageChange: setPageIndex }}
      selection={{ ids: selectedIds, onChange: setSelectedIds }}
      labels={{
        search: 'Search deployments',
        selectRow: (id) => `Select ${id}`,
        range: (first, last, total) =>
          total === 0 ? '0 deployments' : `${first}–${last} of ${total} deployments`,
      }}
      emptyState={
        <div className="grid justify-items-center gap-2">
          <Box aria-hidden className="size-5 text-fg-muted" />
          <p className="font-medium text-fg">No deployments yet</p>
          <p>Deploy a service to see its status and history here.</p>
          <Button
            size="sm"
            iconLeft={<Plus />}
            className="mt-1"
            onClick={() => setData(deployments)}
          >
            New deployment
          </Button>
        </div>
      }
      noResults={
        <div className="grid justify-items-start gap-2">
          <Search aria-hidden className="size-5 text-fg-muted" />
          <p className="font-medium text-fg">No matching deployments</p>
          <p>Try another service, environment, or status.</p>
        </div>
      }
    />
  )
}

const meta = {
  title: 'UI/Table',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A minimal table with controlled search, sorting, pagination and selection. Pass the rows to display and enable each control with its corresponding prop.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Card className="mx-auto max-w-5xl overflow-hidden">
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj

export const Basic: Story = { render: () => <BasicTable /> }
export const Interactive: Story = { render: () => <DeploymentsTable /> }
export const Empty: Story = { render: () => <DeploymentsTable startEmpty /> }
export const NoResults: Story = { render: () => <DeploymentsTable initialQuery="payments-v4" /> }
export const Narrow: Story = {
  render: () => (
    <div className="mx-auto max-w-sm">
      <DeploymentsTable />
    </div>
  ),
}
