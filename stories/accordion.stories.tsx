import type { Meta, StoryObj } from '@storybook/react-vite'
import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionVariant,
} from '../src/components/accordion'
import { Button } from '../src/components/button'
import { Dialog, DialogBody, DialogHeader } from '../src/components/dialog'
import { Input } from '../src/components/input'

type Args = {
  variant: AccordionVariant
  type: 'single' | 'multiple'
  disabled: boolean
  collapsible: boolean
}
const meta = {
  title: 'UI/Accordion',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Compound API: Accordion / AccordionItem / AccordionTrigger / AccordionContent.',
          'single uses string | null; multiple uses readonly string[]. Controlled value and defaultValue are mutually exclusive.',
          'Default: line, single, collapsible=true, headingLevel=3, keepMounted=true. Change type with a new React key.',
          'Tab visits all enabled headers and open content; ↑/↓ and Home/End move header focus without expanding. Enter/Space toggles.',
          'Trigger wraps a native heading around its button. Use non-interactive children; description is announced separately.',
          'Content className styles the padded inner body; contentClassName and ref target the outer height wrapper.',
          'region is opt-in. Hidden mounted fields still participate in FormData and validation; see FormValidation.',
          'Animations respect prefers-reduced-motion. Use the toolbar to inspect both light and dark tokens.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
  args: { variant: 'line', type: 'single', disabled: false, collapsible: true },
  argTypes: {
    variant: { control: 'radio', options: ['line', 'outline'] },
    type: { control: 'radio', options: ['single', 'multiple'] },
    disabled: { control: 'boolean' },
    collapsible: { control: 'boolean', if: { arg: 'type', eq: 'single' } },
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

function ProjectItems({ keepMounted = true }: { keepMounted?: boolean }) {
  return (
    <>
      <AccordionItem value="general">
        <AccordionTrigger description="名稱、用途與識別資訊">專案資訊</AccordionTrigger>
        <AccordionContent keepMounted={keepMounted}>
          <Input label="顯示名稱" defaultValue="Payment API" />
          <p className="mt-3 mb-0">輸入後收合再展開，檢查內容是否保留。</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="notifications">
        <AccordionTrigger description="完成與失敗時的通知方式">通知設定</AccordionTrigger>
        <AccordionContent>
          <p className="m-0">在部署完成或失敗時通知團隊。主要操作應放在容易找到的位置。</p>
          <a
            href="#notifications"
            onClick={(event) => event.preventDefault()}
            className="mt-3 inline-block text-fg underline underline-offset-4"
          >
            管理通知對象
          </a>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="advanced">
        <AccordionTrigger>進階設定</AccordionTrigger>
        <AccordionContent>
          <p className="m-0">較少變動的選用設定集中在此。</p>
        </AccordionContent>
      </AccordionItem>
    </>
  )
}
function PlaygroundDemo({ type, collapsible, ...args }: Args) {
  return type === 'multiple' ? (
    <Accordion key="multiple" type="multiple" defaultValue={['general']} {...args}>
      <ProjectItems />
    </Accordion>
  ) : (
    <Accordion key="single" defaultValue="general" collapsible={collapsible} {...args}>
      <ProjectItems />
    </Accordion>
  )
}
export const Playground: Story = { render: (args) => <PlaygroundDemo {...args} /> }
export const Line: Story = {
  render: () => (
    <Accordion defaultValue="general">
      <ProjectItems />
    </Accordion>
  ),
}
export const Outline: Story = {
  render: () => (
    <Accordion defaultValue="general" variant="outline">
      <ProjectItems />
    </Accordion>
  ),
}
export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['general', 'notifications']}>
      <ProjectItems />
    </Accordion>
  ),
}
export const InitiallyClosed: Story = {
  render: () => (
    <Accordion>
      <ProjectItems />
    </Accordion>
  ),
}
export const NonCollapsible: Story = {
  render: () => (
    <Accordion defaultValue="general" collapsible={false}>
      <ProjectItems />
    </Accordion>
  ),
}
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Accordion defaultValue="general">
        <ProjectItems />
        <AccordionItem value="archived" disabled>
          <AccordionTrigger description="已封存，無法操作">舊版設定</AccordionTrigger>
          <AccordionContent>Archived</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion defaultValue="general" disabled variant="outline">
        <ProjectItems />
      </Accordion>
    </div>
  ),
}

