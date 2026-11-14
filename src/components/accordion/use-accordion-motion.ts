import { type RefObject, useLayoutEffect, useRef, useState } from 'react'

/** Animate measured heights; never cap content with an arbitrary max-height. */
export function useAccordionMotion(
  open: boolean,
  itemRef: RefObject<HTMLDivElement | null>,
  restoreFocus: (item: HTMLDivElement) => void,
) {
  const panelRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const previousOpen = useRef(open)
  const [present, setPresent] = useState(open)

  useLayoutEffect(() => {
    const panel = panelRef.current
    const inner = innerRef.current
    if (!panel || !inner) return
    const changed = previousOpen.current !== open
    previousOpen.current = open
    let active = true
    let animation: Animation | undefined
    let observer: ResizeObserver | undefined
    let target = -1
    let settled = false
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')

    // Move focus before making a previously visible subtree inert or hidden.
    if (!open && panel.contains(panel.ownerDocument.activeElement) && itemRef.current) {
      restoreFocus(itemRef.current)
    }
    panel.inert = !open
    panel.toggleAttribute('inert', !open)
    if (open) panel.removeAttribute('aria-hidden')
    else panel.setAttribute('aria-hidden', 'true')

    const finish = () => {
      if (!active) return
      settled = true
      observer?.disconnect()
      animation?.cancel()
      animation = undefined
      panel.style.removeProperty('height')
      panel.style.removeProperty('overflow')
      panel.hidden = !open
      setPresent(open)
    }
    const run = () => {
      if (!active || settled) return
      const nextTarget = open ? inner.getBoundingClientRect().height : 0
      if (nextTarget === target && animation) return
      target = nextTarget
      const from = panel.getBoundingClientRect().height
      animation?.cancel()
      panel.style.height = `${from}px`
      const current = panel.animate([{ height: `${from}px` }, { height: `${target}px` }], {
        duration: open ? 200 : 160,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'both',
      })
      animation = current
      void current.finished.then(
        () => {
          if (active && animation === current) finish()
        },
        () => {
          /* Cancellation is expected when reversing or resizing. */
        },
      )
    }

    if (!changed || reduced?.matches || typeof panel.animate !== 'function') finish()
    else {
      // A newly revealed panel starts at zero; a reversal keeps the cleanup's visual height.
      if (open && !panel.style.height) panel.style.height = '0px'
      panel.hidden = false
      panel.style.overflow = 'hidden'
      setPresent(true)
      run()
      if (open && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(run)
        observer.observe(inner)
      }
    }
    const onReducedMotion = () => {
      if (reduced?.matches) finish()
    }
    reduced?.addEventListener('change', onReducedMotion)
    return () => {
      active = false
      observer?.disconnect()
      reduced?.removeEventListener('change', onReducedMotion)
      if (animation) {
        // Preserve the rendered frame before cancel removes the WAAPI fill, for reversals.
        panel.style.height = `${panel.getBoundingClientRect().height}px`
        animation.cancel()
      }
    }
  }, [open, itemRef, restoreFocus])

  return { panelRef, innerRef, present }
}
