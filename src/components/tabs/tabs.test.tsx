import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { FakeLink, FakeOutlet, FakeRouter } from '../../test/fake-router'
import { Badge } from '../badge'
import { TabNav, TabNavLink } from './tab-nav'
import { Tab, TabList, TabPanel, Tabs, type TabsActivationMode } from './tabs'

type DemoProps = {
  activationMode?: TabsActivationMode
  keepMounted?: boolean
  onValueChange?: (value: string) => void
  disabled?: string
}

function Demo({ activationMode, keepMounted, onValueChange, disabled }: DemoProps) {
  return (
    <Tabs
      aria-label="Application"
      defaultValue="overview"
      activationMode={activationMode}
      onValueChange={onValueChange}
    >
      <TabList>
        {['overview', 'resources', 'activity', 'settings'].map((value) => (
          <Tab key={value} value={value} disabled={value === disabled}>
            {value[0].toUpperCase() + value.slice(1)}
          </Tab>
        ))}
      </TabList>
      {['overview', 'resources', 'activity', 'settings'].map((value) => (
        <TabPanel key={value} value={value} keepMounted={keepMounted}>
          {value} panel
        </TabPanel>
      ))}
    </Tabs>
  )
}

const tab = (name: string) => screen.getByRole('tab', { name })

