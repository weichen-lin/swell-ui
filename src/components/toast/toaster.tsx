import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../icons'
import { cn } from '../../lib/cn'
import { iconOr } from '../../lib/icon-slots'
import { Button } from '../button'
import {
  dismiss,
  getServerSnapshot,
  getSnapshot,
  isActionButton,
  removeToast,
  resolveDuration,
  type SwipeDirection,
  subscribe,
  type ToastRecord,
  type ToastType,
} from './store'

export type ToastPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'top-center'

export type ToasterProps = {
  /**
   * Shows only toasts created with this `toasterId`. Without one it shows toasts that have none:
   * that's the app's single main Toaster. Ids let a separate area (or each Storybook docs story)
   * keep its own stack and position.
   */
  id?: string
  /**
   * Corner (or edge center) the stack grows from: bottom-right, bottom-left, bottom-center,
   * top-right, top-left or top-center.
   * @defaultValue 'bottom-right'
   */
  position?: ToastPosition
  /**
   * Cards shown in the collapsed stack; older ones wait hidden. At most 2 on phones.
   * @defaultValue 3
   */
  visibleToasts?: number
  /**
   * Overrides the leading icon per type: `success`, `info`, `warning`, `danger`, `loading`. Each is
   * sized to 16px and tinted by its type; `false` or `null` hides that type's icon. A `loading`
   * icon is spun by the toast (still under reduced motion), so pass a static one. Neutral toasts
   * have no icon.
   * @defaultValue a check circle, an info circle, a triangle, an X circle and a circular loader
   */
  icons?: Partial<Record<ToastIconType, ReactNode>>
  /** Icon of each toast's close button, sized to the button's icon size. Defaults to an X. */
  closeIcon?: ReactNode
}

type ToastIconType = Exclude<ToastType, 'neutral'>

// Stack geometry from Sonner (measured): each card behind the front one sits 14px further back
// and 5% smaller; expanded, cards are 14px apart
const GAP = 14
const SCALE_STEP = 0.05
// Swipe: Sonner's thresholds, distance or flick speed
const SWIPE_DISTANCE = 45
const SWIPE_VELOCITY = 0.11
// Exits are awaited through getAnimations(); this only covers environments without it, or an
// animation that never settles
const EXIT_FALLBACK_MS = 600
// Entry runs 350ms; past it a card counts as settled and keeps still when the viewport moves
const ENTER_MS = 400
const MOBILE_QUERY = '(width <= 600px)'
const MOBILE_VISIBLE = 2
// Top and bottom border of the card, which the measured body doesn't include
const CARD_BORDERS = 2

/*
 * Only one Toaster per id renders. A second one with the same id stays empty until the first
 * unmounts, so the shared store never shows a toast twice.
 */
const owners: { owner: symbol; id: string | undefined }[] = []
const ownerListeners = new Set<() => void>()

function subscribeOwners(listener: () => void) {
  ownerListeners.add(listener)
  return () => {
    ownerListeners.delete(listener)
  }
}

function useIsActiveToaster(id: string | undefined) {
  const [owner] = useState(() => Symbol('toaster'))
  useLayoutEffect(() => {
    const entry = { owner, id }
    owners.push(entry)
    for (const listener of ownerListeners) listener()
    return () => {
      owners.splice(owners.indexOf(entry), 1)
      for (const listener of ownerListeners) listener()
    }
  }, [owner, id])
  return useSyncExternalStore(
    subscribeOwners,
    () => owners.find((entry) => entry.id === id)?.owner === owner,
    () => false,
  )
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  )
}

function useDocumentHidden() {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange)
      return () => document.removeEventListener('visibilitychange', onChange)
    },
    () => document.visibilityState === 'hidden',
    () => false,
  )
}

