# swell-ui

Hand-built React 19 components styled with Tailwind CSS v4: Accordion, Badge, Button, Card, Checkbox,
CheckboxGroup, Dialog, Drawer, Input (plus Search, Password and Copy), Meter, Select, Sidebar,
Slider, RangeSlider, Switch, Table, Tabs, TabNav, ThemeSwitcher, Toast and Tooltip.

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

### Accordion

Compose `Accordion`, `AccordionItem`, `AccordionTrigger`, and `AccordionContent`. Item values must
be unique and non-empty; triggers contain non-interactive content and include their own heading.

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@weichenlin/swell-ui'

;<Accordion defaultValue="project" variant="line" headingLevel={3}>
  <AccordionItem value="project">
    <AccordionTrigger description="Name and identity">Project</AccordionTrigger>
    <AccordionContent>Project settings</AccordionContent>
  </AccordionItem>
</Accordion>
```

Single mode uses `string | null`; `type="multiple"` uses `readonly string[]`. Use `value` with
`onValueChange` for controlled state, or `defaultValue` for uncontrolled state. Single mode allows
all panels to close by default; `collapsible={false}` prevents closing the open item. Change mode
with a new React key. `variant="outline"` adds individual borders and a surface background.

Content stays mounted while closed. `keepMounted={false}` unmounts children after the closing
animation; `region` opts in to a named landmark. Hidden mounted fields still participate in native
validation and FormData: expand the first invalid section before focusing its field. Storybook's
**UI / Accordion / Form Validation** demonstrates that flow. Arrow keys move header focus without
expanding, Enter/Space toggles, and reduced motion disables transitions.

### Slider

`Slider` uses a number; `RangeSlider` uses a `readonly [number, number]` and requires a name for
each thumb. Both use native range inputs for accessibility and form submission.

```tsx
import { Slider, RangeSlider } from '@weichenlin/swell-ui'

;<Slider label="Volume" defaultValue={40} formatValue={(value) => `${value}%`} />

;<RangeSlider
  label="Price range"
  thumbLabels={['Minimum price', 'Maximum price']}
  defaultValue={[200, 800]}
  min={0}
  max={1000}
  step={50}
  minStepsBetweenThumbs={2}
  name={['priceMin', 'priceMax']}
/>
```

Use `value` and `onValueChange` for controlled state, or `defaultValue` for uncontrolled state.
Controlled owners must accept preview changes immediately. `onValueCommit` runs once after a
changed pointer or keyboard gesture ends; put expensive work there. Cancellation restores the
starting value with `onValueChange` reason `cancel`, without committing. Thumbs never swap or push.

Defaults are `min=0`, `max=100`, `step=1`, `showValue=true`, and `minStepsBetweenThumbs=0`. Without
an initial value, single starts at `min` and range starts at `[min,max]`. Bounds must be finite,
`min < max`, and `(max-min)` must be a whole number of positive steps. External values must be on
that grid, ordered, and satisfy the gap. `marks` are visual only, not a restricted list of values.

`formatValue` formats both the visible and spoken value; `getValueText` overrides only the spoken
text. Use `aria-label` when omitting a visible `label`. `className` and `ref` target the outer div.
`name` enables native FormData; range accepts two explicit names. `form` supports an external
form. Native reset restores uncontrolled defaults; controlled reset remains the owner's choice.
Keyboard, RTL, cancellation, forms, exact input composition and theme examples live in
**UI / Slider** in Storybook. Touch screen reader interaction requires device acceptance.

### Table

Pass the current rows, column definitions, and a stable row ID. Add `search`, `sorting`, `pagination`,
or `selection` to show controlled UI. The caller handles filtering, sorting, and fetching or slicing
rows. The pagination `rowCount` is the total after filtering, before paging.

```tsx
import { Table } from '@weichenlin/swell-ui'

;<Table
  title="Deployments"
  data={deployments}
  getRowId={(row) => row.id}
  columns={[
    { id: 'service', header: 'Service', rowHeader: true, cell: (row) => row.service },
    { id: 'duration', header: 'Duration', numeric: true, cell: (row) => row.duration },
  ]}
  emptyState="No deployments yet"
  noResults="No matching deployments"
/>
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

### Change the palette

Colors come in two layers. A handful of **base colors** carry literal values; every other color
token is computed from them at runtime (`var()` and `color-mix()`), so overriding a base color
carries through to borders, muted text, fields, tints and so on:

```css
@theme {
  --color-bg: light-dark(#f5f4ed, #141413);
  --color-surface: light-dark(#faf9f5, #30302e);
  --color-fg: light-dark(#141413, #faf9f5);
}
```

