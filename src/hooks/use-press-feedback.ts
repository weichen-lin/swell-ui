import { useEffect, useRef } from 'react'

// Ripple tuning
const GROW_MS = 450
const FADE_MS = 300
const OPACITY = 0.16

type Ripple = { el: HTMLSpanElement; grow: Animation }

const RELEASE_EVENTS = [
  'pointerup',
  'pointerleave',
  'pointercancel',
  'keyup',
  'blur',
  'focusout',
] as const

/**
 * Press feedback for buttons, button-styled links and radio tile labels: toggles `data-pressed`
 * on the host (styled as a sunken, inset look) and, when `ripple` is on, spawns a
 * Material-style ripple via the Web Animations API.
 *
 * Attach the returned ref to an absolutely positioned, clipped overlay inside
 * the host. Listeners are bound natively to the overlay's parent so the host's
 * own props/ref stay untouched. Hosts with aria-disabled="true" get no feedback.
 */
export function usePressFeedback<T extends HTMLElement = HTMLSpanElement>(
  ripple = true,
  disabled = false,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const layer = ref.current
    const host = layer?.parentElement
    if (!layer || !host || disabled) return

    const live = new Set<Ripple>()
    const label = host instanceof HTMLLabelElement ? host : null
    // A radio activates with Space; arrow keys only move the native selection.
    const activationKeys = label
      ? [' ']
      : host instanceof HTMLAnchorElement
        ? ['Enter']
        : ['Enter', ' ']

    const isInert = () =>
      host.getAttribute('aria-disabled') === 'true' || label?.control?.matches(':disabled')

    const canRipple = () =>
      ripple &&
      typeof layer.animate === 'function' &&
      !(
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )

    const spawn = (x: number, y: number, rect: DOMRect) => {
      // Radius reaches the farthest corner so the circle always covers the host
      const r = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))
      const el = document.createElement('span')
      el.style.cssText =
        `position:absolute;left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;` +
        `border-radius:50%;background:currentColor;opacity:${OPACITY};pointer-events:none`
      layer.append(el)
      const grow = el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        duration: GROW_MS,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        fill: 'forwards',
      })
      live.add({ el, grow })
    }

    const press = (x?: number, y?: number) => {
      host.dataset.pressed = ''
      if (!canRipple()) return
      const rect = layer.getBoundingClientRect()
      spawn(x ?? rect.width / 2, y ?? rect.height / 2, rect)
    }

    // Let each ripple finish growing before it fades, so quick taps still read
    const release = (event?: Event) => {
      if (label && event && !host.hasAttribute('data-pressed')) return
      delete host.dataset.pressed
      // Dragging off a tile or losing focus cancels its feedback immediately.
      if (label && event?.type !== 'pointerup' && event?.type !== 'keyup') {
        live.clear()
        layer.replaceChildren()
        return
      }
      for (const r of live) {
        live.delete(r)
        r.grow.finished
          .catch(() => {})
          .then(() => {
            if (!layer.contains(r.el)) return
            return r.el.animate([{ opacity: 0 }], {
              duration: FADE_MS,
              easing: 'linear',
              fill: 'forwards',
            }).finished
          })
          .catch(() => {})
          .finally(() => r.el.remove())
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.isPrimary === false || isInert()) return
      const rect = layer.getBoundingClientRect()
      press(e.clientX - rect.left, e.clientY - rect.top)
    }

    // Touch may implicitly capture the pointer, so leaving the label needn't fire pointerleave.
    const onTilePointerMove = (e: PointerEvent) => {
      if (e.isPrimary === false || !host.hasAttribute('data-pressed')) return
      const rect = host.getBoundingClientRect()
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        release()
    }

    // Keyboard presses ripple from the center, like Material
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || !activationKeys.includes(e.key) || isInert()) return
      press()
    }

    host.addEventListener('pointerdown', onPointerDown)
    if (label) host.addEventListener('pointermove', onTilePointerMove)
    host.addEventListener('keydown', onKeyDown)
    for (const type of RELEASE_EVENTS) host.addEventListener(type, release)

    return () => {
      host.removeEventListener('pointerdown', onPointerDown)
      if (label) host.removeEventListener('pointermove', onTilePointerMove)
      host.removeEventListener('keydown', onKeyDown)
      for (const type of RELEASE_EVENTS) host.removeEventListener(type, release)
      release()
    }
  }, [ripple, disabled])

  return ref
}