function isFocusVisible(el: Element | null) {
  if (!el) return false
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

function showPopover(el: HTMLElement | null) {
  if (!el?.isConnected || typeof el.showPopover !== 'function') return
  let open = false
  try {
    open = el.matches(':popover-open')
  } catch {
    // Selector unknown (older engines, jsdom): showPopover() below is still safe to try
  }
  try {
    if (!open) el.showPopover()
  } catch {
    // Already showing, or popover unsupported: the viewport still renders as a fixed element
  }
}

// Open modal dialogs that aren't on their way out; the rest of the page is inert while one is open
function modalDialogs() {
  try {
    return [...document.querySelectorAll<HTMLDialogElement>('dialog:modal')].filter(
      (dialog) => !dialog.hasAttribute('data-closing'),
    )
  } catch {
    return []
  }
}

/*
 * The portal target is a host div owned here, not by React, so it can be re-parented without React
 * noticing: React only ever touches the host's children. A modal <dialog> makes everything outside
 * it inert, top-layer popovers included, so while one is open the host moves into the topmost one
 * and the viewport popover is shown again from there. Moving the DOM (instead of switching the
 * portal container) keeps the React tree, so timers, focus and router context survive.
 */
function useToastHost(enabled: boolean) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    if (!enabled) return
    const el = document.createElement('div')
    el.dataset.slot = 'toast-host'
    // No box of its own: the viewport is fixed, the announcers are visually hidden
    el.style.display = 'contents'
    document.body.append(el)
    // oxlint-disable-next-line react/set-state-in-effect -- the host exists only once attached on commit; the portal renders into it on the next pass
    setHost(el)
    return () => {
      el.remove()
      setHost(null)
    }
  }, [enabled])
  return host
}

function useFollowModalDialogs(host: HTMLElement, viewportRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    // Stacking order of the open modals, so a nested dialog wins over the one beneath it
    const stack: HTMLDialogElement[] = []
    const relocate = () => {
      const open = modalDialogs()
      for (let i = stack.length - 1; i >= 0; i--) if (!open.includes(stack[i])) stack.splice(i, 1)
      for (const dialog of open) if (!stack.includes(dialog)) stack.push(dialog)
      const target = stack.at(-1) ?? document.body
      const viewport = viewportRef.current
      if (host.parentElement !== target) {
        // Settled cards would replay their entry (@starting-style applies again once the popover
        // is re-shown); data-moving turns their transitions off until styles are flushed
        viewport?.setAttribute('data-moving', '')
        target.append(host)
        showPopover(viewport)
        void viewport?.offsetWidth
        viewport?.removeAttribute('data-moving')
      } else {
        showPopover(viewport)
      }
    }
    relocate()
    const observer = new MutationObserver(relocate)
    observer.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['open', 'data-closing'],
    })
    return () => observer.disconnect()
  }, [host, viewportRef])
}

/**
 * The single place toasts render: mount one near the app root (inside the router, so a `<Link>`
 * action has its context). Toasts themselves come from `toast()` and friends.
 */
export function Toaster(props: ToasterProps) {
  const active = useIsActiveToaster(props.id)
  const host = useToastHost(active)
  if (!host) return null
  return createPortal(<Viewport {...props} host={host} />, host)
}

type Layout = { index: number; offset: number; visible: boolean }

type ViewportProps = ToasterProps & { host: HTMLElement }

const positionClasses: Record<ToastPosition, string> = {
  'bottom-right': 'top-auto bottom-6 left-auto right-6 max-[601px]:bottom-4',
  'bottom-left': 'top-auto bottom-6 left-6 right-auto max-[601px]:bottom-4',
  'bottom-center': 'top-auto bottom-6 left-1/2 right-auto -translate-x-1/2 max-[601px]:bottom-4',
  'top-right': 'top-6 bottom-auto left-auto right-6 max-[601px]:top-4',
  'top-left': 'top-6 bottom-auto left-6 right-auto max-[601px]:top-4',
  'top-center': 'top-6 bottom-auto left-1/2 right-auto -translate-x-1/2 max-[601px]:top-4',
}