describe('Tabs', () => {
  it('wires tablist, tabs and panel together', () => {
    render(<Demo />)
    const list = screen.getByRole('tablist', { name: 'Application' })
    expect(within(list).getAllByRole('tab')).toHaveLength(4)

    const overview = tab('Overview')
    const panel = screen.getByRole('tabpanel', { name: 'Overview' })
    expect(overview).toHaveAttribute('aria-selected', 'true')
    expect(overview).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', overview.id)
    expect(panel).toHaveAttribute('tabindex', '0')
    expect(tab('Resources')).toHaveAttribute('aria-selected', 'false')
  })

  it('uses a roving tabindex: only the selected tab is in the Tab order', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    expect(tab('Overview')).toHaveAttribute('tabindex', '0')
    expect(tab('Resources')).toHaveAttribute('tabindex', '-1')

    await user.tab()
    expect(tab('Overview')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('renders only the selected panel by default', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(1)
    expect(screen.queryByText('resources panel')).toBeNull()

    await user.click(tab('Resources'))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('resources panel')
    expect(screen.queryByText('overview panel')).toBeNull()
  })

  it('keeps unselected panels mounted but hidden with keepMounted', async () => {
    const user = userEvent.setup()
    render(<Demo keepMounted />)
    const panels = screen.getAllByRole('tabpanel', { hidden: true })
    expect(panels).toHaveLength(4)
    expect(panels.filter((p) => p.hidden)).toHaveLength(3)

    await user.click(tab('Activity'))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('activity panel')
    expect(screen.getByText('overview panel')).not.toBeVisible()
  })

  it('selects on click when uncontrolled and reports the change', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Demo onValueChange={onValueChange} />)

    await user.click(tab('Resources'))
    expect(tab('Resources')).toHaveAttribute('aria-selected', 'true')
    expect(onValueChange).toHaveBeenCalledWith('resources')

    // Re-selecting the current tab is not a change
    await user.click(tab('Resources'))
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('follows `value` when controlled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Tabs aria-label="Views" value="yaml" onValueChange={onValueChange}>
        <TabList>
          <Tab value="yaml">YAML</Tab>
          <Tab value="diff">Diff</Tab>
        </TabList>
      </Tabs>,
    )

    await user.click(tab('Diff'))
    expect(onValueChange).toHaveBeenCalledWith('diff')
    expect(tab('YAML')).toHaveAttribute('aria-selected', 'true')

    rerender(
      <Tabs aria-label="Views" value="diff" onValueChange={onValueChange}>
        <TabList>
          <Tab value="yaml">YAML</Tab>
          <Tab value="diff">Diff</Tab>
        </TabList>
      </Tabs>,
    )
    expect(tab('Diff')).toHaveAttribute('aria-selected', 'true')
  })

  it('works as a controlled pair with state', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState('a')
      return (
        <Tabs aria-label="Pair" value={value} onValueChange={setValue}>
          <TabList>
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
          <TabPanel value="a">first</TabPanel>
          <TabPanel value="b">second</TabPanel>
        </Tabs>
      )
    }
    render(<Controlled />)
    await user.click(tab('B'))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('second')
  })

  it('automatic: arrow keys move focus and select, wrapping at both ends', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.tab()

    await user.keyboard('{ArrowRight}')
    expect(tab('Resources')).toHaveFocus()
    expect(tab('Resources')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('resources panel')

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(tab('Settings')).toHaveFocus()
    expect(tab('Settings')).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowRight}')
    expect(tab('Overview')).toHaveFocus()
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
  })

  it('Home and End jump to the first and last tab', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.tab()

    await user.keyboard('{End}')
    expect(tab('Settings')).toHaveFocus()
    expect(tab('Settings')).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(tab('Overview')).toHaveFocus()
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
  })

  it('manual: arrows only move focus, Enter and Space select', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Demo activationMode="manual" onValueChange={onValueChange} />)
    await user.tab()

    await user.keyboard('{ArrowRight}')
    expect(tab('Resources')).toHaveFocus()
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
    expect(onValueChange).not.toHaveBeenCalled()
    // The selected tab keeps tabindex=0 so Tab still lands where the selection is
    expect(tab('Overview')).toHaveAttribute('tabindex', '0')

    await user.keyboard('{Enter}')
    expect(tab('Resources')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('resources panel')

    await user.keyboard('{End}')
    expect(tab('Settings')).toHaveFocus()
    expect(tab('Resources')).toHaveAttribute('aria-selected', 'true')
    await user.keyboard(' ')
    expect(tab('Settings')).toHaveAttribute('aria-selected', 'true')
  })

  it('skips disabled tabs with the keyboard and ignores clicks on them', async () => {
    const user = userEvent.setup()
    render(<Demo disabled="resources" />)
    expect(tab('Resources')).toBeDisabled()

    await user.click(tab('Resources'))
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')

    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(tab('Activity')).toHaveFocus()
    expect(tab('Activity')).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowLeft}')
    expect(tab('Overview')).toHaveFocus()
  })

  it('names each tab once: the bold sizer copy and the icon are hidden, the badge is not', () => {
    render(
      <Tabs aria-label="Application" defaultValue="overview">
        <TabList>
          <Tab value="overview" icon={<svg data-testid="icon" />}>
            Overview
          </Tab>
          <Tab value="resources" badge={<Badge size="sm">12</Badge>}>
            Resources
          </Tab>
        </TabList>
      </Tabs>,
    )
    // Exact names: a duplicated label would read "Overview Overview"
    const overview = tab('Overview')
    const resources = tab('Resources 12')

    const iconSlot = screen.getByTestId('icon').closest('[data-slot="tab-icon"]')
    expect(iconSlot).toHaveAttribute('aria-hidden', 'true')

    for (const el of [overview, resources]) {
      const sizer = el.querySelector('[data-slot="tab-label-sizer"]')
      expect(sizer).toHaveAttribute('aria-hidden', 'true')
      expect(sizer).toHaveClass('invisible', 'font-medium')
      expect(sizer?.querySelector('[data-slot="badge"]')).toBeNull()
    }
    expect(resources.querySelector('[data-slot="tab-badge"] [data-slot="badge"]')).not.toBeNull()
  })

  it('places one indicator per list from measured boxes and moves it on selection', async () => {
    const user = userEvent.setup()
    // jsdom has no layout: give every tab a box 100px apart, by its position in its list, in a
    // list wide enough that revealing the selected tab never scrolls
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000)
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const item = this.closest('[data-slot="tab"]')
      const list = item?.closest('[data-slot="tab-list"]')
      const index = item && list ? [...list.querySelectorAll('[data-slot="tab"]')].indexOf(item) : 0
      return DOMRect.fromRect({ x: item ? index * 100 + 12 : 0, y: 8, width: 80, height: 32 })
    })
    render(
      <>
        <Demo />
        <Tabs aria-label="Second" defaultValue="b" variant="segmented">
          <TabList>
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
        </Tabs>
      </>,
    )
    const [first, second] = screen.getAllByRole('tablist')
    const x = (list: HTMLElement) =>
      Number.parseFloat(list.style.getPropertyValue('--tabs-indicator-x'))
    expect(first).toHaveAttribute('data-indicator')
    expect(second).toHaveAttribute('data-indicator')
    // Line: the bar spans the label plus 2px each side; segmented: the knob fills the item
    expect(first.style.getPropertyValue('--tabs-indicator-w')).toBe('84px')
    expect(second.style.getPropertyValue('--tabs-indicator-w')).toBe('80px')
    expect(first).not.toHaveAttribute('data-instant')
    const start = x(first)
    const other = x(second)
    expect(start).toBe(10)
    expect(other).toBe(112)

    await user.click(tab('Activity'))
    await waitFor(() => expect(x(first)).toBe(start + 200))
    await user.click(tab('Overview'))
    await waitFor(() => expect(x(first)).toBe(start))
    // The other instance never moved
    expect(x(second)).toBe(other)
    vi.restoreAllMocks()
  })

  it('line: the hover pill appears in place, follows the pointer and fades on leaving the bar', () => {
    render(<Demo disabled="settings" />)
    const list = screen.getByRole('tablist')
    expect(list).not.toHaveAttribute('data-hover')

    fireEvent.pointerMove(tab('Resources'), { pointerType: 'mouse' })
    expect(list).toHaveAttribute('data-hover')
    // First entry snaps (opacity only)...
    expect(list).toHaveAttribute('data-hover-enter')
    fireEvent.pointerMove(tab('Activity'), { pointerType: 'mouse' })
    // ...moving on glides
    expect(list).toHaveAttribute('data-hover')
    expect(list).not.toHaveAttribute('data-hover-enter')
    // A disabled tab keeps the pill where it was
    const before = list.style.getPropertyValue('--tabs-hover-x')
    fireEvent.pointerMove(tab('Settings'), { pointerType: 'mouse' })
    expect(list).toHaveAttribute('data-hover')
    expect(list.style.getPropertyValue('--tabs-hover-x')).toBe(before)
    // Touch never shows it
    fireEvent.pointerLeave(list)
    expect(list).not.toHaveAttribute('data-hover')
    fireEvent.pointerMove(tab('Overview'), { pointerType: 'touch' })
    expect(list).not.toHaveAttribute('data-hover')
    fireEvent.pointerMove(tab('Overview'), { pointerType: 'mouse' })
    expect(list).toHaveAttribute('data-hover-enter')
  })

  it('fades each edge over the distance left to scroll toward it, up to 24px', () => {
    render(<Demo />)
    const list = screen.getByRole('tablist')
    const fades = () => [
      list.style.getPropertyValue('--tabs-fade-left'),
      list.style.getPropertyValue('--tabs-fade-right'),
    ]
    // jsdom has no layout: nothing overflows
    expect(fades()).toEqual(['0px', '0px'])

    // 100px of overflow
    Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 400 })
    Object.defineProperty(list, 'clientWidth', { configurable: true, value: 300 })
    const scrollTo = (left: number) => {
      Object.defineProperty(list, 'scrollLeft', { configurable: true, value: left })
      fireEvent.scroll(list)
    }
    scrollTo(0)
    expect(fades()).toEqual(['0px', '24px'])
    // Rounded to whole pixels
    scrollTo(10.4)
    expect(fades()).toEqual(['10px', '24px'])
    scrollTo(50)
    expect(fades()).toEqual(['24px', '24px'])
    scrollTo(88)
    expect(fades()).toEqual(['24px', '12px'])
    scrollTo(100)
    expect(fades()).toEqual(['24px', '0px'])

    // RTL: scrollLeft runs from 0 (right end) to -100 (left end)
    list.style.direction = 'rtl'
    scrollTo(0)
    expect(fades()).toEqual(['24px', '0px'])
    scrollTo(-90)
    expect(fades()).toEqual(['10px', '24px'])
  })

  it('segmented: no hover pill', async () => {
    const user = userEvent.setup()
    render(
      <Tabs aria-label="View" defaultValue="a" variant="segmented">
        <TabList>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
      </Tabs>,
    )
    await user.hover(tab('B'))
    expect(screen.getByRole('tablist')).not.toHaveAttribute('data-hover')
  })
})

