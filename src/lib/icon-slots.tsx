import type { ReactNode } from 'react'
import { CircleAlertIcon, CircleDashedIcon, LoaderCircleIcon } from '../icons'
import { cn } from './cn'

/**
 * The icon of a control (a close button, a chevron, a spinner): the caller's node, or `fallback`
 * when the caller passed nothing to render (`undefined`, `null`, `false`, `true` or `''`). A
 * control's icon can be swapped but never removed, so the control never renders empty.
 */
export function iconOr<T extends ReactNode>(
  node: ReactNode,
  fallback: T,
): NonNullable<ReactNode> | T {
  return node == null || typeof node === 'boolean' || node === '' ? fallback : node
}

/**
 * Leading icon of an error message: the default alert icon when `icon` is undefined, nothing for
 * `false`, `null` or `''`, otherwise the caller's node at the message's icon size.
 */
export function MessageIcon({ icon, className }: { icon: ReactNode; className?: string }) {
  const node = icon === undefined ? <CircleAlertIcon /> : icon
  if (node == null || node === false || node === '') return null
  return (
    <span
      aria-hidden
      data-slot="message-icon"
      className={cn('flex shrink-0 [&_svg]:size-3.5 [&_svg]:shrink-0', className)}
    >
      {node}
    </span>
  )
}

/**
 * The spinning slot of a built-in loading indicator: the default circular loader, or the caller's
 * static icon, spun the same way. The size comes from the parent's `[&_svg]:size-*`.
 */
export function Spinner({ icon, className }: { icon?: ReactNode; className?: string }) {
  return (
    <span aria-hidden data-slot="spinner" className={cn('flex animate-spin', className)}>
      {iconOr(icon, <LoaderCircleIcon />)}
    </span>
  )
}

/**
 * Busy indicator for small spots (a badge, a switch thumb). The default renders a spinning loader
 * and a still dashed ring and switches them in CSS, so reduced motion gets the still ring without
 * a media-query listener. A custom icon spins in the same slot and stops under reduced motion.
 */
export function BusyIcon({ icon }: { icon?: ReactNode }) {
  if (iconOr(icon, null) !== null) {
    return <Spinner icon={icon} className="motion-reduce:animate-none" />
  }
  return (
    <>
      <LoaderCircleIcon className="animate-spin motion-reduce:hidden" />
      <CircleDashedIcon className="hidden motion-reduce:block" />
    </>
  )
}
