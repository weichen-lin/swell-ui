import { Fragment, type ReactNode } from 'react'

/** `text` with each `backticked` span as inline code; MDX props are plain strings, not Markdown. */
export function inline(text: string): ReactNode {
  return text.split(/`([^`]+)`/).map((part, i) =>
    // Odd indexes are the captured code spans
    i % 2 ? <code key={i}>{part}</code> : <Fragment key={i}>{part}</Fragment>,
  )
}

/**
 * Same wrapper as Fumadocs' MDX table: scrolls sideways on narrow screens. No tabIndex: browsers
 * make a scroller that overflows keyboard-focusable on their own.
 */
export function DocTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="prose-no-margin relative my-6 overflow-auto">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
