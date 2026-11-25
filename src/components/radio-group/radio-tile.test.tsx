import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, expect, test, vi } from 'vite-plus/test'
import { Radio, RadioGroup, RadioIndicator, RadioTile } from './index'

test('tiles and plain radios share native navigation, external form data and reset', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const { container } = render(
    <>
      <form id="wardrobe">
        <button type="reset">Reset</button>
      </form>
      <RadioGroup
        name="outfit"
        legend="Outfit"
        form="wardrobe"
        required
        defaultValue="fern"
        onValueChange={change}
      >
        <RadioTile value="fern">
          <img src="fern.png" alt="" />
          Fern
          <RadioIndicator />
        </RadioTile>
        <RadioTile value="ash" disabled>
          Ash
        </RadioTile>
        <Radio value="ocean" label="Ocean" />
      </RadioGroup>
    </>,
  )
  const form = container.querySelector('form')!
  const fern = screen.getByRole('radio', { name: 'Fern' })
  const tile = fern.closest('label')!
  const mark = tile.querySelector('[data-slot="radio-indicator"]')!
  expect(fern).toBeRequired()
  expect(tile).toHaveAttribute('data-checked')
  expect(mark).toHaveAttribute('aria-hidden', 'true')
  expect(mark.querySelector('svg')).toBeInTheDocument()
  await user.click(screen.getByText('Fern'))
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('radio', { name: 'Ocean' })).toHaveFocus()
  expect(new FormData(form).getAll('outfit')).toEqual(['ocean'])
  expect(tile).not.toHaveAttribute('data-checked')
  expect(mark).not.toHaveAttribute('data-checked')
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  await waitFor(() => expect(mark).toHaveAttribute('data-checked'))
  expect(new FormData(form).getAll('outfit')).toEqual(['fern'])
  expect(change).toHaveBeenCalledTimes(1)
})

test('controlled tiles expose the owner selection and compose explicit names and decorative content', async () => {
  const user = userEvent.setup()
  const change = vi.fn()
  const ref = createRef<HTMLLabelElement>()
  const view = (value: string | null) => (
    <>
      <span id="ash-name">Ash jacket</span>
      <p id="hint">Lightweight.</p>
      <RadioGroup
        name="outfit"
        legend="Outfit"
        description="Choose one."
        value={value}
        error="Unavailable."
        onValueChange={change}
      >
        <RadioTile
          ref={ref}
          value="fern"
          aria-label="Fern shirt"
          aria-describedby="hint"
          className="rounded-none"
        >
          <img src="fern.png" alt="" />
          <RadioIndicator className="rounded-none">Custom mark</RadioIndicator>
        </RadioTile>
        <RadioTile value="ash" aria-labelledby="ash-name">
          <img src="ash.png" alt="" />
        </RadioTile>
      </RadioGroup>
    </>
  )
  const { rerender } = render(view(null))
  const fern = screen.getByRole('radio', { name: 'Fern shirt' })
  const ash = screen.getByRole('radio', { name: 'Ash jacket' })
  expect(fern).toHaveAccessibleDescription('Lightweight. Choose one. Unavailable.')
  expect(ref.current).toBe(fern.closest('label'))
  expect(ref.current).toHaveClass('rounded-none')
  expect(ref.current).not.toHaveClass('rounded-control')
  expect(ref.current).toHaveAttribute('data-invalid')
  const mark = screen.getByText('Custom mark')
  expect(mark).toHaveClass('rounded-none')
  expect(mark).toHaveAttribute('data-invalid')
  expect(mark.querySelector('svg')).toBeNull()
  expect(ash.closest('label')!.querySelector('[data-slot="radio-indicator"]')).toBeNull()
  await user.click(ref.current!)
  expect(change).toHaveBeenCalledTimes(1)
  expect(change.mock.calls[0][0]).toBe('fern')
  expect(fern).not.toBeChecked()
  expect(mark).not.toHaveAttribute('data-checked')
  rerender(view('fern'))
  expect(fern).toBeChecked()
  expect(mark).toHaveAttribute('data-checked')
})

const proto = Element.prototype as { animate?: unknown }
const originalAnimate = proto.animate
afterEach(() => {
  proto.animate = originalAnimate
  vi.unstubAllGlobals()
})

test('Space and primary pointer presses create ripples; arrow navigation, repeat, cancellation and disability are respected', () => {
  const animate = vi.fn(() => ({ finished: Promise.resolve() }))
  proto.animate = animate
  const view = (disabled = false, outerDisabled = false) => (
    <fieldset disabled={outerDisabled}>
      <RadioGroup name="outfit" legend="Outfit" disabled={disabled}>
        <RadioTile value="fern">
          Fern
          <RadioIndicator />
        </RadioTile>
      </RadioGroup>
    </fieldset>
  )
  const { rerender } = render(view())
  const radio = screen.getByRole('radio', { name: 'Fern' })
  const tile = radio.closest('label')!
  const layer = tile.querySelector('[data-ripple]')!
  const press = () =>
    fireEvent.pointerDown(tile, { button: 0, isPrimary: true, clientX: 12, clientY: 8 })
  for (const key of ['ArrowRight', 'ArrowDown', 'Enter']) fireEvent.keyDown(radio, { key })
  expect(tile).not.toHaveAttribute('data-pressed')
  fireEvent.keyDown(radio, { key: ' ' })
  fireEvent.keyDown(radio, { key: ' ', repeat: true })
  expect(tile).toHaveAttribute('data-pressed')
  expect(layer.children).toHaveLength(1)
  fireEvent.focusOut(radio)
  expect(tile).not.toHaveAttribute('data-pressed')
  expect(layer.children).toHaveLength(0)
  press()
  fireEvent.pointerCancel(tile)
  expect(tile).not.toHaveAttribute('data-pressed')
  expect(layer.children).toHaveLength(0)
  press()
  fireEvent.pointerMove(tile, { isPrimary: true, clientX: -100, clientY: -100 })
  expect(tile).not.toHaveAttribute('data-pressed')
  press()
  rerender(view(true))
  expect(tile).toHaveAttribute('data-disabled')
  expect(tile.querySelector('[data-slot="radio-indicator"]')).toHaveAttribute('data-disabled')
  expect(tile).not.toHaveAttribute('data-pressed')
  expect(layer.children).toHaveLength(0)
  press()
  expect(tile).not.toHaveAttribute('data-pressed')
  rerender(view(false, true))
  press()
  expect(tile).not.toHaveAttribute('data-pressed')
  expect(animate).toHaveBeenCalledTimes(4)
})

test.each([true, false])(
  'reduced motion or ripple opted out keeps static press feedback (ripple=%s)',
  (ripple) => {
    const animate = vi.fn()
    proto.animate = animate
    vi.stubGlobal('matchMedia', () => ({ matches: ripple }))
    render(
      <RadioGroup name="outfit" legend="Outfit">
        <RadioTile value="fern" ripple={ripple}>
          Fern
        </RadioTile>
      </RadioGroup>,
    )
    const tile = screen.getByRole('radio').closest('label')!
    fireEvent.keyDown(tile, { key: ' ' })
    expect(tile).toHaveAttribute('data-pressed')
    expect(animate).not.toHaveBeenCalled()
    fireEvent.keyUp(tile, { key: ' ' })
    expect(tile).not.toHaveAttribute('data-pressed')
  },
)
