import type { Meta, StoryObj } from '@storybook/react-vite'
import { type FormEvent, useState } from 'react'
import { Button } from '../src/components/button'
import { Checkbox, CheckboxGroup, type CheckboxGroupProps } from '../src/components/checkbox'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../src/components/dialog'
import { RefreshCw } from './_helpers/story-icons'

const meta = {
  title: 'UI/CheckboxGroup',
  component: CheckboxGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          '`<fieldset>` + `<legend>` around related checkboxes. It holds no value: each checkbox',
          'keeps its own `name` / `checked`. `description` and `error` describe the group',
          '(aria-describedby); `disabled` reaches every checkbox through the native fieldset.',
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
  args: {
    legend: 'Sync options',
    orientation: 'vertical',
    disabled: false,
    children: null,
  },
  argTypes: {
    legend: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    orientation: { control: 'radio', options: ['vertical', 'horizontal'] },
    disabled: { control: 'boolean' },
    children: { control: false },
  },
} satisfies Meta<CheckboxGroupProps>

export default meta
type Story = StoryObj<typeof meta>

function SyncOptionItems() {
  return (
    <>
      <Checkbox
        name="syncOptions"
        value="prune"
        label="Prune"
        description="Deletes resources that are no longer in Git"
      />
      <Checkbox
        name="syncOptions"
        value="dryRun"
        label="Dry run"
        description="Shows what would change without applying it"
      />
      <Checkbox
        name="syncOptions"
        value="applyOnly"
        label="Apply only"
        description="Skips pre- and post-sync hooks"
      />
      <Checkbox
        name="syncOptions"
        value="force"
        label="Force"
        description={
          <span className="text-danger">Deletes and recreates resources that can't be patched</span>
        }
      />
    </>
  )
}

export const SyncOptions: Story = {
  render: (args) => (
    <CheckboxGroup {...args}>
      <SyncOptionItems />
    </CheckboxGroup>
  ),
}

export const Horizontal: Story = {
  args: { legend: 'Resource kinds', orientation: 'horizontal' },
  render: (args) => (
    <CheckboxGroup {...args}>
      {['Deployment', 'Service', 'ConfigMap', 'Secret', 'Ingress'].map((kind, i) => (
        <Checkbox key={kind} name="kinds" value={kind} label={kind} defaultChecked={i < 2} />
      ))}
    </CheckboxGroup>
  ),
}

/** Validated on submit, not on change: "one of" is something native `required` can't express. */
export const WithError: Story = {
  args: { legend: 'Notify on', description: 'Pick at least one event' },
  render: function Render(args) {
    const [error, setError] = useState<string>()
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const picked = new FormData(e.currentTarget).getAll('events')
      setError(picked.length ? undefined : 'Pick at least one event to notify on')
    }
    return (
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <CheckboxGroup {...args} error={error}>
          <Checkbox name="events" value="degraded" label="Health degraded" />
          <Checkbox name="events" value="failed" label="Sync failed" />
          <Checkbox name="events" value="succeeded" label="Sync succeeded" />
        </CheckboxGroup>
        <div>
          <Button type="submit">Save</Button>
        </div>
      </form>
    )
  },
}

/** The Sync confirmation with its options: applied by the dialog's button, so checkboxes, not switches. */
export const InDialog: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button iconLeft={<RefreshCw />} onClick={() => setOpen(true)}>
          Sync
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogHeader
            title="Sync checkout-api?"
            description="Applies the manifests at 9f3c2a1 (main) to payments."
          />
          <DialogBody>
            <CheckboxGroup {...args}>
              <SyncOptionItems />
            </CheckboxGroup>
          </DialogBody>
          <DialogFooter>
            <Button intent="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Sync</Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}
