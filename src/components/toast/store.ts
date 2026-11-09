import { isValidElement, type MouseEvent, type ReactNode } from 'react'

export type ToastType = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'loading'

/** A button rendered with the toast's Button styling. Clicking it dismisses the toast unless `onClick` calls `event.preventDefault()`. */
export type ToastActionButton = {
  label: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

export type ToastOptions = {
  /** Reusing the id of a toast still on screen updates that toast in place instead of adding one. */
  id?: string
  title: ReactNode
  description?: ReactNode
  /** Default `neutral`. */
  type?: ToastType
  /**
   * `{ label, onClick }` renders a small secondary Button. Any other node (e.g. a router `<Link>`
   * styled as a button) is rendered as-is and never dismisses the toast by itself.
   */
  action?: ToastActionButton | ReactNode
  /**
   * Milliseconds on screen; `Infinity` keeps it until dismissed. Default: 5000, 10000 with an
   * action, never for `danger` and `loading`.
   */
  duration?: number
  /** False hides the close button and turns off swipe and Esc. Default true. */
  dismissible?: boolean
  /** The `<Toaster id>` that shows it. Left out, it goes to the Toaster without an id. */
  toasterId?: string
}

// A toast stays in the Toaster it was created for
export type ToastPatch = Partial<Omit<ToastOptions, 'id' | 'toasterId'>>

export type ToastRecord = Omit<ToastOptions, 'id' | 'type' | 'dismissible'> & {
  id: string
  type: ToastType
  dismissible: boolean
  /** React key: a fresh one per creation, so a toast re-created under an id still exiting gets its own node. */
  key: number
  /** Bumped on every in-place update; restarts the timer and the announcement. */
  version: number
  /** Dismissed and playing its exit; removed from the list once that finishes. */
  removed: boolean
  /** How it was dismissed, so the exit can slide out along a swipe. */
  swipeOut?: SwipeDirection
}

export type SwipeDirection = 'top' | 'bottom' | 'left' | 'right'

export function isActionButton(action: ToastOptions['action']): action is ToastActionButton {
  return (
    typeof action === 'object' &&
    action !== null &&
    !isValidElement(action) &&
    !(Symbol.iterator in action) &&
    'label' in action
  )
}

export function resolveDuration(record: Pick<ToastRecord, 'duration' | 'type' | 'action'>) {
  if (record.duration !== undefined) return record.duration
  if (record.type === 'danger' || record.type === 'loading') return Number.POSITIVE_INFINITY
  return record.action != null && record.action !== false ? 10_000 : 5000
}

/*
 * Module-level store read through useSyncExternalStore. The snapshot is an immutable array
 * (newest first) replaced on every change; ids and keys are made in toast() calls, never during
 * render, so StrictMode's double render can't duplicate anything. No DOM or timers live here:
 * those belong to the mounted <Toaster />.
 */
let toasts: readonly ToastRecord[] = []
const listeners = new Set<() => void>()
let nextId = 0
let nextKey = 0

function emit(next: readonly ToastRecord[]) {
  toasts = next
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot() {
  return toasts
}

const serverSnapshot: readonly ToastRecord[] = []
// Nothing on the server: toasts only exist after a client-side call, so hydration always matches
export function getServerSnapshot() {
  return serverSnapshot
}

function findLive(id: string) {
  return toasts.find((t) => t.id === id && !t.removed)
}

function create(options: ToastOptions): string {
  const id = options.id ?? `toast-${++nextId}`
  const { id: _id, type = 'neutral', dismissible = true, ...rest } = options
  const live = findLive(id)
  if (live) {
    // Same node, new content: fields left out go back to their defaults (update() merges instead)
    const next: ToastRecord = {
      ...rest,
      id,
      type,
      dismissible,
      key: live.key,
      version: live.version + 1,
      removed: false,
    }
    emit(toasts.map((t) => (t === live ? next : t)))
    return id
  }
  const record: ToastRecord = {
    ...rest,
    id,
    type,
    dismissible,
    key: ++nextKey,
    version: 0,
    removed: false,
  }
  emit([record, ...toasts])
  return id
}

function update(id: string, patch: ToastPatch) {
  const live = findLive(id)
  if (!live) return
  const { type = live.type, dismissible = live.dismissible, ...rest } = patch
  emit(
    toasts.map((t) =>
      t === live ? { ...live, ...rest, type, dismissible, version: live.version + 1 } : t,
    ),
  )
}

export function dismiss(id?: string, swipeOut?: SwipeDirection) {
  const hit = (t: ToastRecord) => !t.removed && (id === undefined || t.id === id)
  if (!toasts.some(hit)) return
  // No Toaster to play the exit and report back: drop them right away
  if (listeners.size === 0) {
    emit(toasts.filter((t) => !hit(t)))
    return
  }
  emit(toasts.map((t) => (hit(t) ? { ...t, removed: true, swipeOut } : t)))
}

/** Called by the Toaster once a dismissed toast's exit has finished. */
export function removeToast(key: number) {
  if (toasts.some((t) => t.key === key)) emit(toasts.filter((t) => t.key !== key))
}

/** Drops every toast at once, without exits. For tests and Storybook, not app code. */
export function resetToasts() {
  if (toasts.length) emit([])
}

type ShortcutOptions = Omit<ToastOptions, 'title' | 'type'>

type PromiseStep = ReactNode | Omit<ToastOptions, 'id' | 'type'>

export type ToastPromiseOptions<T> = {
  id?: string
  toasterId?: string
  loading: PromiseStep
  success: PromiseStep | ((data: T) => PromiseStep)
  error: PromiseStep | ((error: unknown) => PromiseStep)
}

function isStepOptions(step: PromiseStep): step is Omit<ToastOptions, 'id' | 'type'> {
  return (
    typeof step === 'object' &&
    step !== null &&
    !isValidElement(step) &&
    !(Symbol.iterator in step) &&
    'title' in step
  )
}

function stepPatch(step: PromiseStep, type: ToastType): ToastPatch {
  // Each step replaces the previous one's fields, so a loading description or action never lingers
  const base: ToastPatch = {
    type,
    description: undefined,
    action: undefined,
    duration: undefined,
  }
  return isStepOptions(step) ? { ...base, ...step } : { ...base, title: step }
}

function shortcut(type: ToastType) {
  return (title: ReactNode, options?: ShortcutOptions) => create({ ...options, title, type })
}

/**
 * Imperative toasts, callable from anywhere (event handlers, mutations, loaders) once a
 * `<Toaster />` is mounted. Every call returns the toast's id. `toasterId` routes a toast to a
 * `<Toaster id>` instead.
 */
export const toast = Object.assign((options: ToastOptions) => create(options), {
  success: shortcut('success'),
  info: shortcut('info'),
  warning: shortcut('warning'),
  /** Renders as the `danger` type. Stays until dismissed. */
  error: shortcut('danger'),
  /** Spinner; stays until updated or dismissed. */
  loading: shortcut('loading'),
  /** Merges into a toast still on screen and restarts its timer. No-op for unknown ids. */
  update,
  /** Plays the exit of one toast, or of all of them without an id. */
  dismiss: (id?: string) => dismiss(id),
  /**
   * Loading toast that turns into success or danger in place when the promise settles. Steps
   * are a title or full options; success/error may be functions of the result / the error.
   */
  promise<T>(promise: Promise<T> | (() => Promise<T>), steps: ToastPromiseOptions<T>) {
    const id = create({
      id: steps.id,
      toasterId: steps.toasterId,
      ...stepPatch(steps.loading, 'loading'),
    } as ToastOptions)
    // update() ignores a toast the user already closed: it stays closed
    const settle = (step: PromiseStep, type: ToastType) => update(id, stepPatch(step, type))
    const run = typeof promise === 'function' ? promise() : promise
    run.then(
      (data) =>
        settle(
          typeof steps.success === 'function' ? steps.success(data) : steps.success,
          'success',
        ),
      (error: unknown) =>
        settle(typeof steps.error === 'function' ? steps.error(error) : steps.error, 'danger'),
    )
    return id
  },
})
