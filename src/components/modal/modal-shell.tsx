import {
  type ComponentProps,
  createContext,
  type MouseEvent,
  type PointerEvent,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useId,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useMergedRef } from '../input/field'

/*
 * Modal behavior shared by Dialog and Drawer: the native <dialog> + showModal(), open/close
 * wiring, Esc and backdrop dismissal, the refused-dismiss bounce, the page scroll lock and the
 * deferred close() behind [data-closing]. No visuals: each wrapper passes its own classes, panel
 * and bounce keyframes.
 */

/** Which wrapper renders the shell; becomes the dialog's data-slot. */
type ModalKind = 'dialog' | 'drawer'

/**
 * Why the modal asks to close. `programmatic` is never sent by the modal itself; it is there for
 * callers that route their own closes (e.g. after a successful submit) through the same handler.
 */
export type ModalCloseReason = 'escape' | 'backdrop' | 'close-button' | 'programmatic'

export type ModalShellProps = Omit<ComponentProps<'dialog'>, 'open'> & {
  kind: ModalKind
  open: boolean
  onOpenChange: (open: boolean, reason: ModalCloseReason) => void
  alert?: boolean
  dismissible?: boolean
  /** Refused-dismiss bounce, read at each refusal (200ms); none means no bounce. */
  bounceKeyframes?: () => Keyframe[]
}

