import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
  type RefObject,
  createContext,
  use,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  anchorName,
  anchoredPopupStyle,
  nameAnchor,
  useAnchorPositioning,
} from '../../lib/anchor-position'
import { cn } from '../../lib/cn'
import { Slot, wrapChildren } from '../../lib/slot'
import { useMergedRef } from '../input/field'

export type DropdownMenuChangeReason = 'trigger' | 'item-select' | 'escape' | 'outside' | 'tab'
export type DropdownMenuProps = {
  /** A `DropdownMenuTrigger` and a `DropdownMenuContent`. */
  children: ReactNode
  /** Whether the menu is open (controlled). Pair it with `onOpenChange`. */
  open?: boolean
  /**
   * Whether the menu starts open when uncontrolled.
   * @defaultValue false
   */
  defaultOpen?: boolean
  /**
   * Called when the menu opens or closes. `reason` is `'trigger'`, `'item-select'`, `'escape'`,
   * `'outside'` or `'tab'`.
   */
  onOpenChange?: (open: boolean, reason: DropdownMenuChangeReason) => void
}

type MenuContextValue = {
  open: boolean
  triggerId: string
  contentId: string
  trigger: RefObject<HTMLButtonElement | null>
  content: RefObject<HTMLDivElement | null>
  initialFocus: RefObject<'first' | 'last'>
  reason: RefObject<DropdownMenuChangeReason>
  change: (open: boolean, reason: DropdownMenuChangeReason, focus?: 'first' | 'last') => void
}
const MenuContext = createContext<MenuContextValue | null>(null)
function useMenu() {
  const value = use(MenuContext)
  if (!value) throw new Error('DropdownMenu parts must be inside DropdownMenu')
  return value
}

export function DropdownMenu({
  children,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
}: DropdownMenuProps) {
  const [internal, setInternal] = useState(defaultOpen)
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const initialFocus = useRef<'first' | 'last'>('first')
  const reason = useRef<DropdownMenuChangeReason>('trigger')
  const open = controlled ?? internal
  return (
    <MenuContext
      value={{
        open,
        triggerId: `${id}-trigger`,
        contentId: `${id}-menu`,
        trigger,
        content,
        initialFocus,
        reason,
        change(next, why, focus = 'first') {
          if (next) initialFocus.current = focus
          reason.current = why
          if (controlled === undefined) setInternal(next)
          onOpenChange?.(next, why)
        },
      }}
    >
      {children}
    </MenuContext>
  )
}

export type DropdownMenuTriggerProps = ComponentProps<'button'> & {
  /**
   * Render the only child (your `Button`, say) as the trigger instead of a `<button>`.
   * @defaultValue false
   */
  asChild?: boolean
}
export function DropdownMenuTrigger({
  asChild = false,
  ref,
  onClick,
  onClickCapture,
  onKeyDown,
  disabled,
  ...props
}: DropdownMenuTriggerProps) {
  const menu = useMenu()
  const mergedRef = useMergedRef(menu.trigger, ref)
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...props}
      ref={mergedRef}
      id={menu.triggerId}
      type="button"
      data-slot="dropdown-menu-trigger"
      data-state={menu.open ? 'open' : 'closed'}
      disabled={asChild ? disabled : undefined}
      aria-haspopup="menu"
      aria-expanded={menu.open}
      aria-controls={menu.open ? menu.contentId : undefined}
      aria-disabled={disabled || props['aria-disabled'] || undefined}
      onClickCapture={(event) => {
        if (disabled) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        onClickCapture?.(event)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (
          disabled ||
          event.defaultPrevented ||
          event.currentTarget.getAttribute('aria-disabled') === 'true'
        )
          return
        menu.change(!menu.open, 'trigger')
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (
          disabled ||
          event.defaultPrevented ||
          event.currentTarget.getAttribute('aria-disabled') === 'true'
        )
          return
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault()
          menu.change(true, 'trigger', event.key === 'ArrowUp' ? 'last' : 'first')
        }
      }}
    />
  )
}

