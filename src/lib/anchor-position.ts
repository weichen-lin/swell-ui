import { type CSSProperties, useSyncExternalStore } from 'react'

/*
 * CSS anchor positioning for the floating layers, as a progressive enhancement: where the engine
 * supports everything below, a popup is placed by the browser (anchor() insets plus the
 * @position-try rules in theme.css) and follows scrolls and resizes without script. Elsewhere
 * (and in jsdom) the components keep measuring with getBoundingClientRect.
 *
 * Only anchor-name, position-visibility and anchor() / @position-try are used. flip-x and
 * position-try-order are probes, not features: they gate out the releases whose overflow shifting
 * or fallback handling differs from the script path (Chrome before 144, Safari before 26.2,
 * Firefox before 148).
 */
const REQUIRED = [
  'anchor-name: --a',
  'position-visibility: always',
  'position-try-fallbacks: flip-x',
  'position-try-order: most-height',
]
/** Tooltip also restyles its bubble by the fallback in use (anchored container queries). */
const REQUIRED_FOR_TOOLTIP = [...REQUIRED, 'container-type: anchored']

export function supportsAnchorPositioning(declarations: readonly string[] = REQUIRED) {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    declarations.every((declaration) => CSS.supports(declaration))
  )
}

const subscribeNever = () => () => {}
const serverSnapshot = () => false
const popupSnapshot = () => supportsAnchorPositioning()
const tooltipSnapshot = () => supportsAnchorPositioning(REQUIRED_FOR_TOOLTIP)

/** False during SSR and hydration, so the server markup always matches the script path. */
export function useAnchorPositioning(kind: 'popup' | 'tooltip' = 'popup') {
  return useSyncExternalStore(
    subscribeNever,
    kind === 'tooltip' ? tooltipSnapshot : popupSnapshot,
    serverSnapshot,
  )
}

/** useId() output as a dashed ident (anchor names must be unique per instance). */
export function anchorName(id: string) {
  return `--swell${id.replaceAll(/[^\w-]/g, '_')}`
}

/** Gives the anchor its name for as long as a popup uses it; returns the cleanup. */
export function nameAnchor(anchor: HTMLElement, name: string) {
  anchor.style.setProperty('anchor-name', name)
  return () => {
    if (anchor.style.getPropertyValue('anchor-name') === name)
      anchor.style.removeProperty('anchor-name')
  }
}

type Side = 'top' | 'bottom' | 'left' | 'right'
type Align = 'start' | 'center' | 'end'
type Style = CSSProperties & Record<`--${string}`, string>

/*
 * Mirrors the script path: the preferred side at natural size (base styles, same as the
 * --swell-<side> rule); else the opposite side at natural size; else whichever side has more
 * room (ties keep the preferred one), filling it. `gap` sits between trigger and popup, 8px
 * between popup and viewport edges, and the cross axis aligns to the trigger clamped 8px inside
 * the viewport.
 */
const fallbacks: Record<Side, string> = {
  bottom: '--swell-above, --swell-below-fill, --swell-above-fill',
  top: '--swell-below, --swell-above-fill, --swell-below-fill',
  right: '--swell-left, --swell-right-fill, --swell-left-fill',
  left: '--swell-right, --swell-left-fill, --swell-right-fill',
}
const natural: Record<Side, Style> = {
  bottom: {
    top: 'calc(anchor(bottom) + var(--swell-anchor-gap))',
    bottom: '8px',
    alignSelf: 'start',
    height: 'max-content',
  },
  top: {
    top: '8px',
    bottom: 'calc(anchor(top) + var(--swell-anchor-gap))',
    alignSelf: 'end',
    height: 'max-content',
  },
  right: {
    left: 'calc(anchor(right) + var(--swell-anchor-gap))',
    right: '8px',
    justifySelf: 'start',
    width: 'max-content',
  },
  left: {
    left: '8px',
    right: 'calc(anchor(left) + var(--swell-anchor-gap))',
    justifySelf: 'end',
    width: 'max-content',
  },
}
/* Cross axis: margins keep the clamped box 8px inside the viewport, since the browser shifts an
   overflowing box back inside its containing block. Inline sides are logical, like the script
   path's RTL handling (start aligns to the trigger's right edge in RTL). */
const inlineAlign: Record<Align, Style> = {
  start: {
    insetInlineStart: 'max(0px, anchor(self-start) - 8px)',
    insetInlineEnd: '0px',
    justifySelf: 'self-start',
  },
  center: { insetInline: '0px', justifySelf: 'anchor-center' },
  end: {
    insetInlineStart: '0px',
    insetInlineEnd: 'max(0px, anchor(self-end) - 8px)',
    justifySelf: 'self-end',
  },
}
const blockAlign: Record<Align, Style> = {
  start: { top: 'max(0px, anchor(top) - 8px)', bottom: '0px', alignSelf: 'start' },
  center: { top: '0px', bottom: '0px', alignSelf: 'anchor-center' },
  end: { top: '0px', bottom: 'max(0px, anchor(bottom) - 8px)', alignSelf: 'end' },
}

export function anchoredPopupStyle({
  name,
  side,
  align,
  gap,
  maxBlockSize,
}: {
  name: string
  side: Side
  align: Align
  gap: number
  /** Cap the fill fallbacks keep when the popup has a fixed max-height (Combobox). */
  maxBlockSize?: number
}): Style {
  const vertical = side === 'top' || side === 'bottom'
  return {
    positionAnchor: name,
    positionVisibility: 'always',
    positionTryFallbacks: fallbacks[side],
    '--swell-anchor-gap': `${gap}px`,
    ...(maxBlockSize === undefined ? {} : { '--swell-anchor-cap': `${maxBlockSize}px` }),
    ...(vertical
      ? { ...inlineAlign[align], marginInline: '8px', maxWidth: 'calc(100% - 16px)' }
      : { ...blockAlign[align], marginBlock: '8px', maxHeight: 'calc(100% - 16px)' }),
    ...natural[side],
  }
}
