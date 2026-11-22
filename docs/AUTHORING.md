# Writing a component page

`content/docs/components/button.mdx` is the reference page. Copy its shape; keep prose short and
put facts in tables.

## Skeleton

Sections in this order. Skip one only when the component truly has nothing for it (say so in
the PR), never reorder.

| Section            | What goes in                                                                         |
| ------------------ | ------------------------------------------------------------------------------------ |
| frontmatter        | `title` (component name) and `description`: one sentence, what it does               |
| main preview       | `<ComponentPreview name="x-demo" />`, the most common use                            |
| `<WhenToUse>`      | 2-4 uses, plus alternatives that link to other component pages                       |
| `## Installation`  | the `import` line and the `styles.css` import (copy from button.mdx)                 |
| `## Usage`         | the smallest code that works, as a fenced block                                      |
| `## Examples`      | one `###` per use case, each one preview and at most one sentence                    |
| `## API`           | `<AutoTypeTable>`; a `###` per extra table (e.g. a union member's props)             |
| `## States`        | `<StatesTable>`: every data-\* / aria-\* / pseudo-class the component styles or sets |
| `## Keyboard`      | `<KeyboardTable>`                                                                    |
| `## Accessibility` | bullet list of facts checked in the source or tests                                  |
| `## Theming`       | one line on what `flat.css` changes for it, then `<TokenList>`                       |
| `## Related`       | `<Related>` with 1-3 cards                                                           |

Style: second person ("you"), present tense, no marketing. Example headings name the use case
(`### Loading`, `### Link button`), not the prop (`### loading prop`).

## Components

All are registered in `components/mdx.tsx`. Localized ones get `lang` from the page; never pass
it yourself. String props render `` `backticks` `` as inline code, nothing else.

```mdx
<WhenToUse
  use={['Run an action in place.', 'Submit a form, with `type="submit"`.']}
  alternatives={[{ name: 'Switch', href: '/components/switch', when: 'an on/off setting.' }]}
/>

<AutoTypeTable path="src/components/x/x.tsx" name="XProps" />

<StatesTable
  rows={[{ state: 'Disabled', attribute: 'aria-disabled="true"', notes: 'Stays focusable.' }]}
/>

<KeyboardTable
  rows={[
    { keys: ['Enter', 'Space'], action: 'Activates it.' },
    { keys: 'Shift+Tab', action: '...' },
  ]}
/>

<TokenList tokens={[{ name: '--color-primary', description: '`primary` fill.' }]} />

<Related items={[{ title: 'Tooltip', href: '/components/tooltip', description: '...' }]} />
```

- `href` is root-relative without a locale (`/components/switch`); the locale is added for you.
- `StatesTable` `attribute` is shown as code; write backticks only to show several, e.g.
  ``'`aria-busy="true"` `aria-disabled="true"`'``.
- `KeyboardTable` `keys`: a string is one key or combo (`'Shift+Tab'`), an array lists
  alternatives.
- `Related` shows at most three items.

### AutoTypeTable

A wrapper over `fumadocs-typescript` (`components/auto-type-table.tsx`). `path` is relative to the
repo root. It lists only props declared outside `node_modules`, so the ~300 inherited HTML
attributes drop out; name the few that matter in `keep` (`keep={['disabled']}`).

- Exported interface or object type: `name="XProps"` is enough.
- Union props (`A | B`): one table of the union marks every prop optional and merges member docs.
  Document each member instead. `type` may name a non-exported type of the file, or an expression
  over it; `name` must then be a new identifier, not one the file declares:

  ```mdx
  <AutoTypeTable path="..." name="ButtonTextProps" type="TextButtonProps" />
  <AutoTypeTable path="..." name="ButtonIconOnlyProps" type={"Pick<IconOnlyButtonProps, 'icon'>"} />
  ```

- Descriptions and defaults come from JSDoc in `src/`: a summary line plus `@defaultValue`.
  cva variants take JSDoc on the variant key (`intent: {...}`). Comments only, no type changes.
- Descriptions stay English on the zh-TW page; the column headers are translated.

## Examples

- One file per example: `examples/<component>-<use-case>.tsx`, kebab-case, default export named
  in PascalCase (`button-icon-only.tsx` exports `ButtonIconOnly`). Start with `'use client'`.
- No registration: `examples/index.ts` is generated from the folder by
  `scripts/gen-examples.mjs` (runs before `dev`, `build`, `typecheck`; or `pnpm examples`).
  Never edit it by hand. `name` in `<ComponentPreview>` is type-checked against it.
- The file is the Code tab verbatim: import from `@weichenlin/swell-ui`, no docs-only helpers,
  English strings. Both locales share it.
- Use only props that exist in the component source and are covered by its tests.
- Every preview has a Default / Flat switch. It reaches anything rendered inside the preview in the DOM,
  native `<dialog>` top-layer content included (Dialog, Drawer). Only popups portalled to `<body>`
  (Tooltip, Toast) keep the default theme; check with a real click before claiming either way.

## Translation

- English is `x.mdx`; zh-TW is `x.zh-TW.mdx` next to it. A missing translation falls back to
  English, so translate whole pages, not parts.
- Same structure, same examples, same component props; translate the text values only. Keep
  `name`, `href`, token names and code in English.
- Headings: 安裝, 用法, 範例, API, 狀態, 鍵盤操作, 無障礙, 主題, 相關元件. Title: `按鈕 Button`
  style (Chinese name + component name).
- Taiwan usage (程式碼, 預設, 滑鼠移入, 聚焦), technical terms in English (props, tooltip, token),
  address the reader as 你.
- New template UI strings go in `lib/doc-labels.ts`; Fumadocs strings in `lib/i18n-ui.ts`.

## Checking the facts

Never document from memory; every row must trace to code.

- **States**: grep the component for `data-`, `aria-` and Tailwind variants (`data-pressed:`,
  `aria-disabled:`, `hover:`, `focus-visible:`). Hooks set attributes too (`src/hooks/`). The
  test file names which attribute each state sets.
- **Keyboard**: look for `onKeyDown` / `key ===` in the component and its hooks, and the
  `keyboard` / `fireEvent.keyDown` tests. Native elements (button, input) get their browser keys;
  list those too.
- **Accessibility**: type-level rules are the `@ts-expect-error` tests; runtime ones are the
  `toHaveAccessibleDescription`, `aria-*` and focus assertions.
- **Tokens**: list every `var(--...)` and every token utility (`bg-primary` reads
  `--color-primary`, `rounded-control` reads `--radius-control`) in the component's classes, then
  look the token up in `src/styles/theme.css`. `shadow-*` utilities inline their value, so a
  shadow only counts as a token where the class reads `var(--shadow-*)`.
- **Flat**: diff against `src/styles/themes/flat.css` for the Theming line, and switch a preview
  to Flat to check it.

## Before opening a PR

```sh
fnm exec --using=$(cat .node-version) -- pnpm docs:build
fnm exec --using=$(cat .node-version) -- pnpm lint
cd docs && fnm exec --using=$(cat ../.node-version) -- pnpm typecheck
```

Then serve `docs/out` and open both locales: every section renders, the API table has rows, each
example's Preview and Code tabs work, Flat changes the preview, dark mode is readable.
