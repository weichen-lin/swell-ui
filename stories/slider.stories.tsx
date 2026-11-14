import type { Meta, StoryObj } from '@storybook/react-vite'
import { type CSSProperties, useState } from 'react'
import { Button } from '../src/components/button'
import { Dialog, DialogBody, DialogHeader } from '../src/components/dialog'
import { Input } from '../src/components/input'
import {
  RangeSlider,
  type RangeSliderValue,
  Slider,
  type SliderChangeDetails,
  type SliderCommitDetails,
} from '../src/components/slider'

type Args = { label: string; disabled: boolean; showValue: boolean }
const percent = (value: number) => `${value}%`
const money = (value: number) => `NT$ ${value.toLocaleString('en-US')}`
const meta = {
  title: 'UI/Slider',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Slider takes a number; RangeSlider takes readonly [number, number] and requires thumbLabels.',
          'Controlled value and defaultValue are mutually exclusive. Default: min=0, max=100, step=1, showValue=true.',
          'The default value is min (single) or [min,max] (range). min/max must span a whole number of positive steps.',
          'Thumbs stop at their limits without swapping or pushing. minStepsBetweenThumbs sets their minimum distance.',
          'onValueChange previews; onValueCommit runs once after a changed gesture ends. Cancel restores the starting value without commit.',
          'Controlled owners must update value immediately in onValueChange; put expensive work in onValueCommit.',
          'Native range inputs provide names, form submission, reset and accessibility. Each thumb remains a separate Tab stop.',
          'Arrow keys change one step, Home/End use the current thumb bounds, PageUp/PageDown change ten steps. RTL mirrors horizontal arrows.',
          'Use the toolbar for light/dark, and keyboard focus for the focus outline. Touch screen reader support still needs device acceptance.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl p-5">
        <Story />
      </div>
    ),
  ],
  args: { label: '播放音量', disabled: false, showValue: true },
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    showValue: { control: 'boolean' },
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <Slider
      {...args}
      defaultValue={40}
      formatValue={percent}
      helperText="拖曳、點擊軌道，或聚焦後用方向鍵調整。"
    />
  ),
}
export const Range: Story = {
  render: () => (
    <RangeSlider
      label="價格範圍"
      thumbLabels={['最低價格', '最高價格']}
      defaultValue={[200, 800]}
      max={1000}
      step={50}
      formatValue={money}
      helperText="兩端身分固定；相遇時停止，不交換、不推動。"
    />
  ),
}
export const MinimumDistance: Story = {
  render: () => (
    <RangeSlider
      label="價格範圍"
      thumbLabels={['最低價格', '最高價格']}
      defaultValue={[200, 800]}
      max={1000}
      step={50}
      minStepsBetweenThumbs={2}
      formatValue={money}
      helperText="最少相距 NT$ 100（2 steps × 50）。Home／End 也遵守此限制。"
    />
  ),
}
export const OverlappingThumbs: Story = {
  render: () => (
    <RangeSlider
      label="允許重合的範圍"
      thumbLabels={['下限', '上限']}
      defaultValue={[50, 50]}
      helperText="從重合處向左拖會選下限，向右拖會選上限；Tab 仍固定下限 → 上限。"
    />
  ),
}
export const Marks: Story = {
  render: () => (
    <Slider
      label="提醒間隔"
      min={1}
      max={7}
      defaultValue={3}
      marks={[1, 3, 5, 7].map((value) => ({ value, label: `${value} 天` }))}
      formatValue={(value) => `${value} 天`}
      helperText="step=1；沒有標記的 2、4、6 天仍可選。刻度本身不是額外的 Tab stop。"
    />
  ),
}
export const DecimalSteps: Story = {
  render: () => (
    <Slider
      label="圖層透明度"
      min={0}
      max={1}
      step={0.05}
      defaultValue={0.6}
      formatValue={(value) => `${Math.round(value * 100)}%`}
      helperText="對外 number 為 0–1；畫面與 aria-valuetext 以百分比顯示。"
    />
  ),
}
export const NegativeValues: Story = {
  render: () => (
    <Slider
      label="曝光補償"
      min={-2}
      max={2}
      step={0.25}
      defaultValue={-0.5}
      formatValue={(value) => `${value > 0 ? '+' : ''}${value} EV`}
      helperText="從非零最小值計算步進，單值填色從 min 到目前值。"
    />
  ),
}

