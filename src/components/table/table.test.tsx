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

test('icons replaces the sort, paging and search icons', async () => {
  const user = userEvent.setup()
  const icons = {
    sortAsc: <svg data-testid="asc" />,
    sortDesc: <svg data-testid="desc" />,
    unsorted: <svg data-testid="unsorted" />,
    previousPage: <svg data-testid="previous" />,
    nextPage: <svg data-testid="next" />,
    search: <svg data-testid="search" />,
    clearSearch: <svg data-testid="clear" />,
  }
  function Example() {
    const [sort, setSort] = useState<TableSort | null>(null)
    return (
      <Table
        data={data}
        columns={columns}
        getRowId={getRowId}
        title="Deployments"
        search={{ value: 'a', onChange: vi.fn() }}
        sorting={{ value: sort, onChange: setSort }}
        pagination={{ pageIndex: 0, pageSize: 2, rowCount: 3, onPageChange: vi.fn() }}
        icons={icons}
      />
    )
  }
  render(<Example />)
  const sortButton = within(screen.getByRole('columnheader', { name: 'Service' })).getByRole(
    'button',
  )
  expect(sortButton).toContainElement(screen.getByTestId('unsorted'))
  expect(screen.getByTestId('unsorted').parentElement).toHaveClass('[&_svg]:size-3.5')
  await user.click(sortButton)
  expect(sortButton).toContainElement(screen.getByTestId('asc'))
  await user.click(sortButton)
  expect(sortButton).toContainElement(screen.getByTestId('desc'))
  expect(screen.getByRole('button', { name: 'Previous page' })).toContainElement(
    screen.getByTestId('previous'),
  )
  expect(screen.getByRole('button', { name: 'Next page' })).toContainElement(
    screen.getByTestId('next'),
  )
  expect(screen.getByTestId('search')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Clear search' })).toContainElement(
    screen.getByTestId('clear'),
  )
  expect(document.querySelector('[data-icon]')).toBeNull()
})

test.each([false, null])('icons with %s keep the sort, paging and clear icons', async (hidden) => {
  const user = userEvent.setup()
  const icons = {
    sortAsc: hidden,
    sortDesc: hidden,
    unsorted: hidden,
    previousPage: hidden,
    nextPage: hidden,
    clearSearch: hidden,
  }
  function Example() {
    const [sort, setSort] = useState<TableSort | null>(null)
    return (
      <Table
        data={data}
        columns={columns}
        getRowId={getRowId}
        title="Deployments"
        search={{ value: 'a', onChange: vi.fn() }}
        sorting={{ value: sort, onChange: setSort }}
        pagination={{ pageIndex: 0, pageSize: 2, rowCount: 3, onPageChange: vi.fn() }}
        icons={icons}
      />
    )
  }
  render(<Example />)
  const sortButton = within(screen.getByRole('columnheader', { name: 'Service' })).getByRole(
    'button',
  )
  expect(sortButton.querySelector('[data-icon="arrow-up-down"]')).not.toBeNull()
  await user.click(sortButton)
  expect(sortButton.querySelector('[data-icon="arrow-up"]')).not.toBeNull()
  await user.click(sortButton)
  expect(sortButton.querySelector('[data-icon="arrow-down"]')).not.toBeNull()
  const previous = screen.getByRole('button', { name: 'Previous page' })
  expect(previous.querySelector('[data-icon="chevron-left"]')).not.toBeNull()
  const next = screen.getByRole('button', { name: 'Next page' })
  expect(next.querySelector('[data-icon="chevron-right"]')).not.toBeNull()
  const clear = screen.getByRole('button', { name: 'Clear search' })
  expect(clear.querySelector('[data-icon="x"]')).not.toBeNull()
})

test.each([false, null])('icons.search set to %s hides the search icon', (hidden) => {
  render(
    <Table
      data={data}
      columns={columns}
      getRowId={getRowId}
      title="Deployments"
      search={{ value: '', onChange: vi.fn() }}
      icons={{ search: hidden }}
    />,
  )
  expect(document.querySelector('[data-icon="search"]')).toBeNull()
  expect(screen.getByRole('searchbox')).toBeInTheDocument()
})
