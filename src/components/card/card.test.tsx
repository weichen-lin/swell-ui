import { render, screen } from '@testing-library/react'
import { expect, test } from 'vite-plus/test'
import { Card, CardContent, CardHeader } from './card'

test('a section card is named by its header title', () => {
  render(
    <Card as="section">
      <CardHeader title="Sync policy" description="How the app keeps the cluster matching Git." />
      <CardContent>Body</CardContent>
    </Card>,
  )
  const region = screen.getByRole('region', { name: 'Sync policy' })
  expect(region.tagName).toBe('SECTION')
  expect(screen.getByRole('heading', { level: 2, name: 'Sync policy' })).toBeInTheDocument()
  expect(region).toHaveTextContent('How the app keeps the cluster matching Git.')
})

test('no dangling aria-labelledby without a header, and plain divs are never labelled', () => {
  const { rerender, container } = render(
    <Card as="section">
      <CardContent>Body</CardContent>
    </Card>,
  )
  expect(container.firstElementChild).not.toHaveAttribute('aria-labelledby')

  rerender(
    <Card>
      <CardHeader title="Resources" headingLevel={3} action={<a href="#all">View all</a>} />
    </Card>,
  )
  expect(container.firstElementChild).not.toHaveAttribute('aria-labelledby')
  expect(screen.getByRole('heading', { level: 3, name: 'Resources' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'View all' })).toBeInTheDocument()
})

test('an explicit aria-label wins over the header title', () => {
  render(
    <Card as="section" aria-label="Custom">
      <CardHeader title="Title" />
    </Card>,
  )
  expect(screen.getByRole('region', { name: 'Custom' })).toBeInTheDocument()
})
