import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { FakeLink, FakeOutlet, FakeRouter } from '../../test/fake-router'
import {
  Sidebar,
  SidebarBadge,
  SidebarBody,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarIcon,
  SidebarItem,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar'

/*
 * jsdom has HTMLDialogElement but no showModal()/close(). Stand-ins that follow the platform
 * steps the drawer relies on: showModal() remembers the focused element and focuses the first
 * focusable inside, close() restores that focus and fires `close`. No animations, so the
 * Dialog's exit closes right away.
 */
const proto = HTMLDialogElement.prototype
const original = {
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  showModal: proto.showModal,
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  close: proto.close,
  // oxlint-disable-next-line typescript/unbound-method -- saved only to put back on the prototype in afterAll
  getAnimations: Element.prototype.getAnimations,
}
const previouslyFocused = new WeakMap<HTMLDialogElement, Element | null>()
const focusable = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]'

beforeAll(() => {
  proto.showModal = function (this: HTMLDialogElement) {
    if (this.open) throw new DOMException('Dialog is already open', 'InvalidStateError')
    previouslyFocused.set(this, document.activeElement)
    this.setAttribute('open', '')
    this.querySelector<HTMLElement>(focusable)?.focus()
  }
  proto.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.removeAttribute('open')
    ;(previouslyFocused.get(this) as HTMLElement | null)?.focus()
    this.dispatchEvent(new Event('close'))
  }
  Element.prototype.getAnimations = () => []
})

afterAll(() => {
  proto.showModal = original.showModal
  proto.close = original.close
  Element.prototype.getAnimations = original.getAnimations
})

const pages = {
  '/projects': 'Projects page',
  '/members': 'Members page',
  '/tokens': 'Tokens page',
}

function renderSidebar(initialPath = '/projects', onNavigate?: (to: string) => void) {
  render(
    <FakeRouter initialPath={initialPath} onNavigate={onNavigate}>
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar aria-label="Main">
          <SidebarHeader>
            <span>Swell</span>
          </SidebarHeader>
          <SidebarBody>
            <SidebarGroup>
              <SidebarItem asChild>
                <FakeLink to="/projects">
                  <SidebarIcon>
                    <svg data-testid="icon" />
                  </SidebarIcon>
                  Projects
                  <SidebarBadge>8</SidebarBadge>
                </FakeLink>
              </SidebarItem>
            </SidebarGroup>
            <SidebarGroup label="Settings">
              <SidebarItem asChild>
                <FakeLink to="/members">Members</FakeLink>
              </SidebarItem>
              <SidebarItem asChild>
                <FakeLink to="/tokens">Tokens</FakeLink>
              </SidebarItem>
            </SidebarGroup>
          </SidebarBody>
          <SidebarFooter>v0.1</SidebarFooter>
        </Sidebar>
        <FakeOutlet pages={pages} />
      </SidebarProvider>
    </FakeRouter>,
  )
}

const trigger = () => screen.getByRole('button', { name: 'Open navigation' })
const drawer = () => document.querySelector('dialog') as HTMLDialogElement

async function openDrawer() {
  const user = userEvent.setup()
  renderSidebar()
  await screen.findByRole('navigation', { name: 'Main' })
  await user.click(trigger())
  expect(drawer()).toHaveAttribute('open')
  return user
}

function pressEscape(dialog: HTMLDialogElement) {
  // What the browser fires on Esc for a modal dialog
  act(() => {
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
  })
}

