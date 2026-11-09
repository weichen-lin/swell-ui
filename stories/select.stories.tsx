import type { Meta, StoryObj } from '@storybook/react-vite'
import { Cloud, Globe, Layers, Server } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '../src/components/button'
import {
  Select,
  type SelectGroup,
  type SelectOption,
  type SelectProps,
} from '../src/components/select'
import { cn } from '../src/lib/cn'

const sizes = ['sm', 'md', 'lg'] as const

// Stories use the visible-label form: Storybook's arg inference collapses the label/aria-label union
type StoryArgs = Extract<SelectProps, { label: string }>

const clusters: SelectOption[] = [
  { value: 'prod-tw', label: 'prod-tw' },
  { value: 'prod-jp', label: 'prod-jp' },
  { value: 'stg-1', label: 'stg-1' },
  { value: 'dev-1', label: 'dev-1' },
]

const regions: SelectOption[] = [
  { value: 'asia-east1', label: 'Taiwan (asia-east1)', icon: <Globe /> },
  { value: 'asia-northeast1', label: 'Tokyo (asia-northeast1)', icon: <Cloud /> },
  { value: 'us-east1', label: 'South Carolina (us-east1)', icon: <Server /> },
]

const groupedClusters: SelectGroup[] = [
  {
    label: 'Production',
    options: [
      { value: 'prod-tw', label: 'prod-tw', icon: <Server /> },
      { value: 'prod-jp', label: 'prod-jp', icon: <Server /> },
    ],
  },
  {
    label: 'Staging',
    options: [
      { value: 'stg-1', label: 'stg-1', icon: <Layers /> },
      { value: 'stg-2', label: 'stg-2', icon: <Layers /> },
    ],
  },
  { label: 'Development', options: [{ value: 'dev-1', label: 'dev-1', icon: <Cloud /> }] },
]

const namespaces: SelectOption[] = [
  { value: 'payments', label: 'payments' },
  { value: 'checkout', label: 'checkout' },
  { value: 'kube-system', label: 'kube-system', disabled: true },
  { value: 'argocd', label: 'argocd', disabled: true },
  { value: 'search', label: 'search' },
]

// Storybook select control: option name -> leading icon
const startArgType = {
  control: 'select',
  options: ['none', 'Server', 'Globe', 'Layers'],
  mapping: { none: undefined, Server: <Server />, Globe: <Globe />, Layers: <Layers /> },
} as const

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // Grid stories opt out of the narrow column via `parameters.wide`
  decorators: [
    (Story, { parameters }) => (
      <div className={cn('rounded-lg bg-bg p-6', parameters.wide ? 'w-max' : 'max-w-sm')}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Cluster',
    options: clusters,
    floating: false,
    size: 'md',
    mono: false,
    required: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    options: { control: false },
    floating: { control: 'boolean' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'radio', options: sizes },
    start: startArgType,
    mono: { control: 'boolean' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    selectClassName: { control: 'text' },
  },
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<Meta<StoryArgs>>

export const Playground: Story = {
  args: { placeholder: 'Choose a cluster', helperText: 'Where the release is deployed' },
}

export const LabelAbove: Story = { args: { placeholder: 'Choose a cluster' } }

/** Empty (label rests inside), prefilled, prefilled with an icon option, and a long label. */
export const Floating: Story = {
  args: { floating: true },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Select {...args} label="Cluster" />
      <Select {...args} label="Cluster" defaultValue="stg-1" />
      <Select {...args} label="Region" options={regions} defaultValue="asia-east1" />
      <Select {...args} label="Target cluster for the canary rollout (production only)" />
    </div>
  ),
}

/** Option icons show in the picker and on the trigger; `start` fills in while nothing is chosen. */
export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Select {...args} label="Region" options={regions} defaultValue="asia-northeast1" />
      <Select
        {...args}
        label="Region"
        options={regions}
        start={<Globe />}
        placeholder="Choose a region"
        helperText="Globe until a region is chosen"
      />
      <Select
        {...args}
        label="Cluster"
        options={clusters}
        start={<Server />}
        defaultValue="prod-tw"
      />
    </div>
  ),
}

