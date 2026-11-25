import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId } from 'react'
import {
  RadioGroup,
  RadioIndicator,
  RadioTile,
  RadioGroupLabel,
  RadioGroupItems,
} from '../src/components/radio-group'

const meta = {
  title: 'UI/RadioTile',
  component: RadioTile,
  subcomponents: { RadioIndicator },
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: { include: ['ripple', 'disabled'] },
    docs: {
      description: {
        component:
          'Place RadioTile inside RadioGroup, then compose its non-interactive content and optional RadioIndicator. The tile is the label for its native radio. Style the tile and indicator directly with className and use data-checked for selected styles.',
      },
    },
  },
  args: { value: 'tile', children: null, ripple: true, disabled: false },
} satisfies Meta<typeof RadioTile>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: function Render({ disabled, ripple }) {
    const name = useId()
    return (
      <RadioGroup name={name} defaultValue="portrait" disabled={disabled}>
        <RadioGroupLabel>Page orientation</RadioGroupLabel>
        <RadioGroupItems className="grid max-w-sm grid-cols-2 gap-3">
          <RadioTile value="portrait" ripple={ripple}>
            <span aria-hidden className="h-8 w-6 rounded-sm border border-current" />
            Portrait
            <RadioIndicator />
          </RadioTile>
          <RadioTile value="landscape" ripple={ripple}>
            <span aria-hidden className="mt-2 h-6 w-8 rounded-sm border border-current" />
            Landscape
            <RadioIndicator />
          </RadioTile>
        </RadioGroupItems>
      </RadioGroup>
    )
  },
}
