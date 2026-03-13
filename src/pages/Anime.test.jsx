import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Anime from './Anime'

const mockUseDocumentTitle = vi.fn()
const mockUseInfiniteScroll = vi.fn(() => vi.fn())
const mockUseInfiniteQuery = vi.fn()
const mockDiscoverMovies = vi.fn()
const mockDiscoverTv = vi.fn()
const mediaCardCalls = []

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (...args) => mockUseDocumentTitle(...args),
}))

vi.mock('../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: (...args) => mockUseInfiniteScroll(...args),
}))

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: (...args) => mockUseInfiniteQuery(...args),
}))

vi.mock('../api/movies', () => ({
  discoverMovies: (...args) => mockDiscoverMovies(...args),
}))

vi.mock('../api/tv', () => ({
  discoverTv: (...args) => mockDiscoverTv(...args),
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
  default: ({ message, onRetry }) => (
    <div data-testid="error-box">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry}>retry</button>
      ) : null}
    </div>
  ),
}))

function buildInfiniteState(overrides = {}) {
  return {
    data: undefined,
    isLoading: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...overrides,
  }
}

function renderAnime(initialEntries = ['/anime']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Anime />
    </MemoryRouter>
  )
}

describe('Anime Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mediaCardCalls.length = 0
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState())
  })

  it('rendert Standardzustand und setzt den Seitentitel', () => {
    renderAnime()

    expect(screen.getByText('Anime')).toBeInTheDocument()
    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Filme')).toHaveAttribute('aria-pressed', 'false')
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Anime')
  })

  it('konfiguriert Query korrekt und wechselt auf Movie-Mode', async () => {
    renderAnime()

    const initialConfig = mockUseInfiniteQuery.mock.calls[0][0]
    expect(initialConfig.queryKey).toEqual(['anime', 'tv', '', 'lte', 1])
    await initialConfig.queryFn({ pageParam: 3 })
    expect(mockDiscoverTv).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }))

    fireEvent.click(screen.getByText('Filme'))

    await waitFor(() => {
      const latestConfig = mockUseInfiniteQuery.mock.calls.at(-1)[0]
      expect(latestConfig.queryKey).toEqual(['anime', 'movie', '', 'lte', 1])
    })
  })

  it('zeigt Loading und Fehlerzustand', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ isLoading: true }))
    const { unmount } = renderAnime()
    expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument()
    unmount()

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ error: new Error('boom') }))
    renderAnime()
    expect(screen.getByTestId('error-box')).toBeInTheDocument()
  })

  it('filtert invalide Ergebnisse und setzt Animate nur für Seite 1', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 2,
            results: [
              { id: 1, title: 'Anime A', poster_path: '/a.jpg', overview: 'ok' },
              { id: 2, title: 'Ohne Poster', poster_path: null, overview: 'x' },
            ],
          },
          {
            page: 2,
            total_pages: 2,
            results: [
              { id: 4, title: 'Anime B', poster_path: '/b.jpg', overview: 'ok' },
            ],
          },
        ],
      },
      hasNextPage: true,
    }))

    renderAnime(['/anime?type=movie'])

    expect(screen.getAllByTestId('media-card')).toHaveLength(2)
    expect(mediaCardCalls[0].media.media_type).toBe('movie')
    expect(mediaCardCalls[0].animate).toBe(true)
    expect(mediaCardCalls[1].animate).toBe(false)
    expect(mockUseInfiniteScroll).toHaveBeenCalledWith(expect.objectContaining({ hasNextPage: true }))
  })
})