function ControlledDemo({ multiple = false }: { multiple?: boolean }) {
  const [single, setSingle] = useState<string | null>('general')
  const [values, setValues] = useState<readonly string[]>(['general'])
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          intent="secondary"
          onClick={() => {
            setSingle(null)
            setValues([])
          }}
        >
          全部收合
        </Button>
        <Button
          intent="secondary"
          onClick={() => {
            setSingle('notifications')
            setValues(['general', 'notifications', 'advanced'])
          }}
        >
          {multiple ? '全部展開' : '展開通知設定'}
        </Button>
      </div>
      <output className="text-xs text-fg-muted">
        value: {JSON.stringify(multiple ? values : single)}
      </output>
      {multiple ? (
        <Accordion type="multiple" value={values} onValueChange={setValues}>
          <ProjectItems />
        </Accordion>
      ) : (
        <Accordion value={single} onValueChange={setSingle}>
          <ProjectItems />
        </Accordion>
      )}
    </div>
  )
}
export const ControlledSingle: Story = { render: () => <ControlledDemo /> }
export const ControlledMultiple: Story = { render: () => <ControlledDemo multiple /> }
export const UnmountOnClose: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'keepMounted=false：收合動畫結束後卸載欄位，再展開會回到預設輸入值。外層面板保留為 aria-controls 目標。',
      },
    },
  },
  render: () => (
    <Accordion defaultValue="general">
      <ProjectItems keepMounted={false} />
    </Accordion>
  ),
}

