import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { usePressFeedback } from '../../hooks/use-press-feedback'
import { cn } from '../../lib/cn'
import { Tooltip, type TooltipProps } from '../tooltip'

const buttonVariants = cva(
  [
    'relative inline-flex cursor-pointer items-center justify-center font-medium whitespace-nowrap',
    'touch-manipulation select-none [-webkit-tap-highlight-color:transparent]',
    'transition-[color,background-color,box-shadow,opacity,scale] duration-150 ease-out',
    // Set by usePressFeedback; unlike :active it clears on pointercancel (touch scroll) and drag-off
    'data-pressed:scale-[0.97]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    // Invisible edge that forced-colors mode paints, so bg-only buttons keep a visible boundary.
    // An overlay instead of a real border keeps the tuned outer size.
    'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-transparent',
    'forced-colors:after:border-[ButtonText]',
    // >=44px hit target on touch without changing the visual size
    'pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2',
    'pointer-coarse:before:size-full pointer-coarse:before:min-h-11 pointer-coarse:before:min-w-11',
    'pointer-coarse:before:-translate-1/2',
  ],
  {
    variants: {
      intent: {
        // Warm Brown: the only chromatic button
        primary:
          'bg-primary text-primary-fg rounded-md shadow-[0_0_0_1px_var(--color-primary)] hover:not-aria-disabled:opacity-90',
        // Warm Sand: the workhorse
        secondary:
          'bg-surface-muted text-fg-strong rounded-md shadow-[0_0_0_1px_var(--color-ring)] hover:not-aria-disabled:bg-ring',
        // White Surface: shifts to secondary background on hover
        surface: 'bg-surface-raised text-fg rounded-lg hover:not-aria-disabled:bg-surface-muted',
        // Dark Charcoal: inverted emphasis
        dark: 'bg-inverse text-inverse-fg rounded-md shadow-[0_0_0_1px_var(--color-ring)] hover:not-aria-disabled:opacity-90',
        // No chrome until hover: toolbars, table rows
        ghost: 'bg-transparent text-fg rounded-md hover:not-aria-disabled:bg-surface-muted',
      },
      size: {
        // Supabase-like scale: compact height, 14px text
        sm: 'h-8.5 px-3 text-sm',
        md: 'h-9.5 px-4 text-sm',
        lg: 'h-10.5 px-5 text-base',
      },
      tone: { default: '', danger: '' },
      fullWidth: { true: 'w-full', false: '' },
      // Icon-only: width follows the size's height
      square: { true: 'aspect-square px-0', false: '' },
    },
    compoundVariants: [
      {
        intent: 'primary',
        tone: 'danger',
        class: 'bg-danger text-danger-fg shadow-[0_0_0_1px_var(--color-danger)]',
      },
      // Outline-ish danger fills on hover (GitHub pattern); danger text on the darker hover bg would fail contrast
      {
        intent: 'secondary',
        tone: 'danger',
        class:
          'text-danger shadow-[0_0_0_1px_var(--color-danger)] hover:not-aria-disabled:bg-danger hover:not-aria-disabled:text-danger-fg',
      },
      {
        intent: 'surface',
        tone: 'danger',
        class:
          'text-danger hover:not-aria-disabled:bg-danger hover:not-aria-disabled:text-danger-fg',
      },
      // Strong emphasis + danger is just solid danger, same as primary
      {
        intent: 'dark',
        tone: 'danger',
        class: 'bg-danger text-danger-fg shadow-[0_0_0_1px_var(--color-danger)]',
      },
      {
        intent: 'ghost',
        tone: 'danger',
        class: 'text-danger hover:not-aria-disabled:bg-danger/10',
      },
    ],
    defaultVariants: {
      intent: 'primary',
      size: 'md',
      tone: 'default',
      fullWidth: false,
      square: false,
    },
  },
)

type Size = 'sm' | 'md' | 'lg'

const spinnerSize = { sm: 16, md: 18, lg: 20 } as const
const iconSize = {
  sm: '[&_svg]:size-4',
  md: '[&_svg]:size-4',
  lg: '[&_svg]:size-[18px]',
} as const
// The side with an icon looks heavier, so it gets ~4px less padding
const iconStartPadding = { sm: 'ps-2', md: 'ps-3', lg: 'ps-4' } as const
const iconEndPadding = { sm: 'pe-2', md: 'pe-3', lg: 'pe-4' } as const

type ContentProps = {
  size: Size
  ripple: boolean
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
}

/** Press layer + content + spinner; shared by every button-styled host. */
function ButtonContent({
  size,
  ripple,
  loading = false,
  iconLeft,
  iconRight,
  children,
}: ContentProps) {
  const layerRef = usePressFeedback<HTMLSpanElement>(ripple)

  return (
    <>
      <span
        ref={layerRef}
        data-ripple={ripple ? '' : undefined}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] forced-colors:hidden"
      />
      {/* Content stays in layout (keeps width + accessible name) and fades out under the spinner */}
      <span
        className={cn(
          'relative inline-flex items-center gap-2 [&_svg]:shrink-0',
          iconSize[size],
          loading && 'opacity-0',
        )}
      >
        {iconLeft && (
          <span aria-hidden className="inline-flex">
            {iconLeft}
          </span>
        )}
        {children}
        {iconRight && (
          <span aria-hidden className="inline-flex">
            {iconRight}
          </span>
        )}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle
            className="animate-spin forced-colors:text-[ButtonText]"
            size={spinnerSize[size]}
            aria-hidden
          />
        </span>
      )}
    </>
  )
}

