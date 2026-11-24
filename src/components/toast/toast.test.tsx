import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { resetToasts, toast } from './store'
import { Toaster, type ToasterProps } from './toaster'

/*
 * jsdom has no getAnimations() or layout: exits finish on the fallback timer and heights measure
 * as 0. It does hide [popover] (UA rule) but has no showPopover(); the stand-in below shows it the
 * only way jsdom allows, an inline display. Timers are faked throughout so the auto-dismiss rules
 * can be checked to the millisecond.
 */
const EXIT_MS = 600
const proto = HTMLElement.prototype
// oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
const originalShowPopover = proto.showPopover

beforeAll(() => {
  proto.showPopover = function (this: HTMLElement) {
    this.style.display = 'block'
  }
})

afterAll(() => {
  proto.showPopover = originalShowPopover
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  act(() => resetToasts())
  vi.useRealTimers()
})

function setup(props?: ToasterProps, strict = false) {
  const ui = <Toaster {...props} />
  return render(strict ? <StrictMode>{ui}</StrictMode> : ui)
}

const cards = () => [...document.querySelectorAll<HTMLElement>('li[data-slot="toast"]')]
const liveCards = () => cards().filter((card) => card.dataset.removed === undefined)
const card = (id: string) =>
  document.querySelector<HTMLElement>(`li[data-slot="toast"][data-toast-id="${id}"]`)
const viewport = () => screen.getByRole('region', { name: 'Notifications (F6)' })

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function show(fn: () => string) {
  let id = ''
  act(() => {
    id = fn()
  })
  return id
}

// Leaves the toast on screen exactly `ms`, then checks it starts its exit
function expectLifetime(id: string, ms: number) {
  advance(ms - 1)
  expect(card(id)).not.toHaveAttribute('data-removed')
  advance(1)
  expect(card(id)).toHaveAttribute('data-removed')
  advance(EXIT_MS)
  expect(card(id)).toBeNull()
}

