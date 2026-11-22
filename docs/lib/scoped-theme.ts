import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// The published files, so previews show exactly what `@import '.../themes/flat.css'` gives an app
const dist = join(process.cwd(), 'node_modules/@weichenlin/swell-ui/dist')

type Decls = Map<string, string>

function declarations(block: string): Decls {
  const out: Decls = new Map()
  // Values hold parentheses (light-dark, color-mix) but never `;` or braces
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    out.set(match[1], match[2].trim())
  return out
}

function block(css: string, opener: string) {
  const start = css.indexOf(opener)
  if (start === -1) throw new Error(`${opener} not found`)
  const open = css.indexOf('{', start)
  return css.slice(open + 1, css.indexOf('}', open))
}

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/**
 * flat.css rewritten from `:root` to `selector`, so one preview can opt in alone.
 *
 * Custom properties resolve their var()s where they are declared: a token theme.css computes from
 * an overridden one (--color-primary-pressed reads --pressed-strength) is already resolved at
 * :root and would ignore the override inside the preview. Those dependents are redeclared in the
 * scope too, so it computes the same values the theme gives on :root.
 */
export async function scopedThemeCss(theme: 'flat', selector: string) {
  const [themeCss, tokenCss] = await Promise.all([
    readFile(join(dist, `themes/${theme}.css`), 'utf8'),
    readFile(join(dist, 'theme.css'), 'utf8'),
  ])
  const overrides = declarations(block(stripComments(themeCss), ':root'))
  const tokens = declarations(block(stripComments(tokenCss), '@theme'))

  const scoped = new Map(overrides)
  // Fixpoint: a dependent of a dependent is stale as well
  for (let changed = true; changed;) {
    changed = false
    for (const [name, value] of tokens) {
      if (scoped.has(name)) continue
      const refs = [...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
      if (refs.some((ref) => scoped.has(ref))) {
        scoped.set(name, value)
        changed = true
      }
    }
  }

  const body = [...scoped].map(([name, value]) => `${name}:${value};`).join('')
  return `${selector}{${body}}`
}
