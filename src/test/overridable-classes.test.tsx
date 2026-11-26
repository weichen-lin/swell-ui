/*
 * Guards that a consumer's className always wins over the components' own conditional styles.
 *
 * A consumer overrides a state the ordinary Tailwind way: `hover:bg-x`, `data-pressed:bg-x`,
 * `aria-checked:bg-x` (one variant, specificity 0,2,0), or a plain `size-6` on their own icon
 * (0,1,0). A component rule with stacked or guarded variants (`hover:not-aria-disabled:` is 0,3,0)
 * or a descendant selector (`[&_svg]:` is 0,1,1) outranks those, and tailwind-merge can't drop it
 * because its prefix differs. So guards and descendant targets are wrapped in :where() (weight 0).
 *
 * This compiles every class literal in the shipped sources with Tailwind itself and measures the
 * selectors it emits. Per rule, with pseudo-elements (::before, ::picker()) not counted:
 * - at most 0,2,0;
 * - above 0,1,0 only from a single condition variant, the form a consumer writes too (and then
 *   tailwind-merge dedupes the two, or the consumer's later rule wins the tie);
 * - a rule aimed at a descendant (`[&_svg]:`, `*:`) carries no weight beyond the component's class.
 * Media-only variants (forced-colors:, pointer-fine:, motion-safe:, ...) add no weight.
 */
import { render, screen } from '@testing-library/react'
import { compile } from 'tailwindcss'
import { describe, expect, test } from 'vite-plus/test'
import { Button } from '../components/button'
import swellTheme from '../styles/theme.css?raw'
import twTheme from 'tailwindcss/theme.css?raw'
import twUtilities from 'tailwindcss/utilities.css?raw'

type Specificity = [number, number, number]

