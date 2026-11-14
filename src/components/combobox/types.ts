import type { ComponentProps, ReactNode } from 'react'
import type { FieldLabelProps, FieldSize } from '../input/field'

export type ComboboxOption = {
  /** Stable, unique, non-empty submitted ID. Labels need not be unique. */
  value: string
  label: string
  description?: ReactNode
  /** Decorative; hidden from assistive technology. */
  icon?: ReactNode
  keywords?: readonly string[]
  disabled?: boolean
}
export type ComboboxGroup = { label: string; options: readonly ComboboxOption[] }
export type ComboboxValueChangeDetails = {
  reason: 'select' | 'clear'
  option: ComboboxOption | null
}
export type ComboboxInputChangeDetails = {
  reason: 'input' | 'selection' | 'clear' | 'revert' | 'reset'
}
export type ComboboxOpenChangeDetails = {
  reason: 'input' | 'trigger' | 'keyboard' | 'select' | 'escape' | 'blur' | 'outside' | 'clear'
}

type NativeProps = Omit<
  ComponentProps<'input'>,
  | 'size'
  | 'type'
  | 'children'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'list'
  | 'role'
  | 'aria-autocomplete'
  | 'aria-controls'
  | 'aria-expanded'
  | 'aria-activedescendant'
>
type Selection =
  | { value: string | null; defaultValue?: never }
  | { value?: undefined; defaultValue?: string | null }
type Disclosure =
  | { open: boolean; defaultOpen?: never }
  | { open?: undefined; defaultOpen?: boolean }

export type ComboboxProps = NativeProps &
  FieldLabelProps &
  Selection &
  Disclosure & {
    options: readonly (ComboboxOption | ComboboxGroup)[]
    onValueChange?: (value: string | null, details: ComboboxValueChangeDetails) => void
    inputValue?: string
    /** Only reason="input" should issue a search request. */
    onInputValueChange?: (text: string, details: ComboboxInputChangeDetails) => void
    onOpenChange?: (open: boolean, details: ComboboxOpenChangeDetails) => void
    /** false for externally filtered results. Default: label + keywords, case/accent insensitive. */
    filter?: false | ((option: ComboboxOption, query: string) => boolean)
    /** Supplies a label when the selected ID is not in the current search results. */
    selectedOption?: ComboboxOption | null
    loading?: boolean
    loadingText?: string
    searchError?: ReactNode
    onRetry?: () => void
    retryText?: string
    emptyText?: ReactNode
    clearable?: boolean
    openOnFocus?: boolean
    clearLabel?: string
    openLabel?: string
    closeLabel?: string
    /** Native constraint-validation message: selection is required, not just typed text. */
    requiredText?: string
    unresolvedText?: string
    /** Localize the polite result-count announcement. */
    getResultsText?: (count: number) => string
    helperText?: ReactNode
    error?: ReactNode
    size?: FieldSize
    start?: ReactNode
    mono?: boolean
    inputClassName?: string
    contentClassName?: string
  }

export const isGroup = (item: ComboboxOption | ComboboxGroup): item is ComboboxGroup =>
  'options' in item
const normalize = (text: string) =>
  text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
export const defaultFilter = (option: ComboboxOption, query: string) =>
  normalize([option.label, ...(option.keywords ?? [])].join(' ')).includes(normalize(query))