function ControlledDemo({ range = false }: { range?: boolean }) {
  const [single, setSingle] = useState(40)
  const [pair, setPair] = useState<RangeSliderValue>([20, 80])
  return (
    <div className="flex flex-col gap-5">
      {range ? (
        <RangeSlider
          label="範圍"
          thumbLabels={['下限', '上限']}
          value={pair}
          onValueChange={setPair}
        />
      ) : (
        <Slider label="播放音量" value={single} onValueChange={setSingle} formatValue={percent} />
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          intent="secondary"
          onClick={() => {
            setSingle(20)
            setPair([10, 50])
          }}
        >
          套用較低設定
        </Button>
        <Button
          intent="secondary"
          onClick={() => {
            setSingle(40)
            setPair([20, 80])
          }}
        >
          還原設定
        </Button>
      </div>
      <output className="text-xs text-fg-muted">
        value: {JSON.stringify(range ? pair : single)}
      </output>
    </div>
  )
}
export const ControlledSingle: Story = { render: () => <ControlledDemo /> }
export const ControlledRange: Story = { render: () => <ControlledDemo range /> }

function EventDemo() {
  const [events, setEvents] = useState<string[]>([])
  const record = (
    name: string,
    value: number,
    details: SliderChangeDetails | SliderCommitDetails,
  ) =>
    setEvents((items) =>
      [`${name}: ${value} · ${details.reason} · thumb ${details.thumbIndex}`, ...items].slice(0, 8),
    )
  return (
    <div className="flex flex-col gap-5">
      <Slider
        label="即時音量"
        defaultValue={40}
        onValueChange={(value, details) => record('change', value, details)}
        onValueCommit={(value, details) => record('commit', value, details)}
        helperText="按住方向鍵只預覽，放開才 commit。拖回起點、沒有改值或取消操作不會 commit。"
      />
      <pre className="m-0 min-h-36 overflow-auto rounded-lg border border-input-border bg-surface p-4 text-xs text-fg-muted">
        {events.join('\n') || '等待操作…'}
      </pre>
      <Button intent="secondary" className="self-start" onClick={() => setEvents([])}>
        清除紀錄
      </Button>
    </div>
  )
}
export const ChangeAndCommit: Story = { render: () => <EventDemo /> }

function ExactDemo() {
  const [value, setValue] = useState(35)
  const [draft, setDraft] = useState('35')
  const [error, setError] = useState(false)
  const apply = () => {
    const next = Number(draft)
    if (draft.trim() === '' || !Number.isInteger(next) || next < 0 || next > 100) {
      setError(true)
      return
    }
    setValue(next)
    setError(false)
  }
  return (
    <div className="flex flex-col gap-5">
      <Slider
        label="播放音量"
        value={value}
        formatValue={percent}
        onValueChange={(next) => {
          setValue(next)
          setDraft(String(next))
          setError(false)
        }}
      />
      <Input
        className="max-w-48"
        label="直接輸入百分比"
        inputMode="numeric"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={apply}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            apply()
          }
        }}
        error={error ? '請輸入 0–100 的整數。' : undefined}
        helperText="Enter 或離開欄位套用。"
      />
      <p className="m-0 text-xs text-fg-muted">
        這是應用層組合：空字串或無效輸入先保留草稿，滑桿維持上一個有效值。
      </p>
    </div>
  )
}
export const ExactInput: Story = { render: () => <ExactDemo /> }

