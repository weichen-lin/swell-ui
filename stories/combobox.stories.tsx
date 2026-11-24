import type { Meta, StoryObj } from '@storybook/react-vite'
import { type CSSProperties, useEffect, useId, useState } from 'react'
import { Button } from '../src/components/button'
import { Combobox, type ComboboxOption, type ComboboxProps } from '../src/components/combobox'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../src/components/dialog'
import { Database, Globe, Server } from './_helpers/story-icons'

const projects: ComboboxOption[] = [
  {
    value: 'payment-api',
    label: 'Payment API',
    description: '付款服務 · payment-api',
    keywords: ['金流', 'payments'],
    icon: <Server />,
  },
  {
    value: 'analytics',
    label: 'Analytics',
    description: '成效資料 · analytics',
    keywords: ['分析', '數據'],
    icon: <Database />,
  },
  {
    value: 'admin',
    label: 'Admin console',
    description: '管理後台 · admin',
    keywords: ['管理'],
    icon: <Globe />,
  },
  { value: 'edge-api', label: 'Edge API', description: '邊緣服務 · edge-api', icon: <Server /> },
  { value: 'legacy', label: 'Legacy gateway', description: '已封存，無法選取', disabled: true },
]
const grouped = [
  { label: 'Production', options: projects.slice(0, 3) },
  { label: 'Sandbox', options: projects.slice(3) },
]
// Keep Storybook's controls focused on the visible-label, uncontrolled API.
type StoryArgs = Omit<
  Extract<ComboboxProps, { label: string }>,
  'value' | 'defaultValue' | 'open' | 'defaultOpen'
> & {
  defaultValue?: string | null
  defaultOpen?: boolean
}
const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Searchable single selection. value is a stable string ID or null; inputValue is the editable text. Arrow keys preview; Enter/click commits. Escape, Tab and outside interaction revert an uncommitted query. Deleting all text or the clear button clears selection. Use filter={false} for remote results, and selectedOption to preserve a remote selection’s label. Loading blocks stale options. Uses FieldShell tokens and a transparent, genuinely notched floating label. No new dependencies.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl rounded-xl bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Project',
    options: projects,
    placeholder: '搜尋專案…',
    size: 'md',
    floating: false,
    clearable: true,
    openOnFocus: false,
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    options: { control: false },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    floating: { control: 'boolean' },
    clearable: { control: 'boolean' },
    openOnFocus: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    defaultValue: { control: 'select', options: [null, ...projects.map((item) => item.value)] },
    error: { control: 'text' },
    searchError: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
  },
} satisfies Meta<StoryArgs>
export default meta
type Story = StoryObj<Meta<StoryArgs>>

