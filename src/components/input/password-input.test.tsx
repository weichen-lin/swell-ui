import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vite-plus/test'
import { PasswordInput } from './password-input'

test('toggle reveals the value via aria-pressed with a stable label, keeping focus', async () => {
  render(<PasswordInput label="Registry token" defaultValue="s3cret" />)
  const input = screen.getByLabelText('Registry token')
  expect(input).toHaveAttribute('type', 'password')
  const toggle = screen.getByRole('button', { name: 'Show password' })
  expect(toggle).toHaveAttribute('type', 'button')
  expect(toggle).toHaveAttribute('aria-pressed', 'false')

  input.focus()
  await userEvent.click(toggle)
  expect(input).toHaveAttribute('type', 'text')
  expect(toggle).toHaveAttribute('aria-pressed', 'true')
  expect(toggle).toHaveAccessibleName('Show password')
  expect(input).toHaveFocus()

  await userEvent.click(toggle)
  expect(input).toHaveAttribute('type', 'password')
  expect(toggle).toHaveAttribute('aria-pressed', 'false')
})

test('autoComplete defaults to current-password and can be overridden', () => {
  const { rerender } = render(<PasswordInput label="Password" />)
  const input = screen.getByLabelText('Password')
  expect(input).toHaveAttribute('autocomplete', 'current-password')
  rerender(<PasswordInput label="Password" autoComplete="new-password" />)
  expect(input).toHaveAttribute('autocomplete', 'new-password')
})

test('toggle is hidden when disabled', () => {
  render(<PasswordInput label="Password" disabled />)
  expect(screen.queryByRole('button', { name: 'Show password' })).toBeNull()
})

test('works with a floating label', () => {
  render(<PasswordInput label="Password" floating />)
  expect(screen.getByLabelText('Password')).toHaveAttribute('placeholder', ' ')
})

test('PasswordInput takes no type', () => {
  // @ts-expect-error type is fixed
  render(<PasswordInput label="Password" type="text" />)
})
