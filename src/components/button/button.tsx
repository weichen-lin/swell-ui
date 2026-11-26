import { cva, type VariantProps } from 'class-variance-authority'
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
import { Spinner } from '../../lib/icon-slots'
import { Slot, type SlotProps, wrapChildren } from '../../lib/slot'
import { Tooltip, type TooltipProps } from '../tooltip'

// Filled intents rest raised and rise by --lift on hover. Ghost has no chrome to raise: it only sinks
// when pressed. Disabled and loading (aria-disabled) rest flat: depth says "press me", which an
// inert button can't honour, and dimming alone would leave it looking ready.
// Hover also changes the fill, but depth now carries part of that cue, so the raised intents scale
// the fill change by --hover-strength (0.5 by default, 1 where flat.css removes the depth). Opacity
// hovers fade to 1 - 0.1 * strength; fill hovers mix that share of the hover color into the rest one.
// Pressed ends the fade (opacity-100) so its fill shows at full strength: a faded pressed fill let the
// page through, dropping text contrast and blurring pressed against hover.
// `dark` can't fade: on dark its fill is the page color, so it mixes toward --color-inverse-hover.
// Guards (not disabled, not pressed) sit inside :where(), so every state rule here weighs one class
// and a caller's `hover:bg-x` or `data-pressed:bg-x` in className outranks it. Hover also skips
// [data-pressed]: hover and pressed never match together, so the pressed fill doesn't rest on order.
const raised = [
  '[&:where(:not([aria-disabled=true]):not([data-pressed]))]:[--btn-shadow:var(--shadow-raised),var(--shadow-lift)]',
  '[@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:[--btn-shadow:var(--shadow-raised),var(--shadow-lift-hover)]',
  '[@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:-translate-y-(--lift)',
]

