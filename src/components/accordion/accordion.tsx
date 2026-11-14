import { ChevronDown } from 'lucide-react'
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import { isPresent, useMergedRef } from '../input/field'
import { useAccordionMotion } from './use-accordion-motion'

export type AccordionVariant = 'line' | 'outline'
type Selection<T> =
  | { value: T; defaultValue?: never; onValueChange?: (value: T) => void }
  | { value?: undefined; defaultValue?: T; onValueChange?: (value: T) => void }

export type AccordionProps = Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> &
  (
    | (Selection<string | null> & { type?: 'single'; collapsible?: boolean })
    | (Selection<readonly string[]> & { type: 'multiple'; collapsible?: never })
  ) & {
    variant?: AccordionVariant
    /** Native heading level around each trigger. */
    headingLevel?: 2 | 3 | 4 | 5 | 6
    /** Disables triggers, without changing values or disabling content fields. */
    disabled?: boolean
  }

type AccordionContextValue = {
  selected: readonly string[]
  variant: AccordionVariant
  headingLevel: 2 | 3 | 4 | 5 | 6
  disabled: boolean
  collapsible: boolean
  toggle: (value: string) => void
  register: (value: string, node: HTMLDivElement) => () => void
  restoreFocus: (item: HTMLDivElement, removing?: boolean) => void
}
const AccordionContext = createContext<AccordionContextValue | null>(null)
type ItemContextValue = {
  id: string
  value: string
  open: boolean
  disabled: boolean
  itemRef: RefObject<HTMLDivElement | null>
}
const ItemContext = createContext<ItemContextValue | null>(null)

function useAccordionContext(part: string) {
  const context = useContext(AccordionContext)
  if (!context) throw new Error(`${part} must be rendered inside <Accordion>`)
  return context
}
function useItemContext(part: string) {
  const context = useContext(ItemContext)
  if (!context) throw new Error(`${part} must be rendered inside <AccordionItem>`)
  return context
}
const valuesOf = (value: string | null | readonly string[] | undefined): readonly string[] =>
  typeof value === 'string' ? [value] : [...new Set(value ?? [])]
const ownTriggers = (root: HTMLDivElement) =>
  [...root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]')].filter(
    (node) => node.closest('[data-slot="accordion"]') === root,
  )

