import { type ComponentProps, type ReactNode, useLayoutEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { useMergedRef } from '../input/field'
import { type ChoiceLabelProps, ChoiceRow } from './choice-row'

type NativeCheckboxProps = Omit<
  ComponentProps<'input'>,
  'type' | 'size' | 'children' | 'aria-label'
>

export type CheckboxProps = NativeCheckboxProps &
  ChoiceLabelProps & {
    /** One muted line under the label, linked with aria-describedby. */
    description?: ReactNode
    /** Truthy sets aria-invalid; text is shown under the label and linked with aria-describedby. */
    error?: ReactNode
    /**
     * Partly selected (a "select all" over some rows): drawn as a dash, announced as mixed.
     * A visual state only; the form still submits `checked`. The browser clears it on click, so
     * derive it from the children's state and it stays right after every change.
     */
    indeterminate?: boolean
    /** Classes for the `<input>`; `className` goes to the row. */
    inputClassName?: string
  }

/**
 * Drawn from the short end, like a pen stroke. As wide as the dash (Geist's 8-unit check reads
 * small next to it). Length ~14.1; the dash pattern rounds it up to 15.
 */
const CHECK_PATH = 'M5 10L8.5 13.5L15 7'

const markBase = [
  'pointer-events-none col-start-1 row-start-1 size-3.5 text-control-checked-fg',
  // Forced colors would repaint the mark to match the forced fill and hide it
  'forced-colors:forced-color-adjust-none forced-colors:text-[HighlightText] forced-colors:peer-disabled:text-[Canvas]',
]

export function Checkbox({
  label,
  description,
  error,
  indeterminate = false,
  className,
  inputClassName,
  ref,
  checked,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: CheckboxProps) {
  const ownRef = useRef<HTMLInputElement>(null)
  const setRef = useMergedRef(ownRef, ref)

  // `indeterminate` exists only as a DOM property. A click clears it, so it is re-applied whenever
  // `checked` changes too: a controlled parent that still says "indeterminate" wins.
  // Effect dep: `checked` re-applies it after a click cleared it
  useLayoutEffect(() => {
    if (ownRef.current) ownRef.current.indeterminate = indeterminate
  }, [indeterminate, checked])

  return (
    <ChoiceRow
      slot="checkbox"
      label={label}
      description={description}
      error={error}
      gap="gap-2"
      controlOffset="mt-1"
      className={className}
      aria-describedby={describedBy}
      control={(row) => (
        <span
          className={cn(
            'relative inline-grid size-4 place-items-center',
            // A short press-in, like Button's 0.97: the box gives under the finger, then the check draws
            'transition-[scale] duration-100 ease-out has-[input:enabled:active]:scale-[0.92]',
          )}
        >
          <input
            {...props}
            ref={setRef}
            type="checkbox"
            checked={checked}
            aria-labelledby={props['aria-labelledby'] ?? row.labelledBy}
            aria-describedby={row.describedBy}
            aria-invalid={row.invalid ? true : ariaInvalid}
            className={cn(
              'peer col-start-1 row-start-1 m-0 size-4 cursor-pointer appearance-none rounded-sm border outline-hidden',
              'disabled:cursor-not-allowed',
              'border-(--checkbox-border) bg-(--checkbox-bg) [box-shadow:0_0_0_3px_var(--checkbox-halo)]',
              'transition-[background-color,border-color,box-shadow] duration-200 ease-in-out',
              // State lives in custom properties so forced colors can override the real properties once
              '[--checkbox-bg:var(--color-input-bg)] [--checkbox-halo:transparent]',
              'checked:[--checkbox-bg:var(--color-control-checked)] indeterminate:[--checkbox-bg:var(--color-control-checked)]',
              row.invalid
                ? [
                    '[--checkbox-border:var(--color-danger)] [--checkbox-halo:var(--color-input-halo-invalid)]',
                    'focus-visible:[--checkbox-halo:var(--color-input-halo-invalid-focus)]',
                    'not-forced-colors:checked:focus-visible:outline-danger not-forced-colors:indeterminate:focus-visible:outline-danger',
                  ]
                : [
                    '[--checkbox-border:var(--color-input-border)]',
                    'checked:[--checkbox-border:var(--color-control-checked)] indeterminate:[--checkbox-border:var(--color-control-checked)]',
                    'enabled:not-checked:not-indeterminate:hover:[--checkbox-border:var(--color-input-border-hover)]',
                    'enabled:not-checked:not-indeterminate:hover:[--checkbox-bg:var(--color-input-bg-hover)]',
                    // Same focus language as Input: border steps up, soft 3px halo outside
                    'focus-visible:[--checkbox-border:var(--color-input-focus)] focus-visible:[--checkbox-halo:var(--color-input-halo)]',
                    'not-forced-colors:checked:focus-visible:outline-control-checked not-forced-colors:indeterminate:focus-visible:outline-control-checked',
                  ],
              // Filled (checked/mixed), the border is already the accent and the halo is too faint to
              // show focus, so focus becomes a 2px ring 2px out (an outline, so the gap shows
              // whatever is behind, on any surface)
              'checked:focus-visible:[--checkbox-halo:transparent] indeterminate:focus-visible:[--checkbox-halo:transparent]',
              // outline-hidden sets the style to none outside forced colors; spell the ring out
              'checked:focus-visible:outline-solid checked:focus-visible:outline-2 checked:focus-visible:outline-offset-2',
              'indeterminate:focus-visible:outline-solid indeterminate:focus-visible:outline-2 indeterminate:focus-visible:outline-offset-2',
              // Forced colors: system colors on an unadjusted box, so the fill and mark stay visible
              'forced-colors:forced-color-adjust-none forced-colors:[box-shadow:none]',
              'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]',
              'forced-colors:checked:border-[Highlight] forced-colors:checked:bg-[Highlight]',
              'forced-colors:indeterminate:border-[Highlight] forced-colors:indeterminate:bg-[Highlight]',
              'forced-colors:disabled:border-[GrayText] forced-colors:disabled:checked:bg-[GrayText] forced-colors:disabled:indeterminate:bg-[GrayText]',
              'forced-colors:focus-visible:outline-[CanvasText]',
              inputClassName,
            )}
          />
          {/* The input is a void element, so the marks are siblings driven by its state */}
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              markBase,
              '[stroke-dasharray:15] [stroke-dashoffset:15] opacity-0',
              // Unchecking fades out fast, then rewinds the stroke while it is invisible
              '[transition:opacity_80ms_ease-out,stroke-dashoffset_0s_80ms]',
              // Checking draws the stroke; it appears at once so the drawing is what you see
              'peer-[:checked:not(:indeterminate)]:[stroke-dashoffset:0] peer-[:checked:not(:indeterminate)]:opacity-100',
              'peer-[:checked:not(:indeterminate)]:[transition:stroke-dashoffset_150ms_ease-out]',
            )}
          >
            <path d={CHECK_PATH} />
          </svg>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn(
              markBase,
              // The dash grows out from its center
              'scale-x-0 opacity-0 [transition:opacity_80ms_ease-out,scale_0s_80ms]',
              'peer-indeterminate:scale-x-100 peer-indeterminate:opacity-100',
              'peer-indeterminate:[transition:scale_150ms_ease-out]',
            )}
          >
            <path d="M5 10H15" />
          </svg>
        </span>
      )}
    />
  )
}