export const Groups: Story = {
  args: { options: groupedClusters, placeholder: 'Choose a cluster', mono: true },
}

export const DisabledOptions: Story = {
  args: {
    label: 'Namespace',
    options: namespaces,
    placeholder: 'Choose a namespace',
    helperText: 'System namespaces are managed by the platform team',
  },
}

export const WithError: Story = {
  name: 'Error',
  args: {
    label: 'Cluster',
    defaultValue: 'prod-tw',
    helperText: 'Where the release is deployed',
    error: 'prod-tw is frozen until the incident is resolved',
  },
}

export const Required: Story = {
  args: {
    label: 'Cluster',
    required: true,
    placeholder: 'Choose a cluster',
    helperText: 'Required before the release can sync',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Cluster',
    defaultValue: 'prod-tw',
    disabled: true,
    helperText: 'Set by the project',
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {sizes.map((size) => (
        <Select
          key={size}
          {...args}
          size={size}
          label={`Size ${size}`}
          options={regions}
          defaultValue="asia-east1"
        />
      ))}
    </div>
  ),
}

// Hover can't be triggered from a story, so that row forces the hover border on the control
const states: { name: string; props: Partial<SelectProps> }[] = [
  { name: 'default', props: { placeholder: 'Choose' } },
  { name: 'filled', props: { defaultValue: 'stg-1' } },
  { name: 'icon', props: { options: regions, defaultValue: 'asia-east1' } },
  {
    name: 'hover (forced)',
    // Same vars the frame sets on real hover
    props: {
      className: [
        '[&_[data-slot=input-control]]:[--field-border:var(--color-input-border-hover)]',
        '[&_[data-slot=input-control]]:[--field-bg:var(--color-input-bg-hover)]',
        '[&_[data-slot=input-control]]:[--field-lift:var(--shadow-input-lift)]',
      ].join(' '),
    },
  },
  { name: 'error', props: { defaultValue: 'prod-tw', error: 'Cluster frozen' } },
  { name: 'disabled', props: { defaultValue: 'stg-1', disabled: true } },
]

export const AllStates: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(6,minmax(11rem,1fr))] items-start gap-x-4 gap-y-6">
      {[false, true].flatMap((floating) =>
        sizes.map((size) => (
          <div key={`${floating}-${size}`} className="contents">
            <span className="pt-6 text-sm text-fg-muted">
              {floating ? 'floating' : 'above'} {size}
            </span>
            {states.map(({ name, props }) => (
              <Select
                key={name}
                {...args}
                {...props}
                floating={floating}
                size={size}
                label={name}
                className={props.className}
              />
            ))}
          </div>
        )),
      )}
    </div>
  ),
}

function DeployForm(args: StoryArgs) {
  const [submitted, setSubmitted] = useState<string | null>(null)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)), null, 2))
  }
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} onReset={() => setSubmitted(null)}>
      <Select
        {...args}
        label="Cluster"
        name="cluster"
        options={groupedClusters}
        placeholder="Choose a cluster"
        required
      />
      <Select {...args} label="Region" name="region" options={regions} defaultValue="asia-east1" />
      <Select
        {...args}
        label="Namespace"
        name="namespace"
        options={namespaces}
        placeholder="Optional"
        helperText="Optional: left out of FormData while nothing is chosen"
      />
      <div className="flex gap-2">
        <Button type="submit">Deploy</Button>
        <Button type="reset" intent="secondary">
          Reset
        </Button>
      </div>
      <output className="block min-h-16 rounded-md bg-surface-muted p-3 font-mono text-xs whitespace-pre text-fg">
        {submitted ?? 'Submit to see FormData'}
      </output>
    </form>
  )
}

/** Submitting shows the FormData; Required blocks submit while empty; Reset restores defaults and icons. */
export const InForm: Story = {
  render: (args) => <DeployForm {...args} />,
}
