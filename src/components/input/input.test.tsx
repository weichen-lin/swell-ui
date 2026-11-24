import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { expect, test } from 'vite-plus/test'
import { InfoIcon } from '../../icons'
import { Input } from './input'

const control = (input: HTMLElement) => input.closest('[data-slot="input-control"]') as HTMLElement

test('label above is a real label linked to the input', () => {
  render(<Input label="Image tag" />)
  const input = screen.getByLabelText('Image tag')
  expect(input.tagName).toBe('INPUT')
  expect(input).toHaveAttribute('type', 'text')
  const label = screen.getByText('Image tag')
  expect(label.tagName).toBe('LABEL')
  // Above the field: outside the bordered control
  expect(control(input).contains(label)).toBe(false)
})

test('floating label is inside the control and keeps a placeholder for :placeholder-shown', () => {
  const { rerender } = render(<Input label="Namespace" floating />)
  const input = screen.getByLabelText('Namespace')
  expect(control(input).contains(screen.getByText('Namespace', { selector: 'label' }))).toBe(true)
  expect(input).toHaveAttribute('placeholder', ' ')

  rerender(<Input label="Namespace" floating placeholder="payments" />)
  expect(input).toHaveAttribute('placeholder', 'payments')
  expect(input).toHaveClass('placeholder:opacity-0')
})

test('floating: notched outline legends repeat the label but stay out of the accessible name', () => {
  render(<Input label="Namespace" floating required />)
  // One labelled control; the legends' copies (incl. the asterisk) never join the name
  expect(screen.getAllByLabelText(/Namespace/)).toHaveLength(1)
  const input = screen.getByRole('textbox', { name: 'Namespace' })
  const fieldsets = control(input).querySelectorAll('fieldset')
  // Border ring + halo ring, each cutting the same gap
  expect(fieldsets).toHaveLength(2)
  for (const fieldset of fieldsets) {
    expect(fieldset).toHaveAttribute('aria-hidden', 'true')
    expect(fieldset.querySelector('legend')).toHaveTextContent('Namespace *')
  }
  expect(control(input)).toHaveClass('border-transparent', 'bg-transparent')
})

test('label above draws its own border and has no notch', () => {
  render(<Input label="Namespace" />)
  const input = screen.getByLabelText('Namespace')
  expect(control(input).querySelector('fieldset')).toBeNull()
  expect(control(input)).toHaveClass('border-(--field-border)')
})

test('start adornment marks the control so the floating label stays floated', () => {
  render(<Input label="Host" floating start="https://" />)
  expect(control(screen.getByLabelText('Host'))).toHaveAttribute('data-start')
})

test('helper text describes the input; error replaces it and sets aria-invalid', () => {
  const { rerender } = render(
    <>
      <span id="external">External note</span>
      <Input label="Replicas" helperText="Between 1 and 10" aria-describedby="external" />
    </>,
  )
  const input = screen.getByLabelText('Replicas')
  expect(input).toHaveAccessibleDescription('External note Between 1 and 10')
  expect(input).not.toHaveAttribute('aria-invalid')

  rerender(
    <>
      <span id="external">External note</span>
      <Input
        label="Replicas"
        helperText="Between 1 and 10"
        error="Must be at most 10"
        aria-describedby="external"
      />
    </>,
  )
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('External note Must be at most 10')
  expect(screen.queryByText('Between 1 and 10')).toBeNull()
  const errorText = screen.getByText('Must be at most 10').parentElement as HTMLElement
  expect(errorText).toHaveClass('text-danger')
  expect(errorText.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(control(input)).toHaveClass(
    '[--field-border:var(--color-danger)]',
    'border-(--field-border)',
  )
})

test('error={true} marks invalid without an empty description', () => {
  render(<Input label="Replicas" error />)
  const input = screen.getByLabelText('Replicas')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).not.toHaveAttribute('aria-describedby')
})

test.each([false, true])(
  'required: native required and aria-hidden asterisk (floating=%s)',
  (floating) => {
    render(<Input label="Application name" required floating={floating} />)
    const input = screen.getByRole('textbox', { name: 'Application name' })
    expect(input).toBeRequired()
    const star = screen.getByText('*', { selector: 'label > span' })
    expect(star).toHaveAttribute('aria-hidden', 'true')
  },
)

test.each([
  ['sm', 'h-control-sm', 'text-sm'],
  ['md', 'h-control-md', 'text-sm'],
  ['lg', 'h-control-lg', 'text-base'],
] as const)('size %s sets field height and text size', (size, height, text) => {
  render(<Input label="Tag" size={size} />)
  const input = screen.getByLabelText('Tag')
  expect(control(input)).toHaveClass(height)
  expect(input).toHaveClass(text, 'pointer-coarse:text-base')
})

test('adornments: icons are aria-hidden, text stays readable, clicks focus the input', async () => {
  render(<Input label="Service" start={<InfoIcon data-testid="icon" />} end=".svc.cluster.local" />)
  const input = screen.getByLabelText('Service')
  const icon = screen.getByTestId('icon')
  expect(icon.closest('[aria-hidden="true"]')).not.toBeNull()
  const suffix = screen.getByText('.svc.cluster.local')
  expect(suffix.closest('[aria-hidden="true"]')).toBeNull()

  await userEvent.click(icon)
  expect(input).toHaveFocus()
  input.blur()
  await userEvent.click(suffix)
  expect(input).toHaveFocus()
})

