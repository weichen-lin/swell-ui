import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import { MessageIcon } from '../../lib/icon-slots'

/**
 * Shared parts for RadioGroup and CheckboxGroup. The group owns ids and wiring; each part is
 * optional and placed by the caller, so a part can be hidden (`sr-only`), restyled or left out.
 */

type Slot = (node: HTMLElement | null) => void

type ChoiceGroupParts = {
  labelId: string
  descriptionId: string
  errorId: string
  required?: boolean
  orientation: 'vertical' | 'horizontal'
  /** Extra classes the items container needs for this group kind. */
  itemsClassName?: string
  labelSlot: Slot
  descriptionSlot: Slot
  errorSlot: Slot
}

export const ChoiceGroupContext = createContext<ChoiceGroupParts | null>(null)

/**
 * Tracks whether a part is rendered. Starts as present so server HTML already carries the ARIA
 * reference; a layout effect drops it before paint when the part is missing.
 */
function useSlot() {
  const [present, setPresent] = useState(true)
  const attached = useRef(false)
  const slot = useCallback((node: HTMLElement | null) => {
    attached.current = node !== null
    setPresent(node !== null)
  }, [])
  useLayoutEffect(() => {
    if (!attached.current) setPresent(false)
  }, [])
  return [slot, present] as const
}

/** Ids, slots and the resulting ARIA references for a group's optional parts. */
export function useChoiceGroupParts(id: string, describedByProp?: string) {
  const [labelSlot, hasLabel] = useSlot()
  const [descriptionSlot, hasDescription] = useSlot()
  const [errorSlot, hasError] = useSlot()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  return {
    slots: { labelId, descriptionId, errorId, labelSlot, descriptionSlot, errorSlot },
    labelledBy: hasLabel ? labelId : undefined,
    describedBy:
      [describedByProp, hasDescription && descriptionId, hasError && errorId]
        .filter(Boolean)
        .join(' ') || undefined,
  }
}

function useParts(part: string) {
  const parts = useContext(ChoiceGroupContext)
  if (!parts) throw new Error(`${part} must be rendered inside a RadioGroup or CheckboxGroup`)
  return parts
}

function useSlotRef<T extends HTMLElement>(slot: Slot, ref: Ref<T> | undefined) {
  return useCallback(
    (node: T | null) => {
      slot(node)
      if (typeof ref === 'function') return ref(node)
      // oxlint-disable-next-line react/immutability -- callback ref: writes the caller's object ref at attach time, not during render
      if (ref) ref.current = node
    },
    [slot, ref],
  )
}

export type ChoiceGroupLabelProps = ComponentProps<'div'>

/** Names the group. Add `sr-only` to keep the name for assistive tech only. */
export function ChoiceGroupLabel({ className, children, ref, ...props }: ChoiceGroupLabelProps) {
  const parts = useParts('GroupLabel')
  const mergedRef = useSlotRef(parts.labelSlot, ref)
  return (
    <div
      {...props}
      ref={mergedRef}
      id={parts.labelId}
      data-slot="group-label"
      className={cn(
        'mb-1.5 text-sm font-medium text-fg in-[fieldset:disabled]:opacity-50',
        className,
      )}
    >
      {children}
      {parts.required && (
        <span aria-hidden className="text-danger">
          {' *'}
        </span>
      )}
    </div>
  )
}

export type ChoiceGroupDescriptionProps = ComponentProps<'p'>

/** Muted line under the label, linked to the group with aria-describedby. */
export function ChoiceGroupDescription({ className, ref, ...props }: ChoiceGroupDescriptionProps) {
  const parts = useParts('GroupDescription')
  const mergedRef = useSlotRef(parts.descriptionSlot, ref)
  return (
    <p
      {...props}
      ref={mergedRef}
      id={parts.descriptionId}
      data-slot="group-description"
      className={cn(
        'm-0 -mt-1 mb-2.5 text-xs/snug text-fg-muted in-[fieldset:disabled]:opacity-50',
        className,
      )}
    />
  )
}

export type ChoiceGroupErrorProps = ComponentProps<'p'> & {
  /**
   * Icon before the error text, sized to it. Defaults to a circled exclamation mark; `false` or
   * `null` hides it.
   */
  icon?: ReactNode
}

/** Group-level message, linked to the group with aria-describedby. Render it only when needed. */
export function ChoiceGroupError({
  icon,
  className,
  children,
  ref,
  ...props
}: ChoiceGroupErrorProps) {
  const parts = useParts('GroupError')
  const mergedRef = useSlotRef(parts.errorSlot, ref)
  return (
    <p
      {...props}
      ref={mergedRef}
      id={parts.errorId}
      data-slot="group-error"
      className={cn('m-0 mt-2 flex items-start gap-1 text-xs/snug text-danger', className)}
    >
      <MessageIcon icon={icon} className="mt-px" />
      <span>{children}</span>
    </p>
  )
}

export type ChoiceGroupItemsProps = ComponentProps<'div'>

/** Default layout for the items, following the group's orientation. Any element works instead. */
export function ChoiceGroupItems({ className, ...props }: ChoiceGroupItemsProps) {
  const parts = useParts('GroupItems')
  return (
    <div
      {...props}
      data-slot="group-items"
      data-orientation={parts.orientation}
      className={cn(
        'flex gap-2',
        parts.orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-x-6',
        parts.itemsClassName,
        className,
      )}
    />
  )
}
