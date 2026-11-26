import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, StrictMode, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vite-plus/test'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  type AccordionProps,
  AccordionTrigger,
} from './accordion'

function Items({ keepMounted = true }: { keepMounted?: boolean }) {
  return (
    <>
      <AccordionItem value="general">
        <AccordionTrigger description="Project identity">General</AccordionTrigger>
        <AccordionContent keepMounted={keepMounted}>
          <input aria-label="Name" name="name" defaultValue="Payment API" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="disabled" disabled>
        <AccordionTrigger>Disabled</AccordionTrigger>
        <AccordionContent>Unavailable</AccordionContent>
      </AccordionItem>
      <AccordionItem value="advanced">
        <AccordionTrigger>Advanced</AccordionTrigger>
        <AccordionContent region>Advanced content</AccordionContent>
      </AccordionItem>
    </>
  )
}
const trigger = (name = 'General') => screen.getByRole('button', { name })
const panel = (name = 'General') =>
  document.getElementById(trigger(name).getAttribute('aria-controls')!)!

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('native headings, unique ARIA targets, description, optional region and refs', () => {
  const root = createRef<HTMLDivElement>(),
    item = createRef<HTMLDivElement>(),
    button = createRef<HTMLButtonElement>(),
    content = createRef<HTMLDivElement>()
  render(
    <>
      <Accordion headingLevel={2} defaultValue="a" ref={root}>
        <AccordionItem value="a" ref={item}>
          <AccordionTrigger ref={button} description="Details">
            Title
          </AccordionTrigger>
          <AccordionContent
            ref={content}
            region
            className="custom-inner"
            contentClassName="custom-outer"
          >
            Body
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion>
        <Items />
      </Accordion>
    </>,
  )
  expect(screen.getByRole('heading', { level: 2 })).toContainElement(button.current)
  expect(button.current).toHaveAccessibleName('Title')
  expect(button.current).toHaveAccessibleDescription('Details')
  expect(content.current).toHaveAccessibleName('Title')
  expect(content.current).toHaveClass('custom-outer')
  expect(content.current?.firstElementChild).toHaveClass('custom-inner')
  expect(root.current).toContainElement(item.current)
  expect(item.current).toContainElement(content.current)
  expect(button.current).toHaveAttribute('aria-controls', content.current?.id)
  expect(panel()).not.toHaveAttribute('role')
  const ids = [...document.querySelectorAll('[id]')].map((node) => node.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('single toggles with native Enter/Space, switches panels and never submits a form', async () => {
  const user = userEvent.setup(),
    submit = vi.fn(),
    change = vi.fn()
  render(
    <form onSubmit={submit}>
      <Accordion onValueChange={change}>
        <Items />
      </Accordion>
    </form>,
  )
  await user.tab()
  await user.keyboard('{Enter}')
  expect(trigger()).toHaveAttribute('aria-expanded', 'true')
  await user.keyboard(' ')
  expect(change).toHaveBeenLastCalledWith(null)
  await user.click(trigger('Advanced'))
  await user.click(trigger())
  expect(panel('Advanced')).toHaveAttribute('hidden')
  expect(submit).not.toHaveBeenCalled()
})

test('multiple preserves selection order and permits all panels closed', async () => {
  const user = userEvent.setup(),
    change = vi.fn()
  render(
    <Accordion type="multiple" onValueChange={change}>
      <Items />
    </Accordion>,
  )
  await user.click(trigger('Advanced'))
  await user.click(trigger())
  expect(change).toHaveBeenLastCalledWith(['advanced', 'general'])
  await user.click(trigger('Advanced'))
  await user.click(trigger())
  expect(change).toHaveBeenLastCalledWith([])
})

test('controlled values only change when the owner updates, including null and disabled items', async () => {
  const user = userEvent.setup(),
    change = vi.fn()
  const { rerender } = render(
    <Accordion value={null} onValueChange={change}>
      <Items />
    </Accordion>,
  )
  await user.click(trigger())
  expect(change).toHaveBeenLastCalledWith('general')
  expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  rerender(
    <Accordion value="disabled" onValueChange={change}>
      <Items />
    </Accordion>,
  )
  expect(trigger('Disabled')).toHaveAttribute('aria-expanded', 'true')
  expect(panel('Disabled')).not.toHaveAttribute('hidden')
})

test('locked open item remains focusable and can switch to another item', async () => {
  const user = userEvent.setup()
  render(
    <Accordion defaultValue="general" collapsible={false}>
      <Items />
    </Accordion>,
  )
  await user.tab()
  expect(trigger()).toHaveFocus()
  expect(trigger()).toHaveAttribute('aria-disabled', 'true')
  expect(trigger()).not.toBeDisabled()
  await user.keyboard('{Enter}')
  expect(trigger()).toHaveAttribute('aria-expanded', 'true')
  await user.click(trigger('Advanced'))
  expect(trigger('Advanced')).toHaveAttribute('aria-disabled', 'true')
  expect(trigger()).toHaveAttribute('aria-expanded', 'false')
})

test('arrows move focus only, skip disabled, stop at edges; Tab still visits open fields', async () => {
  const user = userEvent.setup(),
    change = vi.fn()
  render(
    <Accordion defaultValue="general" onValueChange={change}>
      <Items />
    </Accordion>,
  )
  await user.tab()
  await user.keyboard('{ArrowDown}{ArrowDown}')
  expect(trigger('Advanced')).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  await user.keyboard('{Home}{ArrowUp}')
  expect(trigger()).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('textbox')).toHaveFocus()
  await user.keyboard('{End}')
  expect(screen.getByRole('textbox')).toHaveFocus()
  await user.tab()
  expect(trigger('Advanced')).toHaveFocus()
})

test('nested groups isolate selection and keyboard handling from their parent', async () => {
  const user = userEvent.setup()
  render(
    <Accordion defaultValue="parent">
      <AccordionItem value="parent">
        <AccordionTrigger>Parent</AccordionTrigger>
        <AccordionContent>
          <Accordion headingLevel={4}>
            <Items />
          </Accordion>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="other">
        <AccordionTrigger>Other parent</AccordionTrigger>
        <AccordionContent>Other</AccordionContent>
      </AccordionItem>
    </Accordion>,
  )
  await user.click(trigger())
  await user.keyboard('{End}')
  expect(trigger('Advanced')).toHaveFocus()
  expect(trigger('Parent')).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('heading', { level: 4, name: 'General' })).toBeInTheDocument()
})

test('preventDefault cancels toggling and keyboard movement; descriptions accept zero', async () => {
  const user = userEvent.setup()
  render(
    <Accordion onKeyDown={(event) => event.preventDefault()}>
      <AccordionItem value="a">
        <AccordionTrigger description={0} onClick={(event) => event.preventDefault()}>
          General
        </AccordionTrigger>
        <AccordionContent>Body</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Advanced</AccordionTrigger>
        <AccordionContent>Other</AccordionContent>
      </AccordionItem>
    </Accordion>,
  )
  await user.click(trigger())
  await user.keyboard('{End}')
  expect(trigger()).toHaveFocus()
  expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  expect(trigger()).toHaveAccessibleDescription('0')
})

test('keepMounted preserves input state and FormData while hidden and inert', async () => {
  const user = userEvent.setup()
  const { container } = render(
    <form>
      <Accordion defaultValue="general">
        <Items />
      </Accordion>
    </form>,
  )
  const field = screen.getByRole('textbox')
  await user.clear(field)
  await user.type(field, 'Draft')
  await user.click(trigger())
  expect(panel()).toHaveAttribute('hidden')
  expect(panel()).toHaveAttribute('inert')
  expect(panel()).toHaveAttribute('aria-hidden', 'true')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(new FormData(container.querySelector('form')!).get('name')).toBe('Draft')
  await user.click(trigger())
  expect(field).toHaveValue('Draft')
  expect(panel()).not.toHaveAttribute('inert')
})

test('keepMounted=false unmounts fields but keeps a stable aria-controls target', async () => {
  const user = userEvent.setup()
  render(
    <Accordion>
      <Items keepMounted={false} />
    </Accordion>,
  )
  expect(panel()).toBeInTheDocument()
  expect(within(panel()).queryByLabelText('Name')).not.toBeInTheDocument()
  await user.click(trigger())
  await user.type(screen.getByRole('textbox'), ' edited')
  await user.click(trigger())
  expect(within(panel()).queryByLabelText('Name')).not.toBeInTheDocument()
  await user.click(trigger())
  expect(screen.getByRole('textbox')).toHaveValue('Payment API')
})

test('disabling the group preserves values and does not disable content', async () => {
  const user = userEvent.setup()
  render(
    <Accordion defaultValue="general" disabled>
      <Items />
    </Accordion>,
  )
  expect(trigger()).toBeDisabled()
  expect(screen.getByRole('textbox')).not.toBeDisabled()
  await user.click(trigger())
  expect(trigger()).toHaveAttribute('aria-expanded', 'true')
})

test('external close restores focused content to its trigger, then enabled neighbor, then root', () => {
  const root = createRef<HTMLDivElement>()
  function Demo({
    value,
    itemDisabled = false,
    disabled = false,
  }: {
    value: string | null
    itemDisabled?: boolean
    disabled?: boolean
  }) {
    return (
      <Accordion value={value} disabled={disabled} ref={root}>
        <AccordionItem value="general" disabled={itemDisabled}>
          <AccordionTrigger>General</AccordionTrigger>
          <AccordionContent>
            <input aria-label="Field" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="next">
          <AccordionTrigger>Next</AccordionTrigger>
          <AccordionContent>Next</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }
  const { rerender } = render(<Demo value="general" />)
  screen.getByRole('textbox').focus()
  rerender(<Demo value={null} />)
  expect(trigger()).toHaveFocus()
  rerender(<Demo value="general" itemDisabled />)
  screen.getByRole('textbox').focus()
  rerender(<Demo value={null} itemDisabled />)
  expect(trigger('Next')).toHaveFocus()
  rerender(<Demo value="general" disabled />)
  screen.getByRole('textbox').focus()
  rerender(<Demo value={null} disabled />)
  expect(root.current).toHaveFocus()
  expect(root.current).not.toHaveAttribute('tabindex')
})

test('external close never steals focus from outside', () => {
  const { rerender } = render(
    <>
      <button>Outside</button>
      <Accordion value="general">
        <Items />
      </Accordion>
    </>,
  )
  screen.getByRole('button', { name: 'Outside' }).focus()
  rerender(
    <>
      <button>Outside</button>
      <Accordion value={null}>
        <Items />
      </Accordion>
    </>,
  )
  expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus()
})

test('removing an item restores focus and clears uncontrolled value without resurrecting it; StrictMode is safe', async () => {
  function Demo() {
    const [show, setShow] = useState(true)
    return (
      <>
        <button onClick={() => setShow(!show)}>Toggle item</button>
        <Accordion defaultValue="a">
          {show && (
            <AccordionItem value="a">
              <AccordionTrigger>A</AccordionTrigger>
              <AccordionContent>
                <input aria-label="Field" />
              </AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="b">
            <AccordionTrigger>B</AccordionTrigger>
            <AccordionContent>Body</AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    )
  }
  render(
    <StrictMode>
      <Demo />
    </StrictMode>,
  )
  screen.getByRole('textbox').focus()
  fireEvent.click(screen.getByRole('button', { name: 'Toggle item' }))
  await waitFor(() => expect(trigger('B')).toHaveFocus())
  fireEvent.click(screen.getByRole('button', { name: 'Toggle item' }))
  expect(trigger('A')).toHaveAttribute('aria-expanded', 'false')
})

test('empty and duplicate values fail clearly', () => {
  expect(() =>
    render(
      <Accordion>
        <AccordionItem value=" ">Empty</AccordionItem>
      </Accordion>,
    ),
  ).toThrow('non-empty')
  expect(() =>
    render(
      <Accordion>
        <AccordionItem value="a" />
        <AccordionItem value="a" />
      </Accordion>,
    ),
  ).toThrow('unique')
})

type PendingAnimation = { resolve: () => void; cancel: ReturnType<typeof vi.fn> }
function mockMotion(reduce = false) {
  const pending: PendingAnimation[] = []
  const animate = vi.fn(() => {
    let resolve!: () => void
    const finished = new Promise<void>((done) => {
      resolve = done
    })
    const cancel = vi.fn()
    pending.push({ resolve, cancel })
    return { finished, cancel } as unknown as Animation
  })
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate })
  const media = { matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  vi.stubGlobal('matchMedia', () => media)
  const resize = { callback: () => {}, disconnect: vi.fn() }
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize.callback = callback
      }
      observe() {}
      disconnect = resize.disconnect
    },
  )
  return { pending, animate, media, resize }
}
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'animate')
})

