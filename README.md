# swell-ui

Hand-built React 19 components styled with Tailwind CSS v4: Badge, Button, Card, Checkbox,
CheckboxGroup, Dialog, Drawer, Input (plus Search, Password and Copy), Meter, Select, Sidebar,
Switch, Tabs, TabNav, ThemeSwitcher, Toast and Tooltip.

The package ships ESM, type declarations and two CSS files. Your app compiles the CSS with its own
Tailwind v4, so the design tokens become your utilities too (`bg-primary`, `text-fg`, ...).

## Use it in an app

Peer dependencies: `react` and `react-dom` 19, `tailwindcss` 4.3+, `lucide-react`.

```sh
pnpm add swell-ui@file:../swell-ui   # or link:, until it is published
```

In the CSS file that imports Tailwind:

```css
@import 'tailwindcss';
@import 'swell-ui/styles.css';
```

`styles.css` brings the tokens (`theme.css`) and an `@source` that points Tailwind at the bundled
components, so their classes are generated even though Tailwind skips `node_modules` by default.

```tsx
import { Button, toast, Toaster } from 'swell-ui'

export function App() {
  return (
    <>
      <Button onClick={() => toast.success('Saved')}>Save</Button>
      <Toaster />
    </>
  )
}
```

### Override tokens

Redefine any token after the import. Light values go in `@theme`; dark values in the same two dark
blocks `theme.css` uses:

```css
@import 'tailwindcss';
@import 'swell-ui/styles.css';

@theme {
  --color-primary: #2563eb;
  --radius-md: 6px;
}

:root[data-theme='dark'] {
  --color-primary: #60a5fa;
}
:root:not([data-theme='light']) {
  @media (prefers-color-scheme: dark) {
    --color-primary: #60a5fa;
  }
}
```

Note that the theme replaces Tailwind's `rounded-sm/md/lg` values (6, 8 and 12px) and adds
`rounded-sharp` (4px), shadows (`shadow-popover`, `shadow-dialog`, ...) and `max-w-page`.

### Tokens only

To use the tokens without the components (no component classes generated), import `theme.css`
instead:

```css
@import 'tailwindcss';
@import 'swell-ui/theme.css';
```

### `cn`

`cn` (clsx + tailwind-merge) is exported and knows the custom tokens, so
`cn('rounded-sharp', 'rounded-md')` gives `rounded-md`.

## Dark mode

Without a `data-theme` attribute the theme follows the system (`prefers-color-scheme`).
`data-theme="light"` or `data-theme="dark"` on `<html>` forces one. The `dark:` variant follows the
same rule.

`useTheme` persists the choice and sets the attribute; `ThemeSwitcher` is the toggle button:

```tsx
import { ThemeSwitcher, useTheme } from 'swell-ui'

function Header() {
  const { theme, setTheme } = useTheme({ storageKey: 'my-app-theme' }) // default 'swell-ui-theme'
  return <ThemeSwitcher value={theme} onChange={setTheme} />
}
```

To avoid a flash of the wrong theme before React mounts, apply the saved value in `<head>`:

```html
<script>
  try {
    const t = localStorage.getItem('my-app-theme')
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t
  } catch {}
</script>
```

## Router links: `asChild`

`SidebarItem` and `TabNavLink` render a plain `<a>`. With `asChild` they render their only child
instead (your router's Link) and merge their props, classes, ref and handlers into it. The link
sets `href` and `aria-current="page"`; the current item is styled from that attribute.

```tsx
import { Link } from '@tanstack/react-router' // any router's Link
import { Box } from 'lucide-react'
import {
  Sidebar,
  SidebarBadge,
  SidebarBody,
  SidebarGroup,
  SidebarIcon,
  SidebarItem,
  SidebarProvider,
  SidebarTrigger,
} from 'swell-ui'

function Nav() {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <Sidebar aria-label="Main">
        <SidebarBody>
          <SidebarGroup>
            <SidebarItem asChild>
              <Link to="/projects">
                <SidebarIcon>
                  <Box />
                </SidebarIcon>
                Projects
                <SidebarBadge>8</SidebarBadge>
              </Link>
            </SidebarItem>
          </SidebarGroup>
        </SidebarBody>
      </Sidebar>
    </SidebarProvider>
  )
}
```

The accessible name is "Projects 8". Plain text children become the truncating label. Below 960px
the sidebar is a drawer; a click the link handles in place (it calls `preventDefault`, as router
links do) closes it.

`TabNavLink` works the same way and takes `icon` and `badge` props like `Tab`:

```tsx
<TabNav aria-label="Sections">
  <TabNavLink asChild icon={<Boxes />} badge={<Badge size="sm">12</Badge>}>
    <Link to="/resources">Resources</Link>
  </TabNavLink>
</TabNav>
```

## Develop

Node 26.11.1 (`.node-version`, via fnm) and pnpm 12.

```sh
pnpm install
pnpm storybook        # http://localhost:6006
pnpm test             # vitest (jsdom)
pnpm typecheck        # tsc -b
pnpm lint             # vp check: format, lint, type-aware lint
pnpm knip             # unused files, exports and dependencies
pnpm build            # vp pack -> dist/index.js, index.d.ts, theme.css, styles.css
pnpm build-storybook
```

`src/styles/theme.css` and `src/styles/styles.css` are copied into `dist/` as they are, so the
`@source "./*.js"` in `styles.css` is relative to `dist/`. Storybook and the lint use
`src/styles/dev.css`, which adds Tailwind and scans `src/` and `stories/`.

A lefthook pre-commit hook runs `vp check --fix` on staged files and `knip`.