/** Vertical disclosure group. Changing type requires a new React key. */
export function Accordion({
  type = 'single',
  value,
  defaultValue,
  onValueChange,
  collapsible = true,
  variant = 'line',
  headingLevel = 3,
  disabled = false,
  className,
  children,
  ref,
  onKeyDown,
  ...props
}: AccordionProps) {
  const [initialType] = useState(type)
  if (initialType !== type) throw new Error('Changing Accordion type requires a new key')
  const controlled = value !== undefined
  const [internal, setInternal] = useState(() => valuesOf(defaultValue))
  const selected = controlled ? valuesOf(value) : internal
  const rootRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(rootRef, ref)
  const items = useRef(new Map<string, HTMLDivElement>())
  const internalRef = useRef(internal)
  useLayoutEffect(() => {
    internalRef.current = internal
  }, [internal])

  const restoreFocus = useCallback((item: HTMLDivElement, removing = false) => {
    const root = rootRef.current
    if (!root) return
    const triggers = ownTriggers(root)
    const own = triggers.find((node) => node.closest('[data-slot="accordion-item"]') === item)
    const index = own ? triggers.indexOf(own) : -1
    const next =
      (!removing && own && !own.disabled ? own : undefined) ??
      triggers.slice(index + 1).find((node) => !node.disabled) ??
      triggers
        .slice(0, Math.max(index, 0))
        .reverse()
        .find((node) => !node.disabled)
    if (next) next.focus({ preventScroll: true })
    else {
      // A programmatic fallback, never an extra Tab stop.
      const previous = root.getAttribute('tabindex')
      root.tabIndex = -1
      root.focus({ preventScroll: true })
      if (previous === null) root.removeAttribute('tabindex')
      else root.setAttribute('tabindex', previous)
    }
  }, [])

  const register = useCallback(
    (itemValue: string, node: HTMLDivElement) => {
      const members = items.current
      if (members.has(itemValue)) {
        throw new Error(`Accordion item values must be unique: "${itemValue}"`)
      }
      members.set(itemValue, node)
      const reconcile = () => {
        // Wait for replacements and StrictMode's effect replay before dropping missing values.
        queueMicrotask(() => {
          if (controlled || !rootRef.current) return
          if (internalRef.current.every((entry) => members.has(entry))) return
          setInternal((current) => {
            const next = current.filter((entry) => members.has(entry))
            return next.length === current.length ? current : next
          })
        })
      }
      reconcile()
      return () => {
        members.delete(itemValue)
        const focused = node.ownerDocument.activeElement
        if (focused && node.contains(focused)) {
          const root = rootRef.current
          const triggers = root ? ownTriggers(root) : []
          const index = triggers.findIndex((trigger) => node.contains(trigger))
          const candidates = [...triggers.slice(index + 1), ...triggers.slice(0, index).reverse()]
          queueMicrotask(() => {
            // Ignore StrictMode replay and explicit focus changes made by the application.
            const active = node.ownerDocument.activeElement
            if (
              node.isConnected ||
              !rootRef.current ||
              (active !== node.ownerDocument.body && active !== focused)
            )
              return
            const next = candidates.find((trigger) => trigger.isConnected && !trigger.disabled)
            if (next) next.focus({ preventScroll: true })
            else restoreFocus(node, true)
          })
        }
        reconcile()
      }
    },
    [controlled, restoreFocus],
  )

  const toggle = (itemValue: string) => {
    const open = selected.includes(itemValue)
    if (disabled || (type === 'single' && open && !collapsible)) return
    const next = open
      ? selected.filter((entry) => entry !== itemValue)
      : type === 'single'
        ? [itemValue]
        : [...selected, itemValue]
    if (!controlled) setInternal(next)
    if (type === 'multiple')
      (onValueChange as ((value: readonly string[]) => void) | undefined)?.(next)
    else (onValueChange as ((value: string | null) => void) | undefined)?.(next[0] ?? null)
  }

  return (
    <AccordionContext
      value={{
        selected,
        variant,
        headingLevel,
        disabled,
        collapsible: type === 'multiple' || collapsible,
        toggle,
        register,
        restoreFocus,
      }}
    >
      {/* A nested root must not inherit the outer item's context. */}
      <ItemContext value={null}>
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- delegates keyboard navigation only from this group's native trigger buttons */}
        <div
          {...props}
          ref={mergedRef}
          data-slot="accordion"
          data-variant={variant}
          data-disabled={disabled || undefined}
          className={cn('min-w-0', variant === 'outline' && 'flex flex-col gap-2', className)}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (
              event.defaultPrevented ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey
            )
              return
            const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
            if (!keys.includes(event.key)) return
            const triggers = ownTriggers(event.currentTarget).filter((node) => !node.disabled)
            const index = triggers.indexOf(event.target as HTMLButtonElement)
            if (index === -1) return
            event.preventDefault()
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? triggers.length - 1
                  : Math.max(
                      0,
                      Math.min(triggers.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)),
                    )
            triggers[next]?.focus()
          }}
        >
          {children}
        </div>
      </ItemContext>
    </AccordionContext>
  )
}

export type AccordionItemProps = ComponentProps<'div'> & {
  /** Unique, non-empty value in this group. */
  value: string
  disabled?: boolean
}

export function AccordionItem({
  value,
  disabled = false,
  className,
  children,
  ref,
  ...props
}: AccordionItemProps) {
  const group = useAccordionContext('AccordionItem')
  if (!value.trim()) throw new Error('AccordionItem value must be a non-empty string')
  const id = useId()
  const itemRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(itemRef, ref)
  const register = group.register
  useLayoutEffect(() => {
    if (itemRef.current) return register(value, itemRef.current)
  }, [register, value])
  const open = group.selected.includes(value)
  const isDisabled = group.disabled || disabled
  return (
    <ItemContext value={{ id, value, open, disabled: isDisabled, itemRef }}>
      <div
        {...props}
        ref={mergedRef}
        data-slot="accordion-item"
        data-state={open ? 'open' : 'closed'}
        data-disabled={isDisabled || undefined}
        className={cn(
          'min-w-0 border-input-border',
          group.variant === 'outline' ? 'rounded-xl border bg-surface' : 'border-b',
          className,
        )}
      >
        {children}
      </div>
    </ItemContext>
  )
}

