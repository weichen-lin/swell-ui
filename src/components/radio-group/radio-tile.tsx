import { type ComponentProps, createContext, type ReactNode, useContext } from 'react'
import { usePressFeedback } from '../../hooks/use-press-feedback'
import { CheckIcon } from '../../icons'
import { cn } from '../../lib/cn'
import { useRadioItem } from './radio-context'

type TileState = { checked: boolean; disabled?: boolean; invalid: boolean }
const TileContext = createContext<TileState | null>(null)

export type RadioTileProps = Omit<ComponentProps<'label'>, 'htmlFor' | 'form' | 'children'> & {
  /** A unique, non-empty value within the parent RadioGroup. */
  value: string
  /** Skips this radio during keyboard navigation and form submission. */
  disabled?: boolean
  /** Show a ripple on pointer press or Space. Reduced motion suppresses it. */
  ripple?: boolean
  /** Non-interactive content naming this choice. Add RadioIndicator for a selection mark. */
  children: ReactNode
}

/** A label around a native radio. Layout, image, caption and indicator can be composed freely. */
export function RadioTile({
  value,
  disabled,
  ripple = true,
  className,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  ...props
}: RadioTileProps) {
  const { group, inputProps } = useRadioItem(value, disabled)
  const layerRef = usePressFeedback(ripple, inputProps.disabled)
  const state = {
    checked: inputProps.checked,
    disabled: inputProps.disabled,
    invalid: group.invalid,
  }

  return (
    <TileContext value={state}>
      <label
        {...props}
        data-slot="radio-tile"
        data-checked={state.checked || undefined}
        data-disabled={state.disabled || undefined}
        data-invalid={state.invalid || undefined}
        className={cn(
          'group/radio-tile relative isolate flex min-h-11 min-w-0 cursor-pointer touch-manipulation flex-col items-center justify-center gap-2 rounded-control border border-input-border bg-surface p-3 text-sm text-fg select-none [-webkit-tap-highlight-color:transparent]',
          'shadow-[var(--shadow-raised),var(--shadow-lift)] motion-safe:transition-[border-color,background-color,box-shadow,translate] motion-safe:duration-150 motion-safe:ease-out',
          'data-checked:border-control-checked data-checked:bg-[color-mix(in_oklab,var(--color-control-checked)_4%,var(--color-surface))]',
          !state.invalid &&
            'pointer-fine:has-[input:enabled]:hover:not-data-checked:border-input-border-hover',
          'pointer-fine:has-[input:enabled]:hover:not-data-pressed:shadow-[var(--shadow-raised),var(--shadow-lift-hover)] motion-safe:pointer-fine:has-[input:enabled]:hover:not-data-pressed:-translate-y-(--lift)',
          'data-pressed:bg-surface-inset data-pressed:shadow-[var(--shadow-pressed),0_0_0_0_transparent]',
          'has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-control-checked',
          'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50 has-[input:disabled]:shadow-none',
          state.invalid &&
            'border-danger data-checked:border-danger has-[input:focus-visible]:outline-danger',
          'forced-colors:data-checked:border-[Highlight] forced-colors:has-[input:focus-visible]:outline-[Highlight] forced-colors:has-[input:disabled]:border-[GrayText] forced-colors:has-[input:disabled]:text-[GrayText] forced-colors:has-[input:disabled]:opacity-100',
          className,
        )}
      >
        <input
          {...inputProps}
          data-slot="radio-input"
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={[describedBy, group.describedBy].filter(Boolean).join(' ') || undefined}
          className="sr-only"
        />
        <span
          ref={layerRef}
          data-ripple={ripple ? '' : undefined}
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] opacity-60 group-has-[input:disabled]/radio-tile:hidden motion-reduce:hidden forced-colors:hidden"
        />
        {children}
      </label>
    </TileContext>
  )
}

export type RadioIndicatorProps = ComponentProps<'span'>

/** Optional decorative mark inside a RadioTile. Children replace the default check. */
export function RadioIndicator({
  className,
  children = <CheckIcon />,
  ...props
}: RadioIndicatorProps) {
  const state = useContext(TileContext)
  if (!state) throw new Error('RadioIndicator must be rendered inside <RadioTile>')

  return (
    <span
      {...props}
      aria-hidden
      data-slot="radio-indicator"
      data-checked={state.checked || undefined}
      data-disabled={state.disabled || undefined}
      data-invalid={state.invalid || undefined}
      className={cn(
        'pointer-events-none absolute inset-e-2 top-2 inline-flex size-4 items-center justify-center rounded-full bg-control-checked text-control-checked-fg [&_svg]:size-3',
        'invisible scale-80 data-checked:visible data-checked:scale-100 motion-safe:transition-[scale] motion-safe:duration-100 motion-safe:ease-out group-has-[input:focus-visible]/radio-tile:transition-none',
        'forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:group-has-[input:disabled]/radio-tile:bg-[GrayText] forced-colors:group-has-[input:disabled]/radio-tile:text-[Canvas]',
        className,
      )}
    >
      {children}
    </span>
  )
}
