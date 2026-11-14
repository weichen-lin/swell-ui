import { type ComponentProps, createContext, type ReactNode, useContext, useState } from 'react'

type RouterValue = { path: string; navigate: (to: string) => void }

const RouterContext = createContext<RouterValue | null>(null)

function useRouter() {
  const router = useContext(RouterContext)
  if (!router) throw new Error('Render inside <FakeRouter>')
  return router
}

/** In-memory path state standing in for a client-side router. */
export function FakeRouter({
  initialPath,
  onNavigate,
  children,
}: {
  initialPath: string
  onNavigate?: (to: string) => void
  children: ReactNode
}) {
  const [path, setPath] = useState(initialPath)
  const navigate = (to: string) => {
    setPath(to)
    onNavigate?.(to)
  }
  return <RouterContext value={{ path, navigate }}>{children}</RouterContext>
}

/** Renders the page registered for the current path. */
export function FakeOutlet({ pages }: { pages: Record<string, string> }) {
  return <p>{pages[useRouter().path]}</p>
}

/**
 * Behaves like a router Link (TanStack's order): marks itself aria-current="page" on its path, runs
 * the caller's onClick first, then handles a plain click in place with preventDefault. A modified
 * click is left to the browser.
 */
export function FakeLink({
  to,
  disabled = false,
  onClick,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & { to: string; disabled?: boolean }) {
  const { path, navigate } = useRouter()
  return (
    // oxlint-disable-next-line jsx-a11y/anchor-has-content -- children arrive in the spread
    <a
      {...props}
      href={disabled ? undefined : to}
      aria-current={path === to ? 'page' : undefined}
      // Only when disabled itself, so an aria-disabled passed in (e.g. by Button asChild) is kept
      aria-disabled={disabled || props['aria-disabled']}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        if (!disabled) navigate(to)
      }}
    />
  )
}
