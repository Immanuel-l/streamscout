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

  it('rendert Header und Standardzustand fuer Serien', () => {
    renderAnime()

    expect(screen.getByText('Anime')).toBeInTheDocument()
    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Filme')).toHaveAttribute('aria-pressed', 'false')
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Anime')
  })

  it('konfiguriert useInfiniteQuery mit Anime-Parametern fuer TV', async () => {
    renderAnime()

    const config = mockUseInfiniteQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['anime', 'tv', 1])
    expect(config.initialPageParam).toBe(1)
    expect(config.retry).toBe(1)
    expect(config.getNextPageParam({ page: 1, total_pages: 2 })).toBe(2)
    expect(config.getNextPageParam({ page: 500, total_pages: 999 })).toBeUndefined()

    await config.queryFn({ pageParam: 3 })
    expect(mockDiscoverTv).toHaveBeenCalledWith(expect.objectContaining({
      with_genres: '16',
      with_origin_country: 'JP',
      sort_by: 'popularity.desc',
      page: 3,
    }))
  })

  it('wechselt auf Filme und nutzt discoverMovies', async () => {
    renderAnime()

    fireEvent.click(screen.getByText('Filme'))

    await waitFor(() => {
      const latestConfig = mockUseInfiniteQuery.mock.calls.at(-1)[0]
      expect(latestConfig.queryKey).toEqual(['anime', 'movie', 1])
    })

    const config = mockUseInfiniteQuery.mock.calls.at(-1)[0]
    await config.queryFn({ pageParam: 2 })
    expect(mockDiscoverMovies).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('zeigt Loading- und Fehlerzustand', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ isLoading: true }))
    const { unmount } = renderAnime()
    expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument()
    unmount()

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ error: new Error('boom') }))
    renderAnime()
    expect(screen.getByText(/Ergebnisse konnten nicht geladen werden./)).toBeInTheDocument()
  })

  it('rendert Ergebnisse gefiltert, mappt media_type und setzt animate fuer Folge-Seiten', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 2,
            results: [
              { id: 1, title: 'Anime A', poster_path: '/a.jpg', overview: 'ok' },
              { id: 2, title: 'Ohne Poster', poster_path: null, overview: 'x' },
              { id: 3, title: 'Ohne Overview', poster_path: '/c.jpg', overview: '' },
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
    expect(mediaCardCalls[1].media.media_type).toBe('movie')
    expect(mediaCardCalls[0].animate).toBe(true)
    expect(mediaCardCalls[1].animate).toBe(false)
    expect(mediaCardCalls.every((call) => call.eager === true)).toBe(true)
    expect(mockUseInfiniteScroll).toHaveBeenCalledWith(expect.objectContaining({
      hasNextPage: true,
      isFetchingNextPage: false,
    }))
  })

  it('zeigt End-of-list-Hinweis bei vielen Ergebnissen ohne weitere Seiten', () => {
    const manyResults = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      title: `Anime ${i + 1}`,
      poster_path: `/${i + 1}.jpg`,
      overview: 'ok',
    }))

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: { pages: [{ page: 1, total_pages: 1, results: manyResults }] },
      hasNextPage: false,
    }))

    renderAnime()
    expect(screen.getByText('Keine weiteren Ergebnisse.')).toBeInTheDocument()
  })

  it('zeigt Empty State wenn keine verwertbaren Ergebnisse vorhanden sind', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [{ page: 1, total_pages: 1, results: [{ id: 1, title: 'X', poster_path: null, overview: '' }] }],
      },
    }))

    renderAnime()
    expect(screen.getByText('Keine Ergebnisse gefunden')).toBeInTheDocument()
  })

  it('setzt die Startseite beim Mischen neu', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.6) // => page 4
    renderAnime()

    fireEvent.click(screen.getByText('Mischen'))

    await waitFor(() => {
      const latestConfig = mockUseInfiniteQuery.mock.calls.at(-1)[0]
      expect(latestConfig.queryKey).toEqual(['anime', 'tv', 4])
      expect(latestConfig.initialPageParam).toBe(4)
    })

    randomSpy.mockRestore()
  })
})