type Side = 'top' | 'bottom' | 'left' | 'right'
export type DropdownMenuContentProps = ComponentProps<'div'> & {
  /**
   * Preferred side of the trigger: `'top' | 'bottom' | 'left' | 'right'`. Flips when there is not
   * enough room.
   * @defaultValue 'bottom'
   */
  side?: Side
  /**
   * Alignment against the trigger.
   * @defaultValue 'end'
   */
  align?: 'start' | 'center' | 'end'
  /**
   * Gap to the trigger, in pixels.
   * @defaultValue 6
   */
  sideOffset?: number
}
const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(value, Math.max(low, high)))
function items(content: HTMLElement) {
  return Array.from(content.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter(
    (item) => !item.hidden && item.getAttribute('aria-hidden') !== 'true',
  )
}

export function DropdownMenuContent(props: DropdownMenuContentProps) {
  const { open } = useMenu()
  return open ? <OpenContent {...props} /> : null
}

function OpenContent({
  side = 'bottom',
  align = 'end',
  sideOffset = 6,
  className,
  ref,
  onKeyDown,
  style,
  ...props
}: DropdownMenuContentProps) {
  const menu = useMenu()
  const { content: contentRef, trigger: triggerRef, initialFocus, reason: closeReason } = menu
  const mergedRef = useMergedRef(contentRef, ref)
  const query = useRef({ text: '', time: 0 })
  const dismiss = useEffectEvent((reason: DropdownMenuChangeReason) => menu.change(false, reason))
  const anchored = useAnchorPositioning()
  const anchor = anchorName(menu.triggerId)

  useLayoutEffect(() => {
    const content = contentRef.current
    const trigger = triggerRef.current
    if (!content || !trigger) return
    content.showPopover?.()
    const entries = items(content)
    const first = initialFocus.current === 'last' ? entries.at(-1) : entries[0]
    ;(first ?? content).focus({ preventScroll: true })
    const outside = (event: PointerEvent) => {
      const path = event.composedPath()
      if (!path.includes(content) && !path.includes(trigger)) dismiss('outside')
    }
    const focusOutside = (event: FocusEvent) => {
      if (closeReason.current === 'tab') return
      if (!content.contains(event.target as Node) && !trigger.contains(event.target as Node))
        dismiss('outside')
    }
    const reasonRef = closeReason
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('focusin', focusOutside)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('focusin', focusOutside)
      const restore =
        content.contains(document.activeElement) && !['outside', 'tab'].includes(reasonRef.current)
      content.hidePopover?.()
      if (restore && trigger.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [contentRef, triggerRef, initialFocus, closeReason])

  useLayoutEffect(() => {
    const content = contentRef.current
    const trigger = triggerRef.current
    if (!content || !trigger) return
    if (anchored) return nameAnchor(trigger, anchor)
    const update = () => {
      const rect = trigger.getBoundingClientRect()
      const viewport = window.visualViewport
      const left = viewport?.offsetLeft ?? 0
      const top = viewport?.offsetTop ?? 0
      const width = viewport?.width ?? document.documentElement.clientWidth
      const height = viewport?.height ?? document.documentElement.clientHeight
      const gap = Math.max(0, sideOffset)
      content.style.maxWidth = `${Math.max(0, width - 16)}px`
      content.style.maxHeight = `${Math.max(0, height - 16)}px`
      const room = {
        top: rect.top - top,
        bottom: top + height - rect.bottom,
        left: rect.left - left,
        right: left + width - rect.right,
      }
      const vertical = side === 'top' || side === 'bottom'
      const needed = (vertical ? content.scrollHeight : content.offsetWidth) + gap + 8
      const actual =
        room[side] < needed && room[opposite[side]] > room[side] ? opposite[side] : side
      if (vertical) content.style.maxHeight = `${Math.max(0, room[actual] - gap - 8)}px`
      else content.style.maxWidth = `${Math.max(0, room[actual] - gap - 8)}px`
      const w = content.offsetWidth
      const h = content.offsetHeight
      const rtl = getComputedStyle(trigger).direction === 'rtl'
      const fraction = { start: 0, center: 0.5, end: 1 }[align]
      const horizontalFraction = rtl ? 1 - fraction : fraction
      const x = vertical
        ? rect.left + (rect.width - w) * horizontalFraction
        : actual === 'left'
          ? rect.left - w - gap
          : rect.right + gap
      const y = vertical
        ? actual === 'top'
          ? rect.top - h - gap
          : rect.bottom + gap
        : rect.top + (rect.height - h) * fraction
      content.style.left = `${Math.round(clamp(x, left + 8, left + width - w - 8))}px`
      content.style.top = `${Math.round(clamp(y, top + 8, top + height - h - 8))}px`
      content.dataset.side = actual
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(trigger)
    observer.observe(content)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [side, align, sideOffset, contentRef, triggerRef, anchored, anchor])

  return (
    <div
      {...props}
      ref={mergedRef}
      id={menu.contentId}
      role="menu"
      tabIndex={-1}
      aria-labelledby={props['aria-label'] ? undefined : menu.triggerId}
      popover="manual"
      data-slot="dropdown-menu-content"
      data-state="open"
      style={
        anchored
          ? {
              ...anchoredPopupStyle({ name: anchor, side, align, gap: Math.max(0, sideOffset) }),
              ...style,
            }
          : style
      }
      className={cn(
        'fixed inset-auto z-50 m-0 box-border w-max min-w-50 overflow-y-auto rounded-surface border border-popover-border bg-popover-bg p-1 font-sans text-sm text-fg shadow-popover outline-none',
        'transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none',
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        const entries = items(event.currentTarget)
        const index = entries.indexOf(document.activeElement as HTMLElement)
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          menu.change(false, 'escape')
        } else if (event.key === 'Tab') {
          event.preventDefault()
          const trigger = menu.trigger.current
          if (!trigger) return
          const scope = trigger.closest('dialog[open]') ?? document.body
          const tabbables = Array.from(
            scope.querySelectorAll<HTMLElement>(
              'a[href], button, input, select, textarea, [tabindex]',
            ),
          ).filter(
            (el) =>
              el.tabIndex >= 0 &&
              !el.matches(':disabled') &&
              !el.closest('[inert]') &&
              !event.currentTarget.contains(el) &&
              el.getClientRects().length > 0,
          )
          const target = tabbables[tabbables.indexOf(trigger) + (event.shiftKey ? -1 : 1)]
          menu.change(false, 'tab')
          ;(target ?? trigger).focus()
        } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? entries.length - 1
                : (index + (event.key === 'ArrowDown' ? 1 : -1) + entries.length) % entries.length
          entries[next]?.focus()
        } else if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          event.key !== ' '
        ) {
          event.preventDefault()
          const now = Date.now()
          query.current.text =
            (now - query.current.time > 500 ? '' : query.current.text) +
            event.key.toLocaleLowerCase()
          query.current.time = now
          const text = query.current.text
          const term = Array.from(text).every((char) => char === text[0]) ? text[0] : text
          const ordered = [...entries.slice(index + 1), ...entries.slice(0, index + 1)]
          ordered
            .find((item) =>
              (item.dataset.textValue ?? item.textContent ?? '')
                .trim()
                .toLocaleLowerCase()
                .startsWith(term),
            )
            ?.focus()
        }
      }}
    />
  )
}

export type DropdownMenuItemProps = Omit<ComponentProps<'button'>, 'onSelect'> & {
  /**
   * Render the only child (a link, say) as the item instead of a `<button>`.
   * @defaultValue false
   */
  asChild?: boolean
  /** Decorative leading icon (aria-hidden). */
  iconLeft?: ReactNode
  /**
   * Visual tone: `'danger'` marks a destructive action.
   * @defaultValue 'default'
   */
  tone?: 'default' | 'danger'
  /** Text typeahead matches, when it differs from the item's content. */
  textValue?: string
  /** Runs for pointer and keyboard activation. Call preventDefault() to keep the menu open. */
  onSelect?: (event: Event) => void
}
export function DropdownMenuItem({
  asChild = false,
  iconLeft,
  tone = 'default',
  textValue,
  disabled,
  onSelect,
  onClick,
  onClickCapture,
  onAuxClickCapture,
  onKeyDown,
  onPointerMove,
  children,
  className,
  ...props
}: DropdownMenuItemProps) {
  const menu = useMenu()
  const Component = asChild ? Slot : 'button'
  const renderContent = (label: ReactNode) => (
    <>
      {iconLeft && <span aria-hidden>{iconLeft}</span>}
      {label}
    </>
  )
  const child = asChild ? Children.only(children) : null
  const content = isValidElement<{ children?: unknown }>(child)
    ? cloneElement(child, { children: wrapChildren(child.props.children, renderContent) })
    : renderContent(children)
  return (
    <Component
      {...props}
      type={asChild ? undefined : 'button'}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      data-slot="dropdown-menu-item"
      data-tone={tone}
      data-text-value={textValue}
      className={cn(
        'flex min-h-8 w-full cursor-default items-center gap-2 rounded-control px-2 py-1.5 text-start text-sm/snug outline-none select-none pointer-coarse:min-h-10',
        'focus:bg-popover-highlight focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_:where(svg:not([class*=size-]))]:size-4 [&_:where(svg:not([class*=shrink]))]:shrink-0',
        tone === 'danger'
          ? 'text-danger-subtle-fg focus:bg-danger-subtle-bg'
          : 'text-fg [&_:where(svg:not([class*=text-]))]:text-fg-muted',
        className,
      )}
      onClickCapture={(event) => {
        if (disabled) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        onClickCapture?.(event)
      }}
      onAuxClickCapture={(event) => {
        if (disabled) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        onAuxClickCapture?.(event)
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        if (!event.defaultPrevented && event.pointerType !== 'touch')
          event.currentTarget.focus({ preventScroll: true })
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.click()
        }
      }}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        onClick?.(event)
        // Router Links prevent the native navigation; their activation still closes the menu.
        const selection = new Event('select', { cancelable: true })
        onSelect?.(selection)
        if (!selection.defaultPrevented) menu.change(false, 'item-select')
      }}
    >
      {content}
    </Component>
  )
}

export function DropdownMenuGroup({ className, ...props }: ComponentProps<'div'>) {
  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- ARIA menu sections use a generic group.
  return <div {...props} role="group" data-slot="dropdown-menu-group" className={className} />
}
export function DropdownMenuLabel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="dropdown-menu-label"
      className={cn('px-2 py-1.5 text-xs text-fg-muted', className)}
    />
  )
}
export function DropdownMenuSeparator({ className, ...props }: ComponentProps<'hr'>) {
  return (
    <hr
      {...props}
      data-slot="dropdown-menu-separator"
      className={cn('my-1 h-px border-0 bg-popover-border', className)}
    />
  )
}
