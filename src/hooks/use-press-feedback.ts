import { useEffect, useRef } from 'react'

// Ripple tuning
const GROW_MS = 450
const FADE_MS = 300
const OPACITY = 0.16

type Ripple = { el: HTMLSpanElement; grow: Animation }

const RELEASE_EVENTS = ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'] as const

/**
 * Press feedback for buttons and button-styled links: toggles `data-pressed`
 * on the host (styled as a sunken, inset look) and, when `ripple` is on, spawns a
 * Material-style ripple via the Web Animations API.
 *
 * Attach the returned ref to an absolutely positioned, clipped overlay inside
 * the host. Listeners are bound natively to the overlay's parent so the host's
 * own props/ref stay untouched. Hosts with aria-disabled="true" get no feedback.
 */
export function usePressFeedback<T extends HTMLElement = HTMLSpanElement>(ripple = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const layer = ref.current
    const host = layer?.parentElement
    if (!layer || !host) return

    const live = new Set<Ripple>()
    // Links activate on Enter only; Space would scroll the page
    const activationKeys = host instanceof HTMLAnchorElement ? ['Enter'] : ['Enter', ' ']

    const isInert = () => host.getAttribute('aria-disabled') === 'true'

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
    const release = () => {
      delete host.dataset.pressed
      for (const r of live) {
        live.delete(r)
        r.grow.finished
          .catch(() => {})
          .then(
            () =>
              r.el.animate([{ opacity: 0 }], {
                duration: FADE_MS,
                easing: 'linear',
                fill: 'forwards',
              }).finished,
          )
          .catch(() => {})
          .finally(() => r.el.remove())
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.isPrimary === false || isInert()) return
      const rect = layer.getBoundingClientRect()
      press(e.clientX - rect.left, e.clientY - rect.top)
    }

    // Keyboard presses ripple from the center, like Material
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || !activationKeys.includes(e.key) || isInert()) return
      press()
    }

    host.addEventListener('pointerdown', onPointerDown)
    host.addEventListener('keydown', onKeyDown)
    for (const type of RELEASE_EVENTS) host.addEventListener(type, release)

    return () => {
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('keydown', onKeyDown)
      for (const type of RELEASE_EVENTS) host.removeEventListener(type, release)
      release()
    }
  }, [ripple])

  return ref
}
