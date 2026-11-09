import { Search, X } from 'lucide-react'
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button'
import { compactButton, FieldFrame, type FieldProps } from './field'

export type SearchInputProps = Omit<FieldProps, 'type' | 'label' | 'floating' | 'start'> & {
  /** Required: a search field has no visible label. */
  'aria-label': string
  /** Called after the clear button or Esc empties the field. */
  onClear?: () => void
  label?: never
  floating?: never
  start?: never
  type?: never
}

// React tracks the last value it set; going through the prototype setter makes the next
// `input` event register as a change, so onChange fires for controlled and uncontrolled use
function setNativeValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

export function SearchInput({
  onClear,
  onChange,
  onKeyDown,
  inputClassName,
  size = 'md',
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const controlled = props.value !== undefined
  const [filled, setFilled] = useState(() => Boolean(props.defaultValue))
  const hasValue = controlled ? String(props.value) !== '' : filled
  const canClear = hasValue && !props.disabled && !props.readOnly

  const clear = () => {
    const input = inputRef.current
    if (!input) return
    setNativeValue(input, '')
    onClear?.()
    input.focus()
  }

  return (
    <FieldFrame
      {...props}
      size={size}
      type="search"
      inputRef={inputRef}
      start={<Search />}
      // The browser's own cancel button would duplicate ours
      inputClassName={cn(
        '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
        inputClassName,
      )}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        if (!controlled) setFilled(e.currentTarget.value !== '')
        onChange?.(e)
      }}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(e)
        // Empty field: let Esc reach outer handlers (e.g. close a dialog)
        if (e.key !== 'Escape' || e.defaultPrevented || e.currentTarget.value === '') return
        if (props.readOnly) return
        e.preventDefault()
        e.stopPropagation()
        clear()
      }}
      actions={
        canClear ? (
          <Button
            icon={<X />}
            aria-label="Clear search"
            intent="ghost"
            size={size}
            className={compactButton[size]}
            // Keep focus (and the caret) in the input
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
          />
        ) : null
      }
    />
  )
}
