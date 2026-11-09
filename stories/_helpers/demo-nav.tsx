import { createContext, type MouseEvent, type ReactNode, useContext, useState } from 'react'

type DemoNavValue = { path: string; go: (to: string) => (e: MouseEvent) => void }

const DemoNavContext = createContext<DemoNavValue | null>(null)

/**
 * Stands in for a router: plain links handle a click in place (preventDefault, like a router Link)
 * and the current path decides aria-current. Each story keeps its own path.
 */
export function DemoNav({ initialPath, children }: { initialPath: string; children: ReactNode }) {
  const [path, setPath] = useState(initialPath)
  const go = (to: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    setPath(to)
  }
  return <DemoNavContext value={{ path, go }}>{children}</DemoNavContext>
}

export function useDemoNav() {
  const nav = useContext(DemoNavContext)
  if (!nav) throw new Error('Render inside <DemoNav>')
  return nav
}
