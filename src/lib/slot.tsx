import {
  Children,
  cloneElement,
  type CSSProperties,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  type Ref,
  type RefCallback,
  useMemo,
} from 'react'
import { cn } from './cn'

type AnyProps = Record<string, unknown>

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') return ref(node)
  if (ref) ref.current = node
}

function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => setRef(ref, node))
    return () => {
      for (const [i, ref] of refs.entries()) {
        const cleanup = cleanups[i]
        if (typeof cleanup === 'function') cleanup()
        else setRef(ref, null)
      }
    }
  }
}

function mergeProps(slot: AnyProps, child: AnyProps) {
  const merged: AnyProps = { ...slot, ...child }
  for (const key of Object.keys(slot)) {
    const own = slot[key]
    const theirs = child[key]
    if (/^on[A-Z]/.test(key) && typeof own === 'function' && typeof theirs === 'function') {
      // Child first: the slot's handler sees what the child did (e.g. preventDefault)
      merged[key] = (...args: unknown[]) => {
        theirs(...args)
        own(...args)
      }
    } else if (key === 'className') {
      merged.className = cn(own as string, theirs as string)
    } else if (key === 'style') {
      merged.style = { ...(own as CSSProperties), ...(theirs as CSSProperties) }
    }
  }
  return merged
}

/** Applies `wrap` to an element's children, or to what a render-prop child returns. */
export function wrapChildren(children: unknown, wrap: (children: ReactNode) => ReactNode): unknown {
  if (typeof children !== 'function') return wrap(children as ReactNode)
  return (...args: unknown[]) => wrap((children as (...args: unknown[]) => ReactNode)(...args))
}

export type SlotProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>
  children?: ReactNode
}

/** Renders its only child with these props merged in (Radix Slot style). */
export function Slot({ children, ref, ...props }: SlotProps) {
  const child = Children.only(children)
  const childProps = isValidElement<AnyProps>(child) ? child.props : {}
  const childRef = childProps.ref as Ref<HTMLElement> | undefined
  // oxlint-disable-next-line react/refs, react/preserve-manual-memoization -- refs are only combined here, read on attach
  const composedRef = useMemo(() => composeRefs(ref, childRef), [ref, childRef])
  if (!isValidElement<AnyProps>(child)) return null
  return cloneElement(child, { ...mergeProps(props, childProps), ref: composedRef })
}
