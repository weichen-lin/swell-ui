import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

export type SpinnerProps = Omit<
  ComponentProps<'svg'>,
  'children' | 'role' | 'aria-label' | 'aria-labelledby'
>

/** A decorative indeterminate indicator. Give its status text to a nearby live region. */
export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <svg
      {...props}
      data-slot="spinner"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 44 44"
      fill="none"
      className={cn(
        'inline-block size-5 shrink-0 align-middle motion-safe:animate-spin motion-safe:[animation-duration:1.4s]',
        className,
      )}
    >
      <circle
        cx="22"
        cy="22"
        r="20"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeDasharray="80 126"
        className="motion-safe:animate-spinner-arc"
      />
    </svg>
  )
}
