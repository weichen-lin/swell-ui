import type { Meta, StoryObj } from '@storybook/react-vite'
import { Search } from 'lucide-react'
import { Button } from '../src/components/button'
import { Combobox, type ComboboxOption } from '../src/components/combobox'
import { Input, SearchInput } from '../src/components/input'
import { Select } from '../src/components/select'

const meta = {
  title: 'Theme/Control density',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const clusters = [
  { value: 'prd-1', label: 'prd-1' },
  { value: 'stg-1', label: 'stg-1' },
]
const projects: ComboboxOption[] = [
  { value: 'payment-api', label: 'payment-api' },
  { value: 'wallet', label: 'wallet' },
]

function Row() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Deploy</Button>
      <Button intent="secondary" iconLeft={<Search />}>
        Filter
      </Button>
      <Input label="Name" className="w-44" />
      <SearchInput aria-label="Search" className="w-44" />
      <Select label="Cluster" options={clusters} className="w-40" />
      <Combobox label="Project" options={projects} className="w-44" />
    </div>
  )
}

/**
 * Every control height comes from `--spacing-control-sm|md|lg`. Overriding the variable on a
 * container shrinks every Button, Input, Select and Combobox inside it, no per-component props.
 */
export const DenseRegion: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-fg-muted">Default (38px at md)</h3>
        <Row />
      </section>
      <section className="flex flex-col gap-3 [--spacing-control-md:2rem]">
        <h3 className="text-sm font-medium text-fg-muted">
          Dense: className=&quot;[--spacing-control-md:2rem]&quot; (32px at md)
        </h3>
        <Row />
      </section>
    </div>
  ),
}
