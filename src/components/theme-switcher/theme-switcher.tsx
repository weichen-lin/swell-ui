import { type ComponentProps, type ReactNode, useSyncExternalStore } from 'react'
import { MoonIcon, SunIcon } from '../../icons'
import { cn } from '../../lib/cn'
import { iconOr } from '../../lib/icon-slots'
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
  /** Icon for the light theme, shown while dark (the button switches to light). Defaults to a sun. */
  lightIcon?: ReactNode
  /** Icon for the dark theme, shown while light (the button switches to dark). Defaults to a moon. */
  darkIcon?: ReactNode
}

/** Toggle the visible theme in one click, including when the initial choice follows the system. */
export function ThemeSwitcher({
  value,
  onChange,
  lightIcon,
  darkIcon,
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
      icon={dark ? iconOr(lightIcon, <SunIcon />) : iconOr(darkIcon, <MoonIcon />)}
      aria-label={label}
      title={label}
      tooltip={false}
      data-slot="theme-switcher"
      className={cn(
        'size-11 shrink-0 text-fg-muted hover:text-fg [&_:where(svg:not([class*=size-]))]:size-5',
        className,
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) onChange(next)
      }}
    />
  )
}
