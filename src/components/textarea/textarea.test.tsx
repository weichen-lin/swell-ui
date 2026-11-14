import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, expect, test, vi } from 'vite-plus/test'
import { Textarea, type TextareaProps } from './textarea'

const fontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts')

afterEach(() => {
  if (fontsDescriptor) Object.defineProperty(document, 'fonts', fontsDescriptor)
  else Reflect.deleteProperty(document, 'fonts')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('native label, ref, required, name and descriptions work together', () => {
  const ref = createRef<HTMLTextAreaElement>()
  const { rerender } = render(
    <Textarea
      label="Description"
      ref={ref}
      name="description"
      required
      helperText="Explain its purpose."
    />,
  )
  const field = screen.getByRole('textbox', { name: 'Description' })
  expect(ref.current).toBe(field)
  expect(field.tagName).toBe('TEXTAREA')
  expect(field).toBeRequired()
  expect(field).toHaveAttribute('name', 'description')
  expect(field).toHaveAttribute('rows', '3')
  expect(field).toHaveAccessibleDescription('Explain its purpose.')
  rerender(<Textarea label="Description" helperText="Explain its purpose." error="Too short." />)
  expect(field).toHaveAccessibleDescription('Too short.')
  expect(field).toHaveAttribute('aria-invalid', 'true')
  expect(screen.queryByText('Explain its purpose.')).toBeNull()
})

test('floating labels use hidden legends for real gaps with a transparent shell', async () => {
  const user = userEvent.setup()
  render(<Textarea label="Notes" floating placeholder="Add notes…" />)
  const field = screen.getByRole('textbox', { name: 'Notes' })
  const shell = field.closest('[data-slot="input-control"]')!
  expect(shell).toHaveClass('bg-transparent', 'border-transparent')
  expect(shell.querySelectorAll('fieldset[aria-hidden="true"] legend')).toHaveLength(2)
  expect(field).toHaveAttribute('placeholder', 'Add notes…')
  expect(field).toHaveClass('placeholder:opacity-0')
  await user.type(field, 'A note\nAnother line')
  expect(field).toHaveValue('A note\nAnother line')
  expect(screen.getByText('Notes', { selector: 'label' }).className).not.toMatch(/\bbg-/)
})

test('aria-label, disabled, readOnly, mono and native props are forwarded', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<Textarea aria-label="Notes" disabled mono defaultValue="Original" />)
  const field = screen.getByRole('textbox', { name: 'Notes' })
  expect(field).toBeDisabled()
  expect(field).toHaveAttribute('spellcheck', 'false')
  expect(field).toHaveAttribute('autocapitalize', 'off')
  await user.type(field, 'ignored')
  expect(field).toHaveValue('Original')
  rerender(<Textarea aria-label="Notes" readOnly defaultValue="Original" wrap="hard" />)
  await user.type(field, 'ignored')
  expect(field).toHaveValue('Original')
  expect(field).toHaveAttribute('wrap', 'hard')
})

test('counts UTF-16 with native maxLength without announcing every keystroke', async () => {
  const user = userEvent.setup()
  render(
    <Textarea
      label="Notes"
      defaultValue="🌊"
      showCount
      maxLength={4}
      helperText="Keep it short."
      aria-describedby="external"
    />,
  )
  const field = screen.getByRole('textbox', { name: 'Notes' })
  expect(screen.getByText('2 / 4')).not.toHaveAttribute('aria-live')
  await user.type(field, 'abc')
  expect(field).toHaveValue('🌊ab')
  expect(screen.getByText('4 / 4')).toBeVisible()
  expect(field).toHaveAccessibleDescription('4 / 4 Keep it short.')
  expect(field.getAttribute('aria-describedby')).toMatch(/^external /)
})