describe('API', () => {
  it('renders an always-present viewport landmark', () => {
    setup()
    expect(viewport()).toHaveAttribute('popover', 'manual')
    expect(viewport()).toHaveAttribute('data-position', 'bottom-right')
    expect(cards()).toHaveLength(0)
  })

  it.each([
    ['neutral', () => toast({ title: 'Copied' })],
    ['success', () => toast.success('Saved')],
    ['info', () => toast.info('Heads up')],
    ['warning', () => toast.warning('Drift detected')],
    ['danger', () => toast.error('Sync failed')],
    ['loading', () => toast.loading('Syncing…')],
  ])('creates a %s toast', (type, create) => {
    setup()
    const id = show(create)
    expect(id).toEqual(expect.any(String))
    expect(card(id)).toHaveAttribute('data-type', type)
  })

  it('auto-dismisses after 5s by default, 10s with an action', () => {
    setup()
    expectLifetime(
      show(() => toast.success('Saved')),
      5000,
    )
    expectLifetime(
      show(() => toast({ title: 'Deleted', action: { label: 'Undo' } })),
      10_000,
    )
    expectLifetime(
      show(() => toast.info('Short', { duration: 1200 })),
      1200,
    )
  })

  it('keeps danger and loading toasts until dismissed', () => {
    setup()
    const danger = show(() => toast.error('Sync failed'))
    const loading = show(() => toast.loading('Syncing…'))
    const sticky = show(() => toast({ title: 'Pinned', duration: Number.POSITIVE_INFINITY }))
    advance(120_000)
    for (const id of [danger, loading, sticky]) expect(card(id)).not.toHaveAttribute('data-removed')
  })

  it('updates in place by id: same node, new content, timer restarted', () => {
    setup()
    const id = show(() => toast.loading('Syncing checkout-api…', { id: 'sync' }))
    const node = card(id)
    advance(4000)
    act(() => toast.update(id, { type: 'info', title: 'Sync request accepted' }))
    expect(cards()).toHaveLength(1)
    expect(card(id)).toBe(node)
    expect(node).toHaveAttribute('data-type', 'info')
    expect(node).toHaveTextContent('Sync request accepted')
    // Same id through toast(): replaces in place too
    advance(4000)
    act(() => {
      toast.success('Sync succeeded', { id: 'sync' })
    })
    expect(cards()).toHaveLength(1)
    expect(card(id)).toBe(node)
    expect(node).toHaveAttribute('data-type', 'success')
    expectLifetime(id, 5000)
  })

  it('update() merges and ignores unknown ids', () => {
    setup()
    const id = show(() => toast.info('Title', { description: 'Kept' }))
    act(() => toast.update(id, { title: 'New title' }))
    expect(card(id)).toHaveTextContent('New title')
    expect(card(id)).toHaveTextContent('Kept')
    act(() => toast.update('nope', { title: 'x' }))
    expect(cards()).toHaveLength(1)
  })

  it('dismiss(id) closes one, dismiss() closes all, after the exit', () => {
    setup()
    const a = show(() => toast.error('A'))
    const b = show(() => toast.error('B'))
    const c = show(() => toast.error('C'))
    act(() => toast.dismiss(b))
    expect(card(b)).toHaveAttribute('data-removed')
    expect(card(b)).toHaveAttribute('inert')
    advance(EXIT_MS)
    expect(card(b)).toBeNull()
    act(() => toast.dismiss())
    expect(card(a)).toHaveAttribute('data-removed')
    expect(card(c)).toHaveAttribute('data-removed')
    advance(EXIT_MS)
    expect(cards()).toHaveLength(0)
  })

  it('promise: loading, then success from the result', async () => {
    setup()
    let resolve: (value: { name: string }) => void = () => {}
    const promise = new Promise<{ name: string }>((r) => {
      resolve = r
    })
    const id = show(() =>
      toast.promise(promise, {
        loading: 'Syncing…',
        success: (data) => ({ title: `${data.name} synced`, description: 'Healthy' }),
        error: 'Sync failed',
      }),
    )
    const node = card(id)
    expect(node).toHaveAttribute('data-type', 'loading')
    await act(async () => {
      resolve({ name: 'checkout-api' })
      await promise
    })
    expect(card(id)).toBe(node)
    expect(node).toHaveAttribute('data-type', 'success')
    expect(node).toHaveTextContent('checkout-api synced')
    expectLifetime(id, 5000)
  })

  it('promise: rejection turns it into a sticky danger toast', async () => {
    setup()
    const promise = Promise.reject(new Error('timeout'))
    const id = show(() =>
      toast.promise(promise, {
        loading: 'Syncing…',
        success: 'Synced',
        error: (error) => `Sync failed: ${(error as Error).message}`,
      }),
    )
    await act(async () => {
      await promise.catch(() => {})
    })
    expect(card(id)).toHaveAttribute('data-type', 'danger')
    expect(card(id)).toHaveTextContent('Sync failed: timeout')
    advance(60_000)
    expect(card(id)).not.toHaveAttribute('data-removed')
  })

  it('an action button runs its handler and closes, unless prevented', () => {
    setup()
    const onUndo = vi.fn()
    const id = show(() => toast({ title: 'Deleted', action: { label: 'Undo', onClick: onUndo } }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(card(id)).toHaveAttribute('data-removed')

    const retry = show(() =>
      toast.error('Failed', {
        action: { label: 'Retry', onClick: (event) => event.preventDefault() },
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(card(retry)).not.toHaveAttribute('data-removed')
  })

  it('renders a node action as-is', () => {
    setup()
    show(() => toast.info('Ready', { action: <a href="/ops/1">View operation</a> }))
    expect(screen.getByRole('link', { name: 'View operation' })).toHaveAttribute('href', '/ops/1')
  })

  it('the close button dismisses', () => {
    setup()
    const id = show(() => toast.error('Failed'))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(card(id)).toHaveAttribute('data-removed')
  })
})

describe('timer pauses', () => {
  it('hover pauses every toast; leaving resumes the remaining time', () => {
    setup()
    const id = show(() => toast.success('Saved'))
    advance(2000)
    const list = viewport().querySelector('ol') as HTMLElement
    fireEvent.pointerEnter(list, { pointerType: 'mouse' })
    expect(viewport()).toHaveAttribute('data-expanded')
    advance(20_000)
    expect(card(id)).not.toHaveAttribute('data-removed')
    fireEvent.pointerLeave(list, { pointerType: 'mouse' })
    expect(viewport()).not.toHaveAttribute('data-expanded')
    expectLifetime(id, 3000)
  })

  it('keyboard focus inside pauses and expands', () => {
    setup()
    const id = show(() => toast.success('Saved'))
    advance(1000)
    // Keyboard modality, as after Tab; a programmatic focus after a click is not focus-visible
    fireEvent.keyDown(document.body, { key: 'Tab' })
    act(() => (card(id) as HTMLElement).focus())
    expect(viewport()).toHaveAttribute('data-expanded')
    advance(20_000)
    expect(card(id)).not.toHaveAttribute('data-removed')
    act(() => (card(id) as HTMLElement).blur())
    expectLifetime(id, 4000)
  })

  it('a hidden tab pauses', () => {
    setup()
    const id = show(() => toast.success('Saved'))
    advance(1500)
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    advance(30_000)
    expect(card(id)).not.toHaveAttribute('data-removed')
    visibility.mockReturnValue('visible')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expectLifetime(id, 3500)
  })
})

describe('stack', () => {
  it('shows at most visibleToasts; the rest wait hidden and inert, timers held', () => {
    setup({ visibleToasts: 3 })
    const ids = [1, 2, 3, 4, 5].map((n) => show(() => toast.success(`Toast ${n}`)))
    const states = ids.map((id) => card(id)?.dataset.visible)
    // Newest first: 5, 4, 3 visible
    expect(states).toEqual(['false', 'false', 'true', 'true', 'true'])
    expect(card(ids[0])).toHaveAttribute('inert')
    expect(card(ids[4])).toHaveAttribute('data-index', '0')
    expect(card(ids[0])).toHaveAttribute('data-index', '4')
    // The three visible ones expire; the hidden two only start counting once they move up
    advance(5000)
    advance(EXIT_MS)
    expect(liveCards().map((c) => c.dataset.toastId)).toEqual([ids[1], ids[0]])
    expect(card(ids[1])).toHaveAttribute('data-visible', 'true')
    // Its 5s started when it became visible, EXIT_MS ago
    expectLifetime(ids[1], 5000 - EXIT_MS)
  })

  it('collapsed cards carry their stack index and scale', () => {
    setup()
    for (const n of [1, 2, 3]) show(() => toast({ title: `T${n}` }))
    const [front, second, third] = liveCards()
    expect(front.style.getPropertyValue('--toast-scale')).toBe('1')
    expect(second.style.getPropertyValue('--toast-scale')).toBe('0.95')
    expect(second.style.getPropertyValue('--toast-y')).toBe('-14px')
    expect(third.style.getPropertyValue('--toast-scale')).toBe('0.9')
    expect(third.style.getPropertyValue('--toast-y')).toBe('-28px')
    expect(second).toHaveAttribute('data-stacked')
    expect(front).not.toHaveAttribute('data-stacked')
  })

  it.each([
    ['bottom-right', '-14px'],
    ['top-center', '14px'],
  ] as const)('position %s sets data-position and the stack direction', (position, offset) => {
    setup({ position })
    expect(viewport()).toHaveAttribute('data-position', position)
    show(() => toast.info('One'))
    show(() => toast.info('Two'))
    expect(liveCards()[1].style.getPropertyValue('--toast-y')).toBe(offset)
  })
})

describe('accessibility', () => {
  it('announces through the status region, danger through the alert region', () => {
    setup()
    const status = screen.getByRole('status')
    const alert = screen.getByRole('alert')
    show(() => toast.success('Saved', { description: 'Settings apply on next sync' }))
    // Cleared now, written on the next frame
    expect(status).toHaveTextContent('')
    advance(20)
    expect(status).toHaveTextContent('Saved. Settings apply on next sync')
    expect(alert).toHaveTextContent('')
    show(() => toast.error('Sync failed'))
    advance(20)
    expect(alert).toHaveTextContent('Sync failed')
  })

  it('an update announces only the new state', () => {
    setup()
    const status = screen.getByRole('status')
    const id = show(() => toast.loading('Syncing…'))
    advance(20)
    expect(status).toHaveTextContent('Syncing…')
    act(() => toast.update(id, { type: 'success', title: 'Synced' }))
    advance(20)
    expect(status).toHaveTextContent(/^Synced$/)
  })

  it('F6 focuses the newest toast and, pressed again, returns focus', () => {
    render(
      <>
        <button type="button">Trigger</button>
        <Toaster />
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    act(() => trigger.focus())
    // Nothing to reach: left to the browser
    expect(fireEvent.keyDown(document, { key: 'F6' })).toBe(true)
    show(() => toast.info('Older'))
    const newest = show(() => toast.info('Newest'))
    fireEvent.keyDown(document, { key: 'F6' })
    expect(document.activeElement).toBe(card(newest))
    fireEvent.keyDown(document.activeElement as Element, { key: 'F6' })
    expect(document.activeElement).toBe(trigger)
    // Alt+T is the alternative
    fireEvent.keyDown(document, { key: '†', code: 'KeyT', altKey: true })
    expect(document.activeElement).toBe(card(newest))
  })

  it('Alt+T is left alone while typing (Option+T types "†" on macOS); F6 still works', () => {
    render(
      <>
        <input aria-label="Search" />
        <Toaster />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Search' })
    const newest = show(() => toast.info('Newest'))
    act(() => input.focus())
    expect(fireEvent.keyDown(input, { key: '†', code: 'KeyT', altKey: true })).toBe(true)
    expect(document.activeElement).toBe(input)
    fireEvent.keyDown(input, { key: 'F6' })
    expect(document.activeElement).toBe(card(newest))
  })

  it('Esc closes the focused toast and moves on, then returns focus', () => {
    render(
      <>
        <button type="button">Trigger</button>
        <Toaster />
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'Trigger' })
    act(() => trigger.focus())
    const older = show(() => toast.error('Older'))
    const newest = show(() => toast.error('Newest'))
    fireEvent.keyDown(document, { key: 'F6' })
    const notCancelled = fireEvent.keyDown(card(newest) as HTMLElement, { key: 'Escape' })
    expect(notCancelled).toBe(false)
    expect(card(newest)).toHaveAttribute('data-removed')
    expect(document.activeElement).toBe(card(older))
    fireEvent.keyDown(card(older) as HTMLElement, { key: 'Escape' })
    expect(card(older)).toHaveAttribute('data-removed')
    expect(document.activeElement).toBe(trigger)
  })
})

describe('swipe', () => {
  function drag(el: HTMLElement, dx: number, ms: number) {
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    advance(ms / 2)
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 100 + dx / 2, clientY: 100 })
    advance(ms / 2)
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 100 + dx, clientY: 100 })
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 100 + dx, clientY: 100 })
  }

  it('springs back below the threshold', () => {
    setup()
    const id = show(() => toast.error('Failed'))
    const el = card(id) as HTMLElement
    drag(el, 30, 1000)
    expect(el).not.toHaveAttribute('data-removed')
    expect(el).not.toHaveAttribute('data-swiping')
    expect(el.style.getPropertyValue('--toast-swipe-x')).toBe('0px')
  })

  it('dismisses past 45px, sliding out that way', () => {
    setup()
    const id = show(() => toast.error('Failed'))
    drag(card(id) as HTMLElement, 60, 1000)
    expect(card(id)).toHaveAttribute('data-removed')
    expect(card(id)).toHaveAttribute('data-swipe-out', 'right')
  })

  it('dismisses a short fast flick', () => {
    setup()
    const id = show(() => toast.error('Failed'))
    drag(card(id) as HTMLElement, 20, 40)
    expect(card(id)).toHaveAttribute('data-swipe-out', 'right')
  })

  it('damps and ignores the wrong direction', () => {
    setup()
    const id = show(() => toast.error('Failed'))
    const el = card(id) as HTMLElement
    fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 40, clientY: 100 })
    // 60px left at bottom-right moves only ~13px
    expect(Number.parseFloat(el.style.getPropertyValue('--toast-swipe-x'))).toBeCloseTo(-13.33, 1)
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 40, clientY: 100 })
    expect(el).not.toHaveAttribute('data-removed')
  })

  it('dismissible: false has no close button, ignores Esc and swipes', () => {
    setup()
    const id = show(() => toast.error('Locked', { dismissible: false }))
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    const el = card(id) as HTMLElement
    drag(el, 80, 1000)
    act(() => el.focus())
    fireEvent.keyDown(el, { key: 'Escape' })
    expect(el).not.toHaveAttribute('data-removed')
  })
})

