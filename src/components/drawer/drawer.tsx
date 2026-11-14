import { X } from 'lucide-react'
import { type ComponentProps, type ReactNode, useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button'
import { useMergedRef } from '../input/field'
import {
  type ModalCloseReason,
  ModalShell,
  useAnnounceHeading,
  useModalContext,
} from '../modal/modal-shell'

export type DrawerSide = 'left' | 'right'
export type DrawerSize = 'sm' | 'md' | 'lg'

/** Same reasons as Dialog's; `programmatic` is for callers routing their own closes. */
export type DrawerCloseReason = ModalCloseReason

export type DrawerProps = Omit<ComponentProps<'dialog'>, 'open'> & {
  open: boolean
  onOpenChange: (open: boolean, reason: DrawerCloseReason) => void
  /** Edge it slides out of. Defaults to right (details, filters); navigation passes left. */
  side?: DrawerSide
  /** Width: sm 280px (navigation), md 384px (default, filters), lg 480px (details, forms). */
  size?: DrawerSize
}

function useDrawerContext(part: string) {
  return useModalContext(part, 'drawer', 'Drawer')
}

const sizeClasses: Record<DrawerSize, string> = {
  sm: 'w-[280px]',
  md: 'w-[384px]',
  lg: 'w-[480px]',
}

/*
 * The <dialog> is the full-height, transparent shell pinned to one edge; a click whose target is
 * the dialog itself can then only be a backdrop click. All motion lives on the shell and its
 * ::backdrop, the panel rides along: the whole panel slides in from its edge and back out, fully
 * opaque, while the backdrop fades on the same 200ms standard curve. With reduced motion it does
 * not travel: it fades (instant under theme.css's reduced-motion durations).
 */
const sideClasses: Record<DrawerSide, string[]> = {
  left: [
    'mr-auto ml-0',
    'motion-safe:starting:open:-translate-x-full motion-safe:data-closing:-translate-x-full',
  ],
  right: [
    'mr-0 ml-auto',
    'motion-safe:starting:open:translate-x-full motion-safe:data-closing:translate-x-full',
  ],
}

const motionClasses = [
  'transition-[translate,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
  'motion-reduce:starting:open:opacity-0 motion-reduce:data-closing:opacity-0',
  'data-closing:pointer-events-none',
  'backdrop:bg-dialog-backdrop backdrop:transition-opacity backdrop:duration-200 backdrop:ease-[cubic-bezier(0.4,0,0.2,1)]',
  'starting:open:backdrop:opacity-0 data-closing:backdrop:opacity-0',
]

// Flush with its edge: square, with the hairline on the inner side only
const panelSideClasses: Record<DrawerSide, string> = {
  left: 'border-r',
  right: 'border-l',
}

/**
 * Modal side panel on the native `<dialog>` (behavior shared with Dialog through ModalShell).
 * Controlled through `open` / `onOpenChange(open, reason)`; Esc, the backdrop, DrawerHeader's close
 * button and DrawerClose all ask through `onOpenChange`. Needs a name: `aria-label` /
 * `aria-labelledby`, or a DrawerHeader title.
 */
export function Drawer({
  side = 'right',
  size = 'md',
  className,
  children,
  ref,
  ...props
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const setRef = useMergedRef(dialogRef, ref)

  // No type can see a DrawerHeader among the children, so a missing name is caught at runtime.
  // Checked a tick after opening, once the header has announced its title.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !props.open) return
    const timer = setTimeout(() => {
      const el = dialogRef.current
      if (!el?.open) return
      if (el.getAttribute('aria-label')?.trim() || el.getAttribute('aria-labelledby')) return
      console.warn(
        'Drawer needs an accessible name: pass aria-label or render a DrawerHeader title.',
      )
    })
    return () => clearTimeout(timer)
  }, [props.open])

  return (
    <ModalShell
      {...props}
      ref={setRef}
      kind="drawer"
      data-side={side}
      data-size={size}
      className={cn(
        // UA styles and preflight disagree on margin/border/padding/overflow; state them all.
        // overflow-visible keeps the panel's shadow; the panel scrolls its own body.
        'my-0 h-dvh max-h-none max-w-[calc(100vw-56px)] overflow-visible border-0 bg-transparent p-0 text-fg',
        'overscroll-contain outline-none',
        sizeClasses[size],
        sideClasses[side],
        motionClasses,
        className,
      )}
    >
      <div
        data-slot="drawer-panel"
        className={cn(
          'flex h-full flex-col border-popover-border bg-popover-bg shadow-dialog',
          panelSideClasses[side],
          // Forced colors drops the shadow; the border then carries the edge
          'forced-colors:border-[CanvasText]',
        )}
      >
        {children}
      </div>
    </ModalShell>
  )
}

export type DrawerHeaderProps = Omit<ComponentProps<'div'>, 'title'> & {
  /** Also names the drawer. */
  title: ReactNode
  description?: ReactNode
}

/** Title, optional description and the close button, pinned above the body. */
export function DrawerHeader({ title, description, className, ...props }: DrawerHeaderProps) {
  const context = useDrawerContext('DrawerHeader')
  const hasDescription = description != null && description !== false && description !== ''
  useAnnounceHeading(context, hasDescription)

  return (
    <div
      {...props}
      data-slot="drawer-header"
      className={cn('flex shrink-0 items-start gap-4 px-6 pt-6 pb-4', className)}
    >
      <div className="min-w-0 flex-1">
        <h2 id={context.titleId} className="m-0 text-xl/tight font-medium wrap-anywhere text-fg">
          {title}
        </h2>
        {hasDescription && (
          <p id={context.descriptionId} className="mt-1.5 mb-0 text-sm wrap-anywhere text-fg-muted">
            {description}
          </p>
        )}
      </div>
      <Button
        intent="ghost"
        size="sm"
        icon={<X />}
        aria-label="Close"
        // A tooltip would only repeat the label, and would be clipped by the panel's edge
        tooltip={false}
        // Optical alignment: the icon, not the button's hover box, lines up with the padding
        className="-me-2 -mt-1 shrink-0"
        onClick={() => context.requestClose('close-button')}
      />
    </div>
  )
}

/** Fills the space between header and footer and scrolls on its own; they stay put. */
export function DrawerBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="drawer-body"
      className={cn(
        // min-h-0 lets the flex column shrink it below its content; the 4px block padding keeps
        // field focus halos from being clipped by the scroll edge
        'min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-1 text-sm text-fg',
        className,
      )}
    />
  )
}

/** Actions, right-aligned: Cancel first, the primary action last (rightmost). */
export function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="drawer-footer"
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-end gap-2 px-6 pt-5 pb-6',
        className,
      )}
    />
  )
}

export type DrawerCloseProps = Omit<
  ComponentProps<'button'>,
  'children' | 'type' | 'aria-label' | 'onClick'
> & {
  /** Required: the button shows only an icon. */
  'aria-label': string
  size?: 'sm' | 'md' | 'lg'
  /** Defaults to X. */
  icon?: ReactNode
}

/** A ghost icon button that closes the drawer, for custom headers. */
export function DrawerClose({ size = 'sm', icon, ...props }: DrawerCloseProps) {
  const { requestClose } = useDrawerContext('DrawerClose')
  return (
    <Button
      {...props}
      intent="ghost"
      size={size}
      icon={icon ?? <X />}
      // A tooltip would only repeat the label, and would be clipped by the panel's edge
      tooltip={false}
      onClick={() => requestClose('close-button')}
    />
  )
}
