/*
 * Guards for same-row controls (Button, Input, Select, ...) lining up at every size.
 *
 * A control's outer edge must sit inside its fixed height: a real `border` or an inset shadow.
 * An outer box-shadow ring paints outside the box, so a 38px button looks 40px next to a 38px
 * field (Swell UI 0.4.0 shipped exactly that). jsdom has no layout, so these checks are static:
 * every outer, zero-blur shadow in the sources must be a translucent focus/error halo, and Button
 * and Field must declare the same heights.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vite-plus/test'
import { Button } from '../components/button'
import { Input } from '../components/input'

// Every shipped source file (components, lib, styles), as text
const sources = Object.entries(
  import.meta.glob<string>(['../**/*.{ts,tsx,css}', '!../**/*.test.{ts,tsx}', '!./**'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
).map(([path, text]) => ({ file: path.replace(/^\.\.\//, ''), text }))

function splitTopLevel(value: string) {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

// Function calls (colors, var()) can nest one level: light-dark(rgb(...), ...)
const fnCall = /[\w-]*\((?:[^()]|\([^()]*\))*\)/g

type Declaration = { file: string; name: string; value: string }

/** Every box-shadow value written in the sources: Tailwind arbitrary classes and CSS. */
function shadowDeclarations(): Declaration[] {
  const found: Declaration[] = []
  for (const { file, text } of sources) {
    for (const m of text.matchAll(/shadow-\[([^\]]+)\]|\[box-shadow:([^\]]+)\]/g))
      found.push({ file, name: m[0], value: (m[1] ?? m[2]).replaceAll('_', ' ') })
    if (!file.endsWith('.css')) continue
    for (const m of text.matchAll(/(--shadow-[\w-]+|(?<![\w-])box-shadow)\s*:\s*([^;]+);/g))
      found.push({ file, name: m[1], value: m[2].replaceAll(/\s+/g, ' ').trim() })
  }
  return found
}

// Thumb shading: the 0.5px hairline sits on the switch track, inside the control's box
const allowedEdges = new Set(['--shadow-switch-thumb'])

/** Outer, zero-blur layers other than a >=3px halo drawn in a `*halo*` color. */
function edgeLayers(value: string) {
  return splitTopLevel(value).filter((layer) => {
    if (/\binset\b/.test(layer) || /^var\([^)]*\)$/.test(layer) || layer === 'none') return false
    const colors = layer.match(fnCall) ?? []
    const lengths = layer
      .replaceAll(fnCall, ' ')
      .split(/\s+/)
      .filter((token) => /^-?[\d.]+(px|rem)?$/.test(token))
      .map((token) => Number.parseFloat(token) * (token.endsWith('rem') ? 16 : 1))
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths
    if (blur > 0) return false
    const halo = x === 0 && y === 0 && spread >= 3 && colors.some((c) => /halo/.test(c))
    return !halo
  })
}

describe('outer edges', () => {
  test('no outer shadow draws an edge outside the box', () => {
    const declarations = shadowDeclarations()
    // The scan must actually see the sources: halos in Field, Checkbox, Radio, Switch, Slider
    expect(declarations.length).toBeGreaterThan(10)
    expect(sources.some((s) => s.file === 'styles/theme.css')).toBe(true)

    const offenders = declarations
      .filter((d) => !allowedEdges.has(d.name))
      .flatMap((d) => edgeLayers(d.value).map((layer) => `${d.file}: ${d.name} -> ${layer}`))
    expect(
      offenders,
      'Draw edges with `border` (or an inset shadow); outer zero-blur shadows may only be >=3px halos',
    ).toEqual([])
  })

  test('no ring utilities (they are outer box-shadows)', () => {
    const offenders = sources.flatMap(({ file, text }) => {
      // Prose in comments says "ring" too; only code can apply the utility
      const code = text.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/(^|[^:])\/\/.*$/gm, '$1')
      return [
        ...code.matchAll(
          /(?<=['"` :])ring-(?:\d+(?:\.\d+)?|\[[^\]]*\]|inset)(?=['"` ])|(?<=:)ring(?=['"` ])/g,
        ),
      ].map((m) => `${file}: ${m[0]}`)
    })
    expect(offenders).toEqual([])
  })

  test('the scans catch the 0.4.0 Button ring', () => {
    expect(edgeLayers('0 0 0 1px var(--color-primary)')).toHaveLength(1)
    expect(edgeLayers('0 1px 0 rgb(0 0 0)')).toHaveLength(1)
    expect(edgeLayers('0 0 0 3px var(--color-ring)')).toHaveLength(1)
    expect(edgeLayers('0 0 0 3px var(--field-halo)')).toEqual([])
    expect(edgeLayers('inset 0 0 0 1px var(--color-ring)')).toEqual([])
    expect(edgeLayers('0 8px 24px light-dark(rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.4))')).toEqual([])
  })
})

const intents = ['primary', 'secondary', 'surface', 'dark', 'ghost'] as const
const sizes = ['sm', 'md', 'lg'] as const

/** Height class to px: `h-9.5` (Tailwind spacing, 4px steps at a 16px root) or `h-[38px]`. */
function heightPx(el: Element) {
  const cls = [...el.classList].find((c) => /^h-(\d+(\.\d+)?|\[\d+px\])$/.test(c))
  if (!cls) return undefined
  const arbitrary = cls.match(/^h-\[(\d+)px\]$/)
  return arbitrary ? Number(arbitrary[1]) : Number(cls.slice(2)) * 4
}

describe.each(sizes)('size %s', (size) => {
  test('Button and Field declare the same outer height', () => {
    render(
      <>
        <Button size={size}>Save</Button>
        <Input aria-label="Name" size={size} />
      </>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    const field = screen
      .getByRole('textbox', { name: 'Name' })
      .closest('[data-slot=input-control]')!
    expect(heightPx(button)).toBeDefined()
    expect(heightPx(button)).toBe(heightPx(field))
  })

  test.each(intents)('%s Button keeps its edge inside the box', (intent) => {
    render(
      <>
        <Button size={size} intent={intent}>
          Default
        </Button>
        <Button size={size} intent={intent} tone="danger">
          Danger
        </Button>
      </>,
    )
    for (const name of ['Default', 'Danger']) {
      const button = screen.getByRole('button', { name })
      expect(button).toHaveClass('border')
      expect([...button.classList].filter((c) => /(^|:)shadow-/.test(c))).toEqual([])
    }
  })
})