function Viewport({
  id,
  position = 'bottom-right',
  visibleToasts = 3,
  icons = {},
  closeIcon,
  host,
}: ViewportProps) {
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // Memoized: effects below key off the list's identity, which must only change with the store
  const toasts = useMemo(() => all.filter((t) => t.toasterId === id), [all, id])
  const viewportRef = useRef<HTMLElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [heights, setHeights] = useState<Record<number, number>>({})
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const mobile = useMediaQuery(MOBILE_QUERY)
  const documentHidden = useDocumentHidden()

  useFollowModalDialogs(host, viewportRef)

  const live = toasts.filter((t) => !t.removed)
  const limit = Math.max(1, mobile ? Math.min(visibleToasts, MOBILE_VISIBLE) : visibleToasts)
  const expanded = live.length > 0 && (hovered || focusWithin)
  const paused = expanded || interacting || documentHidden
  const frontHeight = live.length ? heights[live[0].key] : undefined

  const layouts = new Map<number, Layout>()
  let before = 0
  live.forEach((t, index) => {
    layouts.set(t.key, { index, offset: before + index * GAP, visible: index < limit })
    before += heights[t.key] ?? 0
  })

  const onHeight = useCallback((key: number, height: number | undefined) => {
    setHeights((prev) => {
      if (prev[key] === height) return prev
      const next = { ...prev }
      if (height === undefined) delete next[key]
      else next[key] = height
      return next
    })
  }, [])

  /*
   * Announcements go through two always-present, visually hidden live regions rather than the
   * cards (a region must exist before its content changes to be announced). Clearing first and
   * writing on the next frame makes a repeat of the same text announce again; toasts arriving in
   * the same frame are read together.
   */
  const pending = useRef({ polite: [] as string[], assertive: [] as string[], frame: 0 })
  const announce = useCallback((text: string, assertive: boolean) => {
    const queue = pending.current
    const list = assertive ? queue.assertive : queue.polite
    const region = assertive ? alertRef.current : statusRef.current
    if (!region || list.includes(text)) return
    list.push(text)
    region.textContent = ''
    if (queue.frame) return
    queue.frame = requestAnimationFrame(() => {
      queue.frame = 0
      if (statusRef.current && queue.polite.length)
        statusRef.current.textContent = queue.polite.join(' ')
      if (alertRef.current && queue.assertive.length)
        alertRef.current.textContent = queue.assertive.join(' ')
      queue.polite = []
      queue.assertive = []
    })
  }, [])
  useEffect(() => {
    const queue = pending.current
    return () => cancelAnimationFrame(queue.frame)
  }, [])

  const restoreFocus = useCallback(() => {
    const target = returnFocus.current
    returnFocus.current = null
    if (target?.isConnected && target !== document.body) target.focus({ preventScroll: true })
    const viewport = viewportRef.current
    // Nowhere to go back to (or it is inert now): just leave the viewport
    if (viewport?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
  }, [])

  // A focused toast is closing. Keyboard users move on to the next toast in the stack (React
  // Aria), or back to where they came from after the last; a mouse click just gives focus back.
  const onFocusLost = useCallback(
    (index: number) => {
      const viewport = viewportRef.current
      if (viewport && isFocusVisible(document.activeElement)) {
        const cards = [
          ...viewport.querySelectorAll<HTMLElement>(
            'li[data-slot="toast"]:not([data-removed]):not([inert])',
          ),
        ].sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index))
        const next = cards.find((card) => Number(card.dataset.index) >= index) ?? cards.at(-1)
        if (next) {
          next.focus({ preventScroll: true })
          return
        }
      }
      restoreFocus()
    },
    [restoreFocus],
  )

  // F6 (the landmark-cycling key React Aria and Base UI use) and Alt+T (Sonner) jump to the newest
  // toast and, pressed again from inside, back to where focus was. Without toasts the keys are left
  // to the browser.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const f6 = event.key === 'F6' && !event.altKey && !event.ctrlKey && !event.metaKey
      // Not while typing: on macOS Option+T types "†", and stealing it would break text entry
      const target = event.target instanceof HTMLElement ? event.target : null
      const typing =
        !!target && (target.isContentEditable || target.matches('input, textarea, select'))
      const altT =
        event.code === 'KeyT' && event.altKey && !event.ctrlKey && !event.metaKey && !typing
      const viewport = viewportRef.current
      if ((!f6 && !altT) || event.defaultPrevented || !viewport) return
      if (viewport.contains(document.activeElement)) {
        event.preventDefault()
        restoreFocus()
        return
      }
      const newest = viewport.querySelector<HTMLElement>(
        'li[data-slot="toast"][data-index="0"]:not([data-removed])',
      )
      if (!newest) return
      event.preventDefault()
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      newest.focus({ preventScroll: true })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [restoreFocus])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return
    const card = (event.target as Element).closest<HTMLElement>('li[data-slot="toast"]')
    if (!card || card.dataset.dismissible === undefined || !card.dataset.toastId) return
    // Handled here: inside a dialog, Esc would otherwise close the dialog too
    event.preventDefault()
    event.stopPropagation()
    dismiss(card.dataset.toastId)
  }

  // Keyboard focus inside expands the stack and holds the timers; a mouse click doesn't, or the
  // stack would stay frozen after clicking a button until focus went elsewhere
  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    const from = event.relatedTarget
    if (!event.currentTarget.contains(from) && returnFocus.current === null)
      returnFocus.current = from instanceof HTMLElement ? from : null
    setFocusWithin(isFocusVisible(event.target))
  }
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setFocusWithin(false)
    returnFocus.current = null
  }

  // Hover with a mouse or pen only: a touch would expand the stack under the finger mid-swipe
  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') setHovered(true)
  }
  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') setHovered(false)
  }

  const [y, x] = position.split('-') as ['top' | 'bottom', 'left' | 'right' | 'center']
  // Sonner's defaults: toward the edge the stack sits on, plus the side for corner positions
  const directions: SwipeDirection[] = x === 'center' ? [y] : [y, x]

  return (
    <>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keys, focus and pointer state bubble up from the cards; the region itself is only the F6 target */}
      <section
        ref={viewportRef}
        popover="manual"
        aria-label="Notifications (F6)"
        tabIndex={-1}
        data-slot="toast-viewport"
        data-position={position}
        data-expanded={expanded || undefined}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPointerDown={() => setInteracting(true)}
        onPointerUp={() => setInteracting(false)}
        onPointerCancel={() => setInteracting(false)}
        className={cn(
          // Undo the popover UA box (inset 0, auto margin, border, padding, Canvas colors, scroll):
          // the viewport is a zero-height anchor and the cards hang off it
          'group/viewport fixed m-0 h-auto w-95 overflow-visible border-0 bg-transparent p-0 text-fg outline-none',
          // Full-width, 16px-inset cards at Sonner's breakpoint (600px and below)
          'max-[601px]:inset-x-4 max-[601px]:w-auto max-[601px]:translate-x-0',
          positionClasses[position],
        )}
      >
        <ol
          className="relative m-0 list-none p-0"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {toasts.map((record) => (
            <ToastCard
              key={record.key}
              record={record}
              layout={layouts.get(record.key)}
              total={live.length}
              expanded={expanded}
              paused={paused}
              frontHeight={frontHeight}
              ownHeight={heights[record.key]}
              edge={y}
              directions={directions}
              icons={icons}
              closeIcon={closeIcon}
              onHeight={onHeight}
              onFocusLost={onFocusLost}
              announce={announce}
            />
          ))}
        </ol>
      </section>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a bare live region like its role="alert" twin; <output> is a form result with uneven live-region support */}
      <div ref={statusRef} role="status" data-slot="toast-announcer" className="sr-only" />
      <div ref={alertRef} role="alert" data-slot="toast-announcer" className="sr-only" />
    </>
  )
}