function iconPadding(size: Size, iconLeft: ReactNode, iconRight: ReactNode) {
  return [iconLeft ? iconStartPadding[size] : '', iconRight ? iconEndPadding[size] : '']
}

function stateClass(disabled: boolean, loading: boolean) {
  if (loading) return 'cursor-progress opacity-70'
  if (disabled)
    return 'cursor-not-allowed opacity-50 forced-colors:opacity-100 forced-colors:text-[GrayText] forced-colors:after:border-[GrayText]'
}

type BaseProps = Omit<ComponentProps<'button'>, 'children'> &
  Omit<VariantProps<typeof buttonVariants>, 'square'> & {
    /** Shows a spinner, keeps width and focus, blocks activation. */
    loading?: boolean
    /** Announced through a polite live region while loading. */
    loadingText?: string
    /** Tooltip explaining why the button is disabled; shown on hover and keyboard focus. */
    disabledReason?: string
    /** Material-style press ripple; on by default. */
    ripple?: boolean
  }

type TextButtonProps = BaseProps & {
  icon?: never
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
  tooltip?: never
  tooltipSide?: never
}

type IconOnlyButtonProps = Omit<BaseProps, 'aria-label' | 'fullWidth'> & {
  /** Renders a square icon-only button. */
  icon: NonNullable<ReactNode>
  /** Required: an icon has no text to name the button. */
  'aria-label': string
  /** Show the label as a tooltip on hover/focus. */
  tooltip?: boolean
  tooltipSide?: TooltipProps['side']
  fullWidth?: never
  children?: never
  iconLeft?: never
  iconRight?: never
}

export type ButtonProps = TextButtonProps | IconOnlyButtonProps

type ImplProps = Omit<BaseProps, 'disabledReason'> & {
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
  tooltip?: Omit<TooltipProps, 'children' | 'className'>
  square?: boolean
}

function ButtonImpl({
  className,
  intent,
  size,
  tone,
  fullWidth,
  square,
  loading = false,
  loadingText = 'Loading',
  disabled = false,
  iconLeft,
  iconRight,
  ripple,
  tooltip,
  type = 'button',
  onClick,
  children,
  ...props
}: ImplProps) {
  const s = size ?? 'md'
  const inert = disabled || loading

  // Never native `disabled`: it drops focus, so keyboard and screen reader users lose their place.
  // aria-disabled keeps it focusable; activation (incl. form submit) is blocked here instead.
  const button = (
    <button
      {...props}
      type={type}
      data-slot="button"
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ intent, size, tone, fullWidth, square }),
        iconPadding(s, iconLeft, iconRight),
        stateClass(disabled, loading),
        className,
      )}
      onClick={(e) => {
        if (inert) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
    >
      <ButtonContent
        size={s}
        ripple={ripple ?? true}
        loading={loading}
        iconLeft={iconLeft}
        iconRight={iconRight}
      >
        {children}
      </ButtonContent>
    </button>
  )

  return (
    <>
      {tooltip ? (
        <Tooltip {...tooltip} className={fullWidth ? 'flex w-full' : undefined}>
          {button}
        </Tooltip>
      ) : (
        button
      )}
      {/* Outside the button so it never joins the accessible name; present before loading so the change is announced */}
      <span aria-live="polite" aria-atomic className="sr-only">
        {loading ? loadingText : ''}
      </span>
    </>
  )
}

function IconOnlyButton({
  icon,
  tooltip = true,
  tooltipSide,
  disabledReason,
  className,
  size,
  ...props
}: IconOnlyButtonProps) {
  const reason = props.disabled ? disabledReason : undefined
  // The label tooltip repeats the accessible name, so it is not wired as a description
  const tip = reason
    ? { content: reason, side: tooltipSide }
    : tooltip
      ? { content: props['aria-label'], side: tooltipSide, describe: false }
      : disabledReason !== undefined
        ? { content: undefined }
        : undefined

  // Explicit children win over any stray `children` in the spread
  return (
    <ButtonImpl {...props} size={size} tooltip={tip} square className={className}>
      {icon}
    </ButtonImpl>
  )
}

export function Button(props: ButtonProps) {
  if (props.icon !== undefined) return <IconOnlyButton {...props} />

  const { disabledReason, ...rest } = props
  // The Tooltip wrapper exists whenever a reason is passed, so toggling `disabled` never remounts (and unfocuses) the button
  const tooltip =
    disabledReason === undefined
      ? undefined
      : { content: rest.disabled ? disabledReason : undefined }
  return <ButtonImpl {...rest} tooltip={tooltip} />
}
