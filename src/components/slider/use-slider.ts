import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { type SliderScale, sameValues } from './scale'
import type { SliderChangeDetails, SliderCommitDetails } from './types'

type Options = {
  scale: SliderScale
  value?: readonly number[]
  defaultValue: readonly number[]
  disabled: boolean
  form?: string
  onValueChange?: (value: number[], details: SliderChangeDetails) => void
  onValueCommit?: (value: number[], details: SliderCommitDetails) => void
}
type Session = {
  reason: 'pointer' | 'keyboard'
  index: 0 | 1
  start: number[]
  expected: number[]
  scaleKey: string
  keys: Set<string>
  pointerId?: number
  control?: HTMLDivElement
  offset: number
  startX: number
  pending: boolean
  removeListeners?: () => void
}
const keys = [
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]

export function useSlider(options: Options) {
  const { scale, value, defaultValue, disabled, form } = options
  const controlled = value !== undefined
  const [internal, setInternal] = useState(() => [...defaultValue])
  const values = controlled ? value : scale.normalize(internal)
  // Persist a changed scale's clamped value so widening it later does not resurrect an old value.
  if (!controlled && !sameValues(internal, values)) setInternal([...values])
  const [dragging, setDragging] = useState(false)
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const controlRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const session = useRef<Session | null>(null)
  const lastIndex = useRef<0 | 1>(0)
  const mounted = useRef(false)
  const generation = useRef(0)
  const latest = useRef({ ...options, values, controlled })

  function release() {
    const current = session.current
    session.current = null
    if (!current) return null
    current.removeListeners?.()
    if (
      current.pointerId !== undefined &&
      current.control?.hasPointerCapture?.(current.pointerId)
    ) {
      current.control.releasePointerCapture(current.pointerId)
    }
    if (mounted.current) setDragging(false)
    return current
  }
  function canUse(index: number) {
    return (
      !latest.current.disabled &&
      !!inputs.current[index] &&
      !inputs.current[index]!.matches(':disabled')
    )
  }
  function publish(next: number[], details: SliderChangeDetails) {
    const state = latest.current
    if (sameValues(state.values, next)) return
    if (session.current) session.current.expected = next
    if (!state.controlled) {
      latest.current = { ...state, values: next }
      setInternal(next)
    }
    state.onValueChange?.(next, details)
  }
  function commit(
    start: number[],
    expected: number[],
    details: SliderCommitDetails,
    key: string,
    defer = false,
  ) {
    const token = generation.current
    // Controlled owners must first accept the change, including a native/AT input event.
    const notify = () => {
      const state = latest.current
      if (
        !mounted.current ||
        token !== generation.current ||
        state.scale.key !== key ||
        !canUse(details.thumbIndex)
      )
        return
      if (!sameValues(state.values, expected) || sameValues(start, state.values)) return
      state.onValueCommit?.([...state.values], details)
    }
    if (defer) queueMicrotask(notify)
    else notify()
  }
  function finish(canceled = false) {
    const current = release()
    if (!current) return
    if (canceled) {
      generation.current++
      publish(current.start, { thumbIndex: current.index, reason: 'cancel' })
    } else
      commit(
        current.start,
        current.expected,
        { thumbIndex: current.index, reason: current.reason },
        current.scaleKey,
      )
  }
  function begin(index: 0 | 1, reason: Session['reason']): Session {
    const state = latest.current
    const current: Session = {
      index,
      reason,
      start: [...state.values],
      expected: [...state.values],
      scaleKey: state.scale.key,
      keys: new Set(),
      offset: 0,
      startX: 0,
      pending: false,
    }
    session.current = current
    return current
  }
  function move(index: 0 | 1, tick: number, reason: 'pointer' | 'keyboard' | 'input') {
    if (!canUse(index)) {
      release()
      return
    }
    const state = latest.current
    publish(state.scale.move(state.values, index, tick), { thumbIndex: index, reason })
  }
  function direction() {
    const node = controlRef.current
    return node
      ? getComputedStyle(node).direction || node.closest('[dir]')?.getAttribute('dir') || 'ltr'
      : 'ltr'
  }
  function tickAt(clientX: number) {
    const rect = railRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return null
    let ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    if (direction() === 'rtl') ratio = 1 - ratio
    return ratio * latest.current.scale.count
  }
  function focus(index: 0 | 1) {
    lastIndex.current = index
    setActiveIndex(index)
    inputs.current[index]?.focus({ preventScroll: true })
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.isPrimary === false ||
      session.current?.reason === 'pointer'
    )
      return
    if (!canUse(0)) return
    const tick = tickAt(event.clientX)
    if (tick === null) return
    if (session.current) finish()
    const state = latest.current
    const distances = state.values.map((v) => Math.abs(state.scale.toTick(v) - tick))
    const index: 0 | 1 =
      distances.length === 1
        ? 0
        : distances[0] === distances[1]
          ? lastIndex.current
          : distances[0] < distances[1]
            ? 0
            : 1
    event.preventDefault()
    focus(index)
    const current = begin(index, 'pointer')
    current.pointerId = event.pointerId
    current.control = event.currentTarget
    current.startX = event.clientX
    const rect = railRef.current!.getBoundingClientRect()
    const ratio = state.scale.toTick(state.values[index]) / state.scale.count
    const center = rect.left + (direction() === 'rtl' ? 1 - ratio : ratio) * rect.width
    const grabbed = Math.abs(event.clientX - center) <= 22
    current.offset = grabbed ? event.clientX - center : 0
    current.pending = state.values.length === 2 && state.values[0] === state.values[1] && grabbed
    setDragging(true)

    const owner = event.currentTarget.ownerDocument.defaultView!
    const pointerMove = (next: PointerEvent) => {
      if (session.current !== current || next.pointerId !== current.pointerId) return
      const target = tickAt(next.clientX - current.offset)
      if (target === null) return
      if (current.pending) {
        if (Math.abs(next.clientX - current.startX) < 2) return
        current.index = target < latest.current.scale.toTick(current.start[0]) ? 0 : 1
        current.pending = false
        focus(current.index)
      }
      move(current.index, target, 'pointer')
    }
    const pointerEnd = (next: PointerEvent) => {
      if (session.current === current && next.pointerId === current.pointerId)
        finish(next.type !== 'pointerup')
    }
    owner.addEventListener('pointermove', pointerMove)
    owner.addEventListener('pointerup', pointerEnd)
    owner.addEventListener('pointercancel', pointerEnd)
    current.control.addEventListener('lostpointercapture', pointerEnd)
    current.removeListeners = () => {
      owner.removeEventListener('pointermove', pointerMove)
      owner.removeEventListener('pointerup', pointerEnd)
      owner.removeEventListener('pointercancel', pointerEnd)
      current.control?.removeEventListener('lostpointercapture', pointerEnd)
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    if (!grabbed) move(index, tick, 'pointer')
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, index: 0 | 1) {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !keys.includes(event.key) ||
      !canUse(index)
    )
      return
    event.preventDefault()
    if (session.current?.reason === 'pointer') return
    const current = session.current ?? begin(index, 'keyboard')
    current.keys.add(event.key)
    const state = latest.current
    const right = direction() === 'rtl' ? -1 : 1
    const deltas: Record<string, number> = {
      ArrowRight: right,
      ArrowLeft: -right,
      ArrowUp: 1,
      ArrowDown: -1,
      PageUp: 10,
      PageDown: -10,
    }
    const [low, high] = state.scale.limits(state.values, index)
    const tick =
      event.key === 'Home'
        ? low
        : event.key === 'End'
          ? high
          : state.scale.toTick(state.values[index]) + deltas[event.key]
    move(index, tick, 'keyboard')
  }
  function onKeyUp(event: KeyboardEvent<HTMLDivElement>) {
    const current = session.current
    if (current?.reason !== 'keyboard' || !current.keys.has(event.key)) return
    current.keys.delete(event.key)
    if (!current.keys.size) finish()
  }
  function onInput(value: number, index: 0 | 1) {
    if (session.current || !canUse(index) || !Number.isFinite(value)) return
    const state = latest.current,
      start = [...state.values]
    const next = state.scale.move(start, index, state.scale.toTick(value))
    publish(next, { thumbIndex: index, reason: 'input' })
    commit(start, next, { thumbIndex: index, reason: 'input' }, state.scale.key, true)
  }

  useLayoutEffect(() => {
    latest.current = { ...options, values, controlled }
    const current = session.current
    if (
      current &&
      (current.scaleKey !== scale.key || disabled || !sameValues(values, current.expected))
    ) {
      generation.current++
      release()
    }
  })
  const cancelRef = useRef(() => {})
  useLayoutEffect(() => {
    cancelRef.current = () => finish(true)
  })
  useLayoutEffect(() => {
    mounted.current = true
    const owner = controlRef.current?.ownerDocument.defaultView
    const blur = () => cancelRef.current()
    owner?.addEventListener('blur', blur)
    return () => {
      mounted.current = false
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- numeric cancellation token, not a DOM node; cleanup must invalidate the current generation
      generation.current++
      release()
      owner?.removeEventListener('blur', blur)
    }
  }, [])
  useLayoutEffect(() => {
    const owner = inputs.current[0]?.form
    if (!owner) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const reset = (event: Event) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (event.defaultPrevented) return
        generation.current++
        release()
        const state = latest.current
        const next = state.controlled ? state.values : state.defaultValue
        if (!state.controlled) {
          latest.current = { ...state, values: next }
          setInternal([...next])
        }
        inputs.current.forEach((input, index) => {
          if (!input) return
          const [low, high] = state.scale.limits(next, index)
          input.min = String(state.scale.fromTick(low))
          input.max = String(state.scale.fromTick(high))
          input.value = String(next[index])
        })
      }, 0)
    }
    owner.addEventListener('reset', reset)
    return () => {
      clearTimeout(timer)
      owner.removeEventListener('reset', reset)
    }
  }, [form])

  return {
    values,
    dragging,
    activeIndex,
    inputs,
    controlRef,
    railRef,
    onPointerDown,
    onKeyDown,
    onKeyUp,
    onInput,
    onFocus: (index: 0 | 1) => {
      lastIndex.current = index
      setActiveIndex(index)
    },
    onBlur: () => {
      if (session.current?.reason === 'keyboard')
        finish(!controlRef.current?.ownerDocument.hasFocus())
    },
  }
}
