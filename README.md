<p align="center">
  <img src="assets/brand/swell-symbol-shore.svg" alt="" width="96" height="96" />
</p>

<h1 align="center">swell-ui</h1>

<p align="center">
  Hand-built React 19 components styled with Tailwind CSS v4.
  <br />
  <a href="https://www.npmjs.com/package/@weichenlin/swell-ui"><img src="https://img.shields.io/npm/v/@weichenlin/swell-ui" alt="npm version" /></a>
</p>

<p align="center"><a href="https://swell-ui.wei-chen.dev/"><strong>Documentation</strong></a></p>

## Features

- **Tailwind v4 native.** Your app compiles the CSS with its own Tailwind, so the design tokens
  become your utilities too (`bg-primary`, `text-fg`, ...).
- **Accessible.** Native inputs and form submission, full keyboard support, reduced motion.
- **Themeable.** Rebrand with two tokens; every other color is derived at runtime.
- **Light and dark.** Follows the system, or force either with one `data-theme` attribute.
- **Small.** ESM with type declarations; runtime deps are only `cva`, `clsx` and `tailwind-merge`, no icon library.

## Install

Peer dependencies: `react` and `react-dom` 19, `tailwindcss` 4.3+. No icon package is needed: the
built-in icons are inline SVG, and every one can be swapped through a component prop
(`loadingIcon`, `closeIcon`, `errorIcon`, ...); decorative ones also hide with `false` or `null`.
The entry is marked `'use client'`, so Next.js App Router Server Components can import the
components directly.

```sh
pnpm add @weichenlin/swell-ui
```

In the CSS file that imports Tailwind:

```css
@import 'tailwindcss';
@import '@weichenlin/swell-ui/styles.css';
```

`styles.css` brings the tokens and an `@source` that points Tailwind at the bundled components, so
their classes are generated even though Tailwind skips `node_modules` by default.

For a flat look (no shadows, tighter corners, stronger borders), add
`@import '@weichenlin/swell-ui/themes/flat.css';` after it. It only overrides tokens.

## Quick start

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

## Components

Accordion, Alert, Badge, Button, Card, Checkbox, CheckboxGroup, Combobox, Dialog, Drawer,
DropdownMenu, Input (plus SearchInput, PasswordInput and CopyInput), Meter, RadioGroup, Select,
Sidebar, Slider, RangeSlider, Switch, Table, Tabs, TabNav, Textarea, ThemeSwitcher, Toast and
Tooltip.

Live examples and the API of each one are in the
[documentation](https://swell-ui.wei-chen.dev/). Guides cover
[theming](https://swell-ui.wei-chen.dev/theming/),
[dark mode](https://swell-ui.wei-chen.dev/dark-mode/) and
[router links](https://swell-ui.wei-chen.dev/router-links/).

## Develop

Node 26.11.1 (`.node-version`, via fnm) and pnpm 12.

```sh
pnpm install
pnpm storybook        # component workbench, http://localhost:6006
pnpm docs:dev         # public docs site (builds the library first), http://localhost:3000
pnpm test             # vitest (jsdom)
pnpm typecheck        # tsc -b
pnpm lint             # vp check: format, lint, type-aware lint
pnpm knip             # unused files, exports and dependencies
pnpm build            # vp pack -> dist/index.js, index.d.ts and the CSS files
pnpm docs:build       # static docs site -> docs/out/
```

The CSS files under `src/styles/` are copied into `dist/` as they are, so the `@source "./*.js"` in
`styles.css` is relative to `dist/`. Storybook and the lint use `src/styles/dev.css`, which adds
Tailwind and scans `src/` and `stories/`.

The docs site in `docs/` is a Next.js static export built with Fumadocs. It consumes the built
`dist/` like an app would, so rebuild the library to see `src/` changes there. Each demo is one file
in `docs/examples/`, registered in `docs/examples/index.ts` and placed on a page with
`<ComponentPreview name="..." />`.

A lefthook pre-commit hook runs `vp check --fix` on staged files and `knip`.

## License

[MIT](LICENSE)
