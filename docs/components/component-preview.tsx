import { highlight } from 'fumadocs-core/highlight'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { examples, type ExampleName } from '@/examples'
import { docLabels } from '@/lib/doc-labels'
import { readExampleSource } from '@/lib/example-source'
import type { Lang } from '@/lib/i18n'
import { scopedThemeCss } from '@/lib/scoped-theme'
import { PreviewTheme, PreviewThemeProvider } from './preview-theme'

/**
 * Renders examples/<name>.tsx and shows that same file as the code tab.
 * Server component: the file is read and highlighted at build time, so no Shiki ships to the browser.
 */
export async function ComponentPreview({ name, lang = 'en' }: { name: ExampleName; lang?: Lang }) {
  const label = docLabels[lang]
  const Example = examples[name]
  const code = await readExampleSource(name)
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
    <>
      {/* href + precedence: React hoists this into <head> once per page, however many previews */}
      <style href="swell-preview-flat" precedence="default">
        {await scopedThemeCss('flat', '[data-preview-theme="flat"]')}
      </style>
      <PreviewThemeProvider>
        <Tabs items={[label.preview, label.code]}>
          <Tab value={label.preview}>
            <PreviewTheme
              labels={{
                group: label.previewTheme,
                default: label.themeDefault,
                flat: label.themeFlat,
              }}
            >
              <Example />
            </PreviewTheme>
          </Tab>
          <Tab value={label.code}>{highlighted}</Tab>
        </Tabs>
      </PreviewThemeProvider>
    </>
  )
}
