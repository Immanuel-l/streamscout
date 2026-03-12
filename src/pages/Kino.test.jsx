import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Kino from './Kino'

const mockUseDocumentTitle = vi.fn()
const mockUseNowPlaying = vi.fn()
const mockGetMovieReleaseDates = vi.fn()
const mediaCardCalls = []

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (...args) => mockUseDocumentTitle(...args),
}))

vi.mock('../hooks/useMovies', () => ({
  useNowPlaying: (...args) => mockUseNowPlaying(...args),
}))

vi.mock('../api/movies', () => ({
  getMovieReleaseDates: (...args) => mockGetMovieReleaseDates(...args),
}))

vi.mock('../components/common/MediaCard', () => ({
  default: (props) => {
    mediaCardCalls.push(props)
    return <div data-testid="media-card">{props.media.title || props.media.name}</div>
  },
}))

vi.mock('../components/common/GridSkeleton', () => ({
  default: () => <div data-testid="grid-skeleton" />,
}))

vi.mock('../components/common/ErrorBox', () => ({
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

const moviesDateOrder = [
  { id: 1, title: 'Film A', popularity: 40 },
  { id: 2, title: 'Film B', popularity: 100 },
  { id: 3, title: 'Film C', popularity: 90 },
]

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>
}

function renderKino(initialEntries = ['/kino']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/kino"
          element={(
            <>
              <Kino />
              <LocationDisplay />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>
  )
}

function deRelease(certification) {
  return [{ iso_3166_1: 'DE', release_dates: [{ type: 3, certification }] }]
}

function selectFsk(label) {
  fireEvent.click(screen.getByRole('combobox', { name: 'FSK' }))
  fireEvent.click(screen.getByRole('option', { name: label }))
}

function createDeferred() {
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('Kino Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mediaCardCalls.length = 0
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {}
    }
    mockGetMovieReleaseDates.mockResolvedValue([])
    mockUseNowPlaying.mockReturnValue({
      data: { movies: moviesDateOrder },
      isLoading: false,
      error: null,
    })
  })

  it('rendert Header, Zurueck-Link und setzt Dokumenttitel', () => {
    renderKino()

    expect(screen.getByRole('heading', { name: 'Aktuell im Kino' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zur.ck/i })).toHaveAttribute('href', '/')
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Aktuell im Kino')
  })

  it('zeigt Loading-Skeleton waehrend des Ladens', () => {
    mockUseNowPlaying.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderKino()
    expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('media-card')).not.toBeInTheDocument()
  })

  it('zeigt ErrorBox bei Fehler', () => {
    mockUseNowPlaying.mockReturnValue({ data: { movies: [] }, isLoading: false, error: new Error('boom') })

    renderKino()
    expect(screen.getByTestId('error-box')).toHaveTextContent('Kinofilme konnten nicht geladen werden. Bitte versuch es später nochmal.')
  })

  it('zeigt Empty-State wenn keine Kinofilme verfuegbar sind', () => {
    mockUseNowPlaying.mockReturnValue({ data: { movies: [] }, isLoading: false, error: null })

    renderKino()
    expect(screen.getByText('Keine Kinofilme verfügbar.')).toBeInTheDocument()
  })

  it('sortiert standardmaessig nach empfohlenem Mix', () => {
    renderKino()

    const cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film B')
    expect(cards[1]).toHaveTextContent('Film A')
    expect(cards[2]).toHaveTextContent('Film C')
    expect(mediaCardCalls.every((c) => c.eager === true)).toBe(true)
  })

  it('sortiert per Klick nach Kinostart und Beliebtheit', () => {
    renderKino()

    fireEvent.click(screen.getByText('Beliebtheit'))
    let cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film B')
    expect(cards[1]).toHaveTextContent('Film C')
    expect(cards[2]).toHaveTextContent('Film A')

    fireEvent.click(screen.getByText('Kinostart'))
    cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film A')
    expect(cards[1]).toHaveTextContent('Film B')
    expect(cards[2]).toHaveTextContent('Film C')
  })

  it('initialisiert Sortierung aus URL-Parametern', () => {
    renderKino(['/kino?sort=popularity'])

    const cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film B')
    expect(cards[1]).toHaveTextContent('Film C')
    expect(cards[2]).toHaveTextContent('Film A')
  })

  it('filtert Kinofilme nach FSK-Modus (lte, eq, gte)', async () => {
    mockGetMovieReleaseDates.mockImplementation(async (movieId) => {
      if (movieId === 1) return deRelease('6')
      if (movieId === 2) return deRelease('12')
      if (movieId === 3) return deRelease('16')
      return []
    })

    renderKino()
    selectFsk('FSK 12')

    await waitFor(() => expect(mockGetMovieReleaseDates).toHaveBeenCalledTimes(3))
    await waitFor(() => {
      expect(screen.getByText('Film A')).toBeInTheDocument()
      expect(screen.getByText('Film B')).toBeInTheDocument()
      expect(screen.queryByText('Film C')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Genau FSK' }))
    await waitFor(() => {
      expect(screen.queryByText('Film A')).not.toBeInTheDocument()
      expect(screen.getByText('Film B')).toBeInTheDocument()
      expect(screen.queryByText('Film C')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ab FSK' }))
    await waitFor(() => {
      expect(screen.queryByText('Film A')).not.toBeInTheDocument()
      expect(screen.getByText('Film B')).toBeInTheDocument()
      expect(screen.getByText('Film C')).toBeInTheDocument()
    })
  })

  it('behandelt Teilfehler bei FSK-Requests robust', async () => {
    mockGetMovieReleaseDates.mockImplementation(async (movieId) => {
      if (movieId === 1) return deRelease('12')
      if (movieId === 2) throw new Error('request failed')
      if (movieId === 3) return deRelease('6')
      return []
    })

    renderKino()
    selectFsk('FSK 12')

    await waitFor(() => expect(mockGetMovieReleaseDates).toHaveBeenCalledTimes(3))
    await waitFor(() => {
      expect(screen.getByText('Film A')).toBeInTheDocument()
      expect(screen.getByText('Film C')).toBeInTheDocument()
      expect(screen.queryByText('Film B')).not.toBeInTheDocument()
    })
  })

  it('faellt bei ungueltigen URL-FSK-Parametern auf Standardwerte zurueck', async () => {
    renderKino(['/kino?fsk=abc&fskMode=invalid'])

    expect(screen.getAllByTestId('media-card')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Genau FSK' })).not.toBeInTheDocument()

    await waitFor(() => {
      const location = screen.getByTestId('location').textContent || ''
      expect(location).not.toContain('fsk=')
      expect(location).not.toContain('fskMode=')
    })
  })

  it('synchronisiert Sortierung und FSK-Filter in die URL', async () => {
    mockGetMovieReleaseDates.mockImplementation(async (movieId) => deRelease(movieId === 3 ? '16' : '12'))

    renderKino()

    fireEvent.click(screen.getByText('Beliebtheit'))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('sort=popularity')
    })

    selectFsk('FSK 12')
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('fsk=12')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Genau FSK' }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('fskMode=eq')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Bis FSK' }))
    await waitFor(() => {
      const location = screen.getByTestId('location').textContent || ''
      expect(location).not.toContain('fskMode=')
    })
  })

  it('beendet FSK-Ladezustand bei schnellem Filter-Wechsel', async () => {
    const deferredCalls = []
    mockGetMovieReleaseDates.mockImplementation(() => {
      const deferred = createDeferred()
      deferredCalls.push(deferred)
      return deferred.promise
    })

    renderKino()
    selectFsk('FSK 12')

    await waitFor(() => {
      expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument()
    })

    selectFsk('Alle')

    await waitFor(() => {
      expect(screen.queryByTestId('grid-skeleton')).not.toBeInTheDocument()
      expect(screen.getAllByTestId('media-card')).toHaveLength(3)
    })

    deferredCalls.forEach(({ resolve }) => resolve(deRelease('12')))
    await waitFor(() => expect(mockGetMovieReleaseDates).toHaveBeenCalledTimes(3))
  })
})
