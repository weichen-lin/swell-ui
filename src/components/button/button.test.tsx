import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GitBranch, Trash2 } from 'lucide-react'
import { createRef } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test'
import { FakeLink, FakeOutlet, FakeRouter } from '../../test/fake-router'
import { Button } from './button'

const proto = Element.prototype as { animate?: unknown }
const originalAnimate = proto.animate

beforeEach(() => {
  proto.animate = vi.fn(() => ({ finished: Promise.resolve() }))
})
afterEach(() => {
  proto.animate = originalAnimate
})

const press = (el: Element) =>
  fireEvent.pointerDown(el, { button: 0, isPrimary: true, clientX: 5, clientY: 5 })

test('renders default primary/md variant', () => {
  render(<Button>Deploy</Button>)
  const btn = screen.getByRole('button', { name: 'Deploy' })
  expect(btn).toHaveClass('bg-primary', 'h-control-md')
})

test('applies intent and size variants', () => {
  render(
    <Button intent="secondary" size="lg">
      Sync
    </Button>,
  )
  expect(screen.getByRole('button', { name: 'Sync' })).toHaveClass(
    'bg-surface-muted',
    'h-control-lg',
  )
})

test('caller className overrides via tailwind-merge', () => {
  render(<Button className="px-8">Go</Button>)
  const btn = screen.getByRole('button', { name: 'Go' })
  expect(btn).toHaveClass('px-8')
  expect(btn).not.toHaveClass('ps-(--btn-ps)', 'pe-(--btn-pe)')
})

test('fires onClick', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Click</Button>)
  await userEvent.click(screen.getByRole('button', { name: 'Click' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})

test.each([
  ['disabled', { disabled: true }],
  ['loading', { loading: true }],
])('%s stays focusable via aria-disabled and blocks click, keys and submit', async (_, state) => {
  const onClick = vi.fn()
  const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <input aria-label="Name" />
      <Button type="submit" onClick={onClick} {...state}>
        Save
      </Button>
    </form>,
  )
  const btn = screen.getByRole('button', { name: 'Save' })
  expect(btn).not.toBeDisabled()
  expect(btn).toHaveAttribute('aria-disabled', 'true')
  expect(btn).not.toHaveClass('pointer-events-none')

  await userEvent.tab()
  await userEvent.tab()
  expect(btn).toHaveFocus()

  await userEvent.click(btn)
  await userEvent.keyboard('{Enter}')
  await userEvent.keyboard(' ')
  // Implicit submission (Enter in a text field) goes through the default button's click
  await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), '{Enter}')
  expect(onClick).not.toHaveBeenCalled()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('enabled submit button submits the form', async () => {
  const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault())
  render(
    <form onSubmit={onSubmit}>
      <Button type="submit">Save</Button>
    </form>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(onSubmit).toHaveBeenCalledTimes(1)
})

test('disabled and loading cursors/opacity', () => {
  const { rerender } = render(<Button disabled>Go</Button>)
  const btn = screen.getByRole('button', { name: 'Go' })
  expect(btn).toHaveClass('opacity-50', 'cursor-not-allowed')
  rerender(<Button loading>Go</Button>)
  expect(btn).toHaveClass('opacity-70', 'cursor-progress')
  expect(btn).not.toHaveClass('cursor-not-allowed')
})

test('loading sets aria-busy and announces through a sibling live region', () => {
  const { rerender, container } = render(<Button loadingText="Deploying">Deploy</Button>)
  const btn = screen.getByRole('button', { name: 'Deploy' })
  const live = container.querySelector('[aria-live="polite"]')
  // Present before loading so the later change is announced
  expect(live).toBeInTheDocument()
  expect(live).toHaveTextContent('')
  expect(btn.contains(live)).toBe(false)

  rerender(
    <Button loading loadingText="Deploying">
      Deploy
    </Button>,
  )
  expect(live).toHaveTextContent('Deploying')
  expect(btn).toHaveAttribute('aria-busy', 'true')
  expect(btn).toHaveAccessibleName('Deploy')

  rerender(<Button loadingText="Deploying">Deploy</Button>)
  expect(live).toHaveTextContent('')
  expect(btn).not.toHaveAttribute('aria-busy')
})

