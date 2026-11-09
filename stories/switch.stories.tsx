import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'
import { Switch, type SwitchProps } from '../src/components/switch'

const sizes = ['sm', 'md'] as const

// Stories use the visible-label form: Storybook's arg inference collapses the label/aria-label union
type StoryArgs = Extract<SwitchProps, { label: ReactNode }>

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'A single on/off setting that takes effect immediately (use Checkbox when a Save or',
          'Sync button applies it). Native `<input type="checkbox" role="switch">`: `checked` /',
          '`defaultChecked` / native `onChange`, form submit, `required` and `form.reset()` all',
          'work as for a checkbox. The whole row is the label. `loading` keeps focus but swallows',
          'toggles while a change is saved.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-lg bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Auto-sync',
    size: 'md',
    labelPosition: 'end',
    disabled: false,
    loading: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'radio', options: sizes },
    labelPosition: { control: 'radio', options: ['end', 'start'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    className: { control: 'text' },
    inputClassName: { control: 'text' },
  },
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<Meta<StoryArgs>>

export const Playground: Story = {
  args: { description: 'Applies new commits to the cluster as they land' },
}

/** sm (28x14) for tables and dense rows, md (36x20) for settings. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {sizes.map((size) => (
        <div key={size} className="flex gap-6">
          <Switch {...args} size={size} label={`${size} off`} />
          <Switch {...args} size={size} label={`${size} on`} defaultChecked />
        </div>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Switch {...args} label="Off" />
      <Switch {...args} label="On" defaultChecked />
      <Switch {...args} label="Disabled off" disabled />
      <Switch {...args} label="Disabled on" disabled defaultChecked />
      <Switch {...args} label="Loading off" loading />
      <Switch {...args} label="Loading on" loading defaultChecked />
      <Switch
        {...args}
        label="Self-heal"
        error="Turn on Auto-sync first"
        description="Reverts manual changes in the cluster"
      />
    </div>
  ),
}

type Setting = { key: 'autoSync' | 'selfHeal' | 'prune'; label: string; description: string }

const settings: Setting[] = [
  {
    key: 'autoSync',
    label: 'Auto-sync',
    description: 'Applies new commits on the target branch automatically',
  },
  {
    key: 'selfHeal',
    label: 'Self-heal',
    description: 'Reverts manual changes made in the cluster',
  },
  {
    key: 'prune',
    label: 'Prune propagation',
    description: 'Deletes resources that were removed from Git',
  },
]

/**
 * A settings list: label left, switch right. Each change applies right away; Auto-sync simulates
 * a one-second save (spinner, aria-busy, further toggles ignored, focus kept).
 */
export const SettingsRows: Story = {
  args: { labelPosition: 'start' },
  render: function Render(args) {
    const [values, setValues] = useState({ autoSync: true, selfHeal: false, prune: true })
    const [saving, setSaving] = useState(false)
    return (
      <div className="flex w-md max-w-full flex-col divide-y divide-border-strong rounded-lg border border-border-strong bg-surface-raised">
        {settings.map(({ key, label, description }) => (
          <div key={key} className="px-4 py-3">
            <Switch
              {...args}
              label={label}
              description={description}
              checked={values[key]}
              loading={key === 'autoSync' && saving}
              onChange={(e) => {
                const next = e.target.checked
                if (key !== 'autoSync') {
                  setValues((v) => ({ ...v, [key]: next }))
                  return
                }
                setSaving(true)
                setTimeout(() => {
                  setValues((v) => ({ ...v, autoSync: next }))
                  setSaving(false)
                }, 1000)
              }}
            />
          </div>
        ))}
      </div>
    )
  },
}
