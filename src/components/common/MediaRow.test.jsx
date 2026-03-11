import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MediaRow from './MediaRow'

vi.mock('./MediaCard', () => ({
  default: ({ media, index }) => (
    <div data-testid="media-card">{`${index}:${media.title || media.name}`}</div>
  ),
}))

vi.mock('./ErrorBox', () => ({
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

let resizeCallback
let originalResizeObserver

const sampleItems = [
  { id: 1, media_type: 'movie', title: 'Film A' },
  { id: 2, media_type: 'tv', name: 'Serie B' },
]

describe('MediaRow', () => {
  beforeEach(() => {
    resizeCallback = undefined
    originalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class MockResizeObserver {
      constructor(cb) {
        resizeCallback = cb
      }
      observe() {}
      disconnect() {}
    }
  })

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver
  })

  it('rendert Titel, Link und Sortierbuttons', () => {
    const onSortChange = vi.fn()

    render(
      <MemoryRouter>
        <MediaRow
          title="Top Picks"
          items={sampleItems}
          sortOptions={[
            { value: 'pop', label: 'Popular' },
            { value: 'rating', label: 'Rating' },
          ]}
          sortBy="pop"
          onSortChange={onSortChange}
          linkTo="/discover"
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Top Picks' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alle anzeigen' })).toHaveAttribute('href', '/discover')

    fireEvent.click(screen.getByText('Rating'))
    expect(onSortChange).toHaveBeenCalledWith('rating')
  })

  it('zeigt Loading-Skeleton und Empty-State korrekt', () => {
    const { rerender, container } = render(
      <MemoryRouter>
        <MediaRow title="Row" isLoading items={sampleItems} />
      </MemoryRouter>
    )

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('media-card')).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <MediaRow title="Row" isLoading={false} items={[]} />
      </MemoryRouter>
    )

    expect(screen.getByText(/Keine Inhalte verf/)).toBeInTheDocument()
  })

  it('zeigt ErrorBox bei Fehler und rendert MediaCards bei Daten', () => {
    const { rerender } = render(
      <MemoryRouter>
        <MediaRow title="Row" items={sampleItems} error={new Error('boom')} />
      </MemoryRouter>
    )

    expect(screen.getByTestId('error-box')).toHaveTextContent(/Inhalte konnten nicht geladen werden\./)

    rerender(
      <MemoryRouter>
        <MediaRow title="Row" items={sampleItems} />
      </MemoryRouter>
    )

    expect(screen.getAllByTestId('media-card')).toHaveLength(2)
    expect(screen.getByText('0:Film A')).toBeInTheDocument()
    expect(screen.getByText('1:Serie B')).toBeInTheDocument()
  })

  it('zeigt Scroll-Pfeile und scrollt bei Klick', async () => {
    render(
      <MemoryRouter>
        <MediaRow title="Row" items={sampleItems} />
      </MemoryRouter>
    )

    const scroller = document.querySelector('.overflow-x-auto')
    expect(scroller).toBeTruthy()

    Object.defineProperty(scroller, 'clientWidth', { value: 240, configurable: true })
    Object.defineProperty(scroller, 'scrollWidth', { value: 800, configurable: true })
    Object.defineProperty(scroller, 'scrollLeft', { value: 0, writable: true, configurable: true })
    scroller.scrollBy = vi.fn(({ left }) => {
      scroller.scrollLeft += left
    })

    act(() => {
      resizeCallback?.()
    })

    await waitFor(() => {
      expect(screen.getByLabelText('Weiter scrollen')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Weiter scrollen'))
    expect(scroller.scrollBy).toHaveBeenCalledWith({ left: 180, behavior: 'smooth' })

    scroller.scrollLeft = 20
    fireEvent.scroll(scroller)

    await waitFor(() => {
      expect(screen.getByLabelText('Zurück scrollen')).toBeInTheDocument()
    })
  })
})

