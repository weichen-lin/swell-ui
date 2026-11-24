import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vite-plus/test'
import { SearchInput } from './search-input'

test('is a named search field with a hidden leading icon and no native cancel button', () => {
  render(<SearchInput aria-label="Search applications" />)
  const input = screen.getByRole('searchbox', { name: 'Search applications' })
  expect(input).toHaveAttribute('type', 'search')
  const control = input.closest('[data-slot="input-control"]') as HTMLElement
  expect(control.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
  expect(input.className).toContain('[&::-webkit-search-cancel-button]:appearance-none')
})

test('uncontrolled: clear button appears with a value, clears, fires onChange/onClear, refocuses', async () => {
  const onChange = vi.fn()
  const onClear = vi.fn()
  render(<SearchInput aria-label="Search" onChange={onChange} onClear={onClear} />)
  const input = screen.getByRole('searchbox', { name: 'Search' })
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()

  await userEvent.type(input, 'payments')
  const clear = screen.getByRole('button', { name: 'Clear search' })
  onChange.mockClear()
  await userEvent.click(clear)
  expect(input).toHaveValue('')
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange.mock.calls[0][0].target.value).toBe('')
  expect(onClear).toHaveBeenCalledTimes(1)
  expect(input).toHaveFocus()
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
})

test('controlled: clearing goes through onChange', async () => {
  const onChange = vi.fn()
  function Controlled() {
    const [q, setQ] = useState('payments-api')
    return (
      <SearchInput
        aria-label="Search"
        value={q}
        onChange={(e) => {
          onChange(e.target.value)
          setQ(e.target.value)
        }}
      />
    )
  }
  render(<Controlled />)
  const input = screen.getByRole('searchbox', { name: 'Search' })
  await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
  expect(onChange).toHaveBeenCalledWith('')
  expect(input).toHaveValue('')
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
})

test('Esc clears a non-empty field and lets Esc propagate when empty', async () => {
  const outer = vi.fn()
  const onClear = vi.fn()
  render(
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- test harness observing bubbling keys
    <div onKeyDown={(e) => outer(e.key)}>
      <SearchInput aria-label="Search" defaultValue="ghcr.io" onClear={onClear} />
    </div>,
  )
  const input = screen.getByRole('searchbox', { name: 'Search' })
  input.focus()
  await userEvent.keyboard('{Escape}')
  expect(input).toHaveValue('')
  expect(onClear).toHaveBeenCalledTimes(1)
  expect(outer).not.toHaveBeenCalled()

  await userEvent.keyboard('{Escape}')
  expect(outer).toHaveBeenCalledWith('Escape')
  expect(onClear).toHaveBeenCalledTimes(1)
})

test('no clear button while disabled', () => {
  render(<SearchInput aria-label="Search" defaultValue="x" disabled />)
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
})

test('clear button keeps focus in the input on mouse down', () => {
  render(<SearchInput aria-label="Search" defaultValue="x" />)
  const btn = screen.getByRole('button', { name: 'Clear search' })
  expect(fireEvent.mouseDown(btn)).toBe(false)
})

// Type-level API rules: each line must fail to compile, or the directive itself errors
test('SearchInput requires aria-label and takes no visible label', () => {
  // @ts-expect-error aria-label is required
  render(<SearchInput />)
  // @ts-expect-error no visible label
  render(<SearchInput aria-label="Search" label="Search" />)
  // @ts-expect-error no floating label
  render(<SearchInput aria-label="Search" floating />)
})

test.each([false, null])('searchIcon replaces the magnifier, and %s hides it', (hidden) => {
  const { container, rerender } = render(
    <SearchInput aria-label="Search" searchIcon={<svg data-testid="custom" />} />,
  )
  expect(screen.getByTestId('custom').closest('[aria-hidden="true"]')).not.toBeNull()
  expect(container.querySelector('[data-icon="search"]')).toBeNull()
  rerender(<SearchInput aria-label="Search" searchIcon={hidden} />)
  expect(container.querySelector('svg')).toBeNull()
  expect(container.querySelector('[data-start]')).toBeNull()
})

test('clearIcon replaces the X of the clear button', () => {
  render(
    <SearchInput aria-label="Search" defaultValue="api" clearIcon={<svg data-testid="custom" />} />,
  )
  const clear = screen.getByRole('button', { name: 'Clear search' })
  expect(clear).toContainElement(screen.getByTestId('custom'))
  expect(clear.querySelector('[data-icon="x"]')).toBeNull()
})

test.each([false, null])('clearIcon={%s} keeps the X', (hidden) => {
  render(<SearchInput aria-label="Search" defaultValue="api" clearIcon={hidden} />)
  const clear = screen.getByRole('button', { name: 'Clear search' })
  expect(clear.querySelector('[data-icon="x"]')).not.toBeNull()
})
