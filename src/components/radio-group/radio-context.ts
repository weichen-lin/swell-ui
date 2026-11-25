import {
  type ChangeEvent,
  createContext,
  type Ref,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react'
import { useMergedRef } from '../input/field'

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

export const RadioContext = createContext<RadioContextValue | null>(null)

export function useRadioItem(
  value: string,
  disabled?: boolean,
  ref?: Ref<HTMLInputElement>,
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void,
) {
  const group = useContext(RadioContext)
  if (!group) throw new Error('Radio items must be rendered inside <RadioGroup>')
  if (value === '') throw new Error('Radio value must be a non-empty string')
  const ownRef = useRef<HTMLInputElement>(null)
  const mergedRef = useMergedRef(ownRef, ref)
  const register = group.register
  useLayoutEffect(() => {
    if (ownRef.current) return register(ownRef.current)
  }, [register, value])

  return {
    group,
    inputProps: {
      type: 'radio' as const,
      ref: mergedRef,
      name: group.name,
      form: group.form,
      value,
      checked: group.selected === value,
      disabled: group.disabled || disabled,
      required: group.required,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event)
        group.select(event)
      },
    },
  }
}
