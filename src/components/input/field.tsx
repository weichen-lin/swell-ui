import {
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefCallback,
  type RefObject,
  useCallback,
  useId,
  useRef,
} from 'react'
import { cn } from '../../lib/cn'
import { MessageIcon, Spinner } from '../../lib/icon-slots'

export type FieldSize = 'sm' | 'md' | 'lg'

type NativeInputProps = Omit<ComponentProps<'input'>, 'size' | 'children'>

/** Props every input in the family shares. */
export type FieldProps = NativeInputProps & {
  /** Visible label, rendered as a real `<label>` above the field. */
  label: string
  /**
   * Outlined floating label: rests inside the field and moves onto the top border.
   * @defaultValue false
   */
  floating?: boolean
  /** Supporting text below the field, linked with aria-describedby. */
  helperText?: ReactNode
  /** Truthy puts the field in the error state; the text replaces helperText. */
  error?: ReactNode
  /**
   * Icon before the error text, sized to it. Defaults to a circled exclamation mark; `false` or
   * `null` hides it.
   */
  errorIcon?: ReactNode
  /**
   * Field height and text size.
   * @defaultValue 'md'
   */
  size?: FieldSize
  /** Decorative leading icon (aria-hidden) or plain text prefix such as `https://`. */
  start?: ReactNode
  /** Decorative trailing icon (aria-hidden) or plain text suffix. */
  end?: ReactNode
  /**
   * Monospace with spellcheck/autocorrect off, for tags, SHAs and hostnames.
   * @defaultValue false
   */
  mono?: boolean
  /**
   * Shows a spinner and announces validatingText; the field stays editable.
   * @defaultValue false
   */
  validating?: boolean
  /**
   * Text announced politely while validating is true.
   * @defaultValue 'Checking…'
   */
  validatingText?: string
  /**
   * Spinner shown while validating, sized to the field's icons and spun by the field (slowed
   * under reduced motion), so pass a static icon. Defaults to a circular loader.
   */
  validatingIcon?: ReactNode
  /** Classes for the `<input>`; `className` goes to the outer wrapper. */
  inputClassName?: string
}

/**
 * Either a visible label, or only an aria-label when the context already names the field
 * (a table cell, a toolbar filter). Floating needs a visible label.
 */
export type FieldLabelProps =
  | {
      /** Visible label, rendered as a real `<label>`. Omit it only when `aria-label` is set. */
      label: string
      /**
       * Outlined floating label that rests inside the field. Needs a visible `label`.
       * @defaultValue false
       */
      floating?: boolean
    }
  | {
      label?: never
      floating?: never
      /** Accessible name when there is no visible `label`. */
      'aria-label': string
    }

type FrameProps = Omit<FieldProps, 'label'> & {
  label?: string
  /** Pass one when the wrapper needs the input (clear, select); otherwise the frame owns it. */
  inputRef?: RefObject<HTMLInputElement | null>
  /** Interactive controls after the end adornment (clear, reveal, copy). */
  actions?: ReactNode
  /** Extra polite announcement (e.g. "Copied"); validatingText takes precedence. */
  status?: string
}

const controlHeight = { sm: 'h-control-sm', md: 'h-control-md', lg: 'h-control-lg' } as const
export const textSize = { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } as const
export const iconSize = {
  sm: '[&_:where(svg:not([class*=size-]))]:size-4',
  md: '[&_:where(svg:not([class*=size-]))]:size-4',
  lg: '[&_:where(svg:not([class*=size-]))]:size-[18px]',
} as const
const inputPadding = { sm: 'px-3', md: 'px-3', lg: 'px-4' } as const
// The side with an icon looks heavier, so it sits ~2-4px closer to the edge (as in Button)
export const startSlotPadding = { sm: 'ps-2', md: 'ps-2.5', lg: 'ps-3' } as const
export const endSlotPadding = { sm: 'pe-2', md: 'pe-2.5', lg: 'pe-3' } as const
const actionsPadding = { sm: 'pe-[3px]', md: 'pe-1', lg: 'pe-1' } as const
/** Compact Button square that fits inside the field's inner height with an even inset. */
export const compactButton = {
  sm: 'size-[calc(var(--spacing-control-sm)-8px)]',
  md: 'size-[calc(var(--spacing-control-md)-10px)]',
  lg: 'size-[calc(var(--spacing-control-lg)-10px)]',
} as const
const labelStart = { sm: 'start-2', md: 'start-2', lg: 'start-3' } as const
/*
 * Floating-label state, the `[[data-slot=input-control]:is(...)_&]:` variant below: derived in CSS
 * so defaultValue, autofill and form.reset() need no JS. Floated while the control has a start
 * adornment, a focused or filled input, autofill, a focused or open select (an open base-select
 * picker moves focus onto its options, the select is then only `:open`), or a chosen option (the
 * empty placeholder option is "nothing chosen"). One forgiving `:is()`: an unsupported pseudo
 * (`:open`, `:autofill`) drops only its own argument, not the whole selector.
 */
