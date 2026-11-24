import { type ReactNode, useId } from 'react'
import { cn } from '../../lib/cn'
import { MessageIcon } from '../../lib/icon-slots'
import { isPresent } from '../input/field'

/**
 * Either a visible label, or only an aria-label when the context already names the control
 * (a table row, a toolbar). Same idea as the input family's FieldLabelProps.
 */
export type ChoiceLabelProps =
  | {
      /** Visible label. Required unless `aria-label` is set. */
      label: ReactNode
      /** Accessible name when there is no visible `label`. */
      'aria-label'?: string
    }
  | {
      label?: never
      /** Accessible name when there is no visible `label`. */
      'aria-label': string
    }

/** What the row hands its control. */
export type ChoiceRowParts = {
  /** Points at the label text only, so description and error stay out of the name. */
  labelledBy: string | undefined
  /** The caller's aria-describedby plus the description and error. */
  describedBy: string | undefined
  invalid: boolean
}

type ChoiceRowProps = {
  slot: string
  label?: ReactNode
  description?: ReactNode
  /** Truthy puts the control in the error state; text (if any) is shown under the label. */
  error?: ReactNode
  /** Icon before the error text; undefined shows the default, `false`/`null` hides it. */
  errorIcon?: ReactNode
  /** `start` puts the text first and pushes the control to the far end (settings rows). */
  labelPosition?: 'end' | 'start'
  /** Space between the control and the text. */
  gap: string
  /** Top margin that centers the control on the first 24px text line. */
  controlOffset: string
  className?: string
  'aria-describedby'?: string
  control: (parts: ChoiceRowParts) => ReactNode
}

/**
 * The row Switch and Checkbox share: one `<label>` holding the control, its label, description
 * and error, so the whole row toggles it natively. The label line is 24px tall, which is the
 * WCAG 2.5.8 minimum target; touch gets a 44px band without changing the layout.
 * Disabled styling reads `:disabled` off the input, so a disabled fieldset dims rows too.
 */
export function ChoiceRow({
  slot,
  label,
  description,
  error,
  errorIcon,
  labelPosition = 'end',
  gap,
  controlOffset,
  className,
  'aria-describedby': describedByProp,
  control,
}: ChoiceRowProps) {
  const id = useId()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`

  const hasLabel = isPresent(label)
  const hasDescription = isPresent(description)
  const invalid = Boolean(error)
  // `error={true}` flags the control without a message
  const hasErrorText = invalid && error !== true && isPresent(error)
  const describedBy =
    [describedByProp, hasDescription && descriptionId, hasErrorText && errorId]
      .filter(Boolean)
      .join(' ') || undefined

  const text =
    hasLabel || hasDescription || hasErrorText ? (
      <span className="flex min-w-0 flex-col">
        {hasLabel && <span id={labelId}>{label}</span>}
        {hasDescription && (
          <span id={descriptionId} className="text-xs/snug text-fg-muted">
            {description}
          </span>
        )}
        {hasErrorText && (
          <span
            id={errorId}
            className={cn(
              'flex items-start gap-1 text-xs/snug text-danger',
              hasDescription && 'mt-1',
            )}
          >
            <MessageIcon icon={errorIcon} className="mt-px" />
            <span>{error}</span>
          </span>
        )}
      </span>
    ) : null

  const controlSlot = (
    <span className={cn('flex shrink-0', controlOffset)}>
      {control({ labelledBy: hasLabel ? labelId : undefined, describedBy, invalid })}
    </span>
  )

  return (
    <label
      data-slot={slot}
      className={cn(
        // min size keeps a 24px target even without text (aria-label only, e.g. a table row)
        'relative isolate flex min-h-6 min-w-6 items-start text-sm/6 text-fg',
        'cursor-pointer has-[input:disabled]:cursor-not-allowed has-[input[aria-busy=true]]:cursor-progress',
        'has-[input:disabled]:opacity-50',
        // Forced colors ignore the dim; GrayText is the system's "disabled" signal
        'forced-colors:has-[input:disabled]:text-[GrayText] forced-colors:has-[input:disabled]:opacity-100',
        // >=44px hit target on touch without changing the layout (Button's band); sits behind the row
        'pointer-coarse:before:absolute pointer-coarse:before:top-1/2 pointer-coarse:before:left-1/2',
        'pointer-coarse:before:-z-10 pointer-coarse:before:size-full pointer-coarse:before:min-h-11',
        'pointer-coarse:before:min-w-11 pointer-coarse:before:-translate-1/2',
        gap,
        labelPosition === 'start' ? 'w-full justify-between' : 'w-fit max-w-full',
        className,
      )}
    >
      {/* DOM order follows the visual order, so reading and tab order never disagree */}
      {labelPosition === 'start' ? (
        <>
          {text}
          {controlSlot}
        </>
      ) : (
        <>
          {controlSlot}
          {text}
        </>
      )}
    </label>
  )
}
