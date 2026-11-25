import type { Meta, StoryObj } from '@storybook/react-vite'
import { type FormEvent, useId, useState } from 'react'
import { Button } from '../src/components/button'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../src/components/dialog'
import {
  Radio,
  RadioGroup,
  type RadioGroupProps,
  RadioGroupLabel,
  RadioGroupDescription,
  RadioGroupItems,
  RadioGroupError,
} from '../src/components/radio-group'

type StoryArgs = Omit<RadioGroupProps, 'value' | 'defaultValue'> & {
  defaultValue?: string
  /** Story-only: fills RadioGroupLabel so Storybook controls can edit it. */
  legend?: string
  /** Story-only: fills RadioGroupDescription. */
  description?: string
  /** Story-only: fills RadioGroupError and marks the group invalid. */
  error?: string
}

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
          'RadioGroup is a native fieldset with role="radiogroup", composed from RadioGroupLabel (visible or sr-only), RadioGroupDescription, RadioGroupItems and RadioGroupError; Radio renders a native input. Use distinct name values for independent groups in the same form. value / defaultValue are mutually exclusive; value={null} clears a controlled selection. onValueChange(value, event) receives the native input change event. variant="card" changes the presentation while preserving keyboard and form behavior. Set invalid and render RadioGroupError: the error is announced on the group, with its message linked to each item. Radio must be inside RadioGroup; name, checked, form and required belong to the group. Labels and descriptions should contain non-interactive content.',
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
  render: function Render({ legend, description, error, ...args }) {
    // Autodocs renders multiple independent groups in one document.
    const suffix = useId()
    return (
      <RadioGroup
        {...args}
        name={`${args.name}-${suffix}`}
        invalid={args.invalid || Boolean(error)}
      >
        {legend && <RadioGroupLabel>{legend}</RadioGroupLabel>}
        {description && <RadioGroupDescription>{description}</RadioGroupDescription>}
        <RadioGroupItems>
          <Strategies />
        </RadioGroupItems>
        {error && <RadioGroupError>{error}</RadioGroupError>}
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
  render: function Render({ variant, disabled, required }) {
    const name = useId()
    return (
      <RadioGroup
        name={name}
        variant={variant}
        disabled={disabled}
        required={required}
        orientation="horizontal"
        defaultValue="dev"
      >
        <RadioGroupLabel>Environment</RadioGroupLabel>
        <RadioGroupItems>
          <Radio value="dev" label="Development" />
          <Radio value="staging" label="Staging" />
          <Radio value="prod" label="Production" />
        </RadioGroupItems>
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
/** The label stays the group's accessible name while hidden visually. */
export const HiddenLabel: Story = {
  render: function Render() {
    const name = useId()
    return (
      <RadioGroup name={name} defaultValue="rolling">
        <RadioGroupLabel className="sr-only">Deployment strategy</RadioGroupLabel>
        <RadioGroupItems>
          <Strategies descriptions={false} />
        </RadioGroupItems>
      </RadioGroup>
    )
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
        <RadioGroup name={`${id}-idle`}>
          <RadioGroupLabel>Default</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies descriptions={false} />
          </RadioGroupItems>
        </RadioGroup>
        <RadioGroup name={`${id}-selected`} defaultValue="rolling">
          <RadioGroupLabel>Selected</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies descriptions={false} />
          </RadioGroupItems>
        </RadioGroup>
        <RadioGroup name={`${id}-invalid`} invalid>
          <RadioGroupLabel>Invalid</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies descriptions={false} />
          </RadioGroupItems>
          <RadioGroupError>Choose a deployment strategy.</RadioGroupError>
        </RadioGroup>
        <RadioGroup name={`${id}-disabled`} disabled defaultValue="rolling">
          <RadioGroupLabel>Disabled</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies descriptions={false} />
          </RadioGroupItems>
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
        <RadioGroup name={name} required>
          <RadioGroupLabel>Deployment strategy</RadioGroupLabel>
          <RadioGroupDescription>
            A selection is required. Uses native form validation.
          </RadioGroupDescription>
          <RadioGroupItems>
            <Strategies />
          </RadioGroupItems>
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
        <RadioGroup name={name} value={value} onValueChange={setValue} variant="card">
          <RadioGroupLabel>Deployment strategy</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies />
          </RadioGroupItems>
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
        <RadioGroup name={`${id}-uncontrolled`} defaultValue="rolling">
          <RadioGroupLabel>Uncontrolled</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies descriptions={false} />
          </RadioGroupItems>
        </RadioGroup>
        <RadioGroup
          name={`${id}-controlled`}
          value={controlled}
          onValueChange={setControlled}
          variant="card"
        >
          <RadioGroupLabel>Controlled</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies descriptions={false} />
          </RadioGroupItems>
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
        <RadioGroup form={formId} name="strategy" defaultValue="rolling">
          <RadioGroupLabel>Deployment strategy</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies />
          </RadioGroupItems>
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
        <RadioGroup name={name} defaultValue="blue-green" variant="card">
          <RadioGroupLabel>Deployment strategy</RadioGroupLabel>
          <RadioGroupItems>
            <Radio value="rolling" label="Rolling update" />
            {show && <Radio value="blue-green" label="Blue / green" />}
          </RadioGroupItems>
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
        <RadioGroup name={name} variant="card" defaultValue="gradual">
          <RadioGroupLabel>Deployment strategy</RadioGroupLabel>
          <RadioGroupItems>
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
            <Radio
              value="token"
              label="averylongunbrokenselectionlabelthatstillneedstowrapsafely"
            />
          </RadioGroupItems>
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
        <RadioGroup name={`${id}-plain`} defaultValue="rolling">
          <RadioGroupLabel>Deployment strategy</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies />
          </RadioGroupItems>
        </RadioGroup>
        <RadioGroup name={`${id}-card`} defaultValue="blue-green" variant="card">
          <RadioGroupLabel>Deployment strategy</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies />
          </RadioGroupItems>
        </RadioGroup>
        <RadioGroup name={`${id}-error`} required invalid>
          <RadioGroupLabel>Required strategy</RadioGroupLabel>
          <RadioGroupItems>
            <Strategies descriptions={false} />
          </RadioGroupItems>
          <RadioGroupError>Choose a deployment strategy.</RadioGroupError>
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
            <RadioGroup name={name} variant="card" defaultValue="rolling">
              <RadioGroupLabel>Strategy</RadioGroupLabel>
              <RadioGroupItems>
                <Strategies />
              </RadioGroupItems>
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
