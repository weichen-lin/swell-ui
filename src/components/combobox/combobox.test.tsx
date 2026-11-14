import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, StrictMode, useState } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test'
import { Combobox } from './combobox'
import type { ComboboxOption, ComboboxProps } from './types'

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'showPopover', {
    configurable: true,
    value(this: HTMLElement) {
      this.style.display = 'block'
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
    configurable: true,
    value(this: HTMLElement) {
      this.style.display = 'none'
    },
  })
})
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover')
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover')
})

const options: ComboboxOption[] = [
  { value: 'api', label: 'Payment API', keywords: ['金流'], description: 'Payment service' },
  { value: 'legacy', label: 'Legacy API', disabled: true },
  { value: 'analytics', label: 'Analytics' },
  { value: 'cafe', label: 'Café' },
]
const input = () => screen.getByRole('combobox')
const selected = () => screen.getByRole('option', { selected: true })

// The browser's top-layer operation is independent of the focus/selection state under test.
test('labels and forwards the native ref; name submits the ID rather than display text', () => {
  const ref = createRef<HTMLInputElement>()
  const { container } = render(
    <form>
      <Combobox
        label="Project"
        options={options}
        defaultValue="api"
        name="project"
        helperText="Choose one"
        ref={ref}
      />
    </form>,
  )
  expect(input()).toHaveAccessibleName('Project')
  expect(input()).toHaveAccessibleDescription('Choose one')
  expect(input()).toHaveValue('Payment API')
  expect(input()).not.toHaveAttribute('name')
  expect(ref.current).toBe(input())
  expect(new FormData(container.querySelector('form')!).getAll('project')).toEqual(['api'])
})

test('typing filters labels/keywords/accents without committing; Enter commits a highlighted result', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const textChange = vi.fn()
  render(
    <Combobox
      label="Project"
      options={options}
      defaultValue="api"
      onValueChange={change}
      onInputValueChange={textChange}
    />,
  )
  await user.click(input())
  expect(selected()).toHaveAccessibleName('Payment API')
  await user.clear(input())
  await user.type(input(), 'cafe')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(input()).not.toHaveAttribute('aria-activedescendant')
  await user.keyboard('{ArrowDown}{Enter}')
  expect(input()).toHaveValue('Café')
  expect(change).toHaveBeenLastCalledWith('cafe', { reason: 'select', option: options[3] })
  expect(textChange).toHaveBeenLastCalledWith('Café', { reason: 'selection' })
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  await user.click(input())
  await user.clear(input())
  await user.type(input(), '金流')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(screen.getByRole('option')).toHaveAccessibleName('Payment API')
})

test('arrows preview with focus in the input, skip disabled, stop at edges and preserve text editing keys', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  render(<Combobox label="Project" options={options} defaultValue="api" onValueChange={change} />)
  await user.tab()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  await user.keyboard('{ArrowDown}{ArrowDown}')
  expect(input()).toHaveFocus()
  expect(input()).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Analytics' }).id,
  )
  expect(selected()).toHaveAccessibleName('Payment API')
  expect(change).not.toHaveBeenCalled()
  await user.keyboard('{ArrowDown}{ArrowDown}')
  expect(input()).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Café' }).id,
  )
  const home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })
  fireEvent(input(), home)
  expect(home.defaultPrevented).toBe(false)
  await user.keyboard('{Enter}')
  expect(change).toHaveBeenCalledTimes(1)
})

test('Escape and outside interaction cancel a non-empty draft; clearing really clears', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  render(
    <>
      <Combobox label="Project" options={options} defaultValue="api" onValueChange={change} />
      <button>Outside</button>
    </>,
  )
  await user.click(input())
  fireEvent.change(input(), { target: { value: 'Anal' } })
  await user.keyboard('{ArrowDown}{Escape}')
  expect(input()).toHaveValue('Payment API')
  expect(change).not.toHaveBeenCalled()
  await user.click(input())
  fireEvent.change(input(), { target: { value: 'Anal' } })
  await user.click(screen.getByRole('button', { name: 'Outside' }))
  expect(input()).toHaveValue('Payment API')
  await user.click(screen.getByRole('button', { name: 'Clear selection' }))
  expect(input()).toHaveFocus()
  expect(input()).toHaveValue('')
  expect(change).toHaveBeenLastCalledWith(null, { reason: 'clear', option: null })
})

