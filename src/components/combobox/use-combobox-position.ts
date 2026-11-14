import { type RefObject, useLayoutEffect } from 'react'

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, Math.max(min, max)))

/** Top-layer positioning only: unlike Menu, a combobox never transfers focus into the list. */
export function useComboboxPosition(
  open: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
) {
  useLayoutEffect(() => {
    const content = contentRef.current
    const anchor = inputRef.current?.closest<HTMLElement>('[data-slot="input-control"]')
    if (!open || !content || !anchor) return
    content.showPopover?.()
    const update = () => {
      const rect = anchor.getBoundingClientRect()
      const viewport = window.visualViewport
      const left = viewport?.offsetLeft ?? 0
      const top = viewport?.offsetTop ?? 0
      const width = viewport?.width ?? document.documentElement.clientWidth
      const height = viewport?.height ?? document.documentElement.clientHeight
      content.style.width = `${Math.min(rect.width, Math.max(0, width - 16))}px`
      const below = top + height - rect.bottom - 12
      const above = rect.top - top - 12
      const needed = Math.min(content.scrollHeight, 280)
      const side = below < needed && above > below ? 'top' : 'bottom'
      content.style.maxHeight = `${Math.max(0, Math.min(280, side === 'top' ? above : below))}px`
      const w = content.offsetWidth
      const h = content.offsetHeight
      const rtl = getComputedStyle(anchor).direction === 'rtl'
      content.style.left = `${Math.round(clamp(rtl ? rect.right - w : rect.left, left + 8, left + width - w - 8))}px`
      content.style.top = `${Math.round(clamp(side === 'top' ? rect.top - h - 4 : rect.bottom + 4, top + 8, top + height - h - 8))}px`
      content.dataset.side = side
    }
    update()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(anchor)
    observer?.observe(content)
    // Child changes can alter scrollHeight without altering a height-capped popup's border box.
    const mutation = new MutationObserver(update)
    mutation.observe(content, { childList: true, subtree: true, characterData: true })
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      observer?.disconnect()
      mutation.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      content.hidePopover?.()
    }
  }, [open, inputRef, contentRef])
}
