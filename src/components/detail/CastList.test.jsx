import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CastList from './CastList'

vi.mock('../../api/tmdb', () => ({
  IMAGE_BASE: 'https://img.test',
}))

let resizeCallback
let originalResizeObserver

function createCast(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    credit_id: `credit-${i + 1}`,
    name: `Person ${i + 1}`,
    character: `Role ${i + 1}`,
    profile_path: `/p-${i + 1}.jpg`,
  }))
}

describe('CastList', () => {
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

  it('rendert nichts ohne sichtbare Cast-Bilder', () => {
    const { container } = render(
      <MemoryRouter>
        <CastList cast={[{ id: 1, credit_id: 'x', name: 'NoPic', character: 'A', profile_path: null }]} />
      </MemoryRouter>
    )

    expect(container.firstChild).toBeNull()
  })

  it('rendert Besetzung mit maximal 20 sichtbaren Personen', () => {
    render(
      <MemoryRouter>
        <CastList cast={createCast(24)} />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Besetzung' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(20)
    expect(screen.getByText('Person 1')).toBeInTheDocument()
    expect(screen.queryByText('Person 21')).not.toBeInTheDocument()
    expect(document.querySelector('a[href="/person/1"]')).toBeInTheDocument()
  })

  it('zeigt Scroll-Pfeile anhand der Scroll-Position und scrollt bei Klick', async () => {
    render(
      <MemoryRouter>
        <CastList cast={createCast(3)} />
      </MemoryRouter>
    )

    const scroller = document.querySelector('.overflow-x-auto')
    expect(scroller).toBeTruthy()

    Object.defineProperty(scroller, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(scroller, 'scrollWidth', { value: 600, configurable: true })
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
    expect(screen.queryByLabelText('Zurück scrollen')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Weiter scrollen'))
    expect(scroller.scrollBy).toHaveBeenCalledWith({ left: 150, behavior: 'smooth' })

    scroller.scrollLeft = 20
    fireEvent.scroll(scroller)

    await waitFor(() => {
      expect(screen.getByLabelText('Zurück scrollen')).toBeInTheDocument()
    })
  })
})