test('controlled selection stays authoritative; external value and null update the display', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const { rerender } = render(
    <Combobox label="Project" options={options} value="api" onValueChange={change} />,
  )
  await user.click(input())
  await user.click(screen.getByRole('option', { name: 'Analytics' }))
  expect(change).toHaveBeenLastCalledWith('analytics', { reason: 'select', option: options[2] })
  expect(input()).toHaveValue('Payment API')
  rerender(<Combobox label="Project" options={options} value="analytics" />)
  expect(input()).toHaveValue('Analytics')
  rerender(<Combobox label="Project" options={options} value={null} />)
  expect(input()).toHaveValue('')
})

test('controlled text and open callbacks support a fully controlled owner', async () => {
  const user = userEvent.setup()
  function Demo() {
    const [value, setValue] = useState<string | null>(null)
    const [text, setText] = useState('')
    const [open, setOpen] = useState(false)
    return (
      <Combobox
        label="Project"
        options={options}
        value={value}
        onValueChange={setValue}
        inputValue={text}
        onInputValueChange={setText}
        open={open}
        onOpenChange={setOpen}
      />
    )
  }
  render(<Demo />)
  await user.type(input(), 'Anal')
  await user.keyboard('{ArrowDown}{Enter}')
  expect(input()).toHaveValue('Analytics')
  expect(input()).toHaveAttribute('aria-expanded', 'false')
  await user.click(screen.getByRole('button', { name: 'Clear selection' }))
  expect(input()).toHaveValue('')
})

test('required checks selection, including typed but uncommitted text; popup Enter does not submit', async () => {
  const user = userEvent.setup()
  const submit = vi.fn((event) => event.preventDefault())
  const { container } = render(
    <form onSubmit={submit}>
      <Combobox label="Project" options={options} required name="project" />
      <button>Submit</button>
    </form>,
  )
  const form = container.querySelector('form')!
  await user.type(input(), 'Anal')
  expect(form.checkValidity()).toBe(false)
  await user.keyboard('{Enter}')
  expect(submit).not.toHaveBeenCalled()
  expect(input()).toHaveAttribute('aria-invalid', 'true')
  await user.keyboard('{ArrowDown}{Enter}')
  expect(form.checkValidity()).toBe(true)
  expect(input()).not.toHaveAttribute('aria-invalid')
  await user.keyboard('{Enter}')
  expect(submit).toHaveBeenCalledTimes(1)
  expect(new FormData(form).get('project')).toBe('analytics')
})

test('disabled excludes submission; readOnly stays copyable and submits without actions', async () => {
  const user = userEvent.setup()
  const { container, rerender } = render(
    <form>
      <Combobox label="Project" options={options} defaultValue="api" name="project" disabled />
    </form>,
  )
  await user.click(input())
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(new FormData(container.querySelector('form')!).has('project')).toBe(false)
  rerender(
    <form>
      <Combobox label="Project" options={options} defaultValue="api" name="project" readOnly />
    </form>,
  )
  await user.click(input())
  expect(input()).toHaveFocus()
  expect(input()).toHaveAttribute('readonly')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(new FormData(container.querySelector('form')!).get('project')).toBe('api')
})

