import { Menu } from 'lucide-react'
import {
  Children,
  cloneElement,
  type ComponentProps,
  createContext,
  isValidElement,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import { Slot, wrapChildren } from '../../lib/slot'
import { Badge, type BadgeProps } from '../badge'
import { Button } from '../button'
import { Drawer, DrawerClose } from '../drawer'
import { useMergedRef } from '../input/field'
import { boxIn } from '../tabs/shared'

/** At and above this width the sidebar is part of the layout; below it, a drawer. */
const WIDE_QUERY = '(min-width: 960px)'

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  drawerId: string
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

function useSidebarContext(part: string) {
  const context = useContext(SidebarContext)
  if (!context) throw new Error(`${part} must be rendered inside <SidebarProvider>`)
  return context
}

// Which copy a part is rendered in: the docked sidebar or the drawer
const PanelContext = createContext<{ drawer: boolean } | null>(null)

function usePanelContext(part: string) {
  const context = useContext(PanelContext)
  if (!context) throw new Error(`${part} must be rendered inside <Sidebar>`)
  return context
}

/**
 * Drawer open state shared by Sidebar and SidebarTrigger, which usually sit in different parts of
 * the app shell. One per sidebar; no shortcuts, no persistence.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const drawerId = useId()

  // Widening past the breakpoint docks the sidebar; a drawer left open there would keep the page inert
  useEffect(() => {
    if (!open || typeof window.matchMedia !== 'function') return
    const wide = window.matchMedia(WIDE_QUERY)
    const onChange = () => {
      if (wide.matches) setOpen(false)
    }
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [open])

  return <SidebarContext value={{ open, setOpen, drawerId }}>{children}</SidebarContext>
}

// A second nav landmark on the page needs a name to tell it apart; one of the two is required
type SidebarLabel =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-labelledby': string; 'aria-label'?: never }

export type SidebarProps = Omit<ComponentProps<'nav'>, 'aria-label' | 'aria-labelledby'> &
  SidebarLabel

/**
 * App navigation. From 960px up it is docked at the start of the layout: 240px, full height, only
 * the body scrolls. Below 960px it is hidden and SidebarTrigger opens the same content in a drawer.
 * Needs a SidebarProvider around both.
 */
export function Sidebar({ className, children, ...props }: SidebarProps) {
  const { open, setOpen, drawerId } = useSidebarContext('Sidebar')
  const label = props['aria-label']
    ? { 'aria-label': props['aria-label'] }
    : { 'aria-labelledby': props['aria-labelledby'] }

  return (
    <>
      <PanelContext value={{ drawer: false }}>
        <nav
          {...props}
          data-slot="sidebar"
          className={cn(
            'sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-border-strong bg-bg',
            'min-[960px]:flex',
            className,
          )}
        >
          {children}
        </nav>
      </PanelContext>
      <Drawer {...label} id={drawerId} open={open} onOpenChange={setOpen} side="left" size="sm">
        <PanelContext value={{ drawer: true }}>
          <nav
            {...label}
            data-slot="sidebar"
            data-drawer=""
            className="flex min-h-0 flex-1 flex-col"
          >
            {children}
          </nav>
        </PanelContext>
      </Drawer>
    </>
  )
}

export type SidebarTriggerProps = Omit<
  ComponentProps<'button'>,
  'children' | 'type' | 'aria-label' | 'aria-expanded' | 'aria-controls'
> & {
  'aria-label'?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Menu button that opens the drawer; only shown below 960px. Focus returns here on close. */
export function SidebarTrigger({
  'aria-label': ariaLabel = 'Open navigation',
  className,
  onClick,
  ...props
}: SidebarTriggerProps) {
  const { open, setOpen, drawerId } = useSidebarContext('SidebarTrigger')
  return (
    <Button
      {...props}
      intent="ghost"
      icon={<Menu />}
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-controls={drawerId}
      // No wrapper span: it would stay in the layout while the button is hidden
      tooltip={false}
      className={cn('min-[960px]:hidden', className)}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) setOpen(true)
      }}
    />
  )
}

