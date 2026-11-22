import {
  type ComponentProps,
  createContext,
  type KeyboardEvent,
  useContext,
  useId,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import { useMergedRef } from '../input/field'
import {
  itemClasses,
  listClasses,
  revealOnFocus,
  TabContent,
  type TabContentProps,
  type TabsSize,
  type TabsVariant,
  useRevealWhenSelected,
  useTabListMotion,
} from './shared'

export type TabsActivationMode = 'automatic' | 'manual'

type TabsContextValue = {
  baseId: string
  selected: string | undefined
  select: (value: string) => void
  activationMode: TabsActivationMode
  variant: TabsVariant
  size: TabsSize
  label: { 'aria-label'?: string; 'aria-labelledby'?: string }
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(part: string) {
  const context = useContext(TabsContext)
  if (!context) throw new Error(`${part} must be rendered inside <Tabs>`)
  return context
}

// Values become part of ids that aria-controls / aria-labelledby point at; ids can't hold spaces
const partId = (baseId: string, part: 'tab' | 'panel', value: string) =>
  `${baseId}-${part}-${value.replace(/\s+/g, '-')}`

// A tablist needs a name (APG); one of the two is required
type TabsLabel =
  | {
      /** Names the tablist. Pass this or `aria-labelledby`. */
      'aria-label': string
      'aria-labelledby'?: never
    }
  | {
      /** Id of the element that names the tablist. Pass this or `aria-label`. */
      'aria-labelledby': string
      'aria-label'?: never
    }

// `value` set means controlled. Uncontrolled needs `defaultValue`: with nothing selected no tab
// would hold tabIndex=0 and the list would be unreachable by keyboard.
type TabsState =
  | {
      /** Selected tab's `value` (controlled). Pair it with `onValueChange`. */
      value: string
      defaultValue?: never
      /** Called with the new tab's `value` when the selection changes. */
      onValueChange?: (value: string) => void
    }
  | {
      value?: never
      /** Initially selected tab's `value` when uncontrolled. */
      defaultValue: string
      /** Called with the new tab's `value` when the selection changes. */
      onValueChange?: (value: string) => void
    }

export type TabsProps = Omit<
  ComponentProps<'div'>,
  'defaultValue' | 'onChange' | 'aria-label' | 'aria-labelledby'
> &
  TabsLabel &
  TabsState & {
    /**
     * `automatic` (default): arrow keys select as they move, for panels that show instantly.
     * `manual`: arrows only move focus, Enter/Space selects; use it when a panel loads data.
     * @defaultValue 'automatic'
     */
    activationMode?: TabsActivationMode
    /**
     * Visual style: `'line'` underlines the selected tab; `'segmented'` puts it on a raised knob.
     * @defaultValue 'line'
     */
    variant?: TabsVariant
    /**
     * Tab size: `'sm' | 'md'`.
     * @defaultValue 'md'
     */
    size?: TabsSize
  }

/**
 * In-page tabs (WAI-ARIA APG tabs pattern): a tablist that switches panels without changing the
 * URL. For tabs that navigate between routes, use TabNav.
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  activationMode = 'automatic',
  variant = 'line',
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  children,
  ...props
}: TabsProps) {
  const id = useId()
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const selected = controlled ? value : inner

  const select = (next: string) => {
    if (next === selected) return
    if (!controlled) setInner(next)
    onValueChange?.(next)
  }

  return (
    <TabsContext.Provider
      value={{
        baseId: id,
        selected,
        select,
        activationMode,
        variant,
        size,
        label: { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby },
      }}
    >
      <div {...props} data-slot="tabs">
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const keyMoves: Record<string, (index: number, last: number, rtl: boolean) => number> = {
  ArrowRight: (i, last, rtl) => (rtl ? (i === 0 ? last : i - 1) : i === last ? 0 : i + 1),
  ArrowLeft: (i, last, rtl) => (rtl ? (i === last ? 0 : i + 1) : i === 0 ? last : i - 1),
  Home: () => 0,
  End: (_, last) => last,
}

export type TabListProps = Omit<ComponentProps<'div'>, 'role'>

export function TabList({
  className,
  ref,
  onKeyDown,
  onPointerMove,
  onPointerLeave,
  children,
  ...props
}: TabListProps) {
  const { select, activationMode, variant, size, label } = useTabsContext('TabList')
  const motion = useTabListMotion<HTMLDivElement>(variant)
  const mergedRef = useMergedRef(motion.listRef, ref)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    const move = keyMoves[e.key]
    if (e.defaultPrevented || !move || e.altKey || e.ctrlKey || e.metaKey) return
    const list = e.currentTarget
    // Only this list's own tabs, skipping disabled ones; a nested Tabs has its own list
    const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)')].filter(
      (tab) => tab.closest('[role="tablist"]') === list,
    )
    const index = tabs.indexOf(e.target as HTMLElement)
    if (index === -1) return
    e.preventDefault()
    const rtl = getComputedStyle(list).direction === 'rtl'
    const next = tabs[move(index, tabs.length - 1, rtl)]
    next.focus()
    // Manual mode only moves focus; the native button turns Enter/Space into a click
    if (activationMode === 'automatic' && next.dataset.value !== undefined) {
      select(next.dataset.value)
    }
  }

  return (
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- focus moves between the tabs (APG tabs pattern); the list itself is not a tab stop
    <div
      {...label}
      {...props}
      ref={mergedRef}
      role="tablist"
      data-slot="tab-list"
      data-variant={variant}
      className={cn(listClasses(variant, size), className)}
      onKeyDown={handleKeyDown}
      onPointerMove={(e) => {
        onPointerMove?.(e)
        motion.onPointerMove(e)
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        motion.onPointerLeave()
      }}
    >
      {children}
    </div>
  )
}

export type TabProps = Omit<ComponentProps<'button'>, 'value' | 'role' | 'type' | 'children'> &
  TabContentProps & {
    /** Identifies the tab and pairs it with the `TabPanel` of the same `value`. */
    value: string
  }

export function Tab({
  value,
  icon,
  badge,
  disabled = false,
  className,
  ref,
  onClick,
  onFocus,
  children,
  ...props
}: TabProps) {
  const context = useTabsContext('Tab')
  const isSelected = context.selected === value
  const ownRef = useRef<HTMLButtonElement>(null)
  const mergedRef = useMergedRef(ownRef, ref)
  useRevealWhenSelected(ownRef, isSelected)

  return (
    <button
      {...props}
      ref={mergedRef}
      type="button"
      role="tab"
      id={partId(context.baseId, 'tab', value)}
      aria-controls={partId(context.baseId, 'panel', value)}
      aria-selected={isSelected}
      // Roving tabindex: Tab enters on the selected tab, arrows move within the list
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      data-slot="tab"
      data-value={value}
      data-selected={isSelected || undefined}
      data-disabled={disabled || undefined}
      className={cn(itemClasses(context.variant, context.size), className)}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) context.select(value)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        revealOnFocus(e.currentTarget)
      }}
    >
      <TabContent icon={icon} badge={badge}>
        {children}
      </TabContent>
    </button>
  )
}

export type TabPanelProps = Omit<ComponentProps<'div'>, 'role' | 'hidden'> & {
  /** The `value` of the tab that shows this panel. */
  value: string
  /**
   * Keep the panel (and its state) mounted while hidden; by default only the selected panel renders.
   * @defaultValue false
   */
  keepMounted?: boolean
}

export function TabPanel({ value, keepMounted = false, className, ...props }: TabPanelProps) {
  const { baseId, selected } = useTabsContext('TabPanel')
  const isSelected = selected === value
  if (!isSelected && !keepMounted) return null

  return (
    <div
      // APG tabpanel; Tab moves from the tablist straight into the content
      tabIndex={0}
      {...props}
      role="tabpanel"
      id={partId(baseId, 'panel', value)}
      aria-labelledby={partId(baseId, 'tab', value)}
      hidden={!isSelected}
      data-slot="tab-panel"
      className={cn(
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
    />
  )
}