test('controlled changes preserve over-limit text and update the counter', () => {
  const { rerender } = render(
    <Textarea label="Notes" value="Long text" onChange={() => {}} maxLength={4} showCount />,
  )
  const field = screen.getByRole('textbox', { name: 'Notes' })
  expect(field).toHaveValue('Long text')
  expect(field).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText('9 / 4')).toHaveClass('text-danger')
  rerender(<Textarea label="Notes" value="ok" onChange={() => {}} maxLength={4} showCount />)
  expect(field).toHaveValue('ok')
  expect(field).not.toHaveAttribute('aria-invalid')
  expect(screen.getByText('2 / 4')).toBeVisible()
})

test('composition events and entered text pass through without truncation', () => {
  const onChange = vi.fn()
  const onCompositionEnd = vi.fn()
  render(
    <Textarea label="Notes" showCount onChange={onChange} onCompositionEnd={onCompositionEnd} />,
  )
  const field = screen.getByRole('textbox', { name: 'Notes' })
  fireEvent.compositionStart(field)
  fireEvent.input(field, { target: { value: '輸入中' }, isComposing: true })
  fireEvent.compositionEnd(field, { data: '輸入中' })
  expect(field).toHaveValue('輸入中')
  expect(screen.getByText('3')).toBeVisible()
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onCompositionEnd).toHaveBeenCalledTimes(1)
})

test('reset updates the count, including external forms, and respects preventDefault', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <>
      <form id="notes" />
      <Textarea label="Notes" form="notes" defaultValue={'a\r\nb'} showCount />
    </>,
  )
  const field = screen.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement
  expect(screen.getByText('3')).toBeVisible()
  await user.type(field, 'c')
  expect(screen.getByText('4')).toBeVisible()
  await act(async () => field.form!.reset())
  expect(field).toHaveValue('a\nb')
  await waitFor(() => expect(screen.getByText('3')).toBeVisible())
  rerender(
    <>
      <form id="notes" onReset={(event) => event.preventDefault()} />
      <Textarea label="Notes" form="notes" defaultValue={'a\r\nb'} showCount />
    </>,
  )
  fireEvent.input(field, { target: { value: 'a\nbd' } })
  await act(async () => field.form!.reset())
  expect(field).toHaveValue('a\nbd')
  expect(screen.getByText('4')).toBeVisible()
})

// jsdom has no layout. These are browser measurements fed into the sizing behavior, not CSS tests.
function mockLayout() {
  const layout = { content: 40, width: 300, visible: true, notify: () => {} }
  vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockImplementation(
    () => layout.content,
  )
  vi.spyOn(HTMLTextAreaElement.prototype, 'getClientRects').mockImplementation(
    () => (layout.visible ? [new DOMRect()] : []) as unknown as DOMRectList,
  )
  vi.spyOn(HTMLTextAreaElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, layout.width, 80),
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        layout.notify = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  return layout
}

const measurementStyle = {
  lineHeight: '20px',
  padding: '10px',
  border: '0px',
  boxSizing: 'border-box',
} as const

test('reset reads the restored value after the native event microtask checkpoint', async () => {
  vi.useFakeTimers()
  const layout = mockLayout()
  render(
    <form>
      <Textarea label="Notes" defaultValue="Seed" autoResize showCount style={measurementStyle} />
    </form>,
  )
  const field = screen.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement
  layout.content = 200
  fireEvent.input(field, { target: { value: 'changed text' } })
  expect(field.style.height).toBe('200px')
  // Native button clicks may finish the reset handler's microtasks before the default action.
  // fireEvent dispatches only the event; emulate the browser restoring its value afterward.
  await act(async () => fireEvent.reset(field.form!))
  field.value = field.defaultValue
  layout.content = 40
  act(() => {
    vi.runOnlyPendingTimers()
  })
  expect(screen.getByText('4')).toBeVisible()
  expect(field.style.height).toBe('80px')
})