// Moves the label's center onto the top border (half the field height)
const floatShift = {
  sm: '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:-translate-y-[calc(50%+var(--field-label-shift,17px))]',
  md: '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:-translate-y-[calc(50%+var(--field-label-shift,19px))]',
  lg: '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:-translate-y-[calc(50%+var(--field-label-shift,21px))]',
} as const

const isText = (node: ReactNode) => typeof node === 'string' || typeof node === 'number'
// `0` is content; only null, false and '' render nothing
export const isPresent = (node: ReactNode) => node != null && node !== false && node !== ''

function Adornment({
  node,
  side,
  size,
}: {
  node: ReactNode
  side: 'start' | 'end'
  size: FieldSize
}) {
  const text = isText(node)
  return (
    <span
      aria-hidden={text ? undefined : true}
      className={cn(
        'flex shrink-0 items-center self-stretch text-fg-muted [&_:where(svg:not([class*=shrink]))]:shrink-0',
        text
          ? ['whitespace-nowrap select-none pointer-coarse:text-base', textSize[size]]
          : iconSize[size],
        side === 'start' ? startSlotPadding[size] : endSlotPadding[size],
      )}
    >
      {node}
    </span>
  )
}

// Legend insets put both gaps exactly under the floated label (label: start-2/3 + px-1 inside the
// 1px border; its max width 100% - 1rem). The halo ring sits 3px further out with a 3px border.
const notchPadding = {
  border: { sm: 'ps-2 pe-2', md: 'ps-2 pe-2', lg: 'ps-3 pe-1' },
  halo: { sm: 'ps-[9px] pe-[9px]', md: 'ps-[9px] pe-[9px]', lg: 'ps-[13px] pe-[5px]' },
} as const

/**
 * MUI-style notched outline: a fieldset draws the ring and an invisible legend holding the label
 * text at its floated size cuts the gap. The legend collapses while the label rests in the field.
 * A legend as tall as the border keeps the border at the fieldset's top edge.
 */
function Notch({
  ring,
  size,
  disabled,
  children,
}: {
  ring: 'border' | 'halo'
  size: FieldSize
  disabled?: boolean
  children: ReactNode
}) {
  const halo = ring === 'halo'
  return (
    <fieldset
      aria-hidden
      className={cn(
        'pointer-events-none absolute m-0 min-w-0 p-0',
        'transition-[border-color] duration-200 ease-in-out motion-reduce:transition-none',
        notchPadding[ring][size],
        halo
          ? [
              '-inset-1 rounded-[calc(var(--radius-control)+3px)] border-[3px] border-(--field-halo)',
              // Forced colors would paint the idle ring; show it only on focus, as the focus indicator
              'forced-colors:invisible forced-colors:group-[&:where(:has(:is(input,select,textarea):is(:focus,:open)))]/control:visible forced-colors:border-[Highlight]',
            ]
          : [
              '-inset-px rounded-[inherit] border border-(--field-border)',
              disabled && 'forced-colors:border-[GrayText]',
            ],
      )}
    >
      <legend
        className={cn(
          'invisible float-none block w-auto max-w-[0.01px] overflow-hidden p-0 text-xs whitespace-nowrap',
          halo ? 'h-0.75' : 'h-px',
          // Snap closed, open slightly after the label starts moving (MUI timing)
          'transition-[max-width] duration-50 ease-out motion-reduce:transition-none',
          '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:max-w-full',
          '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:delay-50',
          '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:duration-100',
        )}
      >
        <span className="px-1">{children}</span>
      </legend>
    </fieldset>
  )
}

/** Keeps an internal ref (focus forwarding, clear, reset) alongside the caller's ref. */
export function useMergedRef<T>(ownRef: RefObject<T | null>, ref?: Ref<T>): RefCallback<T> {
  return useCallback(
    (node: T | null) => {
      ownRef.current = node
      if (typeof ref === 'function') return ref(node)
      // oxlint-disable-next-line react/immutability -- callback ref: writes the caller's object ref at attach time, not during render
      if (ref) ref.current = node
    },
    [ownRef, ref],
  )
}

