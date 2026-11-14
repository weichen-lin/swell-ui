import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button'
import {
  type ModalCloseReason,
  ModalShell,
  useAnnounceHeading,
  useModalContext,
} from '../modal/modal-shell'

export type DialogSize = 'sm' | 'md' | 'lg'

/**
 * Why the dialog asks to close. `programmatic` is never sent by the dialog itself; it is there for
 * callers that route their own closes (e.g. after a successful submit) through the same handler.
 */
export type DialogCloseReason = ModalCloseReason

export type DialogProps = Omit<ComponentProps<'dialog'>, 'open'> & {
  open: boolean
  onOpenChange: (open: boolean, reason: DialogCloseReason) => void
  /** Max width: sm 384px (confirmations), md 480px (default), lg 640px (wide forms). */
  size?: DialogSize
  /**
   * Destructive confirmation: role="alertdialog", no close button by default, and a backdrop
   * click doesn't close (it bounces instead). Put `autoFocus` on the least destructive button.
   */
  alert?: boolean
  /** False blocks Esc, the backdrop and the close button (e.g. while a request is pending). */
  dismissible?: boolean
}

function useDialogContext(part: string) {
  return useModalContext(part, 'dialog', 'Dialog')
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-[384px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
}

/*
 * The <dialog> is a transparent, padding-free shell around the panel: a click whose target is the
 * dialog itself can then only be a backdrop click. All motion lives on the shell and its
 * ::backdrop; the panel just rides along.
 *
 * Enter: @starting-style holds the closed look for the first frame after showModal(), so the
 * transitions play toward the resting look. Exit: [data-closing] is set while the dialog is still
 * open and close() waits for those transitions, so the exit works without `overlay` /
 * `display` allow-discrete (Chromium only). The backdrop's transitions are not awaited (only the
 * shell's own animations are), so they share the shell's durations and finish with it.
 */
const motionClasses = [
  // Enter 200ms on Radix Themes' curve; exit 120ms on Carbon's productive exit curve
  'transition-[opacity,translate,scale] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
  'starting:open:translate-y-1 starting:open:scale-96 starting:open:opacity-0',
  'data-closing:pointer-events-none data-closing:scale-98 data-closing:opacity-0',
  'data-closing:duration-120 data-closing:ease-[cubic-bezier(0.2,0,1,0.9)]',
  'backdrop:bg-dialog-backdrop backdrop:transition-opacity backdrop:duration-200 backdrop:ease-[cubic-bezier(0.16,1,0.3,1)]',
  'starting:open:backdrop:opacity-0',
  'data-closing:backdrop:opacity-0 data-closing:backdrop:duration-120',
  'data-closing:backdrop:ease-[cubic-bezier(0.2,0,1,0.9)]',
]

/*
 * Below 640px the dialog is a bottom sheet: full width, flush with the bottom edge, sliding up
 * from below its own height and back down on exit. Opacity and scale stay put, a sliding sheet
 * that also fades or shrinks reads as two motions. The refusal bounce becomes a small lift (see
 * bounceKeyframes). No drag-to-dismiss.
 */
const sheetClasses = [
  'max-sm:mx-0 max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:max-w-none',
  'max-sm:max-h-[calc(100dvh-32px)]',
  // Primer's sheet curve: decelerates hard, so the long travel still feels quick
  'max-sm:duration-250 max-sm:ease-[cubic-bezier(0.33,1,0.68,1)]',
  'max-sm:starting:open:translate-y-full max-sm:starting:open:scale-100 max-sm:starting:open:opacity-100',
  'max-sm:data-closing:translate-y-full max-sm:data-closing:scale-100 max-sm:data-closing:opacity-100',
  'max-sm:data-closing:duration-180',
  'max-sm:backdrop:duration-250 max-sm:backdrop:ease-[cubic-bezier(0.33,1,0.68,1)]',
  'max-sm:data-closing:backdrop:duration-180',
]

/*
 * Refused-dismiss feedback (Bootstrap's static backdrop): a brief 2% swell, or a 6px nudge up for
 * the sheet, where a swell on a full-width panel would push its edges off screen. Each half eases
 * out, like a CSS keyframe animation with ease-out.
 */
function bounceKeyframes(): Keyframe[] {
  // max-sm, where the dialog is a sheet
  const sheet =
    typeof window.matchMedia === 'function' && window.matchMedia('(width < 40rem)').matches
  const rest = sheet ? { translate: '0 0' } : { scale: '1' }
  const peak = sheet ? { translate: '0 -6px' } : { scale: '1.02' }
  return [{ ...rest, easing: 'ease-out' }, { ...peak, easing: 'ease-out' }, rest]
}

/**
 * Modal dialog on the native `<dialog>` + showModal() (behavior in ModalShell). Controlled: `open`
 * drives it and every close request goes through `onOpenChange`.
 */
export function Dialog({ size = 'md', className, children, ...props }: DialogProps) {
  return (
    <ModalShell
      {...props}
      kind="dialog"
      bounceKeyframes={bounceKeyframes}
      className={cn(
        // UA styles and preflight disagree on margin/border/padding/overflow; state them all.
        // overflow-visible keeps the panel's shadow; the panel scrolls its own body.
        'm-auto w-[calc(100%-2rem)] max-h-[calc(100dvh-64px)] overflow-visible border-0 bg-transparent p-0 text-fg',
        'overscroll-contain outline-none',
        sizeClasses[size],
        motionClasses,
        sheetClasses,
        className,
      )}
    >
      <div
        data-slot="dialog-panel"
        className={cn(
          'flex max-h-[inherit] flex-col rounded-xl border border-popover-border bg-popover-bg shadow-dialog',
          // Forced colors drops the shadow; the border then carries the edge
          'forced-colors:border-[CanvasText]',
          'max-sm:rounded-b-none max-sm:border-b-0 max-sm:pb-[env(safe-area-inset-bottom)]',
        )}
      >
        {children}
      </div>
    </ModalShell>
  )
}

export type DialogHeaderProps = Omit<ComponentProps<'div'>, 'title'> & {
  title: ReactNode
  description?: ReactNode
  /** Top-right close button. Defaults to on, except for `alert` dialogs (answer with the footer). */
  closeButton?: boolean
}

export function DialogHeader({
  title,
  description,
  closeButton,
  className,
  ...props
}: DialogHeaderProps) {
  const context = useDialogContext('DialogHeader')
  const hasDescription = description != null && description !== false && description !== ''
  const showClose = closeButton ?? !context.alert
  useAnnounceHeading(context, hasDescription)

  return (
    <div
      {...props}
      data-slot="dialog-header"
      className={cn('flex shrink-0 items-start gap-4 px-6 pt-6 pb-4', className)}
    >
      <div className="min-w-0 flex-1">
        <h2 id={context.titleId} className="m-0 text-xl/tight font-medium text-fg">
          {title}
        </h2>
        {hasDescription && (
          <p id={context.descriptionId} className="mt-1.5 mb-0 text-sm text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {showClose && (
        <Button
          intent="ghost"
          size="sm"
          icon={<X />}
          aria-label="Close"
          // A tooltip would only repeat the label, and would be clipped by the panel's edge
          tooltip={false}
          disabled={!context.dismissible}
          // Optical alignment: the icon, not the button's hover box, lines up with the padding
          className="-me-2 -mt-1 shrink-0"
          onClick={() => context.requestClose('close-button')}
        />
      )}
    </div>
  )
}

/** Scrolls when the content is taller than the space left between header and footer. */
export function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="dialog-body"
      className={cn(
        // min-h-0 lets the flex column shrink it below its content; the 4px block padding keeps
        // field focus halos from being clipped by the scroll edge
        'min-h-0 overflow-y-auto overscroll-contain px-6 py-1 text-sm text-fg',
        className,
      )}
    />
  )
}

/** Actions, right-aligned: Cancel first, the primary action last (rightmost). */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="dialog-footer"
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-end gap-2 px-6 pt-5 pb-6',
        // Sheet: buttons share the row, bigger thumb targets
        'max-sm:*:data-[slot=button]:flex-1',
        className,
      )}
    />
  )
}
