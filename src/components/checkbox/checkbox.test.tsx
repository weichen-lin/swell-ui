import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { expect, test, vi } from 'vite-plus/test'
import { Checkbox } from './checkbox'

const box = (name?: string) =>
  screen.getByRole('checkbox', name ? { name } : undefined) as HTMLInputElement

test('is a native checkbox named by its visible label', () => {
  render(<Checkbox label="Prune" description="Deletes resources no longer in Git" />)
  const input = box('Prune')
  expect(input.tagName).toBe('INPUT')
  expect(input).toHaveAttribute('type', 'checkbox')
  expect(input).toHaveAccessibleDescription('Deletes resources no longer in Git')
})

test('aria-label only', () => {
  render(<Checkbox aria-label="Select checkout-api" />)
  expect(box('Select checkout-api')).not.toHaveAttribute('aria-labelledby')
})

test('click on the box or the label text toggles it; Space toggles, Enter does not', async () => {
  const user = userEvent.setup()
  render(<Checkbox label="Dry run" />)
  const input = box()
  await user.click(input)
  expect(input).toBeChecked()
  await user.click(screen.getByText('Dry run'))
  expect(input).not.toBeChecked()
  input.focus()
  await user.keyboard(' ')
  expect(input).toBeChecked()
  await user.keyboard('{Enter}')
  expect(input).toBeChecked()
})

test('controlled and uncontrolled', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<Checkbox label="A" defaultChecked onChange={onChange} />)
  await user.click(box('A'))
  expect(box('A')).not.toBeChecked()
  expect(onChange).toHaveBeenCalledTimes(1)

  function Controlled() {
    const [on, setOn] = useState(false)
    return <Checkbox label="B" checked={on} onChange={(e) => setOn(e.target.checked)} />
  }
  render(<Controlled />)
  await user.click(box('B'))
  expect(box('B')).toBeChecked()
})

test('disabled: not toggled', async () => {
  const user = userEvent.setup()
  render(<Checkbox label="Force" disabled />)
  await user.click(screen.getByText('Force'))
  expect(box()).toBeDisabled()
  expect(box()).not.toBeChecked()
})

test('description and error: aria-describedby and aria-invalid', () => {
  const { rerender } = render(<Checkbox label="Accept" description="Required to continue" />)
  expect(box()).not.toHaveAttribute('aria-invalid')
  rerender(
    <Checkbox label="Accept" description="Required to continue" error="Accept to continue" />,
  )
  expect(box()).toHaveAttribute('aria-invalid', 'true')
  expect(box()).toHaveAccessibleDescription('Required to continue Accept to continue')
  expect(box('Accept')).toBeInTheDocument()
})

test('submits with the form; reset restores defaultChecked', async () => {
  const user = userEvent.setup()
  render(
    <form data-testid="form">
      <Checkbox label="Prune" name="opts" value="prune" defaultChecked />
      <Checkbox label="Force" name="opts" value="force" />
    </form>,
  )
  const form = screen.getByTestId('form') as HTMLFormElement
  expect(new FormData(form).getAll('opts')).toEqual(['prune'])
  await user.click(box('Force'))
  expect(new FormData(form).getAll('opts')).toEqual(['prune', 'force'])
  form.reset()
  expect(new FormData(form).getAll('opts')).toEqual(['prune'])
})

test('indeterminate is set on the DOM, announced as mixed, and kept across controlled changes', () => {
  const { rerender } = render(
    <Checkbox label="All" checked={false} indeterminate onChange={() => {}} />,
  )
  expect(box().indeterminate).toBe(true)
  expect(box()).toBePartiallyChecked()
  // No aria-checked attribute: the native property maps to mixed (ARIA in HTML forbids aria-checked here)
  expect(box()).not.toHaveAttribute('aria-checked')

  rerender(<Checkbox label="All" checked indeterminate onChange={() => {}} />)
  expect(box().indeterminate).toBe(true)

  rerender(<Checkbox label="All" checked indeterminate={false} onChange={() => {}} />)
  expect(box().indeterminate).toBe(false)
  expect(box()).toBeChecked()
})

