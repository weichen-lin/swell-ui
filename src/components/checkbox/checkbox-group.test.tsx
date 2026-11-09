import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vite-plus/test'
import { Checkbox } from './checkbox'
import { CheckboxGroup } from './checkbox-group'

test('fieldset named by its legend', () => {
  render(
    <CheckboxGroup legend="Sync options">
      <Checkbox label="Prune" />
      <Checkbox label="Dry run" />
    </CheckboxGroup>,
  )
  const group = screen.getByRole('group', { name: 'Sync options' })
  expect(group.tagName).toBe('FIELDSET')
  expect(screen.getAllByRole('checkbox')).toHaveLength(2)
})

test('description and error describe the group', () => {
  const { rerender } = render(
    <CheckboxGroup legend="Sync options" description="Applied to this sync only">
      <Checkbox label="Prune" />
    </CheckboxGroup>,
  )
  const group = screen.getByRole('group')
  expect(group).toHaveAccessibleDescription('Applied to this sync only')
  rerender(
    <CheckboxGroup
      legend="Sync options"
      description="Applied to this sync only"
      error="Pick at least one"
      aria-describedby="extra"
    >
      <Checkbox label="Prune" />
    </CheckboxGroup>,
  )
  expect(group.getAttribute('aria-describedby')?.split(' ')).toHaveLength(3)
  expect(screen.getByText('Pick at least one').parentElement).toHaveClass('text-danger')
  // aria-invalid isn't supported on the group role, so the message carries the error
  expect(group).not.toHaveAttribute('aria-invalid')
})

test('disabled reaches every checkbox natively', async () => {
  const user = userEvent.setup()
  render(
    <CheckboxGroup legend="Sync options" disabled>
      <Checkbox label="Prune" />
      <Checkbox label="Force" />
    </CheckboxGroup>,
  )
  for (const box of screen.getAllByRole('checkbox')) expect(box).toBeDisabled()
  await user.click(screen.getByText('Prune'))
  expect(screen.getByRole('checkbox', { name: 'Prune' })).not.toBeChecked()
})

test('orientation lays the items out', () => {
  const { container, rerender } = render(
    <CheckboxGroup legend="Options">
      <Checkbox label="A" />
    </CheckboxGroup>,
  )
  const list = () => container.querySelector('[data-orientation]') as HTMLElement
  expect(list()).toHaveAttribute('data-orientation', 'vertical')
  expect(list()).toHaveClass('flex-col')
  rerender(
    <CheckboxGroup legend="Options" orientation="horizontal">
      <Checkbox label="A" />
    </CheckboxGroup>,
  )
  expect(list()).toHaveAttribute('data-orientation', 'horizontal')
  expect(list()).toHaveClass('flex-row', 'flex-wrap')
})

test('forwards fieldset props', () => {
  render(
    <CheckboxGroup legend="Options" name="opts" className="mine" data-testid="g">
      <Checkbox label="A" />
    </CheckboxGroup>,
  )
  const group = screen.getByTestId('g')
  expect(group).toHaveAttribute('name', 'opts')
  expect(group).toHaveClass('mine')
})