test('no animation on SSR/initial mount; closed server content is inaccessible', () => {
  const { animate } = mockMotion()
  const html = renderToString(
    <Accordion defaultValue="general">
      <Items />
    </Accordion>,
  )
  expect(html).toContain('hidden=""')
  expect(html).toContain('inert=""')
  render(
    <Accordion defaultValue="general">
      <Items />
    </Accordion>,
  )
  expect(animate).not.toHaveBeenCalled()
})

test('closing marks content inert immediately, unmounts only after animation finishes', async () => {
  const { pending } = mockMotion()
  render(
    <Accordion defaultValue="general">
      <Items keepMounted={false} />
    </Accordion>,
  )
  fireEvent.click(trigger())
  expect(panel()).not.toHaveAttribute('hidden')
  expect(panel()).toHaveAttribute('inert')
  expect(panel()).toHaveAttribute('aria-hidden', 'true')
  expect(within(panel()).getByLabelText('Name')).toBeInTheDocument()
  await act(async () => pending[0].resolve())
  expect(panel()).toHaveAttribute('hidden')
  expect(within(panel()).queryByLabelText('Name')).not.toBeInTheDocument()
})

test('rapid reversal ignores stale completion, retargets resized opening content and releases fixed height', async () => {
  const { pending, animate, resize } = mockMotion()
  render(
    <Accordion defaultValue="general">
      <Items />
    </Accordion>,
  )
  fireEvent.click(trigger())
  fireEvent.click(trigger())
  expect(pending[0].cancel).toHaveBeenCalled()
  await act(async () => pending[0].resolve())
  expect(panel()).not.toHaveAttribute('hidden')
  const inner = panel().firstElementChild!
  vi.spyOn(inner, 'getBoundingClientRect').mockReturnValue({ height: 240 } as DOMRect)
  act(() => resize.callback())
  expect(animate).toHaveBeenLastCalledWith(
    expect.arrayContaining([{ height: '240px' }]),
    expect.objectContaining({ duration: 200 }),
  )
  await act(async () => pending.at(-1)!.resolve())
  expect(panel().style.height).toBe('')
  expect(panel().style.overflow).toBe('')
  expect(panel()).not.toHaveAttribute('inert')
})

