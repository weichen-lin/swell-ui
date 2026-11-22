import {
  type ComponentProps,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import { type FieldLabelProps, FieldShell, type FieldSize, useMergedRef } from '../input/field'
import { useAutoResize } from './use-auto-resize'

type HeightProps =
  | {
      /**
       * Grow with the content instead of using a fixed height.
       * @defaultValue false
       */
      autoResize?: false
      /**
       * Visible rows. A positive integer; not allowed with `autoResize`.
       * @defaultValue 3
       */
      rows?: number
      /**
       * Manual resize handle. Not allowed with `autoResize`.
       * @defaultValue 'vertical'
       */
      resize?: 'vertical' | 'none'
      minRows?: never
      maxRows?: never
    }
  | {
      /** Grow with the content instead of using a fixed height. */
      autoResize: true
      /**
       * Minimum visible rows. A positive integer; only with `autoResize`.
       * @defaultValue 3
       */
      minRows?: number
      /** Maximum rows before it scrolls. At least `minRows`; only with `autoResize`. */
      maxRows?: number
      rows?: never
      resize?: never
    }

export type TextareaProps = Omit<ComponentProps<'textarea'>, 'children' | 'rows'> &
  FieldLabelProps &
  HeightProps & {
    /** Helper text under the field, linked with aria-describedby. */
    helperText?: ReactNode
    /** Replaces helperText and marks the field invalid. `true` shows only the error outline. */
    error?: ReactNode
    /**
     * Field text size and padding.
     * @defaultValue 'md'
     */
    size?: FieldSize
    /**
     * Shows the character count, and `/ maxLength` when set. UTF-16 length, matching native
     * maxLength. Never truncates controlled values.
     * @defaultValue false
     */
    showCount?: boolean
    /**
     * Monospace font; turns off spellcheck, autocorrect and autocapitalize.
     * @defaultValue false
     */
    mono?: boolean
    /** Classes for the textarea; className belongs to the outer field. */
    textareaClassName?: string
  }

const sizes = {
  sm: 'px-3 py-2 text-sm/5',
  md: 'px-3 py-2.5 text-sm/5',
  lg: 'px-4 py-3 text-base/6',
} as const

function positiveRows(value: number, name: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`Textarea ${name} must be a positive integer.`)
  }
  return value
}

// The native textarea normalizes CRLF / CR into LF before applying maxLength.
const textLength = (value: TextareaProps['value']) =>
  String(value ?? '').replace(/\r\n?/g, '\n').length

export function Textarea({
  label,
  floating = false,
  helperText,
  error,
  size = 'md',
  autoResize = false,
  rows = 3,
  minRows = 3,
  maxRows,
  resize = 'vertical',
  showCount = false,
  mono = false,
  className,
  textareaClassName,
  ref,
  id,
  required,
  disabled,
  readOnly,
  placeholder,
  value,
  defaultValue,
  maxLength,
  onChange,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  const nativeRows = positiveRows(autoResize ? minRows : rows, autoResize ? 'minRows' : 'rows')
  if (autoResize && maxRows != null && positiveRows(maxRows, 'maxRows') < nativeRows) {
    throw new RangeError('Textarea maxRows must be greater than or equal to minRows.')
  }

  const controlRef = useRef<HTMLTextAreaElement>(null)
  const mergedRef = useMergedRef(controlRef, ref)
  const [uncontrolledLength, setUncontrolledLength] = useState(() => textLength(defaultValue))
  const length = value == null ? uncontrolledLength : textLength(value)
  const overLimit = maxLength != null && maxLength >= 0 && length > maxLength
  const countId = `${useId()}-count`
  const resizeToContent = useAutoResize(controlRef, autoResize, nativeRows, maxRows)

  useLayoutEffect(() => {
    const node = controlRef.current
    const form = node?.form
    if (!form || !node) return
    let resetTimer: ReturnType<typeof setTimeout> | undefined
    const reset = (event: Event) => {
      // Native clicks can flush microtasks before the reset default action. A task runs after
      // the browser has restored the value, including when reset came from a reset button.
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        if (event.defaultPrevented) return
        setUncontrolledLength(node.value.length)
        resizeToContent()
      }, 0)
    }
    form.addEventListener('reset', reset)
    return () => {
      clearTimeout(resetTimer)
      form.removeEventListener('reset', reset)
    }
  }, [props.form, resizeToContent])

  return (
    <FieldShell
      multiline
      label={label}
      floating={floating}
      helperText={helperText}
      error={error || overLimit}
      size={size}
      id={id}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      aria-describedby={
        [describedBy, showCount ? countId : null].filter(Boolean).join(' ') || undefined
      }
      className={className}
      controlRef={controlRef}
      footer={
        showCount ? (
          <span
            id={countId}
            className={cn(
              'ms-auto shrink-0 text-xs/snug tabular-nums',
              overLimit ? 'text-danger' : 'text-fg-muted',
            )}
          >
            {length}
            {maxLength != null && maxLength >= 0 ? ` / ${maxLength}` : ''}
          </span>
        ) : undefined
      }
    >
      {(field) => (
        <>
          {field.floatingLabel('max-w-[calc(100%-1rem)]')}
          <textarea
            {...props}
            ref={mergedRef}
            id={field.id}
            rows={nativeRows}
            value={value}
            defaultValue={defaultValue}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={field.floating ? placeholder || ' ' : placeholder}
            aria-invalid={field.invalid ? true : ariaInvalid}
            aria-describedby={field.describedBy}
            spellCheck={mono ? false : props.spellCheck}
            autoCapitalize={mono ? 'off' : props.autoCapitalize}
            autoCorrect={mono ? 'off' : props.autoCorrect}
            onChange={(event) => {
              setUncontrolledLength(event.currentTarget.value.length)
              resizeToContent()
              onChange?.(event)
            }}
            className={cn(
              'block w-full min-w-0 flex-1 rounded-[inherit] border-0 bg-transparent text-fg outline-none',
              'placeholder:text-input-placeholder disabled:cursor-not-allowed pointer-coarse:text-base',
              sizes[size],
              autoResize || resize === 'none' ? 'resize-none' : 'resize-y',
              mono && 'font-mono',
              field.floating && 'placeholder:opacity-0 focus:placeholder:opacity-100',
              textareaClassName,
            )}
          />
        </>
      )}
    </FieldShell>
  )
}