The mix percentages are tuned so the default palette, and a warm one like the example above, pass WCAG contrast (text >=4.5:1,
field borders >=3:1). A palette far from these (a mid-tone page, low-contrast text) can fall
short, so check contrast after changing `bg`, `surface` or `fg`. Any computed token can still be
overridden on its own.

Override at the root (`@theme` or `:root`): computed tokens are resolved there, so a base color
set on an inner element does not reach them.

### Tokens

Every pair is written `light-dark(<light>, <dark>)`; override it the same way, once. All color
tokens are also Tailwind utilities (`bg-surface`, `text-fg-muted`, `border-input-border`, ...).

**Base colors**

| Token                                   | Used for                                               |
| --------------------------------------- | ------------------------------------------------------ |
| `--color-bg`                            | Page background                                        |
| `--color-surface`                       | Cards, panels and text fields                          |
| `--color-surface-raised`                | Popovers and dialogs                                   |
| `--color-fg`                            | Text                                                   |
| `--color-primary`, `--color-primary-fg` | Brand fill and the text on it. Default: `fg` (neutral) |
| `--color-focus`                         | Keyboard focus outline (blue)                          |
| `--color-{danger,success,warning,info}` | Status tones: solid fill, icon, and danger text        |

**Computed** (from the base colors; override only to fine-tune)

| Token                                                         | Used for                                                         | Computed from                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `--color-accent`                                              | Secondary brand color; unused by components                      | `primary`                                                                |
| `--color-surface-muted`                                       | Hover fills, secondary button                                    | fg into bg                                                               |
| `--color-fg-strong`, `-fg-muted`, `-fg-subtle`                | Text from strong to quiet (`fg-subtle` >=4.5:1 on every surface) | fg into bg                                                               |
| `--color-border`, `-border-strong`, `-ring`, `-ring-deep`     | Dividers, hairlines, 1px button and tab-list rings               | fg into bg                                                               |
| `--color-inverse`, `-inverse-fg`                              | `dark` button, tooltips                                          | fg into bg; the page on dark                                             |
| `--color-input-bg`, `-input-bg-hover`                         | Text field fill (read-only fields use `bg`)                      | `surface`                                                                |
| `--color-input-border`, `-input-border-hover`                 | Field border; also the off track of Switch and box of Checkbox   | fg into bg; `fg-strong`                                                  |
| `--color-input-placeholder`                                   | Placeholder text                                                 | fg into bg                                                               |
| `--color-input-focus`, `-input-halo`                          | Focused field border and its 3px ring                            | `primary`; input-focus at 14%                                            |
| `--color-input-halo-invalid`, `-invalid-focus`                | Same ring for invalid fields                                     | danger at 12% / 22%                                                      |
| `--color-control-checked`, `-control-checked-fg`              | Checked Switch/Checkbox fill and the check on it                 | `primary` / `primary-fg`                                                 |
| `--color-switch-handle`, `-switch-handle-checked`             | Switch thumb, off / on                                           | off: `surface-raised` / dark `fg`; on: white or black by track lightness |
| `--color-popover-bg`, `-popover-border`, `-popover-highlight` | Select picker and dialogs; highlight is the active row           | `surface-raised`, fg into it                                             |
| `--color-dialog-backdrop`                                     | Dimmed page behind Dialog and Drawer                             | fg at 40%; black at 60% on dark                                          |
| `--color-neutral`                                             | Neutral status tone                                              | fg into bg                                                               |
| `--color-{tone}-fg`                                           | Text on a solid status fill                                      | `surface` / `bg`                                                         |
| `--color-{tone}-subtle-bg`, `-border`                         | Tinted badge and its hairline                                    | tone into bg                                                             |
| `--color-{tone}-subtle-fg`                                    | Text on the tinted badge (>=5:1)                                 | tone pushed toward fg                                                    |

Shadows (`--shadow-input`, `-input-lift`, `-switch-thumb`, `-popover`, `-dialog`, `-whisper`) and
the input highlight are black or white at low opacity: they shade, so they have no palette color.
`--container-page` is `max-w-page` (1200px).

### Serif headings

```css
@import 'tailwindcss';
@import '@weichenlin/swell-ui/styles.css';
@import '@weichenlin/swell-ui/typography.css'; /* h1-h3 in the serif stack, weight 500 */
```

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

`Button` takes `asChild` too, for a navigation that should look like a button. It keeps the
button's look, icons and ripple, and stays a real link (open in a new tab, copy the URL):

```tsx
<Button asChild intent="secondary" iconLeft={<Plus />}>
  <Link to="/apps/new">New app</Link>
</Button>

<Button asChild icon={<Settings />} aria-label="Settings">
  <Link to="/settings" />
</Button>
```

`disabled` (with or without `disabledReason`) works as on the button: the link stays focusable with
`aria-disabled`, and clicks are stopped before your Link sees them, so it never navigates. `loading`
and `type` are button-only.

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
