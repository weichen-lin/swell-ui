import { CircleDashed, LoaderCircle } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
type BadgeVariant = 'subtle' | 'outline' | 'solid'
type BadgeSize = 'sm' | 'md'

// onClick is omitted on purpose: a badge is static; use a Button or link when it needs an action
export type BadgeProps = Omit<ComponentProps<'span'>, 'onClick'> & {
  tone?: BadgeTone
  variant?: BadgeVariant
  size?: BadgeSize
  /** Leading, decorative glyph (hidden from assistive tech). Ignored while `busy`. */
  icon?: ReactNode
  /** In-progress state: swaps the icon for a spinning ring (a static ring under reduced motion). */
  busy?: boolean
  /** Visually-hidden prefix for screen readers, e.g. "Health" reads as "Health: Unknown". */
  context?: string
}

// Tailwind only sees complete class names, so every tone x variant is spelled out.
// Each entry: [container classes, icon color].
// Icons use the tone's main color (>=3:1 per the token set) on subtle/outline, and the
// text color on solid, where the main color is the fill itself.
const toneClasses: Record<BadgeTone, Record<BadgeVariant, [string, string]>> = {
  neutral: {
    subtle: ['border-neutral-border bg-neutral-subtle-bg text-neutral-subtle-fg', 'text-neutral'],
    outline: ['border-neutral-border bg-transparent text-neutral-subtle-fg', 'text-neutral'],
    solid: ['border-neutral bg-neutral text-neutral-fg', 'text-neutral-fg'],
  },
  info: {
    subtle: ['border-info-border bg-info-subtle-bg text-info-subtle-fg', 'text-info'],
    outline: ['border-info-border bg-transparent text-info-subtle-fg', 'text-info'],
    solid: ['border-info bg-info text-info-fg', 'text-info-fg'],
  },
  success: {
    subtle: ['border-success-border bg-success-subtle-bg text-success-subtle-fg', 'text-success'],
    outline: ['border-success-border bg-transparent text-success-subtle-fg', 'text-success'],
    solid: ['border-success bg-success text-success-fg', 'text-success-fg'],
  },
  warning: {
    subtle: ['border-warning-border bg-warning-subtle-bg text-warning-subtle-fg', 'text-warning'],
    outline: ['border-warning-border bg-transparent text-warning-subtle-fg', 'text-warning'],
    solid: ['border-warning bg-warning text-warning-fg', 'text-warning-fg'],
  },
  danger: {
    subtle: ['border-danger-border bg-danger-subtle-bg text-danger-subtle-fg', 'text-danger'],
    outline: ['border-danger-border bg-transparent text-danger-subtle-fg', 'text-danger'],
    solid: ['border-danger bg-danger text-danger-fg', 'text-danger-fg'],
  },
}

// Fixed heights (border included) keep every variant the same size; the 1px border is
// always present (transparent or colored) for that reason. Padding is a little tighter
// on the icon side so the glyph's optical edge lines up with the text edge on the other.
const sizeClasses: Record<BadgeSize, { base: string; withIcon: string }> = {
  sm: { base: 'h-5 px-1.5', withIcon: 'ps-1' },
  md: { base: 'h-6 px-2', withIcon: 'ps-1.5' },
}

export function Badge({
  tone = 'neutral',
  variant = 'subtle',
  size = 'md',
  icon,
  busy = false,
  context,
  className,
  children,
  ...props
}: BadgeProps) {
  const [toneClass, iconClass] = toneClasses[tone][variant]
  const hasIcon = busy || (icon !== undefined && icon !== null && icon !== false)

  return (
    <span
      {...props}
      data-slot="badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border text-xs leading-none font-medium whitespace-nowrap',
        // Forced-colors drops author backgrounds, so the border is what keeps the badge's edge visible
        'forced-colors:border-[CanvasText]',
        sizeClasses[size].base,
        hasIcon && sizeClasses[size].withIcon,
        toneClass,
        className,
      )}
    >
      {hasIcon && (
        <span
          aria-hidden="true"
          data-slot="badge-icon"
          className={cn(
            'inline-flex shrink-0 items-center [&_svg]:size-3 [&_svg]:shrink-0',
            iconClass,
          )}
        >
          {busy ? (
            <>
              {/* Both rings are rendered and switched in CSS, so no JS media-query listener is needed */}
              <LoaderCircle className="animate-spin motion-reduce:hidden" />
              <CircleDashed className="hidden motion-reduce:block" />
            </>
          ) : (
            icon
          )}
        </span>
      )}
      {/* Own element so `truncate` (via className max-w-*) clips the text but not the icon; leading-4 keeps descenders inside its overflow box */}
      <span data-slot="badge-label" className="min-w-0 truncate leading-4">
        {context && <span className="sr-only">{context}: </span>}
        {children}
      </span>
    </span>
  )
}