test('a click clears indeterminate in the DOM; a parent that derives it re-applies it', async () => {
  const user = userEvent.setup()

  // Uncontrolled with a fixed prop: the browser clears it and nothing re-applies it (the prop
  // didn't change). This is why indeterminate should be derived from state, not hard-coded.
  render(<Checkbox label="Loose" indeterminate />)
  await user.click(box('Loose'))
  expect(box('Loose').indeterminate).toBe(false)
  expect(box('Loose')).toBeChecked()

  // Controlled parent that ignores the click: indeterminate comes back with the next render
  function Stuck() {
    const [, force] = useState(0)
    return (
      <Checkbox label="Stuck" checked={false} indeterminate onChange={() => force((n) => n + 1)} />
    )
  }
  render(<Stuck />)
  await user.click(box('Stuck'))
  // React restored checked=false, but checked didn't change, so the effect didn't re-run: the prop
  // still says indeterminate while the DOM was cleared. Known limit of the [indeterminate, checked]
  // deps; a parent that answers the click (select all/none) never hits it.
  expect(box('Stuck')).not.toBeChecked()
  expect(box('Stuck').indeterminate).toBe(false)
})

test('select all: header derives checked/indeterminate from the rows', async () => {
  const user = userEvent.setup()
  const rows = ['api', 'web', 'worker']
  function Table() {
    const [selected, setSelected] = useState<string[]>(['api'])
    const all = selected.length === rows.length
    const some = selected.length > 0 && !all
    return (
      <>
        <Checkbox
          aria-label="Select all"
          checked={all}
          indeterminate={some}
          onChange={() => setSelected(all ? [] : rows)}
        />
        {rows.map((r) => (
          <Checkbox
            key={r}
            aria-label={`Select ${r}`}
            checked={selected.includes(r)}
            onChange={(e) =>
              setSelected((s) => (e.target.checked ? [...s, r] : s.filter((x) => x !== r)))
            }
          />
        ))}
      </>
    )
  }
  render(<Table />)
  const header = box('Select all')
  expect(header.indeterminate).toBe(true)
  // Partial -> all
  await user.click(header)
  expect(header).toBeChecked()
  expect(header.indeterminate).toBe(false)
  expect(rows.every((r) => box(`Select ${r}`).checked)).toBe(true)
  // Unchecking one row -> partial again (checked flips to false, so the effect re-applies)
  await user.click(box('Select web'))
  expect(header.indeterminate).toBe(true)
  expect(header).not.toBeChecked()
  // Checking it back -> all
  await user.click(box('Select web'))
  expect(header.indeterminate).toBe(false)
  expect(header).toBeChecked()
  // All -> none
  await user.click(header)
  expect(rows.some((r) => box(`Select ${r}`).checked)).toBe(false)
  expect(header.indeterminate).toBe(false)
})

test('forwards ref while keeping its own for indeterminate', () => {
  const ref = createRef<HTMLInputElement>()
  render(<Checkbox label="A" ref={ref} indeterminate className="row" inputClassName="boxy" />)
  expect(ref.current).toBe(box())
  expect(ref.current?.indeterminate).toBe(true)
  expect(box()).toHaveClass('boxy')
  expect(box().closest('label')).toHaveClass('row')
})

test('check and dash marks are decorative siblings of the input', () => {
  render(<Checkbox label="A" />)
  const marks = box().parentElement?.querySelectorAll('svg') ?? []
  expect(marks).toHaveLength(2)
  for (const svg of marks) expect(svg).toHaveAttribute('aria-hidden', 'true')
})

test.each([false, null])('errorIcon replaces the error message icon, and %s hides it', (hidden) => {
  const { rerender } = render(
    <Checkbox label="Accept" error="Required" errorIcon={<svg data-testid="custom" />} />,
  )
  expect(screen.getByText('Required').parentElement).toContainElement(screen.getByTestId('custom'))
  expect(document.querySelector('[data-icon="circle-alert"]')).toBeNull()
  rerender(<Checkbox label="Accept" error="Required" errorIcon={hidden} />)
  expect(screen.getByText('Required').parentElement!.querySelector('svg')).toBeNull()
})
