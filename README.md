# swell-ui

Hand-built React 19 components styled with Tailwind CSS v4: Badge, Button, Card, Checkbox,
CheckboxGroup, Dialog, Drawer, Input (plus Search, Password and Copy), Meter, Select, Sidebar,
Switch, Tabs, TabNav, ThemeSwitcher, Toast and Tooltip.

The package ships ESM, type declarations and two CSS files. Your app compiles the CSS with its own
Tailwind v4, so the design tokens become your utilities too (`bg-primary`, `text-fg`, ...).

## Use it in an app

Peer dependencies: `react` and `react-dom` 19, `tailwindcss` 4.3+, `lucide-react`.

```sh
pnpm add @weichenlin/swell-ui
```

In the CSS file that imports Tailwind:

```css
@import 'tailwindcss';
@import '@weichenlin/swell-ui/styles.css';
```

`styles.css` brings the tokens (`theme.css`) and an `@source` that points Tailwind at the bundled
components, so their classes are generated even though Tailwind skips `node_modules` by default.

```tsx
import { Button, toast, Toaster } from '@weichenlin/swell-ui'

export function App() {
  return (
    <>
      <Button onClick={() => toast.success('Saved')}>Save</Button>
      <Toaster />
    </>
  )
}
```

### Change the brand

The default look is neutral gray with a near-black primary. A rebrand is two tokens, set once,
after the import:

```css
@import 'tailwindcss';
@import '@weichenlin/swell-ui/styles.css';

@theme {
  --color-primary: #f7a501; /* buttons, input focus, checked switches and checkboxes, halos */
  --color-primary-fg: #141413; /* text and marks drawn on the primary fill */
}
```

That covers light, dark-from-the-system and `data-theme="dark"` alike. Input focus
(`--color-input-focus`), checked controls (`--color-control-checked`, `-fg`) and the focus halo
(`--color-input-halo`) are `var()` references to these two, resolved at runtime, so they follow.

To use a different value per scheme, write both on one line with `light-dark()`:

```css
@theme {
  --color-primary: light-dark(#2563eb, #60a5fa);
  --color-primary-fg: light-dark(#ffffff, #0b1220);
}
```

A light brand color (yellow, lime, cyan) can fall under 3:1 against the light page. The buttons
stay readable through `--color-primary-fg`, but if the focus border or a checked box needs more
contrast, override just that one:

```css
@theme {
  --color-input-focus: light-dark(#b37700, #f7a501); /* darker amber on light only */
}
```

Set tokens in `@theme` (or a plain `:root` rule) rather than on an inner element: the derived
tokens are resolved on the root.

### Tokens

Every color token is a `light-dark(<light>, <dark>)` pair; override it the same way, once. All of
them are also Tailwind utilities (`bg-surface`, `text-fg-muted`, `border-input-border`, ...).

| Token                                                                               | Used for                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `--color-primary`, `--color-primary-fg`                                             | Brand fill and the text on it                                                      |
| `--color-accent`                                                                    | Secondary brand color; unused by components, defaults to primary                   |
| `--color-bg`                                                                        | Page background                                                                    |
| `--color-surface`, `-surface-raised`, `-surface-muted`                              | Cards and panels; raised (tooltips, sheets); muted (hover fills, secondary button) |
| `--color-fg`, `-fg-strong`, `-fg-muted`, `-fg-subtle`                               | Text, from strongest to quietest (`fg-subtle` stays >=4.5:1)                       |
| `--color-border`, `-border-strong`                                                  | Dividers and hairlines                                                             |
| `--color-ring`, `-ring-deep`                                                        | 1px button and tab-list rings                                                      |
| `--color-inverse`, `-inverse-fg`                                                    | `dark` button, tooltips                                                            |
| `--color-focus`                                                                     | Keyboard focus outline (blue)                                                      |
| `--color-input-bg`, `-input-bg-hover`                                               | Text field fill                                                                    |
| `--color-input-border`, `-input-border-hover`                                       | Text field border; also the off track of Switch and box of Checkbox                |
| `--color-input-placeholder`                                                         | Placeholder text                                                                   |
| `--color-input-focus`                                                               | Focused field border. Default: `var(--color-primary)`                              |
| `--color-input-halo`                                                                | 3px ring around a focused field. Default: input-focus at 14%                       |
| `--color-input-halo-invalid`, `-invalid-focus`                                      | Same ring for invalid fields (danger at 12% / 22%)                                 |
| `--color-input-highlight`                                                           | Inset top highlight on fields                                                      |
| `--color-control-checked`, `-control-checked-fg`                                    | Checked Switch/Checkbox fill and its mark. Default: primary / primary-fg           |
| `--color-popover-bg`, `-popover-border`, `-popover-highlight`                       | Select picker, dialogs; highlight is the active row                                |
| `--color-dialog-backdrop`                                                           | Dimmed page behind Dialog and Drawer                                               |
| `--color-{success,warning,danger,info,neutral}`                                     | Status tone: solid fill / icon                                                     |
| `--color-{tone}-fg`                                                                 | Text on the solid fill                                                             |
| `--color-{tone}-subtle-bg`, `-subtle-fg`, `-border`                                 | Tinted badge, its text and hairline                                                |
| `--shadow-input`, `-input-lift`, `-switch-thumb`, `-popover`, `-dialog`, `-whisper` | Elevation (`shadow-*` utilities)                                                   |
| `--container-page`                                                                  | `max-w-page` (1200px)                                                              |

