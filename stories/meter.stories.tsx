import type { Meta, StoryObj } from '@storybook/react-vite'
import { Meter } from '../src/components/meter'

const meta = {
  title: 'UI/Meter',
  component: Meter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Stacked proportion bar with a legend, for counts that add up to a whole (resource',
          'health, sync state). Zero values are dropped. The bar is decorative; the legend carries',
          'the numbers, so nothing relies on color alone.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Health',
    summary: '9 of 13 report health',
    segments: [
      { label: 'Healthy', value: 9, tone: 'success' },
      { label: 'No health', value: 4, tone: 'neutral' },
    ],
  },
} satisfies Meta<typeof Meter>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Mixed: Story = {
  args: {
    summary: '12 of 13 report health',
    segments: [
      { label: 'Healthy', value: 8, tone: 'success' },
      { label: 'Progressing', value: 2, tone: 'info' },
      { label: 'Missing', value: 1, tone: 'warning' },
      { label: 'Degraded', value: 1, tone: 'danger' },
      { label: 'No health', value: 1, tone: 'neutral' },
    ],
  },
}

export const Single: Story = {
  args: {
    label: 'Sync',
    summary: 'Compared with main',
    segments: [{ label: 'Synced', value: 13, tone: 'success' }],
  },
}

/** One small segment still shows: segments have a 4px minimum. */
export const Sliver: Story = {
  args: {
    label: 'Sync',
    summary: 'Compared with main',
    segments: [
      { label: 'Synced', value: 199, tone: 'success' },
      { label: 'Out of sync', value: 1, tone: 'warning' },
    ],
  },
}

export const Empty: Story = {
  args: { label: 'Sync', summary: 'No resources yet', segments: [] },
}