/** What the shell hands its control: ids, state and the floating label to place. */
export type FieldShellParts = {
  /** Id for the native control; the labels point at it. */
  id: string
  invalid: boolean
  /** The caller's aria-describedby plus the helper/error text. */
  describedBy: string | undefined
  /** True when a visible label floats (outlined mode). */
  floating: boolean
  /**
   * The floating label, or null in the other modes. It positions against the control, so the
   * caller places it and caps its width while it rests inside (`restingWidth`, a max-width class).
   */
  floatingLabel: (restingWidth: string) => ReactNode
}

export type FieldShellProps<T extends HTMLElement> = {
  label?: string
  floating?: boolean
  helperText?: ReactNode
  /** Truthy puts the field in the error state; the text replaces helperText. */
  error?: ReactNode
  /** Icon before the error text; see FieldProps. */
  errorIcon?: ReactNode
  size: FieldSize
  id?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  'aria-describedby'?: string
  /** A leading adornment keeps the floating label floated, so it never rests on top of it. */
  hasStart?: boolean
  /** Multiline controls grow naturally; their label rests on the first line. */
  multiline?: boolean
  /** Optional trailing content beside the description, e.g. a character count. */
  footer?: ReactNode
  className?: string
  /** Polite announcement (validating, "Copied"). */
  status?: string
  /** The native control that stray clicks on the frame are forwarded to. */
  controlRef: RefObject<T | null>
  /** How a forwarded click activates the control; focusing it by default. */
  activate?: (control: T) => void
  children: (parts: FieldShellParts) => ReactNode
}

const focusControl = (control: HTMLElement) => control.focus()

/**
 * The frame every field shares (input family, Select): label above or floating with a notched
 * outline, the bordered control with its border/halo/hover states, description and live region.
 * State selectors match `input`, `textarea` or `select`, never the inner buttons, so a focused clear or copy
 * button shows only its own ring. `:open` too: an open base-select picker moves focus onto its
 * options, and the select then matches neither `:focus` nor `:focus-within`. Inside `:is()` an
 * unsupported `:open` is dropped alone instead of invalidating the rule.
 */