test('loadingText defaults to "Loading"', () => {
  const { container } = render(<Button loading>Save</Button>)
  expect(container.querySelector('[aria-live]')).toHaveTextContent('Loading')
})

test('spinner size follows button size', () => {
  const { rerender, container } = render(<Button loading>Go</Button>)
  expect(container.querySelector('svg')).toHaveAttribute('width', '18')
  rerender(
    <Button loading size="lg">
      Go
    </Button>,
  )
  expect(container.querySelector('svg')).toHaveAttribute('width', '20')
})

test('no spinner or aria-busy when not loading', () => {
  const { container } = render(<Button>Idle</Button>)
  expect(container.querySelector('svg')).toBeNull()
  expect(screen.getByRole('button', { name: 'Idle' })).not.toHaveAttribute('aria-busy')
})

test('disabledReason shows a tooltip on keyboard focus, linked by aria-describedby', async () => {
  render(
    <Button disabled disabledReason="You need deploy access">
      Deploy
    </Button>,
  )
  const btn = screen.getByRole('button', { name: 'Deploy' })
  expect(screen.queryByRole('tooltip')).toBeNull()
  expect(btn).toHaveAccessibleDescription('You need deploy access')

  await userEvent.tab()
  expect(btn).toHaveFocus()
  const tip = screen.getByRole('tooltip')
  expect(tip).toHaveTextContent('You need deploy access')
  expect(btn.getAttribute('aria-describedby')).toContain(tip.id)

  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('tooltip')).toBeNull()
})

test('disabledReason is ignored while enabled, without remounting the button', () => {
  const { rerender } = render(<Button disabledReason="No access">Deploy</Button>)
  const btn = screen.getByRole('button', { name: 'Deploy' })
  expect(btn).not.toHaveAttribute('aria-describedby')
  rerender(
    <Button disabled disabledReason="No access">
      Deploy
    </Button>,
  )
  expect(screen.getByRole('button', { name: 'Deploy' })).toBe(btn)
  expect(btn).toHaveAccessibleDescription('No access')
})

test('icons render in aria-hidden slots and trim padding on their side', () => {
  render(
    <Button iconLeft={<GitBranch data-testid="left" />} iconRight={<Trash2 data-testid="right" />}>
      Branch
    </Button>,
  )
  const btn = screen.getByRole('button', { name: 'Branch' })
  expect(screen.getByTestId('left').closest('[aria-hidden="true"]')).not.toBeNull()
  expect(screen.getByTestId('right').closest('[aria-hidden="true"]')).not.toBeNull()
  expect(btn).toHaveClass('[--btn-ps:--spacing(2.75)]', '[--btn-pe:--spacing(2.75)]')
})

test('tone="danger" applies the compound classes', () => {
  render(
    <>
      <Button tone="danger">Delete</Button>
      <Button intent="secondary" tone="danger">
        Remove
      </Button>
      <Button intent="dark" tone="danger">
        Rollback
      </Button>
    </>,
  )
  const primary = screen.getByRole('button', { name: 'Delete' })
  expect(primary).toHaveClass('bg-danger', 'text-danger-fg')
  expect(primary).not.toHaveClass('bg-primary')
  const dark = screen.getByRole('button', { name: 'Rollback' })
  expect(dark).toHaveClass('bg-danger', 'text-danger-fg')
  expect(dark).not.toHaveClass('bg-inverse', 'text-inverse-fg')
  expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass(
    'text-danger',
    'bg-surface-muted',
  )
})

test('ghost intent and fullWidth', () => {
  render(
    <>
      <Button intent="ghost">Ghost</Button>
      <Button fullWidth>Wide</Button>
    </>,
  )
  expect(screen.getByRole('button', { name: 'Ghost' })).toHaveClass('bg-transparent')
  expect(screen.getByRole('button', { name: 'Wide' })).toHaveClass('w-full')
})

test('data-pressed is set on pointerdown and cleared on pointercancel', () => {
  render(<Button>Press</Button>)
  const btn = screen.getByRole('button', { name: 'Press' })
  press(btn)
  expect(btn).toHaveAttribute('data-pressed')
  fireEvent.pointerCancel(btn)
  expect(btn).not.toHaveAttribute('data-pressed')
})