type ModalContextValue = {
  kind: ModalKind
  titleId: string
  descriptionId: string
  alert: boolean
  dismissible: boolean
  /** Header parts announce themselves, so aria-* never points at an id that isn't rendered. */
  setHasTitle: (present: boolean) => void
  setHasDescription: (present: boolean) => void
  requestClose: (reason: ModalCloseReason) => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

/** Parts of one wrapper must not work inside the other: a DialogHeader in a Drawer throws too. */
export function useModalContext(part: string, kind: ModalKind, owner: string) {
  const context = useContext(ModalContext)
  if (!context || context.kind !== kind)
    throw new Error(`${part} must be rendered inside <${owner}>`)
  return context
}

/** Registers a rendered title (and description) so the dialog's aria-* point at them. */
export function useAnnounceHeading(
  { setHasTitle, setHasDescription }: ModalContextValue,
  hasDescription: boolean,
) {
  useLayoutEffect(() => {
    setHasTitle(true)
    return () => setHasTitle(false)
  }, [setHasTitle])

  useLayoutEffect(() => {
    if (!hasDescription) return
    setHasDescription(true)
    return () => setHasDescription(false)
  }, [hasDescription, setHasDescription])
}

/*
 * Page scroll lock, held from showModal() until the dialog has closed (exit animation included)
 * and released by the last open modal. Hiding the scrollbar would widen the page, so the width it
 * took (0 with overlay scrollbars or no overflow) comes back as padding; measured by the first
 * modal only, later ones would read 0. The page's own inline values come back on release.
 */
const lockHolders = new Set<HTMLDialogElement>()
let unlockedStyle = { overflow: '', paddingInlineEnd: '' }

function lockScroll(el: HTMLDialogElement) {
  if (lockHolders.has(el)) return
  lockHolders.add(el)
  if (lockHolders.size > 1) return
  const root = document.documentElement
  unlockedStyle = { overflow: root.style.overflow, paddingInlineEnd: root.style.paddingInlineEnd }
  root.style.paddingInlineEnd = `${window.innerWidth - root.clientWidth}px`
  root.style.overflow = 'hidden'
}

function unlockScroll(el: HTMLDialogElement) {
  if (!lockHolders.delete(el) || lockHolders.size > 0) return
  const root = document.documentElement
  root.style.overflow = unlockedStyle.overflow
  root.style.paddingInlineEnd = unlockedStyle.paddingInlineEnd
}

const BOUNCE_MS = 200
const bounces = new WeakMap<HTMLDialogElement, Animation>()

/*
 * Refused-dismiss feedback through Web Animations. A running bounce is cancelled first, so
 * repeated refusals each get one. Reduced motion skips it: the global reduced-motion rule only
 * shortens CSS animations.
 */
function bounce(el: HTMLDialogElement, keyframes?: () => Keyframe[]) {
  if (
    !keyframes ||
    typeof el.animate !== 'function' ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  )
    return
  bounces.get(el)?.cancel()
  bounces.set(el, el.animate(keyframes(), { duration: BOUNCE_MS }))
}

/**
 * Native `<dialog>` + showModal(): top layer (no portal), inert page, focus containment and
 * restore, and Esc all come from the platform. Controlled: `open` drives it and every close
 * request goes through `onOpenChange`. `children` is the wrapper's panel, mounted only while open
 * or exiting.
 */
export function ModalShell({
  kind,
  open,
  onOpenChange,
  alert = false,
  dismissible = true,
  bounceKeyframes,
  className,
  children,
  ref,
  onCancel,
  onClose,
  onPointerDown,
  onMouseDown,
  onClick,
  'aria-labelledby': labelledByProp,
  'aria-describedby': describedByProp,
  ...props
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const setRef = useMergedRef(dialogRef, ref)
  const titleId = useId()
  const descriptionId = useId()
  const [hasTitle, setHasTitle] = useState(false)
  const [hasDescription, setHasDescription] = useState(false)

  // Content stays mounted from open until the exit animation has finished and the dialog closed,
  // and unmounts after, so each opening starts from fresh state (inputs, pending flags)
  const [present, setPresent] = useState(open)
  if (open && !present) setPresent(true)
  // Bumped on every native close: remounts the opener, so a parent that keeps `open` true reopens it
  const [closeCount, setCloseCount] = useState(0)

  // Latest values for native event handlers that may run after a render with newer props.
  // Insertion effect: updated on commit, before any ref callback or layout effect can read it.
  const latest = useRef({ open, onOpenChange, alert, dismissible, bounceKeyframes })
  useInsertionEffect(() => {
    latest.current = { open, onOpenChange, alert, dismissible, bounceKeyframes }
  })

  const requestClose = useCallback((reason: ModalCloseReason) => {
    const el = dialogRef.current
    const { open, onOpenChange, alert, dismissible, bounceKeyframes } = latest.current
    // Already on its way out: ignore repeats while the exit plays
    if (!el || !open || el.hasAttribute('data-closing')) return
    if (!dismissible || (alert && reason === 'backdrop')) {
      bounce(el, bounceKeyframes)
      return
    }
    onOpenChange(false, reason)
  }, [])

  /*
   * showModal() runs from the ref of the dialog's first child. React focuses `autoFocus` elements
   * while attaching refs and layout effects, children before parents and siblings in order, so an
   * effect on the shell itself would run after that focus() call had already failed on the
   * still-hidden dialog. Opening here, before the content's turn, lets `autoFocus` land. Without
   * one, showModal() focuses the first focusable element itself.
   */
  const showOnAttach = useCallback(
    (node: HTMLSpanElement | null) => {
      const el = node?.parentElement
      if (!open || !(el instanceof HTMLDialogElement)) return
      // Reopened mid-exit: dropping data-closing turns the running transitions back around
      el.removeAttribute('data-closing')
      // Guarded: StrictMode attaches refs twice, and showModal() throws on an open modal
      if (!el.open) {
        lockScroll(el)
        el.showModal()
      }
    },
    [open],
  )

  // Exit: keep the dialog open (and modal) while [data-closing] animates it out, then close().
  // Layout effect, so the exit styles land before the next paint.
  useLayoutEffect(() => {
    const el = dialogRef.current
    if (open || !el?.open) return
    el.setAttribute('data-closing', '')
    let cancelled = false
    // getAnimations() flushes styles, so the exit transitions already exist here. Own animations
    // only: subtree ones include endless spinners. None (e.g. no transition support) closes now.
    void Promise.allSettled(el.getAnimations().map((animation) => animation.finished)).then(() => {
      if (!cancelled && el.open && el.hasAttribute('data-closing')) el.close()
    })
    return () => {
      cancelled = true
    }
  }, [open])

  // Esc arrives as a cancel event; the shell decides, never the browser
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    onCancel?.(event)
    event.preventDefault()
    requestClose('escape')
  }

  /*
   * The close event is the source of truth. Chrome's close watcher closes without a cancelable
   * cancel event on a second Esc with no user activation in between, so the parent may still
   * think the dialog is open: tell it. If it keeps `open` true anyway, the remount reopens it.
   */
  const handleClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    onClose?.(event)
    const el = event.currentTarget
    // close events are queued; this one is stale if the dialog was reopened in between
    if (el.open) return
    el.removeAttribute('data-closing')
    unlockScroll(el)
    setPresent(false)
    setCloseCount((count) => count + 1)
    if (latest.current.open) latest.current.onOpenChange(false, 'escape')
  }

  // A backdrop click must start and end on the backdrop: pressing inside the panel and releasing
  // outside (e.g. selecting text) is not a dismissal
  const pressedBackdrop = useRef(false)
  const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    onPointerDown?.(event)
    pressedBackdrop.current = event.target === event.currentTarget
  }
  // A backdrop press would otherwise move focus to the dialog itself; keep it where it was (e.g. on
  // Cancel, when an alert dialog refuses the dismissal)
  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    onMouseDown?.(event)
    if (event.target === event.currentTarget) event.preventDefault()
  }
  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    onClick?.(event)
    const onBackdrop = pressedBackdrop.current && event.target === event.currentTarget
    pressedBackdrop.current = false
    if (onBackdrop) requestClose('backdrop')
  }

  // Unmounting while open removes the dialog without a close event. Relocks on StrictMode's
  // simulated remount, whose cleanup released a dialog that is still open.
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (el.open) lockScroll(el)
    return () => unlockScroll(el)
  }, [])

  const rendered = open || present

  return (
    <ModalContext
      value={{
        kind,
        titleId,
        descriptionId,
        alert,
        dismissible,
        setHasTitle,
        setHasDescription,
        requestClose,
      }}
    >
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- the click handler only detects backdrop clicks; Esc is the keyboard path */}
      <dialog
        {...props}
        ref={setRef}
        data-slot={kind}
        role={alert ? 'alertdialog' : undefined}
        aria-labelledby={labelledByProp ?? (hasTitle ? titleId : undefined)}
        aria-describedby={describedByProp ?? (hasDescription ? descriptionId : undefined)}
        onCancel={handleCancel}
        onClose={handleClose}
        onPointerDown={handlePointerDown}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className={className}
      >
        {rendered && (
          <>
            <span hidden key={closeCount} ref={showOnAttach} />
            {children}
          </>
        )}
      </dialog>
    </ModalContext>
  )
}