function FormDemo() {
  const [data, setData] = useState('尚未提交')
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        setData(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
      }}
    >
      <Slider label="播放音量" name="volume" defaultValue={40} formatValue={percent} />
      <RangeSlider
        label="價格範圍"
        thumbLabels={['最低價格', '最高價格']}
        name={['priceMin', 'priceMax']}
        defaultValue={[200, 800]}
        max={1000}
        step={50}
        formatValue={money}
      />
      <Slider
        label="停用欄位"
        name="disabledVolume"
        defaultValue={10}
        disabled
        helperText="不會出現在 FormData 中。"
      />
      <div className="flex gap-2">
        <Button type="submit">查看 FormData</Button>
        <Button type="reset" intent="secondary">
          原生重設
        </Button>
      </div>
      <output aria-live="polite" className="text-sm wrap-anywhere text-fg-muted">
        {data}
      </output>
    </form>
  )
}
export const NativeFormAndReset: Story = { render: () => <FormDemo /> }

function ConstraintsDemo() {
  const [max, setMax] = useState(100)
  return (
    <div className="flex flex-col gap-5">
      <Slider
        label="上限會變動的音量"
        max={max}
        helperText="先拖到 90，再把上限改成 50；恢復 100 後維持 50，不復活原本的 90。"
      />
      <Button
        intent="secondary"
        className="self-start"
        onClick={() => setMax(max === 100 ? 50 : 100)}
      >
        上限改為 {max === 100 ? 50 : 100}
      </Button>
    </div>
  )
}
export const DynamicBounds: Story = { render: () => <ConstraintsDemo /> }
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Slider label="已鎖定音量" defaultValue={40} disabled formatValue={percent} />
      <RangeSlider
        label="已鎖定範圍"
        defaultValue={[20, 80]}
        thumbLabels={['下限', '上限']}
        disabled
      />
    </div>
  ),
}
function ErrorDemo() {
  const [value, setValue] = useState(80)
  return (
    <Slider
      label="通知音量"
      value={value}
      onValueChange={setValue}
      formatValue={percent}
      error={value > 70 ? '音量超過這個情境的 70% 上限，請調低。' : undefined}
      helperText="符合此情境的建議音量。"
    />
  )
}
export const ErrorState: Story = { render: () => <ErrorDemo /> }
export const HiddenLabel: Story = {
  render: () => (
    <Slider
      aria-label="播放速度"
      min={0.5}
      max={2}
      step={0.25}
      defaultValue={1}
      formatValue={(value) => `${value}×`}
      getValueText={(value) => `${value} 倍速`}
    />
  ),
}
export const NarrowAndLongLabels: Story = {
  render: () => (
    <div className="w-72 max-w-full">
      <RangeSlider
        label="調整指定專案每個月可接受的最低與最高預算範圍"
        thumbLabels={['最低預算', '最高預算']}
        max={1000000}
        step={1000}
        defaultValue={[250000, 800000]}
        formatValue={money}
        helperText="長標題與長數字可以換行，軌道與滑塊仍維持操作空間。"
      />
    </div>
  ),
}
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl">
      <RangeSlider
        label="價格範圍（RTL）"
        thumbLabels={['下限', '上限']}
        defaultValue={[20, 80]}
        helperText="最小值在右側；→ 減少、← 增加，↑ 仍增加。Tab 身分順序不變。"
      />
    </div>
  ),
}
export const WarmTokens: Story = {
  render: () => (
    <div
      style={
        {
          '--color-bg': 'light-dark(#f5f0e8, #1b1815)',
          '--color-surface-raised': 'light-dark(#fffaf2, #383026)',
          '--color-fg': 'light-dark(#30261f, #f4e9da)',
          '--color-primary': 'var(--color-fg)',
        } as CSSProperties
      }
      className="rounded-xl bg-bg p-5"
    >
      <RangeSlider
        label="價格範圍"
        thumbLabels={['最低價格', '最高價格']}
        defaultValue={[20, 80]}
      />
    </div>
  ),
}
function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>開啟音效設定</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="音效設定" />
        <DialogBody>
          <Slider
            label="播放音量"
            defaultValue={40}
            formatValue={percent}
            helperText="Tab 留在 Dialog；Escape 仍交給 Dialog 關閉。"
          />
        </DialogBody>
      </Dialog>
    </>
  )
}
export const InsideDialog: Story = { render: () => <DialogDemo /> }