test('pressed looks sunken: inset shadow and fill, never a scale', () => {
  render(<Button intent="ghost">Press</Button>)
  const btn = screen.getByRole('button', { name: 'Press' })
  expect(btn).toHaveClass(
    'data-pressed:[--btn-shadow:var(--shadow-pressed),0_0_0_0_transparent]',
    'data-pressed:not-aria-disabled:bg-surface-inset',
  )
  expect(btn.className).not.toMatch(/scale/)
})

test('filled intents rest raised and lift on hover; ghost and inert buttons stay flat', () => {
  render(
    <>
      <Button intent="secondary">Filled</Button>
      <Button intent="ghost">Ghost</Button>
    </>,
  )
  const filled = screen.getByRole('button', { name: 'Filled' })
  expect(filled).toHaveClass(
    'not-aria-disabled:not-data-pressed:[--btn-shadow:var(--shadow-raised),var(--shadow-lift)]',
    'hover:not-aria-disabled:not-data-pressed:-translate-y-(--lift)',
  )
  // Lift is a transform: no margin, inset or size change
  expect(filled.className).not.toMatch(/(^|:)-?(m[tby]?|top|bottom|h)-\(--lift\)/)
  const ghost = screen.getByRole('button', { name: 'Ghost' })
  expect(ghost.className).not.toMatch(/shadow-raised|--lift/)
})

