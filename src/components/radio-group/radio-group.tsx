import { CircleAlert } from 'lucide-react'
import {
  type ChangeEvent,
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import { type ChoiceLabelProps, ChoiceRow } from '../checkbox/choice-row'
import { isPresent, useMergedRef } from '../input/field'

type SelectionProps =
  | {
      /** Controlled selection; `null` clears it. */
      value: string | null
      defaultValue?: never
    }
  | {
      value?: undefined
      /** Uncontrolled initial selection. Nothing is selected when omitted. */
      defaultValue?: string
    }

export type RadioGroupProps = Omit<
  ComponentProps<'fieldset'>,
  'name' | 'onChange' | 'defaultValue' | 'children'
> &
  SelectionProps & {
    /** Native group and submitted field name. Independent groups need different names. */
    name: string
    /** Names the group (fieldset legend). */
    legend: ReactNode
    /** Muted line under the legend, linked with aria-describedby. */
    description?: ReactNode
    /** Shows one group message; marks the group invalid. `true` omits the message. */
    error?: ReactNode
    /** Marks the group required: native validation needs one selection. */
    required?: boolean
    /** Called when the selection changes, with the new value and the native change event. */
    onValueChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void
    /**
     * Plain rows or bordered cards.
     * @defaultValue 'default'
     */
    variant?: 'default' | 'card'
    /**
     * Layout only; both orientations keep native radio keyboard behavior.
     * @defaultValue 'vertical'
     */
    orientation?: 'vertical' | 'horizontal'
    /** Classes for the items container; `className` goes to the fieldset. */
    itemsClassName?: string
    /** `Radio` items. */
    children: ReactNode
  }

type RadioContextValue = {
  name: string
  form?: string
  selected: string | null
  disabled?: boolean
  required?: boolean
  invalid: boolean
  describedBy?: string
  variant: 'default' | 'card'
  orientation: 'vertical' | 'horizontal'
  select: (event: ChangeEvent<HTMLInputElement>) => void
  register: (node: HTMLInputElement) => () => void
}

const RadioContext = createContext<RadioContextValue | null>(null)

export function RadioGroup({
  name,
  legend,
  description,
  error,
  value,
  defaultValue,
  onValueChange,
  variant = 'default',
  orientation = 'vertical',
  itemsClassName,
  children,
  className,
  disabled,
  required,
  form,
  ref,
  'aria-invalid': ariaInvalid,
  'aria-describedby': describedByProp,
  ...props
}: RadioGroupProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const legendId = `${id}-legend`
  const invalid = Boolean(error) || ariaInvalid === true || ariaInvalid === 'true'
  const hasDescription = isPresent(description)
  const hasError = Boolean(error) && error !== true && isPresent(error)
  const describedBy =
    [describedByProp, hasDescription && descriptionId, hasError && errorId]
      .filter(Boolean)
      .join(' ') || undefined
  const controlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null)
  const selected = controlled ? value : internalValue
  const groupRef = useRef<HTMLFieldSetElement>(null)
  const mergedRef = useMergedRef(groupRef, ref)
  const inputs = useRef(new Set<HTMLInputElement>())
  const currentSelection = useRef(selected)

  useLayoutEffect(() => {
    currentSelection.current = selected
  }, [selected])

  const register = useCallback(
    (node: HTMLInputElement) => {
      const members = inputs.current
      if ([...members].some((input) => input.value === node.value)) {
        throw new Error(`Radio values must be unique within a RadioGroup: "${node.value}"`)
      }
      members.add(node)
      const reconcile = () => {
        // Wait until all replacements have attached, including StrictMode's effect replay.
        // Removing the selected option clears uncontrolled state without choosing another item.
        queueMicrotask(() => {
          if (controlled || !groupRef.current) return
          setInternalValue((current) =>
            [...members].some((input) => input.value === current) ? current : null,
          )
        })
      }
      reconcile()
      return () => {
        members.delete(node)
        reconcile()
      }
    },
    [controlled],
  )

  useLayoutEffect(() => {
    const owner = groupRef.current?.form
    if (!owner) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const reset = (event: Event) => {
      clearTimeout(timer)
      // A native reset button can flush microtasks before its default action. Read/write after it.
      timer = setTimeout(() => {
        if (event.defaultPrevented) return
        const next = controlled ? currentSelection.current : (defaultValue ?? null)
        const members = [...inputs.current]
        if (!controlled)
          setInternalValue(members.some((input) => input.value === next) ? next : null)
        // Also restore controlled values, and unchanged state that React needn't re-render.
        for (const input of members) input.checked = input.value === next
      }, 0)
    }
    owner.addEventListener('reset', reset)
    return () => {
      clearTimeout(timer)
      owner.removeEventListener('reset', reset)
    }
  }, [controlled, defaultValue, form])

  return (
    <RadioContext
      value={{
        name,
        form,
        selected,
        disabled,
        required,
        invalid,
        describedBy,
        variant,
        orientation,
        register,
        select: (event) => {
          if (!event.currentTarget.checked) return
          const next = event.currentTarget.value
          if (!controlled) setInternalValue(next)
          onValueChange?.(next, event)
        },
      }}
    >
      <fieldset
        {...props}
        ref={mergedRef}
        name={name}
        form={form}
        disabled={disabled}
        data-slot="radio-group"
        data-variant={variant}
        role="radiogroup"
        aria-labelledby={props['aria-labelledby'] ?? legendId}
        aria-describedby={describedBy}
        aria-invalid={invalid ? true : ariaInvalid}
        aria-required={required || undefined}
        aria-orientation={orientation}
        className={cn('group/radio-group m-0 min-w-0 border-0 p-0', className)}
      >
        <legend
          id={legendId}
          className="float-start mb-1.5 w-full p-0 text-sm font-medium text-fg group-disabled/radio-group:opacity-50"
        >
          {legend}
          {required && (
            <span aria-hidden className="text-danger">
              {' *'}
            </span>
          )}
        </legend>
        <div className="clear-both flex flex-col">
          {hasDescription && (
            <p
              id={descriptionId}
              className="m-0 -mt-1 mb-2.5 text-xs/snug text-fg-muted group-disabled/radio-group:opacity-50"
            >
              {description}
            </p>
          )}
          <div
            data-slot="radio-group-items"
            data-orientation={orientation}
            className={cn(
              'flex gap-2',
              orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-x-6',
              variant === 'card' && orientation === 'horizontal' && 'gap-3',
              itemsClassName,
            )}
          >
            {children}
          </div>
          {hasError && (
            <p id={errorId} className="m-0 mt-2 flex items-start gap-1 text-xs/snug text-danger">
              <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </fieldset>
    </RadioContext>
  )
}

export type RadioProps = Omit<
  ComponentProps<'input'>,
  | 'type'
  | 'size'
  | 'children'
  | 'value'
  | 'readOnly'
  | 'name'
  | 'checked'
  | 'defaultChecked'
  | 'required'
  | 'form'
  | 'aria-label'
  | 'aria-invalid'
> &
  ChoiceLabelProps & {
    /** A unique, non-empty value within the parent RadioGroup. */
    value: string
    /** Muted line under the label, linked with aria-describedby. */
    description?: ReactNode
    /** Classes for the native input; className belongs to the row or card. */
    inputClassName?: string
  }

export function Radio({
  value,
  label,
  description,
  disabled,
  className,
  inputClassName,
  ref,
  onChange,
  'aria-describedby': describedBy,
  ...props
}: RadioProps) {
  const group = useContext(RadioContext)
  if (!group) throw new Error('Radio must be rendered inside <RadioGroup>')
  if (value === '') throw new Error('Radio value must be a non-empty string')
  const ownRef = useRef<HTMLInputElement>(null)
  const mergedRef = useMergedRef(ownRef, ref)
  const register = group.register
  useLayoutEffect(() => {
    if (ownRef.current) return register(ownRef.current)
  }, [register, value])
  const card = group.variant === 'card'
  const invalid = group.invalid

  return (
    <ChoiceRow
      slot="radio"
      label={label}
      description={description}
      gap={card ? 'gap-3' : 'gap-2'}
      controlOffset="mt-1"
      aria-describedby={[describedBy, group.describedBy].filter(Boolean).join(' ') || undefined}
      className={cn(
        'group/radio wrap-anywhere motion-reduce:**:transition-none',
        // Real touch spacing prevents neighboring 44px hit areas from overlapping.
        'pointer-coarse:min-h-11 pointer-coarse:py-2.5',
        card && [
          'w-full rounded-control border bg-surface p-3 pointer-coarse:p-3',
          'transition-[border-color,background-color] duration-150 ease-out',
          '[&>span:last-child>span:first-child]:font-medium',
          'has-[input:checked]:bg-[color-mix(in_oklab,var(--color-control-checked)_4%,var(--color-surface))]',
          'has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2',
          invalid
            ? 'border-danger has-[input:focus-visible]:outline-danger'
            : 'border-input-border has-[input:checked]:border-control-checked has-[input:enabled]:hover:border-input-border-hover has-[input:focus-visible]:outline-control-checked',
          'forced-colors:has-[input:checked]:border-[Highlight] forced-colors:has-[input:focus-visible]:outline-[Highlight]',
          group.orientation === 'horizontal' && 'flex-[1_1_14rem]',
        ],
        className,
      )}
      control={(row) => (
        <span className="relative inline-grid size-4 place-items-center transition-[scale] duration-100 ease-out has-[input:enabled:active]:scale-[0.92]">
          <input
            {...props}
            ref={mergedRef}
            data-slot="radio-input"
            type="radio"
            name={group.name}
            form={group.form}
            value={value}
            checked={group.selected === value}
            disabled={group.disabled || disabled}
            required={group.required}
            aria-labelledby={props['aria-labelledby'] ?? row.labelledBy}
            aria-describedby={row.describedBy}
            onChange={(event) => {
              onChange?.(event)
              group.select(event)
            }}
            className={cn(
              'peer col-start-1 row-start-1 m-0 size-4 cursor-pointer appearance-none rounded-full border outline-hidden disabled:cursor-not-allowed',
              'bg-input-bg checked:bg-control-checked',
              'transition-[border-color,background-color,box-shadow] duration-150 ease-out',
              invalid
                ? 'border-danger [box-shadow:0_0_0_3px_var(--color-input-halo-invalid)]'
                : 'border-input-border checked:border-control-checked group-hover/radio:enabled:not-checked:border-input-border-hover',
              !card && [
                invalid
                  ? 'focus-visible:[box-shadow:0_0_0_3px_var(--color-input-halo-invalid-focus)] not-forced-colors:focus-visible:outline-danger'
                  : 'focus-visible:border-input-focus focus-visible:[box-shadow:0_0_0_3px_var(--color-input-halo)] not-forced-colors:focus-visible:outline-control-checked',
                'checked:focus-visible:shadow-none checked:focus-visible:outline-solid checked:focus-visible:outline-2 checked:focus-visible:outline-offset-2',
              ],
              card && 'focus-visible:outline-none',
              'forced-colors:forced-color-adjust-none forced-colors:shadow-none forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]',
              'forced-colors:checked:border-[Highlight] forced-colors:checked:bg-[Highlight]',
              'forced-colors:disabled:border-[GrayText] forced-colors:disabled:checked:bg-[GrayText]',
              !card && 'forced-colors:focus-visible:outline-[Highlight]',
              inputClassName,
            )}
          />
          <span
            aria-hidden
            className="pointer-events-none col-start-1 row-start-1 size-1.5 scale-0 rounded-full bg-control-checked-fg transition-[scale] duration-150 ease-out peer-checked:scale-100 forced-colors:forced-color-adjust-none forced-colors:bg-[HighlightText] forced-colors:peer-disabled:bg-[Canvas]"
          />
        </span>
      )}
    />
  )
}
