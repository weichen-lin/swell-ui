import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ReactNode, StrictMode, useState } from 'react'
import { expect, test, vi } from 'vite-plus/test'
import { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './radio-group'

function Options() {
  return (
    <>
      <Radio value="rolling" label="Rolling update" description="Replace pods gradually." />
      <Radio value="blue-green" label="Blue / green" />
      <Radio value="recreate" label="Recreate" disabled />
    </>
  )
}

test('names the group and its native radios separately, and forwards both refs', () => {
  const groupRef = createRef<HTMLFieldSetElement>()
  const inputRef = createRef<HTMLInputElement>()
  render(
    <RadioGroup name="strategy" legend="Strategy" ref={groupRef} required description="Choose one.">
      <Radio
        value="rolling"
        label="Rolling update"
        description="Replace pods gradually."
        ref={inputRef}
      />
    </RadioGroup>,
  )
  const group = screen.getByRole('radiogroup', { name: 'Strategy' })
  const input = screen.getByRole('radio', { name: 'Rolling update' })
  expect(groupRef.current).toBe(group)
  expect(inputRef.current).toBe(input)
  expect(group.tagName).toBe('FIELDSET')
  expect(group.querySelector('legend')).toHaveTextContent('Strategy *')
  expect(input).toHaveAttribute('type', 'radio')
  expect(input).toHaveAttribute('name', 'strategy')
  expect(input).toHaveAttribute('required')
  expect(input).toHaveAccessibleDescription('Choose one. Replace pods gradually.')
  expect(group).toHaveAttribute('aria-required', 'true')
})

test('no implicit default; selecting the full label submits one value and calls back once', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const { container } = render(
    <form>
      <RadioGroup name="strategy" legend="Strategy" onValueChange={change}>
        <Options />
      </RadioGroup>
    </form>,
  )
  const form = container.querySelector('form')!
  expect(new FormData(form).has('strategy')).toBe(false)
  await user.click(screen.getByText('Replace pods gradually.'))
  expect(new FormData(form).getAll('strategy')).toEqual(['rolling'])
  await user.click(screen.getByRole('radio', { name: 'Rolling update' }))
  expect(change).toHaveBeenCalledTimes(1)
  expect(change.mock.calls[0][0]).toBe('rolling')
  expect(change.mock.calls[0][1].target).toBe(screen.getByRole('radio', { name: 'Rolling update' }))
  await user.click(screen.getByText('Blue / green'))
  expect(new FormData(form).getAll('strategy')).toEqual(['blue-green'])
  expect(screen.getByRole('radio', { name: 'Rolling update' })).not.toBeChecked()
})

