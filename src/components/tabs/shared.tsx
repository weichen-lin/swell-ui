import { type PointerEvent, type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react'

export type TabsVariant = 'line' | 'segmented'
export type TabsSize = 'sm' | 'md'

/*
 * Shared look for Tabs (tablist) and TabNav (nav links). A Tab marks itself with `data-selected`
 * and `data-disabled`; a TabNav link is marked by whoever renders it (usually a router Link) with
 * aria-current="page" and aria-disabled, so the classes and the measuring read both.
 *
 * Two decorations live on the list itself, placed by custom properties that useTabListMotion
 * measures (so they slide the same way in every direction and survive scrolling):
 * - ::before, the selection indicator: the 2px line bar, or the segmented knob.
 * - ::after, the line hover pill: glides between tabs while the pointer moves across the bar and
 *   stays on the last hovered tab; only leaving the whole bar fades it out (Vercel dashboard).
 * Both sit at z -1 inside the isolated list: above its divider, below the labels.
 * The edge fades on an overflowing list are a mask whose lengths useTabListMotion sets too.
 */
const listBase = [
  'relative isolate max-w-full overflow-x-auto overscroll-x-contain scroll-px-6',
  '[mask-image:linear-gradient(to_right,transparent,#000_var(--tabs-fade-left,0px),#000_calc(100%-var(--tabs-fade-right,0px)),transparent)]',
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  'before:pointer-events-none before:absolute before:left-0 before:-z-1 before:opacity-0',
  'before:w-(--tabs-indicator-w) data-indicator:before:opacity-100',
  // Same curve as the Dialog enter, so the product has one "settle" feel
  'before:duration-200 before:ease-[cubic-bezier(0.16,1,0.3,1)]',
  // First placement and resizes (font load, zoom) jump instead of sliding
  'data-instant:before:transition-none data-instant:after:transition-none',
]

const listVariant: Record<TabsVariant, string[]> = {
  line: [
    // 1px divider as an inset shadow: the 2px bar paints over it instead of adding height
    'flex items-center shadow-[inset_0_-1px_0_var(--color-border-strong)]',
    // fg rather than primary: brand color is kept for primary CTAs, and fg already
    // flips for dark, where a dark brand color would sink into the page
    'before:bottom-0 before:h-0.5 before:bg-fg before:[translate:var(--tabs-indicator-x)_0]',
    'before:transition-[translate,width]',
    'forced-colors:before:bg-[Highlight] forced-colors:before:[forced-color-adjust:none]',
    // Hover pill: fg at 7% so it reads on any surface (page, card, dialog) and follows the palette
    'after:pointer-events-none after:absolute after:top-0 after:left-0 after:-z-1 after:rounded-control',
    'after:bg-fg/7 after:opacity-0 data-hover:after:opacity-100',
    'after:h-(--tabs-hover-h) after:w-(--tabs-hover-w)',
    'after:[translate:var(--tabs-hover-x)_var(--tabs-hover-y)]',
    'after:transition-[translate,width,height,opacity] after:duration-150',
    'after:ease-[cubic-bezier(0.33,1,0.68,1)]',
    // Entering the bar: the pill appears in place (fade only), it glides only between tabs
    'data-hover-enter:after:transition-opacity',
  ],
  segmented: [
    // Geist Switch: hairline frame, 4px inset, a soft knob under the selected item. The frame is
    // an inset shadow: the overflow fade's mask would clip one drawn outside the box.
    'inline-flex w-fit rounded-item p-1 shadow-[inset_0_0_0_1px_var(--color-ring)]',
    'before:top-0 before:h-(--tabs-indicator-h) before:rounded-inset before:bg-fg/8',
    'before:[translate:var(--tabs-indicator-x)_var(--tabs-indicator-y)]',
    'before:transition-[translate,width,height]',
    'forced-colors:before:border-2 forced-colors:before:border-[Highlight]',
  ],
}

// Line: the bar is taller than its 32/28px items, like Vercel's dashboard tabs.
// Segmented: Geist Switch medium/small heights.
const listSize: Record<TabsVariant, Record<TabsSize, string>> = {
  line: { sm: 'h-10', md: 'h-12' },
  segmented: { sm: 'h-8', md: 'h-9' },
}

export function listClasses(variant: TabsVariant, size: TabsSize) {
  return [
    ...listBase,
    ...listVariant[variant],
    listSize[variant][size],
    variant === 'segmented' ? 'pointer-coarse:h-13' : 'pointer-coarse:h-12',
  ]
}

const itemBase = [
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center',
  'text-sm whitespace-nowrap text-fg-muted no-underline select-none',
  'touch-manipulation [-webkit-tap-highlight-color:transparent]',
  'transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
  // Inset so the list's overflow clipping never cuts the ring
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
  'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  'not-data-disabled:not-aria-disabled:hover:text-fg data-selected:text-fg aria-[current=page]:text-fg',
  'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  'forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100',
  'forced-colors:aria-disabled:text-[GrayText] forced-colors:aria-disabled:opacity-100',
]

const itemVariant: Record<TabsVariant, string[]> = {
  // No gap between items: the pill glides edge to edge, and px-3 x2 spaces labels 24px apart
  line: ['rounded-control data-selected:font-medium aria-[current=page]:font-medium'],
  segmented: ['h-full rounded-inset font-medium'],
}

const itemSize: Record<TabsVariant, Record<TabsSize, string>> = {
  line: { sm: 'h-7 px-2.5', md: 'h-8 px-3' },
  segmented: { sm: 'px-2.5', md: 'px-3' },
}

export function itemClasses(variant: TabsVariant, size: TabsSize) {
  return [...itemBase, ...itemVariant[variant], itemSize[variant][size]]
}

export type TabContentProps = {
  /** Decorative leading icon (hidden from assistive tech). */
  icon?: ReactNode
  /** Trailing slot, usually a Badge; part of the accessible name (e.g. "Resources 12"). */
  badge?: ReactNode
  children?: ReactNode
}

/** Icon, label and badge, laid out the same in both components. */
export function TabContent({ icon, badge, children }: TabContentProps) {
  return (
    <span data-slot="tab-content" className="inline-flex items-center gap-2">
      {icon != null && icon !== false && (
        <span aria-hidden data-slot="tab-icon" className="inline-flex shrink-0 [&_svg]:size-4">
          {icon}
        </span>
      )}
      {/*
       * The label and an invisible medium-weight copy share one grid cell, so the cell is always
       * as wide as the selected (bolder) text and selecting a tab never shifts its neighbours.
       */}
      <span className="grid justify-items-center">
        <span className="col-start-1 row-start-1">{children}</span>
        <span
          aria-hidden
          data-slot="tab-label-sizer"
          className="invisible col-start-1 row-start-1 font-medium"
        >
          {children}
        </span>
      </span>
      {badge != null && badge !== false && (
        <>
          {/* Flex layout drops this space; the accessible name keeps it ("Resources 12", not "Resources12") */}{' '}
          <span data-slot="tab-badge" className="inline-flex">
            {badge}
          </span>
        </>
      )}
    </span>
  )
}

type Box = { x: number; y: number; w: number; h: number }

/*
 * An element's box in the list's scrolled content coordinates, which is where the absolutely
 * positioned pseudo-elements live. Rects keep subpixel widths; dividing by the list's own scale
 * undoes ancestor transforms (the Dialog scales in while it opens).
 */
export function boxIn(list: HTMLElement, el: Element): Box {
  const lr = list.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const scale = list.offsetWidth ? lr.width / list.offsetWidth : 1
  return {
    x: (r.left - lr.left) / scale - list.clientLeft + list.scrollLeft,
    y: (r.top - lr.top) / scale - list.clientTop + list.scrollTop,
    w: r.width / scale,
    h: r.height / scale,
  }
}

function setBox(list: HTMLElement, name: 'indicator' | 'hover', { x, y, w, h }: Box) {
  list.style.setProperty(`--tabs-${name}-x`, `${x}px`)
  list.style.setProperty(`--tabs-${name}-y`, `${y}px`)
  list.style.setProperty(`--tabs-${name}-w`, `${w}px`)
  list.style.setProperty(`--tabs-${name}-h`, `${h}px`)
}

const isSelected = (item: HTMLElement) =>
  item.dataset.selected !== undefined || item.getAttribute('aria-current') === 'page'

const isDisabled = (item: HTMLElement) =>
  item.dataset.disabled !== undefined || item.getAttribute('aria-disabled') === 'true'

/** This list's own items; a nested tab list keeps its items to itself. */
function ownItems(list: HTMLElement) {
  return [...list.querySelectorAll<HTMLElement>('[data-slot="tab"]')].filter(
    (item) => item.closest('[data-slot="tab-list"]') === list,
  )
}

// The line bar spans the label plus 2px each side (Geist); the segmented knob fills the item
const LINE_BAR_OUTSET = 2

const EDGE_FADE = 24

/*
 * Edge fades: a side fades only while there is more to scroll toward it, over that distance up
 * to 24px, so a list that doesn't overflow has none. Whole pixels. Physical sides, so in RTL
 * (scrollLeft runs negative from the right) the left edge fades first.
 */
function setEdgeFade(list: HTMLElement) {
  const max = list.scrollWidth - list.clientWidth
  const left = getComputedStyle(list).direction === 'rtl' ? max + list.scrollLeft : list.scrollLeft
  const fade = (distance: number) => Math.min(Math.max(Math.round(distance), 0), EDGE_FADE)
  list.style.setProperty('--tabs-fade-left', `${fade(left)}px`)
  list.style.setProperty('--tabs-fade-right', `${fade(max - left)}px`)
}

/*
 * Places the selection indicator, drives the hover pill and sets the edge fades. Measured in JS
 * rather than with anchor positioning: moving `anchor-name` between tabs does not reliably start a
 * transition (a style flush while no tab holds the name, such as React setting tabindex on the
 * focused tab mid-commit, resolves the start value to nothing and the bar jumps). Explicit
 * lengths always have a start value, so the bar slides in every direction.
 */
export function useTabListMotion<T extends HTMLElement>(
  variant: TabsVariant,
  // TabNav: its links re-render with the router, not with TabNav, so the list reveals them
  { revealSelected = false }: { revealSelected?: boolean } = {},
) {
  const listRef = useRef<T>(null)
  const hovered = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    let revealed: HTMLElement | undefined
    const place = (instant: boolean) => {
      setEdgeFade(list)
      const item = ownItems(list).find(isSelected)
      if (!item) {
        delete list.dataset.indicator
        return
      }
      if (revealSelected && item !== revealed) {
        revealed = item
        revealInList(list, item)
      }
      const content = item.querySelector('[data-slot="tab-content"]')
      const box = boxIn(list, variant === 'line' && content ? content : item)
      if (variant === 'line') {
        box.x -= LINE_BAR_OUTSET
        box.w += LINE_BAR_OUTSET * 2
      }
      // Nothing to slide from on first placement; resizes follow at once rather than drifting
      if (instant || list.dataset.indicator === undefined) {
        list.dataset.instant = ''
        setBox(list, 'indicator', box)
        list.dataset.indicator = ''
        // Commit the jump with transitions off before turning them back on
        void list.offsetWidth
        delete list.dataset.instant
      } else {
        setBox(list, 'indicator', box)
      }
    }

    place(true)
    const onScroll = () => setEdgeFade(list)
    list.addEventListener('scroll', onScroll, { passive: true })
    const resizes =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => place(true))
    resizes?.observe(list)
    for (const item of ownItems(list)) resizes?.observe(item)
    // Selection changes arrive as attributes: Tabs re-renders its tabs, TabNav's links are
    // re-rendered by the router without TabNav itself rendering
    const mutations = new MutationObserver(() => {
      place(false)
      for (const item of ownItems(list)) resizes?.observe(item)
    })
    mutations.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-selected', 'aria-current'],
    })

    return () => {
      list.removeEventListener('scroll', onScroll)
      mutations.disconnect()
      resizes?.disconnect()
    }
  }, [variant, revealSelected])

  const onPointerMove = (e: PointerEvent<T>) => {
    const list = listRef.current
    // Mouse only: a touch tap would leave a pill stranded on the tab
    if (variant !== 'line' || !list || (e.pointerType && e.pointerType !== 'mouse')) return
    const item = (e.target as Element).closest<HTMLElement>('[data-slot="tab"]')
    // Over a gap, a disabled tab or a nested list: the pill stays where it was
    if (!item || isDisabled(item) || !ownItems(list).includes(item)) return
    const entering = list.dataset.hover === undefined
    if (item === hovered.current && !entering) return
    hovered.current = item
    // Entering snaps the pill onto the tab and fades it in; moving on removes the flag in the
    // same frame as the new position, so that change glides
    if (entering) list.dataset.hoverEnter = ''
    else delete list.dataset.hoverEnter
    setBox(list, 'hover', boxIn(list, item))
    list.dataset.hover = ''
  }

  const onPointerLeave = () => {
    const list = listRef.current
    if (!list) return
    hovered.current = null
    // Fades out where it is; the next entry snaps to its new tab
    delete list.dataset.hover
  }

  return { listRef, onPointerMove, onPointerLeave }
}

/*
 * Keep the selected item visible in an overflowing list, also on first render. Horizontal only:
 * scrollIntoView would also scroll the page when the list sits below the fold. Keyboard focus
 * uses scrollIntoView instead (the list is on screen then). The scroll padding leaves room for
 * the edge fade.
 */
function revealInList(list: HTMLElement, el: HTMLElement) {
  const pad = Number.parseFloat(getComputedStyle(list).scrollPaddingInlineStart) || 0
  const start = el.getBoundingClientRect().left - list.getBoundingClientRect().left
  const end = start + el.offsetWidth
  if (start < pad) list.scrollLeft += start - pad
  else if (end > list.clientWidth - pad) list.scrollLeft += end - list.clientWidth + pad
}

export function useRevealWhenSelected(ref: RefObject<HTMLElement | null>, selected: boolean) {
  useLayoutEffect(() => {
    const el = ref.current
    const list = el?.closest<HTMLElement>('[data-slot="tab-list"]')
    if (selected && el && list) revealInList(list, el)
  }, [ref, selected])
}

export function revealOnFocus(el: HTMLElement) {
  el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}
