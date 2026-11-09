import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Zap } from 'lucide-react'
import { Badge } from '../src/components/badge'
import { Card, CardContent, CardHeader } from '../src/components/card'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Bordered surface for related content. Card has no padding; CardHeader and CardContent',
          'add it, so lists and tables can run edge to edge. With `as="section"` the card is a',
          'region named by its CardHeader title.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-bg p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Card as="section">
      <CardHeader title="Resources" description="Managed in shop-prod" />
      <CardContent className="text-sm text-fg-muted">Any content goes here.</CardContent>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card as="section">
      <CardHeader
        title="Resources"
        action={
          <a
            href="#resources"
            className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg"
          >
            View all
            <ArrowRight aria-hidden className="size-3.5" />
          </a>
        }
      />
      <CardContent>
        <span className="font-serif text-5xl/12 font-medium">13</span>
      </CardContent>
    </Card>
  ),
}

/** Rows separated by hairlines, edge to edge: CardContent without padding. */
export const FullBleedList: Story = {
  render: () => (
    <Card as="section">
      <CardHeader title="Sync policy" description="How the app keeps the cluster matching Git." />
      <CardContent className="p-0 [[data-slot=card-header]+&]:pt-3">
        <ul className="divide-y divide-border">
          {['Automatic deployment', 'Self-heal', 'Prune'].map((name, i) => (
            <li key={name} className="flex items-center gap-4 px-5 py-4">
              <Zap aria-hidden className="size-4 text-fg-muted" />
              <span className="flex-1 text-sm font-medium">{name}</span>
              <Badge tone={i < 2 ? 'success' : 'neutral'}>{i < 2 ? 'On' : 'Off'}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  ),
}

export const ContentOnly: Story = {
  render: () => (
    <Card>
      <CardContent className="text-sm">A card without a header.</CardContent>
    </Card>
  ),
}
