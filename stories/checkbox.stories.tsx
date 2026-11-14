import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'
import { Badge } from '../src/components/badge'
import { Checkbox, type CheckboxProps } from '../src/components/checkbox'

// Stories use the visible-label form: Storybook's arg inference collapses the label/aria-label union
type StoryArgs = Extract<CheckboxProps, { label: ReactNode }>

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Multi-select options, options applied by a Save/Sync button, table row selection and',
          'consent. Native `<input type="checkbox">`: `checked` / `defaultChecked` / native',
          '`onChange`, form submit and `form.reset()` work unchanged; the whole row is the label.',
          '`indeterminate` draws a dash and is announced as mixed; derive it from the children',
          '(see TableSelectAll), since a click clears it in the browser.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-xl bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: { label: 'Prune', disabled: false, indeterminate: false },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    required: { control: 'boolean' },
    className: { control: 'text' },
    inputClassName: { control: 'text' },
  },
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<Meta<StoryArgs>>

export const Playground: Story = {}

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Checkbox {...args} label="Unchecked" />
      <Checkbox {...args} label="Checked" defaultChecked />
      <Checkbox {...args} label="Indeterminate" indeterminate />
      <Checkbox {...args} label="Disabled" disabled />
      <Checkbox {...args} label="Disabled checked" disabled defaultChecked />
      <Checkbox {...args} label="Disabled indeterminate" disabled indeterminate />
      <Checkbox
        {...args}
        label="I understand this deletes 3 resources"
        error="Confirm to continue"
      />
    </div>
  ),
}

/** The box sits on the label's first line; description and error line up under the text. */
export const WithDescription: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox
        {...args}
        label="Prune"
        description="Deletes resources that are no longer in Git"
        defaultChecked
      />
      <Checkbox
        {...args}
        label="Apply out of sync only"
        description="Skips resources that already match the target revision. Long descriptions wrap under the label, not under the box."
      />
    </div>
  ),
}

const apps = [
  { name: 'checkout-api', ns: 'payments', status: 'Synced' },
  { name: 'checkout-web', ns: 'payments', status: 'OutOfSync' },
  { name: 'ledger-worker', ns: 'finance', status: 'Synced' },
  { name: 'notifier', ns: 'platform', status: 'OutOfSync' },
] as const

/**
 * Header checkbox derived from the rows: none, some (indeterminate) or all. Clicking it from
 * "some" selects all; rows have no visible label, so they use aria-label.
 */
export const TableSelectAll: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['checkout-web'])
    const all = selected.length === apps.length
    const some = selected.length > 0 && !all
    return (
      <div className="flex w-md max-w-full flex-col gap-2">
        <p className="m-0 text-xs text-fg-muted" aria-live="polite">
          {selected.length} of {apps.length} selected
        </p>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-strong text-fg-muted">
              <th className="w-8 py-1.5 font-normal">
                <Checkbox
                  aria-label="Select all applications"
                  checked={all}
                  indeterminate={some}
                  onChange={() => setSelected(all ? [] : apps.map((a) => a.name))}
                />
              </th>
              <th className="py-1.5 font-medium">Application</th>
              <th className="py-1.5 font-medium">Namespace</th>
              <th className="py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.name} className="border-b border-border">
                <td className="py-1.5">
                  <Checkbox
                    aria-label={`Select ${app.name}`}
                    checked={selected.includes(app.name)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked ? [...s, app.name] : s.filter((n) => n !== app.name),
                      )
                    }
                  />
                </td>
                <td className="py-1.5 font-mono text-xs">{app.name}</td>
                <td className="py-1.5 text-fg-muted">{app.ns}</td>
                <td className="py-1.5">
                  <Badge size="sm" tone={app.status === 'Synced' ? 'success' : 'warning'}>
                    {app.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
}