export const Playground: Story = { args: { helperText: '試試 api、金流，或沒有符合結果的文字。' } }
export const Default: Story = { args: { defaultValue: 'payment-api' } }
export const Grouped: Story = {
  args: { options: grouped, defaultValue: 'payment-api', defaultOpen: true },
}
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-7">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Combobox
          key={size}
          label={`Project · ${size}`}
          size={size}
          options={projects}
          defaultValue="payment-api"
        />
      ))}
    </div>
  ),
}
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-7">
      <Combobox label="Default" options={projects} placeholder="Search projects…" />
      <Combobox label="Selected" options={projects} defaultValue="payment-api" />
      <Combobox label="Error" options={projects} error="請從清單選擇一個專案。" required />
      <Combobox label="Disabled" options={projects} defaultValue="payment-api" disabled />
      <Combobox
        label="Read-only"
        options={projects}
        defaultValue="payment-api"
        readOnly
        helperText="可複製；仍會提交選取 ID。"
      />
    </div>
  ),
}
export const Floating: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Combobox label="Project" options={projects} floating placeholder="Search projects…" />
      <Combobox label="Project" options={projects} floating defaultValue="payment-api" />
      <div className="rounded-xl bg-surface p-6">
        <Combobox label="Project on surface" options={projects} floating defaultValue="analytics" />
      </div>
      <Combobox
        label="Required project"
        options={projects}
        floating
        required
        error="請選擇專案。"
      />
    </div>
  ),
}
export const WarmSurface: Story = {
  render: () => (
    <div
      className="rounded-xl bg-bg p-6"
      style={
        {
          colorScheme: 'light',
          '--color-bg': '#f3ede2',
          '--color-surface': '#faf6ee',
          '--color-surface-raised': '#fffaf1',
          '--color-fg': '#32291f',
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-8">
        <Combobox label="Project" options={projects} floating />
        <div className="rounded-xl bg-surface p-5">
          <Combobox
            label="Project on surface"
            options={projects}
            floating
            defaultValue="payment-api"
          />
        </div>
        <Combobox label="Regular field" options={projects} defaultValue="analytics" />
      </div>
    </div>
  ),
}
export const Dark: Story = { ...Floating, globals: { theme: 'dark' } }
export const Empty: Story = {
  args: { options: [], defaultOpen: true, emptyText: '沒有可選擇的專案。' },
}
export const Loading: Story = {
  args: { loading: true, defaultOpen: true, loadingText: '載入專案中…' },
}
export const LongLabels: Story = {
  render: () => (
    <div className="max-w-64">
      <Combobox
        label="Deployment project"
        options={[
          {
            value: 'long',
            label: 'Gradual rollout with manual approval',
            description: 'Wait for an operator to approve the next deployment step.',
          },
          {
            value: 'zh',
            label: '在指定維護時段完成更新並保留手動確認步驟',
            description: '長文字自然換行，不壓縮勾選圖示。',
          },
          { value: 'token', label: 'averylongunbrokenprojectnamethatmustwrapwithoutoverflow' },
          { value: 'same-1', label: 'Analytics', description: 'Production' },
          { value: 'same-2', label: 'Analytics', description: 'Sandbox' },
        ]}
      />
    </div>
  ),
}
export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('payment-api')
    const [text, setText] = useState('Payment API')
    return (
      <div className="flex flex-col gap-4">
        <Combobox
          label="Project"
          options={projects}
          value={value}
          onValueChange={setValue}
          inputValue={text}
          onInputValueChange={setText}
        />
        <output className="text-xs text-fg-muted">
          ID: {value ?? 'null'} · Text: {text || '(empty)'}
        </output>
        <div className="flex flex-wrap gap-2">
          <Button
            intent="secondary"
            onClick={() => {
              setValue(null)
              setText('')
            }}
          >
            Clear externally
          </Button>
          <Button
            intent="secondary"
            onClick={() => {
              setValue('analytics')
              setText('Analytics')
            }}
          >
            Select Analytics
          </Button>
        </div>
      </div>
    )
  },
}
export const AsyncSearch: Story = {
  render: function Render() {
    const [query, setQuery] = useState('')
    const [value, setValue] = useState<string | null>('payment-api')
    const [selectedOption, setSelectedOption] = useState<ComboboxOption | null>(projects[0])
    const [response, setResponse] = useState({ query: '', items: projects, error: '' })
    const [attempt, setAttempt] = useState(0)
    const [busy, setBusy] = useState(false)
    useEffect(() => {
      const timer = setTimeout(() => {
        const failed = query.toLowerCase() === 'fail' && attempt === 0
        setResponse({
          query,
          items: failed
            ? []
            : projects.filter((item) =>
                [item.label, ...(item.keywords ?? [])]
                  .join(' ')
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ),
          error: failed ? '無法載入專案，請重試。' : '',
        })
        setBusy(false)
      }, 650)
      // Cancel stale responses on query change/unmount; the component owns no network requests.
      return () => clearTimeout(timer)
    }, [query, attempt])
    return (
      <div className="flex flex-col gap-4">
        <Combobox
          label="Project"
          name="async-project"
          options={response.items}
          filter={false}
          value={value}
          selectedOption={selectedOption}
          onValueChange={(next, { option }) => {
            setValue(next)
            setSelectedOption(option)
          }}
          onInputValueChange={(text, { reason }) => {
            if (reason !== 'input' || text === query) return
            setQuery(text)
            setAttempt(0)
            setBusy(true)
          }}
          loading={busy || response.query !== query}
          searchError={response.query === query && !busy ? response.error : undefined}
          onRetry={() => {
            setBusy(true)
            setAttempt(attempt + 1)
          }}
          helperText="示意延遲 650 ms；輸入 fail 測試失敗重試。"
        />
        <output className="text-xs text-fg-muted">
          Selected ID: {value ?? 'null'} · Query: {query || '(all)'}
        </output>
        <p className="m-0 text-xs text-fg-muted">
          新結果沒有原選項時，保留已選名稱。搜尋請求由應用層管理。
        </p>
      </div>
    )
  },
}
export const Required: Story = {
  render: function Render() {
    const [submitted, setSubmitted] = useState('')
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
        }}
        onReset={() => setSubmitted('')}
      >
        <Combobox
          label="Project"
          name="project"
          options={projects}
          required
          helperText="輸入文字不等於有效選取；請以 Enter 或點選確認。"
        />
        <div className="flex gap-2">
          <Button type="submit">Submit</Button>
          <Button type="reset" intent="secondary">
            Reset
          </Button>
        </div>
        <output className="text-xs text-fg-muted">{submitted || 'No submission yet.'}</output>
      </form>
    )
  },
}
export const FormReset: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('payment-api')
    const [submitted, setSubmitted] = useState('')
    return (
      <form
        className="flex flex-col gap-6"
        onReset={() => {
          setValue('payment-api')
          setSubmitted('')
        }}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
        }}
      >
        <Combobox
          label="Uncontrolled"
          options={projects}
          defaultValue="payment-api"
          name="uncontrolled"
        />
        <Combobox
          label="Controlled"
          options={projects}
          value={value}
          onValueChange={setValue}
          name="controlled"
        />
        <div className="flex gap-2">
          <Button type="reset" intent="secondary">
            Reset form
          </Button>
          <Button type="submit">Read form values</Button>
        </div>
        <output className="text-xs text-fg-muted">
          {submitted || 'Both reset to Payment API. Controlled uses the form’s onReset.'}
        </output>
      </form>
    )
  },
}
export const ExternalForm: Story = {
  render: function Render() {
    const formId = useId()
    const [submitted, setSubmitted] = useState('')
    return (
      <div className="flex flex-col gap-4">
        <Combobox
          label="Project"
          name="project"
          form={formId}
          options={projects}
          defaultValue="payment-api"
        />
        <form
          id={formId}
          className="flex gap-2"
          onReset={() => setSubmitted('')}
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
          }}
        >
          <Button type="submit">Read external form</Button>
          <Button type="reset" intent="secondary">
            Reset
          </Button>
        </form>
        <output className="text-xs text-fg-muted">
          {submitted || 'The field lives outside its form.'}
        </output>
      </div>
    )
  },
}
export const InDialog: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Choose project</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogHeader
            title="Deployment project"
            description="Escape closes the options first, then the dialog."
          />
          <DialogBody>
            <Combobox label="Project" options={grouped} defaultValue="payment-api" floating />
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}
export const ViewportEdges: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="min-h-[110vh]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex h-[85vh] flex-col justify-between gap-8">
      <p className="m-0 text-sm text-fg-muted">
        Scroll or resize. The popup stays aligned and flips above when needed.
      </p>
      <div className="h-44 overflow-auto rounded-xl border border-input-border p-4">
        <div className="h-80 pt-20">
          <Combobox label="Project near viewport edge" options={grouped} />
        </div>
      </div>
    </div>
  ),
}
export const Touch: Story = {
  render: () => (
    <div className="w-full max-w-72">
      <Combobox
        label="Project"
        options={grouped}
        defaultValue="payment-api"
        floating
        helperText="使用觸控裝置檢查 44 px 命中區、16 px 輸入文字與螢幕鍵盤。"
      />
    </div>
  ),
}