describe('Sidebar', () => {
  it('is a labelled nav of grouped lists of links', async () => {
    renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav.tagName).toBe('NAV')
    expect(within(nav).getAllByRole('list')).toHaveLength(2)
    expect(within(nav).getAllByRole('listitem')).toHaveLength(3)
    // Badge joins the name with a space; the icon is hidden
    const projects = within(nav).getByRole('link', { name: 'Projects 8' })
    expect(projects).toHaveAttribute('href', '/projects')
    expect(within(projects).getByTestId('icon').parentElement).toHaveAttribute('aria-hidden')
    // The label is the truncating span; icon and badge sit beside it
    expect(within(projects).getByText('Projects')).toHaveClass('truncate')
  })

  it('names a group by its label and leaves an unlabelled one unnamed', async () => {
    renderSidebar()
    const nav = await screen.findByRole('navigation', { name: 'Main' })
    const settings = within(nav).getByRole('list', { name: 'Settings' })
    expect(
      within(settings)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Members', 'Tokens'])
    const label = nav.querySelector('[data-slot="sidebar-group-label"]') as HTMLElement
    expect(settings).toHaveAttribute('aria-labelledby', label.id)
    const [first] = within(nav).getAllByRole('list')
    expect(first).not.toHaveAttribute('aria-labelledby')
  })

  it('keeps the link aria-current="page" and moves it on navigation', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    renderSidebar('/members', onNavigate)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const members = within(nav).getByRole('link', { name: 'Members' })
    expect(members).toHaveAttribute('aria-current', 'page')
    // Styled from aria-current itself: no selected flag computed from props
    expect(members).not.toHaveAttribute('data-selected')
    expect(members.className).toContain('[&:where([aria-current=page]:not(:active))]:bg-fg/8')
    expect(within(nav).getByRole('link', { name: 'Projects 8' })).not.toHaveAttribute(
      'aria-current',
    )

    await user.click(within(nav).getByRole('link', { name: 'Tokens' }))
    expect(await screen.findByText('Tokens page')).toBeInTheDocument()
    expect(onNavigate).toHaveBeenCalledWith('/tokens')
    expect(within(nav).getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(members).not.toHaveAttribute('aria-current')
  })

  it('merges its props, classes and ref into the asChild link', () => {
    const ref = createRef<HTMLAnchorElement>()
    const onClick = vi.fn()
    render(
      <FakeRouter initialPath="/">
        <SidebarProvider>
          <Sidebar aria-label="Main">
            <SidebarBody>
              <SidebarGroup>
                <SidebarItem asChild ref={ref} className="extra" onClick={onClick} title="Go">
                  <FakeLink to="/a" className="own" style={{ color: 'red' }}>
                    A
                  </FakeLink>
                </SidebarItem>
              </SidebarGroup>
            </SidebarBody>
          </Sidebar>
        </SidebarProvider>
      </FakeRouter>,
    )
    const link = screen.getByRole('link', { name: 'A' })
    expect(link.tagName).toBe('A')
    expect(ref.current).toBe(link)
    expect(link).toHaveAttribute('data-slot', 'sidebar-item')
    expect(link).toHaveAttribute('title', 'Go')
    expect(link).toHaveAttribute('href', '/a')
    expect(link).toHaveClass('extra', 'own', 'h-9')
    expect(link).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    fireEvent.click(link)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders a plain <a> without asChild', () => {
    render(
      <SidebarProvider>
        <Sidebar aria-label="Main">
          <SidebarBody>
            <SidebarGroup>
              <SidebarItem href="/home" aria-current="page">
                <SidebarIcon>
                  <svg />
                </SidebarIcon>
                Home
                <SidebarBadge>3</SidebarBadge>
              </SidebarItem>
              <SidebarItem href="/about">About</SidebarItem>
            </SidebarGroup>
          </SidebarBody>
        </Sidebar>
      </SidebarProvider>,
    )
    const home = screen.getByRole('link', { name: 'Home 3' })
    expect(home).toHaveAttribute('href', '/home')
    expect(home).toHaveAttribute('aria-current', 'page')
    expect(home).toHaveAttribute('data-slot', 'sidebar-item')
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current')
  })

  it('wires the trigger to the drawer and toggles aria-expanded', async () => {
    renderSidebar()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveAttribute('aria-controls', drawer().id)
    expect(drawer()).not.toHaveAttribute('open')
    // Closed drawer renders no second copy of the content
    expect(screen.getAllByRole('navigation')).toHaveLength(1)

    await userEvent.setup().click(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(drawer()).toHaveAccessibleName('Main')
    expect(within(drawer()).getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('moves focus into the drawer and returns it to the trigger after Esc', async () => {
    await openDrawer()
    expect(drawer()).toContainElement(document.activeElement as HTMLElement)
    expect(document.activeElement).toBe(
      within(drawer()).getByRole('button', { name: 'Close navigation' }),
    )

    pressEscape(drawer())
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveFocus()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('navigation')).toHaveLength(1)
  })

  it('closes on a backdrop click', async () => {
    await openDrawer()
    fireEvent.pointerDown(drawer())
    fireEvent.click(drawer())
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveFocus()
  })

  it('closes from the close button', async () => {
    const user = await openDrawer()
    await user.click(within(drawer()).getByRole('button', { name: 'Close navigation' }))
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveFocus()
  })

  it('closes after following an item, and the route changes', async () => {
    const user = await openDrawer()
    await user.click(within(drawer()).getByRole('link', { name: 'Members' }))
    expect(await screen.findByText('Members page')).toBeInTheDocument()
    await waitFor(() => expect(drawer()).not.toHaveAttribute('open'))
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('stays open after a click the link leaves to the browser (new tab)', async () => {
    await openDrawer()
    const members = within(drawer()).getByRole('link', { name: 'Members' })
    // Stops jsdom's navigation only after React has seen the click; the browser opens a new tab here
    const stop = (e: Event) => e.preventDefault()
    document.addEventListener('click', stop)
    fireEvent.click(members, { metaKey: true })
    document.removeEventListener('click', stop)
    expect(drawer()).toHaveAttribute('open')
    expect(screen.getByText('Projects page')).toBeInTheDocument()
  })

  it('keeps the docked sidebar open-agnostic: following its items never opens the drawer', async () => {
    const user = userEvent.setup()
    renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('link', { name: 'Members' }))
    expect(await screen.findByText('Members page')).toBeInTheDocument()
    expect(drawer()).not.toHaveAttribute('open')
  })

  it('hover pill: appears in place, follows the pointer, stays over gaps, fades on leaving', async () => {
    renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const body = nav.querySelector('[data-slot="sidebar-body"]') as HTMLElement
    const link = (name: string) => within(nav).getByRole('link', { name })
    expect(body).not.toHaveAttribute('data-hover')

    fireEvent.pointerMove(link('Members'), { pointerType: 'mouse' })
    expect(body).toHaveAttribute('data-hover')
    // First entry snaps (opacity only)...
    expect(body).toHaveAttribute('data-hover-enter')
    fireEvent.pointerMove(link('Tokens'), { pointerType: 'mouse' })
    // ...moving on glides
    expect(body).toHaveAttribute('data-hover')
    expect(body).not.toHaveAttribute('data-hover-enter')
    // A group label is a gap: the pill stays where it was
    const before = body.style.getPropertyValue('--sidebar-hover-y')
    fireEvent.pointerMove(within(nav).getByText('Settings'), { pointerType: 'mouse' })
    expect(body).toHaveAttribute('data-hover')
    expect(body.style.getPropertyValue('--sidebar-hover-y')).toBe(before)

    fireEvent.pointerLeave(body)
    expect(body).not.toHaveAttribute('data-hover')
    // Touch never shows it
    fireEvent.pointerMove(link('Members'), { pointerType: 'touch' })
    expect(body).not.toHaveAttribute('data-hover')
  })

  it('needs a SidebarProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Sidebar aria-label="Main" />)).toThrow(/SidebarProvider/)
    vi.restoreAllMocks()
  })
})

describe('SidebarTrigger icon', () => {
  it('replaces the menu icon', () => {
    render(
      <SidebarProvider>
        <SidebarTrigger icon={<svg data-testid="custom" />} />
        <Sidebar aria-label="Main">
          <SidebarBody />
        </Sidebar>
      </SidebarProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Open navigation', hidden: true })
    expect(trigger).toContainElement(screen.getByTestId('custom'))
    expect(trigger.querySelector('[data-icon="menu"]')).toBeNull()
  })
})

describe('SidebarTrigger icon fallback', () => {
  it.each([false, null])('icon={%s} keeps the menu icon', (hidden) => {
    render(
      <SidebarProvider>
        <SidebarTrigger icon={hidden} />
        <Sidebar aria-label="Main">
          <SidebarBody />
        </Sidebar>
      </SidebarProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Open navigation', hidden: true })
    expect(trigger.querySelector('[data-icon="menu"]')).not.toBeNull()
  })
})
