import { act, fireEvent, render, screen } from '@testing-library/react'
import { type ReactNode, StrictMode } from 'react'
import { Button } from '../button'
import { Dialog, DialogBody, type DialogCloseReason, DialogFooter, DialogHeader } from './dialog'

/*
 * jsdom has HTMLDialogElement but no showModal()/close(), and no Element.getAnimations() or
 * animate(). Minimal stand-ins, scoped to this file: showModal() throws on an open dialog like
 * browsers do (so a double call fails a test), close() fires `close` synchronously (browsers queue
 * it), animate() returns a cancelable no-op.
 */
const proto = HTMLDialogElement.prototype
const original = {
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  showModal: proto.showModal,
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  close: proto.close,
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  getAnimations: Element.prototype.getAnimations,
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  animate: Element.prototype.animate,
}
let animations: Animation[] = []

beforeAll(() => {
  proto.showModal = function (this: HTMLDialogElement) {
    if (this.open) throw new DOMException('Dialog is already open', 'InvalidStateError')
    this.setAttribute('open', '')
  }
  proto.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  Element.prototype.getAnimations = () => animations
  Element.prototype.animate = () => ({ cancel: () => {} }) as unknown as Animation
})

afterAll(() => {
  proto.showModal = original.showModal
  proto.close = original.close
  Element.prototype.getAnimations = original.getAnimations
  Element.prototype.animate = original.animate
})

afterEach(() => {
  animations = []
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// jsdom has no matchMedia; this one matches only the given queries
function stubMedia(...matching: string[]) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: matching.includes(query) }))
}

const swell = [
  { scale: '1', easing: 'ease-out' },
  { scale: '1.02', easing: 'ease-out' },
  { scale: '1' },
]

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean, reason: DialogCloseReason) => void
  alert?: boolean
  dismissible?: boolean
  description?: ReactNode
  closeButton?: boolean
  children?: ReactNode
}

function renderDialog({
  open = true,
  onOpenChange = vi.fn(),
  description = 'This runs on the prod cluster.',
  closeButton,
  children,
  ...props
}: Props = {}) {
  const ui = (o: boolean) => (
    <Dialog open={o} onOpenChange={onOpenChange} {...props}>
      <DialogHeader title="Sync app" description={description} closeButton={closeButton} />
      <DialogBody>
        <p>Body text</p>
      </DialogBody>
      <DialogFooter>
        <Button intent="secondary">Cancel</Button>
        <Button>Sync</Button>
      </DialogFooter>
      {children}
    </Dialog>
  )
  const result = render(ui(open))
  const dialog = result.container.querySelector('dialog') as HTMLDialogElement
  return { ...result, dialog, onOpenChange, rerenderOpen: (o: boolean) => result.rerender(ui(o)) }
}

function cancel(dialog: HTMLDialogElement) {
  const event = new Event('cancel', { cancelable: true })
  act(() => {
    dialog.dispatchEvent(event)
  })
  return event
}

