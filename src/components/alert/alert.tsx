import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import type { ComponentProps, MouseEventHandler, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button'

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type AlertProps = Omit<ComponentProps<'div'>, 'title'> & {
  tone?: AlertTone
  title?: ReactNode
  /** An action such as a retry button or a link to settings. */
  action?: ReactNode
  /** Shows the dismiss button. The caller controls whether the Alert stays mounted. */
  onDismiss?: MouseEventHandler<HTMLButtonElement>
  /** Accessible name of the dismiss button. */
  dismissLabel?: string
}

const tones = {
  neutral: { Icon: Info, iconClass: 'text-neutral' },
  info: { Icon: Info, iconClass: 'text-info' },
  success: { Icon: CircleCheck, iconClass: 'text-success' },
  warning: { Icon: TriangleAlert, iconClass: 'text-warning' },
  danger: { Icon: CircleAlert, iconClass: 'text-danger' },
} satisfies Record<AlertTone, { Icon: typeof Info; iconClass: string }>

/** A persistent message shown next to the content it describes. Use a live region for updates that need announcing. */
export function Alert({
  tone = 'neutral',
  title,
  action,
  onDismiss,
  dismissLabel = 'Dismiss alert',
  className,
  children,
  ...props
}: AlertProps) {
  const { Icon, iconClass } = tones[tone]

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
          'grid min-w-0 flex-1 grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-2.5 gap-y-3',
          action && '@md/alert:grid-cols-[1rem_minmax(0,1fr)_auto]',
        )}
      >
        <Icon
          aria-hidden="true"
          data-slot="alert-icon"
          className={cn('mt-0.5 size-4', iconClass)}
        />
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
            className="col-start-2 justify-self-start @md/alert:col-start-3 @md/alert:self-center"
          >
            {action}
          </div>
        )}
      </div>
      {onDismiss && (
        <Button
          aria-label={dismissLabel}
          className="-my-1.5 -me-1.5 shrink-0 text-fg-muted @md/alert:self-center"
          icon={<X />}
          intent="ghost"
          size="sm"
          onClick={onDismiss}
        />
      )}
    </div>
  )
}
