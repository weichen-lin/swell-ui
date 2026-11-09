import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Cloud, Globe, Server } from 'lucide-react'
import { createRef, useState } from 'react'
import { expect, test } from 'vite-plus/test'
import { Select, type SelectGroup, type SelectOption } from './select'

const control = (el: HTMLElement) => el.closest('[data-slot="input-control"]') as HTMLElement
// The trigger's leading icon is the control's direct aria-hidden span before the chevron
const leadingIcon = (select: HTMLElement) =>
  control(select).querySelector(':scope > span[aria-hidden="true"]:not(:last-child)')

const clusters: SelectOption[] = [
  { value: 'prod-tw', label: 'prod-tw' },
  { value: 'stg-1', label: 'stg-1' },
  { value: 'dev-1', label: 'dev-1' },
]

const regions: SelectOption[] = [
  { value: 'tw', label: 'Taiwan', icon: <Globe data-testid="icon-tw" /> },
  { value: 'jp', label: 'Japan', icon: <Cloud data-testid="icon-jp" /> },
  { value: 'us', label: 'US East' },
]

test('label above is a real label naming a combobox', () => {
  render(<Select label="Cluster" options={clusters} />)
  const select = screen.getByRole('combobox', { name: 'Cluster' })
  expect(select.tagName).toBe('SELECT')
  const label = screen.getByText('Cluster')
  expect(label.tagName).toBe('LABEL')
  expect(control(select).contains(label)).toBe(false)
})

test('aria-label alone names the select when there is no visible label', () => {
  render(<Select aria-label="Cluster filter" options={clusters} />)
  const select = screen.getByRole('combobox', { name: 'Cluster filter' })
  expect(select.closest('[data-slot="input-field"]')?.querySelector('label')).toBeNull()
})

test('helper text describes the select; error replaces it and sets aria-invalid', () => {
  const { rerender } = render(
    <Select label="Namespace" options={clusters} helperText="Where the app is deployed" />,
  )
  const select = screen.getByRole('combobox', { name: 'Namespace' })
  expect(select).toHaveAccessibleDescription('Where the app is deployed')
  expect(select).not.toHaveAttribute('aria-invalid')

  rerender(
    <Select
      label="Namespace"
      options={clusters}
      helperText="Where the app is deployed"
      error="Namespace is locked"
    />,
  )
  expect(select).toHaveAttribute('aria-invalid', 'true')
  expect(select).toHaveAccessibleDescription('Namespace is locked')
  expect(control(select)).toHaveClass('[--field-border:var(--color-danger)]')
})

test('placeholder option: unselectable, hidden, and selected while nothing is chosen', () => {
  render(<Select label="Cluster" options={clusters} placeholder="Choose a cluster" />)
  const select = screen.getByRole('combobox', { name: 'Cluster' }) as HTMLSelectElement
  // Not the first enabled option, which the browser would otherwise preselect
  expect(select).toHaveValue('')
  const placeholder = select.options[0]
  expect(placeholder).toHaveTextContent('Choose a cluster')
  expect(placeholder).toBeDisabled()
  expect(placeholder).toHaveAttribute('hidden')
  expect(placeholder.selected).toBe(true)
  expect(select).toHaveClass('[&:has(option[value=""]:checked)]:text-input-placeholder')
})

test('floating ignores the placeholder text; the label rests inside the control', () => {
  render(<Select label="Cluster" floating options={clusters} placeholder="Choose a cluster" />)
  const select = screen.getByRole('combobox', { name: 'Cluster' }) as HTMLSelectElement
  expect(select.options[0]).toHaveTextContent('')
  expect(screen.queryByText('Choose a cluster')).toBeNull()
  expect(control(select).contains(screen.getByText('Cluster', { selector: 'label' }))).toBe(true)
  expect(control(select).querySelectorAll('fieldset')).toHaveLength(2)
})

test('required: native valueMissing until something is chosen', async () => {
  render(<Select label="Cluster" options={clusters} required />)
  const select = screen.getByRole('combobox', { name: 'Cluster' }) as HTMLSelectElement
  expect(select).toBeRequired()
  expect(select.checkValidity()).toBe(false)
  expect(select.validity.valueMissing).toBe(true)
  expect(screen.getByText('*', { selector: 'label > span' })).toHaveAttribute('aria-hidden', 'true')

  await userEvent.selectOptions(select, 'stg-1')
  expect(select.checkValidity()).toBe(true)
})

