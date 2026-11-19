import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import {
  Children,
  cloneElement,
  type ComponentProps,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { usePressFeedback } from '../../hooks/use-press-feedback'
import { cn } from '../../lib/cn'
import { Slot, type SlotProps, wrapChildren } from '../../lib/slot'
import { Tooltip, type TooltipProps } from '../tooltip'

const buttonVariants = cva(
  [
    'relative inline-flex cursor-pointer items-center justify-center border font-medium whitespace-nowrap',
    'touch-manipulation select-none [-webkit-tap-highlight-color:transparent]',
    'transition-[color,background-color,border-color,opacity,scale] duration-150 ease-out',
    // Set by usePressFeedback; unlike :active it clears on pointercancel (touch scroll) and drag-off
    'data-pressed:scale-[0.97]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    // A real 1px border on every intent (transparent when chromeless) sits inside the fixed height,
    // so the outer edge matches Field's at each size. Never draw the edge with an outer shadow:
    // it paints outside the box and makes the button look 2px taller than its neighbours.
    // Forced colors paints the border, so bg-only buttons keep a visible boundary.
    'forced-colors:border-[ButtonText]',
    // >=44px hit target on touch without changing the visual size
    'pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2',
    'pointer-coarse:before:size-full pointer-coarse:before:min-h-11 pointer-coarse:before:min-w-11',
    'pointer-coarse:before:-translate-1/2',
  ],
  {
    variants: {
      intent: {
        // Brand color: the one primary call to action
        primary:
          'bg-primary text-primary-fg rounded-lg border-primary hover:not-aria-disabled:opacity-90',
        // Muted surface: the workhorse
        secondary:
          'bg-surface-muted text-fg-strong rounded-lg border-ring hover:not-aria-disabled:bg-ring',
        // Raised surface: shifts to secondary background on hover
        surface:
          'bg-surface-raised text-fg rounded-xl border-transparent hover:not-aria-disabled:bg-surface-muted',
        // Inverse: strong emphasis without the brand color
        dark: 'bg-inverse text-inverse-fg rounded-lg border-ring hover:not-aria-disabled:opacity-90',
        // No chrome until hover: toolbars, table rows
        ghost:
          'bg-transparent text-fg rounded-lg border-transparent hover:not-aria-disabled:bg-surface-muted',
      },
      size: {
        // Supabase-like scale: compact height, 14px text. Heights include the 1px border and match
        // Field's (34/38/42); padding is 1px under the 12/16/20 rhythm to absorb the border.
        sm: 'h-8.5 px-2.75 text-sm',
        md: 'h-9.5 px-3.75 text-sm',
        lg: 'h-10.5 px-4.75 text-base',
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
        class: 'bg-danger text-danger-fg border-danger',
      },
      // Outline-ish danger fills on hover (GitHub pattern); danger text on the darker hover bg would fail contrast
      {
        intent: 'secondary',
        tone: 'danger',
        class:
          'text-danger border-danger hover:not-aria-disabled:bg-danger hover:not-aria-disabled:text-danger-fg',
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
        class: 'bg-danger text-danger-fg border-danger',
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
const iconStartPadding = { sm: 'ps-1.75', md: 'ps-2.75', lg: 'ps-3.75' } as const
const iconEndPadding = { sm: 'pe-1.75', md: 'pe-2.75', lg: 'pe-3.75' } as const

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
        className="pointer-events-none absolute -inset-px overflow-hidden rounded-[inherit] forced-colors:hidden"
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
    return 'cursor-not-allowed opacity-50 forced-colors:opacity-100 forced-colors:text-[GrayText] forced-colors:border-[GrayText]'
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

/** With `asChild` the host is your element (a router Link): loading and `type` are button-only. */
type AsChildProps = {
  /**
   * Render the only child (e.g. a router Link) instead of a `<button>`, with the button's props,
   * classes, ref and content merged into it.
   */
  asChild: true
  children: ReactElement
  loading?: never
  loadingText?: never
  type?: never
}

type TextButtonProps = BaseProps & {
  icon?: never
  iconLeft?: ReactNode
  iconRight?: ReactNode
  tooltip?: never
  tooltipSide?: never
} & ({ asChild?: false; children?: ReactNode } | AsChildProps)

type IconOnlyButtonProps = Omit<BaseProps, 'aria-label' | 'fullWidth'> & {
  /** Renders a square icon-only button. */
  icon: NonNullable<ReactNode>
  /** Required: an icon has no text to name the button. */
  'aria-label': string
  /** Show the label as a tooltip on hover/focus. */
  tooltip?: boolean
  tooltipSide?: TooltipProps['side']
  fullWidth?: never
  iconLeft?: never
  iconRight?: never
} & ({ asChild?: false; children?: never } | AsChildProps)

export type ButtonProps = TextButtonProps | IconOnlyButtonProps

type ImplProps = Omit<BaseProps, 'disabledReason'> & {
  asChild?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
  tooltip?: Omit<TooltipProps, 'children' | 'className'>
  square?: boolean
}

// A disabled link must not navigate. Capture runs before the Link's own click handler, and stopping
// the event there keeps the router (and the caller's onClick) from ever seeing it.
function blockActivation(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
}

function ButtonImpl({
  asChild = false,
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
  onClickCapture,
  onAuxClickCapture,
  children,
  ...props
}: ImplProps) {
  const s = size ?? 'md'
  const inert = disabled || loading
  const classes = cn(
    buttonVariants({ intent, size, tone, fullWidth, square }),
    iconPadding(s, iconLeft, iconRight),
    stateClass(disabled, loading),
    className,
  )
  const content = (inner: ReactNode) => (
    <ButtonContent
      size={s}
      ripple={ripple ?? true}
      loading={loading}
      iconLeft={iconLeft}
      iconRight={iconRight}
    >
      {inner}
    </ButtonContent>
  )

  if (asChild) {
    const child = Children.only(children)
    if (!isValidElement<{ children?: unknown }>(child)) return null
    // Same as the <button>: aria-disabled keeps it focusable, activation is blocked instead
    const link = (
      <Slot
        {...(props as SlotProps)}
        data-slot="button"
        aria-disabled={disabled || undefined}
        className={classes}
        onClick={onClick as SlotProps['onClick']}
        onClickCapture={disabled ? blockActivation : (onClickCapture as SlotProps['onClick'])}
        // Middle click opens a new tab without a click event
        onAuxClickCapture={
          disabled ? blockActivation : (onAuxClickCapture as SlotProps['onAuxClickCapture'])
        }
      >
        {cloneElement(child, {
          children: wrapChildren(child.props.children, content),
        })}
      </Slot>
    )
    return tooltip ? (
      <Tooltip {...tooltip} className={fullWidth ? 'flex w-full' : undefined}>
        {link}
      </Tooltip>
    ) : (
      link
    )
  }

  // Never native `disabled`: it drops focus, so keyboard and screen reader users lose their place.
  // aria-disabled keeps it focusable; activation (incl. form submit) is blocked here instead.
  const button = (
    <button
      {...props}
      type={type}
      data-slot="button"
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      className={classes}
      onClickCapture={onClickCapture}
      onAuxClickCapture={onAuxClickCapture}
      onClick={(e) => {
        if (inert) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
    >
      {content(children)}
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
  children,
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

  // The icon is the content: inside the asChild element, or the <button>'s own children
  const child = Children.toArray(children)[0]
  return (
    <ButtonImpl {...props} size={size} tooltip={tip} square className={className}>
      {props.asChild && isValidElement(child) ? cloneElement(child, undefined, icon) : icon}
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
