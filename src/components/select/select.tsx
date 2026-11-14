import { ChevronDown } from 'lucide-react'
import {
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import {
  endSlotPadding,
  type FieldLabelProps,
  FieldShell,
  type FieldSize,
  iconSize,
  isPresent,
  startSlotPadding,
  textSize,
  useMergedRef,
} from '../input/field'

/** `value` must be non-empty: `''` is reserved for "nothing chosen". */
export type SelectOption = {
  value: string
  /** Also the option's text, which typeahead and screen readers use. */
  label: string
  /** Decorative (aria-hidden); shown in the picker and on the trigger while selected. */
  icon?: ReactNode
  disabled?: boolean
}

export type SelectGroup = { label: string; options: SelectOption[] }

type NativeSelectProps = Omit<
  ComponentProps<'select'>,
  'size' | 'children' | 'multiple' | 'value' | 'defaultValue'
>

export type SelectProps = NativeSelectProps &
  FieldLabelProps & {
    options: (SelectOption | SelectGroup)[]
    /** `''` means nothing chosen. */
    value?: string
    defaultValue?: string
    /** Shown while nothing is chosen. Label-above only: a floating label takes its place (MUI). */
    placeholder?: string
    helperText?: ReactNode
    /** Truthy puts the field in the error state; the text replaces helperText. */
    error?: ReactNode
    size?: FieldSize
    /** Fixed decorative leading icon; the selected option's own icon wins when it has one. */
    start?: ReactNode
    mono?: boolean
    /** Classes for the `<select>`; `className` goes to the outer wrapper. */
    selectClassName?: string
    /** A native select can't be read-only; use disabled or a read-only Input. */
    readOnly?: never
    /** Single choice only. */
    multiple?: never
    /** The trailing slot belongs to the chevron. */
    end?: never
  }

// Text inset, and with an icon: the Input's slot padding + icon + 8px gap (8+16+8, 10+16+8, 12+18+8)
const selectPadding = { sm: 'px-3', md: 'px-3', lg: 'px-4' } as const
const iconStartPadding = { sm: 'ps-8', md: 'ps-[34px]', lg: 'ps-[38px]' } as const
const chevronEndPadding = { sm: 'pe-8', md: 'pe-[34px]', lg: 'pe-[38px]' } as const
// Resting floating label stops before the chevron: label start (8/8/12px) + the chevron's area
const labelRestingWidth = {
  sm: 'max-w-[calc(100%-40px)]',
  md: 'max-w-[calc(100%-42px)]',
  lg: 'max-w-[calc(100%-50px)]',
} as const

const isGroup = (item: SelectOption | SelectGroup): item is SelectGroup => 'options' in item

/*
 * The customizable picker (Chromium 135+, Safari 27), all behind the
 * `supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:` variant. Fine
 * pointers only: touch keeps the OS picker, which suits thumbs and long lists better. Elsewhere
 * (Firefox) the select stays native. Both the select and its picker must opt in. The picker opens
 * 4px below the trigger, at least as wide, flips up when it would overflow, and scrolls within the
 * space it gets, keeping 8px off the viewport edge (but never below 10rem, so a cramped side
 * overflows and flips).
 */
const pickerClasses = cn(
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[appearance:base-select]',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:[appearance:base-select]',
  // We draw our own chevron
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker-icon]:hidden',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:[position-area:block-end_span-inline-end]',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:[position-try-fallbacks:flip-block]',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:mt-1',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:min-w-[anchor-size(width)]',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:max-h-[max(10rem,calc(100%-12px))]',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:overflow-y-auto',
  // One radius step above the trigger, so inner rows (rounded-lg) sit concentric in the 4px inset
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:rounded-xl',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:border',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:border-popover-border',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:bg-popover-bg',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:p-1',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:shadow-popover',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:text-fg',
  // Fade + slight grow from the trigger edge; closing is quicker than opening. display/overlay are
  // discrete, so allow-discrete keeps the picker in the top layer until the fade-out ends. The picker
  // can't tell it was flipped, so a flipped one also grows from its top; at 0.96 that barely shows.
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:origin-top',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:opacity-0',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:scale-96',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:transition-[opacity,scale,display,overlay]',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:transition-discrete',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:duration-80',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::picker(select)]:ease-out',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:open:[&::picker(select)]:opacity-100',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:open:[&::picker(select)]:scale-100',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:open:[&::picker(select)]:duration-120',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:open:[&::picker(select)]:starting:opacity-0',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:open:[&::picker(select)]:starting:scale-96',
  'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:motion-reduce:[&::picker(select)]:transition-none',
)

function optionClasses(size: FieldSize, mono: boolean) {
  return cn(
    // Explicit colors: the trigger's placeholder color would otherwise reach the options, and native
    // popups (Firefox) take option colors without the page's dark color-scheme
    'bg-popover-bg text-fg checked:font-medium disabled:text-fg-subtle',
    textSize[size],
    mono && 'font-mono',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:flex',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:cursor-default',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:items-center',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:gap-2',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:rounded-lg',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:bg-transparent',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:px-2',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:py-1.5',
    // Pointer and keyboard share one highlight, so there is never a second "current" row
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:not-disabled:hover:bg-popover-highlight',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:focus-visible:bg-popover-highlight',
    // Transparent outline: invisible normally, painted as the focus indicator in forced colors
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:focus-visible:outline-hidden',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:disabled:text-fg',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:disabled:opacity-50',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::checkmark]:order-1',
    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:[&::checkmark]:ms-auto',
  )
}

