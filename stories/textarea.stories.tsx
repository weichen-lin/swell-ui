import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../src/components/button'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../src/components/dialog'
import { Textarea, type TextareaProps } from '../src/components/textarea'

// Storybook controls are independent; the renderer reconstructs the public height union.
type StoryArgs = Omit<TextareaProps, 'label' | 'floating' | 'autoResize'> & {
  label: string
  floating?: boolean
  autoResize?: boolean
}

const meta = {
  title: 'UI/Textarea',
  render: ({ autoResize, rows, resize, minRows, maxRows, ...args }) => (
    <Textarea
      {...args}
      {...(autoResize ? { autoResize: true, minRows, maxRows } : { rows, resize })}
    />
  ),
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Native textarea with the same tokens and notched floating label as Input. Labels stay transparent in every state. Use rows / resize for manual height, or autoResize with minRows / maxRows for content-driven height. showCount uses native UTF-16 length; maxLength remains a native input constraint and never truncates external values.',
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
  args: { label: 'Description', size: 'md', floating: false, showCount: false },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    floating: { control: 'boolean' },
    autoResize: { control: 'boolean' },
    rows: { control: { type: 'number', min: 1 }, if: { arg: 'autoResize', truthy: false } },
    resize: {
      control: 'radio',
      options: ['vertical', 'none'],
      if: { arg: 'autoResize', truthy: false },
    },
    minRows: { control: { type: 'number', min: 1 }, if: { arg: 'autoResize', truthy: true } },
    maxRows: { control: { type: 'number', min: 1 }, if: { arg: 'autoResize', truthy: true } },
    showCount: { control: 'boolean' },
    maxLength: { control: { type: 'number', min: 0 } },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    mono: { control: 'boolean' },
  },
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<Meta<StoryArgs>>

export const Playground: Story = {
  args: {
    placeholder: 'What does this service do?',
    helperText: 'Help your team understand its purpose.',
  },
}

export const Floating: Story = {
  render: () => (
    <div className="flex flex-col gap-7">
      <Textarea label="Description" floating />
      <Textarea
        label="Description"
        floating
        defaultValue="Processes payments for the storefront."
      />
      <Textarea label="Notes" floating placeholder="Add context for your team…" />
      <Textarea label="Reason" floating required error="Explain why this change is needed." />
      <Textarea
        label="A long description label that should truncate safely on a narrow screen"
        floating
      />
    </div>
  ),
}

/** Both the resting and floated labels must show the backdrop through them, without a patch. */
export const FloatingOnSurfaces: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-7 rounded-xl bg-surface-raised p-6 shadow-whisper">
        <Textarea label="Empty on card" floating />
        <Textarea
          label="Filled on card"
          floating
          defaultValue="A transparent label on a raised surface."
        />
      </div>
      <div className="flex flex-col gap-7 rounded-xl bg-linear-to-br from-bg via-surface-raised to-bg p-6">
        <Textarea label="Empty on gradient" floating />
        <Textarea
          label="Filled on gradient"
          floating
          defaultValue="No solid background behind the label."
        />
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Textarea
          key={size}
          label={`${size} · three rows`}
          size={size}
          placeholder="Write a description…"
        />
      ))}
    </div>
  ),
}

export const AutoResize: Story = {
  args: {
    autoResize: true,
    minRows: 3,
    helperText: 'Type multiple lines, then delete them. Height grows and shrinks with the text.',
    placeholder: 'Start writing…',
  },
}

export const CappedAutoResize: Story = {
  args: {
    autoResize: true,
    minRows: 3,
    maxRows: 5,
    floating: true,
    defaultValue:
      'First line\nSecond line\nThird line\nFourth line\nFifth line\nSixth line\nSeventh line',
    helperText: 'Three to five rows. Scroll inside after five; delete lines to shrink.',
  },
}

export const CharacterCount: Story = {
  args: {
    showCount: true,
    maxLength: 160,
    defaultValue: 'Processes payments for the storefront.',
    helperText: 'Keep the description brief.',
  },
}

export const CountWithoutLimit: Story = { args: { showCount: true } }

export const Error: Story = {
  args: {
    error: 'Add a more detailed description before saving.',
    defaultValue: 'API',
    maxLength: 160,
    showCount: true,
    required: true,
  },
}

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 'Processes payments for the storefront.', showCount: true },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Processes payments for the storefront.' },
}

export const NoResize: Story = { args: { resize: 'none', rows: 4 } }

export const Monospace: Story = {
  args: {
    label: 'Deployment notes',
    mono: true,
    autoResize: true,
    defaultValue: 'image: ghcr.io/acme/payments:v2.1.0\nreplicas: 3',
    helperText: 'Spellcheck, autocorrect and autocapitalization are off.',
  },
}

export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = useState('Processes payments.')
    return (
      <div className="flex flex-col gap-4">
        <Textarea
          label="Description"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoResize
          maxRows={5}
          maxLength={80}
          showCount
        />
        <div className="flex flex-wrap gap-2">
          <Button intent="secondary" onClick={() => setValue('')}>
            Clear
          </Button>
          <Button
            intent="secondary"
            onClick={() =>
              setValue(
                'An external value can exceed maxLength.\nIt stays intact for the user to review.\nLine three\nLine four\nLine five\nLine six',
              )
            }
          >
            Load long value
          </Button>
        </div>
      </div>
    )
  },
}

export const FormReset: Story = {
  render: () => (
    <form className="flex flex-col gap-4">
      <Textarea
        name="description"
        label="Description"
        defaultValue="Original description."
        autoResize
        maxRows={5}
        showCount
        maxLength={300}
      />
      <Button type="reset" intent="secondary" className="self-start">
        Reset form
      </Button>
    </form>
  ),
}

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-col gap-7">
      <Textarea
        label="Description"
        placeholder="Write a description…"
        helperText="Uses the existing dark theme tokens."
      />
      <Textarea
        label="Notes"
        floating
        defaultValue="Transparent label, including on dark surfaces."
      />
      <Textarea label="Reason" floating error="A reason is required." showCount maxLength={160} />
    </div>
  ),
}

export const InDialog: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button intent="secondary" onClick={() => setOpen(true)}>
          Edit description
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogHeader
            title="Edit description"
            description="Tell the team what this service does."
          />
          <DialogBody>
            <Textarea
              label="Description"
              floating
              autoResize
              minRows={3}
              maxRows={6}
              maxLength={300}
              showCount
              // oxlint-disable-next-line jsx-a11y/no-autofocus -- initial focus in an explicitly opened modal
              autoFocus
              defaultValue="Processes payments for the storefront."
            />
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}
