import type { Meta, StoryObj } from '@storybook/react-vite'
import { type FormEvent, useId, useState } from 'react'
import { Button } from '../src/components/button'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../src/components/dialog'
import { Radio, RadioGroup, type RadioGroupProps } from '../src/components/radio-group'

type StoryArgs = Omit<RadioGroupProps, 'value' | 'defaultValue'> & { defaultValue?: string }

function Strategies({ descriptions = true }: { descriptions?: boolean }) {
  return (
    <>
      <Radio
        value="rolling"
        label="Rolling update"
        description={
          descriptions ? 'Replace pods gradually while the service stays available.' : undefined
        }
      />
      <Radio
        value="blue-green"
        label="Blue / green"
        description={
          descriptions ? 'Prepare a second environment, then switch traffic.' : undefined
        }
      />
      <Radio
        value="recreate"
        label="Recreate"
        description={
          descriptions
            ? 'Unavailable for environments that require continuous availability.'
            : undefined
        }
        disabled
      />
    </>
  )
}

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'RadioGroup uses a native fieldset/legend with role="radiogroup", and Radio renders a native input. Use distinct name values for independent groups in the same form. value / defaultValue are mutually exclusive; value={null} clears a controlled selection. onValueChange(value, event) receives the native input change event. variant="card" changes the presentation while preserving keyboard and form behavior. Error is announced on the group, with its message linked to each item. Radio must be inside RadioGroup; name, checked, form and required belong to the group. Labels and descriptions should contain non-interactive content.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg rounded-xl bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    name: 'strategy',
    legend: 'Deployment strategy',
    variant: 'default',
    orientation: 'vertical',
    required: false,
    disabled: false,
    children: null,
  },
  argTypes: {
    name: { control: 'text' },
    legend: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    defaultValue: { control: 'select', options: [undefined, 'rolling', 'blue-green'] },
    variant: { control: 'radio', options: ['default', 'card'] },
    orientation: { control: 'radio', options: ['vertical', 'horizontal'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: false },
  },
  render: function Render(args) {
    // Autodocs renders multiple independent groups in one document.
    const suffix = useId()
    return (
      <RadioGroup {...args} name={`${args.name}-${suffix}`}>
        <Strategies />
      </RadioGroup>
    )
  },
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { description: 'Choose how the next version replaces running pods.' },
}
export const Default: Story = { args: { defaultValue: 'rolling' } }
export const Cards: Story = { args: { variant: 'card', defaultValue: 'rolling' } }
export const Horizontal: Story = {
  render: function Render(args) {
    const name = useId()
    return (
      <RadioGroup
        {...args}
        name={name}
        legend="Environment"
        orientation="horizontal"
        value={undefined}
        defaultValue="dev"
      >
        <Radio value="dev" label="Development" />
        <Radio value="staging" label="Staging" />
        <Radio value="prod" label="Production" />
      </RadioGroup>
    )
  },
}
export const HorizontalCards: Story = {
  args: { variant: 'card', orientation: 'horizontal', defaultValue: 'rolling' },
}
export const Error: Story = {
  args: {
    description: 'Select a strategy before continuing.',
    error: 'Choose a deployment strategy.',
    required: true,
  },
}
export const Disabled: Story = { args: { disabled: true, defaultValue: 'rolling' } }
export const DisabledCards: Story = {
  args: { disabled: true, defaultValue: 'rolling', variant: 'card' },
}

export const States: Story = {
  render: function Render() {
    const id = useId()
    return (
      <div className="flex flex-col gap-7">
        <RadioGroup name={`${id}-idle`} legend="Default">
          <Strategies descriptions={false} />
        </RadioGroup>
        <RadioGroup name={`${id}-selected`} legend="Selected" defaultValue="rolling">
          <Strategies descriptions={false} />
        </RadioGroup>
        <RadioGroup name={`${id}-invalid`} legend="Invalid" error="Choose a deployment strategy.">
          <Strategies descriptions={false} />
        </RadioGroup>
        <RadioGroup name={`${id}-disabled`} legend="Disabled" disabled defaultValue="rolling">
          <Strategies descriptions={false} />
        </RadioGroup>
        <p className="m-0 text-xs text-fg-muted">
          Tab into a group, then use arrow keys. Keyboard focus has an extra ring; hover does not
          change selection.
        </p>
      </div>
    )
  },
}

export const Required: Story = {
  render: function Render() {
    const name = useId()
    const [saved, setSaved] = useState('')
    const submit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const value = new FormData(event.currentTarget).get(name)
      setSaved(typeof value === 'string' ? value : '')
    }
    return (
      <form onSubmit={submit} onReset={() => setSaved('')} className="flex flex-col gap-4">
        <RadioGroup
          name={name}
          legend="Deployment strategy"
          description="A selection is required. Uses native form validation."
          required
        >
          <Strategies />
        </RadioGroup>
        <div className="flex gap-2">
          <Button type="submit">Save strategy</Button>
          <Button type="reset" intent="secondary">
            Reset
          </Button>
        </div>
        <output className="m-0 text-xs text-fg-muted">
          {saved ? `Submitted: ${saved}` : 'No strategy submitted.'}
        </output>
      </form>
    )
  },
}

