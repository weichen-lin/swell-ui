import type { ComponentProps, ReactNode } from 'react'

export type RangeSliderValue = readonly [number, number]
export type SliderChangeDetails = {
  thumbIndex: 0 | 1
  reason: 'pointer' | 'keyboard' | 'input' | 'cancel'
}
export type SliderCommitDetails = Omit<SliderChangeDetails, 'reason'> & {
  reason: 'pointer' | 'keyboard' | 'input'
}
export type SliderMark = { value: number; label?: ReactNode }

type ValueProps<T> = (
  | { value: T; defaultValue?: never }
  | { value?: undefined; defaultValue?: T }
) & {
  onValueChange?: (value: T, details: SliderChangeDetails) => void
  onValueCommit?: (value: T, details: SliderCommitDetails) => void
}
type LabelProps =
  | { label: ReactNode; 'aria-label'?: string }
  | { label?: never; 'aria-label': string }

export type SliderCommonProps = Omit<
  ComponentProps<'div'>,
  'defaultValue' | 'onChange' | 'children' | 'aria-label' | 'role'
> &
  LabelProps & {
    min?: number
    max?: number
    /** Positive step; (max - min) must be a whole number of steps. */
    step?: number
    disabled?: boolean
    helperText?: ReactNode
    error?: ReactNode
    showValue?: boolean
    /** Formats both visible output and spoken value by default. */
    formatValue?: (value: number) => string
    getValueText?: (value: number, thumbIndex: 0 | 1) => string
    /** Visual markers only; all step-aligned values remain selectable. */
    marks?: readonly SliderMark[]
    form?: string
  }

export type SliderProps = SliderCommonProps & ValueProps<number> & { name?: string }
export type RangeSliderProps = SliderCommonProps &
  ValueProps<RangeSliderValue> & {
    thumbLabels: readonly [string, string]
    name?: readonly [string, string]
    /** Thumbs stop at this distance; they never swap or push each other. */
    minStepsBetweenThumbs?: number
  }
