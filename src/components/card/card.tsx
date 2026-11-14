import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useLayoutEffect,
  useState,
} from 'react'
import { cn } from '../../lib/cn'

type CardElement = 'div' | 'section' | 'article'

const CardContext = createContext<{ titleId: string; setTitled: (titled: boolean) => void }>({
  titleId: '',
  setTitled: () => {},
})

export type CardProps = ComponentProps<'div'> & {
  /** `section`/`article` are named by their CardHeader title. */
  as?: CardElement
}

/**
 * Bordered surface for a group of related content. No padding of its own: CardHeader and
 * CardContent add it, so full-bleed rows (lists, tables) can sit edge to edge.
 */
export function Card({ as: Comp = 'div', className, ...props }: CardProps) {
  const titleId = useId()
  const [titled, setTitled] = useState(false)
  const landmark = Comp === 'section' || Comp === 'article'
  return (
    <CardContext value={{ titleId, setTitled }}>
      <Comp
        // aria-labelledby would override an explicit aria-label
        aria-labelledby={landmark && titled && !props['aria-label'] ? titleId : undefined}
        {...props}
        data-slot="card"
        className={cn('rounded-xl border border-border-strong bg-surface', className)}
      />
    </CardContext>
  )
}

export type CardHeaderProps = Omit<ComponentProps<'div'>, 'title' | 'children'> & {
  title: ReactNode
  description?: ReactNode
  /** Trailing control, e.g. a "View all" link. */
  action?: ReactNode
  headingLevel?: 2 | 3
}

export function CardHeader({
  title,
  description,
  action,
  headingLevel = 2,
  className,
  ...props
}: CardHeaderProps) {
  const { titleId, setTitled } = useContext(CardContext)
  useLayoutEffect(() => {
    setTitled(true)
    return () => setTitled(false)
  }, [setTitled])
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <div
      {...props}
      data-slot="card-header"
      className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}
    >
      <div className="min-w-0">
        <Heading id={titleId} className="font-sans text-sm font-medium">
          {title}
        </Heading>
        {description && <p className="text-xs text-fg-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      data-slot="card-content"
      // Tighter top when it follows a header, which already carries the card's top padding
      className={cn('p-5 [[data-slot=card-header]+&]:pt-4', className)}
    />
  )
}
