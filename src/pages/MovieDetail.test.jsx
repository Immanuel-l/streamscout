import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MovieDetail from './MovieDetail'

let mockId = '42'
const mockUseDocumentTitle = vi.fn()
const mockUseMovieDetails = vi.fn()
const mockUseMovieProviders = vi.fn()
const mockUseMovieSimilar = vi.fn()
const mockUseNowPlaying = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: mockId }),
  }
})

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (title) => mockUseDocumentTitle(title),
}))

vi.mock('../hooks/useMovies', () => ({
  useMovieDetails: (...args) => mockUseMovieDetails(...args),
  useMovieProviders: (...args) => mockUseMovieProviders(...args),
  useMovieSimilar: (...args) => mockUseMovieSimilar(...args),
  useNowPlaying: (...args) => mockUseNowPlaying(...args),
}))

vi.mock('../api/tmdb', () => ({
  backdropUrl: (path) => (path ? `backdrop:${path}` : null),
  posterUrl: (path) => (path ? `poster:${path}` : null),
}))

vi.mock('../components/detail/DetailSkeleton', () => ({
  default: () => <div data-testid="detail-skeleton" />,
}))

vi.mock('../components/detail/RatingRing', () => ({
  default: ({ rating }) => <div data-testid="rating-ring">{rating}</div>,
}))

vi.mock('../components/detail/ProviderList', () => ({
  default: ({ providers }) => <div data-testid="provider-list">{providers ? 'mit-providern' : 'ohne-provider'}</div>,
}))

vi.mock('../components/common/MediaRow', () => ({
  default: ({ title, items, isLoading }) => (
    <div data-testid="media-row">{title}:{isLoading ? 'loading' : (items?.length ?? 0)}</div>
  ),
}))

vi.mock('../components/common/WatchlistButton', () => ({
  default: ({ media }) => <div data-testid="watchlist-button">{media.media_type}:{media.id}</div>,
}))

vi.mock('../components/detail/CastList', () => ({
  default: ({ cast }) => <div data-testid="cast-list">{cast.length}</div>,
}))

vi.mock('../components/detail/TrailerSection', () => ({
  default: ({ videos }) => <div data-testid="trailer-section">{videos.length}</div>,
}))

vi.mock('../components/common/ErrorBox', () => ({
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

const baseMovie = {
  id: 42,
  title: 'Testfilm',
  tagline: 'Ein Testfilm',
  release_date: '2024-03-10',
  runtime: 125,
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  vote_average: 7.8,
  vote_count: 12345,
  overview: 'Beschreibung',
  genres: [{ id: 1, name: 'Action' }],
  credits: { cast: [{ id: 1, name: 'Darsteller' }] },
  videos: { results: [{ id: 'v1', key: 'abc' }] },
  keywords: { keywords: [{ id: 10 }, { id: 11 }] },
  release_dates: {
    results: [
      {
        iso_3166_1: 'DE',
        release_dates: [{ type: 3, release_date: '2024-03-15T00:00:00.000Z' }],
      },
    ],
  },
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MovieDetail />
    </MemoryRouter>
  )
}

describe('MovieDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockId = '42'

    mockUseMovieDetails.mockReturnValue({ data: baseMovie, isLoading: false, error: null })
    mockUseMovieProviders.mockReturnValue({ data: { flatrate: [{ provider_id: 8 }] }, isLoading: false, error: null })
    mockUseMovieSimilar.mockReturnValue({ data: [{ id: 99, title: 'Aehnlich' }], isLoading: false, error: null })
    mockUseNowPlaying.mockReturnValue({ data: { ids: new Set() } })
  })

  it('zeigt Skeleton waehrend des Ladens', () => {
    mockUseMovieDetails.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderPage()
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument()
  })

  it('zeigt ErrorBox bei Fehlern', () => {
    mockUseMovieDetails.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') })

    renderPage()
    expect(screen.getByTestId('error-box')).toHaveTextContent('Film konnte nicht geladen werden')
  })

  it('rendert null wenn kein Film vorhanden ist', () => {
    mockUseMovieDetails.mockReturnValue({ data: null, isLoading: false, error: null })

    const { container } = renderPage()
    expect(container).toBeEmptyDOMElement()
  })

  it('zeigt Kino-Status, Cast, Trailer und Similar-Row', () => {
    mockUseNowPlaying.mockReturnValue({ data: { ids: new Set([42]) } })

    renderPage()

    expect(screen.getByText('Testfilm')).toBeInTheDocument()
    expect(screen.getByTestId('watchlist-button')).toHaveTextContent('movie:42')
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Testfilm')

    expect(screen.getByText('Aktuell im Kino')).toBeInTheDocument()
    expect(screen.getByText(/Kinostart in Deutschland:/)).toBeInTheDocument()

    expect(screen.queryByTestId('provider-list')).not.toBeInTheDocument()

    expect(screen.getByTestId('rating-ring')).toHaveTextContent('7.8')
    expect(screen.getByTestId('cast-list')).toHaveTextContent('1')
    expect(screen.getByTestId('trailer-section')).toHaveTextContent('1')
    expect(screen.getByTestId('media-row')).toHaveTextContent('Filme:1')
  })

  it('zeigt Provider-Bereich wenn Film nicht im Kino ist', () => {
    mockUseNowPlaying.mockReturnValue({ data: { ids: new Set([100]) } })

    renderPage()

    expect(screen.getByText('Wo streamen?')).toBeInTheDocument()
    expect(screen.getByTestId('provider-list')).toBeInTheDocument()
  })

  it('zeigt Similar-Row auch waehrend Loading', () => {
    mockUseMovieSimilar.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderPage()

    expect(screen.getByTestId('media-row')).toHaveTextContent('Filme:loading')
  })
})

