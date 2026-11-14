import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, StrictMode, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test'
import { RangeSlider, Slider } from './slider'
import type { RangeSliderProps, RangeSliderValue, SliderProps } from './types'

const getSlider = () => screen.getByRole('slider') as HTMLInputElement
const thumbs = () => screen.getAllByRole('slider') as HTMLInputElement[]
const getControl = () => document.querySelector<HTMLDivElement>('[data-slot="slider-control"]')!
function pointer(
  target: Element | Window,
  type: string,
  clientX: number,
  overrides: Record<string, unknown> = {},
) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  for (const [key, value] of Object.entries({
    clientX,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    ...overrides,
  }))
    Object.defineProperty(event, key, { value })
  fireEvent(target, event)
}
const capture = vi.fn()
const releaseCapture = vi.fn()
beforeEach(() => {
  capture.mockClear()
  releaseCapture.mockClear()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 22,
    width: 200,
    right: 222,
    top: 0,
    bottom: 44,
    height: 44,
  } as DOMRect)
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: capture,
  })
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => true,
  })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: releaseCapture,
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  for (const name of ['setPointerCapture', 'hasPointerCapture', 'releasePointerCapture'])
    Reflect.deleteProperty(HTMLElement.prototype, name)
})

test('native sliders have names, descriptions, formatted values and root refs without duplicate roles', () => {
  const ref = createRef<HTMLDivElement>()
  render(
    <Slider
      ref={ref}
      label="Volume"
      helperText="Playback volume"
      defaultValue={40}
      name="volume"
      formatValue={(v) => `${v}%`}
    />,
  )
  expect(getSlider().type).toBe('range')
  expect(getSlider()).toHaveAccessibleName('Volume')
  expect(getSlider()).toHaveAccessibleDescription('Playback volume')
  expect(getSlider()).toHaveAttribute('aria-valuetext', '40%')
  expect(getSlider()).not.toHaveAttribute('role')
  expect(ref.current).toBe(screen.getByRole('group'))
})

test('range uses stable labeled identities, two native names, and dependent limits', () => {
  const { container } = render(
    <form>
      <RangeSlider
        label="Price"
        thumbLabels={['Minimum', 'Maximum']}
        defaultValue={[20, 80]}
        minStepsBetweenThumbs={10}
        name={['minPrice', 'maxPrice']}
      />
    </form>,
  )
  expect(thumbs()[0]).toHaveAccessibleName('Price Minimum')
  expect(thumbs()[1]).toHaveAccessibleName('Price Maximum')
  expect(thumbs()[0]).toHaveAttribute('max', '70')
  expect(thumbs()[1]).toHaveAttribute('min', '30')
  expect([...new FormData(container.querySelector('form')!).entries()]).toEqual([
    ['minPrice', '20'],
    ['maxPrice', '80'],
  ])
})

test('hidden visible labels and spoken text overrides do not lose thumb names', () => {
  render(
    <RangeSlider
      aria-label="Speed"
      thumbLabels={['Low', 'High']}
      defaultValue={[1, 2]}
      min={0}
      max={3}
      step={0.5}
      getValueText={(v) => `${v} times`}
      showValue={false}
    />,
  )
  expect(thumbs()[0]).toHaveAccessibleName('Speed Low')
  expect(thumbs()[1]).toHaveAccessibleName('Speed High')
  expect(thumbs()[1]).toHaveAttribute('aria-valuetext', '2 times')
  expect(document.querySelector('[data-slot="slider-value"]')).toBeNull()
})

test('keyboard repeat previews each step, commits once on release and never commits a no-op', async () => {
  const user = userEvent.setup(),
    change = vi.fn(),
    commit = vi.fn()
  render(<Slider label="Volume" defaultValue={40} onValueChange={change} onValueCommit={commit} />)
  await user.tab()
  fireEvent.keyDown(getSlider(), { key: 'ArrowRight' })
  fireEvent.keyDown(getSlider(), { key: 'ArrowRight', repeat: true })
  expect(getSlider()).toHaveValue('42')
  expect(change).toHaveBeenCalledTimes(2)
  expect(commit).not.toHaveBeenCalled()
  fireEvent.keyUp(getSlider(), { key: 'ArrowRight' })
  expect(commit).toHaveBeenLastCalledWith(42, { reason: 'keyboard', thumbIndex: 0 })
  await user.keyboard('{End}')
  commit.mockClear()
  await user.keyboard('{ArrowUp}')
  expect(commit).not.toHaveBeenCalled()
})

