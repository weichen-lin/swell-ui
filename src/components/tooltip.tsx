import {
  cloneElement,
  type FocusEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'

const OPEN_DELAY_MS = 300
const GAP_PX = 6
const VIEWPORT_PADDING_PX = 8

const subscribeNever = () => () => {}

/** False during SSR and hydration, true after: the portal target (document.body) only exists then. */
function useIsClient() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
}

type Side = 'top' | 'bottom' | 'left' | 'right'
type TriggerProps = { 'aria-describedby'?: string }

export type TooltipProps = {
  /** Nothing renders (and no aria-describedby is added) when empty. */
  content?: ReactNode
  /**
   * Preferred side: top, bottom, left or right. Flips to the opposite one when it doesn't fit
   * the viewport.
   * @defaultValue 'top'
   */
  side?: Side
  /**
   * Link the tooltip to the trigger via aria-describedby. Turn off when the
   * tooltip only repeats the trigger's accessible name (e.g. icon button labels).
   * @defaultValue true
   */
  describe?: boolean
  /** Classes for the wrapper that anchors the tooltip. */
  className?: string
  /** The trigger element. It gets `aria-describedby`; non-interactive ones need a `tabIndex`. */
  children: ReactElement<TriggerProps>
}

type Position = { side: Side; left: number; top: number }

const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

function isFocusVisible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, Math.max(min, max)))
}

/**
 * Bubble placement in viewport coordinates. left/top are for the outer box, which
 * includes the GAP_PX padding facing the trigger, so the box always touches the trigger.
 */
function place(anchor: DOMRect, width: number, height: number, preferred: Side): Position {
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const room: Record<Side, number> = {
    top: anchor.top,
    bottom: vh - anchor.bottom,
    left: anchor.left,
    right: vw - anchor.right,
  }
  const need = (s: Side) =>
    (s === 'top' || s === 'bottom' ? height : width) + GAP_PX + VIEWPORT_PADDING_PX
  const side =
    room[preferred] < need(preferred) && room[opposite[preferred]] > room[preferred]
      ? opposite[preferred]
      : preferred

  if (side === 'top' || side === 'bottom') {
    const left = clamp(
      anchor.left + anchor.width / 2 - width / 2,
      VIEWPORT_PADDING_PX,
      vw - width - VIEWPORT_PADDING_PX,
    )
    return { side, left, top: side === 'top' ? anchor.top - height - GAP_PX : anchor.bottom }
  }
  const top = clamp(
    anchor.top + anchor.height / 2 - height / 2,
    VIEWPORT_PADDING_PX,
    vh - height - VIEWPORT_PADDING_PX,
  )
  return { side, top, left: side === 'left' ? anchor.left - width - GAP_PX : anchor.right }
}

/**
 * Hover/focus tooltip around any element. The bubble is portaled to `<body>` with
 * fixed positioning, so scroll containers (tables, drawers) never clip it.
 * Events are read on the wrapper, so aria-disabled triggers work; React still
 * treats the portaled bubble as inside the wrapper, so the pointer can rest on it.
 */
export function Tooltip({
  content,
  side = 'top',
  describe = true,
  className,
  children,
}: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position>()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const active = content != null && content !== false && content !== ''
  const isClient = useIsClient()

  const clearTimer = () => clearTimeout(timer.current)
  const show = () => {
    clearTimer()
    setOpen(true)
  }
  const hide = () => {
    clearTimer()
    setOpen(false)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  // A trigger that stops needing a tooltip (e.g. re-enabled) must not reopen with a stale state
  const [wasActive, setWasActive] = useState(active)
  if (active !== wasActive) {
    setWasActive(active)
    if (!active) setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Measure before paint so the bubble never flashes at a stale spot; follow scrolls and resizes
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const anchor = anchorRef.current
      const bubble = bubbleRef.current
      if (!anchor || !bubble) return
      const next = place(
        anchor.getBoundingClientRect(),
        bubble.offsetWidth,
        bubble.offsetHeight,
        side,
      )
      // Whole pixels keep the text crisp
      setPosition({ ...next, left: Math.round(next.left), top: Math.round(next.top) })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, side, content])

  const describedBy =
    active && describe
      ? [children.props['aria-describedby'], id].filter(Boolean).join(' ')
      : children.props['aria-describedby']

  const placed = position?.side ?? side

  // Same element tree whether or not there is content, so toggling it never remounts the trigger
  return (
    <span
      ref={anchorRef}
      className={cn('relative inline-flex', className)}
      onPointerEnter={() => {
        if (!active) return
        clearTimer()
        timer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
      }}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(e: FocusEvent) => {
        if (active && isFocusVisible(e.target)) show()
      }}
      onBlur={(e: FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget)) hide()
      }}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      {/* Kept in the DOM while hidden so aria-describedby always resolves (client only: SSR has no body) */}
      {active &&
        isClient &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            aria-hidden={describe ? undefined : true}
            hidden={!open}
            data-side={placed}
            style={position && { left: position.left, top: position.top }}
            className={cn(
              'fixed top-0 left-0 z-50',
              // Padding (not margin) bridges the gap so the pointer can move onto the bubble
              { top: 'pb-1.5', bottom: 'pt-1.5', left: 'pr-1.5', right: 'pl-1.5' }[placed],
            )}
          >
            <span
              ref={bubbleRef}
              className={cn(
                'block w-max max-w-xs rounded-item border border-border-strong bg-inverse px-2 py-1',
                'text-xs/snug font-medium text-inverse-fg [box-shadow:var(--shadow-whisper)]',
                'transition-[opacity,translate] duration-150 ease-out starting:opacity-0',
                {
                  top: 'starting:translate-y-0.5',
                  bottom: 'starting:-translate-y-0.5',
                  left: 'starting:translate-x-0.5',
                  right: 'starting:-translate-x-0.5',
                }[placed],
                'motion-reduce:transition-none',
              )}
            >
              {content}
            </span>
          </span>,
          document.body,
        )}
    </span>
  )
}