test('reduced motion switches immediately, including when enabled mid-animation', async () => {
  const { media, pending } = mockMotion()
  render(
    <Accordion defaultValue="general">
      <Items keepMounted={false} />
    </Accordion>,
  )
  fireEvent.click(trigger())
  media.matches = true
  await act(async () => media.addEventListener.mock.calls.at(-1)![1]())
  expect(panel()).toHaveAttribute('hidden')
  expect(pending[0].cancel).toHaveBeenCalled()
  fireEvent.click(trigger())
  expect(pending).toHaveLength(1)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

test('mode-specific API rejects incompatible value types and mixed controlled/default props', () => {
  const single: AccordionProps = { value: null }
  const multiple: AccordionProps = { type: 'multiple', value: ['a'] }
  // @ts-expect-error Single uses a string or null, not an array.
  const wrongSingle: AccordionProps = { type: 'single', value: [] }
  // @ts-expect-error Multiple does not have collapsible.
  const wrongMultiple: AccordionProps = { type: 'multiple', collapsible: false }
  // @ts-expect-error Controlled and default values cannot be combined.
  const mixed: AccordionProps = { value: 'a', defaultValue: 'b' }
  expect([single, multiple, wrongSingle, wrongMultiple, mixed]).toHaveLength(5)
})

test('chevronIcon replaces the chevron, sized and turned with the item', () => {
  render(
    <Accordion defaultValue="general">
      <AccordionItem value="general">
        <AccordionTrigger chevronIcon={<svg data-testid="custom" />}>General</AccordionTrigger>
        <AccordionContent>Body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  )
  const slot = screen.getByTestId('custom').parentElement
  expect(slot).toHaveAttribute('data-slot', 'accordion-chevron')
  expect(slot).toHaveClass('[&_:where(svg:not([class*=size-]))]:size-4', 'rotate-180')
  expect(trigger().querySelector('[data-icon="chevron-down"]')).toBeNull()
})

test.each([false, null])('chevronIcon={%s} keeps the chevron', (hidden) => {
  render(
    <Accordion defaultValue="general">
      <AccordionItem value="general">
        <AccordionTrigger chevronIcon={hidden}>General</AccordionTrigger>
        <AccordionContent>Body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  )
  expect(trigger().querySelector('[data-icon="chevron-down"]')).not.toBeNull()
})
