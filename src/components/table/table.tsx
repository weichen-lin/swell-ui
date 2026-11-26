import { type ComponentProps, type ReactNode, useId, useRef } from 'react'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../icons'
import { cn } from '../../lib/cn'
import { iconOr } from '../../lib/icon-slots'
import { Button } from '../button'
import { Checkbox } from '../checkbox'
import { SearchInput } from '../input'

export type TableColumn<T> = {
  /** Unique column ID; also the `id` of a `TableSort`. */
  id: string
  /** Header content. */
  header: ReactNode
  /** Renders the cell for a row. */
  cell: (row: T) => ReactNode
  /** Shows a sort button in the header when `sorting` is set on the table. */
  sortable?: boolean
  /**
   * Text alignment: `'start'`, `'center'` or `'end'`.
   * @defaultValue 'end' for numeric columns, otherwise 'start'
   */
  align?: 'start' | 'center' | 'end'
  /** Right-aligns the column and uses tabular numerals. */
  numeric?: boolean
  /** Renders the body cells as row headers (`<th scope="row">`). */
  rowHeader?: boolean
  /** Classes for the body cells. */
  className?: string
  /** Classes for the header cell. */
  headerClassName?: string
}

export type TableSort = {
  /** Column ID. */
  id: string
  /** Sort direction. */
  direction: 'asc' | 'desc'
}

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

/** Built-in icons of the table; each one you leave out keeps its default. */
type TableIcons = {
  /** Sort button of the column sorted ascending. Defaults to an arrow pointing up. */
  sortAsc: ReactNode
  /** Sort button of the column sorted descending. Defaults to an arrow pointing down. */
  sortDesc: ReactNode
  /** Sort buttons of the unsorted sortable columns. Defaults to an up-and-down arrow pair. */
  unsorted: ReactNode
  /** Previous page button; mirrored in right-to-left layouts. Defaults to a chevron left. */
  previousPage: ReactNode
  /** Next page button; mirrored in right-to-left layouts. Defaults to a chevron right. */
  nextPage: ReactNode
  /** Leading icon of the search field; `false` or `null` hides it. Defaults to a magnifier. */
  search: ReactNode
  /** Clear button of the search field. Defaults to an X. */
  clearSearch: ReactNode
}

export type TableProps<T> = Omit<ComponentProps<'table'>, 'title' | 'children' | 'className'> & {
  /** Rows to render on the current page, in display order. */
  data: readonly T[]
  /** Column definitions, in display order. */
  columns: readonly TableColumn<T>[]
  /** Returns a stable, unique ID for each row; used as the React key and for selection. */
  getRowId: (row: T) => string
  /** Toolbar title; also names the table unless `aria-label` or `aria-labelledby` is set. */
  title?: ReactNode
  /**
   * Shown instead of the table when there is no data and no active filter.
   * @defaultValue 'No rows yet'
   */
  emptyState?: ReactNode
  /**
   * Shown inside the table when a search or filter leaves no rows.
   * @defaultValue 'No matching rows'
   */
  noResults?: ReactNode
  /**
   * Indicates filtering when the caller applies filters outside the search field.
   * @defaultValue false
   */
  filtered?: boolean
  /** Shows a search field in the toolbar. The caller filters `data`. */
  search?: { value: string; onChange: (value: string) => void }
  /** Enables sort buttons on columns marked `sortable`. The caller sorts `data`. */
  sorting?: { value: TableSort | null; onChange: (value: TableSort | null) => void }
  /** Shows a pagination footer. The caller passes only the current page as `data`. */
  pagination?: {
    /** Zero-based page index. */
    pageIndex: number
    pageSize: number
    rowCount: number
    onPageChange: (pageIndex: number) => void
  }
  /** Adds row checkboxes and a select-all-on-page checkbox. Selection can span pages. */
  selection?: {
    ids: ReadonlySet<string>
    onChange: (ids: Set<string>) => void
    canSelectRow?: (row: T) => boolean
  }
  /** Root element classes. Use `tableClassName` for column layout or minimum width. */
  className?: string
  /** Classes for the `<table>` element; use for column layout or a minimum width. */
  tableClassName?: string
  /**
   * Overrides built-in text: `search`, `clearSelection`, `selectPage`, `selectRow`, `selectionCount`,
   * `scrollRegion`, `pagination`, `previousPage`, `nextPage`, `page`, `range`, `emptyState`, `noResults`.
   * @defaultValue English text
   */
  labels?: Partial<typeof labels>
  /**
   * Overrides built-in icons: `sortAsc`, `sortDesc`, `unsorted`, `previousPage`, `nextPage`,
   * `search`, `clearSearch`. Sort icons are sized to 14px, the others to their control's icon size.
   * @defaultValue arrows for sorting, chevrons for paging, a magnifier and an X for search
   */
  icons?: Partial<TableIcons>
}

const alignClasses = { start: 'text-start', center: 'text-center', end: 'text-end' }

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
  icons = {},
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
                  searchIcon={icons.search}
                  clearIcon={icons.clearSearch}
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
                    const sortIcon =
                      direction === 'asc'
                        ? iconOr(icons.sortAsc, <ArrowUpIcon />)
                        : direction === 'desc'
                          ? iconOr(icons.sortDesc, <ArrowDownIcon />)
                          : iconOr(icons.unsorted, <ArrowUpDownIcon />)
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
                            <span
                              aria-hidden
                              data-slot="table-sort-icon"
                              className="flex shrink-0 [&_:where(svg:not([class*=size-]))]:size-3.5 [&_:where(svg:not([class*=shrink]))]:shrink-0"
                            >
                              {sortIcon}
                            </span>
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody data-slot="table-body">
                {rows.map(({ row, id, canSelect }, rowIndex) => {
                  const selected = selection?.ids.has(id) ?? false
                  // Row dividers sit on the cells (not a tbody descendant selector), so a column's
                  // className border utilities override them like any other class
                  const divider = cn('border-border', rowIndex < rows.length - 1 && 'border-b')
                  return (
                    <tr
                      key={id}
                      data-slot="table-row"
                      data-selected={selected || undefined}
                      className="hover:bg-surface-muted data-selected:bg-surface-muted"
                    >
                      {selection && (
                        <td className={cn('w-12 px-3', divider)}>
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
                              divider,
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
          {pagination && (
            <TablePagination {...pagination} visibleCount={rows.length} text={text} icons={icons} />
          )}
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
  icons,
}: NonNullable<TableProps<unknown>['pagination']> & {
  visibleCount: number
  text: typeof labels
  icons: Partial<TableIcons>
}) {
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
          icon={
            <span className="flex rtl:rotate-180">
              {iconOr(icons.previousPage, <ChevronLeftIcon />)}
            </span>
          }
          aria-label={text.previousPage}
          intent="ghost"
          size="sm"
          ripple={false}
          disabled={!canGoBack}
          onClick={() => onPageChange(pageIndex - 1)}
        />
        <span>{count === 0 ? '—' : text.page(pageIndex + 1, count)}</span>
        <Button
          icon={
            <span className="flex rtl:rotate-180">
              {iconOr(icons.nextPage, <ChevronRightIcon />)}
            </span>
          }
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