// Every shipped source file that can hold class strings, as text
const sources = Object.entries(
  import.meta.glob<string>(
    ['../components/**/*.{ts,tsx}', '../lib/**/*.{ts,tsx}', '../hooks/**/*.{ts,tsx}'],
    { query: '?raw', import: 'default', eager: true },
  ),
)
  .filter(([path]) => !/\.test\.tsx?$/.test(path))
  .map(([path, text]) => ({ file: path.replace(/^\.\.\//, ''), text }))

/** Splits `value` on `separator` outside (), [] and quotes. */
function splitTop(value: string, separator: string) {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let current = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '\\') {
      current += ch + (value[++i] ?? '')
      continue
    }
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === separator && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  parts.push(current)
  return parts
}

/**
 * Class-like tokens, roughly as Tailwind's scanner sees them: whitespace separates, and quotes,
 * braces and commas end a token unless they sit inside an arbitrary `[...]` (`[value=""]`).
 */
function candidates(text: string) {
  const found = new Set<string>()
  for (const chunk of text.split(/\s+/)) {
    let depth = 0
    let current = ''
    const flush = () => {
      if (current.includes(':')) found.add(current)
      current = ''
    }
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i]
      if (ch === '[' && !/['"`]/.test(chunk[i + 1] ?? '')) depth++
      else if (ch === ']' && depth > 0) depth--
      else if (depth === 0 && /['"`{},;]/.test(ch)) {
        flush()
        continue
      }
      current += ch
    }
    flush()
  }
  return found
}

const variantsOf = (candidate: string) => splitTop(candidate, ':').slice(0, -1)

/** Style rules with at least one declaration: selector and declared properties. */
function styleRules(css: string) {
  const rules: { selector: string; props: string[] }[] = []
  const stack: string[] = []
  let prelude = ''
  let quote = ''
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (quote) {
      prelude += ch
      if (ch === '\\') prelude += css[++i]
      else if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      prelude += ch
    } else if (ch === '\\') {
      prelude += ch + css[++i]
    } else if (ch === '{') {
      stack.push(prelude.trim())
      prelude = ''
    } else if (ch === '}' || ch === ';') {
      const declaration = prelude.trim()
      prelude = ''
      const selector = stack.findLast((p) => !p.startsWith('@'))
      // Declarations only: skip keyframes, @property and the like
      if (declaration && selector && !stack.some((p) => /^@(keyframes|property)/.test(p))) {
        const prop = declaration.slice(0, declaration.indexOf(':')).trim()
        const rule = rules.at(-1)
        if (rule?.selector === selector) rule.props.push(prop)
        else rules.push({ selector, props: [prop] })
      }
      if (ch === '}') stack.pop()
    } else prelude += ch
  }
  return rules
}

const add = (a: Specificity, b: Specificity): Specificity => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const compare = (a: Specificity, b: Specificity) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
const max = (list: Specificity[]) =>
  list.reduce<Specificity>((m, s) => (compare(s, m) > 0 ? s : m), [0, 0, 0])

/** Selectors Level 4 specificity: :where() is zero, :is()/:not()/:has() take their heaviest argument. */
function specificity(selector: string): Specificity {
  return max(splitTop(selector, ',').map(complexSpecificity))
}

function complexSpecificity(selector: string): Specificity {
  let total: Specificity = [0, 0, 0]
  let i = 0
  const ident = () => {
    while (i < selector.length) {
      if (selector[i] === '\\') i += 2
      else if (/[\w\- -￿]/.test(selector[i])) i++
      else break
    }
  }
  const args = () => {
    const start = i
    let depth = 0
    for (; i < selector.length; i++) {
      if (selector[i] === '\\') i++
      else if (selector[i] === '(') depth++
      else if (selector[i] === ')' && --depth === 0) return selector.slice(start + 1, i++)
    }
    throw new Error(`Unbalanced selector: ${selector}`)
  }
  while (i < selector.length) {
    const ch = selector[i]
    if (ch === '#') {
      i++
      ident()
      total = add(total, [1, 0, 0])
    } else if (ch === '.') {
      i++
      ident()
      total = add(total, [0, 1, 0])
    } else if (ch === '[') {
      let depth = 0
      for (; i < selector.length; i++) {
        if (selector[i] === '[') depth++
        else if (selector[i] === ']' && --depth === 0) break
      }
      i++
      total = add(total, [0, 1, 0])
    } else if (ch === ':' && selector[i + 1] === ':') {
      i += 2
      ident()
      if (selector[i] === '(') args()
      total = add(total, [0, 0, 1])
    } else if (ch === ':') {
      i++
      const start = i
      ident()
      const name = selector.slice(start, i).toLowerCase()
      const inner = selector[i] === '(' ? args() : null
      if (name === 'where') continue
      if (inner !== null && ['is', 'not', 'has'].includes(name))
        total = add(total, specificity(inner))
      else if (['before', 'after', 'first-line', 'first-letter'].includes(name))
        total = add(total, [0, 0, 1])
      else total = add(total, [0, 1, 0])
    } else if (/[\w-]/.test(ch) || ch === '\\') {
      ident()
      total = add(total, [0, 0, 1])
    } else i++
  }
  return total
}

// Pseudo-elements pick what is styled, not when: `before:x` matches the consumer's `before:y`
const withoutPseudoElements = (selector: string) =>
  selector.replaceAll(/(?<!\\)::[\w-]+(?:\([^)]*\))?|(?<!\\):(?:before|after)\b/g, '')

// Tailwind escapes every character outside [\w-] in a class selector
const escapeClass = (name: string) => `.${name.replaceAll(/[^\w-]/g, (ch) => `\\${ch}`)}`

/** The part of `selector` after `className`, with parenthesised groups dropped. */
function tail(selector: string, className: string) {
  const at = selector.indexOf(escapeClass(className))
  if (at === -1) return ''
  let rest = selector.slice(at + escapeClass(className).length)
  for (let prev = ''; prev !== rest;) {
    prev = rest
    rest = rest.replaceAll(/\([^()]*\)/g, '')
  }
  return rest
}

const stylesheets: Record<string, string> = {
  'tailwindcss/theme.css': twTheme,
  'tailwindcss/utilities.css': twUtilities,
  './theme.css': swellTheme,
}
const compiler = await compile(
  `@import 'tailwindcss/theme.css' layer(theme);
   @import 'tailwindcss/utilities.css' layer(utilities);
   @import './theme.css';`,
  {
    base: '/',
    loadStylesheet: async (id, base) => {
      const content = stylesheets[id]
      if (content === undefined) throw new Error(`Unexpected stylesheet: ${id}`)
      return { path: id, base, content }
    },
  },
)

const perFile = sources.map(({ file, text }) => ({ file, candidates: candidates(text) }))
const all = new Set(perFile.flatMap(({ candidates }) => [...candidates]))
// One probe per variant tells what that variant alone does to a selector
const probes = new Map([...all].flatMap(variantsOf).map((v) => [`${v}:flex`, v]))
const userClasses = ['hover:bg-red-500', 'data-pressed:bg-red-500', '[&_svg]:size-6', 'size-6']
const rules = styleRules(compiler.build([...all, ...probes.keys(), ...userClasses]))

const rulesByClass = new Map<string, { selector: string; props: string[] }[]>()
for (const rule of rules) {
  // The rule's own class is the longest one in it (a group/peer marker class is shorter)
  const owner = [...rule.selector.matchAll(/\.((?:\\.|[\w-])+)/g)]
    .map((m) => m[1].replaceAll(/\\(.)/g, '$1'))
    .filter((name) => all.has(name) || probes.has(name) || userClasses.includes(name))
    .sort((a, b) => b.length - a.length)[0]
  if (owner) rulesByClass.set(owner, [...(rulesByClass.get(owner) ?? []), rule])
}

type VariantKind = 'media' | 'pseudo-element' | 'descendant' | 'condition'
const variantKind = new Map<string, VariantKind>()
for (const [probe, variant] of probes) {
  const selectors = (rulesByClass.get(probe) ?? []).map((r) => r.selector)
  if (selectors.length === 0) continue // not a Tailwind variant (prose, URLs, object keys)
  const rest = selectors.map((s) => tail(s, probe)).join(' ')
  variantKind.set(
    variant,
    selectors.every((s) => s === escapeClass(probe))
      ? 'media'
      : /[\s>+~]/.test(rest)
        ? 'descendant'
        : /::|:before|:after/.test(rest)
          ? 'pseudo-element'
          : 'condition',
  )
}

const ruleSpecificity = (name: string) =>
  max((rulesByClass.get(name) ?? []).map((r) => specificity(withoutPseudoElements(r.selector))))

describe('component classes stay below a consumer override', () => {
  test('the scan found the components and compiled them', () => {
    expect(perFile.length).toBeGreaterThan(30)
    expect([...all].filter((c) => rulesByClass.has(c)).length).toBeGreaterThan(500)
    expect(variantKind.get('hover')).toBe('condition')
    expect(variantKind.get('forced-colors')).toBe('media')
    expect(variantKind.get('before')).toBe('pseudo-element')
    expect(variantKind.get('[&_:where(svg:not([class*=size-]))]')).toBe('descendant')
  })

  test.each(perFile.map(({ file, candidates }) => [file, candidates] as const))(
    '%s',
    (_file, fileCandidates) => {
      const offenders: string[] = []
      for (const name of fileCandidates) {
        if (!rulesByClass.has(name)) continue
        const kinds = variantsOf(name).map((v) => variantKind.get(v))
        const weight = ruleSpecificity(name)
        const conditions = kinds.filter((k) => k === 'condition').length
        const problem = kinds.includes('descendant')
          ? compare(weight, [0, 1, 0]) > 0 && 'a descendant rule above 0,1,0'
          : compare(weight, [0, 2, 0]) > 0
            ? 'above 0,2,0'
            : compare(weight, [0, 1, 0]) > 0 && conditions !== 1 && 'stacked variants above 0,1,0'
        if (problem) offenders.push(`${name} (${weight.join(',')}): ${problem}`)
      }
      expect(offenders).toEqual([])
    },
  )
})

describe('Button', () => {
  const button = perFile.find(({ file }) => file === 'components/button/button.tsx')
  if (!button) throw new Error('button.tsx not scanned')
  const buttonRules = [...button.candidates].flatMap((name) => rulesByClass.get(name) ?? [])

  test("its hover and pressed fills lose to the consumer's hover: and data-pressed:", () => {
    // Forced colors' own pressed pair (Highlight) is left out: system colors should hold there
    const fills = (pattern: RegExp) =>
      [...button.candidates]
        .filter((name) => !name.startsWith('forced-colors:'))
        .flatMap((name) => rulesByClass.get(name) ?? [])
        .filter(
          (r) =>
            pattern.test(r.selector) &&
            r.props.some((p) => ['background-color', 'color', 'opacity', 'translate'].includes(p)),
        )
    const hover = fills(/:hover/)
    const pressed = fills(/(?<!:not\()\[data-pressed\]/)
    expect(hover.length).toBeGreaterThan(5)
    expect(pressed.length).toBeGreaterThan(5)

    const userHover = ruleSpecificity('hover:bg-red-500')
    const userPressed = ruleSpecificity('data-pressed:bg-red-500')
    expect(userHover).toEqual([0, 2, 0])
    for (const rule of hover) expect(compare(specificity(rule.selector), userHover)).toBeLessThan(0)
    for (const rule of pressed)
      expect(compare(specificity(rule.selector), userPressed)).toBeLessThan(0)
  })

  test('its icon and spinner sizes skip an svg that has its own size-*', () => {
    render(
      <>
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size}>
            <Button size={size} iconLeft={<svg data-testid="plain" />}>
              Plain
            </Button>
            <Button size={size} iconLeft={<svg data-testid="sized" className="size-6" />}>
              Sized
            </Button>
            <Button
              size={size}
              icon={<svg data-testid="sized" className="size-6" />}
              aria-label="Icon only"
            />
            <Button size={size} loading>
              Loading
            </Button>
            <Button
              size={size}
              loading
              loadingIcon={<svg data-testid="sized" className="size-6" />}
            >
              Custom spinner
            </Button>
          </div>
        ))}
      </>,
    )
    const sizing = buttonRules.filter(
      (r) => r.selector.includes('svg') && r.props.includes('width') && r.props.includes('height'),
    )
    expect(sizing.length).toBeGreaterThan(0)
    const plain = [
      ...screen.getAllByTestId('plain'),
      ...document.querySelectorAll('[data-icon="loader-circle"]'),
    ]
    const sized = screen.getAllByTestId('sized')
    for (const rule of sizing) expect(sized.filter((svg) => svg.matches(rule.selector))).toEqual([])
    // Positive control: without a size class every icon and the default spinner still get one
    for (const svg of plain) expect(sizing.some((rule) => svg.matches(rule.selector))).toBe(true)
    // And `[&_svg]:size-6` on the Button outranks the component's own size
    for (const rule of sizing)
      expect(compare(specificity(rule.selector), ruleSpecificity('[&_svg]:size-6'))).toBeLessThan(0)
  })
})
