import type { ComponentProps, MouseEventHandler, ReactNode } from 'react'
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from '../../icons'
import { cn } from '../../lib/cn'
import { iconOr } from '../../lib/icon-slots'
import { Button } from '../button'

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type AlertProps = Omit<ComponentProps<'div'>, 'title'> & {
  /**
   * Icon and its color: neutral, info, success, warning or danger.
   * @defaultValue 'neutral'
   */
  tone?: AlertTone
  /**
   * Leading icon, sized to 16px and colored by `tone`. Defaults to the tone's icon: an info circle
   * (neutral, info), a check circle (success), a triangle (warning) or an exclamation circle
   * (danger). `false` or `null` hides it.
   */
  icon?: ReactNode
  /** Heading line. `children` render as the description under it. */
  title?: ReactNode
  /** An action such as a retry button or a link to settings. */
  action?: ReactNode
  /** Shows the dismiss button. The caller controls whether the Alert stays mounted. */
  onDismiss?: MouseEventHandler<HTMLButtonElement>
  /**
   * Accessible name of the dismiss button.
   * @defaultValue 'Dismiss alert'
   */
  dismissLabel?: string
  /** Icon of the dismiss button, sized to the button's icon size. Defaults to an X. */
  dismissIcon?: ReactNode
}

const tones = {
  neutral: { Icon: InfoIcon, iconClass: 'text-neutral' },
  info: { Icon: InfoIcon, iconClass: 'text-info' },
  success: { Icon: CircleCheckIcon, iconClass: 'text-success' },
  warning: { Icon: TriangleAlertIcon, iconClass: 'text-warning' },
  danger: { Icon: CircleAlertIcon, iconClass: 'text-danger' },
} satisfies Record<AlertTone, { Icon: typeof InfoIcon; iconClass: string }>

/** A persistent message shown next to the content it describes. Use a live region for updates that need announcing. */
export function Alert({
  tone = 'neutral',
  icon,
  title,
  action,
  onDismiss,
  dismissLabel = 'Dismiss alert',
  dismissIcon,
  className,
  children,
  ...props
}: AlertProps) {
  const { Icon, iconClass } = tones[tone]
  const iconNode = icon === undefined ? <Icon /> : icon
  const hasIcon = iconNode != null && iconNode !== false && iconNode !== ''

  return (
    <div
      {...props}
      data-slot="alert"
      data-tone={tone}
      className={cn(
        '@container/alert flex items-start gap-3 rounded-surface border border-ring-deep px-4 py-3',
        'text-sm text-fg forced-colors:border-[CanvasText]',
        className,
      )}
    >
      <div
        className={cn(
          'grid min-w-0 flex-1 items-start gap-x-2.5 gap-y-3',
          hasIcon ? 'grid-cols-[1rem_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]',
          action &&
            (hasIcon
              ? '@md/alert:grid-cols-[1rem_minmax(0,1fr)_auto]'
              : '@md/alert:grid-cols-[minmax(0,1fr)_auto]'),
        )}
      >
        {hasIcon && (
          <span
            aria-hidden="true"
            data-slot="alert-icon"
            className={cn('mt-0.5 flex [&_svg]:size-4 [&_svg]:shrink-0', iconClass)}
          >
            {iconNode}
          </span>
        )}
        <div className="min-w-0 space-y-0.5 wrap-anywhere">
          {title != null && (
            <div data-slot="alert-title" className="font-medium">
              {title}
            </div>
          )}
          {children != null && (
            <div
              data-slot="alert-description"
              className={title != null ? 'text-fg-muted' : undefined}
            >
              {children}
            </div>
          )}
        </div>
        {action && (
          <div
            data-slot="alert-action"
            className={cn(
              'justify-self-start @md/alert:self-center',
              hasIcon ? 'col-start-2 @md/alert:col-start-3' : 'col-start-1 @md/alert:col-start-2',
            )}
          >
            {action}
          </div>
        )}
      </div>
      {onDismiss && (
        <Button
          aria-label={dismissLabel}
          className="-my-1.5 -me-1.5 shrink-0 text-fg-muted @md/alert:self-center"
          icon={iconOr(dismissIcon, <XIcon />)}
          intent="ghost"
          size="sm"
          onClick={onDismiss}
        />
      )}
    </div>
  )
}