test('keyboard blur commits once, Escape bubbles, and preventDefault cancels navigation', () => {
  const commit = vi.fn(),
    outside = vi.fn()
  const { rerender } = render(
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- test event propagation to a surrounding consumer
    <div onKeyDown={outside}>
      <Slider label="Volume" onValueCommit={commit} />
    </div>,
  )
  getSlider().focus()
  fireEvent.keyDown(getSlider(), { key: 'ArrowRight' })
  fireEvent.blur(getSlider())
  expect(commit).toHaveBeenCalledTimes(1)
  fireEvent.keyUp(getSlider(), { key: 'ArrowRight' })
  expect(commit).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(getSlider(), { key: 'Escape' })
  expect(outside.mock.calls.at(-1)![0].key).toBe('Escape')
  rerender(<Slider label="Volume" onKeyDown={(event) => event.preventDefault()} />)
  fireEvent.keyDown(getSlider(), { key: 'ArrowRight' })
  expect(getSlider()).toHaveValue('0')
})

test('Home/End and Page keys clamp to per-thumb bounds, without swapping or pushing', async () => {
  const user = userEvent.setup()
  render(
    <RangeSlider
      label="Price"
      thumbLabels={['Low', 'High']}
      defaultValue={[20, 80]}
      minStepsBetweenThumbs={10}
    />,
  )
  await user.tab()
  await user.keyboard('{End}')
  expect(thumbs().map((input) => input.value)).toEqual(['70', '80'])
  await user.tab()
  expect(thumbs()[1]).toHaveFocus()
  await user.keyboard('{Home}{PageUp}')
  expect(thumbs().map((input) => input.value)).toEqual(['70', '90'])
  await user.keyboard('{PageDown}')
  expect(thumbs()[1]).toHaveValue('80')
})

test('RTL mirrors horizontal arrows but not up/down or DOM tab order', async () => {
  const user = userEvent.setup()
  render(
    <div dir="rtl">
      <RangeSlider label="Price" thumbLabels={['Low', 'High']} defaultValue={[20, 80]} />
    </div>,
  )
  await user.tab()
  await user.keyboard('{ArrowRight}{ArrowUp}{ArrowLeft}')
  expect(thumbs()[0]).toHaveValue('21')
  await user.tab()
  expect(thumbs()[1]).toHaveFocus()
})

test('decimal steps are exact and offset from a non-zero minimum; negative values work', async () => {
  const user = userEvent.setup()
  render(<Slider label="Opacity" min={-0.2} max={0.8} step={0.05} defaultValue={0.1} />)
  await user.tab()
  await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
  expect(getSlider()).toHaveValue('0.25')
  await user.keyboard('{Home}')
  expect(getSlider()).toHaveValue('-0.2')
})

test('track click previews at press, commits at release, and outside clicks do not commit again', () => {
  const change = vi.fn(),
    commit = vi.fn()
  render(<Slider label="Volume" defaultValue={40} onValueChange={change} onValueCommit={commit} />)
  pointer(getControl(), 'pointerdown', 182)
  expect(getSlider()).toHaveValue('80')
  expect(getSlider()).toHaveFocus()
  expect(commit).not.toHaveBeenCalled()
  pointer(window, 'pointerup', 182)
  expect(commit).toHaveBeenCalledExactlyOnceWith(80, { reason: 'pointer', thumbIndex: 0 })
  pointer(document.body, 'pointerup', 100)
  expect(commit).toHaveBeenCalledTimes(1)
})