export function FieldShell<T extends HTMLElement>({
  label,
  floating = false,
  helperText,
  error,
  errorIcon,
  size,
  id: idProp,
  required,
  disabled,
  readOnly,
  'aria-describedby': describedByProp,
  hasStart = false,
  multiline = false,
  footer,
  className,
  status = '',
  controlRef,
  activate = focusControl,
  children,
}: FieldShellProps<T>) {
  const autoId = useId()
  const id = idProp ?? `${autoId}-control`
  const descriptionId = `${autoId}-description`

  const invalid = Boolean(error)
  const description = invalid ? (error === true ? null : error) : helperText
  const hasDescription = isPresent(description)
  const describedBy =
    [describedByProp, hasDescription ? descriptionId : null].filter(Boolean).join(' ') || undefined
  const hasLabel = Boolean(label)
  const floatingLabel = floating && hasLabel

  const asterisk = required ? (
    <span aria-hidden className="text-danger">
      {' *'}
    </span>
  ) : null

  // Clicks on adornments/padding land on the control; buttons keep their own behavior, and
  // clicks inside the control (its own options too) are left to the browser
  const forwardClick = (e: MouseEvent<HTMLDivElement>) => {
    const control = controlRef.current
    const target = e.target as Element
    if (!control || control.contains(target) || target.closest('button')) return
    e.preventDefault()
    activate(control)
  }

  const renderFloatingLabel = (restingWidth: string) =>
    floatingLabel ? (
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 truncate px-1 leading-normal',
          // Floated label outranks helper text and placeholder
          'text-fg-muted pointer-coarse:text-base',
          'transition-[translate,font-size,color] duration-150 ease-out motion-reduce:transition-none',
          multiline && { sm: 'top-[18px]', md: 'top-5', lg: 'top-6' }[size],
          labelStart[size],
          textSize[size],
          // Resting: stop before whatever sits at the end
          restingWidth,
          floatShift[size],
          '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:max-w-[calc(100%-1rem)]',
          '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:text-xs',
          invalid
            ? 'text-danger'
            : [
                '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:group-[&:where(:has(:is(input,select,textarea):not(:is(:focus,:open))))]/control:text-fg-strong',
                'group-[&:where(:has(:is(input,select,textarea):is(:focus,:open)))]/control:text-input-focus',
              ],
        )}
      >
        {label}
        {asterisk}
      </label>
    ) : null

  return (
    <div
      data-slot="input-field"
      className={cn('flex w-full flex-col gap-1.5', disabled && 'opacity-50', className)}
    >
      {hasLabel && !floating && (
        <label htmlFor={id} className="self-start text-sm font-medium text-fg">
          {label}
          {asterisk}
        </label>
      )}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- forwards stray clicks to the control, which stays the keyboard target */}
      <div
        data-slot="input-control"
        data-start={hasStart ? '' : undefined}
        onMouseDown={forwardClick}
        className={cn(
          'group/control relative isolate flex items-center rounded-control border',
          // Floating is outlined (MUI): transparent, so the label straddling the border sits on one color
          floatingLabel ? 'bg-transparent' : '[--field-bg:var(--color-input-bg)] bg-(--field-bg)',
          'transition-[border-color,box-shadow,background-color] duration-200 ease-in-out motion-reduce:transition-none',
          multiline
            ? {
                sm: '[--field-label-shift:19px]',
                md: '[--field-label-shift:21px]',
                lg: '[--field-label-shift:25px]',
              }[size]
            : controlHeight[size],
          // State lives in two vars so the plain border/halo and the notched fieldsets share it.
          // Neutral border step + soft halo instead of Button's blue ring; only the control's own focus
          // counts, so focused inner buttons show just their ring.
          invalid
            ? [
                '[--field-border:var(--color-danger)] [--field-halo:var(--color-input-halo-invalid)]',
                '[&:where(:has(:is(input,select,textarea):is(:focus,:open)))]:[--field-halo:var(--color-input-halo-invalid-focus)]',
              ]
            : [
                '[--field-border:var(--color-input-border)] [--field-halo:transparent]',
                '[&:where(:has(:is(input,select,textarea):is(:focus,:open)))]:[--field-border:var(--color-input-focus)] [&:where(:has(:is(input,select,textarea):is(:focus,:open)))]:[--field-halo:var(--color-input-halo)]',
              ],
          '[--field-lift:0_0_transparent]',
          !invalid &&
            !disabled &&
            !readOnly && [
              '[@media(hover:hover)]:[&:where(:hover:not(:has(:is(input,select,textarea):is(:focus,:open))))]:[--field-border:var(--color-input-border-hover)]',
              !floatingLabel &&
                '[@media(hover:hover)]:[&:where(:hover:not(:has(:is(input,select,textarea):is(:focus,:open))))]:[--field-bg:var(--color-input-bg-hover)]',
              '[@media(hover:hover)]:[&:where(:hover:not(:has(:is(input,select,textarea):is(:focus,:open))))]:[--field-lift:var(--shadow-input-lift)]',
            ],
          floatingLabel
            ? // The fieldsets draw border and halo with a gap for the label. No inset highlight: it would
              // band the backdrop under the label. Forced colors would paint the transparent border over the gap.
              [
                'border-transparent forced-colors:border-[Canvas]',
                !readOnly && '[box-shadow:var(--field-lift)]',
              ]
            : [
                'border-(--field-border)',
                readOnly
                  ? '[box-shadow:0_0_0_3px_var(--field-halo)]'
                  : '[box-shadow:var(--shadow-input),var(--field-lift),0_0_0_3px_var(--field-halo)]',
                // Forced colors drop box-shadow and paint this transparent outline instead
                '[&:where(:has(:is(input,select,textarea):is(:focus,:open)))]:outline-hidden',
                disabled && 'forced-colors:border-[GrayText]',
              ],
          // Flatter: no tint, highlight or hover reveal, so it reads as "not editable" next to editable fields
          readOnly && !floatingLabel && '[--field-bg:var(--color-bg)]',
          disabled && 'cursor-not-allowed',
          // >=44px hit target on touch without changing the visual size; sits behind the control
          'pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:top-1/2',
          'pointer-coarse:before:-z-10 pointer-coarse:before:h-11 pointer-coarse:before:-translate-y-1/2',
        )}
      >
        {floatingLabel && (
          <>
            <Notch size={size} ring="halo" disabled={disabled}>
              {label}
              {asterisk}
            </Notch>
            <Notch size={size} ring="border" disabled={disabled}>
              {label}
              {asterisk}
            </Notch>
          </>
        )}
        {children({
          id,
          invalid,
          describedBy,
          floating: floatingLabel,
          floatingLabel: renderFloatingLabel,
        })}
      </div>
      {(hasDescription || isPresent(footer)) && (
        <div className="flex items-start justify-between gap-3">
          {hasDescription && (
            <p
              id={descriptionId}
              className={cn(
                'm-0 flex min-w-0 flex-1 items-start gap-1 text-xs/snug',
                invalid ? 'text-danger' : 'text-fg-muted',
              )}
            >
              {invalid && <MessageIcon icon={errorIcon} className="mt-px" />}
              <span>{description}</span>
            </p>
          )}
          {footer}
        </div>
      )}
      {/* Outside label/description so it never joins the name; present up front so changes are announced */}
      <span aria-live="polite" aria-atomic className="sr-only">
        {status}
      </span>
    </div>
  )
}