test('controlled values remain authoritative and null clears selection', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const { rerender } = render(
    <RadioGroup name="strategy" legend="Strategy" value="rolling" onValueChange={change}>
      <Options />
    </RadioGroup>,
  )
  await user.click(screen.getByRole('radio', { name: 'Blue / green' }))
  expect(change.mock.calls[0][0]).toBe('blue-green')
  expect(screen.getByRole('radio', { name: 'Rolling update' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Blue / green' })).not.toBeChecked()
  rerender(
    <RadioGroup name="strategy" legend="Strategy" value="blue-green">
      <Options />
    </RadioGroup>,
  )
  expect(screen.getByRole('radio', { name: 'Blue / green' })).toBeChecked()
  rerender(
    <RadioGroup name="strategy" legend="Strategy" value={null}>
      <Options />
    </RadioGroup>,
  )
  expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(
    true,
  )
})

test('keyboard enters the selected radio, skips disabled options and leaves the group', async () => {
  const user = userEvent.setup()
  render(
    <>
      <RadioGroup name="strategy" legend="Strategy" defaultValue="rolling">
        <Options />
      </RadioGroup>
      <button>Next field</button>
    </>,
  )
  await user.tab()
  expect(screen.getByRole('radio', { name: 'Rolling update' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('radio', { name: 'Blue / green' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Blue / green' })).toHaveFocus()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('radio', { name: 'Rolling update' })).toBeChecked()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus()
})

test('disabled group and item resist interaction and are omitted from form data', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const { container, rerender } = render(
    <form>
      <RadioGroup
        name="strategy"
        legend="Strategy"
        defaultValue="rolling"
        disabled
        onValueChange={change}
      >
        <Options />
      </RadioGroup>
    </form>,
  )
  expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLInputElement).disabled)).toBe(
    true,
  )
  await user.click(screen.getByText('Blue / green'))
  expect(change).not.toHaveBeenCalled()
  expect([...new FormData(container.querySelector('form')!)]).toEqual([])
  rerender(
    <form>
      <RadioGroup name="strategy" legend="Strategy" defaultValue="rolling" onValueChange={change}>
        <Options />
      </RadioGroup>
    </form>,
  )
  await user.click(screen.getByText('Recreate'))
  expect(change).not.toHaveBeenCalled()
  expect(screen.getByRole('radio', { name: 'Rolling update' })).toBeChecked()
})

test('native required validates at least one selection without a custom submit handler', async () => {
  const user = userEvent.setup()
  const { container } = render(
    <form>
      <RadioGroup name="strategy" legend="Strategy" required>
        <Options />
      </RadioGroup>
    </form>,
  )
  expect(container.querySelector('form')!.checkValidity()).toBe(false)
  await user.click(screen.getByText('Blue / green'))
  expect(container.querySelector('form')!.checkValidity()).toBe(true)
})

test('error is marked on the radiogroup and described once without changing selection', () => {
  const { rerender } = render(
    <>
      <p id="external">External note.</p>
      <RadioGroup
        name="strategy"
        legend="Strategy"
        defaultValue="rolling"
        description="Choose one."
        error="Not allowed."
        aria-describedby="external"
      >
        <Options />
      </RadioGroup>
    </>,
  )
  const group = screen.getByRole('radiogroup', { name: 'Strategy' })
  const radio = screen.getByRole('radio', { name: 'Rolling update' })
  expect(group).toHaveAttribute('aria-invalid', 'true')
  expect(group).toHaveAccessibleDescription('External note. Choose one. Not allowed.')
  expect(radio).toHaveAccessibleDescription(
    'External note. Choose one. Not allowed. Replace pods gradually.',
  )
  expect(radio).not.toHaveAttribute('aria-invalid')
  expect(radio).toBeChecked()
  expect(screen.getAllByText('Not allowed.')).toHaveLength(1)
  rerender(
    <RadioGroup name="strategy" legend="Strategy" error>
      <Options />
    </RadioGroup>,
  )
  expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-describedby')
})

test.each(['default', 'card'] as const)(
  '%s variant uses the same native selection and aria-only labels',
  async (variant) => {
    const user = userEvent.setup()
    render(
      <RadioGroup name="strategy" legend="Strategy" variant={variant} orientation="horizontal">
        <Radio value="rolling" aria-label="Rolling update" />
        <Radio value="blue-green" label="Blue / green" />
      </RadioGroup>,
    )
    await user.click(screen.getByRole('radio', { name: 'Rolling update' }))
    await user.click(screen.getByText('Blue / green'))
    expect(screen.getByRole('radio', { name: 'Blue / green' })).toBeChecked()
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-variant', variant)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal')
  },
)

test('native reset restores the initial selection without firing a change callback', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  render(
    <form>
      <RadioGroup name="strategy" legend="Strategy" defaultValue="rolling" onValueChange={change}>
        <Options />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>,
  )
  await user.click(screen.getByText('Blue / green'))
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Rolling update' })).toBeChecked())
  expect(screen.getByRole('radio', { name: 'Blue / green' })).not.toBeChecked()
  expect(change).toHaveBeenCalledTimes(1)
})

test('reset respects preventDefault and supports an initially empty group', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <form onReset={(event) => event.preventDefault()}>
      <RadioGroup name="strategy" legend="Strategy">
        <Options />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>,
  )
  await user.click(screen.getByText('Blue / green'))
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  expect(screen.getByRole('radio', { name: 'Blue / green' })).toBeChecked()
  rerender(
    <form>
      <RadioGroup name="strategy" legend="Strategy">
        <Options />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>,
  )
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Blue / green' })).not.toBeChecked())
})

test('external forms receive values and reset even when the group is outside', async () => {
  const user = userEvent.setup()
  const { container } = render(
    <>
      <form id="owner">
        <button type="reset">Reset</button>
      </form>
      <RadioGroup name="strategy" legend="Strategy" form="owner" defaultValue="rolling">
        <Options />
      </RadioGroup>
    </>,
  )
  const form = container.querySelector('form')!
  await user.click(screen.getByText('Blue / green'))
  expect(new FormData(form).get('strategy')).toBe('blue-green')
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(new FormData(form).get('strategy')).toBe('rolling'))
})

