import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { type ComponentProps, type ReactNode, useId, useRef } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button'
import { Checkbox } from '../checkbox'
import { SearchInput } from '../input'

export type TableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  numeric?: boolean
  rowHeader?: boolean
  className?: string
  headerClassName?: string
}

export type TableSort = { id: string; direction: 'asc' | 'desc' }

const labels = {
  search: 'Search rows',
  clearSelection: 'Clear selection',
  selectPage: 'Select all rows on this page',
  selectRow: (id: string) => `Select row ${id}`,
  selectionCount: (count: number) => `${count} selected`,
  scrollRegion: 'Table',
  pagination: 'Pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  page: (page: number, count: number) => `${page} / ${count}`,
  range: (first: number, last: number, total: number) =>
    total === 0 ? '0 rows' : `${first}–${last} of ${total}`,
  emptyState: 'No rows yet',
  noResults: 'No matching rows',
}

export type TableProps<T> = Omit<ComponentProps<'table'>, 'title' | 'children' | 'className'> & {
  /** Rows to render on the current page, in display order. */
  data: readonly T[]
  columns: readonly TableColumn<T>[]
  getRowId: (row: T) => string
  title?: ReactNode
  emptyState?: ReactNode
  noResults?: ReactNode
  /** Indicates filtering when the caller applies filters outside the search field. */
  filtered?: boolean
  /** Controlled UI. The caller supplies the resulting data. */
  search?: { value: string; onChange: (value: string) => void }
  sorting?: { value: TableSort | null; onChange: (value: TableSort | null) => void }
  pagination?: {
    /** Zero-based page index. */
    pageIndex: number
    pageSize: number
    rowCount: number
    onPageChange: (pageIndex: number) => void
  }
  selection?: {
    ids: ReadonlySet<string>
    onChange: (ids: Set<string>) => void
    canSelectRow?: (row: T) => boolean
  }
  /** Root element classes. Use `tableClassName` for column layout or minimum width. */
  className?: string
  tableClassName?: string
  labels?: Partial<typeof labels>
}

const alignClasses = { start: 'text-start', center: 'text-center', end: 'text-end' }
const sortIcons = { asc: ArrowUp, desc: ArrowDown }

