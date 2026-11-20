import { describe, expect, it } from 'vite-plus/test'
import { cn } from './cn'
import theme from '../styles/theme.css?raw'

const themeBlock = theme.match(/@theme \{([\s\S]*?)\n\}/)![1]
const tokens = (namespace: string) =>
  [...themeBlock.matchAll(new RegExp(`--${namespace}-([a-z0-9-]+):`, 'g'))].map((m) => m[1])

describe('cn', () => {
  it('dedupes custom radius, shadow and container tokens', () => {
    expect(cn('rounded-sm', 'rounded-lg')).toBe('rounded-lg')
    expect(cn('rounded-lg', 'rounded-sm')).toBe('rounded-sm')
    expect(cn('shadow-popover', 'shadow-none')).toBe('shadow-none')
    expect(cn('shadow-input', 'shadow-dialog')).toBe('shadow-dialog')
    expect(cn('max-w-page', 'max-w-sm')).toBe('max-w-sm')
  })

  it('keeps a custom token apart from other groups', () => {
    expect(cn('rounded-sm', 'rounded-t-lg')).toBe('rounded-sm rounded-t-lg')
    expect(cn('shadow-popover', 'shadow-fg')).toBe('shadow-popover shadow-fg')
    expect(cn('text-fg', 'text-sm')).toBe('text-fg text-sm')
    expect(cn('text-fg-muted', 'text-danger')).toBe('text-danger')
  })

  it('knows every radius, shadow, container and font token in theme.css', () => {
    for (const name of tokens('radius'))
      expect(cn(`rounded-${name}`, 'rounded-none')).toBe('rounded-none')
    for (const name of tokens('shadow'))
      expect(cn(`shadow-${name}`, 'shadow-none')).toBe('shadow-none')
    for (const name of tokens('container'))
      expect(cn(`max-w-${name}`, 'max-w-none')).toBe('max-w-none')
    for (const name of tokens('font')) {
      const other = name === 'mono' ? 'font-sans' : 'font-mono'
      expect(cn(`font-${name}`, other)).toBe(other)
    }
  })

  it('knows every control height token in theme.css', () => {
    const names = tokens('spacing')
    expect(names).toEqual(['control-sm', 'control-md', 'control-lg'])
    for (const name of names) {
      expect(cn(`h-${name}`, 'h-10')).toBe('h-10')
      expect(cn('h-10', `h-${name}`)).toBe(`h-${name}`)
      expect(cn(`min-h-${name}`, 'min-h-11')).toBe('min-h-11')
      expect(cn(`size-${name}`, 'w-4')).toBe(`size-${name} w-4`)
    }
  })

  it('treats every color token in theme.css as a color', () => {
    const colors = tokens('color')
    expect(colors.length).toBeGreaterThan(50)
    for (const name of colors) {
      expect(cn(`bg-${name}`, 'bg-transparent')).toBe('bg-transparent')
      expect(cn(`text-${name}`, 'text-sm')).toBe(`text-${name} text-sm`)
    }
  })
})