test('grabbing the thumb preserves the grab offset, captures pointer, and clamps outside the rail', () => {
  render(<Slider label="Volume" defaultValue={40} />)
  pointer(getControl(), 'pointerdown', 110)
  expect(getSlider()).toHaveValue('40')
  expect(capture).toHaveBeenCalledWith(1)
  pointer(window, 'pointermove', 130)
  expect(getSlider()).toHaveValue('50')
  pointer(window, 'pointermove', 500)
  expect(getSlider()).toHaveValue('100')
  pointer(window, 'pointerup', 500)
  expect(releaseCapture).toHaveBeenCalledWith(1)
})

test('pointer cancellation and unexpected lost capture roll back without commit', () => {
  const change = vi.fn(),
    commit = vi.fn()
  render(<Slider label="Volume" defaultValue={40} onValueChange={change} onValueCommit={commit} />)
  pointer(getControl(), 'pointerdown', 182)
  pointer(window, 'pointercancel', 182)
  expect(getSlider()).toHaveValue('40')
  expect(change).toHaveBeenLastCalledWith(40, { reason: 'cancel', thumbIndex: 0 })
  expect(commit).not.toHaveBeenCalled()
  pointer(getControl(), 'pointerdown', 182)
  pointer(screen.getByRole('group'), 'lostpointercapture', 182)
  expect(getSlider()).toHaveValue('40')
  expect(commit).not.toHaveBeenCalled()
})

test('window blur cancels, a gesture returning to its initial value never commits, and secondary pointers are ignored', () => {
  const commit = vi.fn()
  render(<Slider label="Volume" defaultValue={40} onValueCommit={commit} />)
  pointer(getControl(), 'pointerdown', 182, { button: 2 })
  expect(getSlider()).toHaveValue('40')
  pointer(getControl(), 'pointerdown', 102)
  pointer(window, 'pointermove', 182, { pointerId: 2 })
  expect(getSlider()).toHaveValue('40')
  pointer(window, 'pointermove', 182)
  fireEvent(window, new Event('blur'))
  expect(getSlider()).toHaveValue('40')
  pointer(getControl(), 'pointerdown', 102)
  pointer(window, 'pointermove', 182)
  pointer(window, 'pointermove', 102)
  pointer(window, 'pointerup', 102)
  expect(commit).not.toHaveBeenCalled()
})

test('overlapping thumbs select lower or upper by first drag direction, and preserve identity', () => {
  const { rerender } = render(
    <RangeSlider label="Range" thumbLabels={['Low', 'High']} defaultValue={[50, 50]} />,
  )
  pointer(getControl(), 'pointerdown', 122)
  pointer(window, 'pointermove', 102)
  pointer(window, 'pointerup', 102)
  expect(thumbs().map((input) => input.value)).toEqual(['40', '50'])
  rerender(
    <RangeSlider key="reset" label="Range" thumbLabels={['Low', 'High']} defaultValue={[50, 50]} />,
  )
  pointer(getControl(), 'pointerdown', 122)
  pointer(window, 'pointermove', 142)
  pointer(window, 'pointerup', 142)
  expect(thumbs().map((input) => input.value)).toEqual(['50', '60'])
  expect(thumbs()[1]).toHaveFocus()
})

test('controlled accepted changes render and commit; rejected changes never commit fictional values', async () => {
  const user = userEvent.setup(),
    commit = vi.fn(),
    change = vi.fn()
  function Controlled() {
    const [value, setValue] = useState(40)
    return <Slider label="Volume" value={value} onValueChange={setValue} onValueCommit={commit} />
  }
  const { rerender } = render(<Controlled />)
  await user.tab()
  await user.keyboard('{ArrowRight}')
  expect(getSlider()).toHaveValue('41')
  expect(commit).toHaveBeenLastCalledWith(41, { reason: 'keyboard', thumbIndex: 0 })
  rerender(<Slider label="Volume" value={40} onValueChange={change} onValueCommit={commit} />)
  commit.mockClear()
  pointer(getControl(), 'pointerdown', 182)
  pointer(window, 'pointerup', 182)
  expect(getSlider()).toHaveValue('40')
  expect(change).toHaveBeenCalledWith(80, { reason: 'pointer', thumbIndex: 0 })
  expect(commit).not.toHaveBeenCalled()
})

