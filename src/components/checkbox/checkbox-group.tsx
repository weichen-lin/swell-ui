import { type ComponentProps, type ReactNode, useId } from 'react'
import { cn } from '../../lib/cn'
import { ChoiceGroupContext, useChoiceGroupParts } from './choice-group'

export type CheckboxGroupProps = Omit<ComponentProps<'fieldset'>, 'children'> & {
  /**
   * Layout of CheckboxGroupItems.
   * @defaultValue 'vertical'
   */
  orientation?: 'vertical' | 'horizontal'
  /**
   * Compose freely: CheckboxGroupLabel, CheckboxGroupDescription, CheckboxGroupItems (or any
   * layout) holding Checkbox or Switch rows, and CheckboxGroupError. `disabled` reaches the rows
   * natively.
   */
  children: ReactNode
}

/**
 * A `<fieldset>` around related checkboxes; holds no value of its own. Name it with
 * CheckboxGroupLabel (visible or `sr-only`), `aria-label` or `aria-labelledby`. A group error is
 * not aria-invalid (ARIA 1.2 doesn't support it on the group role); native `required` can't express
 * "one of", so validate on submit and render CheckboxGroupError.
 */
export function CheckboxGroup({
  orientation = 'vertical',
  className,
  'aria-describedby': describedByProp,
  children,
  ...props
}: CheckboxGroupProps) {
  const id = useId()
  const { slots, labelledBy, describedBy } = useChoiceGroupParts(id, describedByProp)

  return (
    <ChoiceGroupContext
      value={{
        ...slots,
        orientation,
        itemsClassName: orientation === 'horizontal' ? 'gap-y-2' : undefined,
      }}
    >
      <fieldset
        {...props}
        data-slot="checkbox-group"
        aria-labelledby={props['aria-labelledby'] ?? labelledBy}
        aria-describedby={describedBy}
        className={cn('group/checkbox-group m-0 min-w-0 border-0 p-0', className)}
      >
        {children}
      </fieldset>
    </ChoiceGroupContext>
  )
}

export {
  ChoiceGroupLabel as CheckboxGroupLabel,
  type ChoiceGroupLabelProps as CheckboxGroupLabelProps,
  ChoiceGroupDescription as CheckboxGroupDescription,
  type ChoiceGroupDescriptionProps as CheckboxGroupDescriptionProps,
  ChoiceGroupError as CheckboxGroupError,
  type ChoiceGroupErrorProps as CheckboxGroupErrorProps,
  ChoiceGroupItems as CheckboxGroupItems,
  type ChoiceGroupItemsProps as CheckboxGroupItemsProps,
} from './choice-group'