test('adornments: 0 is content and renders; empty values render nothing', () => {
  render(<Input label="Replicas" start={0} end={0} />)
  expect(screen.getAllByText('0')).toHaveLength(2)
  expect(control(screen.getByLabelText('Replicas'))).toHaveAttribute('data-start')

  render(<Input label="Name" start="" end={false} />)
  const plain = control(screen.getByLabelText('Name'))
  expect(plain).not.toHaveAttribute('data-start')
  // Only the input's own slot: no adornment spans
  expect(plain.children).toHaveLength(1)
})

test('aria-label alone names the field when there is no visible label', () => {
  render(<Input aria-label="Replica count" />)
  const input = screen.getByRole('textbox', { name: 'Replica count' })
  expect(control(input).closest('[data-slot="input-field"]')?.querySelector('label')).toBeNull()
})

test('mono turns off spellcheck and autocorrection', () => {
  render(<Input label="Commit" mono />)
  const input = screen.getByLabelText('Commit')
  expect(input).toHaveClass('font-mono')
  expect(input).toHaveAttribute('spellcheck', 'false')
  expect(input).toHaveAttribute('autocapitalize', 'off')
  expect(input).toHaveAttribute('autocorrect', 'off')
})

test('validating shows a spinner and announces through a separate live region', () => {
  const { rerender, container } = render(<Input label="App name" helperText="Must be unique" />)
  const input = screen.getByLabelText('App name')
  const live = container.querySelector('[aria-live="polite"]') as HTMLElement
  expect(live).toHaveTextContent('')

  rerender(<Input label="App name" helperText="Must be unique" validating />)
  expect(live).toHaveTextContent('Checking…')
  expect(control(input).querySelector('.animate-spin')).toHaveAttribute('aria-hidden', 'true')
  // Not part of the name or description
  expect(input).toHaveAccessibleName('App name')
  expect(input).toHaveAccessibleDescription('Must be unique')

  rerender(<Input label="App name" validating validatingText="Checking availability" />)
  expect(live).toHaveTextContent('Checking availability')
})

test('disabled is native and dimmed; readOnly stays focusable with a calmer style', async () => {
  const { rerender } = render(<Input label="Cluster" defaultValue="prod-eu" disabled />)
  const input = screen.getByLabelText('Cluster')
  expect(input).toBeDisabled()
  expect(input).not.toHaveAttribute('aria-disabled')
  expect(input.closest('[data-slot="input-field"]')).toHaveClass('opacity-50')
  expect(control(input)).toHaveClass('cursor-not-allowed')

  rerender(<Input label="Cluster" defaultValue="prod-eu" readOnly />)
  expect(input).not.toBeDisabled()
  expect(input).toHaveAttribute('readonly')
  expect(control(input)).toHaveClass('[--field-bg:var(--color-bg)]')
  // No hover reveal at all, independent of how the focus selector is spelled
  expect([...control(input).classList].filter((c) => c.startsWith('hover:'))).toEqual([])
  await userEvent.tab()
  expect(input).toHaveFocus()
})

test('native props and ref reach the input; className goes to the wrapper', async () => {
  const ref = createRef<HTMLInputElement>()
  render(<Input ref={ref} label="Email" type="email" name="email" className="w-80" />)
  const input = screen.getByLabelText('Email')
  expect(ref.current).toBe(input)
  expect(input).toHaveAttribute('type', 'email')
  expect(input).toHaveAttribute('name', 'email')
  expect(input.closest('[data-slot="input-field"]')).toHaveClass('w-80')
  await userEvent.type(input, 'ops@example.com')
  expect(input).toHaveValue('ops@example.com')
})

// Type-level API rules: each line must fail to compile, or the directive itself errors
test('Input rejects password, search and number types and requires a name', () => {
  // @ts-expect-error use PasswordInput
  render(<Input label="Secret" type="password" />)
  // @ts-expect-error use SearchInput
  render(<Input label="Find" type="search" />)
  // @ts-expect-error use inputMode="numeric"
  render(<Input label="Count" type="number" />)
  // @ts-expect-error label or aria-label is required
  render(<Input />)
  // @ts-expect-error floating needs a visible label
  render(<Input aria-label="Count" floating />)
})

test.each([false, null])('errorIcon replaces the error message icon, and %s hides it', (hidden) => {
  const { rerender } = render(
    <Input label="Name" error="Required" errorIcon={<svg data-testid="custom" />} />,
  )
  const message = screen.getByText('Required').parentElement!
  expect(message).toContainElement(screen.getByTestId('custom'))
  expect(message.querySelector('[data-icon="circle-alert"]')).toBeNull()
  rerender(<Input label="Name" error="Required" errorIcon={hidden} />)
  expect(screen.getByText('Required').parentElement!.querySelector('svg')).toBeNull()
})

test('validatingIcon replaces the validating spinner and spins it', () => {
  const { container } = render(
    <Input label="Name" validating validatingIcon={<svg data-testid="custom" />} />,
  )
  const spinner = container.querySelector('[data-slot="spinner"]')
  expect(spinner).toContainElement(screen.getByTestId('custom'))
  expect(spinner).toHaveClass('animate-spin')
  expect(container.querySelector('[data-icon="loader-circle"]')).toBeNull()
})

test.each([false, null])('validatingIcon={%s} keeps the default spinner', (hidden) => {
  const { container } = render(<Input label="Name" validating validatingIcon={hidden} />)
  expect(
    container.querySelector('[data-slot="spinner"] [data-icon="loader-circle"]'),
  ).not.toBeNull()
})
