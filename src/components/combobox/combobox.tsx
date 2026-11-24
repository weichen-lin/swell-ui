/* Custom listbox: options are addressed by aria-activedescendant and all keyboard input stays on the text input. Native option/select tags cannot implement that interaction. */
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events */
import { useEffectEvent, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon, XIcon } from '../../icons'
import { cn } from '../../lib/cn'
import { iconOr, MessageIcon, Spinner } from '../../lib/icon-slots'
import { Button } from '../button'
import { compactButton, FieldFrame } from '../input/field'
import {
  type ComboboxInputChangeDetails,
  type ComboboxOpenChangeDetails,
  type ComboboxOption,
  type ComboboxProps,
  defaultFilter,
  isGroup,
} from './types'
import { useComboboxPosition } from './use-combobox-position'

const resultsText = (count: number) => `${count} ${count === 1 ? 'option' : 'options'} available.`

export function Combobox({
  options,
  value,
  defaultValue = null,
  onValueChange,
  inputValue,
  onInputValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  filter = defaultFilter,
  selectedOption,
  loading = false,
  loadingText = 'Loading…',
  loadingIcon,
  searchError,
  searchErrorIcon,
  onRetry,
  retryText = 'Retry',
  emptyText = 'No matching options.',
  clearable = true,
  openOnFocus = false,
  clearLabel = 'Clear selection',
  openLabel = 'Open options',
  closeLabel = 'Close options',
  clearIcon,
  chevronIcon,
  checkIcon,
  requiredText = 'Choose an option from the list.',
  unresolvedText = 'The selected option is unavailable.',
  getResultsText = resultsText,
  label,
  floating,
  helperText,
  error,
  errorIcon,
  size = 'md',
  start,
  mono,
  inputClassName,
  contentClassName,
  className,
  name,
  form,
  disabled,
  readOnly,
  required,
  ref,
  id: idProp,
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  onInvalid,
  ...props
}: ComboboxProps) {
  const autoId = useId()
  const id = idProp ?? `${autoId}-input`
  const listId = `${autoId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLInputElement>(null)
  const composing = useRef(false)
  const skipFocusOpen = useRef(false)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [draft, setDraft] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [compositionText, setCompositionText] = useState<string | null>(null)
  const [active, setActive] = useState<{
    value: string
    options: ComboboxProps['options']
    query: string
  } | null>(null)
  const [nativeInvalid, setNativeInvalid] = useState(false)
  const selectedValue = value === undefined ? internalValue : value
  const open = !disabled && !readOnly && (openProp ?? internalOpen)
  const flat = useMemo(() => {
    const items = options.flatMap((item) => (isGroup(item) ? [...item.options] : [item]))
    const seen = new Set<string>()
    for (const item of items) {
      if (!item.value || seen.has(item.value))
        throw new Error('Combobox option values must be unique, non-empty strings')
      seen.add(item.value)
    }
    return items
  }, [options])
  const resolved =
    flat.find((item) => item.value === selectedValue) ??
    (selectedOption?.value === selectedValue ? selectedOption : null)
  const [cached, setCached] = useState<ComboboxOption | null>(resolved)
  const selected = resolved ?? (cached?.value === selectedValue ? cached : null)
  const [initialOption, setInitialOption] = useState(
    resolved?.value === defaultValue ? resolved : null,
  )
  if (resolved?.value === defaultValue && resolved !== initialOption) setInitialOption(resolved)
  const text =
    compositionText !== null
      ? (draft ?? inputValue ?? selected?.label ?? '')
      : (inputValue ?? draft ?? selected?.label ?? '')
  const query = dirty ? (compositionText ?? text) : ''
  const blocked = loading || Boolean(searchError)
  const [previousResults, setPreviousResults] = useState({ options, blocked, filter })
  if (
    previousResults.options !== options ||
    previousResults.blocked !== blocked ||
    previousResults.filter !== filter
  ) {
    setPreviousResults({ options, blocked, filter })
    setActive(null)
  }
  const visible = flat.filter((item) => filter === false || !query || filter(item, query))
  const activeItem =
    !blocked && active?.options === options && active.query === query
      ? visible.find((item) => item.value === active.value && !item.disabled)
      : undefined
  const optionId = (item: ComboboxOption) => `${autoId}-option-${encodeURIComponent(item.value)}`
  const activeId = open && activeItem ? optionId(activeItem) : undefined
  const invalidMessage =
    selectedValue !== null && !selected
      ? unresolvedText
      : required && selectedValue === null
        ? requiredText
        : ''
  const fieldError = error || (nativeInvalid && invalidMessage ? invalidMessage : undefined)
  const count = visible.filter((item) => !item.disabled).length
  const status = open
    ? searchError
      ? typeof searchError === 'string'
        ? searchError
        : 'Unable to load options.'
      : loading
        ? loadingText
        : getResultsText(count)
    : ''

  // Reconcile changed props before committing children, without an extra effect render.
  const [previousSelection, setPreviousSelection] = useState({
    value: selectedValue,
    label: selected?.label,
  })
  if (resolved && resolved !== cached) setCached(resolved)
  if (previousSelection.value !== selectedValue || previousSelection.label !== selected?.label) {
    setPreviousSelection({ value: selectedValue, label: selected?.label })
    setDraft(null)
    setDirty(false)
    setActive(null)
  }
  if (nativeInvalid && !invalidMessage) setNativeInvalid(false)
  useLayoutEffect(() => {
    inputRef.current?.setCustomValidity(disabled || readOnly ? '' : invalidMessage)
  }, [invalidMessage, disabled, readOnly])
  const positionStyle = useComboboxPosition(open, inputRef, contentRef)
  useLayoutEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])

  const updateText = (
    next: string,
    reason: ComboboxInputChangeDetails['reason'],
    fallback = false,
  ) => {
    setDraft(fallback ? null : next)
    if (next !== text || reason === 'input') onInputValueChange?.(next, { reason })
  }
  const changeOpen = (next: boolean, reason: ComboboxOpenChangeDetails['reason']) => {
    if (openProp === undefined) setInternalOpen(next)
    if (next !== open) onOpenChange?.(next, { reason })
  }
  const close = (reason: ComboboxOpenChangeDetails['reason']) => {
    changeOpen(false, reason)
    updateText(selected?.label ?? '', 'revert', true)
    setDirty(false)
    setActive(null)
  }
  const show = (reason: ComboboxOpenChangeDetails['reason'], direction?: 1 | -1) => {
    if (disabled || readOnly) return
    changeOpen(true, reason)
    setDirty(false)
    const items = flat.filter((item) => !item.disabled)
    const initial =
      items.find((item) => item.value === selectedValue) ??
      (direction === 1 ? items[0] : direction === -1 ? items.at(-1) : undefined)
    setActive(initial ? { value: initial.value, options, query: '' } : null)
  }
  const focusInput = () => {
    skipFocusOpen.current = true
    inputRef.current?.focus({ preventScroll: true })
    skipFocusOpen.current = false
  }
  const clear = (reason: 'input' | 'clear') => {
    if (value === undefined) setInternalValue(null)
    if (selectedValue !== null) onValueChange?.(null, { reason: 'clear', option: null })
    updateText('', reason)
    setDirty(true)
    setActive(null)
    changeOpen(true, 'clear')
  }
  const edit = (next: string) => {
    if (disabled || readOnly) return
    if (next === '') clear('input')
    else {
      updateText(next, 'input')
      setDirty(true)
      setActive(null)
      changeOpen(true, 'input')
    }
  }
  const choose = (item: ComboboxOption) => {
    if (blocked || disabled || readOnly || item.disabled) return
    setCached(item)
    if (value === undefined) setInternalValue(item.value)
    if (selectedValue !== item.value)
      onValueChange?.(item.value, { reason: 'select', option: item })
    updateText(item.label, 'selection', true)
    setDirty(false)
    setActive(null)
    changeOpen(false, 'select')
    focusInput()
  }
  const dismiss = useEffectEvent(close)
  useLayoutEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!event.composedPath().includes(rootRef.current!)) dismiss('outside')
    }
    document.addEventListener('pointerdown', outside, true)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
    }
  }, [open])
  const wasOpen = useRef(open)
  // Covers externally controlled close and disabling while a query is being edited.
  const settle = useEffectEvent(() => {
    updateText(selected?.label ?? '', 'revert', true)
    setDirty(false)
    setActive(null)
  })
  // A controlled close can come from outside the composite; settle its transient editing state.
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- a controlled close must discard transient editing text.
    if (wasOpen.current && !open) settle()
    wasOpen.current = open
  }, [open])

  const reset = useEffectEvent(() => {
    const nextValue = value === undefined ? defaultValue : value
    const nextOption =
      flat.find((item) => item.value === nextValue) ??
      (selectedOption?.value === nextValue ? selectedOption : null) ??
      (cached?.value === nextValue ? cached : null) ??
      (initialOption?.value === nextValue ? initialOption : null)
    if (nextOption) setCached(nextOption)
    const nextText = inputValue ?? nextOption?.label ?? ''
    if (value === undefined) setInternalValue(nextValue)
    if (openProp === undefined) setInternalOpen(false)
    updateText(nextText, 'reset', true)
    setDirty(false)
    setCompositionText(null)
    composing.current = false
    setActive(null)
    setNativeInvalid(false)
    // Native reset may mutate the DOM even if React's value did not change.
    if (inputRef.current) inputRef.current.value = nextText
    if (hiddenRef.current) hiddenRef.current.value = nextValue ?? ''
  })
  useLayoutEffect(() => {
    const owner = inputRef.current?.form
    if (!owner) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const handleReset = (event: Event) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!event.defaultPrevented) reset()
      }, 0)
    }
    owner.addEventListener('reset', handleReset)
    return () => {
      clearTimeout(timer)
      owner.removeEventListener('reset', handleReset)
    }
  }, [form])

  const renderOption = (item: ComboboxOption) => (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- editable combobox options are a custom listbox, not a native select.
    <div
      key={item.value}
      id={optionId(item)}
      role="option"
      aria-selected={item.value === selectedValue}
      aria-disabled={item.disabled || undefined}
      aria-labelledby={`${optionId(item)}-label`}
      aria-describedby={item.description ? `${optionId(item)}-description` : undefined}
      data-slot="combobox-option"
      data-active={activeItem?.value === item.value ? '' : undefined}
      className={cn(
        'flex min-h-control-sm cursor-default items-center gap-2 rounded-control px-2 py-1.5 text-sm/5 text-fg outline-none select-none pointer-coarse:min-h-11',
        'data-active:bg-popover-highlight data-active:outline-1 data-active:-outline-offset-1 data-active:outline-input-border',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 forced-colors:data-active:outline-[Highlight]',
      )}
      onPointerMove={(event) => {
        if (event.pointerType !== 'touch' && !item.disabled)
          setActive({ value: item.value, options, query })
      }}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => choose(item)}
    >
      {item.icon && (
        <span aria-hidden className="shrink-0 text-fg-muted [&_svg]:size-4">
          {item.icon}
        </span>
      )}
      <span className="min-w-0 flex-1 wrap-anywhere">
        <span id={`${optionId(item)}-label`}>{item.label}</span>
        {item.description && (
          <span
            id={`${optionId(item)}-description`}
            className="mt-0.5 block text-xs/snug text-fg-muted"
          >
            {item.description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        data-slot="combobox-check"
        className={cn(
          'flex shrink-0 [&_svg]:size-4 [&_svg]:shrink-0',
          item.value !== selectedValue && 'invisible',
        )}
      >
        {iconOr(checkIcon, <CheckIcon />)}
      </span>
    </div>
  )

  return (
    <div
      ref={rootRef}
      onBlur={(event) => {
        if ((open || dirty) && !rootRef.current?.contains(event.relatedTarget as Node | null))
          close('blur')
      }}
      data-slot="combobox"
      data-state={open ? 'open' : 'closed'}
      className={cn('w-full', className)}
    >
      <FieldFrame
        {...props}
        ref={ref}
        inputRef={inputRef}
        id={id}
        type="text"
        form={form}
        label={label}
        floating={floating}
        helperText={helperText}
        error={fieldError}
        errorIcon={errorIcon}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        size={size}
        start={start}
        mono={mono}
        value={text}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeId}
        autoComplete={props.autoComplete ?? 'off'}
        status={status}
        inputClassName={inputClassName}
        className="pointer-coarse:**:data-[slot=input-control]:min-h-11"
        onChange={(event) => {
          if (composing.current) setDraft(event.currentTarget.value)
          else edit(event.currentTarget.value)
        }}
        onCompositionStart={(event) => {
          onCompositionStart?.(event)
          composing.current = true
          setCompositionText(query)
        }}
        onCompositionEnd={(event) => {
          onCompositionEnd?.(event)
          composing.current = false
          setCompositionText(null)
          edit(event.currentTarget.value)
        }}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented && !open) show('trigger')
        }}
        onFocus={(event) => {
          onFocus?.(event)
          if (!event.defaultPrevented && openOnFocus && !open && !skipFocusOpen.current)
            show('input')
        }}
        onBlur={onBlur}
        onInvalid={(event) => {
          setNativeInvalid(true)
          onInvalid?.(event)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (
            event.defaultPrevented ||
            disabled ||
            readOnly ||
            composing.current ||
            event.nativeEvent.isComposing ||
            event.nativeEvent.keyCode === 229
          )
            return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const direction = event.key === 'ArrowDown' ? 1 : -1
            if (!open) {
              show('keyboard', direction)
              return
            }
            if (blocked) return
            const enabled = visible.filter((item) => !item.disabled)
            const index = enabled.findIndex((item) => item.value === activeItem?.value)
            const next =
              index < 0
                ? direction === 1
                  ? enabled[0]
                  : enabled.at(-1)
                : enabled[index + direction]
            if (next) setActive({ value: next.value, options, query })
          } else if (event.key === 'Enter' && open) {
            event.preventDefault()
            if (activeItem) choose(activeItem)
          } else if (event.key === 'Escape' && open) {
            event.preventDefault()
            event.stopPropagation()
            close('escape')
          } else if (event.key === 'Tab' && !(searchError && onRetry)) close('blur')
        }}
        actions={
          !readOnly && (
            <>
              {clearable && (text !== '' || selectedValue !== null) && (
                <Button
                  type="button"
                  icon={iconOr(clearIcon, <XIcon />)}
                  aria-label={clearLabel}
                  intent="ghost"
                  size={size}
                  disabled={disabled}
                  className={cn(
                    compactButton[size],
                    'pointer-coarse:size-11 pointer-coarse:before:hidden',
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    clear('clear')
                    focusInput()
                  }}
                />
              )}
              <Button
                type="button"
                icon={iconOr(chevronIcon, <ChevronDownIcon />)}
                tabIndex={-1}
                aria-label={open ? closeLabel : openLabel}
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                disabled={disabled}
                intent="ghost"
                size={size}
                className={cn(
                  compactButton[size],
                  'pointer-coarse:size-11 pointer-coarse:before:hidden',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  focusInput()
                  if (open) close('trigger')
                  else show('trigger')
                }}
              />
            </>
          )
        }
      />
      {name && (
        <input
          ref={hiddenRef}
          type="hidden"
          name={name}
          form={form}
          disabled={disabled}
          value={selectedValue ?? ''}
        />
      )}
      {open && (
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- handles Escape bubbling from the optional retry button.
        <div
          ref={contentRef}
          popover="manual"
          data-slot="combobox-content"
          style={positionStyle}
          className={cn(
            'fixed inset-auto z-50 m-0 box-border max-h-70 overflow-y-auto rounded-surface border border-popover-border bg-popover-bg p-1 font-sans text-sm text-fg shadow-popover outline-none scrollbar-subtle',
            'transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none',
            contentClassName,
          )}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              close('escape')
              focusInput()
            }
          }}
        >
          {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- this listbox keeps DOM focus in the editable input. */}
          <div
            id={listId}
            role="listbox"
            aria-label={label ?? props['aria-label']}
            aria-busy={loading || undefined}
          >
            {!blocked &&
              options.map((item, index) => {
                if (!isGroup(item)) return visible.includes(item) ? renderOption(item) : null
                const members = item.options.filter((option) => visible.includes(option))
                if (!members.length) return null
                return (
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- named option groups within a custom listbox.
                  <div
                    key={`${item.label}-${index}`}
                    role="group"
                    aria-labelledby={`${autoId}-group-${index}`}
                    data-slot="combobox-group"
                    className="not-first:mt-1 not-first:border-t not-first:border-popover-border not-first:pt-1"
                  >
                    <div
                      id={`${autoId}-group-${index}`}
                      className="px-2 pt-1.5 pb-1 text-xs font-medium text-fg-muted"
                    >
                      {item.label}
                    </div>
                    {members.map(renderOption)}
                  </div>
                )
              })}
          </div>
          {searchError ? (
            <div className="flex items-start gap-2 p-3 text-xs text-danger">
              <MessageIcon icon={searchErrorIcon} className="mt-px" />
              <span className="flex-1">{searchError}</span>
              {onRetry && (
                <Button type="button" size="sm" intent="secondary" onClick={onRetry}>
                  {retryText}
                </Button>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-fg-muted">
              <Spinner
                icon={loadingIcon}
                className="motion-reduce:[animation-duration:2.5s] [&_svg]:size-4 [&_svg]:shrink-0"
              />
              {loadingText}
            </div>
          ) : visible.length === 0 ? (
            <div className="p-4 text-center text-sm text-fg-muted">{emptyText}</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
