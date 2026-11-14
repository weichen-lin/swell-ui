import { render, screen } from '@testing-library/react'
import { Heart } from 'lucide-react'
import { createRef } from 'react'
import { expect, test } from 'vite-plus/test'
import { Badge, type BadgeTone } from './badge'

const tones: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger']

test('renders a plain span marked as a badge with neutral/subtle/md defaults', () => {
  render(<Badge>Healthy</Badge>)
  const badge = screen.getByText('Healthy').closest('[data-slot="badge"]') as HTMLElement
  expect(badge.tagName).toBe('SPAN')
  expect(badge).toHaveClass(
    'border-neutral-border',
    'bg-neutral-subtle-bg',
    'text-neutral-subtle-fg',
    'h-6',
    'px-2',
  )
})

test('sm is 20px tall and md is 24px tall, with the same border in every variant', () => {
  const { rerender } = render(<Badge size="sm">x</Badge>)
  const badge = () => document.querySelector('[data-slot="badge"]') as HTMLElement
  expect(badge()).toHaveClass('h-5', 'px-1.5', 'border')
  rerender(<Badge size="md">x</Badge>)
  expect(badge()).toHaveClass('h-6', 'px-2', 'border')
  for (const variant of ['subtle', 'outline', 'solid'] as const) {
    rerender(<Badge variant={variant}>x</Badge>)
    expect(badge()).toHaveClass('border', 'h-6')
  }
})

test.each(tones)('%s applies its own token classes for every variant', (tone) => {
  const { rerender } = render(<Badge tone={tone}>x</Badge>)
  const badge = () => document.querySelector('[data-slot="badge"]') as HTMLElement
  expect(badge()).toHaveClass(
    `border-${tone}-border`,
    `bg-${tone}-subtle-bg`,
    `text-${tone}-subtle-fg`,
  )

  rerender(
    <Badge tone={tone} variant="outline">
      x
    </Badge>,
  )
  expect(badge()).toHaveClass(`border-${tone}-border`, 'bg-transparent', `text-${tone}-subtle-fg`)

  rerender(
    <Badge tone={tone} variant="solid">
      x
    </Badge>,
  )
  expect(badge()).toHaveClass(`border-${tone}`, `bg-${tone}`, `text-${tone}-fg`)
  // No other tone's tokens leak in
  for (const other of tones.filter((t) => t !== tone)) {
    expect(badge().className).not.toContain(`-${other}`)
  }
})

test('icon color: tone main on subtle/outline, foreground on solid', () => {
  const { rerender } = render(<Badge tone="success" icon={<Heart />} />)
  const icon = () => document.querySelector('[data-slot="badge-icon"]') as HTMLElement
  expect(icon()).toHaveClass('text-success')
  rerender(<Badge tone="success" variant="solid" icon={<Heart />} />)
  expect(icon()).toHaveClass('text-success-fg')
})

test('icon is decorative and gets the tighter padding on its side', () => {
  render(<Badge icon={<Heart data-testid="heart" />}>Healthy</Badge>)
  const heart = screen.getByTestId('heart')
  expect(heart.closest('[data-slot="badge-icon"]')).toHaveAttribute('aria-hidden', 'true')
  expect(heart.closest('[data-slot="badge"]')).toHaveClass('ps-1.5')
})

test('no icon slot renders without icon or busy', () => {
  render(<Badge>Plain</Badge>)
  expect(document.querySelector('[data-slot="badge-icon"]')).toBeNull()
})

test('busy renders a spinning ring plus a static ring for reduced motion, and ignores icon', () => {
  render(
    <Badge busy icon={<Heart data-testid="heart" />}>
      Progressing
    </Badge>,
  )
  expect(screen.queryByTestId('heart')).toBeNull()
  const slot = document.querySelector('[data-slot="badge-icon"]') as HTMLElement
  expect(slot).toHaveAttribute('aria-hidden', 'true')
  const [spinner, fallback] = Array.from(slot.querySelectorAll('svg'))
  expect(spinner).toHaveClass('animate-spin', 'motion-reduce:hidden')
  expect(spinner).not.toHaveClass('hidden')
  expect(fallback).toHaveClass('hidden', 'motion-reduce:block')
  expect(fallback).not.toHaveClass('animate-spin')
})

test('context is a screen-reader-only prefix in the text content', () => {
  render(<Badge context="Health">Unknown</Badge>)
  const badge = document.querySelector('[data-slot="badge"]') as HTMLElement
  expect(badge).toHaveTextContent('Health: Unknown')
  expect(badge.textContent).toBe('Health: Unknown')
  expect(screen.getByText('Health:')).toHaveClass('sr-only')
})

test('no context prefix by default', () => {
  render(<Badge>Unknown</Badge>)
  expect(document.querySelector('.sr-only')).toBeNull()
})

test('is not interactive: no tabindex, no role, no onClick', () => {
  render(
    <Badge
      // @ts-expect-error badges are static; onClick is not part of the props
      onClick={() => {}}
    >
      Healthy
    </Badge>,
  )
  const badge = document.querySelector('[data-slot="badge"]') as HTMLElement
  expect(badge).not.toHaveAttribute('tabindex')
  expect(badge).not.toHaveAttribute('role')
})

test('forwards native props and merges className without losing base classes', () => {
  const ref = createRef<HTMLSpanElement>()
  render(
    <Badge ref={ref} id="b1" title="Full value" data-env="prod" className="max-w-20 uppercase">
      prod
    </Badge>,
  )
  const badge = document.querySelector('[data-slot="badge"]') as HTMLElement
  expect(badge).toHaveAttribute('id', 'b1')
  expect(badge).toHaveAttribute('title', 'Full value')
  expect(badge).toHaveAttribute('data-env', 'prod')
  expect(badge).toHaveClass('max-w-20', 'uppercase', 'inline-flex', 'rounded-md')
  expect(ref.current).toBe(badge)
})

test('long text is not truncated by default; a max-w className clips the label only', () => {
  const { rerender } = render(<Badge icon={<Heart />}>v1.4.2-rc.1-very-long</Badge>)
  const root = () => document.querySelector('[data-slot="badge"]') as HTMLElement
  const label = () => document.querySelector('[data-slot="badge-label"]') as HTMLElement
  expect(root()).toHaveClass('whitespace-nowrap')
  expect(root()).not.toHaveClass('overflow-hidden')
  expect(label()).toHaveTextContent('v1.4.2-rc.1-very-long')

  rerender(
    <Badge icon={<Heart />} className="max-w-24">
      v1.4.2-rc.1-very-long
    </Badge>,
  )
  expect(root()).toHaveClass('max-w-24')
  // The label (not the icon) is the clipped, shrinkable part
  expect(label()).toHaveClass('truncate', 'min-w-0')
  expect(document.querySelector('[data-slot="badge-icon"]')).toHaveClass('shrink-0')
})