export const Controlled: Story = {
  render: function Render() {
    const name = useId()
    const [value, setValue] = useState<string | null>(null)
    return (
      <div className="flex flex-col gap-4">
        <RadioGroup
          name={name}
          legend="Deployment strategy"
          value={value}
          onValueChange={setValue}
          variant="card"
        >
          <Strategies />
        </RadioGroup>
        <p className="m-0 text-xs text-fg-muted">
          Selected: <code>{value ?? 'null'}</code>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button intent="secondary" onClick={() => setValue(null)}>
            Clear selection
          </Button>
          <Button intent="secondary" onClick={() => setValue('blue-green')}>
            Select blue / green
          </Button>
        </div>
      </div>
    )
  },
}

export const FormReset: Story = {
  render: function Render() {
    const id = useId()
    const [controlled, setControlled] = useState<string | null>('rolling')
    const [submitted, setSubmitted] = useState('')
    return (
      <form
        className="flex flex-col gap-6"
        onReset={() => {
          setControlled('rolling')
          setSubmitted('')
        }}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
        }}
      >
        <RadioGroup name={`${id}-uncontrolled`} legend="Uncontrolled" defaultValue="rolling">
          <Strategies descriptions={false} />
        </RadioGroup>
        <RadioGroup
          name={`${id}-controlled`}
          legend="Controlled"
          value={controlled}
          onValueChange={setControlled}
          variant="card"
        >
          <Strategies descriptions={false} />
        </RadioGroup>
        <div className="flex gap-2">
          <Button type="reset" intent="secondary">
            Reset form
          </Button>
          <Button type="submit">Read form values</Button>
        </div>
        <output className="m-0 wrap-anywhere text-xs text-fg-muted">
          {submitted ||
            'Both groups reset to Rolling update; the controlled group uses the form’s onReset.'}
        </output>
      </form>
    )
  },
}

export const ExternalForm: Story = {
  render: function Render() {
    const formId = useId()
    const [submitted, setSubmitted] = useState('')
    return (
      <div className="flex flex-col gap-4">
        <RadioGroup
          form={formId}
          name="strategy"
          legend="Deployment strategy"
          defaultValue="rolling"
        >
          <Strategies />
        </RadioGroup>
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault()
            const value = new FormData(event.currentTarget).get('strategy')
            setSubmitted(typeof value === 'string' ? value : '')
          }}
          onReset={() => setSubmitted('')}
        >
          <div className="flex gap-2">
            <Button type="submit">Read external form</Button>
            <Button type="reset" intent="secondary">
              Reset
            </Button>
          </div>
        </form>
        <output className="m-0 text-xs text-fg-muted">
          {submitted ? `Submitted: ${submitted}` : 'The group is outside its owning form.'}
        </output>
      </div>
    )
  },
}

export const DynamicOptions: Story = {
  render: function Render() {
    const name = useId()
    const [show, setShow] = useState(true)
    return (
      <div className="flex flex-col gap-4">
        <RadioGroup
          name={name}
          legend="Deployment strategy"
          defaultValue="blue-green"
          variant="card"
        >
          <Radio value="rolling" label="Rolling update" />
          {show && <Radio value="blue-green" label="Blue / green" />}
        </RadioGroup>
        <Button intent="secondary" onClick={() => setShow(!show)}>
          {show ? 'Remove blue / green' : 'Restore blue / green'}
        </Button>
        <p className="m-0 text-xs text-fg-muted">
          Removing a selected option clears it. Restoring it does not silently select it again.
        </p>
      </div>
    )
  },
}

export const LongLabels: Story = {
  render: function Render() {
    const name = useId()
    return (
      <div className="max-w-64">
        <RadioGroup name={name} legend="Deployment strategy" variant="card" defaultValue="gradual">
          <Radio
            value="gradual"
            label="Gradual rollout with manual approval"
            description="Wait for an operator to approve the next step before replacing additional pods."
          />
          <Radio
            value="scheduled"
            label="在指定維護時段完成更新，並保留手動確認步驟"
            description="較長的說明文字會自然換行，單選圓圈保持固定大小。"
          />
          <Radio value="token" label="averylongunbrokenselectionlabelthatstillneedstowrapsafely" />
        </RadioGroup>
      </div>
    )
  },
}

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: function Render() {
    const id = useId()
    return (
      <div className="flex flex-col gap-7">
        <RadioGroup name={`${id}-plain`} legend="Deployment strategy" defaultValue="rolling">
          <Strategies />
        </RadioGroup>
        <RadioGroup
          name={`${id}-card`}
          legend="Deployment strategy"
          defaultValue="blue-green"
          variant="card"
        >
          <Strategies />
        </RadioGroup>
        <RadioGroup
          name={`${id}-error`}
          legend="Required strategy"
          error="Choose a deployment strategy."
          required
        >
          <Strategies descriptions={false} />
        </RadioGroup>
      </div>
    )
  },
}

export const InDialog: Story = {
  render: function Render() {
    const name = useId()
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button intent="secondary" onClick={() => setOpen(true)}>
          Choose strategy
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogHeader
            title="Deployment strategy"
            description="Choose how to replace the running version."
          />
          <DialogBody>
            <RadioGroup name={name} legend="Strategy" variant="card" defaultValue="rolling">
              <Strategies />
            </RadioGroup>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}