/** Brand row, pinned above the body. In the drawer it also holds the close button. */
export function SidebarHeader({ className, children, ...props }: ComponentProps<'div'>) {
  const { drawer } = usePanelContext('SidebarHeader')
  return (
    <div
      {...props}
      data-slot="sidebar-header"
      className={cn('flex h-14 shrink-0 items-center gap-2 px-3', className)}
    >
      {children}
      {drawer && <DrawerClose aria-label="Close navigation" className="ms-auto shrink-0" />}
    </div>
  )
}

/*
 * Hover pill (Tabs line variant, turned vertical): one ::after on the body glides between items
 * while the pointer moves down the list, stays on the last hovered item over gaps and labels, and
 * fades only when the pointer leaves the body. Entering snaps it onto the item and fades it in.
 * It lives in the body's scrolled content coordinates, so it scrolls with the items.
 */
function useHoverPill<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const hovered = useRef<HTMLElement | null>(null)

  const onPointerMove = (e: PointerEvent<T>) => {
    const body = ref.current
    // Mouse only: a touch tap would leave a pill stranded on the item
    if (!body || (e.pointerType && e.pointerType !== 'mouse')) return
    const item = (e.target as Element).closest<HTMLElement>('[data-slot="sidebar-item"]')
    if (!item || item.closest('[data-slot="sidebar-body"]') !== body) return
    const entering = body.dataset.hover === undefined
    if (item === hovered.current && !entering) return
    hovered.current = item
    if (entering) body.dataset.hoverEnter = ''
    else delete body.dataset.hoverEnter
    const { x, y, w, h } = boxIn(body, item)
    body.style.setProperty('--sidebar-hover-x', `${x}px`)
    body.style.setProperty('--sidebar-hover-y', `${y}px`)
    body.style.setProperty('--sidebar-hover-w', `${w}px`)
    body.style.setProperty('--sidebar-hover-h', `${h}px`)
    body.dataset.hover = ''
  }

  const onPointerLeave = () => {
    const body = ref.current
    if (!body) return
    hovered.current = null
    delete body.dataset.hover
  }

  return { ref, onPointerMove, onPointerLeave }
}

const bodyClasses = [
  'relative isolate flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-3 py-2',
  // fg at 5%, under the items (z -1 inside the isolated body); Tabs' timing and curve
  'after:pointer-events-none after:absolute after:top-0 after:left-0 after:-z-1 after:rounded-md',
  'after:bg-fg/5 after:opacity-0 data-hover:after:opacity-100',
  'after:h-(--sidebar-hover-h) after:w-(--sidebar-hover-w)',
  'after:[translate:var(--sidebar-hover-x)_var(--sidebar-hover-y)]',
  'after:transition-[translate,width,height,opacity] after:duration-150',
  'after:ease-[cubic-bezier(0.33,1,0.68,1)]',
  'data-hover-enter:after:transition-opacity',
]

/** The groups, between header and footer; the only part that scrolls. */
export function SidebarBody({
  className,
  ref,
  onPointerMove,
  onPointerLeave,
  ...props
}: ComponentProps<'div'>) {
  const hover = useHoverPill<HTMLDivElement>()
  const mergedRef = useMergedRef(hover.ref, ref)
  return (
    <div
      {...props}
      ref={mergedRef}
      data-slot="sidebar-body"
      className={cn(bodyClasses, className)}
      onPointerMove={(e) => {
        onPointerMove?.(e)
        hover.onPointerMove(e)
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e)
        hover.onPointerLeave()
      }}
    />
  )
}

/** Pinned below the body. */
export function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} data-slot="sidebar-footer" className={cn('shrink-0 p-3', className)} />
}

export type SidebarGroupProps = ComponentProps<'div'> & {
  /** Short sentence-case label above the items; also names the list for screen readers. */
  label?: ReactNode
}

export function SidebarGroup({ label, className, children, ...props }: SidebarGroupProps) {
  const labelId = useId()
  const hasLabel = label != null && label !== false && label !== ''
  return (
    <div {...props} data-slot="sidebar-group" className={cn('flex flex-col', className)}>
      {hasLabel && (
        <div
          id={labelId}
          data-slot="sidebar-group-label"
          className="px-2 pt-2 pb-1 text-xs/4 text-fg-muted"
        >
          {label}
        </div>
      )}
      {/* A list, so screen readers announce how many items the group has */}
      <ul aria-labelledby={hasLabel ? labelId : undefined} className="flex flex-col gap-px">
        {children}
      </ul>
    </div>
  )
}

