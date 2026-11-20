import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vite-plus/test'
import { Tooltip } from './tooltip'

test('opens on keyboard focus, links aria-describedby, closes on Escape and blur', async () => {
  render(
    <>
      <Tooltip content="Sync from Git">
        <button type="button">Sync</button>
      </Tooltip>
      <button type="button">Next</button>
    </>,
  )
  const trigger = screen.getByRole('button', { name: 'Sync' })
  expect(trigger).toHaveAccessibleDescription('Sync from Git')
  expect(screen.queryByRole('tooltip')).toBeNull()

  await userEvent.tab()
  expect(screen.getByRole('tooltip')).toHaveTextContent('Sync from Git')
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('tooltip')).toBeNull()

  await userEvent.tab({ shift: true })
  await userEvent.tab()
  expect(screen.getByRole('tooltip')).toBeVisible()
  await userEvent.tab()
  expect(screen.queryByRole('tooltip')).toBeNull()
})

test('opens on hover after a delay and closes on leave', () => {
  vi.useFakeTimers()
  try {
    render(
      <Tooltip content="Details" side="bottom">
        <button type="button">Info</button>
      </Tooltip>,
    )
    const wrapper = screen.getByRole('button', { name: 'Info' }).parentElement as Element
    fireEvent.pointerEnter(wrapper)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-side', 'bottom')
    fireEvent.pointerLeave(wrapper)
    expect(screen.queryByRole('tooltip')).toBeNull()
  } finally {
    vi.useRealTimers()
  }
})

test('keeps existing aria-describedby and renders nothing without content', () => {
  const { rerender } = render(
    <Tooltip content="Extra">
      <button type="button" aria-describedby="hint">
        Go
      </button>
    </Tooltip>,
  )
  const btn = screen.getByRole('button', { name: 'Go' })
  expect(btn.getAttribute('aria-describedby')).toMatch(/^hint \S+$/)

  rerender(
    <Tooltip content={undefined}>
      <button type="button" aria-describedby="hint">
        Go
      </button>
    </Tooltip>,
  )
  expect(btn).toHaveAttribute('aria-describedby', 'hint')
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
})

test('portals the bubble to body so scroll containers never clip it', async () => {
  render(
    <div style={{ overflow: 'auto' }} data-testid="scroller">
      <Tooltip content="Finished 2h ago">
        <button type="button">Succeeded</button>
      </Tooltip>
    </div>,
  )
  await userEvent.tab()
  const tip = screen.getByRole('tooltip')
  expect(screen.getByTestId('scroller')).not.toContainElement(tip)
  expect(tip.parentElement).toBe(document.body)
  expect(tip).toHaveClass('fixed')
})

test('flips to the opposite side and stays inside the viewport', async () => {
  const root = document.documentElement
  vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(root, 'clientHeight', 'get').mockReturnValue(300)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(120)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(24)
  try {
    render(
      <Tooltip content="Near the top-right corner">
        <button type="button">Edge</button>
      </Tooltip>,
    )
    const wrapper = screen.getByRole('button', { name: 'Edge' }).parentElement as Element
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 360, y: 4, width: 40, height: 20 }),
    )
    await userEvent.tab()
    const tip = screen.getByRole('tooltip')
    // No room above: flips below, and the 120px bubble is pulled back from the right edge
    expect(tip).toHaveAttribute('data-side', 'bottom')
    expect(tip.style.top).toBe('24px')
    expect(tip.style.left).toBe(`${400 - 120 - 8}px`)
  } finally {
    vi.restoreAllMocks()
  }
})

test('places left and right of the trigger', async () => {
  render(
    <Tooltip content="Beside" side="right">
      <button type="button">Side</button>
    </Tooltip>,
  )
  await userEvent.tab()
  expect(screen.getByRole('tooltip')).toHaveAttribute('data-side', 'right')
  expect(screen.getByRole('tooltip')).toHaveClass('pl-1.5')
})

test('leaves placement to CSS anchor positioning where the browser supports it', async () => {
  const supports = vi.spyOn(CSS, 'supports').mockReturnValue(true)
  try {
    render(
      <Tooltip content="Anchored" side="bottom">
        <button type="button">Anchor</button>
      </Tooltip>,
    )
    await userEvent.tab()
    const tip = screen.getByRole('tooltip')
    const name = screen.getByRole('button', { name: 'Anchor' }).parentElement!.style.anchorName
    expect(name).toMatch(/^--swell[\w-]+$/)
    expect(tip.style.getPropertyValue('position-anchor')).toBe(name)
    expect(tip.style.getPropertyValue('position-try-fallbacks')).toBe('--swell-tooltip-top')
    // The side can change without a render, so neither data-side nor side padding is set
    expect(tip).not.toHaveAttribute('data-side')
    expect(tip).not.toHaveClass('pt-1.5')
    expect(tip.firstElementChild).toHaveClass('mt-1.5')
  } finally {
    supports.mockRestore()
  }
})

test('keeps measuring inside the top layer, where a bubble outside it cannot anchor', async () => {
  const supports = vi.spyOn(CSS, 'supports').mockReturnValue(true)
  const closest = vi.spyOn(Element.prototype, 'closest').mockImplementation(function (
    this: Element,
    selectors: string,
  ) {
    return selectors === ':popover-open, dialog:modal' ? document.body : null
  })
  try {
    render(
      <Tooltip content="In a dialog" side="bottom">
        <button type="button">Nested</button>
      </Tooltip>,
    )
    await userEvent.tab()
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveAttribute('data-side', 'bottom')
    expect(tip).toHaveClass('pt-1.5')
    expect(tip.style.getPropertyValue('position-anchor')).toBe('')
    expect(screen.getByRole('button', { name: 'Nested' }).parentElement!.style.anchorName).toBe('')
  } finally {
    closest.mockRestore()
    supports.mockRestore()
  }
})