test('external value changes during a drag win and end the session without committing', () => {
  const commit = vi.fn()
  function Controlled({ external }: { external?: number }) {
    const [value, setValue] = useState(40)
    return (
      <Slider
        label="Volume"
        value={external ?? value}
        onValueChange={setValue}
        onValueCommit={commit}
      />
    )
  }
  const { rerender } = render(<Controlled />)
  pointer(getControl(), 'pointerdown', 182)
  expect(getSlider()).toHaveValue('80')
  rerender(<Controlled external={10} />)
  pointer(window, 'pointermove', 222)
  pointer(window, 'pointerup', 222)
  expect(getSlider()).toHaveValue('10')
  expect(commit).not.toHaveBeenCalled()
})

test('native/AT input changes commit accepted values once, including controlled state', async () => {
  const commit = vi.fn()
  function Controlled() {
    const [value, setValue] = useState(40)
    return <Slider label="Volume" value={value} onValueChange={setValue} onValueCommit={commit} />
  }
  render(<Controlled />)
  fireEvent.change(getSlider(), { target: { value: '45' } })
  await waitFor(() =>
    expect(commit).toHaveBeenCalledExactlyOnceWith(45, { reason: 'input', thumbIndex: 0 }),
  )
  expect(getSlider()).toHaveValue('45')
})

test('disabled and native fieldset disabled cannot change or submit', async () => {
  const user = userEvent.setup(),
    change = vi.fn()
  const { container, rerender } = render(
    <form>
      <Slider label="Volume" disabled defaultValue={40} name="volume" onValueChange={change} />
    </form>,
  )
  pointer(getControl(), 'pointerdown', 182)
  await user.tab()
  expect(getSlider()).not.toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(new FormData(container.querySelector('form')!).has('volume')).toBe(false)
  rerender(
    <fieldset disabled>
      <Slider label="Volume" defaultValue={40} onValueChange={change} />
    </fieldset>,
  )
  pointer(getControl(), 'pointerdown', 182)
  expect(change).not.toHaveBeenCalled()
})

test('disabling/unmounting during a gesture removes capture/listeners without callbacks', () => {
  const change = vi.fn(),
    commit = vi.fn()
  const { rerender, unmount } = render(
    <Slider label="Volume" defaultValue={40} onValueChange={change} onValueCommit={commit} />,
  )
  pointer(getControl(), 'pointerdown', 182)
  rerender(
    <Slider
      label="Volume"
      defaultValue={40}
      disabled
      onValueChange={change}
      onValueCommit={commit}
    />,
  )
  change.mockClear()
  pointer(window, 'pointermove', 222)
  pointer(window, 'pointerup', 222)
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  rerender(
    <Slider label="Volume" defaultValue={40} onValueChange={change} onValueCommit={commit} />,
  )
  pointer(getControl(), 'pointerdown', 22)
  change.mockClear()
  unmount()
  pointer(window, 'pointermove', 222)
  fireEvent(window, new Event('blur'))
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})

test('native form reset restores uncontrolled defaults and preserves controlled values; canceled reset does nothing', async () => {
  const user = userEvent.setup(),
    change = vi.fn(),
    commit = vi.fn()
  const { container, rerender } = render(
    <form id="settings">
      <Slider label="Volume" defaultValue={40} onValueChange={change} onValueCommit={commit} />
    </form>,
  )
  await user.tab()
  await user.keyboard('{End}')
  change.mockClear()
  commit.mockClear()
  act(() => container.querySelector('form')!.reset())
  await waitFor(() => expect(getSlider()).toHaveValue('40'))
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  rerender(
    <>
      <form id="settings" />
      <Slider label="Volume" value={30} form="settings" />
    </>,
  )
  act(() => container.querySelector('form')!.reset())
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
  expect(getSlider()).toHaveValue('30')
  rerender(
    <form onReset={(event) => event.preventDefault()}>
      <Slider label="Volume" defaultValue={40} />
    </form>,
  )
  fireEvent.change(getSlider(), { target: { value: '80' } })
  act(() => container.querySelector('form')!.reset())
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
  expect(getSlider()).toHaveValue('80')
})

