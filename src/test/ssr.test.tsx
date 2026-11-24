// @vitest-environment node
import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vite-plus/test'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Badge,
  Button,
  Checkbox,
  Combobox,
  CopyInput,
  Dialog,
  DialogBody,
  DialogHeader,
  Drawer,
  DrawerBody,
  DrawerHeader,
  Input,
  PasswordInput,
  SearchInput,
  Select,
  Slider,
  Switch,
  Tab,
  Table,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  ThemeSwitcher,
  Toaster,
  Tooltip,
} from '../index'

const noop = () => {}

// Server rendering from the package entry: no component may touch window/document during render
const cases: [string, ReactElement][] = [
  [
    'Button',
    <Button key="b" loading>
      Save
    </Button>,
  ],
  [
    'Dialog',
    <Dialog key="d" open onOpenChange={noop}>
      <DialogHeader title="Sync app" />
      <DialogBody>Body</DialogBody>
    </Dialog>,
  ],
  [
    'Drawer',
    <Drawer key="dr" open onOpenChange={noop}>
      <DrawerHeader title="Filters" />
      <DrawerBody>Body</DrawerBody>
    </Drawer>,
  ],
  [
    'Select',
    <Select key="s" label="Region" options={[{ value: 'tw', label: 'Taiwan' }]} error="Pick one" />,
  ],
  [
    'Combobox',
    <Combobox
      key="c"
      label="Service"
      defaultOpen
      defaultValue="api"
      options={[{ value: 'api', label: 'Payment API' }]}
    />,
  ],
  [
    'Tooltip',
    <Tooltip key="t" content="Sync from Git">
      <button type="button">Sync</button>
    </Tooltip>,
  ],
  ['Toaster', <Toaster key="to" />],
  ['ThemeSwitcher', <ThemeSwitcher key="th" value="system" onChange={noop} />],
  [
    'Tabs',
    <Tabs key="ta" aria-label="Views" defaultValue="yaml">
      <TabList>
        <Tab value="yaml">YAML</Tab>
        <Tab value="diff">Diff</Tab>
      </TabList>
      <TabPanel value="yaml">YAML panel</TabPanel>
      <TabPanel value="diff">Diff panel</TabPanel>
    </Tabs>,
  ],
  [
    'Accordion',
    <Accordion key="a" defaultValue="general">
      <AccordionItem value="general">
        <AccordionTrigger>General</AccordionTrigger>
        <AccordionContent>Body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  ],
  ['Alert', <Alert key="al" tone="warning" title="Heads up" onDismiss={noop} />],
  [
    'Badge',
    <Badge key="ba" busy>
      Syncing
    </Badge>,
  ],
  ['Checkbox', <Checkbox key="cb" label="Prune" error="Required" />],
  ['Switch', <Switch key="sw" label="Auto sync" loading />],
  ['Input', <Input key="in" label="Name" validating error="Taken" />],
  ['SearchInput', <SearchInput key="si" aria-label="Search" defaultValue="api" />],
  ['PasswordInput', <PasswordInput key="pi" label="Password" />],
  ['CopyInput', <CopyInput key="ci" label="SHA" value="3f9c2a1" />],
  ['Textarea', <Textarea key="tx" label="Notes" autoResize />],
  ['Slider', <Slider key="sl" label="Volume" defaultValue={40} />],
  [
    'Table',
    <Table
      key="tb"
      title="Deployments"
      data={[{ id: 'api' }]}
      columns={[{ id: 'service', header: 'Service', cell: (row) => row.id, sortable: true }]}
      getRowId={(row) => row.id}
      sorting={{ value: null, onChange: noop }}
      pagination={{ pageIndex: 0, pageSize: 10, rowCount: 1, onPageChange: noop }}
    />,
  ],
]

test.each(cases)('%s renders on the server', (_, ui) => {
  expect(typeof document).toBe('undefined')
  expect(typeof renderToString(ui)).toBe('string')
})

test('the built-in icons render as inline SVG on the server', () => {
  const html = renderToString(<Button loading>Save</Button>)
  expect(html).toContain('data-icon="loader-circle"')
  expect(html).toContain('viewBox="0 0 24 24"')
})
