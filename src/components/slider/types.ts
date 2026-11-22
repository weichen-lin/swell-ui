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
  | {
      /** Controlled value. */
      value: T
      defaultValue?: never
    }
  | {
      value?: undefined
      /** Uncontrolled initial value. */
      defaultValue?: T
    }
) & {
  /** Called on every change, including previews while dragging. */
  onValueChange?: (value: T, details: SliderChangeDetails) => void
  /** Called once after a changed pointer or keyboard gesture ends. */
  onValueCommit?: (value: T, details: SliderCommitDetails) => void
}
type LabelProps =
  | {
      /** Visible label. Required unless `aria-label` is set. */
      label: ReactNode
      /** Accessible name when there is no visible `label`. */
      'aria-label'?: string
    }
  | {
      label?: never
      /** Accessible name when there is no visible `label`. */
      'aria-label': string
    }

export type SliderCommonProps = Omit<
  ComponentProps<'div'>,
  'defaultValue' | 'onChange' | 'children' | 'aria-label' | 'role'
> &
  LabelProps & {
    /**
     * Lower bound. Must be finite and below `max`.
     * @defaultValue 0
     */
    min?: number
    /**
     * Upper bound. Must be finite and above `min`.
     * @defaultValue 100
     */
    max?: number
    /**
     * Positive step; (max - min) must be a whole number of steps.
     * @defaultValue 1
     */
    step?: number
    /**
     * Disables every thumb.
     * @defaultValue false
     */
    disabled?: boolean
    /** Helper text under the slider, linked with aria-describedby. */
    helperText?: ReactNode
    /** Error message (replaces helperText) and invalid state. `true` shows no message. */
    error?: ReactNode
    /**
     * Shows the current value next to the label.
     * @defaultValue true
     */
    showValue?: boolean
    /** Formats both visible output and spoken value by default. */
    formatValue?: (value: number) => string
    /** Overrides only the spoken value text (`aria-valuetext`). */
    getValueText?: (value: number, thumbIndex: 0 | 1) => string
    /** Visual markers only; all step-aligned values remain selectable. */
    marks?: readonly SliderMark[]
    /** Id of an external form, for native submission. */
    form?: string
  }

export type SliderProps = SliderCommonProps &
  ValueProps<number> & {
    /** Field name for native form submission. */
    name?: string
  }
export type RangeSliderProps = SliderCommonProps &
  ValueProps<RangeSliderValue> & {
    /** Required accessible name for each thumb. */
    thumbLabels: readonly [string, string]
    /** Two field names for native form submission, one per thumb. */
    name?: readonly [string, string]
    /**
     * Thumbs stop at this distance, in steps; they never swap or push each other.
     * @defaultValue 0
     */
    minStepsBetweenThumbs?: number
  }
