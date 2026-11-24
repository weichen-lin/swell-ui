import type { ChangeEvent, ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { BusyIcon } from '../../lib/icon-slots'
import { type ChoiceLabelProps, ChoiceRow } from '../checkbox/choice-row'

export type SwitchSize = 'sm' | 'md'

type NativeSwitchProps = Omit<
  ComponentProps<'input'>,
  'type' | 'size' | 'children' | 'role' | 'aria-checked' | 'aria-label'
>

export type SwitchProps = NativeSwitchProps &
  ChoiceLabelProps & {
    /** One muted line under the label (what is true while it's on), linked with aria-describedby. */
    description?: ReactNode
    /** Truthy sets aria-invalid; text is shown under the label and linked with aria-describedby. */
    error?: ReactNode
    /**
     * Icon before the error text, sized to it. Defaults to a circled exclamation mark; `false` or
     * `null` hides it.
     */
    errorIcon?: ReactNode
    /**
     * sm 28x14 for dense rows and tables, md 36x20 for settings.
     * @defaultValue 'md'
     */
    size?: SwitchSize
    /**
     * A spinner in the thumb while the change is being saved: aria-busy, and clicks/Space are
     * swallowed without disabling, so focus stays put.
     * @defaultValue false
     */
    loading?: boolean
    /**
     * Spinner in the thumb while loading, sized to the thumb and spun by the switch (still under
     * reduced motion), so pass a static icon. Defaults to a circular loader, swapped for a dashed
     * ring under reduced motion.
     */
    loadingIcon?: ReactNode
    /**
     * `start`: label first and the switch pushed to the far end, as in a settings row.
     * @defaultValue 'end'
     */
    labelPosition?: 'end' | 'start'
    /** Classes for the `<input>` (the track); `className` goes to the row. */
    inputClassName?: string
  }

// Geist's track sizes, but whole-pixel geometry: thumb = height - 4px, inset 2px, travel = width -
// thumb - 4px. Geist's 1.5px inset rounds unevenly at 1x DPR, so the thumb reads off-center.
// Stretch is how far the thumb grows while pressed (~20-25%), toward the side it will travel to.
const sizeClasses: Record<SwitchSize, { track: string; offset: string; icon: string }> = {
  sm: {
    track: 'h-3.5 w-7 [--switch-thumb:10px] [--switch-travel:14px] [--switch-stretch:2px]',
    offset: 'mt-[5px]',
    icon: '[&_svg]:size-2',
  },
  md: {
    track: 'h-5 w-9 [--switch-thumb:16px] [--switch-travel:16px] [--switch-stretch:4px]',
    offset: 'mt-0.5',
    icon: '[&_svg]:size-3',
  },
}

export function Switch({
  label,
  description,
  error,
  errorIcon,
  size = 'md',
  loading = false,
  loadingIcon,
  labelPosition = 'end',
  className,
  inputClassName,
  disabled,
  onChange,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SwitchProps) {
  const s = sizeClasses[size]
  const pressable = !disabled && !loading

  // Loading blocks the toggle but not focus (native `disabled` would drop it, as Button avoids).
  // The swallowed change is set back through the `checked` setter rather than preventDefault:
  // React's onChange fires from the click either way, and only the setter keeps its value tracker
  // in sync, so the next real change still reaches onChange.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (loading) {
      e.currentTarget.checked = !e.currentTarget.checked
      return
    }
    onChange?.(e)
  }

  return (
    <ChoiceRow
      slot="switch"
      label={label}
      description={description}
      error={error}
      errorIcon={errorIcon}
      labelPosition={labelPosition}
      gap="gap-3"
      controlOffset={s.offset}
      className={className}
      aria-describedby={describedBy}
      control={(row) => (
        <span className={cn('relative inline-flex', s.track)}>
          <input
            {...props}
            type="checkbox"
            // Native checkbox + role: form, required, reset and label clicks stay native; the
            // checked state comes from the input itself, so no aria-checked (ARIA in HTML forbids it)
            // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- the native checked state backs the role
            role="switch"
            disabled={disabled}
            aria-busy={loading || undefined}
            aria-labelledby={props['aria-labelledby'] ?? row.labelledBy}
            aria-describedby={row.describedBy}
            aria-invalid={row.invalid ? true : ariaInvalid}
            onChange={handleChange}
            className={cn(
              'peer m-0 size-full cursor-pointer appearance-none rounded-full border border-(--switch-ring) outline-hidden',
              'disabled:cursor-not-allowed aria-busy:cursor-progress',
              'bg-(--switch-track) [box-shadow:0_0_0_3px_var(--switch-halo)]',
              'transition-[background-color,border-color,box-shadow] duration-150 ease-out',
              // Off reuses the input border (>=3:1 on the page); state lives in custom properties so
              // forced colors can override the real properties once
              '[--switch-track:var(--color-input-border)] checked:[--switch-track:var(--color-control-checked)]',
              pressable && 'not-checked:hover:[--switch-track:var(--color-input-border-hover)]',
              // Input's focus language: the border carries the state color (inside the box, so the track never
              // grows), then the 3px halo outside it
              row.invalid
                ? [
                    '[--switch-ring:var(--color-danger)] [--switch-halo:var(--color-input-halo-invalid)]',
                    'focus-visible:[--switch-halo:var(--color-input-halo-invalid-focus)]',
                  ]
                : [
                    '[--switch-ring:transparent] [--switch-halo:transparent]',
                    'focus-visible:[--switch-ring:var(--color-input-focus)] focus-visible:[--switch-halo:var(--color-input-halo)]',
                    'not-forced-colors:checked:focus-visible:outline-control-checked',
                  ],
              // On, the track is already the accent and the halo is too faint to show focus, so focus
              // becomes a 2px ring 2px out (an outline, so the gap shows whatever is behind, on any surface)
              'checked:focus-visible:[--switch-ring:transparent] checked:focus-visible:[--switch-halo:transparent]',
              // outline-hidden sets the style to none outside forced colors; spell the ring out
              'checked:focus-visible:outline-solid checked:focus-visible:outline-2 checked:focus-visible:outline-offset-2',
              row.invalid && 'not-forced-colors:checked:focus-visible:outline-danger',
              // Forced colors: system colors on an unadjusted track, so on/off and the thumb stay visible
              'forced-colors:forced-color-adjust-none forced-colors:[box-shadow:none]',
              'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]',
              'forced-colors:checked:border-[Highlight] forced-colors:checked:bg-[Highlight]',
              'forced-colors:disabled:border-[GrayText] forced-colors:disabled:checked:bg-[GrayText]',
              'forced-colors:focus-visible:outline-[CanvasText]',
              inputClassName,
            )}
          />
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-s-0.5 top-0.5 grid place-items-center rounded-full',
              'h-(--switch-thumb) w-(--switch-thumb-w) bg-switch-handle peer-checked:bg-switch-handle-checked text-control-checked [box-shadow:var(--shadow-switch-thumb)]',
              // translate (not left) so the slide stays on the compositor; mirrored in RTL
              '[--switch-dir:1] rtl:[--switch-dir:-1] [translate:calc(var(--switch-x)*var(--switch-dir))_0]',
              '[--switch-x:0px] [--switch-thumb-w:var(--switch-thumb)] peer-checked:[--switch-x:var(--switch-travel)]',
              'transition-[translate,width] duration-150 ease-in-out',
              // iOS-style press: the thumb stretches toward where it will go and stays inside the track
              // (on: it shifts back by the same amount, so its far edge doesn't move)
              pressable && [
                'peer-active:[--switch-thumb-w:calc(var(--switch-thumb)+var(--switch-stretch))]',
                'peer-checked:peer-active:[--switch-x:calc(var(--switch-travel)-var(--switch-stretch))]',
              ],
              'peer-disabled:shadow-none',
              'forced-colors:forced-color-adjust-none forced-colors:shadow-none',
              'forced-colors:bg-[CanvasText] forced-colors:text-[Canvas]',
              'forced-colors:peer-checked:bg-[HighlightText] forced-colors:peer-checked:text-[Highlight]',
              'forced-colors:peer-disabled:bg-[GrayText] forced-colors:peer-disabled:peer-checked:bg-[Canvas]',
              s.icon,
            )}
          >
            {loading && <BusyIcon icon={loadingIcon} />}
          </span>
        </span>
      )}
    />
  )
}
