import { Moon, Sun } from 'lucide-react'
import { type ComponentProps, useSyncExternalStore } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button'
import type { Theme } from './use-theme'

const systemThemeQuery = '(prefers-color-scheme: dark)'

function subscribeSystemTheme(onChange: () => void) {
  const query = window.matchMedia?.(systemThemeQuery)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

const systemIsDark = () => window.matchMedia?.(systemThemeQuery).matches ?? false
const serverIsDark = () => false

export type ThemeSwitcherProps = Omit<
  ComponentProps<'button'>,
  'onChange' | 'value' | 'defaultValue' | 'children'
> & {
  /** Current theme: `'system'`, `'light'` or `'dark'`. `'system'` follows `prefers-color-scheme`. */
  value: Theme
  /** Called with the theme to switch to (`'light'` or `'dark'`), never `'system'`. */
  onChange: (value: Theme) => void
}

/** Toggle the visible theme in one click, including when the initial choice follows the system. */
export function ThemeSwitcher({
  value,
  onChange,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...props
}: ThemeSwitcherProps) {
  const systemDark = useSyncExternalStore(subscribeSystemTheme, systemIsDark, serverIsDark)
  const dark = value === 'system' ? systemDark : value === 'dark'
  const next = dark ? 'light' : 'dark'
  const label = ariaLabel ?? (dark ? 'Switch to light theme' : 'Switch to dark theme')

  return (
    <Button
      {...props}
      intent="ghost"
      icon={dark ? <Sun /> : <Moon />}
      aria-label={label}
      title={label}
      tooltip={false}
      data-slot="theme-switcher"
      className={cn('size-11 shrink-0 text-fg-muted hover:text-fg [&_svg]:size-5', className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) onChange(next)
      }}
    />
  )
}
