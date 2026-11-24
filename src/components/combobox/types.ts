import type { ComponentProps, ReactNode } from 'react'
import type { FieldLabelProps, FieldSize } from '../input/field'

export type ComboboxOption = {
  /** Stable, unique, non-empty submitted ID. Labels need not be unique. */
  value: string
  /** Display text; also what the default filter matches and what the input shows once chosen. */
  label: string
  /** Secondary text under the label, announced as the option's description. */
  description?: ReactNode
  /** Decorative; hidden from assistive technology. */
  icon?: ReactNode
  /** Extra terms the default filter matches besides the label. */
  keywords?: readonly string[]
  /** Visible but not selectable; arrow keys skip it. */
  disabled?: boolean
}
export type ComboboxGroup = {
  /** Group title; also the accessible name of the group. */
  label: string
  /** Options in the group; a group with no match for the query is hidden. */
  options: readonly ComboboxOption[]
}
export type ComboboxValueChangeDetails = {
  /** `'select'` when an option was chosen, `'clear'` when the selection was removed. */
  reason: 'select' | 'clear'
  /** The chosen option; `null` when cleared. */
  option: ComboboxOption | null
}
export type ComboboxInputChangeDetails = {
  /**
   * `'input'`: the user typed. `'selection'`: an option's label replaced the text. `'clear'`:
   * the clear button emptied it. `'revert'`: the draft was discarded on close. `'reset'`: the
   * form was reset.
   */
  reason: 'input' | 'selection' | 'clear' | 'revert' | 'reset'
}
export type ComboboxOpenChangeDetails = {
  /** What opened or closed the list. */
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
  | {
      /** Selected option's `value`, or `null` for none (controlled). Pair it with `onValueChange`. */
      value: string | null
      defaultValue?: never
    }
  | {
      value?: undefined
      /**
       * Initially selected option's `value` when uncontrolled.
       * @defaultValue null
       */
      defaultValue?: string | null
    }
type Disclosure =
  | {
      /** Whether the list is open (controlled). Pair it with `onOpenChange`. */
      open: boolean
      defaultOpen?: never
    }
  | {
      open?: undefined
      /**
       * Whether the list starts open when uncontrolled.
       * @defaultValue false
       */
      defaultOpen?: boolean
    }

export type ComboboxProps = NativeProps &
  FieldLabelProps &
  Selection &
  Disclosure & {
    /** Options and option groups, in display order. Values must be unique and non-empty. */
    options: readonly (ComboboxOption | ComboboxGroup)[]
    /** Called when an option is chosen or the selection is cleared. */
    onValueChange?: (value: string | null, details: ComboboxValueChangeDetails) => void
    /** Text in the input (controlled). Pair it with `onInputValueChange`. */
    inputValue?: string
    /** Only reason="input" should issue a search request. */
    onInputValueChange?: (text: string, details: ComboboxInputChangeDetails) => void
    /** Called when the list opens or closes; `details.reason` says why. */
    onOpenChange?: (open: boolean, details: ComboboxOpenChangeDetails) => void
    /**
     * `false` for externally filtered results. Otherwise a function, or the default: label and
     * keywords, case and accent insensitive.
     */
    filter?: false | ((option: ComboboxOption, query: string) => boolean)
    /** Supplies a label when the selected ID is not in the current search results. */
    selectedOption?: ComboboxOption | null
    /**
     * Shows the loading message instead of options and blocks selection.
     * @defaultValue false
     */
    loading?: boolean
    /**
     * Message shown, and announced, while `loading`.
     * @defaultValue 'Loading…'
     */
    loadingText?: string
    /**
     * Spinner before `loadingText`, sized to 16px and spun by the list (slowed under reduced
     * motion), so pass a static icon. Defaults to a circular loader.
     */
    loadingIcon?: ReactNode
    /** Failure message shown instead of options; a string is also announced. */
    searchError?: ReactNode
    /**
     * Icon before `searchError`, sized to it. Defaults to a circled exclamation mark; `false` or
     * `null` hides it.
     */
    searchErrorIcon?: ReactNode
    /** Shows a retry button next to `searchError`. */
    onRetry?: () => void
    /**
     * Label of the retry button.
     * @defaultValue 'Retry'
     */
    retryText?: string
    /**
     * Shown when no option matches.
     * @defaultValue 'No matching options.'
     */
    emptyText?: ReactNode
    /**
     * Shows a clear button while there is text or a selection.
     * @defaultValue true
     */
    clearable?: boolean
    /**
     * Opens the list when the input gets focus.
     * @defaultValue false
     */
    openOnFocus?: boolean
    /**
     * Accessible name of the clear button.
     * @defaultValue 'Clear selection'
     */
    clearLabel?: string
    /**
     * Accessible name of the chevron button while closed.
     * @defaultValue 'Open options'
     */
    openLabel?: string
    /**
     * Accessible name of the chevron button while open.
     * @defaultValue 'Close options'
     */
    closeLabel?: string
    /** Icon of the clear button, sized to the button's icon size. Defaults to an X. */
    clearIcon?: ReactNode
    /** Icon of the open/close button, sized to the button's icon size. Defaults to a chevron. */
    chevronIcon?: ReactNode
    /** Mark on the selected option, sized to 16px. Defaults to a check mark. */
    checkIcon?: ReactNode
    /**
     * Native constraint-validation message: selection is required, not just typed text.
     * @defaultValue 'Choose an option from the list.'
     */
    requiredText?: string
    /**
     * Validation message when the selected `value` matches no option and no `selectedOption`.
     * @defaultValue 'The selected option is unavailable.'
     */
    unresolvedText?: string
    /**
     * Localize the polite result-count announcement.
     * @defaultValue (count) => `${count} option(s) available.`
     */
    getResultsText?: (count: number) => string
    /** Supporting text below the field; linked as the accessible description. */
    helperText?: ReactNode
    /** Truthy puts the field in the error state; the text replaces `helperText`. */
    error?: ReactNode
    /**
     * Icon before the error text, sized to it. Defaults to a circled exclamation mark; `false` or
     * `null` hides it.
     */
    errorIcon?: ReactNode
    /**
     * Field height and text size: `'sm' | 'md' | 'lg'`.
     * @defaultValue 'md'
     */
    size?: FieldSize
    /** Decorative leading icon or a short text prefix. */
    start?: ReactNode
    /** Monospace text, with spellcheck and autocorrect off. */
    mono?: boolean
    /** Classes for the `<input>`; `className` goes to the outer wrapper. */
    inputClassName?: string
    /** Classes for the options panel. */
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