describe('StrictMode', () => {
  it('renders and announces each toast once', () => {
    setup(undefined, true)
    show(() => toast.success('Saved'))
    advance(20)
    expect(cards()).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent(/^Saved$/)
    expect(document.querySelectorAll('[data-slot="toast-viewport"]')).toHaveLength(1)
  })

  it('a second Toaster stays empty while the first is mounted', () => {
    render(
      <>
        <Toaster />
        <Toaster />
      </>,
    )
    show(() => toast.success('Saved'))
    expect(document.querySelectorAll('[data-slot="toast-viewport"]')).toHaveLength(1)
    expect(cards()).toHaveLength(1)
  })

  it('toasterId routes a toast to the Toaster with that id, with its own position', () => {
    render(
      <>
        <Toaster />
        <Toaster id="side" position="top-left" />
      </>,
    )
    const main = show(() => toast.success('Main'))
    const side = show(() => toast.info('Side', { toasterId: 'side' }))
    const promised = show(() =>
      toast.promise(new Promise(() => {}), {
        toasterId: 'side',
        loading: 'Working',
        success: 'Done',
        error: 'Failed',
      }),
    )
    const viewportOf = (id: string) =>
      card(id)?.closest<HTMLElement>('[data-slot="toast-viewport"]')
    expect(document.querySelectorAll('[data-slot="toast-viewport"]')).toHaveLength(2)
    expect(viewportOf(main)?.dataset.position).toBe('bottom-right')
    expect(viewportOf(side)?.dataset.position).toBe('top-left')
    expect(viewportOf(promised)).toBe(viewportOf(side))
    // Shown once each, never in both stacks
    expect(cards()).toHaveLength(3)
  })
})