test('autoResize grows, caps with scroll, shrinks and follows controlled updates', () => {
  const layout = mockLayout()
  const { rerender } = render(
    <Textarea label="Notes" autoResize minRows={3} maxRows={5} style={measurementStyle} />,
  )
  const field = screen.getByRole('textbox', { name: 'Notes' })
  expect(field).toHaveStyle({ height: '80px', overflowY: 'hidden' })
  layout.content = 100
  fireEvent.input(field, { target: { value: 'more text' } })
  expect(field).toHaveStyle({ height: '100px' })
  layout.content = 200
  fireEvent.input(field, { target: { value: 'a lot of text' } })
  expect(field).toHaveStyle({ height: '120px', overflowY: 'auto' })
  layout.content = 40
  fireEvent.input(field, { target: { value: '' } })
  expect(field).toHaveStyle({ height: '80px', overflowY: 'hidden' })
  layout.content = 200
  rerender(
    <Textarea label="Notes" autoResize value="External text" readOnly style={measurementStyle} />,
  )
  expect(field).toHaveStyle({ height: '200px', overflowY: 'hidden' })
})

test('autoResize responds to width, hidden-to-visible, font load and form reset', async () => {
  const layout = mockLayout()
  layout.visible = false
  layout.width = 0
  const fonts = Object.assign(new EventTarget(), { ready: Promise.resolve() })
  Object.defineProperty(document, 'fonts', { value: fonts, configurable: true })
  const { unmount } = render(
    <form>
      <Textarea label="Notes" autoResize defaultValue="Original" style={measurementStyle} />
    </form>,
  )
  const field = screen.getByRole('textbox', { name: 'Notes' }) as HTMLTextAreaElement
  expect(field.style.height).toBe('')
  layout.visible = true
  layout.width = 300
  layout.content = 100
  act(() => layout.notify())
  expect(field.style.height).toBe('100px')
  layout.width = 150
  layout.content = 180
  act(() => layout.notify())
  expect(field.style.height).toBe('180px')
  layout.content = 200
  act(() => {
    fonts.dispatchEvent(new Event('loadingdone'))
  })
  expect(field.style.height).toBe('200px')
  layout.content = 40
  await act(async () => field.form!.reset())
  await waitFor(() => expect(field.style.height).toBe('80px'))
  unmount()
  Reflect.deleteProperty(document, 'fonts')
})

test('switching back to manual height releases measured height and scrolling', () => {
  mockLayout()
  const { rerender } = render(<Textarea label="Notes" autoResize style={measurementStyle} />)
  const field = screen.getByRole('textbox', { name: 'Notes' })
  expect(field).toHaveStyle({ height: '80px' })
  rerender(<Textarea label="Notes" rows={4} resize="vertical" style={measurementStyle} />)
  expect(field.style.height).toBe('')
  expect(field.style.overflowY).toBe('')
  expect(field).toHaveAttribute('rows', '4')
  expect(field).toHaveClass('resize-y')
})

test.each([0, -1, 1.5, Infinity])('rejects invalid row counts: %s', (minRows) => {
  expect(() => render(<Textarea label="Notes" autoResize minRows={minRows} />)).toThrow(RangeError)
})

test('rejects maxRows below minRows', () => {
  expect(() => render(<Textarea label="Notes" autoResize minRows={5} maxRows={3} />)).toThrow(
    RangeError,
  )
})

// Compile-time API checks: callers choose one height mode and supply an accessible name.
const invalidProps: TextareaProps[] = [
  // @ts-expect-error autoResize excludes native rows
  { label: 'Notes', autoResize: true, rows: 3 },
  // @ts-expect-error autoResize excludes manual resize
  { label: 'Notes', autoResize: true, resize: 'vertical' },
  // @ts-expect-error minRows requires autoResize
  { label: 'Notes', minRows: 3 },
  // @ts-expect-error an accessible name is required
  {},
  // @ts-expect-error floating requires a visible label
  { 'aria-label': 'Notes', floating: true },
]
void invalidProps