export type AccordionTriggerProps = Omit<
  ComponentProps<'button'>,
  | 'id'
  | 'type'
  | 'disabled'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-disabled'
  | 'aria-labelledby'
> & {
  /** Supplementary text, announced as the description rather than the title. */
  description?: ReactNode
}

export function AccordionTrigger({
  children,
  description,
  className,
  onClick,
  'aria-describedby': describedBy,
  ...props
}: AccordionTriggerProps) {
  const group = useAccordionContext('AccordionTrigger')
  const item = useItemContext('AccordionTrigger')
  const Heading = `h${group.headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  const hasDescription = isPresent(description)
  const locked = item.open && !group.collapsible
  return (
    <Heading data-slot="accordion-heading" className="m-0 text-inherit">
      <button
        {...props}
        id={`${item.id}-trigger`}
        type="button"
        disabled={item.disabled}
        aria-expanded={item.open}
        aria-controls={`${item.id}-content`}
        aria-disabled={locked || undefined}
        aria-labelledby={props['aria-label'] ? undefined : `${item.id}-title`}
        aria-describedby={
          [describedBy, hasDescription && `${item.id}-description`].filter(Boolean).join(' ') ||
          undefined
        }
        data-slot="accordion-trigger"
        data-state={item.open ? 'open' : 'closed'}
        className={cn(
          'group/accordion-trigger flex min-h-12 w-full cursor-pointer items-start gap-3 rounded-sm py-3 text-start text-sm/6 font-medium text-fg outline-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-default',
          'forced-colors:disabled:text-[GrayText]',
          group.variant === 'outline' && 'rounded-xl px-4',
          className,
        )}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented && !item.disabled && !locked) group.toggle(item.value)
        }}
      >
        <span className="min-w-0 flex-1 wrap-anywhere">
          <span
            id={`${item.id}-title`}
            className="underline-offset-4 group-enabled/accordion-trigger:group-hover/accordion-trigger:underline"
          >
            {children}
          </span>
          {hasDescription && (
            <span
              id={`${item.id}-description`}
              className="mt-0.5 block text-xs/4.5 font-normal text-fg-muted"
            >
              {description}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'mt-1 size-4 shrink-0 text-fg-muted transition-transform duration-200 ease-out motion-reduce:transition-none',
            item.open && 'rotate-180',
          )}
        />
      </button>
    </Heading>
  )
}

export type AccordionContentProps = Omit<
  ComponentProps<'div'>,
  'id' | 'hidden' | 'inert' | 'role' | 'aria-hidden' | 'aria-labelledby'
> & {
  /** Defaults to true. false unmounts children after closing, but keeps the ARIA target. */
  keepMounted?: boolean
  /** Opt in to a named landmark for complex content; avoid excessive regions. */
  region?: boolean
  /** Outer height wrapper classes. className styles the inner padded content. */
  contentClassName?: string
}

export function AccordionContent({
  keepMounted = true,
  region = false,
  className,
  contentClassName,
  children,
  ref,
  ...props
}: AccordionContentProps) {
  const group = useAccordionContext('AccordionContent')
  const item = useItemContext('AccordionContent')
  const { panelRef, innerRef, present } = useAccordionMotion(
    item.open,
    item.itemRef,
    group.restoreFocus,
  )
  const mergedRef = useMergedRef(panelRef, ref)
  return (
    <div
      {...props}
      ref={mergedRef}
      id={`${item.id}-content`}
      role={region ? 'region' : undefined}
      aria-labelledby={region ? `${item.id}-title` : undefined}
      hidden={!item.open && !present}
      inert={!item.open && !present}
      aria-hidden={!item.open && !present ? true : undefined}
      data-slot="accordion-content"
      data-state={item.open ? 'open' : 'closed'}
      className={cn('min-w-0', contentClassName)}
    >
      <div
        ref={innerRef}
        data-slot="accordion-content-inner"
        className={cn(
          'flow-root min-w-0 pb-4 text-sm/5.5 wrap-anywhere text-fg-muted',
          group.variant === 'outline' ? 'ps-4 pe-11' : 'pe-7',
          className,
        )}
      >
        {(keepMounted || item.open || present) && children}
      </div>
    </div>
  )
}