describe('custom icons', () => {
  it.each([false, null])('icons replaces a type icon, and %s hides it', (hidden) => {
    setup({ icons: { success: <svg data-testid="custom" />, danger: hidden } })
    const saved = show(() => toast.success('Saved'))
    const icon = card(saved)!.querySelector('[data-slot="toast-icon"]')!
    expect(icon).toContainElement(screen.getByTestId('custom'))
    expect(icon.querySelector('[data-icon="circle-check"]')).toBeNull()
    expect(icon.querySelector('[data-icon="circle-x"]')).toBeNull()
    const failed = show(() => toast.error('Failed'))
    expect(card(failed)!.querySelector('[data-slot="toast-icon"]')).toHaveClass('hidden')
  })

  it('a custom loading icon replaces both rings and spins while loading', () => {
    setup({ icons: { loading: <svg data-testid="custom" /> } })
    const id = show(() => toast.loading('Syncing…'))
    const icon = card(id)!.querySelector('[data-slot="toast-icon"]')!
    expect(screen.getByTestId('custom').parentElement).toHaveClass('animate-spin')
    expect(icon.querySelector('[data-icon="loader-circle"]')).toBeNull()
    expect(icon.querySelector('[data-icon="circle-dashed"]')).toBeNull()
  })

  it('closeIcon replaces the X of the close button', () => {
    setup({ closeIcon: <svg data-testid="custom" /> })
    const id = show(() => toast.success('Saved'))
    const close = card(id)!.querySelector('button[aria-label="Close"]')!
    expect(close).toContainElement(screen.getByTestId('custom'))
    expect(close.querySelector('[data-icon="x"]')).toBeNull()
  })
})

describe('close icon fallback', () => {
  it.each([false, null])('closeIcon={%s} keeps the X', (hidden) => {
    setup({ closeIcon: hidden })
    const id = show(() => toast.success('Saved'))
    const close = card(id)!.querySelector('button[aria-label="Close"]')!
    expect(close.querySelector('[data-icon="x"]')).not.toBeNull()
  })
})
