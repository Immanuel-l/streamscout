import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MediaCard from './MediaCard'

const mockUseQuery = vi.fn()
const mockUseNowPlaying = vi.fn()
const mockUseIsTouch = vi.fn()
const mockGetMovieProviders = vi.fn()
const mockGetTvProviders = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}))

vi.mock('../../hooks/useMovies', () => ({
  useNowPlaying: (...args) => mockUseNowPlaying(...args),
}))

vi.mock('../../hooks/useIsTouch', () => ({
  useIsTouch: (...args) => mockUseIsTouch(...args),
}))

vi.mock('../../api/movies', () => ({
  getMovieProviders: (...args) => mockGetMovieProviders(...args),
}))

vi.mock('../../api/tv', () => ({
  getTvProviders: (...args) => mockGetTvProviders(...args),
}))

vi.mock('../../api/tmdb', () => ({
  IMAGE_BASE: 'https://img.test',
  posterUrl: (path, size = 'w500') => (path ? `https://img.test/${size}${path}` : null),
}))

vi.mock('./WatchlistButton', () => ({
  default: ({ size }) => <button data-testid="watchlist-button">{size}</button>,
}))

const defaultMovie = {
  id: 42,
  media_type: 'movie',
  title: 'Testfilm',
  poster_path: '/poster.jpg',
  vote_average: 7.3,
  release_date: '2022-10-10',
}

let observerCallback
let observe
let disconnect
let originalObserver

function renderCard(props = {}) {
  const media = props.media || defaultMovie
  const { media: _unused, ...rest } = props

  return render(
    <MemoryRouter>
      <MediaCard media={media} {...rest} />
    </MemoryRouter>
  )
}

describe('MediaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    observe = vi.fn()
    disconnect = vi.fn()
    observerCallback = undefined
    originalObserver = globalThis.IntersectionObserver

    globalThis.IntersectionObserver = function MockIntersectionObserver(cb) {
      observerCallback = cb
      this.observe = observe
      this.disconnect = disconnect
    }

    mockUseIsTouch.mockReturnValue(false)
    mockUseNowPlaying.mockReturnValue({ data: { ids: new Set() } })
    mockUseQuery.mockReturnValue({ data: undefined, isSuccess: false, isError: false })
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalObserver
  })

  it('rendert Filmkarte und konfiguriert Provider-Query initial deaktiviert', async () => {
    renderCard()

    expect(screen.getByText('Film')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/movie/42')
    expect(screen.getByAltText('Testfilm')).toHaveAttribute('src', 'https://img.test/w342/poster.jpg')
    expect(screen.getAllByText('73%').length).toBeGreaterThan(0)

    const config = mockUseQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['movie', 42, 'providers'])
    expect(config.enabled).toBe(false)

    await config.queryFn()
    expect(mockGetMovieProviders).toHaveBeenCalledWith(42)
  })

  it('rendert Serienkarte mit Serien-Link und TV-Provider-Query', async () => {
    renderCard({
      media: {
        id: 7,
        media_type: 'tv',
        name: 'Serie X',
        poster_path: '/tv.jpg',
        vote_average: 5.1,
        first_air_date: '2021-01-02',
      },
    })

    expect(screen.getByText('Serie')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tv/7')

    const config = mockUseQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['tv', 7, 'providers'])

    await config.queryFn()
    expect(mockGetTvProviders).toHaveBeenCalledWith(7)
  })

  it('aktiviert Provider-Fetch beim Hover und zeigt Nicht-streambar Hinweis', async () => {
    mockUseQuery.mockReturnValue({
      data: { flatrate: [], rent: [], buy: [] },
      isSuccess: true,
      isError: false,
    })

    renderCard()

    fireEvent.mouseEnter(screen.getByRole('link'))

    await waitFor(() => {
      const latestConfig = mockUseQuery.mock.calls.at(-1)[0]
      expect(latestConfig.enabled).toBe(true)
    })

    expect(screen.getByText('Nicht streambar')).toBeInTheDocument()
  })

  it('zeigt Im Kino Badge fuer aktuelle Kino-Filme', () => {
    mockUseNowPlaying.mockReturnValue({ data: { ids: new Set([42]) } })
    mockUseQuery.mockReturnValue({
      data: { flatrate: [], rent: [], buy: [] },
      isSuccess: true,
      isError: false,
    })

    renderCard()
    fireEvent.mouseEnter(screen.getByRole('link'))

    expect(screen.getByText('Im Kino')).toBeInTheDocument()
    expect(screen.queryByText('Nicht streambar')).not.toBeInTheDocument()
  })

  it('wechselt bei Bildfehler auf den Platzhalter', () => {
    renderCard()

    fireEvent.error(screen.getByAltText('Testfilm'))
    expect(screen.queryByAltText('Testfilm')).not.toBeInTheDocument()
  })

  it('laedt auf Touch erst in Viewport-Naehe und zeigt mobile Provider/Watchlist', async () => {
    mockUseIsTouch.mockReturnValue(true)

    const providerData = {
      flatrate: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' },
        { provider_id: 9, provider_name: 'Prime Video', logo_path: '/prime.png' },
        { provider_id: 9999, provider_name: 'Nicht erlaubt', logo_path: '/blocked.png' },
      ],
      rent: [],
      buy: [],
    }

    mockUseQuery.mockImplementation(({ enabled }) => (
      enabled
        ? { data: providerData, isSuccess: true, isError: false }
        : { data: undefined, isSuccess: false, isError: false }
    ))

    renderCard({ index: 5 })

    expect(screen.getByTestId('watchlist-button')).toBeInTheDocument()
    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false)

    await waitFor(() => {
      expect(observe).toHaveBeenCalledTimes(1)
    })

    act(() => {
      observerCallback?.([{ isIntersecting: true }])
    })

    await waitFor(() => {
      const latestConfig = mockUseQuery.mock.calls.at(-1)[0]
      expect(latestConfig.enabled).toBe(true)
    })

    expect(screen.getAllByAltText('Netflix').length).toBeGreaterThan(0)
    expect(screen.getAllByAltText('Prime Video').length).toBeGreaterThan(0)
    expect(screen.queryByAltText('Nicht erlaubt')).not.toBeInTheDocument()
  })

  it('blendet Watchlist-Button aus wenn hideWatchlistButton gesetzt ist', () => {
    mockUseIsTouch.mockReturnValue(true)

    renderCard({ hideWatchlistButton: true })
    expect(screen.queryByTestId('watchlist-button')).not.toBeInTheDocument()
  })
})