describe('Dialog', () => {
  it('opens as a modal when open is true', () => {
    const showModal = vi.spyOn(proto, 'showModal')
    const { dialog } = renderDialog()
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(dialog.open).toBe(true)
    expect(dialog).toHaveAttribute('data-slot', 'dialog')
  })

  it('renders nothing inside and stays closed when open is false', () => {
    const showModal = vi.spyOn(proto, 'showModal')
    const { dialog } = renderDialog({ open: false })
    expect(showModal).not.toHaveBeenCalled()
    expect(dialog.open).toBe(false)
    expect(dialog).toBeEmptyDOMElement()
  })

  it('is labelled by the title and described by the description', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName('Sync app')
    expect(dialog).toHaveAccessibleDescription('This runs on the prod cluster.')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sync app')
  })

  it('omits aria-describedby without a description', () => {
    const { dialog } = renderDialog({ description: null })
    expect(dialog).not.toHaveAttribute('aria-describedby')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('is an alertdialog without a close button when alert', () => {
    renderDialog({ alert: true })
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Sync app')
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('shows the close button on an alert dialog when asked', () => {
    renderDialog({ alert: true, closeButton: true })
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('asks to close on Esc and prevents the native close', () => {
    const { dialog, onOpenChange } = renderDialog()
    const event = cancel(dialog)
    expect(event.defaultPrevented).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false, 'escape')
    expect(dialog.open).toBe(true)
  })

  it('bounces instead of closing on Esc when not dismissible', () => {
    const animate = vi.spyOn(Element.prototype, 'animate')
    const { dialog, onOpenChange } = renderDialog({ dismissible: false })
    const event = cancel(dialog)
    expect(event.defaultPrevented).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(animate).toHaveBeenCalledExactlyOnceWith(swell, { duration: 200 })
    expect(animate.mock.contexts[0]).toBe(dialog)
  })

  it('restarts a running bounce on a repeated refusal', () => {
    const cancelBounce = vi.fn()
    const animate = vi
      .spyOn(Element.prototype, 'animate')
      .mockImplementation(() => ({ cancel: cancelBounce }) as unknown as Animation)
    const { dialog } = renderDialog({ dismissible: false })
    cancel(dialog)
    expect(cancelBounce).not.toHaveBeenCalled()
    cancel(dialog)
    expect(cancelBounce).toHaveBeenCalledTimes(1)
    expect(animate).toHaveBeenCalledTimes(2)
  })

  it('lifts instead of swelling as a bottom sheet', () => {
    stubMedia('(width < 40rem)')
    const animate = vi.spyOn(Element.prototype, 'animate')
    const { dialog } = renderDialog({ dismissible: false })
    cancel(dialog)
    expect(animate).toHaveBeenCalledExactlyOnceWith(
      [
        { translate: '0 0', easing: 'ease-out' },
        { translate: '0 -6px', easing: 'ease-out' },
        { translate: '0 0' },
      ],
      { duration: 200 },
    )
  })

  it('does not bounce under reduced motion', () => {
    stubMedia('(prefers-reduced-motion: reduce)')
    const animate = vi.spyOn(Element.prototype, 'animate')
    const { dialog, onOpenChange } = renderDialog({ dismissible: false })
    cancel(dialog)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(animate).not.toHaveBeenCalled()
  })

  it('disables the close button when not dismissible', () => {
    const { onOpenChange } = renderDialog({ dismissible: false })
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(close)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes on a backdrop click (press and release on the dialog itself)', () => {
    const { dialog, onOpenChange } = renderDialog()
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onOpenChange).toHaveBeenCalledWith(false, 'backdrop')
  })

  it('ignores clicks inside the content', () => {
    const { onOpenChange } = renderDialog()
    const body = screen.getByText('Body text')
    fireEvent.pointerDown(body)
    fireEvent.click(body)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('ignores a press inside the content released over the backdrop', () => {
    const { dialog, onOpenChange } = renderDialog()
    fireEvent.pointerDown(screen.getByText('Body text'))
    // The click then targets the nearest common ancestor: the dialog
    fireEvent.click(dialog)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('bounces instead of closing on a backdrop click when alert', () => {
    const animate = vi.spyOn(Element.prototype, 'animate')
    const { dialog, onOpenChange } = renderDialog({ alert: true })
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(animate).toHaveBeenCalledExactlyOnceWith(swell, { duration: 200 })
  })

  it('still closes an alert dialog on Esc', () => {
    const { dialog, onOpenChange } = renderDialog({ alert: true })
    cancel(dialog)
    expect(onOpenChange).toHaveBeenCalledWith(false, 'escape')
  })

  it('asks to close from the close button', () => {
    const { onOpenChange } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false, 'close-button')
  })

  it('plays the exit before closing: data-closing first, close() once animations finish', async () => {
    const close = vi.spyOn(proto, 'close')
    let finish = () => {}
    const finished = new Promise<Animation>((resolve) => {
      finish = () => resolve({} as Animation)
    })
    const { dialog, rerenderOpen } = renderDialog()
    animations = [{ finished } as Animation]

    await act(async () => rerenderOpen(false))
    expect(dialog).toHaveAttribute('data-closing')
    expect(dialog.open).toBe(true)
    expect(close).not.toHaveBeenCalled()
    expect(screen.getByText('Body text')).toBeInTheDocument()

    await act(async () => finish())
    expect(close).toHaveBeenCalledTimes(1)
    expect(dialog.open).toBe(false)
    expect(dialog).not.toHaveAttribute('data-closing')
    expect(dialog).toBeEmptyDOMElement()
  })

  it('closes right away when there is nothing to animate', async () => {
    const { dialog, rerenderOpen } = renderDialog()
    await act(async () => rerenderOpen(false))
    expect(dialog.open).toBe(false)
  })

  it('reopening mid-exit cancels the close', async () => {
    const close = vi.spyOn(proto, 'close')
    let finish = () => {}
    const finished = new Promise<Animation>((resolve) => {
      finish = () => resolve({} as Animation)
    })
    const { dialog, rerenderOpen } = renderDialog()
    animations = [{ finished } as Animation]
    await act(async () => rerenderOpen(false))
    await act(async () => rerenderOpen(true))
    expect(dialog).not.toHaveAttribute('data-closing')
    await act(async () => finish())
    expect(close).not.toHaveBeenCalled()
    expect(dialog.open).toBe(true)
  })

  it('ignores close requests while the exit plays', async () => {
    const animate = vi.spyOn(Element.prototype, 'animate')
    animations = [{ finished: new Promise(() => {}) } as Animation]
    const { dialog, onOpenChange, rerenderOpen } = renderDialog()
    await act(async () => rerenderOpen(false))
    const event = cancel(dialog)
    expect(event.defaultPrevented).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(animate).not.toHaveBeenCalled()
  })

  it('locks page scroll until the exit has finished, padding back the scrollbar', async () => {
    const root = document.documentElement
    root.style.paddingInlineEnd = '3px'
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 15)
    let finish = () => {}
    const finished = new Promise<Animation>((resolve) => {
      finish = () => resolve({} as Animation)
    })
    const { rerenderOpen } = renderDialog()
    expect(root.style.overflow).toBe('hidden')
    expect(root.style.paddingInlineEnd).toBe('15px')

    animations = [{ finished } as Animation]
    await act(async () => rerenderOpen(false))
    // Still modal while the exit plays
    expect(root.style.overflow).toBe('hidden')
    await act(async () => finish())
    // The page's own inline values come back
    expect(root.style.overflow).toBe('')
    expect(root.style.paddingInlineEnd).toBe('3px')
    root.style.paddingInlineEnd = ''
  })

  it('keeps the scroll lock until the last stacked modal closes', async () => {
    const root = document.documentElement
    const first = renderDialog()
    const second = renderDialog()
    await act(async () => first.rerenderOpen(false))
    expect(root.style.overflow).toBe('hidden')
    await act(async () => second.rerenderOpen(false))
    expect(root.style.overflow).toBe('')
  })

  it('releases the scroll lock when unmounted while open', () => {
    const { unmount } = renderDialog()
    expect(document.documentElement.style.overflow).toBe('hidden')
    unmount()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('syncs the parent when the browser closes the dialog on its own', () => {
    const { dialog, onOpenChange } = renderDialog()
    // e.g. Chrome's close watcher on a second Esc without user activation
    act(() => dialog.close())
    expect(onOpenChange).toHaveBeenCalledWith(false, 'escape')
  })

  it('reopens when the parent keeps open true after a native close', () => {
    const showModal = vi.spyOn(proto, 'showModal')
    const { dialog } = renderDialog()
    act(() => dialog.close())
    expect(showModal).toHaveBeenCalledTimes(2)
    expect(dialog.open).toBe(true)
  })

  it('does not report a close it started itself', async () => {
    const { onOpenChange, rerenderOpen } = renderDialog()
    await act(async () => rerenderOpen(false))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('opens before React runs autoFocus, so autoFocus lands', () => {
    const calls: string[] = []
    // oxlint-disable-next-line typescript/unbound-method -- invoked below with .call(this)
    const showModal = proto.showModal
    vi.spyOn(proto, 'showModal').mockImplementation(function (this: HTMLDialogElement) {
      calls.push('showModal')
      showModal.call(this)
    })
    // oxlint-disable-next-line typescript/unbound-method -- invoked below with .call(this)
    const focus = HTMLElement.prototype.focus
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (this: HTMLElement) {
      calls.push(`focus:${this.textContent}`)
      focus.call(this)
    })
    const { rerender } = render(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogFooter>
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- this test checks that autoFocus lands inside the opened dialog */}
          <Button autoFocus>Cancel</Button>
        </DialogFooter>
      </Dialog>,
    )
    rerender(
      <Dialog open onOpenChange={() => {}}>
        <DialogFooter>
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- this test checks that autoFocus lands inside the opened dialog */}
          <Button autoFocus>Cancel</Button>
        </DialogFooter>
      </Dialog>,
    )
    expect(calls).toEqual(['showModal', 'focus:Cancel'])
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('lays out header, scrolling body and footer inside one panel', () => {
    const { dialog } = renderDialog()
    const panel = dialog.querySelector('[data-slot="dialog-panel"]')
    const slots = Array.from(panel?.children ?? []).map((el) => el.getAttribute('data-slot'))
    expect(slots).toEqual(['dialog-header', 'dialog-body', 'dialog-footer'])
    expect(dialog.querySelector('[data-slot="dialog-body"]')).toHaveClass('overflow-y-auto')
    expect(dialog.querySelector('[data-slot="dialog-footer"]')).toHaveClass('justify-end')
  })

  it('applies the size as a max width', () => {
    const { container } = render(
      <Dialog open onOpenChange={() => {}} size="lg">
        <DialogHeader title="Wide" />
      </Dialog>,
    )
    expect(container.querySelector('dialog')).toHaveClass('max-w-[640px]')
  })

  it('does not double-open under StrictMode', () => {
    const showModal = vi.spyOn(proto, 'showModal')
    const onOpenChange = vi.fn()
    render(
      <StrictMode>
        <Dialog open onOpenChange={onOpenChange}>
          <DialogHeader title="Strict" />
        </Dialog>
      </StrictMode>,
    )
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Strict')
    expect(onOpenChange).not.toHaveBeenCalled()
    // The simulated unmount released the lock; the remount takes it back
    expect(document.documentElement.style.overflow).toBe('hidden')
  })

  it('throws a clear error for parts outside a Dialog', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<DialogHeader title="Orphan" />)).toThrow(/inside <Dialog>/)
  })
})

describe('DialogHeader closeIcon', () => {
  it('replaces the X of the close button', () => {
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <DialogHeader title="Sync app" closeIcon={<svg data-testid="custom" />} />
      </Dialog>,
    )
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close).toContainElement(screen.getByTestId('custom'))
    expect(close.querySelector('[data-icon="x"]')).toBeNull()
  })
})

describe('DialogHeader closeIcon fallback', () => {
  it.each([false, null])('closeIcon={%s} keeps the X', (hidden) => {
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <DialogHeader title="Sync app" closeIcon={hidden} />
      </Dialog>,
    )
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.querySelector('[data-icon="x"]')).not.toBeNull()
  })
})