test('controlled reset follows the owner value, including a parent onReset update', async () => {
  const user = userEvent.setup()
  function Demo() {
    const [value, setValue] = useState<string | null>('blue-green')
    return (
      <form onReset={() => setValue(null)}>
        <RadioGroup name="strategy" legend="Strategy" value={value} onValueChange={setValue}>
          <Options />
        </RadioGroup>
        <button type="reset">Reset</button>
      </form>
    )
  }
  render(<Demo />)
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Blue / green' })).not.toBeChecked())
  await user.click(screen.getByText('Rolling update'))
  expect(screen.getByRole('radio', { name: 'Rolling update' })).toBeChecked()
})

test('removing the selected option clears it; restoring it does not resurrect selection', async () => {
  const { rerender } = render(
    <StrictMode>
      <RadioGroup name="strategy" legend="Strategy" defaultValue="blue-green">
        <Options />
      </RadioGroup>
    </StrictMode>,
  )
  expect(screen.getByRole('radio', { name: 'Blue / green' })).toBeChecked()
  await act(async () => {
    rerender(
      <StrictMode>
        <RadioGroup name="strategy" legend="Strategy" defaultValue="blue-green">
          <Radio value="rolling" label="Rolling update" />
        </RadioGroup>
      </StrictMode>,
    )
  })
  rerender(
    <StrictMode>
      <RadioGroup name="strategy" legend="Strategy" defaultValue="blue-green">
        <Options />
      </RadioGroup>
    </StrictMode>,
  )
  expect(screen.getByRole('radio', { name: 'Blue / green' })).not.toBeChecked()
})

test('independent groups and non-control focus targets keep native behavior', async () => {
  const user = userEvent.setup()
  render(
    <>
      <RadioGroup name="first" legend="First" defaultValue="rolling">
        <Options />
      </RadioGroup>
      <RadioGroup name="second" legend="Second">
        <Options />
      </RadioGroup>
    </>,
  )
  await user.click(
    within(screen.getByRole('radiogroup', { name: 'Second' })).getByText('Blue / green'),
  )
  expect(
    within(screen.getByRole('radiogroup', { name: 'First' })).getByRole('radio', {
      name: 'Rolling update',
    }),
  ).toBeChecked()
})

test('unmount cancels a pending reset', async () => {
  const { unmount, container } = render(
    <form>
      <RadioGroup name="strategy" legend="Strategy">
        <Options />
      </RadioGroup>
    </form>,
  )
  fireEvent.reset(container.querySelector('form')!)
  unmount()
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1))
  })
})

test('invalid composition and duplicate or empty values fail clearly', () => {
  expect(() => render(<Radio value="rolling" label="Rolling update" />)).toThrow(
    'inside <RadioGroup>',
  )
  expect(() =>
    render(
      <RadioGroup name="strategy" legend="Strategy">
        <Radio value="" label="Empty" />
      </RadioGroup>,
    ),
  ).toThrow('non-empty')
  expect(() =>
    render(
      <RadioGroup name="strategy" legend="Strategy">
        <Radio value="a" label="First" />
        <Radio value="a" label="Second" />
      </RadioGroup>,
    ),
  ).toThrow('unique')
})

const invalidGroups: RadioGroupProps[] = [
  // @ts-expect-error controlled and default values are mutually exclusive
  { name: 'strategy', legend: 'Strategy', children: null, value: 'a', defaultValue: 'a' },
  // @ts-expect-error native grouping requires a name
  { legend: 'Strategy', children: null },
]
const invalidRadios: RadioProps[] = [
  // @ts-expect-error accessible name required
  { value: 'a' },
  // @ts-expect-error selection is owned by RadioGroup
  { value: 'a', label: 'A', checked: true },
  // @ts-expect-error radios have no native readonly state
  { value: 'a', label: 'A', readOnly: true },
]
void invalidGroups
void invalidRadios

test.each([false, null])('errorIcon replaces the error message icon, and %s hides it', (hidden) => {
  const ui = (errorIcon: ReactNode) => (
    <RadioGroup name="strategy" legend="Strategy" error="Pick one" errorIcon={errorIcon}>
      <Radio value="rolling" label="Rolling update" />
    </RadioGroup>
  )
  const { rerender } = render(ui(<svg data-testid="custom" />))
  expect(screen.getByText('Pick one').parentElement).toContainElement(screen.getByTestId('custom'))
  expect(document.querySelector('[data-icon="circle-alert"]')).toBeNull()
  rerender(ui(hidden))
  expect(screen.getByText('Pick one').parentElement!.querySelector('svg')).toBeNull()
})
