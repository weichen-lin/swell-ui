import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vite-plus/test'
import { Table, type TableColumn, type TableSort } from './table'

const data = [{ id: 'api' }, { id: 'worker' }]
const columns: TableColumn<(typeof data)[number]>[] = [
  { id: 'service', header: 'Service', cell: (row) => row.id, sortable: true, rowHeader: true },
]
const getRowId = (row: (typeof data)[number]) => row.id

test('emits controlled search, sorting, and pagination changes', async () => {
  const user = userEvent.setup()
  const onSearch = vi.fn()
  const onPageChange = vi.fn()

  function Example() {
    const [sort, setSort] = useState<TableSort | null>(null)
    return (
      <Table
        data={data}
        columns={columns}
        getRowId={getRowId}
        title="Deployments"
        search={{ value: '', onChange: onSearch }}
        sorting={{ value: sort, onChange: setSort }}
        pagination={{ pageIndex: 0, pageSize: 2, rowCount: 3, onPageChange }}
      />
    )
  }

  render(<Example />)
  const table = screen.getByRole('table', { name: 'Deployments' })
  const column = within(table).getByRole('columnheader', { name: 'Service' })
  const sortButton = within(column).getByRole('button')
  await user.click(sortButton)
  expect(column).toHaveAttribute('aria-sort', 'ascending')
  await user.click(sortButton)
  expect(column).toHaveAttribute('aria-sort', 'descending')
  await user.click(sortButton)
  expect(column).not.toHaveAttribute('aria-sort')

  await user.type(screen.getByRole('searchbox'), 'a')
  expect(onSearch).toHaveBeenCalledWith('a')
  const previous = screen.getByRole('button', { name: 'Previous page' })
  expect(previous).toHaveAttribute('aria-disabled', 'true')
  await user.click(previous)
  expect(onPageChange).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Next page' }))
  expect(onPageChange).toHaveBeenCalledWith(1)
  expect(within(table).getByRole('rowheader', { name: 'api' })).toBeInTheDocument()
})

test('selects only eligible rows on the current page and preserves off-page selections', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  const props = { data, columns, getRowId }
  const canSelectRow = (row: (typeof data)[number]) => row.id !== 'worker'
  const { rerender } = render(
    <Table {...props} selection={{ ids: new Set(['other-page']), onChange, canSelectRow }} />,
  )
  const selectPage = screen.getByRole('checkbox', { name: 'Select all rows on this page' })
  expect(screen.getByRole('checkbox', { name: 'Select row worker' })).toBeDisabled()
  await user.click(selectPage)
  expect(onChange).toHaveBeenLastCalledWith(new Set(['other-page', 'api']))

  rerender(
    <Table
      {...props}
      selection={{ ids: new Set(['other-page', 'api']), onChange, canSelectRow }}
    />,
  )
  expect(selectPage).toBeChecked()
  await user.click(selectPage)
  expect(onChange).toHaveBeenLastCalledWith(new Set(['other-page']))
})

test('renders an empty collection outside the table and filtered results inside it', () => {
  const props = { data: [], columns, getRowId, emptyState: 'Create one', noResults: 'Try again' }
  const { rerender } = render(<Table {...props} />)
  expect(screen.getByText('Create one')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()

  rerender(<Table {...props} search={{ value: 'missing', onChange: vi.fn() }} />)
  expect(within(screen.getByRole('table')).getByText('Try again')).toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toHaveValue('missing')
})

test.each([undefined, 'Deployments'])(
  'keeps selection controls after data is cleared (title: %s)',
  async (title) => {
    const user = userEvent.setup()

    function Example({ rows }: { rows: typeof data }) {
      const [ids, setIds] = useState(new Set(['api']))
      return (
        <Table
          data={rows}
          columns={columns}
          getRowId={getRowId}
          title={title}
          search={{ value: '', onChange: vi.fn() }}
          selection={{ ids, onChange: setIds }}
          emptyState="Create one"
        />
      )
    }

    const { rerender } = render(<Example rows={data} />)
    rerender(<Example rows={[]} />)

    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Clear selection' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(screen.queryByText('1 selected')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument()
    expect(screen.getByText('Create one')).toHaveFocus()
  },
)

test('returns keyboard focus to the table after clearing selection without search', async () => {
  const user = userEvent.setup()

  function Example() {
    const [ids, setIds] = useState(new Set(['api']))
    return (
      <Table
        data={data}
        columns={columns}
        getRowId={getRowId}
        selection={{ ids, onChange: setIds }}
      />
    )
  }

  render(<Example />)
  await user.tab()
  expect(screen.getByRole('button', { name: 'Clear selection' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('region', { name: 'Table' })).toHaveFocus()
  expect(screen.getByRole('checkbox', { name: 'Select row api' })).not.toBeChecked()
})