// Tailwind only sees complete class names. [card, icon] per type.
const typeClasses: Record<ToastType, string> = {
  neutral: 'border-popover-border bg-popover-bg text-fg',
  loading: 'border-popover-border bg-popover-bg text-fg',
  success: 'border-success-border bg-success-subtle-bg text-success-subtle-fg',
  info: 'border-info-border bg-info-subtle-bg text-info-subtle-fg',
  warning: 'border-warning-border bg-warning-subtle-bg text-warning-subtle-fg',
  danger: 'border-danger-border bg-danger-subtle-bg text-danger-subtle-fg',
}

const toneIcons: [Exclude<ToastIconType, 'loading'>, string, ReactNode][] = [
  ['success', 'text-success', <CircleCheckIcon key="success" />],
  ['info', 'text-info', <InfoIcon key="info" />],
  ['warning', 'text-warning', <TriangleAlertIcon key="warning" />],
  ['danger', 'text-danger', <CircleXIcon key="danger" />],
]

const isPresent = (node: ReactNode) => node != null && node !== false && node !== ''

const iconLayer = 'inline-flex opacity-0 transition-opacity duration-200 data-active:opacity-100'

/*
 * Every type's icon sits in the same grid cell and only the current one is opaque, so an update
 * (loading -> success) cross-fades in place. Neutral has no icon (Geist): text carries it.
 */