function DynamicDemo() {
  const [lines, setLines] = useState(1)
  return (
    <Accordion defaultValue="dynamic" variant="outline">
      <AccordionItem value="dynamic">
        <AccordionTrigger description="增加內容、縮放視窗或快速連點標題">
          動態內容高度
        </AccordionTrigger>
        <AccordionContent>
          <div className="mb-4 flex gap-2">
            <Button intent="secondary" onClick={() => setLines((count) => count + 1)}>
              增加一段
            </Button>
            <Button intent="secondary" onClick={() => setLines(1)}>
              重設
            </Button>
          </div>
          {Array.from({ length: lines }, (_, index) => (
            <p key={index} className="mt-0 mb-3 last:mb-0">
              第 {index + 1} 段：展開完成後回到自然高度，文字換行或非同步內容不會被固定高度裁切。
            </p>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
export const DynamicContent: Story = { render: () => <DynamicDemo /> }
export const LongLabels: Story = {
  render: () => (
    <div className="w-80 max-w-full">
      <Accordion variant="outline">
        <AccordionItem value="long">
          <AccordionTrigger description="這段說明也會換行，箭頭保持對齊標題第一行。">
            在較窄的畫面中設定跨環境通知與專案相關的詳細資訊
          </AccordionTrigger>
          <AccordionContent>內文會依可用寬度自然換行。</AccordionContent>
        </AccordionItem>
        <AccordionItem value="identifier">
          <AccordionTrigger>
            payment-service-production-notification-settings-with-a-very-long-identifier
          </AccordionTrigger>
          <AccordionContent>長字串不會把容器撐寬。</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}
export const Nested: Story = {
  render: () => (
    <Accordion defaultValue="channels">
      <AccordionItem value="channels">
        <AccordionTrigger>通知管道</AccordionTrigger>
        <AccordionContent>
          <Accordion headingLevel={4} variant="outline">
            <AccordionItem value="email">
              <AccordionTrigger>電子郵件</AccordionTrigger>
              <AccordionContent>
                <Input label="收件信箱" type="email" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="inbox">
              <AccordionTrigger>站內通知</AccordionTrigger>
              <AccordionContent>子層的方向鍵只移動子層標題。</AccordionContent>
            </AccordionItem>
          </Accordion>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="schedule">
        <AccordionTrigger>通知時段</AccordionTrigger>
        <AccordionContent>父層與子層的展開狀態互不影響。</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

function RemovableDemo() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="flex flex-col gap-4">
      <Button intent="secondary" onClick={() => setVisible(!visible)}>
        {visible ? '移除第一項' : '加回第一項'}
      </Button>
      <Accordion defaultValue="temporary">
        {visible && (
          <AccordionItem value="temporary">
            <AccordionTrigger>暫時項目</AccordionTrigger>
            <AccordionContent>
              <Input label="草稿" />
              <Button className="mt-3" intent="secondary" onClick={() => setVisible(false)}>
                從內容移除此項
              </Button>
            </AccordionContent>
          </AccordionItem>
        )}
        <AccordionItem value="permanent">
          <AccordionTrigger>保留項目</AccordionTrigger>
          <AccordionContent>
            移除焦點所在項目後，焦點移到可用的鄰近標題。加回項目不會復活原本的展開狀態。
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
export const RemoveFocusedItem: Story = { render: () => <RemovableDemo /> }

function FormDemo() {
  const [value, setValue] = useState<string | null>('project')
  const [errorField, setErrorField] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState('')
  const pendingFocus = useRef<HTMLInputElement | null>(null)
  useLayoutEffect(() => {
    pendingFocus.current?.focus()
    pendingFocus.current = null
  })
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const form = event.currentTarget
        const invalid = form.querySelector<HTMLInputElement>('input:invalid')
        if (invalid) {
          pendingFocus.current = invalid
          setValue(invalid.name === 'email' ? 'contact' : 'project')
          setErrorField(invalid.name)
          setSubmitted(`請填寫${invalid.name === 'email' ? '有效的通知信箱' : '專案名稱'}。`)
          if (!invalid.closest('[hidden], [inert]')) {
            invalid.focus()
            pendingFocus.current = null
          }
          return
        }
        setErrorField(null)
        setSubmitted(JSON.stringify(Object.fromEntries(new FormData(form))))
      }}
    >
      <Accordion value={value} onValueChange={setValue}>
        <AccordionItem value="project">
          <AccordionTrigger>專案資訊</AccordionTrigger>
          <AccordionContent>
            <Input
              label="專案名稱"
              name="project"
              required
              defaultValue="Payment API"
              error={errorField === 'project' ? '請填寫專案名稱。' : undefined}
              onChange={() => setErrorField(null)}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="contact">
          <AccordionTrigger>通知對象</AccordionTrigger>
          <AccordionContent>
            <Input
              label="通知信箱"
              name="email"
              type="email"
              required
              error={errorField === 'email' ? '請填寫有效的通知信箱。' : undefined}
              onChange={() => setErrorField(null)}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Button type="submit" className="self-start">
        儲存設定
      </Button>
      <p className="m-0 text-xs text-fg-muted">
        先按儲存：應自動展開通知對象並聚焦錯誤欄位。收合欄位仍保留在提交資料中。
      </p>
      <output aria-live="polite" className="text-sm text-fg-muted">
        {submitted}
      </output>
    </form>
  )
}
export const FormValidation: Story = { render: () => <FormDemo /> }

function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>開啟專案設定</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="專案設定" />
        <DialogBody>
          <Accordion defaultValue="general">
            <ProjectItems />
          </Accordion>
        </DialogBody>
      </Dialog>
    </>
  )
}
export const InsideDialog: Story = { render: () => <DialogDemo /> }
export const WarmTokens: Story = {
  render: () => (
    <div
      style={
        {
          '--color-surface': 'light-dark(#fffaf0, #28231f)',
          '--color-fg': 'light-dark(#3b3027, #f3e5d6)',
          '--color-fg-muted': 'light-dark(#756455, #c0ac98)',
          '--color-input-border': 'light-dark(#c3ac94, #76624f)',
          '--color-focus': 'light-dark(#a15a27, #e4a46e)',
        } as CSSProperties
      }
    >
      <Accordion variant="outline" defaultValue="general">
        <ProjectItems />
      </Accordion>
    </div>
  ),
}
export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '開啟系統「減少動態效果」（或 DevTools 的 prefers-reduced-motion: reduce）。展開、收合與箭頭應立即切換；收合內容仍正確 hidden / inert。也可在動畫途中切換此偏好。',
      },
    },
  },
  render: () => <DynamicDemo />,
}
