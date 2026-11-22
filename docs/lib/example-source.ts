import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ExampleName } from '@/examples'

/**
 * The code a reader copies for examples/<name>.tsx: the preview's code tab and the page's Markdown
 * both show this, so they never drift apart. The directive only matters inside the docs bundle.
 */
export async function readExampleSource(name: ExampleName) {
  const source = await readFile(join(process.cwd(), 'examples', `${name}.tsx`), 'utf8')
  return source.replace(/^'use client'\n/, '').trim()
}
