const fail = (message: string): never => {
  throw new Error(`Slider: ${message}`)
}
const close = (value: number, integer: number) => Math.abs(value - integer) <= 1e-7
const decimals = (value: number) => {
  const [digits, exponent = '0'] = String(value).toLowerCase().split('e')
  return Math.max(0, (digits.split('.')[1]?.length ?? 0) - Number(exponent))
}

/** Work in integer ticks, not repeated floating point additions. */
export function createScale(min: number, max: number, step: number, gap: number) {
  if (![min, max, step, gap].every(Number.isFinite)) fail('bounds, step and gap must be finite')
  if (min >= max || step <= 0) fail('min must be less than max and step must be positive')
  if (!Number.isInteger(gap) || gap < 0)
    fail('minStepsBetweenThumbs must be a non-negative integer')
  const factor = 10 ** Math.max(decimals(min), decimals(max), decimals(step))
  const start = Math.round(min * factor),
    end = Math.round(max * factor),
    increment = Math.round(step * factor)
  if (![start, end, increment, end - start].every(Number.isSafeInteger) || increment < 1) {
    fail('bounds and step exceed safe numeric precision')
  }
  const count = (end - start) / increment
  if (!Number.isSafeInteger(count)) fail('(max - min) must be evenly divisible by step')
  if (gap > count) fail('minimum thumb distance exceeds the available range')
  const fromTick = (tick: number) => (start + tick * increment) / factor
  const toTick = (value: number) => (value * factor - start) / increment
  const validate = (values: readonly number[], length: number) => {
    if (values.length !== length) fail(`expected ${length} value${length === 1 ? '' : 's'}`)
    const ticks = values.map((value) => {
      if (!Number.isFinite(value)) fail('values must be finite')
      const tick = toTick(value),
        rounded = Math.round(tick)
      if (!close(tick, rounded) || rounded < 0 || rounded > count)
        fail('values must be on a step within min and max')
      return rounded
    })
    if (ticks.length === 2 && ticks[1] - ticks[0] < gap)
      fail('range values must be ordered and satisfy the minimum distance')
    return ticks.map(fromTick)
  }
  const normalize = (values: readonly number[]) => {
    const ticks = values.map((value) => Math.max(0, Math.min(count, Math.round(toTick(value)))))
    if (ticks.length === 2) {
      ticks[0] = Math.min(ticks[0], count - gap)
      ticks[1] = Math.max(ticks[1], ticks[0] + gap)
    }
    return ticks.map(fromTick)
  }
  const limits = (values: readonly number[], index: number): [number, number] =>
    values.length === 1
      ? [0, count]
      : index === 0
        ? [0, Math.round(toTick(values[1])) - gap]
        : [Math.round(toTick(values[0])) + gap, count]
  const move = (values: readonly number[], index: number, tick: number) => {
    const [low, high] = limits(values, index)
    return values.map((value, i) =>
      i === index ? fromTick(Math.max(low, Math.min(high, Math.round(tick)))) : value,
    )
  }
  return {
    min,
    max,
    step,
    gap,
    count,
    fromTick,
    toTick,
    validate,
    normalize,
    limits,
    move,
    key: `${min}/${max}/${step}/${gap}`,
  }
}
export type SliderScale = ReturnType<typeof createScale>
export const sameValues = (left: readonly number[], right: readonly number[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])
