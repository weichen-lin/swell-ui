import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vite-plus/test'
import { Meter } from './meter'

test('legend lists non-zero segments in order, named by the label', () => {
  const { container } = render(
    <Meter
      label="Health"
      summary="9 of 13 report health"
      segments={[
        { label: 'Healthy', value: 9, tone: 'success' },
        { label: 'Degraded', value: 0, tone: 'danger' },
        { label: 'No health', value: 4, tone: 'neutral' },
      ]}
    />,
  )
  const legend = screen.getByRole('list', { name: 'Health' })
  const items = within(legend).getAllByRole('listitem')
  expect(items.map((li) => li.textContent)).toEqual(['9Healthy', '4No health'])
  expect(screen.getByText('9 of 13 report health')).toBeInTheDocument()

  const bar = container.querySelector('[aria-hidden="true"]') as HTMLElement
  const segments = [...bar.children] as HTMLElement[]
  expect(segments.map((s) => s.style.flexGrow)).toEqual(['9', '4'])
  expect(segments[0]).toHaveClass('bg-success')
})

test('all-zero meter shows the empty track and no legend', () => {
  render(<Meter label="Sync" segments={[{ label: 'Synced', value: 0, tone: 'success' }]} />)
  expect(screen.queryByRole('list')).toBeNull()
})
