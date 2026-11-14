import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode, useState } from 'react'
import { Button } from '../button'
import { DialogHeader } from '../dialog'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  type DrawerCloseReason,
  DrawerFooter,
  DrawerHeader,
  type DrawerProps,
} from './drawer'

/*
 * jsdom has HTMLDialogElement but no showModal()/close(), and no Element.getAnimations().
 * Stand-ins that follow the platform steps the drawer relies on: showModal() remembers the focused
 * element and focuses the first focusable inside, close() restores that focus and fires `close`.
 * No animations, so the exit closes right away.
 */
const proto = HTMLDialogElement.prototype
const original = {
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  showModal: proto.showModal,
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  close: proto.close,
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  getAnimations: Element.prototype.getAnimations,
}
const previouslyFocused = new WeakMap<HTMLDialogElement, Element | null>()
const focusable = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]'

beforeAll(() => {
  proto.showModal = function (this: HTMLDialogElement) {
    if (this.open) throw new DOMException('Dialog is already open', 'InvalidStateError')
    previouslyFocused.set(this, document.activeElement)
    this.setAttribute('open', '')
    this.querySelector<HTMLElement>(focusable)?.focus()
  }
  proto.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.removeAttribute('open')
    ;(previouslyFocused.get(this) as HTMLElement | null)?.focus()
    this.dispatchEvent(new Event('close'))
  }
  Element.prototype.getAnimations = () => []
})

afterAll(() => {
  proto.showModal = original.showModal
  proto.close = original.close
  Element.prototype.getAnimations = original.getAnimations
})

afterEach(() => {
  vi.restoreAllMocks()
})

type HarnessProps = Partial<Omit<DrawerProps, 'open' | 'onOpenChange' | 'children'>> & {
  onOpenChange?: (open: boolean, reason: DrawerCloseReason) => void
  children?: ReactNode
}

const filters = (
  <>
    <DrawerHeader title="Filters" description="Narrow the project list." />
    <DrawerBody>
      <p>Body text</p>
    </DrawerBody>
    <DrawerFooter>
      <Button intent="secondary">Reset</Button>
      <Button>Apply</Button>
    </DrawerFooter>
  </>
)

/** A trigger and a drawer with real state, so close requests actually close it. */
function Harness({ onOpenChange, children = filters, ...props }: HarnessProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        {...props}
        open={open}
        onOpenChange={(next, reason) => {
          onOpenChange?.(next, reason)
          setOpen(next)
        }}
      >
        {children}
      </Drawer>
    </>
  )
}

const trigger = () => screen.getByRole('button', { name: 'Open drawer' })
const drawer = () => document.querySelector('dialog') as HTMLDialogElement

async function openDrawer(props: HarnessProps = {}) {
  const user = userEvent.setup()
  const onOpenChange = vi.fn()
  render(<Harness onOpenChange={onOpenChange} {...props} />)
  await user.click(trigger())
  expect(drawer()).toHaveAttribute('open')
  return { user, onOpenChange }
}

