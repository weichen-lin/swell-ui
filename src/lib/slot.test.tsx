import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vite-plus/test'
import { Slot } from './slot'

describe('Slot', () => {
  it('renders the child with merged props, classes, style and both refs', () => {
    const slotRef = createRef<HTMLElement>()
    const childRef = createRef<HTMLAnchorElement>()
    render(
      <Slot ref={slotRef} className="px-2 text-fg" style={{ color: 'red', margin: 1 }} title="slot">
        <a
          ref={childRef}
          href="/x"
          className="px-4"
          style={{ color: 'blue' }}
          title="child"
          data-own=""
        >
          X
        </a>
      </Slot>,
    )
    const link = screen.getByRole('link', { name: 'X' })
    expect(slotRef.current).toBe(link)
    expect(childRef.current).toBe(link)
    // cn: the child's conflicting class wins, the rest is kept
    expect(link).toHaveClass('px-4', 'text-fg')
    expect(link).not.toHaveClass('px-2')
    expect(link).toHaveStyle({ color: 'rgb(0, 0, 255)', margin: '1px' })
    expect(link).toHaveAttribute('title', 'child')
    expect(link).toHaveAttribute('data-own')
  })

  it("runs the child's handler first, so the slot sees its preventDefault", () => {
    const calls: string[] = []
    let seenPrevented: boolean | undefined
    render(
      <Slot
        onClick={(e) => {
          calls.push('slot')
          seenPrevented = e.defaultPrevented
        }}
      >
        <a
          href="/x"
          onClick={(e) => {
            calls.push('child')
            e.preventDefault()
          }}
        >
          X
        </a>
      </Slot>,
    )
    fireEvent.click(screen.getByRole('link'))
    expect(calls).toEqual(['child', 'slot'])
    expect(seenPrevented).toBe(true)
  })

  it('passes a handler through when only one side has it', () => {
    const onFocus = vi.fn()
    render(
      <Slot onFocus={onFocus}>
        <button type="button">B</button>
      </Slot>,
    )
    fireEvent.focus(screen.getByRole('button'))
    expect(onFocus).toHaveBeenCalledOnce()
  })

  it('clears both refs on unmount', () => {
    const slotRef = createRef<HTMLElement>()
    const childRef = vi.fn()
    const { unmount } = render(
      <Slot ref={slotRef}>
        <span ref={childRef}>S</span>
      </Slot>,
    )
    expect(childRef).toHaveBeenLastCalledWith(expect.any(HTMLSpanElement))
    unmount()
    expect(slotRef.current).toBeNull()
    expect(childRef).toHaveBeenLastCalledWith(null)
  })
})
