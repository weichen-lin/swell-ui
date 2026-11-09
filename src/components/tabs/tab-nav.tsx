import {
  Children,
  cloneElement,
  type ComponentProps,
  createContext,
  type FocusEvent,
  isValidElement,
  type ReactNode,
  useContext,
} from 'react'
import { cn } from '../../lib/cn'
import { Slot, wrapChildren } from '../../lib/slot'
import {
  itemClasses,
  listClasses,
  revealOnFocus,
  TabContent,
  type TabContentProps,
  type TabsSize,
  type TabsVariant,
  useTabListMotion,
} from './shared'

type TabNavContextValue = { variant: TabsVariant; size: TabsSize }

const TabNavContext = createContext<TabNavContextValue | null>(null)

// A second nav landmark on the page needs a name to tell it apart; one of the two is required
type TabNavLabel =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-labelledby': string; 'aria-label'?: never }

export type TabNavProps = Omit<ComponentProps<'nav'>, 'aria-label' | 'aria-labelledby'> &
  TabNavLabel & {
    variant?: TabsVariant
    size?: TabsSize
    /** Classes for the inner `<ul>` (the scrolling bar); `className` goes to the `<nav>`. */
    listClassName?: string
  }

/**
 * Tabs that change the URL: a `<nav>` of links, the current one marked (by the router, usually)
 * with aria-current="page". Same look as Tabs, but link semantics: Tab moves between links, Enter
 * follows one, and each can be opened in a new tab. For in-page panels, use Tabs.
 */
export function TabNav({
  variant = 'line',
  size = 'md',
  className,
  listClassName,
  children,
  ...props
}: TabNavProps) {
  const { listRef, onPointerMove, onPointerLeave } = useTabListMotion<HTMLUListElement>(variant, {
    revealSelected: true,
  })

  return (
    <TabNavContext.Provider value={{ variant, size }}>
      <nav {...props} data-slot="tab-nav" className={className}>
        {/* A list, so screen readers announce how many sections there are */}
        <ul
          ref={listRef}
          data-slot="tab-list"
          data-variant={variant}
          className={cn(listClasses(variant, size), listClassName)}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          {children}
        </ul>
      </nav>
    </TabNavContext.Provider>
  )
}

export type TabNavLinkProps = ComponentProps<'a'> &
  TabContentProps & {
    /**
     * Render the only child (usually a router Link) as the tab, merging these props into it. The
     * link sets href, aria-current="page" and aria-disabled; the tab is styled from them.
     */
    asChild?: boolean
  }

/**
 * A link styled as a tab. Plain `<a>` by default; with `asChild`, your router's Link (for an index
 * route, make it current only on an exact match, or it stays current on every child route).
 */
export function TabNavLink({
  asChild = false,
  icon,
  badge,
  className,
  onFocus,
  children,
  ...props
}: TabNavLinkProps) {
  const context = useContext(TabNavContext)
  if (!context) throw new Error('TabNavLink must be rendered inside <TabNav>')
  const itemProps = {
    ...props,
    'data-slot': 'tab',
    className: cn(itemClasses(context.variant, context.size), className),
    onFocus: (e: FocusEvent<HTMLAnchorElement>) => {
      onFocus?.(e)
      revealOnFocus(e.currentTarget)
    },
  }
  const content = (label: ReactNode) => (
    <TabContent icon={icon} badge={badge}>
      {label}
    </TabContent>
  )

  let item: ReactNode
  if (asChild) {
    const child = Children.only(children)
    item = isValidElement<{ children?: unknown }>(child) ? (
      <Slot {...itemProps}>
        {cloneElement(child, { children: wrapChildren(child.props.children, content) })}
      </Slot>
    ) : null
  } else {
    item = <a {...itemProps}>{content(children)}</a>
  }

  return <li className="flex shrink-0">{item}</li>
}
