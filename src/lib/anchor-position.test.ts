import { afterEach, expect, test, vi } from 'vite-plus/test'
import { anchorName, nameAnchor, supportsAnchorPositioning } from './anchor-position'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('needs every probe, and CSS.supports itself', () => {
  const supports = vi.spyOn(CSS, 'supports').mockReturnValue(true)
  expect(supportsAnchorPositioning()).toBe(true)
  // e.g. Chrome 125-143 or Safari 26.0/26.1: anchor-name alone is not enough
  supports.mockImplementation(
    (declaration: string) => declaration !== 'position-try-fallbacks: flip-x',
  )
  expect(supportsAnchorPositioning()).toBe(false)
  supports.mockImplementation((declaration: string) => declaration !== 'container-type: anchored')
  expect(supportsAnchorPositioning()).toBe(true)
  expect(supportsAnchorPositioning(['container-type: anchored'])).toBe(false)
  vi.stubGlobal('CSS', undefined)
  expect(supportsAnchorPositioning()).toBe(false)
})

test('setup keeps jsdom on the measuring path', () => {
  expect(supportsAnchorPositioning()).toBe(false)
})

test('turns useId output into a unique dashed ident', () => {
  expect(anchorName('_r_1f_')).toBe('--swell_r_1f_')
  expect(anchorName('«r1»')).toBe('--swell_r1_')
  expect(anchorName(':r1:-trigger')).toBe('--swell_r1_-trigger')
  expect(anchorName('«r1»')).not.toBe(anchorName('«r2»'))
})

test('names the anchor until cleanup, unless something renamed it meanwhile', () => {
  const el = document.createElement('button')
  const unname = nameAnchor(el, '--swell-a')
  expect(el.style.getPropertyValue('anchor-name')).toBe('--swell-a')
  unname()
  expect(el.style.getPropertyValue('anchor-name')).toBe('')
  const stale = nameAnchor(el, '--swell-a')
  nameAnchor(el, '--swell-b')
  stale()
  expect(el.style.getPropertyValue('anchor-name')).toBe('--swell-b')
})