const buttonVariants = cva(
  [
    'relative inline-flex cursor-pointer items-center justify-center border font-medium whitespace-nowrap',
    // Horizontal padding comes from two variables so `hang` can read the same numbers: size sets
    // --btn-p, an icon on one side overrides that side. Square (icon-only) sets --btn-p to the inset
    // that centers its icon, for `hang` only: its padding is zero.
    '[--btn-ps:var(--btn-p)] [--btn-pe:var(--btn-p)] ps-(--btn-ps) pe-(--btn-pe)',
    'touch-manipulation select-none [-webkit-tap-highlight-color:transparent]',
    'transition-[color,background-color,border-color,opacity,box-shadow,translate] duration-150 ease-out',
    // Depth, from the shadow and a lift alone, so the box never changes size or place in the layout.
    // Filled intents rest raised (see `raised`); every state's --btn-shadow is the same list, two
    // inset bevel layers then one outer lift, so each layer interpolates against its own kind (zero
    // transparent placeholders, not `none`). Pressed looks sunken: the bevel turns into
    // --shadow-pressed and the lift drops. data-pressed is set by usePressFeedback; unlike :active
    // it clears on pointercancel (touch scroll) and drag-off.
    'shadow-(--btn-shadow) [--btn-shadow:inset_0_0_0_0_transparent,inset_0_0_0_0_transparent,0_0_0_0_transparent]',
    'data-pressed:[--btn-shadow:var(--shadow-pressed),0_0_0_0_transparent]',
    // Forced colors drops shadows and fills: invert to the highlight pair instead
    'forced-colors:data-pressed:bg-[Highlight] forced-colors:data-pressed:text-[HighlightText]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    // A real 1px border on every intent (transparent when chromeless) sits inside the fixed height,
    // so the outer edge matches Field's at each size. Never draw the edge with an outer shadow:
    // it paints outside the box and makes the button look 2px taller than its neighbours. The only
    // outer shadow is the faint, blurred lift (--shadow-lift*), the same drop Field shows on hover.
    // Forced colors paints the border, so bg-only buttons keep a visible boundary.
    'forced-colors:border-[ButtonText]',
    // >=44px hit target on touch without changing the visual size
    'pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2',
    'pointer-coarse:before:size-full pointer-coarse:before:min-h-11 pointer-coarse:before:min-w-11',
    'pointer-coarse:before:-translate-1/2',
  ],
  {
    variants: {
      /**
       * Visual weight: `primary` for the one main action, `secondary` as the workhorse, `surface` a
       * borderless raised fill, `dark` strong emphasis without the brand color, `ghost` no chrome
       * until hover (toolbars, table rows).
       * @defaultValue 'primary'
       */
      intent: {
        // Brand color: the one primary call to action
        primary: [
          ...raised,
          'bg-primary text-primary-fg rounded-control border-primary [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:opacity-[calc(1-0.1*var(--hover-strength))] [&:where([data-pressed]:not([aria-disabled=true]))]:bg-primary-pressed [&:where([data-pressed]:not([aria-disabled=true]))]:opacity-100',
        ],
        // Muted surface: the workhorse
        secondary: [
          ...raised,
          'bg-surface-muted text-fg-strong rounded-control border-ring [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-[color-mix(in_oklab,var(--color-ring)_calc(var(--hover-strength)*100%),var(--color-surface-muted))] [&:where([data-pressed]:not([aria-disabled=true]))]:bg-surface-inset',
        ],
        // Raised surface: shifts toward the secondary background on hover
        surface: [
          ...raised,
          'bg-surface-raised text-fg rounded-control border-transparent [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-[color-mix(in_oklab,var(--color-surface-muted)_calc(var(--hover-strength)*100%),var(--color-surface-raised))] [&:where([data-pressed]:not([aria-disabled=true]))]:bg-surface-inset',
        ],
        // Inverse: strong emphasis without the brand color
        dark: [
          ...raised,
          'bg-inverse text-inverse-fg rounded-control border-ring [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-[color-mix(in_oklab,var(--color-inverse-hover)_calc(var(--hover-strength)*100%),var(--color-inverse))] [&:where([data-pressed]:not([aria-disabled=true]))]:bg-inverse-pressed',
        ],
        // No chrome until hover: toolbars, table rows
        ghost:
          'bg-transparent text-fg rounded-control border-transparent [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-surface-muted [&:where([data-pressed]:not([aria-disabled=true]))]:bg-surface-inset',
      },
      /**
       * Height and text size; heights (34 / 38 / 42px) match the text fields'.
       * @defaultValue 'md'
       */
      size: {
        // Supabase-like scale: compact height, 14px text. Heights include the 1px border and match
        // Field's (34/38/42) via the --spacing-control-* tokens; padding is 1px under the 12/16/20 rhythm to absorb the border.
        sm: 'h-control-sm text-sm [--btn-p:--spacing(2.75)]',
        md: 'h-control-md text-sm [--btn-p:--spacing(3.75)]',
        lg: 'h-control-lg text-base [--btn-p:--spacing(4.75)]',
      },
      /**
       * `danger` recolors any intent for destructive actions.
       * @defaultValue 'default'
       */
      tone: { default: '', danger: '' },
      /**
       * Stretches to the container's width. Not available on icon-only buttons.
       * @defaultValue false
       */
      fullWidth: { true: 'w-full', false: '' },
      // Icon-only: width follows the size's height. No inline padding: justify-center centers the
      // icon, so a caller's larger icon (`size-6` on the svg) stays centered in the same square
      square: { true: 'aspect-square ps-0 pe-0', false: '' },
      // Negative inline margin = the side's real inset (padding + the 1px border), so the label or
      // icon, not the button's box, lines up with the surrounding content edge
      hang: {
        start: '-ms-[(var(--btn-ps)+1px)]',
        end: '-me-[(var(--btn-pe)+1px)]',
        both: '-ms-[(var(--btn-ps)+1px)] -me-[(var(--btn-pe)+1px)]',
      },
    },
    compoundVariants: [
      // Icon-only: the inset that centers the default icon (16px, 18px on lg) in the square, border
      // included. Not applied as padding (see `square`); `hang` reads it to pull the icon to the edge
      {
        square: true,
        size: 'sm',
        class: '[--btn-p:calc((var(--spacing-control-sm)-1rem)/2-1px)]',
      },
      {
        square: true,
        size: 'md',
        class: '[--btn-p:calc((var(--spacing-control-md)-1rem)/2-1px)]',
      },
      {
        square: true,
        size: 'lg',
        class: '[--btn-p:calc((var(--spacing-control-lg)-18px)/2-1px)]',
      },
      {
        intent: 'primary',
        tone: 'danger',
        class:
          'bg-danger text-danger-fg border-danger [&:where([data-pressed]:not([aria-disabled=true]))]:bg-danger-pressed',
      },
      // Outline-ish danger fills on hover (GitHub pattern); danger text on the darker hover bg would fail contrast
      {
        intent: 'secondary',
        tone: 'danger',
        class:
          'text-danger border-danger [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-danger [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:text-danger-fg [&:where([data-pressed]:not([aria-disabled=true]))]:bg-danger-pressed [&:where([data-pressed]:not([aria-disabled=true]))]:text-danger-fg',
      },
      {
        intent: 'surface',
        tone: 'danger',
        class:
          'text-danger [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-danger [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:text-danger-fg [&:where([data-pressed]:not([aria-disabled=true]))]:bg-danger-pressed [&:where([data-pressed]:not([aria-disabled=true]))]:text-danger-fg',
      },
      // Strong emphasis + danger is just solid danger, same as primary. The base hover fill (inverse)
      // is overridden; hover fades like primary instead (danger is no page-colored fill, so it shows)
      {
        intent: 'dark',
        tone: 'danger',
        class:
          'bg-danger text-danger-fg border-danger [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-danger [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:opacity-[calc(1-0.1*var(--hover-strength))] [&:where([data-pressed]:not([aria-disabled=true]))]:bg-danger-pressed [&:where([data-pressed]:not([aria-disabled=true]))]:opacity-100',
      },
      {
        intent: 'ghost',
        tone: 'danger',
        class:
          'text-danger [@media(hover:hover)]:[&:where(:hover:not([aria-disabled=true]):not([data-pressed]))]:bg-danger/10 [&:where([data-pressed]:not([aria-disabled=true]))]:bg-danger-inset',
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

const spinnerSize = {
  sm: '[&_:where(svg:not([class*=size-]))]:size-4',
  md: '[&_:where(svg:not([class*=size-]))]:size-[18px]',
  lg: '[&_:where(svg:not([class*=size-]))]:size-5',
} as const
const iconSize = {
  sm: '[&_:where(svg:not([class*=size-]))]:size-4',
  md: '[&_:where(svg:not([class*=size-]))]:size-4',
  lg: '[&_:where(svg:not([class*=size-]))]:size-[18px]',
} as const
// The side with an icon looks heavier, so it gets ~4px less padding
const iconStartPadding = {
  sm: '[--btn-ps:--spacing(1.75)]',
  md: '[--btn-ps:--spacing(2.75)]',
  lg: '[--btn-ps:--spacing(3.75)]',
} as const
const iconEndPadding = {
  sm: '[--btn-pe:--spacing(1.75)]',
  md: '[--btn-pe:--spacing(2.75)]',
  lg: '[--btn-pe:--spacing(3.75)]',
} as const

type ContentProps = {
  size: Size
  ripple: boolean
  loading?: boolean
  loadingIcon?: ReactNode
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
}

/** Press layer + content + spinner; shared by every button-styled host. */
function ButtonContent({
  size,
  ripple,
  loading = false,
  loadingIcon,
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
          'relative inline-flex items-center gap-2 [&_:where(svg:not([class*=shrink]))]:shrink-0',
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
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center [&_:where(svg:not([class*=shrink]))]:shrink-0',
            spinnerSize[size],
          )}
        >
          <Spinner
            icon={loadingIcon}
            className="motion-reduce:[animation-duration:2.5s] forced-colors:text-[ButtonText]"
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
  Omit<VariantProps<typeof buttonVariants>, 'square' | 'hang'> & {
    /**
     * Pulls the button outward by its own horizontal inset on that side (padding plus border), so
     * the label or icon lines up with the surrounding content edge (a card header, a toolbar end)
     * instead of the button's box. Meant for `ghost`, whose box is invisible at rest; on a filled
     * intent the box would stick out of its container. Follows the size, icons and icon-only
     * buttons automatically; a `className` padding override is not tracked.
     */
    hang?: 'start' | 'end' | 'both'
    /**
     * Shows a spinner, keeps width and focus, blocks activation.
     * @defaultValue false
     */
    loading?: boolean
    /**
     * Announced through a polite live region while loading.
     * @defaultValue 'Loading'
     */
    loadingText?: string
    /**
     * Spinner shown while loading, sized to the button and spun by it, so pass a static icon.
     * Defaults to a circular loader.
     */
    loadingIcon?: ReactNode
    /** Tooltip explaining why the button is disabled; shown on hover and keyboard focus. */
    disabledReason?: string
    /**
     * Material-style press ripple.
     * @defaultValue true
     */
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
  loadingIcon?: never
  /**
   * `button` unless set, so a Button inside a form never submits it by accident. Not available
   * with `asChild`.
   * @defaultValue 'button'
   */
  type?: never
}

type TextButtonProps = BaseProps & {
  icon?: never
  /** Icon before the label; hidden from assistive tech, trims the padding on its side. */
  iconLeft?: ReactNode
  /** Icon after the label; hidden from assistive tech, trims the padding on its side. */
  iconRight?: ReactNode
  tooltip?: never
  tooltipSide?: never
} & ({ asChild?: false; children?: ReactNode } | AsChildProps)

type IconOnlyButtonProps = Omit<BaseProps, 'aria-label' | 'fullWidth'> & {
  /** Renders a square icon-only button. */
  icon: NonNullable<ReactNode>
  /** Required: an icon has no text to name the button. */
  'aria-label': string
  /**
   * Show the label as a tooltip on hover/focus.
   * @defaultValue true
   */
  tooltip?: boolean
  /** Side of the label tooltip. */
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
  hang,
  loading = false,
  loadingText = 'Loading',
  loadingIcon,
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
    buttonVariants({ intent, size, tone, fullWidth, square, hang }),
    iconPadding(s, iconLeft, iconRight),
    stateClass(disabled, loading),
    className,
  )
  const content = (inner: ReactNode) => (
    <ButtonContent
      size={s}
      ripple={ripple ?? true}
      loading={loading}
      loadingIcon={loadingIcon}
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
