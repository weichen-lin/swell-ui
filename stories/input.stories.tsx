import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, GitCommitHorizontal, Globe, Tag } from 'lucide-react'
import { Input, type InputProps } from '../src/components/input'
import { cn } from '../src/lib/cn'

const sizes = ['sm', 'md', 'lg'] as const

// Stories use the visible-label form: Storybook's arg inference collapses the label/aria-label union
type StoryArgs = Extract<InputProps, { label: string }>

// Storybook select control: option name -> adornment (icons or plain text)
const adornmentArgType = {
  control: 'select',
  options: ['none', 'Globe', 'Box', 'Tag', 'GitCommit', 'https://', '.svc.cluster.local', ':8080'],
  mapping: {
    none: undefined,
    Globe: <Globe />,
    Box: <Box />,
    Tag: <Tag />,
    GitCommit: <GitCommitHorizontal />,
    'https://': 'https://',
    '.svc.cluster.local': '.svc.cluster.local',
    ':8080': ':8080',
  },
} as const

const meta = {
  title: 'UI/Input',
  component: Input,
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
    label: 'Application name',
    floating: false,
    size: 'md',
    type: 'text',
    mono: false,
    required: false,
    disabled: false,
    readOnly: false,
    validating: false,
  },
  argTypes: {
    label: { control: 'text' },
    floating: { control: 'boolean' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'radio', options: sizes },
    type: { control: 'select', options: ['text', 'email', 'url', 'tel'] },
    start: adornmentArgType,
    end: adornmentArgType,
    mono: { control: 'boolean' },
    required: { control: 'boolean' },
    validating: { control: 'boolean' },
    validatingText: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    className: { control: 'text' },
    inputClassName: { control: 'text' },
  },
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<Meta<StoryArgs>>

export const Playground: Story = {
  args: { placeholder: 'payments-api', helperText: 'Lowercase letters, digits and dashes' },
}

export const LabelAbove: Story = { args: { placeholder: 'payments-api' } }

/** Empty, prefilled, with a placeholder (shown once focused), with a start adornment, and a long label. */
export const Floating: Story = {
  args: { floating: true },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Input {...args} label="Application name" />
      <Input {...args} label="Namespace" defaultValue="payments" />
      <Input {...args} label="Image" placeholder="ghcr.io/org/app:tag" />
      <Input {...args} label="Repository URL" start="https://" defaultValue="" />
      <Input {...args} label="Repository URL (HTTPS or SSH, including the .git suffix)" />
    </div>
  ),
}

/** Floating fields are transparent, so they take on whatever surface they sit on. */
export const FloatingOnCard: Story = {
  args: { floating: true },
  render: (args) => (
    <div className="flex flex-col gap-6 rounded-lg bg-surface-raised p-6 shadow-whisper">
      <Input {...args} label="Namespace" defaultValue="payments" />
      <Input
        {...args}
        label="Image tag"
        defaultValue="payments-api:latest"
        error="Pin an immutable tag"
        mono
      />
    </div>
  ),
}

export const HelperText: Story = {
  args: {
    label: 'Sync interval',
    inputMode: 'numeric',
    defaultValue: '180',
    end: 's',
    helperText: 'How often Argo polls the repository, in seconds',
  },
}

export const WithError: Story = {
  name: 'Error',
  args: {
    label: 'Image tag',
    defaultValue: 'payments-api:latest',
    mono: true,
    helperText: 'Pin to an immutable tag',
    error: 'Use an immutable tag or a digest; latest is not allowed in production',
  },
}

export const Required: Story = {
  args: {
    label: 'Target revision',
    required: true,
    placeholder: 'main',
    helperText: 'Branch, tag or commit SHA',
  },
}

export const Adornments: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Input
        {...args}
        label="Repository"
        start="https://"
        defaultValue="github.com/acme/payments-api"
      />
      <Input
        {...args}
        label="Service host"
        end=".svc.cluster.local"
        defaultValue="payments-api.prod"
        mono
      />
      <Input
        {...args}
        label="Image"
        start={<Box />}
        defaultValue="ghcr.io/acme/payments-api:1.4.2"
        mono
      />
      <Input
        {...args}
        label="Hostname"
        start={<Globe />}
        end=":8080"
        defaultValue="payments.internal"
      />
    </div>
  ),
}

export const Mono: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Input {...args} label="Image" mono defaultValue="ghcr.io/acme/payments-api:1.4.2" />
      <Input
        {...args}
        label="Commit SHA"
        mono
        start={<GitCommitHorizontal />}
        defaultValue="3f9c2a1e8b7d4c6f0a5e9d2b1c8f7a6e5d4c3b2a"
      />
    </div>
  ),
}

export const Validating: Story = {
  args: {
    label: 'Application name',
    defaultValue: 'payments-api',
    validating: true,
    validatingText: 'Checking if payments-api is available',
    helperText: 'Must be unique in the project',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Cluster',
    defaultValue: 'prod-eu-west-1',
    disabled: true,
    helperText: 'Set by the project',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'Cluster',
    defaultValue: 'prod-eu-west-1',
    readOnly: true,
    helperText: 'Focusable and copyable, not editable',
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {sizes.map((size) => (
        <Input key={size} {...args} size={size} label={`Size ${size}`} placeholder="payments-api" />
      ))}
    </div>
  ),
}

// Hover can't be triggered from a story, so that row forces the hover border on the control
const states: { name: string; props: Partial<InputProps> }[] = [
  { name: 'default', props: {} },
  { name: 'filled', props: { defaultValue: 'payments-api' } },
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
  { name: 'error', props: { defaultValue: 'Payments_API', error: 'Lowercase only' } },
  { name: 'disabled', props: { defaultValue: 'payments-api', disabled: true } },
  { name: 'readOnly', props: { defaultValue: 'payments-api', readOnly: true } },
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
              <Input
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