### Optional looks

```css
@import 'tailwindcss';
@import '@weichenlin/swell-ui/styles.css';
@import '@weichenlin/swell-ui/themes/warm.css'; /* parchment surfaces, brown primary */
@import '@weichenlin/swell-ui/typography.css'; /* h1-h3 in the serif stack, weight 500 */
```

Both are independent; your own `@theme` overrides go after them.

### Fonts

swell-ui sets no font names: text uses Tailwind's `--font-sans` (the system UI stack), and
`font-serif` / `font-mono` are Tailwind's defaults too. To use a web font, ship its files with
your app, for example with [Fontsource](https://fontsource.org):

```sh
pnpm add @fontsource-variable/inter
```

```css
@import 'tailwindcss';
@import '@fontsource-variable/inter';
@import '@weichenlin/swell-ui/styles.css';

@theme {
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
}
```

### Radius

swell-ui does not touch Tailwind's radius scale; components use the stock `rounded-*` classes, so
`rounded-md` is still 6px in your app. Changing `--radius-*` in your `@theme` changes the
components too.

Coming from 0.1, which replaced the scale: shift each class one step up to keep the old size.

| 0.1 class       | px  | Now           |
| --------------- | --- | ------------- |
| `rounded-sharp` | 4   | `rounded-sm`  |
| `rounded-sm`    | 6   | `rounded-md`  |
| `rounded-md`    | 8   | `rounded-lg`  |
| `rounded-lg`    | 12  | `rounded-xl`  |
| `rounded-xl`    | 16  | `rounded-2xl` |
| `rounded-2xl`   | 24  | `rounded-3xl` |
| `rounded-3xl`   | 32  | `rounded-4xl` |

### Tokens only

To use the tokens without the components (no component classes generated), import `theme.css`
instead:

```css
@import 'tailwindcss';
@import '@weichenlin/swell-ui/theme.css';
```

### `cn`

`cn` (clsx + tailwind-merge) is exported and knows the custom tokens, so
`cn('text-fg-muted', 'text-danger')` gives `text-danger` and `cn('shadow-popover', 'shadow-none')`
gives `shadow-none`.

## Dark mode

Without a `data-theme` attribute the theme follows the system (`prefers-color-scheme`).
`data-theme="light"` or `data-theme="dark"` on `<html>` forces one. The `dark:` variant follows the
same rule.

Under the hood the root's `color-scheme` is `light dark`, `light` or `dark` accordingly, and every
color token picks its side with `light-dark()`. Browsers support it natively from Chrome 123,
Safari 17.5 and Firefox 120; Tailwind's production build rewrites it for older targets.

`useTheme` persists the choice and sets the attribute; `ThemeSwitcher` is the toggle button:

```tsx
import { ThemeSwitcher, useTheme } from '@weichenlin/swell-ui'

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
import {
  Sidebar,
  SidebarBadge,
  SidebarBody,
  SidebarGroup,
  SidebarIcon,
  SidebarItem,
  SidebarProvider,
  SidebarTrigger,
} from '@weichenlin/swell-ui'
import { Box } from 'lucide-react'

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
pnpm build            # vp pack -> dist/index.js, index.d.ts and the CSS files
pnpm build-storybook
```

The CSS files under `src/styles/` are copied into `dist/` as they are, so the
`@source "./*.js"` in `styles.css` is relative to `dist/`. Storybook and the lint use
`src/styles/dev.css`, which adds Tailwind and scans `src/` and `stories/`.

A lefthook pre-commit hook runs `vp check --fix` on staged files and `knip`.
