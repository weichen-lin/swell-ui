import { useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

export type UseThemeOptions = {
  /** localStorage key the choice is saved under. */
  storageKey?: string
}

const validTheme = (value: string | null): Theme =>
  value === 'light' || value === 'dark' ? value : 'system'

/** Persisted color theme; `system` clears data-theme so prefers-color-scheme decides. */
export function useTheme({ storageKey = 'swell-ui-theme' }: UseThemeOptions = {}) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return validTheme(localStorage.getItem(storageKey))
    } catch {
      return 'system'
    }
  })
  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      /* Theme still works when storage is unavailable. */
    }
  }, [theme, storageKey])
  return { theme, setTheme }
}