test('groups are named, same labels have distinct IDs, and disabled options resist clicks', async () => {
  const user = userEvent.setup()
  render(
    <Combobox
      label="Project"
      options={[
        { label: 'Production', options },
        { label: 'Sandbox', options: [{ value: 'other', label: 'Analytics' }] },
      ]}
    />,
  )
  await user.click(input())
  expect(screen.getByRole('group', { name: 'Production' })).toBeInTheDocument()
  await user.click(screen.getByRole('option', { name: 'Legacy API' }))
  expect(input()).toHaveValue('')
  const duplicates = screen.getAllByRole('option', { name: 'Analytics' })
  expect(duplicates[0].id).not.toBe(duplicates[1].id)
  await user.click(within(screen.getByRole('group', { name: 'Sandbox' })).getByRole('option'))
  expect(input()).toHaveValue('Analytics')
})

test('external results bypass filtering, preserve selected metadata, and invalidate stale highlights', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const { rerender } = render(
    <Combobox
      label="Project"
      options={options}
      value="api"
      onValueChange={change}
      filter={false}
    />,
  )
  await user.click(input())
  fireEvent.change(input(), { target: { value: 'unrelated' } })
  expect(screen.getAllByRole('option')).toHaveLength(4)
  await user.keyboard('{ArrowDown}')
  rerender(
    <Combobox
      label="Project"
      options={[options[2]]}
      value="api"
      onValueChange={change}
      filter={false}
    />,
  )
  expect(input()).not.toHaveAttribute('aria-activedescendant')
  await user.keyboard('{Enter}{Escape}')
  expect(change).not.toHaveBeenCalled()
  expect(input()).toHaveValue('Payment API')
})

test('selectedOption resolves missing IDs; unresolved IDs cannot pass validation', () => {
  const { container, rerender } = render(
    <form>
      <Combobox label="Project" options={[]} value="remote" />
    </form>,
  )
  expect(input()).toHaveValue('')
  expect(container.querySelector('form')!.checkValidity()).toBe(false)
  rerender(
    <form>
      <Combobox
        label="Project"
        options={[]}
        value="remote"
        selectedOption={{ value: 'remote', label: 'Remote user' }}
      />
    </form>,
  )
  expect(input()).toHaveValue('Remote user')
  expect(container.querySelector('form')!.checkValidity()).toBe(true)
})

test('loading blocks stale selection; search errors and retry are outside the listbox', async () => {
  const user = userEvent.setup()
  const retry = vi.fn()
  const change = vi.fn()
  const { rerender } = render(
    <Combobox label="Project" options={options} loading onValueChange={change} />,
  )
  await user.type(input(), 'api')
  expect(screen.getAllByText('Loading…')).toHaveLength(2)
  expect(screen.queryByRole('option')).not.toBeInTheDocument()
  await user.keyboard('{ArrowDown}{Enter}')
  expect(change).not.toHaveBeenCalled()
  rerender(
    <Combobox label="Project" options={options} searchError="Request failed" onRetry={retry} />,
  )
  expect(within(screen.getByRole('listbox')).queryByText('Request failed')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('listbox')).toBeInTheDocument()
})

test('empty results are a status, never a selectable option', async () => {
  const user = userEvent.setup()
  render(<Combobox label="Project" options={options} emptyText="Nothing here" />)
  await user.type(input(), 'zzzz')
  expect(screen.getByText('Nothing here')).toBeInTheDocument()
  expect(screen.queryByRole('option')).not.toBeInTheDocument()
  expect(screen.getByText('0 options available.')).toHaveAttribute('aria-live', 'polite')
})

test('IME Enter is not intercepted and completed composition is searchable', async () => {
  const user = userEvent.setup()
  const changes = vi.fn()
  render(<Combobox label="Project" options={options} onInputValueChange={changes} />)
  await user.click(input())
  fireEvent.compositionStart(input())
  fireEvent.change(input(), { target: { value: '金流' } })
  const enter = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
    isComposing: true,
  })
  fireEvent(input(), enter)
  expect(enter.defaultPrevented).toBe(false)
  expect(changes).not.toHaveBeenCalled()
  fireEvent.compositionEnd(input(), { data: '金流' })
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(changes).toHaveBeenLastCalledWith('金流', { reason: 'input' })
})

