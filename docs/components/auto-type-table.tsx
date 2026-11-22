import { join } from 'node:path'
import { createGenerator, type DocEntry, type Generator } from 'fumadocs-typescript'
import { AutoTypeTable as BaseAutoTypeTable } from 'fumadocs-typescript/ui'

// Repo root; the build runs in docs/, the same cwd ComponentPreview reads examples from
const root = join(process.cwd(), '..')

// One TypeScript process per build worker, shared by every table. The lib config skips the test
// globals, which the component types never need.
const base = createGenerator({ tsconfigPath: join(root, 'tsconfig.lib.json') })

const INHERITED = 'x-inherited'

// 'a' | 'b' | undefined reads better spelled out than Fumadocs' generic "union"; anything with
// generics or functions keeps the default short form
const simpleUnion = /^("[^"]*"|boolean|string|number)$/

function ownEntries(entries: DocEntry[]) {
  return (
    entries
      .filter((entry) => !entry.tags.some((tag) => tag.name === INHERITED))
      // `prop?: never` (a slot the other union member owns) leaves only undefined: nothing to document
      .filter((entry) => entry.type !== 'undefined')
  )
}

type TypeTableProps = {
  path: string
  name: string
  type?: string
  keep?: string[]
}

/**
 * Doc entries of the component's own props: anything declared in node_modules (the ~300 HTML
 * attributes) is dropped unless named in `keep`. The rendered table and the page's Markdown both
 * read this, so they list the same props with the same simplified types.
 */
function ownPropsGenerator(keep: string[]): Generator {
  return {
    ...base,
    async generateTypeTable(props, options) {
      const docs = await base.generateTypeTable(props, {
        ...options,
        transform(entry, _type, symbol) {
          const own = symbol.declarations.some((d) => !d.path.includes('/node_modules/'))
          if (!own && !keep.includes(entry.name)) entry.tags.push({ name: INHERITED, text: '' })
        },
        typeSimplifier: {
          override({ type, checker, location }) {
            const parts = checker
              .typeToString(type, location)
              .split(' | ')
              .filter((part) => part !== 'undefined' && part !== 'null')
            if (parts.length > 0 && parts.every((part) => simpleUnion.test(part)))
              return parts.join(' | ')
            // `Side | undefined` on an optional prop: the alias says more than "union"
            if (parts.length === 1 && /^[A-Z]\w*$/.test(parts[0])) return parts[0]
          },
        },
      })
      return docs.map((doc) => ({ ...doc, entries: ownEntries(doc.entries) }))
    },
  }
}

/** The same docs the table renders, for output that isn't React (the page's Markdown). */
export function generateTypeDocs({ path, name, type, keep = [] }: TypeTableProps) {
  return ownPropsGenerator(keep).generateTypeTable({ path, name, type }, { basePath: root })
}

/**
 * Props table generated from the component's types, own props only (see ownPropsGenerator).
 *
 * `path` is relative to the repo root. `type` may name a non-exported type of that file, or an
 * expression over it (`Pick<IconOnlyButtonProps, 'icon'>`), with `name` as its label.
 */
export function AutoTypeTable({ path, name, type, keep = [] }: TypeTableProps) {
  return (
    <BaseAutoTypeTable
      generator={ownPropsGenerator(keep)}
      path={path}
      name={name}
      type={type}
      options={{ basePath: root }}
    />
  )
}