function ToastIcon({
  type,
  icons,
}: {
  type: ToastType
  icons: Partial<Record<ToastIconType, ReactNode>>
}) {
  const loading = type === 'loading'
  const custom = (t: ToastIconType) => icons[t] !== undefined
  // A hidden icon (false/null) takes no room, so the text starts at the card's edge
  const shown = type !== 'neutral' && (!custom(type) || isPresent(icons[type]))
  return (
    <span
      aria-hidden
      data-slot="toast-icon"
      className={cn(
        'mt-0.5 grid size-4 shrink-0 [&_:where(svg:not([class*=size-]))]:size-4 [&_:where(svg:not([class*=shrink]))]:shrink-0 *:col-start-1 *:row-start-1',
        !shown && 'hidden',
      )}
    >
      {toneIcons.map(([iconType, color, icon]) =>
        custom(iconType) && !isPresent(icons[iconType]) ? null : (
          <span
            key={iconType}
            data-active={iconType === type || undefined}
            className={cn(iconLayer, color)}
          >
            {custom(iconType) ? icons[iconType] : icon}
          </span>
        ),
      )}
      {custom('loading') ? (
        isPresent(icons.loading) && (
          <span data-active={loading || undefined} className={cn(iconLayer, 'text-fg-muted')}>
            <span className={cn('flex', loading && 'animate-spin', 'motion-reduce:animate-none')}>
              {icons.loading}
            </span>
          </span>
        )
      ) : (
        <span data-active={loading || undefined} className={cn(iconLayer, 'text-fg-muted')}>
          {/* Spins only while shown; both rings are switched in CSS, like the Badge's busy state */}
          <LoaderCircleIcon className={cn(loading && 'animate-spin', 'motion-reduce:hidden')} />
          <CircleDashedIcon className="hidden motion-reduce:block" />
        </span>
      )}
    </span>
  )
}

const enterFrom = {
  bottom: 'starting:[translate:0_100%]',
  top: 'starting:[translate:0_-100%]',
}

type ToastCardProps = {
  record: ToastRecord
  /** Undefined while the toast plays its exit: it then keeps the place it had. */
  layout: Layout | undefined
  total: number
  expanded: boolean
  paused: boolean
  frontHeight: number | undefined
  ownHeight: number | undefined
  edge: 'top' | 'bottom'
  directions: SwipeDirection[]
  icons: Partial<Record<ToastIconType, ReactNode>>
  closeIcon: ReactNode
  onHeight: (key: number, height: number | undefined) => void
  onFocusLost: (index: number) => void
  announce: (text: string, assertive: boolean) => void
}

type Drag = {
  x: number
  y: number
  time: number
  axis?: 'x' | 'y'
  amount: number
  direction?: SwipeDirection
}

