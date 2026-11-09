import { type ComponentProps, type ReactNode, useId } from 'react'
import { cn } from '../../lib/cn'
import type { BadgeTone } from '../badge'

export type MeterTone = BadgeTone

export type MeterSegment = { label: string; value: number; tone: MeterTone }

export type MeterProps = Omit<ComponentProps<'div'>, 'children'> & {
  label: ReactNode
  /** Short trailing text on the label row, e.g. "9 of 13 report health". */
  summary?: ReactNode
  /** Drawn in order; zero values are left out of both the bar and the legend. */
  segments: MeterSegment[]
}

// Neutral uses its border shade: the solid neutral reads as a status, "no data" should recede
const toneClasses: Record<MeterTone, string> = {
  neutral: 'bg-neutral-border',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/**
 * Stacked proportion bar with a legend. The bar is decorative; the legend list carries the
 * numbers for assistive tech, so nothing is conveyed by color alone.
 */
export function Meter({ label, summary, segments, className, ...props }: MeterProps) {
  const labelId = useId()
  const shown = segments.filter((s) => s.value > 0)
  return (
    <div {...props} data-slot="meter" className={cn('text-xs', className)}>
      <div className="flex justify-between gap-3">
        <span id={labelId} className="font-medium">
          {label}
        </span>
        {summary && <span className="text-fg-muted">{summary}</span>}
      </div>
      <div
        aria-hidden
        className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-muted"
      >
        {shown.map((s) => (
          <span
            key={s.label}
            className={cn('min-w-1', toneClasses[s.tone])}
            style={{ flex: s.value }}
          />
        ))}
      </div>
      {shown.length > 0 && (
        <ul
          aria-labelledby={labelId}
          className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-fg-muted"
        >
          {shown.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span aria-hidden className={cn('size-2 rounded-xs', toneClasses[s.tone])} />
              <span className="font-medium text-fg">{s.value}</span>
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