const pages = {
  '/': 'Overview page',
  '/resources': 'Resources page',
  '/activity': 'Activity page',
}

function renderNav(initialPath = '/', onNavigate?: (to: string) => void) {
  render(
    <FakeRouter initialPath={initialPath} onNavigate={onNavigate}>
      <TabNav aria-label="Application sections">
        <TabNavLink asChild>
          <FakeLink to="/">Overview</FakeLink>
        </TabNavLink>
        <TabNavLink asChild badge={<Badge size="sm">12</Badge>}>
          <FakeLink to="/resources">Resources</FakeLink>
        </TabNavLink>
        <TabNavLink asChild>
          <FakeLink to="/activity">Activity</FakeLink>
        </TabNavLink>
        <TabNavLink asChild>
          <FakeLink to="/billing" disabled>
            Billing
          </FakeLink>
        </TabNavLink>
      </TabNav>
      <FakeOutlet pages={pages} />
    </FakeRouter>,
  )
}

describe('TabNav', () => {
  it('is a labelled nav of links, the current one marked aria-current="page"', () => {
    renderNav('/resources')
    const nav = screen.getByRole('navigation', { name: 'Application sections' })
    expect(within(nav).getAllByRole('listitem')).toHaveLength(4)

    const resources = within(nav).getByRole('link', { name: 'Resources 12' })
    expect(resources).toHaveAttribute('href', '/resources')
    expect(resources).toHaveAttribute('aria-current', 'page')
    expect(resources).toHaveAttribute('data-slot', 'tab')
    expect(resources.className).toContain('aria-[current=page]:text-fg')
    expect(within(nav).getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
    expect(nav.querySelector('[role="tab"], [role="tablist"]')).toBeNull()
  })

  it('moves aria-current when a link is followed', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    renderNav('/', onNavigate)
    const overview = screen.getByRole('link', { name: 'Overview' })
    expect(overview).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Overview page')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Activity' }))
    expect(await screen.findByText('Activity page')).toBeInTheDocument()
    expect(onNavigate).toHaveBeenCalledWith('/activity')
    expect(screen.getByRole('link', { name: 'Activity' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })

  it('moves its indicator with aria-current and shows the hover pill', async () => {
    const user = userEvent.setup()
    renderNav('/')
    const nav = screen.getByRole('navigation')
    const list = within(nav).getByRole('list')
    expect(list).toHaveAttribute('data-indicator')
    await user.hover(screen.getByRole('link', { name: 'Activity' }))
    expect(list).toHaveAttribute('data-hover')
    await user.click(screen.getByRole('link', { name: 'Activity' }))
    await screen.findByText('Activity page')
    expect(list.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Activity' })).toHaveAttribute('aria-current', 'page')
  })

  it('skips an aria-disabled link for the hover pill', () => {
    renderNav('/')
    const list = within(screen.getByRole('navigation')).getByRole('list')
    const billing = list.querySelector('a[aria-disabled]') as HTMLElement
    expect(billing).toHaveAttribute('aria-disabled', 'true')
    fireEvent.pointerMove(billing, { pointerType: 'mouse' })
    expect(list).not.toHaveAttribute('data-hover')
  })

  it('leaves links in the normal Tab order (no roving tabindex)', async () => {
    const user = userEvent.setup()
    renderNav('/')
    await user.tab()
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Resources 12' })).toHaveFocus()
  })

  it('renders a plain <a> without asChild', () => {
    render(
      <TabNav aria-label="Sections">
        <TabNavLink href="/a" aria-current="page">
          A
        </TabNavLink>
        <TabNavLink href="/b">B</TabNavLink>
      </TabNav>,
    )
    const a = screen.getByRole('link', { name: 'A' })
    expect(a).toHaveAttribute('href', '/a')
    expect(a).toHaveAttribute('data-slot', 'tab')
    expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(2)
    expect(screen.getByRole('list')).toHaveAttribute('data-indicator')
  })
})
