import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TvDetail from './TvDetail'

let mockId = '77'
const mockUseDocumentTitle = vi.fn()
const mockUseTvDetails = vi.fn()
const mockUseTvProviders = vi.fn()
const mockUseTvSimilar = vi.fn()
const mockUseTvSeasonProviders = vi.fn()

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

vi.mock('../hooks/useTv', () => ({
  useTvDetails: (...args) => mockUseTvDetails(...args),
  useTvProviders: (...args) => mockUseTvProviders(...args),
  useTvSimilar: (...args) => mockUseTvSimilar(...args),
  useTvSeasonProviders: (...args) => mockUseTvSeasonProviders(...args),
}))

vi.mock('../api/tmdb', () => ({
  backdropUrl: (path) => (path ? `backdrop:${path}` : null),
  posterUrl: (path) => (path ? `poster:${path}` : null),
  IMAGE_BASE: 'https://image.tmdb.org/t/p',
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

const baseShow = {
  id: 77,
  name: 'Testserie',
  tagline: 'Serien-Tagline',
  first_air_date: '2020-01-01',
  last_air_date: '2024-05-01',
  status: 'Returning Series',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  vote_average: 8.2,
  vote_count: 9876,
  overview: 'Serienbeschreibung',
  number_of_seasons: 2,
  number_of_episodes: 18,
  genres: [{ id: 10, name: 'Drama' }],
  networks: [{ id: 1, name: 'Test Network', logo_path: '/network.png' }],
  credits: { cast: [{ id: 1, name: 'Actor' }] },
  videos: { results: [{ id: 'v1', key: 'abc' }] },
  keywords: { results: [{ id: 100 }, { id: 200 }] },
  content_ratings: { results: [{ iso_3166_1: 'DE', rating: '16' }] },
  seasons: [
    { id: 1, season_number: 0, name: 'Specials', episode_count: 2, air_date: '2019-01-01', poster_path: null },
    { id: 2, season_number: 1, name: 'Staffel 1', episode_count: 10, air_date: '2020-01-01', poster_path: '/s1.jpg' },
    { id: 3, season_number: 2, name: 'Staffel 2', episode_count: 8, air_date: '2024-01-01', poster_path: null },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TvDetail />
    </MemoryRouter>
  )
}

describe('TvDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockId = '77'

    mockUseTvDetails.mockReturnValue({ data: baseShow, isLoading: false, error: null })
    mockUseTvProviders.mockReturnValue({ data: { flatrate: [{ provider_id: 8 }] }, isLoading: false, error: null })
    mockUseTvSimilar.mockReturnValue({ data: [{ id: 999, name: 'Aehnlich' }], isLoading: false, error: null })
    mockUseTvSeasonProviders.mockReturnValue([
      {
        seasonNumber: 1,
        isLoading: false,
        data: {
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' },
            { provider_id: 9, provider_name: 'Prime Video', logo_path: '/p.png' },
          ],
        },
      },
      {
        seasonNumber: 2,
        isLoading: false,
        data: {
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' },
          ],
        },
      },
    ])
  })

  it('zeigt Skeleton waehrend Loading', () => {
    mockUseTvDetails.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderPage()
    expect(screen.getByTestId('detail-skeleton')).toBeInTheDocument()
  })

  it('zeigt ErrorBox bei Fehlern', () => {
    mockUseTvDetails.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') })

    renderPage()
    expect(screen.getByTestId('error-box')).toHaveTextContent('Serie konnte nicht geladen werden')
  })

  it('rendert null wenn keine Serie vorhanden ist', () => {
    mockUseTvDetails.mockReturnValue({ data: null, isLoading: false, error: null })

    const { container } = renderPage()
    expect(container).toBeEmptyDOMElement()
  })

  it('zeigt Meta, Provider, Staffeln und Similar-Bereich', () => {
    renderPage()

    expect(screen.getByText('Testserie')).toBeInTheDocument()
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Testserie')
    expect(screen.getByTestId('watchlist-button')).toHaveTextContent('tv:77')

    expect(screen.getByText('2020–2024')).toBeInTheDocument()
    expect(screen.getByText('Laufend')).toBeInTheDocument()
    expect(screen.getByText('FSK 16')).toBeInTheDocument()
    expect(screen.getByText('2 Staffeln')).toBeInTheDocument()
    expect(screen.getByText('18 Episoden')).toBeInTheDocument()

    expect(screen.getByText('Wo streamen?')).toBeInTheDocument()
    expect(screen.getByTestId('provider-list')).toBeInTheDocument()

    expect(screen.getByTestId('cast-list')).toHaveTextContent('1')
    expect(screen.getByTestId('trailer-section')).toHaveTextContent('1')
    expect(screen.getByTestId('media-row')).toHaveTextContent('Serien:1')

    expect(screen.getByText('Staffeln (2)')).toBeInTheDocument()
    expect(screen.getByText('Alle Staffeln')).toBeInTheDocument()
    expect(screen.getAllByText('Staffel 1').length).toBeGreaterThan(0)
    expect(screen.getByText('Staffel 2')).toBeInTheDocument()
  })

  it('zeigt Provider-Skeleton wenn Provider noch laden', () => {
    mockUseTvProviders.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderPage()

    expect(screen.getByText('Wo streamen?')).toBeInTheDocument()
    expect(screen.queryByTestId('provider-list')).not.toBeInTheDocument()
  })

  it('zeigt Similar-Row auch waehrend Loading', () => {
    mockUseTvSimilar.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderPage()

    expect(screen.getByTestId('media-row')).toHaveTextContent('Serien:loading')
  })
})