test('changing bounds clamps uncontrolled values without callbacks and does not resurrect old values', () => {
  const change = vi.fn(),
    commit = vi.fn()
  const { rerender } = render(
    <Slider label="Volume" onValueChange={change} onValueCommit={commit} />,
  )
  fireEvent.change(getSlider(), { target: { value: '90' } })
  change.mockClear()
  commit.mockClear()
  rerender(<Slider label="Volume" max={50} onValueChange={change} onValueCommit={commit} />)
  expect(getSlider()).toHaveValue('50')
  rerender(<Slider label="Volume" max={100} onValueChange={change} onValueCommit={commit} />)
  expect(getSlider()).toHaveValue('50')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})

test('marks are decorative, error messages replace help, and error does not prevent editing', async () => {
  const user = userEvent.setup()
  render(
    <Slider
      label="Volume"
      helperText="Help"
      error="Too loud"
      marks={[
        { value: 0, label: 'Quiet' },
        { value: 100, label: 'Loud' },
      ]}
    />,
  )
  expect(getSlider()).toHaveAccessibleDescription('Too loud')
  expect(screen.queryByText('Help')).not.toBeInTheDocument()
  expect(getSlider()).toHaveAttribute('aria-invalid', 'true')
  await user.tab()
  await user.keyboard('{ArrowRight}')
  expect(getSlider()).toHaveValue('1')
})

test('SSR and StrictMode preserve initial values with no unsolicited callbacks', async () => {
  const change = vi.fn(),
    commit = vi.fn()
  const element = (
    <RangeSlider
      label="Range"
      thumbLabels={['Low', 'High']}
      defaultValue={[25, 75]}
      onValueChange={change}
      onValueCommit={commit}
    />
  )
  const html = renderToString(element)
  expect(html).toContain('value="25"')
  expect(html).toContain('value="75"')
  render(<StrictMode>{element}</StrictMode>)
  await act(async () => {})
  expect(thumbs().map((input) => input.value)).toEqual(['25', '75'])
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})

test('invalid scales, values, labels and duplicate marks fail clearly', () => {
  expect(() => render(<Slider label="Bad" step={0} />)).toThrow('positive')
  expect(() => render(<Slider label="Bad" max={10} step={3} />)).toThrow('divisible')
  expect(() => render(<Slider label="Bad" value={NaN} />)).toThrow('finite')
  expect(() => render(<Slider label="Bad" min={5} max={10} value={1} />)).toThrow('within')
  expect(() =>
    render(<RangeSlider label="Bad" thumbLabels={['Low', 'High']} value={[80, 20]} />),
  ).toThrow('ordered')
  expect(() => render(<Slider label="Bad" marks={[{ value: 0 }, { value: 0 }]} />)).toThrow(
    'unique',
  )
  expect(() => render(<Slider aria-label="" />)).toThrow('label')
})

test('public types distinguish scalar and tuple, require labels and exclude mixed value modes', () => {
  const single: SliderProps = { label: 'Volume', value: 20 }
  const pair: RangeSliderValue = [20, 80]
  const range: RangeSliderProps = { label: 'Price', value: pair, thumbLabels: ['Low', 'High'] }
  // @ts-expect-error Slider requires a scalar.
  const wrongSingle: SliderProps = { label: 'Bad', value: [20] }
  // @ts-expect-error RangeSlider requires exactly two values.
  const wrongRange: RangeSliderProps = { label: 'Bad', thumbLabels: ['Low', 'High'], value: [20] }
  // @ts-expect-error Accessible name is required.
  const missingLabel: SliderProps = { value: 20 }
  // @ts-expect-error Controlled and default values cannot be combined.
  const mixed: SliderProps = { label: 'Bad', value: 20, defaultValue: 30 }
  expect([single, range, wrongSingle, wrongRange, missingLabel, mixed]).toHaveLength(6)
})
