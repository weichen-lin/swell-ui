import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Badge, type BadgeProps, type BadgeTone } from '../src/components/badge'
import { Tooltip } from '../src/components/tooltip'
import {
  Box,
  CircleArrowUp,
  CircleCheck,
  CircleHelp,
  CirclePause,
  CircleX,
  Ghost,
  Heart,
  HeartCrack,
  TriangleAlert,
} from './_helpers/story-icons'

const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const satisfies BadgeTone[]
const variants = ['subtle', 'outline', 'solid'] as const
const sizes = ['sm', 'md'] as const

// Storybook select control: option name -> icon element
const iconArgType = {
  control: 'select',
  options: ['none', 'Heart', 'HeartCrack', 'CircleCheck', 'CircleX', 'TriangleAlert', 'Box'],
  mapping: {
    none: undefined,
    Heart: <Heart />,
    HeartCrack: <HeartCrack />,
    CircleCheck: <CircleCheck />,
    CircleX: <CircleX />,
    TriangleAlert: <TriangleAlert />,
    Box: <Box />,
  },
} as const

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-max max-w-full rounded-xl bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: { tone: 'neutral', variant: 'subtle', size: 'md', busy: false, children: 'Healthy' },
  argTypes: {
    tone: { control: 'select', options: tones },
    variant: { control: 'radio', options: variants },
    size: { control: 'radio', options: sizes },
    icon: iconArgType,
    busy: { control: 'boolean' },
    context: { control: 'text' },
    children: { control: 'text' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { args: { tone: 'success', icon: <Heart />, context: 'Health' } }

/** Every tone x variant; each size has its own grid. Same-size rows prove the variants share one box. */
export const TonesAndVariants: Story = {
  parameters: { wide: true },
  render: () => (
    <div className="flex flex-col gap-8">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-3">
          <h3 className="m-0 text-sm text-fg-muted">{size}</h3>
          {tones.map((tone) => (
            <div key={tone} className="flex items-center gap-3">
              <span className="w-16 text-xs text-fg-muted">{tone}</span>
              {variants.map((variant) => (
                <Badge key={variant} tone={tone} variant={variant} size={size} icon={<Heart />}>
                  {variant}
                </Badge>
              ))}
              <Badge tone={tone} size={size}>
                no icon
              </Badge>
              <Badge tone={tone} size={size} busy>
                busy
              </Badge>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}

type Entry = { label: string; tone: BadgeTone; icon?: ReactNode; busy?: boolean }

const argoGroups: { context: string; entries: Entry[] }[] = [
  {
    context: 'Health',
    entries: [
      { label: 'Healthy', tone: 'success', icon: <Heart /> },
      { label: 'Progressing', tone: 'info', busy: true },
      { label: 'Degraded', tone: 'danger', icon: <HeartCrack /> },
      { label: 'Suspended', tone: 'neutral', icon: <CirclePause /> },
      { label: 'Missing', tone: 'warning', icon: <Ghost /> },
      { label: 'Unknown', tone: 'neutral', icon: <CircleHelp /> },
    ],
  },
  {
    context: 'Sync',
    entries: [
      { label: 'Synced', tone: 'success', icon: <CircleCheck /> },
      { label: 'OutOfSync', tone: 'warning', icon: <CircleArrowUp /> },
      { label: 'Unknown', tone: 'neutral', icon: <CircleHelp /> },
    ],
  },
  {
    context: 'Operation',
    entries: [
      { label: 'Running', tone: 'info', busy: true },
      { label: 'Succeeded', tone: 'success', icon: <CircleCheck /> },
      { label: 'Failed', tone: 'danger', icon: <CircleX /> },
      { label: 'Error', tone: 'danger', icon: <TriangleAlert /> },
      { label: 'Terminating', tone: 'neutral', busy: true },
    ],
  },
]

function ArgoStatusGroups({ size }: Pick<BadgeProps, 'size'>) {
  return (
    <div className="flex flex-col gap-5">
      {argoGroups.map((group) => (
        <div key={group.context} className="flex flex-col gap-2">
          <h3 className="m-0 text-sm text-fg-muted">{group.context}</h3>
          <div className="flex flex-wrap gap-2">
            {group.entries.map((e) => (
              <Badge
                key={e.label}
                tone={e.tone}
                size={size}
                icon={e.icon}
                busy={e.busy}
                context={group.context}
              >
                {e.label}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** All 14 Argo CD statuses (6 health, 3 sync, 5 operation). In-progress ones use `busy`. */
export const ArgoStatuses: Story = { render: () => <ArgoStatusGroups /> }

export const Environments: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge tone="neutral" variant="solid">
        prod
      </Badge>
      <Badge tone="neutral" variant="outline">
        staging
      </Badge>
      <Badge tone="neutral" variant="outline">
        dev
      </Badge>
    </div>
  ),
}

/**
 * One application-list row. The long version tag is truncated with `max-w-*` on the badge;
 * the Tooltip shows the full value. A badge is not focusable, so the tooltip trigger is a
 * focusable wrapper (hover works regardless; keyboard users reach it via the wrapper).
 */
export const InTableRow: Story = {
  parameters: { wide: true },
  render: () => (
    <div className="flex w-160 items-center gap-4 rounded-xl border border-border-strong bg-surface-raised px-4 py-3">
      <span className="w-40 truncate text-sm font-medium text-fg">payments-api</span>
      <Badge tone="neutral" variant="solid" size="sm">
        prod
      </Badge>
      <Badge tone="warning" size="sm" icon={<CircleArrowUp />} context="Sync">
        OutOfSync
      </Badge>
      <Badge tone="success" size="sm" icon={<Heart />} context="Health">
        Healthy
      </Badge>
      <Tooltip content="release-2026.10.15-rc.3+sha.3f9c2a1e8b7d">
        <span
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the tooltip needs a focusable trigger; the badge itself stays static
          tabIndex={0}
          className="inline-flex rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
        >
          <Badge tone="neutral" variant="outline" size="sm" className="max-w-28 font-mono">
            release-2026.10.15-rc.3+sha.3f9c2a1e8b7d
          </Badge>
        </span>
      </Tooltip>
    </div>
  ),
}