test('raised intents scale their hover fill by --hover-strength; ghost and danger fills keep the full change', () => {
  render(
    <>
      <Button intent="primary">Primary</Button>
      <Button intent="dark">Dark</Button>
      <Button intent="dark" tone="danger">
        Dark danger
      </Button>
      <Button intent="secondary">Secondary</Button>
      <Button intent="surface">Surface</Button>
      <Button intent="secondary" tone="danger">
        Secondary danger
      </Button>
      <Button intent="ghost">Ghost</Button>
    </>,
  )
  const get = (name: string) => screen.getByRole('button', { name })
  const fade = 'hover:not-aria-disabled:opacity-[calc(1-0.1*var(--hover-strength))]'
  expect(get('Primary')).toHaveClass(fade)
  // Dark can't fade (its fill is the page color in dark mode): it mixes toward --color-inverse-hover
  const darkHover =
    'hover:not-aria-disabled:bg-[color-mix(in_oklab,var(--color-inverse-hover)_calc(var(--hover-strength)*100%),var(--color-inverse))]'
  expect(get('Dark')).toHaveClass(darkHover)
  expect(get('Dark').className).not.toMatch(/opacity-\[calc/)
  // Dark danger keeps the old fade and its own fill: the inverse hover fill must not leak
  expect(get('Dark danger')).toHaveClass(fade, 'hover:not-aria-disabled:bg-danger')
  expect(get('Dark danger').className).not.toContain('--color-inverse-hover')
  expect(get('Secondary')).toHaveClass(
    'hover:not-aria-disabled:bg-[color-mix(in_oklab,var(--color-ring)_calc(var(--hover-strength)*100%),var(--color-surface-muted))]',
  )
  expect(get('Surface')).toHaveClass(
    'hover:not-aria-disabled:bg-[color-mix(in_oklab,var(--color-surface-muted)_calc(var(--hover-strength)*100%),var(--color-surface-raised))]',
  )
  // Solid danger on hover is a semantic switch, not a tint: not scaled
  expect(get('Secondary danger')).toHaveClass('hover:not-aria-disabled:bg-danger')
  expect(get('Secondary danger').className).not.toMatch(/hover-strength/)
  expect(get('Ghost')).toHaveClass('hover:not-aria-disabled:bg-surface-muted')
  expect(get('Ghost').className).not.toMatch(/hover-strength/)
})

test('pressed ends the hover fade so its fill shows at full strength', () => {
  render(
    <>
      <Button intent="primary">Primary</Button>
      <Button intent="dark" tone="danger">
        Dark danger
      </Button>
    </>,
  )
  for (const name of ['Primary', 'Dark danger'])
    expect(screen.getByRole('button', { name })).toHaveClass(
      'hover:not-aria-disabled:opacity-[calc(1-0.1*var(--hover-strength))]',
      'data-pressed:not-aria-disabled:opacity-100',
    )
})

test('keyboard press sets data-pressed until keyup, ignoring auto-repeat ripples', () => {
  render(<Button>Press</Button>)
  const btn = screen.getByRole('button', { name: 'Press' })
  fireEvent.keyDown(btn, { key: 'Enter' })
  fireEvent.keyDown(btn, { key: 'Enter', repeat: true })
  expect(btn).toHaveAttribute('data-pressed')
  expect(btn.querySelector('[data-ripple]')?.childElementCount).toBe(1)
  fireEvent.keyUp(btn, { key: 'Enter' })
  expect(btn).not.toHaveAttribute('data-pressed')
})

test('ripple spawns on press and can be turned off', () => {
  const { rerender } = render(<Button>Press</Button>)
  const btn = screen.getByRole('button', { name: 'Press' })
  press(btn)
  expect(btn.querySelector('[data-ripple]')?.childElementCount).toBe(1)

  rerender(<Button ripple={false}>Press</Button>)
  expect(btn.querySelector('[data-ripple]')).toBeNull()
  // Press feedback still works without the ripple
  press(btn)
  expect(btn).toHaveAttribute('data-pressed')
})

test.each([
  ['disabled', { disabled: true }],
  ['loading', { loading: true }],
])('no press feedback when %s', (_, state) => {
  render(<Button {...state}>Press</Button>)
  const btn = screen.getByRole('button', { name: 'Press' })
  press(btn)
  fireEvent.keyDown(btn, { key: ' ' })
  expect(btn).not.toHaveAttribute('data-pressed')
  expect(btn.querySelector('[data-ripple]')?.childElementCount).toBe(0)
})

test('icon-only Button is square, named, and shows its label as a tooltip', async () => {
  vi.useFakeTimers()
  try {
    render(<Button icon={<GitBranch />} aria-label="Sync now" size="sm" />)
    const btn = screen.getByRole('button', { name: 'Sync now' })
    expect(btn).toHaveClass('h-control-sm', 'aspect-square')
    expect(btn).not.toHaveClass('px-2.75')
    // The label tooltip would only repeat the name, so it is not a description
    expect(btn).not.toHaveAttribute('aria-describedby')

    fireEvent.pointerEnter(btn.parentElement as Element)
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeVisible()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByRole('tooltip', { hidden: true })).toBeVisible()
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Sync now')
    fireEvent.pointerLeave(btn.parentElement as Element)
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeVisible()
  } finally {
    vi.useRealTimers()
  }
})

test('icon-only Button supports loading/disabled with reason and tooltip opt-out', () => {
  const { rerender } = render(
    <Button
      icon={<Trash2 />}
      aria-label="Delete"
      disabled
      disabledReason="Protected environment"
    />,
  )
  const btn = screen.getByRole('button', { name: 'Delete' })
  expect(btn).toHaveAttribute('aria-disabled', 'true')
  expect(btn).toHaveAccessibleDescription('Protected environment')

  rerender(<Button icon={<Trash2 />} aria-label="Delete" loading />)
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('aria-busy', 'true')

  rerender(<Button icon={<Trash2 />} aria-label="Delete" tooltip={false} />)
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull()
})

// Type-level API rules: each line must fail to compile, or the directive itself errors
test('icon-only Button requires aria-label and rejects text-button slots', () => {
  // @ts-expect-error aria-label is required with icon
  render(<Button icon={<Trash2 />} />)
  render(
    // @ts-expect-error icon-only buttons take no children
    <Button icon={<Trash2 />} aria-label="Delete">
      Delete
    </Button>,
  )
  // @ts-expect-error icon-only buttons take no iconLeft
  render(<Button icon={<Trash2 />} aria-label="Delete" iconLeft={<GitBranch />} />)
  // @ts-expect-error icon-only buttons take no iconRight
  render(<Button icon={<Trash2 />} aria-label="Delete" iconRight={<GitBranch />} />)
})

