import { CircleAlert } from 'lucide-react'
import { type ComponentProps, type ReactNode, useId } from 'react'
import { cn } from '../../lib/cn'
import { isPresent } from '../input/field'

export type CheckboxGroupProps = Omit<ComponentProps<'fieldset'>, 'children'> & {
  /** Names the group (fieldset legend); title case noun, no trailing colon. */
  legend: ReactNode
  /** Muted line under the legend, linked to the group with aria-describedby. */
  description?: ReactNode
  /**
   * Group-level message (e.g. "Pick at least one"), linked with aria-describedby. Not aria-invalid:
   * ARIA 1.2 doesn't support it on the group role. Native `required` can't express "one of", so
   * validate in your submit handler and pass the message here.
   */
  error?: ReactNode
  orientation?: 'vertical' | 'horizontal'
  /** Checkbox (or Switch) rows; each keeps its own name/checked. `disabled` reaches them natively. */
  children: ReactNode
}

/** A `<fieldset>` + `<legend>` around related checkboxes; holds no value of its own. */
export function CheckboxGroup({
  legend,
  description,
  error,
  orientation = 'vertical',
  className,
  'aria-describedby': describedByProp,
  children,
  ...props
}: CheckboxGroupProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const hasDescription = isPresent(description)
  const hasError = Boolean(error) && error !== true && isPresent(error)
  const describedBy =
    [describedByProp, hasDescription && descriptionId, hasError && errorId]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <fieldset
      {...props}
      data-slot="checkbox-group"
      aria-describedby={describedBy}
      className={cn('group/checkbox-group m-0 min-w-0 border-0 p-0', className)}
    >
      {/* Floated: a rendered legend ignores margins in some engines; floating makes it a normal box */}
      <legend className="float-start mb-1.5 w-full p-0 text-sm font-medium text-fg group-disabled/checkbox-group:opacity-50">
        {legend}
      </legend>
      <div className="clear-both flex flex-col">
        {hasDescription && (
          <p
            id={descriptionId}
            className="m-0 -mt-1 mb-2.5 text-xs/snug text-fg-muted group-disabled/checkbox-group:opacity-50"
          >
            {description}
          </p>
        )}
        <div
          data-orientation={orientation}
          className={cn(
            'flex',
            orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row flex-wrap gap-x-6 gap-y-2',
          )}
        >
          {children}
        </div>
        {hasError && (
          <p id={errorId} className="m-0 mt-2 flex items-start gap-1 text-xs/snug text-danger">
            <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </fieldset>
  )
}
