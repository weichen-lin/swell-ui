import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { highlight } from 'fumadocs-core/highlight'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { examples, type ExampleName } from '@/examples'

/**
 * Renders examples/<name>.tsx and shows that same file as the code tab.
 * Server component: the file is read and highlighted at build time, so no Shiki ships to the browser.
 */
export async function ComponentPreview({ name }: { name: ExampleName }) {
  const Example = examples[name]
  const source = await readFile(join(process.cwd(), 'examples', `${name}.tsx`), 'utf8')
  const code = source.replace(/^'use client'\n/, '').trim()
  const highlighted = await highlight(code, {
    lang: 'tsx',
    themes: { light: 'github-light', dark: 'github-dark' },
    components: {
      pre: (props) => (
        <CodeBlock {...props}>
          <Pre>{props.children}</Pre>
        </CodeBlock>
      ),
    },
  })

  return (
    <Tabs items={['Preview', 'Code']}>
      <Tab value="Preview">
        <div className="flex min-h-40 items-center justify-center p-6">
          <Example />
        </div>
      </Tab>
      <Tab value="Code">{highlighted}</Tab>
    </Tabs>
  )
}