test('text Button rejects icon-only tooltip props', () => {
  // @ts-expect-error tooltip is icon-only
  render(<Button tooltip={false}>Save</Button>)
  // @ts-expect-error tooltipSide is icon-only
  render(<Button tooltipSide="bottom">Save</Button>)
})

const pages = { '/': 'Home', '/apps/new': 'New app page' }

test('asChild renders the link styled as a button, with props, classes and ref merged in', () => {
  const ref = createRef<HTMLElement>()
  render(
    <FakeRouter initialPath="/">
      <Button
        asChild
        ref={ref as never}
        intent="secondary"
        className="extra"
        title="Create"
        iconLeft={<GitBranch data-testid="icon" />}
      >
        <FakeLink to="/apps/new" className="own">
          New app
        </FakeLink>
      </Button>
    </FakeRouter>,
  )
  expect(screen.queryByRole('button')).toBeNull()
  const link = screen.getByRole('link', { name: 'New app' })
  expect(ref.current).toBe(link)
  expect(link).toHaveAttribute('href', '/apps/new')
  expect(link).toHaveAttribute('data-slot', 'button')
  expect(link).toHaveAttribute('title', 'Create')
  expect(link).not.toHaveAttribute('type')
  expect(link).not.toHaveAttribute('aria-disabled')
  expect(link).toHaveClass('bg-surface-muted', 'h-control-md', 'extra', 'own')
  expect(link).toHaveClass('[--btn-ps:--spacing(2.75)]')
  // Ripple layer and icon live inside the link, not around it
  expect(link.querySelector('[data-ripple]')).not.toBeNull()
  expect(link).toContainElement(screen.getByTestId('icon'))
})

test('asChild link navigates through the router and runs both click handlers', async () => {
  const user = userEvent.setup()
  const onButtonClick = vi.fn()
  const onLinkClick = vi.fn()
  render(
    <FakeRouter initialPath="/">
      <Button asChild onClick={onButtonClick}>
        <FakeLink to="/apps/new" onClick={onLinkClick}>
          New app
        </FakeLink>
      </Button>
      <FakeOutlet pages={pages} />
    </FakeRouter>,
  )
  await user.click(screen.getByRole('link', { name: 'New app' }))
  expect(onLinkClick).toHaveBeenCalledOnce()
  expect(onButtonClick).toHaveBeenCalledOnce()
  expect(screen.getByText('New app page')).toBeInTheDocument()
})

test('disabled asChild link stays focusable but does not navigate or call handlers', async () => {
  const user = userEvent.setup()
  const onButtonClick = vi.fn()
  const onLinkClick = vi.fn()
  const onNavigate = vi.fn()
  render(
    <FakeRouter initialPath="/" onNavigate={onNavigate}>
      <Button asChild disabled onClick={onButtonClick}>
        <FakeLink to="/apps/new" onClick={onLinkClick}>
          New app
        </FakeLink>
      </Button>
      <FakeOutlet pages={pages} />
    </FakeRouter>,
  )
  const link = screen.getByRole('link', { name: 'New app' })
  expect(link).toHaveAttribute('aria-disabled', 'true')
  expect(link).toHaveClass('cursor-not-allowed', 'opacity-50')

  await user.click(link)
  expect(link).toHaveFocus()
  await user.keyboard('{Enter}')
  // A bare <a> would follow its href on click; the capture handler cancels that too
  expect(fireEvent.click(link)).toBe(false)
  expect(
    fireEvent(link, new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })),
  ).toBe(false)

  expect(onLinkClick).not.toHaveBeenCalled()
  expect(onButtonClick).not.toHaveBeenCalled()
  expect(onNavigate).not.toHaveBeenCalled()
  expect(screen.getByText('Home')).toBeInTheDocument()
})

test('disabledReason on an asChild link describes it with a tooltip', async () => {
  const user = userEvent.setup()
  render(
    <FakeRouter initialPath="/">
      <Button asChild disabled disabledReason="You need admin access">
        <FakeLink to="/apps/new">New app</FakeLink>
      </Button>
    </FakeRouter>,
  )
  const link = screen.getByRole('link', { name: 'New app' })
  await user.tab()
  expect(link).toHaveFocus()
  const tip = await screen.findByRole('tooltip')
  expect(tip).toHaveTextContent('You need admin access')
  expect(link.getAttribute('aria-describedby')).toContain(tip.id)
})

