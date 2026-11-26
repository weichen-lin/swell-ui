/* oxlint-disable jsx-a11y/prefer-tag-over-role -- public ref targets a div; native inputs retain form semantics and the group names the composite field */
import { Fragment, useId, useRef } from 'react'
import { cn } from '../../lib/cn'
import { MessageIcon } from '../../lib/icon-slots'
import { isPresent, useMergedRef } from '../input/field'
import { createScale } from './scale'
import type {
  RangeSliderProps,
  SliderChangeDetails,
  SliderCommitDetails,
  SliderCommonProps,
  SliderProps,
} from './types'
import { useSlider } from './use-slider'

type ControlProps = SliderCommonProps & {
  values?: readonly number[]
  defaults?: readonly number[]
  names?: readonly string[]
  thumbLabels?: readonly [string, string]
  range?: boolean
  minStepsBetweenThumbs?: number
  change?: (value: number[], details: SliderChangeDetails) => void
  commit?: (value: number[], details: SliderCommitDetails) => void
}

function SliderControl({
  values,
  defaults,
  names,
  thumbLabels,
  range = false,
  minStepsBetweenThumbs = 0,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  form,
  label,
  helperText,
  error,
  errorIcon,
  showValue = true,
  formatValue = String,
  getValueText,
  marks,
  change,
  commit,
  className,
  ref,
  onPointerDown,
  onKeyDown,
  onKeyUp,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: ControlProps) {
  const id = useId()
  const scale = createScale(min, max, step, minStepsBetweenThumbs)
  const length = range ? 2 : 1
  const initial = scale.validate(defaults ?? (range ? [min, max] : [min]), length)
  const selected = values === undefined ? undefined : scale.validate(values, length)
  const hasLabel = isPresent(label)
  if (!hasLabel && !ariaLabel?.trim()) throw new Error('Slider requires a label or aria-label')
  if (
    range &&
    (!thumbLabels || thumbLabels.length !== 2 || thumbLabels.some((text) => !text.trim()))
  )
    throw new Error('RangeSlider requires two non-empty thumbLabels')
  if (names && (names.length !== length || names.some((name) => !name.trim())))
    throw new Error('Slider requires one non-empty name per thumb')
  if (marks) {
    const seen = new Set<number>()
    for (const mark of marks) {
      const normalized = scale.validate([mark.value], 1)[0]
      if (seen.has(normalized)) throw new Error('Slider mark values must be unique')
      seen.add(normalized)
    }
  }
  const { inputs, controlRef, railRef, ...slider } = useSlider({
    scale,
    value: selected,
    defaultValue: initial,
    disabled,
    form,
    onValueChange: change,
    onValueCommit: commit,
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMergedRef(rootRef, ref)
  const invalid = Boolean(error) || ariaInvalid === true || ariaInvalid === 'true'
  const message = error && error !== true ? error : helperText
  const description =
    [describedBy, isPresent(message) && `${id}-description`].filter(Boolean).join(' ') || undefined
  const percentages = slider.values.map((value) => (scale.toTick(value) / scale.count) * 100)
  const start = range ? percentages[0] : 0
  const end = percentages.at(-1)!
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- delegates gestures to native range inputs, without adding a Tab stop
    <div
      {...props}
      ref={mergedRef}
      role="group"
      aria-label={hasLabel ? undefined : ariaLabel}
      aria-labelledby={hasLabel ? `${id}-label` : undefined}
      data-slot="slider"
      data-range={range || undefined}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-dragging={slider.dragging || undefined}
      className={cn(
        'min-w-0 [&:where(:has(input:disabled))]:opacity-50 forced-colors:[&:where(:has(input:disabled))]:opacity-100',
        className,
      )}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!event.defaultPrevented && controlRef.current?.contains(event.target as Node))
          slider.onPointerDown(event)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        const index = inputs.current.indexOf(event.target as HTMLInputElement)
        if (!event.defaultPrevented && index !== -1) slider.onKeyDown(event, index as 0 | 1)
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event)
        if (inputs.current.includes(event.target as HTMLInputElement)) slider.onKeyUp(event)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        if (inputs.current.includes(event.target as HTMLInputElement)) slider.onBlur()
      }}
      onFocus={(event) => {
        onFocus?.(event)
        const index = inputs.current.indexOf(event.target as HTMLInputElement)
        if (index !== -1) slider.onFocus(index as 0 | 1)
      }}
    >
      {(hasLabel || showValue) && (
        <div className="mb-0.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {hasLabel && (
            <span id={`${id}-label`} className="min-w-0 text-sm font-medium wrap-anywhere text-fg">
              {label}
            </span>
          )}
          {showValue && (
            <span
              data-slot="slider-value"
              aria-hidden
              className="ms-auto text-sm font-medium wrap-anywhere text-fg tabular-nums"
            >
              <bdi dir="ltr">{slider.values.map(formatValue).join(' – ')}</bdi>
            </span>
          )}
        </div>
      )}
      <div
        ref={controlRef}
        data-slot="slider-control"
        className={cn(
          'group/slider-control relative h-11 touch-pan-y touch-pinch-zoom select-none',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <div ref={railRef} className="pointer-events-none absolute inset-x-5.5 top-0 h-full">
          <div
            aria-hidden
            data-slot="slider-track"
            className="absolute inset-x-0 top-5 h-1 rounded-full border border-input-border bg-surface-muted forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]"
          />
          <div
            aria-hidden
            data-slot="slider-range"
            className={cn(
              'absolute top-5 h-1 rounded-full forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]',
              invalid ? 'bg-danger' : 'bg-control-checked',
              disabled && 'forced-colors:bg-[GrayText]',
            )}
            style={{ insetInlineStart: `${start}%`, width: `${end - start}%` }}
          />
          {slider.values.map((value, i) => {
            const index = i as 0 | 1
            const [low, high] = scale.limits(slider.values, index)
            return (
              <Fragment key={index}>
                {range && (
                  <span id={`${id}-thumb-label-${index}`} className="sr-only">
                    {thumbLabels![index]}
                  </span>
                )}
                <span
                  className="absolute top-0 size-11 -translate-x-1/2 rtl:translate-x-1/2"
                  style={{
                    insetInlineStart: `${percentages[index]}%`,
                    zIndex: slider.activeIndex === index ? 2 : 1,
                  }}
                >
                  <input
                    ref={(node) => {
                      inputs.current[index] = node
                    }}
                    type="range"
                    data-slot="slider-input"
                    name={names?.[index]}
                    form={form}
                    min={scale.fromTick(low)}
                    max={scale.fromTick(high)}
                    step={step}
                    value={value}
                    disabled={disabled}
                    aria-label={
                      hasLabel
                        ? undefined
                        : [ariaLabel, thumbLabels?.[index]].filter(Boolean).join(' ')
                    }
                    aria-labelledby={
                      hasLabel
                        ? [`${id}-label`, range && `${id}-thumb-label-${index}`]
                            .filter(Boolean)
                            .join(' ')
                        : undefined
                    }
                    aria-describedby={description}
                    aria-invalid={invalid ? true : ariaInvalid}
                    aria-valuetext={getValueText?.(value, index) ?? formatValue(value)}
                    className="peer pointer-events-none absolute inset-0 m-0 size-full opacity-0"
                    onChange={(event) => slider.onInput(event.currentTarget.valueAsNumber, index)}
                  />
                  <span
                    aria-hidden
                    data-slot="slider-thumb"
                    data-active={(slider.dragging && slider.activeIndex === index) || undefined}
                    className={cn(
                      'pointer-events-none absolute inset-s-3.25 top-3.25 size-4.5 rounded-full border bg-surface-raised',
                      'peer-focus-visible:outline-solid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus',
                      'transition-[border-color,box-shadow] duration-100 ease-out motion-reduce:transition-none',
                      'data-active:[box-shadow:0_0_0_4px_var(--color-input-halo)]',
                      invalid
                        ? 'border-danger'
                        : 'border-control-checked [@media(hover:hover)]:peer-[&:where(:enabled)]:group-[&:where(:hover)]/slider-control:border-input-border-hover',
                      'forced-colors:forced-color-adjust-none forced-colors:border-[ButtonText] forced-colors:bg-[ButtonFace] forced-colors:shadow-none',
                      'forced-colors:peer-focus-visible:outline-[Highlight] forced-colors:peer-disabled:border-[GrayText]',
                    )}
                  />
                </span>
              </Fragment>
            )
          })}
        </div>
      </div>
      {marks?.length ? (
        <div
          aria-hidden
          data-slot="slider-marks"
          className="relative mx-5.5 min-h-6 text-xs text-fg-muted tabular-nums"
        >
          {marks.map((mark) => {
            const fraction = scale.toTick(mark.value) / scale.count
            return (
              <span
                key={mark.value}
                className="absolute top-0 w-0"
                style={{ insetInlineStart: `${fraction * 100}%` }}
              >
                <span className="block h-1 w-px bg-input-border forced-colors:bg-[CanvasText]" />
                <span
                  className={cn(
                    'mt-0.5 inline-block whitespace-nowrap',
                    fraction === 1
                      ? '-translate-x-full rtl:translate-x-full'
                      : fraction !== 0 && '-translate-x-1/2 rtl:translate-x-1/2',
                  )}
                >
                  {mark.label}
                </span>
              </span>
            )
          })}
        </div>
      ) : (
        <div
          aria-hidden
          className="mx-5.5 flex justify-between gap-2 text-xs text-fg-muted tabular-nums"
        >
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}
      {isPresent(message) && (
        <p
          id={`${id}-description`}
          className={cn(
            'mt-2 mb-0 flex items-start gap-1 text-xs/relaxed',
            invalid ? 'text-danger' : 'text-fg-muted',
          )}
        >
          {invalid && <MessageIcon icon={errorIcon} className="mt-0.5" />}
          <span>{message}</span>
        </p>
      )}
    </div>
  )
}

export function Slider({
  value,
  defaultValue,
  name,
  onValueChange,
  onValueCommit,
  ...props
}: SliderProps) {
  return (
    <SliderControl
      {...props}
      values={value === undefined ? undefined : [value]}
      defaults={defaultValue === undefined ? undefined : [defaultValue]}
      names={name === undefined ? undefined : [name]}
      change={(next, details) => onValueChange?.(next[0], details)}
      commit={(next, details) => onValueCommit?.(next[0], details)}
    />
  )
}

export function RangeSlider({
  value,
  defaultValue,
  name,
  onValueChange,
  onValueCommit,
  ...props
}: RangeSliderProps) {
  return (
    <SliderControl
      {...props}
      range
      values={value}
      defaults={defaultValue}
      names={name}
      change={(next, details) => onValueChange?.([next[0], next[1]], details)}
      commit={(next, details) => onValueCommit?.([next[0], next[1]], details)}
    />
  )
}