/** The input family's frame: adornments, actions and the input itself inside FieldShell. */
export function FieldFrame({
  label,
  floating = false,
  helperText,
  error,
  errorIcon,
  size = 'md',
  start,
  end,
  mono = false,
  validating = false,
  validatingText = 'Checking…',
  validatingIcon,
  className,
  inputClassName,
  inputRef: inputRefProp,
  actions,
  status,
  ref,
  id,
  required,
  disabled,
  readOnly,
  placeholder,
  'aria-describedby': describedByProp,
  'aria-invalid': ariaInvalid,
  ...props
}: FrameProps) {
  const ownRef = useRef<HTMLInputElement>(null)
  const inputRef = inputRefProp ?? ownRef
  const setRef = useMergedRef(inputRef, ref)
  const hasStart = isPresent(start)
  const hasEnd = isPresent(end)

  return (
    <FieldShell
      label={label}
      floating={floating}
      helperText={helperText}
      error={error}
      errorIcon={errorIcon}
      size={size}
      id={id}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      aria-describedby={describedByProp}
      hasStart={hasStart}
      className={className}
      status={validating ? validatingText : (status ?? '')}
      controlRef={inputRef}
    >
      {(field) => (
        <>
          {hasStart ? <Adornment node={start} side="start" size={size} /> : null}
          {/* Query container for the resting label's width. Not positioned, so the label still
              anchors to the control and the floated label can span the whole border. */}
          <span className="@container flex min-w-0 flex-1 self-stretch rounded-[inherit]">
            {/* cqw = the input's own slot, so the resting label stops before the end adornment */}
            {field.floatingLabel('max-w-[calc(100cqw-1rem)]')}
            <input
              {...props}
              ref={setRef}
              id={field.id}
              required={required}
              disabled={disabled}
              readOnly={readOnly}
              // `:placeholder-shown` only matches a non-empty placeholder, and drives the floating state
              placeholder={field.floating ? placeholder || ' ' : placeholder}
              aria-invalid={field.invalid ? true : ariaInvalid}
              aria-describedby={field.describedBy}
              spellCheck={mono ? false : props.spellCheck}
              autoCapitalize={mono ? 'off' : props.autoCapitalize}
              autoCorrect={mono ? 'off' : props.autoCorrect}
              className={cn(
                'h-full min-w-0 flex-1 rounded-[inherit] bg-transparent text-fg outline-none',
                'placeholder:text-input-placeholder pointer-coarse:text-base',
                'disabled:cursor-not-allowed',
                // Browsers force an autofill background no author rule can beat. Delaying its transition keeps
                // the field's own fill (or the backdrop when floating); the fill color fixes dark text on dark.
                'autofill:[transition:background-color_0s_600000s] autofill:[-webkit-text-fill-color:var(--color-fg)]',
                textSize[size],
                inputPadding[size],
                hasStart && (isText(start) ? 'ps-1' : 'ps-2'),
                !validating && hasEnd && isText(end)
                  ? 'pe-1'
                  : (validating || hasEnd || actions) && 'pe-2',
                mono && 'font-mono',
                // A real placeholder would collide with the resting label, so it waits for the float
                field.floating && [
                  'placeholder:opacity-0',
                  '[:where([data-slot=input-control]:is([data-start],:has(input:focus),:has(textarea:focus),:has(textarea:not(:placeholder-shown)),:has(input:not(:placeholder-shown)),:has(input:autofill),:has(input:-webkit-autofill),:has(select:focus),:has(select:open),:has(select):not(:has(option[value=""]:checked))))_&]:placeholder:opacity-100',
                ],
                inputClassName,
              )}
            />
          </span>
          {validating ? (
            <span
              className={cn(
                'flex shrink-0 items-center self-stretch text-fg-muted',
                iconSize[size],
                endSlotPadding[size],
              )}
            >
              {/* Slowed, not stopped: a still spinner would read as stuck */}
              <Spinner icon={validatingIcon} className="motion-reduce:[animation-duration:2.5s]" />
            </span>
          ) : hasEnd ? (
            <Adornment node={end} side="end" size={size} />
          ) : null}
          {actions ? (
            <span className={cn('flex shrink-0 items-center gap-0.5', actionsPadding[size])}>
              {actions}
            </span>
          ) : null}
        </>
      )}
    </FieldShell>
  )
}
