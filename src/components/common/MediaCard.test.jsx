import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MediaCard from './MediaCard'

const mockUseQuery = vi.fn()
const mockUseNowPlaying = vi.fn()
const mockUseIsTouch = vi.fn()
const mockGetMovieProviders = vi.fn()
const mockGetMovieReleaseDates = vi.fn()
const mockGetTvProviders = vi.fn()
const mockGetTvContentRatings = vi.fn()

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
  getMovieReleaseDates: (...args) => mockGetMovieReleaseDates(...args),
}))

vi.mock('../../api/tv', () => ({
  getTvProviders: (...args) => mockGetTvProviders(...args),
  getTvContentRatings: (...args) => mockGetTvContentRatings(...args),
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

function getQueryConfigBySuffix(suffix) {
  const matchingCalls = mockUseQuery.mock.calls.filter(([config]) => config.queryKey?.[2] === suffix)
  return matchingCalls.at(-1)?.[0]
}

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

  it('rendert Filmkarte und konfiguriert Provider- sowie FSK-Query initial deaktiviert', async () => {
    renderCard()

    expect(screen.getByText('Film')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/movie/42')
    expect(screen.getByAltText('Testfilm')).toHaveAttribute('src', 'https://img.test/w342/poster.jpg')
    expect(screen.getAllByText('73%').length).toBeGreaterThan(0)

    const providerConfig = getQueryConfigBySuffix('providers')
    const fskConfig = getQueryConfigBySuffix('fsk')

    expect(providerConfig.queryKey).toEqual(['movie', 42, 'providers'])
    expect(providerConfig.enabled).toBe(false)
    expect(fskConfig.queryKey).toEqual(['movie', 42, 'fsk'])
    expect(fskConfig.enabled).toBe(false)

    await providerConfig.queryFn()
    await fskConfig.queryFn()

    expect(mockGetMovieProviders).toHaveBeenCalledWith(42)
    expect(mockGetMovieReleaseDates).toHaveBeenCalledWith(42)
  })

  it('rendert Serienkarte mit Serien-Link sowie TV-Provider/FSK-Query', async () => {
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

    const providerConfig = getQueryConfigBySuffix('providers')
    const fskConfig = getQueryConfigBySuffix('fsk')

    expect(providerConfig.queryKey).toEqual(['tv', 7, 'providers'])
    expect(fskConfig.queryKey).toEqual(['tv', 7, 'fsk'])

    await providerConfig.queryFn()
    await fskConfig.queryFn()

    expect(mockGetTvProviders).toHaveBeenCalledWith(7)
    expect(mockGetTvContentRatings).toHaveBeenCalledWith(7)
  })

  it('zeigt FSK in der Karten-Meta, wenn sie in den Daten vorhanden ist', () => {
    renderCard({
      media: {
        ...defaultMovie,
        release_dates: {
          results: [
            {
              iso_3166_1: 'DE',
              release_dates: [{ type: 3, certification: '12' }],
            },
          ],
        },
      },
    })

    expect(screen.getAllByText(/FSK 12/).length).toBeGreaterThan(0)
    expect(getQueryConfigBySuffix('fsk').enabled).toBe(false)
  })

  it('aktiviert Provider- und FSK-Fetch beim Hover und zeigt Nicht-streambar Hinweis', async () => {
    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey?.[2] === 'providers') {
        return { data: { flatrate: [], rent: [], buy: [] }, isSuccess: true, isError: false }
      }
      if (queryKey?.[2] === 'fsk') {
        return { data: null, isSuccess: true, isError: false }
      }
      return { data: undefined, isSuccess: false, isError: false }
    })

    renderCard()

    fireEvent.mouseEnter(screen.getByRole('link'))

    await waitFor(() => {
      expect(getQueryConfigBySuffix('providers').enabled).toBe(true)
      expect(getQueryConfigBySuffix('fsk').enabled).toBe(true)
    })

    expect(screen.getByText('Nicht streambar')).toBeInTheDocument()
  })

  it('zeigt Im Kino Badge fuer aktuelle Kino-Filme', () => {
    mockUseNowPlaying.mockReturnValue({ data: { ids: new Set([42]) } })
    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey?.[2] === 'providers') {
        return { data: { flatrate: [], rent: [], buy: [] }, isSuccess: true, isError: false }
      }
      if (queryKey?.[2] === 'fsk') {
        return { data: null, isSuccess: true, isError: false }
      }
      return { data: undefined, isSuccess: false, isError: false }
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

    mockUseQuery.mockImplementation(({ queryKey, enabled }) => {
      if (queryKey?.[2] === 'providers') {
        return enabled
          ? { data: providerData, isSuccess: true, isError: false }
          : { data: undefined, isSuccess: false, isError: false }
      }
      if (queryKey?.[2] === 'fsk') {
        return enabled
          ? { data: 'FSK 16', isSuccess: true, isError: false }
          : { data: undefined, isSuccess: false, isError: false }
      }
      return { data: undefined, isSuccess: false, isError: false }
    })

    renderCard({ index: 5 })

    expect(screen.getByTestId('watchlist-button')).toBeInTheDocument()
    expect(getQueryConfigBySuffix('providers').enabled).toBe(false)
    expect(getQueryConfigBySuffix('fsk').enabled).toBe(false)

    await waitFor(() => {
      expect(observe).toHaveBeenCalledTimes(1)
    })

    act(() => {
      observerCallback?.([{ isIntersecting: true }])
    })

    await waitFor(() => {
      expect(getQueryConfigBySuffix('providers').enabled).toBe(true)
      expect(getQueryConfigBySuffix('fsk').enabled).toBe(true)
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

