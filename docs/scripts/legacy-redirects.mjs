// Before i18n, pages lived at /components/button/; now they live at /en/components/button/.
// Static export has no server redirects, so mirror every English page with a tiny redirect page.
import { existsSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const out = join(import.meta.dirname, '..', 'out')
const from = join(out, 'en')

async function* pageDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  if (entries.some((entry) => entry.isFile() && entry.name === 'index.html')) yield dir
  for (const entry of entries) {
    if (entry.isDirectory()) yield* pageDirs(join(dir, entry.name))
  }
}

function redirectPage(target) {
  const url = JSON.stringify(target)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<script>location.replace(${url} + location.search + location.hash)</script>
</head>
<body><a href="${target}">Moved to ${target}</a></body>
</html>
`
}

let count = 0
for await (const dir of pageDirs(from)) {
  const path = relative(from, dir).split('\\').join('/')
  // / is the Next-rendered locale redirect; never overwrite real output either
  if (!path) continue
  const file = join(out, path, 'index.html')
  if (existsSync(file)) continue
  await mkdir(join(out, path), { recursive: true })
  await writeFile(file, redirectPage(`/en/${path}/`))
  count++
}
console.log(`legacy-redirects: wrote ${count} redirect pages`)