test('native reset restores initial selection and empty groups without value callbacks', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  render(
    <StrictMode>
      <form>
        <Combobox label="Project" options={options} defaultValue="api" onValueChange={change} />
        <Combobox label="Empty" options={options} />
        <button type="reset">Reset</button>
      </form>
    </StrictMode>,
  )
  const first = screen.getByRole('combobox', { name: 'Project' })
  const second = screen.getByRole('combobox', { name: 'Empty' })
  await user.click(first)
  await user.click(screen.getByRole('option', { name: 'Analytics' }))
  await user.click(second)
  await user.click(screen.getByRole('option', { name: 'Café' }))
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(first).toHaveValue('Payment API'))
  expect(second).toHaveValue('')
  expect(change).toHaveBeenCalledTimes(1)
})

test('external form resets, controlled onReset and preventDefault are honored', async () => {
  const user = userEvent.setup()
  function Demo({ cancel = false }: { cancel?: boolean }) {
    const [value, setValue] = useState<string | null>('api')
    return (
      <>
        <form
          id="owner"
          onReset={(e) => {
            if (cancel) e.preventDefault()
            else setValue(null)
          }}
        >
          <button type="reset">Reset</button>
        </form>
        <Combobox
          label="Project"
          name="project"
          form="owner"
          options={options}
          value={value}
          onValueChange={setValue}
        />
      </>
    )
  }
  const { container, rerender } = render(<Demo cancel />)
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  expect(input()).toHaveValue('Payment API')
  rerender(<Demo />)
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(input()).toHaveValue(''))
  expect(new FormData(container.querySelector('form')!).get('project')).toBe('')
})

test('Escape only stops propagation while open; Tab never commits a preview', async () => {
  const user = userEvent.setup()
  const outer = vi.fn()
  // Capture bubbling to emulate a parent overlay's Escape handling.
  render(
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- test-only parent event observer.
    <div onKeyDown={outer}>
      <Combobox label="Project" options={options} defaultValue="api" />
      <button>Next</button>
    </div>,
  )
  await user.click(input())
  await user.keyboard('{ArrowDown}')
  outer.mockClear()
  await user.keyboard('{Escape}')
  expect(outer).not.toHaveBeenCalled()
  await user.keyboard('{Escape}')
  expect(outer).toHaveBeenCalledTimes(1)
  await user.click(input())
  await user.keyboard('{ArrowDown}{Tab}')
  expect(input()).toHaveValue('Payment API')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('floating preserves the real notch and visible placeholder remains separate from the label', () => {
  const { container } = render(
    <Combobox
      label="Project"
      options={options}
      floating
      placeholder="Find a project"
      defaultValue="api"
    />,
  )
  expect(input()).toHaveAccessibleName('Project')
  expect(container.querySelectorAll('fieldset[aria-hidden]')).toHaveLength(2)
  expect(input()).toHaveAttribute('placeholder', 'Find a project')
})

test('openOnFocus can be opted into and disabled while open closes the popup', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<Combobox label="Project" options={options} openOnFocus />)
  await user.tab()
  expect(screen.getByRole('listbox')).toBeInTheDocument()
  rerender(<Combobox label="Project" options={options} openOnFocus disabled />)
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('unmount cleans up a pending form reset', async () => {
  const { container, unmount } = render(
    <form>
      <Combobox label="Project" options={options} />
    </form>,
  )
  fireEvent.reset(container.querySelector('form')!)
  unmount()
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1))
  })
})

test('duplicate and empty IDs are rejected', () => {
  expect(() => render(<Combobox label="Project" options={[options[0], options[0]]} />)).toThrow(
    'unique',
  )
  expect(() =>
    render(<Combobox label="Project" options={[{ value: '', label: 'Empty' }]} />),
  ).toThrow('non-empty')
})

test('a controlled initial text does not emit callbacks during mount', () => {
  const change = vi.fn()
  render(
    <Combobox label="Project" options={options} inputValue="draft" onInputValueChange={change} />,
  )
  expect(input()).toHaveValue('draft')
  expect(change).not.toHaveBeenCalled()
})

