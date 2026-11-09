import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { expect, test, vi } from 'vite-plus/test'
import { Switch } from './switch'

test('is a native checkbox with role=switch and no aria-checked', () => {
  render(<Switch label="Auto-sync" />)
  const input = screen.getByRole('switch', { name: 'Auto-sync' })
  expect(input.tagName).toBe('INPUT')
  expect(input).toHaveAttribute('type', 'checkbox')
  expect(input).not.toHaveAttribute('aria-checked')
  expect(input).not.toBeChecked()
})

test('the visible label names it; description and error stay out of the name', () => {
  render(<Switch label="Self-heal" description="Reverts drift" error="Not allowed" />)
  const input = screen.getByRole('switch', { name: 'Self-heal' })
  // The whole row is the label
  expect(input.closest('label')).toHaveTextContent('Self-healReverts driftNot allowed')
})

test('aria-label only: no visible label, still named', () => {
  render(<Switch aria-label="Enable checkout-api" />)
  const input = screen.getByRole('switch', { name: 'Enable checkout-api' })
  expect(input).not.toHaveAttribute('aria-labelledby')
})

test('click on the input and on the label text toggles it', async () => {
  const user = userEvent.setup()
  render(<Switch label="Auto-sync" />)
  const input = screen.getByRole('switch')
  await user.click(input)
  expect(input).toBeChecked()
  await user.click(screen.getByText('Auto-sync'))
  expect(input).not.toBeChecked()
})

test('Space toggles; Enter does not', async () => {
  const user = userEvent.setup()
  render(<Switch label="Auto-sync" />)
  const input = screen.getByRole('switch')
  input.focus()
  await user.keyboard(' ')
  expect(input).toBeChecked()
  // Native checkbox behavior: Enter doesn't activate it (in a form it submits instead)
  await user.keyboard('{Enter}')
  expect(input).toBeChecked()
})

test('uncontrolled: defaultChecked and onChange with the native event', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<Switch label="Auto-sync" defaultChecked onChange={onChange} />)
  const input = screen.getByRole('switch')
  expect(input).toBeChecked()
  await user.click(input)
  expect(input).not.toBeChecked()
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange.mock.calls[0][0].target).toBe(input)
})

test('controlled: follows `checked`', async () => {
  const user = userEvent.setup()
  function Controlled() {
    const [on, setOn] = useState(false)
    return (
      <>
        <Switch label="Prune" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <output>{on ? 'on' : 'off'}</output>
      </>
    )
  }
  render(<Controlled />)
  await user.click(screen.getByRole('switch'))
  expect(screen.getByRole('switch')).toBeChecked()
  expect(screen.getByRole('status')).toHaveTextContent('on')

  // Ignoring onChange keeps it where it was
  const { rerender } = render(<Switch aria-label="Fixed" checked={false} onChange={() => {}} />)
  const fixed = screen.getByRole('switch', { name: 'Fixed' })
  await user.click(fixed)
  expect(fixed).not.toBeChecked()
  rerender(<Switch aria-label="Fixed" checked onChange={() => {}} />)
  expect(fixed).toBeChecked()
})

test('disabled: not toggled, row dims via :disabled', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<Switch label="Auto-sync" disabled onChange={onChange} />)
  const input = screen.getByRole('switch')
  expect(input).toBeDisabled()
  await user.click(screen.getByText('Auto-sync'))
  expect(input).not.toBeChecked()
  expect(onChange).not.toHaveBeenCalled()
  expect(input.closest('label')).toHaveClass('has-[input:disabled]:opacity-50')
})

test('loading: aria-busy, stays focusable, clicks and Space do nothing', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  const { rerender } = render(<Switch label="Auto-sync" loading onChange={onChange} />)
  const input = screen.getByRole('switch')
  expect(input).toHaveAttribute('aria-busy', 'true')
  expect(input).not.toBeDisabled()
  await user.click(input)
  expect(input).toHaveFocus()
  expect(input).not.toBeChecked()
  await user.keyboard(' ')
  await user.click(screen.getByText('Auto-sync'))
  expect(input).not.toBeChecked()
  expect(onChange).not.toHaveBeenCalled()

  // Done loading: the next real change goes through (React's value tracker wasn't left stale)
  rerender(<Switch label="Auto-sync" onChange={onChange} />)
  expect(input).not.toHaveAttribute('aria-busy')
  await user.click(input)
  expect(input).toBeChecked()
  expect(onChange).toHaveBeenCalledTimes(1)
})