function ToastCard({
  record,
  layout,
  total,
  expanded,
  paused,
  frontHeight,
  ownHeight,
  edge,
  directions,
  icons,
  closeIcon,
  onHeight,
  onFocusLost,
  announce,
}: ToastCardProps) {
  const { id, key, type, title, description, action, dismissible, version, removed, swipeOut } =
    record
  const liRef = useRef<HTMLLIElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const [entered, setEntered] = useState(false)

  // An exiting card keeps the slot it last had while the others close the gap
  const [kept, setKept] = useState<Layout>(layout ?? { index: 0, offset: 0, visible: true })
  if (
    layout &&
    (layout.index !== kept.index ||
      layout.offset !== kept.offset ||
      layout.visible !== kept.visible)
  ) {
    setKept(layout)
  }
  const { index, offset, visible } = layout ?? kept
  const stacked = !expanded && index > 0
  const sign = edge === 'bottom' ? -1 : 1
  const height = stacked ? frontHeight : ownHeight

  // Natural height of the content; the card's own height follows it with a transition
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => onHeight(key, body.offsetHeight + CARD_BORDERS)
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(body)
    return () => {
      observer?.disconnect()
      onHeight(key, undefined)
    }
  }, [key, onHeight])

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), ENTER_MS)
    return () => clearTimeout(timer)
  }, [])

  // New content (mount or update) is announced; an update reads only its new state
  // Version is the trigger, every update re-reads the rendered text
  useLayoutEffect(() => {
    const titleText = titleRef.current?.textContent?.trim() ?? ''
    const descriptionText = descriptionRef.current?.textContent?.trim() ?? ''
    const text =
      titleText && descriptionText && !/[.!?…:]$/.test(titleText)
        ? `${titleText}. ${descriptionText}`
        : `${titleText} ${descriptionText}`.trim()
    if (text) announce(text, type === 'danger')
  }, [version, type, announce])

  /*
   * Auto-dismiss. The remaining time survives pauses (hover, keyboard focus, hidden tab, waiting
   * beyond the visible stack) and is reset only by an update, like Sonner.
   */
  const duration = resolveDuration(record)
  const timer = useRef({ version: -1, duration: 0, remaining: 0 })
  const holding = paused || !visible
  useEffect(() => {
    const t = timer.current
    if (t.version !== version || t.duration !== duration) {
      t.version = version
      t.duration = duration
      t.remaining = duration
    }
    if (holding || removed || !Number.isFinite(t.remaining)) return
    const start = Date.now()
    const handle = setTimeout(() => dismiss(id), Math.max(0, t.remaining))
    return () => {
      clearTimeout(handle)
      t.remaining -= Date.now() - start
    }
  }, [id, version, duration, holding, removed])

  // Exit: wait for the card's own transitions (opacity, scale, swipe), then leave the list
  useLayoutEffect(() => {
    if (!removed) return
    const li = liRef.current
    if (li?.contains(document.activeElement)) onFocusLost(index)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      removeToast(key)
    }
    const fallback = setTimeout(finish, EXIT_FALLBACK_MS)
    const animations = typeof li?.getAnimations === 'function' ? li.getAnimations() : undefined
    if (animations) void Promise.allSettled(animations.map((a) => a.finished)).then(finish)
    return () => {
      done = true
      clearTimeout(fallback)
    }
  }, [removed, key, index, onFocusLost])

  /*
   * Swipe to dismiss (Sonner): the card follows the pointer along the first axis it moves on,
   * damped in directions that don't dismiss. Released past 45px or faster than 0.11px/ms it
   * slides out that way; otherwise it springs back. Offsets are written straight to the style,
   * so dragging doesn't re-render.
   */
  const drag = useRef<Drag | null>(null)
  const swipeable = dismissible && !removed

  const setSwipe = (li: HTMLElement, dx: number, dy: number) => {
    li.style.setProperty('--toast-swipe-x', `${dx}px`)
    li.style.setProperty('--toast-swipe-y', `${dy}px`)
  }

  const handlePointerDown = (event: PointerEvent<HTMLLIElement>) => {
    if (!swipeable || event.button !== 0) return
    // Buttons and links keep their own clicks
    if ((event.target as Element).closest('button, a, input, textarea, select, [data-no-swipe]'))
      return
    drag.current = { x: event.clientX, y: event.clientY, time: Date.now(), amount: 0 }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLLIElement>) => {
    const d = drag.current
    const li = event.currentTarget
    if (!d) return
    const dx = event.clientX - d.x
    const dy = event.clientY - d.y
    if (!d.axis) {
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return
      // Selecting text inside the toast is not a swipe
      if (window.getSelection()?.toString()) {
        drag.current = null
        return
      }
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      li.setAttribute('data-swiping', '')
    }
    const delta = d.axis === 'x' ? dx : dy
    const toward: SwipeDirection =
      d.axis === 'x' ? (delta > 0 ? 'right' : 'left') : delta > 0 ? 'bottom' : 'top'
    const allowed = directions.includes(toward)
    d.amount = allowed ? delta : delta / (1.5 + Math.abs(delta) / 20)
    d.direction = allowed ? toward : undefined
    if (d.axis === 'x') setSwipe(li, d.amount, 0)
    else setSwipe(li, 0, d.amount)
  }

  const endDrag = (event: PointerEvent<HTMLLIElement>, cancelled: boolean) => {
    const d = drag.current
    drag.current = null
    const li = event.currentTarget
    if (!d?.axis) return
    li.removeAttribute('data-swiping')
    const velocity = Math.abs(d.amount) / Math.max(1, Date.now() - d.time)
    if (
      !cancelled &&
      d.direction &&
      (Math.abs(d.amount) >= SWIPE_DISTANCE || velocity > SWIPE_VELOCITY)
    ) {
      // Keeps the dragged offset; the swipe-out transition carries on from there
      dismiss(id, d.direction)
      return
    }
    // Transitions are back on (data-swiping removed), so this springs back
    setSwipe(li, 0, 0)
  }

  const touchAction = !swipeable
    ? undefined
    : directions.length === 1
      ? 'touch-pan-x' // only vertical swipes: horizontal panning still scrolls
      : 'touch-none'

  const style = {
    '--toast-y': `${sign * (expanded ? offset : index * GAP)}px`,
    '--toast-scale': expanded ? 1 : Math.max(0, 1 - index * SCALE_STEP),
    zIndex: total - index,
  } as CSSProperties

  const hasAction = action != null && action !== false

  return (
    <li
      ref={liRef}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- F6 lands on the card itself so its whole text is read; Esc then closes it
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={description != null && description !== false ? descriptionId : undefined}
      inert={removed || !visible}
      data-slot="toast"
      data-toast-id={id}
      data-type={type}
      data-index={index}
      data-front={index === 0 || undefined}
      data-stacked={stacked || undefined}
      data-visible={visible}
      data-removed={removed || undefined}
      data-swipe-out={removed ? swipeOut : undefined}
      data-dismissible={dismissible || undefined}
      data-entered={entered || undefined}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => endDrag(event, false)}
      onPointerCancel={(event) => endDrag(event, true)}
      className={cn(
        // No text selection: a drag on the text is a swipe
        'group/toast absolute inset-x-0 rounded-surface outline-none select-none',
        edge === 'bottom' ? 'bottom-0 origin-top' : 'top-0 origin-bottom',
        // Stack position (transform) and swipe offset (translate) compose; exits add scale
        'transform-[translateY(var(--toast-y))_scale(var(--toast-scale))]',
        '[translate:var(--toast-swipe-x,0px)_var(--toast-swipe-y,0px)]',
        // Geist's measured entry: 350ms on this curve, also used for every reflow of the stack
        'transition-[transform,translate,scale,opacity] duration-350 ease-[cubic-bezier(0.25,0.75,0.6,0.98)]',
        enterFrom[edge],
        'starting:opacity-0',
        // Bridges the gap to the next card so the pointer never "leaves" between expanded cards
        'after:absolute after:inset-x-0 after:h-3.75',
        edge === 'bottom' ? 'after:bottom-full' : 'after:top-full',
        'data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0',
        // Geist's exit: a slight shrink and fade, 150ms, in place
        'data-removed:pointer-events-none data-removed:scale-99 data-removed:opacity-0 [&:where([data-removed]:not([data-swipe-out]))]:duration-150',
        // Swiped away: slides out along the swipe (Sonner, 200ms ease-out). The plain exit above skips
        // swiped toasts, so neither needs extra weight to win
        '[&:where([data-removed][data-swipe-out])]:duration-200 [&:where([data-removed][data-swipe-out])]:ease-out',
        'data-[swipe-out=right]:[translate:calc(100%+24px)_0]',
        'data-[swipe-out=left]:[translate:calc(-100%-24px)_0]',
        'data-[swipe-out=bottom]:[translate:0_calc(100%+24px)]',
        'data-[swipe-out=top]:[translate:0_calc(-100%-24px)]',
        'data-swiping:transition-none',
        'group-[&:where([data-moving])]/viewport:[&:where([data-entered])]:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        touchAction,
      )}
    >
      <div
        data-slot="toast-card"
        style={{ height }}
        className={cn(
          'overflow-hidden rounded-[inherit] border [box-shadow:var(--shadow-popover)]',
          // Forced colors drops the shadow and fills; the border carries the edge
          'forced-colors:border-[CanvasText]',
          // Height follows content (JS-measured, so no interpolate-size); type changes recolor
          '[transition-property:height,background-color,border-color,color]',
          'duration-[350ms,200ms,200ms,200ms] ease-[cubic-bezier(0.25,0.75,0.6,0.98)]',
          typeClasses[type],
        )}
      >
        <div
          ref={bodyRef}
          data-slot="toast-body"
          className={cn(
            'relative p-4 transition-opacity duration-200',
            // Cards behind the front one show only their edge (Sonner)
            'group-data-stacked/toast:pointer-events-none group-data-stacked/toast:opacity-0',
          )}
        >
          {/* Keeps clear of the close button (a sm Button, pulled 8px into the padding, plus the 12px gap) */}
          <div
            className={cn(
              'flex items-start gap-3',
              dismissible && 'pe-[calc(var(--spacing-control-sm)+4px)]',
            )}
          >
            <ToastIcon type={type} icons={icons} />
            <div className="min-w-0 flex-1">
              <div
                ref={titleRef}
                id={titleId}
                data-slot="toast-title"
                className="text-sm/5 font-medium"
              >
                {title}
              </div>
              {description != null && description !== false && (
                <div
                  ref={descriptionRef}
                  id={descriptionId}
                  data-slot="toast-description"
                  className="mt-0.5 text-sm/5 text-fg-muted"
                >
                  {description}
                </div>
              )}
            </div>
          </div>
          {hasAction && (
            // Own row, right-aligned (Geist): beside the title it would squeeze the description
            <div data-slot="toast-action" className="mt-3 flex justify-end gap-2">
              {isActionButton(action) ? (
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={(event) => {
                    action.onClick?.(event)
                    if (!event.defaultPrevented) dismiss(id)
                  }}
                >
                  {action.label}
                </Button>
              ) : (
                action
              )}
            </div>
          )}
          {dismissible && (
            // Last in the DOM so a screen reader reads the content (and action) first; placed
            // top-right, centered on the title line
            <Button
              intent="ghost"
              size="sm"
              icon={iconOr(closeIcon, <XIcon />)}
              aria-label="Close"
              tooltip={false}
              // The card's text color, so the X reads on every tint; hover tints with it too
              className="absolute top-2.25 right-2 text-current [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-current/10"
              onClick={() => dismiss(id)}
            />
          )}
        </div>
      </div>
    </li>
  )
}
