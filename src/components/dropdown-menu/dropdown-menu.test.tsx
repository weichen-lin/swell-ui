import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { Button } from '../button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'showPopover', {
    configurable: true,
    value(this: HTMLElement) {
      this.style.display = 'block'
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
    configurable: true,
    value(this: HTMLElement) {
      this.style.display = 'none'
    },
  })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover')
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover')
})
function Example({
  onSelect = vi.fn(),
  onLink = vi.fn(),
}: {
  onSelect?: (event: Event) => void
  onLink?: () => void
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Copy</DropdownMenuItem>
          <DropdownMenuItem asChild disabled>
            <a href="#disabled" onClick={onLink}>
              Delete
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button>Outside</button>
    </>
  )
}
describe('DropdownMenu', () => {
  it('opens from the keyboard, visits disabled items, searches and restores focus on Escape', async () => {
    const user = userEvent.setup()
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    trigger.focus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus()
    await user.keyboard('{Home}{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
    await user.keyboard('r')
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
  it('activates once with the keyboard and closes', async () => {
    const user = userEvent.setup()
    const select = vi.fn()
    render(<Example onSelect={select} />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.keyboard('{Enter}')
    expect(select).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('blocks child link handlers and navigation for disabled items', async () => {
    const user = userEvent.setup()
    const link = vi.fn()
    render(<Example onLink={link} />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const disabled = screen.getByRole('menuitem', { name: 'Delete' })
    expect(fireEvent.click(disabled)).toBe(false)
    expect(link).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })
  it('allows selection to cancel closing and leaves outside focus alone', async () => {
    const user = userEvent.setup()
    render(<Example onSelect={(event: Event) => event.preventDefault()} />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus()
  })
  it('closes router links even when they handle navigation with preventDefault', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <a href="#destination" onClick={(event) => event.preventDefault()}>
              Destination
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('menuitem'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

it('blocks a disabled Trigger composed with Button', async () => {
  const user = userEvent.setup()
  const action = vi.fn()
  render(
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled>
        <Button onClick={action}>Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Copy</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  )
  const trigger = screen.getByRole('button', { name: 'Actions' })
  await user.click(trigger)
  trigger.focus()
  await user.keyboard('{ArrowDown}{Enter}')
  expect(trigger).toHaveAttribute('aria-disabled', 'true')
  expect(action).not.toHaveBeenCalled()
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
it('leaves focus on a new surface opened by a selection', async () => {
  const user = userEvent.setup()
  render(<Example onSelect={() => screen.getByRole('button', { name: 'Outside' }).focus()} />)
  await user.click(screen.getByRole('button', { name: 'Actions' }))
  await user.keyboard('{Enter}')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus()
})
it('leaves placement to CSS anchor positioning where the browser supports it', async () => {
  const user = userEvent.setup()
  const supports = vi.spyOn(CSS, 'supports').mockReturnValue(true)
  try {
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await user.click(trigger)
    const menu = screen.getByRole('menu')
    const name = trigger.style.getPropertyValue('anchor-name')
    expect(name).toMatch(/^--swell[\w-]+-trigger$/)
    expect(menu.style.getPropertyValue('position-anchor')).toBe(name)
    expect(menu.style.getPropertyValue('--swell-anchor-gap')).toBe('6px')
    // Nothing measured: no script-set side, offsets or size caps
    expect(menu).not.toHaveAttribute('data-side')
    expect(menu.style.maxHeight).toBe('')
    expect(menu.style.left).toBe('')
    await user.keyboard('{Escape}')
    expect(trigger.style.getPropertyValue('anchor-name')).toBe('')
  } finally {
    supports.mockRestore()
  }
})