test('loading shows a spinner inside the thumb', () => {
  const { container, rerender } = render(<Switch label="Auto-sync" />)
  expect(container.querySelector('.animate-spin')).toBeNull()
  rerender(<Switch label="Auto-sync" loading />)
  expect(container.querySelector('.animate-spin')).not.toBeNull()
})

test('description and error are linked with aria-describedby; error sets aria-invalid', () => {
  const { rerender } = render(
    <Switch label="Self-heal" description="Reverts manual changes" aria-describedby="extra" />,
  )
  const input = screen.getByRole('switch')
  expect(input).toHaveAccessibleDescription('Reverts manual changes')
  expect(input.getAttribute('aria-describedby')?.split(' ')[0]).toBe('extra')
  expect(input).not.toHaveAttribute('aria-invalid')

  rerender(
    <Switch label="Self-heal" description="Reverts manual changes" error="Needs auto-sync" />,
  )
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Reverts manual changes Needs auto-sync')
  expect(screen.getByText('Needs auto-sync').parentElement).toHaveClass('text-danger')

  // error={true}: invalid without a message
  rerender(<Switch label="Self-heal" error />)
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).not.toHaveAttribute('aria-describedby')
})

test('submits with the form, and form.reset() restores defaultChecked', async () => {
  const user = userEvent.setup()
  render(
    <form data-testid="form">
      <Switch label="Auto-sync" name="autoSync" defaultChecked />
      <Switch label="Prune" name="prune" value="yes" />
    </form>,
  )
  const form = screen.getByTestId('form') as HTMLFormElement
  expect(Object.fromEntries(new FormData(form))).toEqual({ autoSync: 'on' })

  await user.click(screen.getByRole('switch', { name: 'Prune' }))
  await user.click(screen.getByRole('switch', { name: 'Auto-sync' }))
  expect(Object.fromEntries(new FormData(form))).toEqual({ prune: 'yes' })

  form.reset()
  expect(screen.getByRole('switch', { name: 'Auto-sync' })).toBeChecked()
  expect(screen.getByRole('switch', { name: 'Prune' })).not.toBeChecked()
})

test('required: native validity', () => {
  render(<Switch label="Accept" required />)
  const input = screen.getByRole('switch') as HTMLInputElement
  expect(input.validity.valueMissing).toBe(true)
  fireEvent.click(input)
  expect(input.validity.valueMissing).toBe(false)
})

test('forwards ref, className to the row and inputClassName to the input', () => {
  const ref = createRef<HTMLInputElement>()
  render(<Switch label="Auto-sync" ref={ref} className="row" inputClassName="track" />)
  const input = screen.getByRole('switch')
  expect(ref.current).toBe(input)
  expect(input).toHaveClass('track')
  expect(input.closest('label')).toHaveClass('row')
})

test('labelPosition start puts the text before the switch and spreads the row', () => {
  render(<Switch label="Auto-sync" labelPosition="start" />)
  const row = screen.getByRole('switch').closest('label') as HTMLElement
  expect(row).toHaveClass('justify-between', 'w-full')
  expect(row.firstElementChild).toHaveTextContent('Auto-sync')
})

test('sizes set the track and thumb geometry', () => {
  const { rerender } = render(<Switch aria-label="s" size="sm" />)
  const track = () => screen.getByRole('switch').parentElement as HTMLElement
  expect(track()).toHaveClass('h-3.5', 'w-7', '[--switch-thumb:10px]')
  rerender(<Switch aria-label="s" size="md" />)
  expect(track()).toHaveClass('h-5', 'w-9', '[--switch-thumb:16px]')
})
