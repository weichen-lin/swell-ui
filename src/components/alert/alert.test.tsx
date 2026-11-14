import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vite-plus/test'
import { Button } from '../button'
import { Alert } from './alert'

test('a persistent alert has no dismiss control and does not announce on its own', () => {
  render(<Alert tone="danger">Showing data from the last sync.</Alert>)

  expect(screen.getByText('Showing data from the last sync.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Dismiss alert' })).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('retry and dismiss can coexist and invoke their own callbacks', async () => {
  const user = userEvent.setup()
  const retry = vi.fn()
  const dismiss = vi.fn()
  render(
    <Alert
      title="Sync failed"
      action={<Button onClick={retry}>Retry</Button>}
      dismissLabel="關閉提示"
      onDismiss={dismiss}
    />,
  )

  await user.tab()
  expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(retry).toHaveBeenCalledTimes(1)
  expect(dismiss).not.toHaveBeenCalled()

  await user.tab()
  expect(screen.getByRole('button', { name: '關閉提示' })).toHaveFocus()
  await user.keyboard(' ')
  expect(dismiss).toHaveBeenCalledTimes(1)
  expect(retry).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Sync failed')).toBeInTheDocument()
})