export function Table<T>({
  data,
  columns,
  getRowId,
  title,
  emptyState,
  noResults,
  filtered = false,
  search,
  sorting,
  pagination,
  selection,
  className,
  tableClassName,
  labels: labelOverrides,
  ...props
}: TableProps<T>) {
  const titleId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const emptyRef = useRef<HTMLDivElement>(null)
  const text = { ...labels, ...labelOverrides }
  const tableName =
    props['aria-labelledby'] ?? (title != null && !props['aria-label'] ? titleId : undefined)
  const showEmpty =
    data.length === 0 &&
    !filtered &&
    !search?.value.trim() &&
    (!pagination || pagination.rowCount === 0)
  const showSearch = !showEmpty && search != null
  const hasControls = showSearch || !!selection?.ids.size
  const hasToolbar = title != null || hasControls
  const rows = data.map((row) => ({
    row,
    id: getRowId(row),
    canSelect: selection?.canSelectRow?.(row) ?? true,
  }))
  const selectableIds = selection ? rows.filter((row) => row.canSelect).map((row) => row.id) : []
  const selectedOnPage = selectableIds.filter((id) => selection?.ids.has(id)).length
  const allOnPageSelected = selectableIds.length > 0 && selectedOnPage === selectableIds.length

  const updateSelection = (ids: readonly string[], checked: boolean) => {
    if (!selection) return
    const next = new Set(selection.ids)
    for (const id of ids) {
      if (checked) next.add(id)
      else next.delete(id)
    }
    selection.onChange(next)
  }

  return (
    <div data-slot="table-root" className={cn('w-full min-w-0 bg-surface text-fg', className)}>
      {hasToolbar && (
        <div
          data-slot="table-toolbar"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"
        >
          {title != null && (
            <span id={titleId} className="text-sm font-semibold">
              {title}
            </span>
          )}
          {hasControls && (
            <div className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
              {selection && (
                <output className="text-xs text-fg-muted">
                  {selection.ids.size > 0 && text.selectionCount(selection.ids.size)}
                </output>
              )}
              {!!selection?.ids.size && (
                <Button
                  intent="ghost"
                  size="sm"
                  ripple={false}
                  onClick={() => {
                    selection.onChange(new Set())
                    const focusTarget = searchRef.current ?? scrollRef.current ?? emptyRef.current
                    focusTarget?.focus()
                  }}
                >
                  {text.clearSelection}
                </Button>
              )}
              {showSearch && (
                <SearchInput
                  ref={searchRef}
                  aria-label={text.search}
                  placeholder={`${text.search}…`}
                  size="sm"
                  className="w-48 max-w-full"
                  value={search.value}
                  onChange={(event) => search.onChange(event.currentTarget.value)}
                />
              )}
            </div>
          )}
        </div>
      )}
      {showEmpty ? (
        <div
          ref={emptyRef}
          data-slot="table-empty"
          tabIndex={-1}
          className="grid min-h-48 place-items-center px-4 py-8 text-center text-sm text-fg-muted outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus"
        >
          {emptyState === undefined ? text.emptyState : emptyState}
        </div>
      ) : (
        <>
          <section
            ref={scrollRef}
            data-slot="table-scroll"
            aria-labelledby={tableName}
            aria-label={tableName ? undefined : (props['aria-label'] ?? text.scrollRegion)}
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users need to scroll wide tables.
            tabIndex={0}
            className="relative w-full overflow-x-auto outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus"
          >
            <table
              {...props}
              aria-labelledby={tableName}
              data-slot="table"
              className={cn('w-full border-separate border-spacing-0 text-sm', tableClassName)}
            >
              <thead data-slot="table-header">
                <tr>
                  {selection && (
                    <th scope="col" className="w-12 border-b border-border px-3">
                      <Checkbox
                        aria-label={text.selectPage}
                        checked={allOnPageSelected}
                        indeterminate={selectedOnPage > 0 && !allOnPageSelected}
                        disabled={selectableIds.length === 0}
                        onChange={(event) =>
                          updateSelection(selectableIds, event.currentTarget.checked)
                        }
                        className="mx-auto justify-center"
                      />
                    </th>
                  )}
                  {columns.map((column) => {
                    const direction =
                      sorting?.value?.id === column.id ? sorting.value.direction : undefined
                    const SortIcon = direction ? sortIcons[direction] : ArrowUpDown
                    const align = column.align ?? (column.numeric ? 'end' : 'start')
                    return (
                      <th
                        key={column.id}
                        scope="col"
                        aria-sort={
                          direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined
                        }
                        className={cn(
                          'h-10 border-b border-border px-4 text-xs font-medium whitespace-nowrap text-fg-muted',
                          alignClasses[align],
                          column.headerClassName,
                        )}
                      >
                        {sorting && column.sortable ? (
                          <button
                            type="button"
                            className={cn(
                              'inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-inset hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:min-h-11',
                              direction && 'text-fg',
                            )}
                            onClick={() =>
                              sorting.onChange(
                                direction === 'desc'
                                  ? null
                                  : {
                                      id: column.id,
                                      direction: direction === 'asc' ? 'desc' : 'asc',
                                    },
                              )
                            }
                          >
                            {column.header}
                            <SortIcon aria-hidden className="size-3.5 shrink-0" />
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody
                data-slot="table-body"
                className="[&>tr:not(:last-child)>*]:border-b [&>tr>*]:border-border"
              >
                {rows.map(({ row, id, canSelect }) => {
                  const selected = selection?.ids.has(id) ?? false
                  return (
                    <tr
                      key={id}
                      data-slot="table-row"
                      data-selected={selected || undefined}
                      className="hover:bg-surface-muted data-selected:bg-surface-muted"
                    >
                      {selection && (
                        <td className="w-12 px-3">
                          <Checkbox
                            aria-label={text.selectRow(id)}
                            checked={selected}
                            disabled={!canSelect}
                            onChange={(event) => updateSelection([id], event.currentTarget.checked)}
                            className="mx-auto justify-center"
                          />
                        </td>
                      )}
                      {columns.map((column) => {
                        const Cell = column.rowHeader ? 'th' : 'td'
                        const align = column.align ?? (column.numeric ? 'end' : 'start')
                        return (
                          <Cell
                            key={column.id}
                            scope={column.rowHeader ? 'row' : undefined}
                            className={cn(
                              'h-13 px-4 py-2 align-middle',
                              alignClasses[align],
                              column.numeric && 'tabular-nums',
                              column.rowHeader && 'font-medium',
                              column.className,
                            )}
                          >
                            {column.cell(row)}
                          </Cell>
                        )
                      })}
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={Math.max(1, columns.length + Number(Boolean(selection)))}>
                      <div
                        data-slot="table-no-results"
                        className="sticky inset-s-0 w-max max-w-[min(100%,18rem)] px-4 py-12 text-sm text-fg-muted"
                      >
                        {noResults === undefined ? <output>{text.noResults}</output> : noResults}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
          {pagination && <TablePagination {...pagination} visibleCount={rows.length} text={text} />}
        </>
      )}
    </div>
  )
}

function TablePagination({
  pageIndex,
  pageSize,
  rowCount,
  visibleCount,
  onPageChange,
  text,
}: NonNullable<TableProps<unknown>['pagination']> & { visibleCount: number; text: typeof labels }) {
  const count = Math.ceil(rowCount / pageSize)
  const first = visibleCount ? pageIndex * pageSize + 1 : 0
  const last = first ? first + visibleCount - 1 : 0
  const canGoBack = pageIndex > 0
  const canGoForward = pageIndex + 1 < count

  return (
    <nav
      data-slot="table-pagination"
      aria-label={text.pagination}
      className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border px-4 py-1 text-xs text-fg-muted tabular-nums"
    >
      <output>{text.range(first, last, rowCount)}</output>
      <span className="flex items-center gap-2">
        <Button
          icon={<ChevronLeft className="rtl:rotate-180" />}
          aria-label={text.previousPage}
          intent="ghost"
          size="sm"
          ripple={false}
          disabled={!canGoBack}
          onClick={() => onPageChange(pageIndex - 1)}
        />
        <span>{count === 0 ? '—' : text.page(pageIndex + 1, count)}</span>
        <Button
          icon={<ChevronRight className="rtl:rotate-180" />}
          aria-label={text.nextPage}
          intent="ghost"
          size="sm"
          ripple={false}
          disabled={!canGoForward}
          onClick={() => onPageChange(pageIndex + 1)}
        />
      </span>
    </nav>
  )
}