test('icon-only asChild puts the icon inside the link, named by aria-label', () => {
  render(
    <FakeRouter initialPath="/">
      <Button asChild icon={<Trash2 data-testid="icon" />} aria-label="Delete app" tooltip={false}>
        <FakeLink to="/apps/1/delete" />
      </Button>
    </FakeRouter>,
  )
  const link = screen.getByRole('link', { name: 'Delete app' })
  expect(link).toHaveClass('aspect-square')
  expect(link).toContainElement(screen.getByTestId('icon'))
})

const hangStart = '-ms-[(var(--btn-ps)+1px)]'
const hangEnd = '-me-[(var(--btn-pe)+1px)]'
const sizes = ['sm', 'md', 'lg'] as const
const basePadding = { sm: 2.75, md: 3.75, lg: 4.75 } as const
const iconPadding = { sm: 1.75, md: 2.75, lg: 3.75 } as const
const pad = (side: 'ps' | 'pe', n: number) =>
  `[--${side === 'ps' ? 'btn-ps' : 'btn-pe'}:--spacing(${n})]`

test('no hang by default', () => {
  render(<Button>Plain</Button>)
  const btn = screen.getByRole('button', { name: 'Plain' })
  expect(btn).not.toHaveClass(hangStart)
  expect(btn).not.toHaveClass(hangEnd)
})

test.each(sizes)('hang pulls out by the same variable the padding reads (%s)', (size) => {
  const { rerender } = render(
    <Button size={size} hang="start">
      Edit
    </Button>,
  )
  const btn = screen.getByRole('button', { name: 'Edit' })
  expect(btn).toHaveClass(hangStart, 'ps-(--btn-ps)', `[--btn-p:--spacing(${basePadding[size]})]`)
  expect(btn).not.toHaveClass(hangEnd)

  rerender(
    <Button size={size} hang="end">
      Edit
    </Button>,
  )
  expect(btn).toHaveClass(hangEnd)
  expect(btn).not.toHaveClass(hangStart)

  rerender(
    <Button size={size} hang="both">
      Edit
    </Button>,
  )
  expect(btn).toHaveClass(hangStart, hangEnd)
})

test.each(sizes)('hang follows the trimmed padding on an icon side (%s)', (size) => {
  render(
    <Button size={size} hang="both" iconLeft={<GitBranch />} iconRight={<Trash2 />}>
      Edit
    </Button>,
  )
  const btn = screen.getByRole('button', { name: 'Edit' })
  expect(btn).toHaveClass(
    pad('ps', iconPadding[size]),
    pad('pe', iconPadding[size]),
    hangStart,
    hangEnd,
  )
})

test('hang on one side keeps the full padding on the other side next to an icon', () => {
  render(
    <Button size="md" hang="start" iconLeft={<GitBranch />}>
      Edit
    </Button>,
  )
  const btn = screen.getByRole('button', { name: 'Edit' })
  expect(btn).toHaveClass(pad('ps', iconPadding.md), hangStart)
  expect(btn).not.toHaveClass(pad('pe', iconPadding.md))
})

test.each(sizes)('hang works on the icon-only Button (%s)', (size) => {
  render(<Button size={size} hang="start" icon={<GitBranch />} aria-label="Edit" tooltip={false} />)
  const btn = screen.getByRole('button', { name: 'Edit' })
  expect(btn).toHaveClass('aspect-square', hangStart, 'ps-(--btn-ps)')
  expect(btn.className).toMatch(
    new RegExp(`\\[--btn-p:calc\\(\\(var\\(--spacing-control-${size}\\)`),
  )
})

test('hang works with asChild', () => {
  render(
    <Button asChild hang="end" intent="ghost">
      <a href="/x">Open</a>
    </Button>,
  )
  expect(screen.getByRole('link', { name: 'Open' })).toHaveClass(hangEnd)
})