// A tap on the frame's touch padding should open the picker, as a tap on the select does
function openPicker(select: HTMLSelectElement) {
  select.focus()
  try {
    select.showPicker?.()
  } catch {
    // Not allowed without user activation, or unsupported; focus alone is the fallback
  }
}

/**
 * Single-choice select: a real `<select>` (native keyboard, typeahead, forms, validation and
 * autofill), customized through `appearance: base-select` where supported. Same frame as Input.
 */
export function Select({
  options,
  placeholder,
  helperText,
  error,
  size = 'md',
  start,
  mono = false,
  className,
  selectClassName,
  label,
  floating = false,
  id,
  required,
  disabled,
  value,
  defaultValue,
  onChange,
  ref,
  'aria-describedby': describedByProp,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null)
  const setRef = useMergedRef(selectRef, ref)
  const controlled = value !== undefined
  // Tracked only to show the selected option's icon on the trigger
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
  const current = controlled ? value : uncontrolledValue

  // form.reset() restores the select without a change event. The reset event fires before the
  // reset itself, so read the value on the next task.
  // The form attribute can move the select to another form
  useEffect(() => {
    const form = selectRef.current?.form
    if (!form) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onReset = () => {
      timer = setTimeout(() => {
        if (selectRef.current) setUncontrolledValue(selectRef.current.value)
      })
    }
    form.addEventListener('reset', onReset)
    return () => {
      form.removeEventListener('reset', onReset)
      clearTimeout(timer)
    }
  }, [props.form])

  const selected = options
    .flatMap((item) => (isGroup(item) ? item.options : [item]))
    .find((option) => option.value === current)
  const leading = selected?.icon ?? start
  const hasLeading = isPresent(leading)

  const optionClass = optionClasses(size, mono)
  const renderOption = (option: SelectOption) => (
    <option
      key={option.value}
      value={option.value}
      disabled={option.disabled}
      className={optionClass}
    >
      {isPresent(option.icon) && (
        <span aria-hidden className="flex shrink-0 text-fg-muted [&_svg]:size-4 [&_svg]:shrink-0">
          {option.icon}
        </span>
      )}
      <span>{option.label}</span>
    </option>
  )

  return (
    <FieldShell
      label={label}
      floating={floating}
      helperText={helperText}
      error={error}
      size={size}
      id={id}
      required={required}
      disabled={disabled}
      aria-describedby={describedByProp}
      // Keeps a floating label off the leading icon, as Input's start adornment does
      hasStart={hasLeading}
      className={className}
      controlRef={selectRef}
      activate={openPicker}
    >
      {(field) => (
        <>
          {field.floatingLabel(labelRestingWidth[size])}
          <select
            {...props}
            ref={setRef}
            id={field.id}
            required={required}
            disabled={disabled}
            // Without a default the browser would preselect the first enabled option
            {...(controlled ? { value } : { defaultValue: defaultValue ?? '' })}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              if (!controlled) setUncontrolledValue(e.currentTarget.value)
              onChange?.(e)
            }}
            aria-invalid={field.invalid ? true : ariaInvalid}
            aria-describedby={field.describedBy}
            className={cn(
              // Fills the control, so a click anywhere on the field lands on the select and opens it
              'size-full min-w-0 appearance-none items-center truncate rounded-[inherit] bg-transparent text-fg outline-none',
              'pointer-coarse:text-base disabled:cursor-not-allowed',
              // Nothing chosen: the placeholder option shows in the placeholder color
              '[&:has(option[value=""]:checked)]:text-input-placeholder',
              textSize[size],
              selectPadding[size],
              hasLeading && iconStartPadding[size],
              chevronEndPadding[size],
              mono && 'font-mono',
              pickerClasses,
              selectClassName,
            )}
          >
            {/* "Nothing chosen": never offered in the list, and fails `required` like an empty input */}
            <option value="" disabled hidden>
              {field.floating ? '' : (placeholder ?? '')}
            </option>
            {options.map((item) =>
              isGroup(item) ? (
                <optgroup
                  key={`group:${item.label}`}
                  label={item.label}
                  className={cn(
                    // Group titles are UI text, not values: options set mono themselves
                    'bg-popover-bg font-sans text-fg',
                    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:text-xs',
                    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:font-medium',
                    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:text-fg-muted',
                    'supports-[appearance:base-select]:[@media(hover:hover)_and_(pointer:fine)]:not-first-of-type:mt-1',
                  )}
                >
                  {item.options.map(renderOption)}
                </optgroup>
              ) : (
                renderOption(item)
              ),
            )}
          </select>
          {hasLeading && (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-y-0 inset-s-0 flex items-center text-fg-muted [&_svg]:shrink-0',
                iconSize[size],
                startSlotPadding[size],
              )}
            >
              {leading}
            </span>
          )}
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-0 inset-e-0 flex items-center text-fg-muted',
              iconSize[size],
              endSlotPadding[size],
            )}
          >
            <ChevronDown className="transition-transform duration-150 ease-out group-has-[select:open]/control:rotate-180 motion-reduce:transition-none" />
          </span>
        </>
      )}
    </FieldShell>
  )
}
