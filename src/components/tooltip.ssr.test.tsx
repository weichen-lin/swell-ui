// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import { Tooltip } from './tooltip'

test('renders on the server without touching document', () => {
  expect(typeof document).toBe('undefined')
  const html = renderToString(
    <Tooltip content="Sync from Git">
      <button type="button">Sync</button>
    </Tooltip>,
  )
  expect(html).toContain('Sync</button>')
  // The bubble is portaled to document.body, so it only exists after hydration
  expect(html).not.toContain('role="tooltip"')
})