describe('Drawer', () => {
  it('stays closed and empty until opened', () => {
    render(<Harness />)
    expect(drawer()).not.toHaveAttribute('open')
    expect(drawer()).toBeEmptyDOMElement()
    expect(drawer()).toHaveAttribute('data-slot', 'drawer')
  })

  it('is named and described by its DrawerHeader', async () => {
    await openDrawer()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName('Filters')
    expect(dialog).toHaveAccessibleDescription('Narrow the project list.')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Filters')
  })

  it('takes aria-label as its name without a header', async () => {
    await openDrawer({
      'aria-label': 'Navigation',
      children: <DrawerClose aria-label="Close navigation" />,
    })
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Navigation')
    expect(drawer()).not.toHaveAttribute('aria-labelledby')
  })

  it('warns in development when it has no name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await openDrawer({ children: <DrawerBody>Unnamed</DrawerBody> })
    await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringMatching(/accessible name/)))
  })

  it('does not warn when a header names it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await openDrawer()
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)))
    expect(warn).not.toHaveBeenCalled()
  })

  it('moves focus inside on open', async () => {
    await openDrawer()
    expect(drawer()).toContainElement(document.activeElement as HTMLElement)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('closes on Esc and returns focus to the trigger', async () => {
    const { onOpenChange } = await openDrawer()
    const event = new Event('cancel', { cancelable: true })
    act(() => {
      drawer().dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false, 'escape')
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveFocus()
    expect(drawer()).toBeEmptyDOMElement()
  })

  it('closes on a backdrop click, not on a click inside the panel', async () => {
    const { onOpenChange } = await openDrawer()
    const body = screen.getByText('Body text')
    fireEvent.pointerDown(body)
    fireEvent.click(body)
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.pointerDown(drawer())
    fireEvent.click(drawer())
    expect(onOpenChange).toHaveBeenCalledWith(false, 'backdrop')
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveFocus()
  })

  it("closes from the header's close button", async () => {
    const { user, onOpenChange } = await openDrawer()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false, 'close-button')
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveFocus()
  })

  it('closes from DrawerClose in a custom header', async () => {
    const { user, onOpenChange } = await openDrawer({
      'aria-label': 'Navigation',
      children: (
        <div>
          <span>Brand</span>
          <DrawerClose aria-label="Close navigation" />
        </div>
      ),
    })
    const close = screen.getByRole('button', { name: 'Close navigation' })
    expect(close).toHaveFocus()
    await user.click(close)
    expect(onOpenChange).toHaveBeenCalledWith(false, 'close-button')
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveFocus()
  })

  it('defaults to the right edge at md (384px)', async () => {
    await openDrawer()
    expect(drawer()).toHaveAttribute('data-side', 'right')
    expect(drawer()).toHaveAttribute('data-size', 'md')
    expect(drawer()).toHaveClass('w-[384px]', 'ml-auto', 'mr-0')
    expect(drawer()).toHaveClass('motion-safe:starting:open:translate-x-full')
    const panel = drawer().querySelector('[data-slot="drawer-panel"]')
    expect(panel).toHaveClass('border-l')
    expect(panel).not.toHaveClass('rounded-xl')
  })

  it.each([
    ['sm', 'w-[280px]'],
    ['md', 'w-[384px]'],
    ['lg', 'w-[480px]'],
  ] as const)('maps size %s to %s', async (size, width) => {
    await openDrawer({ size })
    expect(drawer()).toHaveAttribute('data-size', size)
    expect(drawer()).toHaveClass(width, 'max-w-[calc(100vw-56px)]')
  })

  it('slides from the left edge with the hairline on its right', async () => {
    await openDrawer({ side: 'left' })
    expect(drawer()).toHaveAttribute('data-side', 'left')
    expect(drawer()).toHaveClass('mr-auto', 'ml-0', 'motion-safe:starting:open:-translate-x-full')
    expect(drawer().querySelector('[data-slot="drawer-panel"]')).toHaveClass('border-r')
  })

  it('lays out header, scrolling body and footer inside one panel', async () => {
    await openDrawer()
    const panel = drawer().querySelector('[data-slot="drawer-panel"]')
    const slots = Array.from(panel?.children ?? []).map((el) => el.getAttribute('data-slot'))
    expect(slots).toEqual(['drawer-header', 'drawer-body', 'drawer-footer'])
    expect(drawer().querySelector('[data-slot="drawer-body"]')).toHaveClass(
      'flex-1',
      'overflow-y-auto',
    )
  })

  it('throws a clear error for its parts outside a Drawer, and for Dialog parts inside one', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<DrawerHeader title="Orphan" />)).toThrow(/inside <Drawer>/)
    expect(() => render(<DrawerClose aria-label="Close" />)).toThrow(/inside <Drawer>/)
    expect(() =>
      render(
        <Drawer open onOpenChange={() => {}} aria-label="Mixed">
          <DialogHeader title="Wrong part" />
        </Drawer>,
      ),
    ).toThrow(/inside <Dialog>/)
  })
})
