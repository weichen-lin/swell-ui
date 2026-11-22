// Static export can't serve a route at /en/x.md next to the page /en/x/, so the Markdown route is
// exported under /md-export/ (app/md-export). Move each file to its public path and drop the rest.
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

const out = join(import.meta.dirname, '..', 'out')
const from = join(out, 'md-export')

let count = 0
for (const entry of await readdir(from, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue
  const file = join(entry.parentPath, entry.name)
  const target = join(out, relative(from, file))
  await mkdir(dirname(target), { recursive: true })
  await rename(file, target)
  count++
}
await rm(from, { recursive: true })
console.log(`markdown-files: moved ${count} .md files`)
