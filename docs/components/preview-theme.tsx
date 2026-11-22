'use client'
import { createContext, type ReactNode, use, useState } from 'react'

const themes = ['default', 'flat'] as const
type Theme = (typeof themes)[number]

const ThemeContext = createContext<[Theme, (theme: Theme) => void]>(['default', () => {}])

/**
 * Holds one preview's theme. It wraps the Preview/Code tabs because the tabs unmount the hidden
 * panel: state kept inside the panel would reset on every trip to the Code tab.
 */
export function PreviewThemeProvider({ children }: { children: ReactNode }) {
  const state = useState<Theme>('default')
  return <ThemeContext value={state}>{children}</ThemeContext>
}

/**
 * The preview pane with its own theme switch. Only this frame opts in (data-preview-theme), so two
 * previews on one page can differ; the choice resets on reload.
 * Popups portalled to <body> (tooltips, menus, dialogs) leave the frame and keep the default theme.
 */
export function PreviewTheme({
  labels,
  children,
}: {
  labels: { group: string } & Record<Theme, string>
  children: ReactNode
}) {
  const [theme, setTheme] = use(ThemeContext)

  return (
    <div data-preview-theme={theme}>
      <div className="flex justify-end">
        <fieldset className="m-0 inline-flex min-w-0 rounded-lg border border-fd-border bg-fd-background p-0.5 text-xs">
          <legend className="sr-only">{labels.group}</legend>
          {themes.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
              className="rounded-md px-2 py-1 font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-pressed:bg-fd-accent aria-pressed:text-fd-accent-foreground"
            >
              {labels[value]}
            </button>
          ))}
        </fieldset>
      </div>
      <div className="flex min-h-40 items-center justify-center p-6">{children}</div>
    </div>
  )
}
