import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { expect, test } from 'vite-plus/test'
import { Checkbox } from './checkbox'
import {
  CheckboxGroup,
  CheckboxGroupDescription,
  CheckboxGroupError,
  CheckboxGroupItems,
  CheckboxGroupLabel,
} from './checkbox-group'

test('fieldset named by its label', () => {
  render(
    <CheckboxGroup>
      <CheckboxGroupLabel>Sync options</CheckboxGroupLabel>
      <Checkbox label="Prune" />
      <Checkbox label="Dry run" />
    </CheckboxGroup>,
  )
  const group = screen.getByRole('group', { name: 'Sync options' })
  expect(group.tagName).toBe('FIELDSET')
  expect(screen.getAllByRole('checkbox')).toHaveLength(2)
})

test('description and error describe the group', () => {
  const ui = (error: boolean) => (
    <CheckboxGroup aria-describedby="extra">
      <CheckboxGroupLabel>Sync options</CheckboxGroupLabel>
      <CheckboxGroupDescription>Applied to this sync only</CheckboxGroupDescription>
      <Checkbox label="Prune" />
      {error && <CheckboxGroupError>Pick at least one</CheckboxGroupError>}
    </CheckboxGroup>
  )
  const { rerender } = render(ui(false))
  const group = screen.getByRole('group')
  expect(group.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2)
  rerender(ui(true))
  expect(group.getAttribute('aria-describedby')?.split(' ')).toHaveLength(3)
  expect(screen.getByText('Pick at least one').parentElement).toHaveClass('text-danger')
  // aria-invalid isn't supported on the group role, so the message carries the error
  expect(group).not.toHaveAttribute('aria-invalid')
  rerender(ui(false))
  expect(group.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2)
})

test('a sr-only label still names the group', () => {
  render(
    <CheckboxGroup>
      <CheckboxGroupLabel className="sr-only">Sync options</CheckboxGroupLabel>
      <Checkbox label="Prune" />
    </CheckboxGroup>,
  )
  expect(screen.getByRole('group', { name: 'Sync options' })).toBeInTheDocument()
  expect(screen.getByText('Sync options')).toHaveClass('sr-only')
})

test('aria-label names the group when no label part is rendered', () => {
  render(
    <CheckboxGroup aria-label="Colors">
      <Checkbox label="Red" />
    </CheckboxGroup>,
  )
  const group = screen.getByRole('group', { name: 'Colors' })
  expect(group).not.toHaveAttribute('aria-labelledby')
})

test('disabled reaches every checkbox natively', async () => {
  const user = userEvent.setup()
  render(
    <CheckboxGroup disabled>
      <CheckboxGroupLabel>Sync options</CheckboxGroupLabel>
      <Checkbox label="Prune" />
      <Checkbox label="Force" />
    </CheckboxGroup>,
  )
  for (const box of screen.getAllByRole('checkbox')) expect(box).toBeDisabled()
  await user.click(screen.getByText('Prune'))
  expect(screen.getByRole('checkbox', { name: 'Prune' })).not.toBeChecked()
})

test('orientation lays the items out', () => {
  const ui = (orientation?: 'horizontal') => (
    <CheckboxGroup orientation={orientation}>
      <CheckboxGroupLabel>Options</CheckboxGroupLabel>
      <CheckboxGroupItems>
        <Checkbox label="A" />
      </CheckboxGroupItems>
    </CheckboxGroup>
  )
  const { container, rerender } = render(ui())
  const list = () => container.querySelector('[data-orientation]') as HTMLElement
  expect(list()).toHaveAttribute('data-orientation', 'vertical')
  expect(list()).toHaveClass('flex-col')
  rerender(ui('horizontal'))
  expect(list()).toHaveAttribute('data-orientation', 'horizontal')
  expect(list()).toHaveClass('flex-row', 'flex-wrap')
})

test('forwards fieldset props', () => {
  render(
    <CheckboxGroup name="opts" className="mine" data-testid="g">
      <CheckboxGroupLabel>Options</CheckboxGroupLabel>
      <Checkbox label="A" />
    </CheckboxGroup>,
  )
  const group = screen.getByTestId('g')
  expect(group).toHaveAttribute('name', 'opts')
  expect(group).toHaveClass('mine')
})

test.each([false, null])('error icon replaces the message icon, and %s hides it', (hidden) => {
  const ui = (icon: ReactNode) => (
    <CheckboxGroup>
      <CheckboxGroupLabel>Sync options</CheckboxGroupLabel>
      <Checkbox label="Prune" />
      <CheckboxGroupError icon={icon}>Pick one</CheckboxGroupError>
    </CheckboxGroup>
  )
  const { rerender } = render(ui(<svg data-testid="custom" />))
  expect(screen.getByText('Pick one').parentElement).toContainElement(screen.getByTestId('custom'))
  expect(document.querySelector('[data-icon="circle-alert"]')).toBeNull()
  rerender(ui(hidden))
  expect(screen.getByText('Pick one').parentElement!.querySelector('svg')).toBeNull()
})