test('groups render as optgroups; option text equals the label', () => {
  const groups: SelectGroup[] = [
    { label: 'Production', options: [{ value: 'prod-tw', label: 'prod-tw' }] },
    {
      label: 'Staging',
      options: [{ value: 'stg-1', label: 'stg-1', icon: <Server /> }],
    },
  ]
  render(<Select label="Cluster" options={groups} />)
  const optgroups = screen.getByRole('combobox').querySelectorAll('optgroup')
  expect([...optgroups].map((g) => g.label)).toEqual(['Production', 'Staging'])
  const stg = screen.getByRole('option', { name: 'stg-1' }) as HTMLOptionElement
  expect(stg.parentElement).toBe(optgroups[1])
  // Icons add no text, so typeahead and the accessible name stay the label
  expect(stg.text).toBe('stg-1')
  expect(stg.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
})

test('disabled options are native disabled and cannot be chosen', async () => {
  render(
    <Select
      label="Cluster"
      options={[...clusters, { value: 'prod-us', label: 'prod-us', disabled: true }]}
    />,
  )
  const option = screen.getByRole('option', { name: 'prod-us' })
  expect(option).toBeDisabled()
  const select = screen.getByRole('combobox') as HTMLSelectElement
  await userEvent.selectOptions(select, 'prod-us').catch(() => {})
  expect(select).toHaveValue('')
})

test('the selected option icon shows on the trigger and follows uncontrolled changes', async () => {
  render(<Select label="Region" options={regions} />)
  const select = screen.getByRole('combobox', { name: 'Region' })
  expect(leadingIcon(select)).toBeNull()
  expect(control(select)).not.toHaveAttribute('data-start')

  await userEvent.selectOptions(select, 'tw')
  expect(leadingIcon(select)?.querySelector('[data-testid="icon-tw"]')).not.toBeNull()
  expect(leadingIcon(select)).toHaveAttribute('aria-hidden', 'true')
  expect(control(select)).toHaveAttribute('data-start')
  expect(select).toHaveClass('ps-[34px]')

  await userEvent.selectOptions(select, 'jp')
  expect(leadingIcon(select)?.querySelector('[data-testid="icon-jp"]')).not.toBeNull()

  // No icon on the option and no start: nothing on the trigger
  await userEvent.selectOptions(select, 'us')
  expect(leadingIcon(select)).toBeNull()
  expect(select).toHaveClass('px-3')
})

test('controlled value drives the trigger icon', async () => {
  function Controlled() {
    const [value, setValue] = useState('tw')
    return (
      <>
        <Select
          label="Region"
          options={regions}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <button type="button" onClick={() => setValue('jp')}>
          Pick Japan
        </button>
      </>
    )
  }
  render(<Controlled />)
  const select = screen.getByRole('combobox', { name: 'Region' })
  expect(select).toHaveValue('tw')
  expect(leadingIcon(select)?.querySelector('[data-testid="icon-tw"]')).not.toBeNull()

  await userEvent.click(screen.getByRole('button', { name: 'Pick Japan' }))
  expect(select).toHaveValue('jp')
  expect(leadingIcon(select)?.querySelector('[data-testid="icon-jp"]')).not.toBeNull()

  await userEvent.selectOptions(select, 'tw')
  expect(leadingIcon(select)?.querySelector('[data-testid="icon-tw"]')).not.toBeNull()
})

test('form.reset() restores the initial choice and its icon', async () => {
  render(
    <form data-testid="form">
      <Select label="Region" name="region" options={regions} defaultValue="tw" />
    </form>,
  )
  const select = screen.getByRole('combobox', { name: 'Region' })
  await userEvent.selectOptions(select, 'jp')
  expect(leadingIcon(select)?.querySelector('[data-testid="icon-jp"]')).not.toBeNull()

  ;(screen.getByTestId('form') as HTMLFormElement).reset()
  expect(select).toHaveValue('tw')
  await waitFor(() =>
    expect(leadingIcon(select)?.querySelector('[data-testid="icon-tw"]')).not.toBeNull(),
  )
})

test('form.reset() without a default returns to the placeholder, not the first option', async () => {
  render(
    <form data-testid="form">
      <Select label="Region" options={regions} />
    </form>,
  )
  const select = screen.getByRole('combobox', { name: 'Region' })
  await userEvent.selectOptions(select, 'tw')
  ;(screen.getByTestId('form') as HTMLFormElement).reset()
  expect(select).toHaveValue('')
  await waitFor(() => expect(leadingIcon(select)).toBeNull())
})

test('start shows while the selected option has no icon of its own', async () => {
  render(<Select label="Region" options={regions} start={<Server data-testid="start" />} />)
  const select = screen.getByRole('combobox', { name: 'Region' })
  // Nothing chosen yet
  expect(leadingIcon(select)?.querySelector('[data-testid="start"]')).not.toBeNull()
  expect(control(select)).toHaveAttribute('data-start')

  await userEvent.selectOptions(select, 'tw')
  expect(leadingIcon(select)?.querySelector('[data-testid="icon-tw"]')).not.toBeNull()
  expect(screen.queryByTestId('start')).toBeNull()

  await userEvent.selectOptions(select, 'us')
  expect(leadingIcon(select)?.querySelector('[data-testid="start"]')).not.toBeNull()
})

test('chevron is decorative and the select fills the control', () => {
  render(<Select label="Cluster" options={clusters} />)
  const select = screen.getByRole('combobox', { name: 'Cluster' })
  const chevron = control(select).lastElementChild as HTMLElement
  expect(chevron).toHaveAttribute('aria-hidden', 'true')
  expect(chevron).toHaveClass('pointer-events-none', 'absolute')
  expect(select).toHaveClass('size-full', 'appearance-none', 'pe-[34px]')
})

test.each([
  ['sm', 'h-[34px]', 'text-sm'],
  ['md', 'h-[38px]', 'text-sm'],
  ['lg', 'h-[42px]', 'text-base'],
] as const)('size %s matches the Input heights', (size, height, text) => {
  render(<Select label="Cluster" options={clusters} size={size} />)
  const select = screen.getByRole('combobox', { name: 'Cluster' })
  expect(control(select)).toHaveClass(height)
  expect(select).toHaveClass(text)
})

test('disabled is native and dimmed; mono reaches select and options', () => {
  render(<Select label="Cluster" options={clusters} disabled mono />)
  const select = screen.getByRole('combobox', { name: 'Cluster' })
  expect(select).toBeDisabled()
  expect(select.closest('[data-slot="input-field"]')).toHaveClass('opacity-50')
  expect(select).toHaveClass('font-mono')
  expect(screen.getByRole('option', { name: 'prod-tw' })).toHaveClass('font-mono')
})

test('native props, onChange and ref reach the select; className goes to the wrapper', async () => {
  const ref = createRef<HTMLSelectElement>()
  const changes: string[] = []
  render(
    <Select
      ref={ref}
      label="Cluster"
      name="cluster"
      options={clusters}
      className="w-80"
      selectClassName="tracking-wide"
      onChange={(e) => changes.push(e.currentTarget.value)}
    />,
  )
  const select = screen.getByRole('combobox', { name: 'Cluster' })
  expect(ref.current).toBe(select)
  expect(select).toHaveAttribute('name', 'cluster')
  expect(select).toHaveClass('tracking-wide')
  expect(select.closest('[data-slot="input-field"]')).toHaveClass('w-80')
  await userEvent.selectOptions(select, 'dev-1')
  expect(changes).toEqual(['dev-1'])
})

// Type-level API rules: each line must fail to compile, or the directive itself errors
test('Select rejects readOnly, multiple and end, and requires a name', () => {
  // @ts-expect-error a native select can't be read-only
  render(<Select label="Cluster" options={clusters} readOnly />)
  // @ts-expect-error single choice only
  render(<Select label="Cluster" options={clusters} multiple />)
  // @ts-expect-error the end slot belongs to the chevron
  render(<Select label="Cluster" options={clusters} end="x" />)
  // @ts-expect-error label or aria-label is required
  render(<Select options={clusters} />)
  // @ts-expect-error floating needs a visible label
  render(<Select aria-label="Cluster" floating options={clusters} />)
})