test('controlled IME text is retained locally until composition finishes', async () => {
  const user = userEvent.setup()
  function Demo() {
    const [text, setText] = useState('')
    return (
      <Combobox label="Project" options={options} inputValue={text} onInputValueChange={setText} />
    )
  }
  render(<Demo />)
  await user.click(input())
  fireEvent.compositionStart(input())
  fireEvent.change(input(), { target: { value: '金流' } })
  expect(input()).toHaveValue('金流')
  fireEvent.compositionEnd(input(), { data: '金流' })
  expect(input()).toHaveValue('金流')
  expect(screen.getAllByRole('option')).toHaveLength(1)
})

test('loading completion cannot resurrect an old highlight even if the array is unchanged', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const { rerender } = render(<Combobox label="Project" options={options} onValueChange={change} />)
  await user.click(input())
  await user.keyboard('{ArrowDown}')
  expect(input()).toHaveAttribute('aria-activedescendant')
  rerender(<Combobox label="Project" options={options} loading onValueChange={change} />)
  rerender(<Combobox label="Project" options={options} onValueChange={change} />)
  expect(input()).not.toHaveAttribute('aria-activedescendant')
  await user.keyboard('{Enter}')
  expect(change).not.toHaveBeenCalled()
})

test('reset remembers the original option label after remote results and selection change', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <form>
      <Combobox label="Project" options={options} defaultValue="api" />
      <button type="reset">Reset</button>
    </form>,
  )
  await user.click(input())
  await user.click(screen.getByRole('option', { name: 'Analytics' }))
  rerender(
    <form>
      <Combobox label="Project" options={[options[2]]} defaultValue="api" />
      <button type="reset">Reset</button>
    </form>,
  )
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(input()).toHaveValue('Payment API'))
})

test('popup flips, clamps to the visual viewport and tracks viewport changes without moving focus', async () => {
  const user = userEvent.setup()
  const originalViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  const viewport = Object.assign(new EventTarget(), {
    offsetLeft: 0,
    offsetTop: 0,
    width: 320,
    height: 240,
  })
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 250,
    y: 180,
    left: 250,
    top: 180,
    right: 490,
    bottom: 218,
    width: 240,
    height: 38,
    toJSON() {},
  })
  const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(120)
  const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(240)
  const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(180)
  try {
    const { container, unmount } = render(<Combobox label="Project" options={options} />)
    await user.click(input())
    const popup = container.querySelector<HTMLElement>('[data-slot="combobox-content"]')!
    expect(popup).toHaveAttribute('data-side', 'top')
    expect(popup.style.left).toBe('72px')
    expect(popup.style.top).toBe('56px')
    expect(popup.style.maxHeight).toBe('168px')
    expect(input()).toHaveFocus()
    viewport.height = 600
    act(() => {
      viewport.dispatchEvent(new Event('resize'))
    })
    expect(popup).toHaveAttribute('data-side', 'bottom')
    expect(popup.style.top).toBe('222px')
    expect(popup.style.maxHeight).toBe('280px')
    unmount()
    act(() => {
      viewport.dispatchEvent(new Event('resize'))
    })
  } finally {
    rect.mockRestore()
    height.mockRestore()
    width.mockRestore()
    scrollHeight.mockRestore()
    if (originalViewport) Object.defineProperty(window, 'visualViewport', originalViewport)
    else Reflect.deleteProperty(window, 'visualViewport')
  }
})

const invalidProps: ComboboxProps[] = [
  // @ts-expect-error label or aria-label is required
  { options },
  // @ts-expect-error controlled and uncontrolled selection are mutually exclusive
  { label: 'Project', options, value: 'api', defaultValue: 'api' },
  // @ts-expect-error controlled and uncontrolled open state are mutually exclusive
  { label: 'Project', options, open: true, defaultOpen: true },
  // @ts-expect-error floating needs a visible label
  { 'aria-label': 'Project', options, floating: true },
]
void invalidProps