const itemClasses = [
  'flex h-9 w-full items-center gap-2 rounded-md ps-2.5 pe-2',
  'text-sm leading-5 font-medium text-fg-muted no-underline select-none',
  'touch-manipulation [-webkit-tap-highlight-color:transparent]',
  // Not transition-colors: that would also fade the focus ring in from the text color
  'transition-[color,background-color] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
  // Inset so the scrolling body never clips the ring. No outline-none: it zeroes
  // --tw-outline-style, and outline-2 would then draw nothing.
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
  // Current item: aria-current is set by the router's link, so it is styled from the DOM, not props
  'hover:text-fg aria-[current=page]:bg-fg/8 aria-[current=page]:text-fg',
  // Pressed: one step deeper than where the item was
  'active:bg-fg/8 aria-[current=page]:active:bg-fg/12',
  'forced-colors:aria-[current=page]:bg-[Highlight] forced-colors:aria-[current=page]:text-[HighlightText]',
  'forced-colors:aria-[current=page]:[forced-color-adjust:none]',
]

/** Wraps runs of plain text in the truncating label span; icons and badges pass through. */
function withLabel(children: ReactNode) {
  const out: ReactNode[] = []
  let text: (string | number)[] = []
  const flush = () => {
    if (text.length === 0) return
    out.push(
      <span key={`label-${out.length}`} className="min-w-0 flex-1 truncate">
        {text}
      </span>,
    )
    text = []
  }
  for (const child of Children.toArray(children)) {
    if (typeof child === 'string' || typeof child === 'number') text.push(child)
    else {
      flush()
      out.push(child)
    }
  }
  flush()
  return out
}

export type SidebarItemProps = ComponentProps<'a'> & {
  /**
   * Render the only child (usually a router Link) as the item, merging these props into it. The
   * link sets href and aria-current="page"; the item is styled from them.
   */
  asChild?: boolean
}

/**
 * A sidebar link. Plain `<a>` by default; with `asChild`, your router's Link. Mark the current one
 * aria-current="page". Inside the drawer, a click the link handles in place (preventDefault, as
 * router links do) closes the drawer; a modified click opens a new tab and leaves it open.
 */
export function SidebarItem({ asChild = false, className, children, ...props }: SidebarItemProps) {
  const { setOpen } = useSidebarContext('SidebarItem')
  const { drawer } = usePanelContext('SidebarItem')
  const itemProps = { ...props, 'data-slot': 'sidebar-item', className: cn(itemClasses, className) }

  let item: ReactNode
  if (asChild) {
    const child = Children.only(children)
    item = isValidElement<{ children?: unknown }>(child) ? (
      <Slot {...itemProps}>
        {cloneElement(child, { children: wrapChildren(child.props.children, withLabel) })}
      </Slot>
    ) : null
  } else {
    item = <a {...itemProps}>{withLabel(children)}</a>
  }

  return (
    // Bubbles up after every handler on the link, including the router's own preventDefault
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- not an interaction: reads the link's click once the link has handled it
    <li
      className="flex"
      onClick={(e) => {
        if (drawer && e.defaultPrevented) setOpen(false)
      }}
    >
      {item}
    </li>
  )
}

/** Decorative 16px leading icon for a SidebarItem (hidden from assistive tech); takes the text color. */
export function SidebarIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      {...props}
      data-slot="sidebar-item-icon"
      className={cn('flex shrink-0 [&_svg]:size-4', className)}
    />
  )
}

/** Count at the end of a SidebarItem, as a small neutral Badge; part of the name ("Projects 8"). */
export function SidebarBadge({ className, ...props }: BadgeProps) {
  return (
    <>
      {/* Flex layout drops this space; the accessible name keeps it ("Projects 8") */}{' '}
      <Badge size="sm" {...props} className={cn('shrink-0', className)} />
    </>
  )
}
