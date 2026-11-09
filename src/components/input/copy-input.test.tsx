import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test'
import { CopyInput } from './copy-input'

const SHA = '3f9c2a1e8b7d4c6f0a5e9d2b1c8f7a6e5d4c3b2a'
const writeText = vi.fn()

beforeEach(() => {
  writeText.mockReset()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})
afterEach(() => {
  vi.useRealTimers()
})

const live = (container: HTMLElement) =>
  container.querySelector('[data-slot="input-field"] > [aria-live="polite"]') as HTMLElement

test('is read-only, mono by default, and selects everything on focus and click', () => {
  render(<CopyInput label="Commit SHA" value={SHA} />)
  const input = screen.getByLabelText('Commit SHA') as HTMLInputElement
  expect(input).toHaveAttribute('readonly')
  expect(input).toHaveClass('font-mono')
  expect(input).toHaveAttribute('spellcheck', 'false')

  fireEvent.focus(input)
  expect([input.selectionStart, input.selectionEnd]).toEqual([0, SHA.length])
  input.setSelectionRange(2, 2)
  fireEvent.click(input)
  expect([input.selectionStart, input.selectionEnd]).toEqual([0, SHA.length])
})

test('copies the value, swaps to a check and announces "Copied" for 1.5s', async () => {
  vi.useFakeTimers()
  writeText.mockResolvedValue(undefined)
  const { container } = render(<CopyInput label="Commit SHA" value={SHA} />)
  const btn = screen.getByRole('button', { name: 'Copy' })
  const before = btn.querySelector('svg')?.getAttribute('class')

  await act(async () => {
    fireEvent.click(btn)
  })
  expect(writeText).toHaveBeenCalledWith(SHA)
  expect(live(container)).toHaveTextContent('Copied')
  expect(btn.querySelector('svg')?.getAttribute('class')).toContain('lucide-check')
  expect(btn.querySelector('svg')?.getAttribute('class')).not.toBe(before)
  expect(btn).toHaveAccessibleName('Copy')

  act(() => {
    vi.advanceTimersByTime(1500)
  })
  expect(live(container)).toHaveTextContent('')
  expect(btn.querySelector('svg')?.getAttribute('class')).toBe(before)
})

test('announces "Copy failed" when the clipboard rejects', async () => {
  writeText.mockRejectedValue(new Error('denied'))
  const { container } = render(<CopyInput label="Image" value="ghcr.io/acme/payments-api:1.4.2" />)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
  })
  expect(live(container)).toHaveTextContent('Copy failed')
})

test('CopyInput requires a string value', () => {
  // @ts-expect-error value is required
  render(<CopyInput label="Image" />)
})
