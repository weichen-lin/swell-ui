import { type RefObject, useCallback, useLayoutEffect } from 'react'

/** Measure the native control so wrapping, fonts and IME text keep their browser behavior. */
export function useAutoResize(
  ref: RefObject<HTMLTextAreaElement | null>,
  enabled: boolean,
  minRows: number,
  maxRows?: number,
) {
  const resize = useCallback(() => {
    const node = ref.current
    if (!enabled || !node || node.getClientRects().length === 0) return
    const style = getComputedStyle(node)
    const lineHeight = Number.parseFloat(style.lineHeight)
    if (!Number.isFinite(lineHeight)) return
    const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
    const border =
      Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
    const min = minRows * lineHeight + padding
    const max = maxRows == null ? Infinity : maxRows * lineHeight + padding
    const scrollTop = node.scrollTop

    // Collapse before measuring so removing text shrinks too. Hide the scrollbar for the first
    // measurement; when capped, the final scrollable width is handled by the native textarea.
    node.style.overflowY = 'hidden'
    node.style.height = '0px'
    const contentHeight = node.scrollHeight
    const height = Math.max(min, Math.min(max, contentHeight))
    node.style.height = `${height + (style.boxSizing === 'border-box' ? border : -padding)}px`
    node.style.overflowY = contentHeight > max ? 'auto' : 'hidden'
    node.scrollTop = scrollTop
  }, [enabled, ref, minRows, maxRows])

  // Every commit includes controlled values, font/size classes and caller-supplied styles.
  useLayoutEffect(resize)

  useLayoutEffect(() => {
    if (!enabled) return
    const node = ref.current
    if (!node) return
    let width = node.getBoundingClientRect().width
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            const nextWidth = node.getBoundingClientRect().width
            if (nextWidth !== width) {
              width = nextWidth
              resize()
            }
          })
    observer?.observe(node)
    // Also covers a viewport change on platforms without ResizeObserver.
    window.addEventListener('resize', resize)
    document.fonts?.addEventListener('loadingdone', resize)
    let active = true
    void document.fonts?.ready.then(() => {
      if (active) resize()
    })
    return () => {
      active = false
      observer?.disconnect()
      window.removeEventListener('resize', resize)
      document.fonts?.removeEventListener('loadingdone', resize)
      node.style.removeProperty('height')
      node.style.removeProperty('overflow-y')
    }
  }, [enabled, ref, resize])

  return resize
}
