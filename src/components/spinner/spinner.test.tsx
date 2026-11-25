import { render, screen } from '@testing-library/react'
import { expect, test } from 'vite-plus/test'
import { Spinner } from '../../index'

test('keeps a single status message and forwards styling to the decorative SVG', () => {
  render(
    <output>
      <Spinner data-testid="icon" className="size-8 text-info" />
      正在完成登入…
    </output>,
  )
  const graphic = screen.getByTestId('icon')
  expect(screen.getByRole('status')).toHaveTextContent('正在完成登入…')
  expect(graphic).toHaveAttribute('aria-hidden', 'true')
  expect(graphic).toHaveAttribute('focusable', 'false')
  expect(graphic).toHaveClass('size-8', 'text-info')
  expect(graphic).not.toHaveClass('size-5')
})
