import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, it, test, vi } from 'vite-plus/test'
import { type Theme, ThemeSwitcher, useTheme } from '.'
afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
})

function Controlled({
  initial = 'system',
  onChange,
}: {
  initial?: Theme
  onChange?: (value: Theme) => void
}) {
  const [value, setValue] = useState<Theme>(initial)
  return (
    <ThemeSwitcher
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

test('one click switches immediately between light and dark', async () => {
  const onChange = vi.fn()
  render(<Controlled initial="light" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
  expect(onChange).toHaveBeenLastCalledWith('dark')
  await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
  expect(onChange.mock.calls.map(([value]) => value)).toEqual(['dark', 'light'])
})

test.each([true, false])(
  'the first click reverses the visible system theme (dark: %s)',
  async (dark) => {
    vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: dark }))
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    await userEvent.click(
      screen.getByRole('button', {
        name: dark ? 'Switch to light theme' : 'Switch to dark theme',
      }),
    )
    expect(onChange).toHaveBeenCalledExactlyOnceWith(dark ? 'light' : 'dark')
  },
)

test('the action follows a system theme change until a choice is made', () => {
  const query = Object.assign(new EventTarget(), { matches: false })
  vi.stubGlobal('matchMedia', () => query)
  const { rerender } = render(<ThemeSwitcher value="system" onChange={() => {}} />)
  expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  act(() => {
    query.matches = true
    query.dispatchEvent(new Event('change'))
  })
  expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  rerender(<ThemeSwitcher value="light" onChange={() => {}} />)
  expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
})

test('Enter and Space each switch the theme while retaining focus', async () => {
  const user = userEvent.setup()
  render(<Controlled initial="light" />)
  await user.tab()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('button', { name: 'Switch to light theme' })).toHaveFocus()
  await user.keyboard(' ')
  expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toHaveFocus()
})

test('a disabled toggle does not change the theme', async () => {
  const onChange = vi.fn()
  render(<ThemeSwitcher value="light" disabled onChange={onChange} />)
  const button = screen.getByRole('button', { name: 'Switch to dark theme' })
  expect(button).toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(button)
  expect(onChange).not.toHaveBeenCalled()
})

test('useTheme writes the choice to localStorage and the root dataset', () => {
  const { result } = renderHook(() => useTheme())
  expect(result.current.theme).toBe('system')
  expect(localStorage.getItem('swell-ui-theme')).toBe('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()

  act(() => result.current.setTheme('dark'))
  expect(localStorage.getItem('swell-ui-theme')).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')

  act(() => result.current.setTheme('system'))
  expect(localStorage.getItem('swell-ui-theme')).toBe('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()
})

test('useTheme reads and writes a custom storageKey only', () => {
  localStorage.setItem('my-app-theme', 'dark')
  const { result } = renderHook(() => useTheme({ storageKey: 'my-app-theme' }))
  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')

  act(() => result.current.setTheme('light'))
  expect(localStorage.getItem('my-app-theme')).toBe('light')
  expect(localStorage.getItem('swell-ui-theme')).toBeNull()
})

it.each(['light', 'dark', 'system', 'invalid', null])(
  'applies the saved theme on mount: %s',
  (saved) => {
    if (saved !== null) localStorage.setItem('swell-ui-theme', saved)
    localStorage.setItem('theme', saved === 'dark' ? 'light' : 'dark')
    const { result } = renderHook(() => useTheme())
    const expected = saved === 'light' || saved === 'dark' ? saved : undefined
    expect(result.current.theme).toBe(expected ?? 'system')
    expect(document.documentElement.dataset.theme).toBe(expected)
  },
)

it('uses the system theme when storage is unavailable', () => {
  const denied = () => {
    throw new Error('Storage denied')
  }
  vi.stubGlobal('localStorage', { getItem: denied, setItem: denied, clear: () => {} })
  const { result } = renderHook(() => useTheme())
  expect(result.current.theme).toBe('system')
  expect(document.documentElement.dataset.theme).toBeUndefined()
})

test('lightIcon shows while dark and darkIcon while light', () => {
  const icons = {
    lightIcon: <svg data-testid="light" />,
    darkIcon: <svg data-testid="dark" />,
  }
  const { rerender } = render(<ThemeSwitcher value="dark" onChange={vi.fn()} {...icons} />)
  expect(screen.getByTestId('light')).toBeInTheDocument()
  expect(screen.queryByTestId('dark')).toBeNull()
  expect(document.querySelector('[data-icon="sun"]')).toBeNull()
  rerender(<ThemeSwitcher value="light" onChange={vi.fn()} {...icons} />)
  expect(screen.getByTestId('dark')).toBeInTheDocument()
  expect(document.querySelector('[data-icon="moon"]')).toBeNull()
})

test.each([false, null])('lightIcon={%s} and darkIcon={%s} keep the sun and moon', (hidden) => {
  const { rerender } = render(
    <ThemeSwitcher value="dark" onChange={vi.fn()} lightIcon={hidden} darkIcon={hidden} />,
  )
  expect(document.querySelector('[data-icon="sun"]')).not.toBeNull()
  rerender(<ThemeSwitcher value="light" onChange={vi.fn()} lightIcon={hidden} darkIcon={hidden} />)
  expect(document.querySelector('[data-icon="moon"]')).not.toBeNull()
})
