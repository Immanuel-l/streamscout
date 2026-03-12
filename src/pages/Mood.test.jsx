import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Mood from './Mood'

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
      {onRetry ? <button type="button" onClick={onRetry}>retry</button> : null}
    </div>
  ),
}))

vi.mock('../components/common/ScrollToTop', () => ({
  default: () => <div data-testid="scroll-to-top" />,
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

function renderMood(initialEntries = ['/mood/leichte-kost']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/mood/:slug" element={<Mood />} />
        <Route path="/" element={<div data-testid="home-page">home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Mood Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mediaCardCalls.length = 0
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState())
  })

  it('rendert Mood-Header und Standardzustand', () => {
    renderMood()

    expect(screen.getByRole('heading', { name: 'Leichte Kost' })).toBeInTheDocument()
    expect(screen.getByText('Filme')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Beliebtheit')).toHaveAttribute('aria-pressed', 'true')
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Leichte Kost')
  })

  it('konfiguriert Query fuer movie + popularity korrekt', async () => {
    renderMood()

    const config = mockUseInfiniteQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['mood', 'leichte-kost', 'movie', 'popularity', '', 'lte', 1])
    expect(config.enabled).toBe(true)
    expect(config.retry).toBe(1)
    expect(config.initialPageParam).toBe(1)
    expect(config.getNextPageParam({ page: 1, total_pages: 2 })).toBe(2)
    expect(config.getNextPageParam({ page: 500, total_pages: 999 })).toBeUndefined()

    await config.queryFn({ pageParam: 3 })
    expect(mockDiscoverMovies).toHaveBeenCalledWith(expect.objectContaining({
      with_genres: '35',
      'vote_average.gte': 6,
      'with_runtime.lte': 120,
      'vote_count.gte': 100,
      sort_by: 'popularity.desc',
      page: 3,
    }))
  })


  it('uebergibt FSK-Filterparameter fuer Filme', async () => {
    renderMood(['/mood/leichte-kost?fsk=16&fskMode=gte'])

    const config = mockUseInfiniteQuery.mock.calls[0][0]
    await config.queryFn({ pageParam: 1 })

    expect(mockDiscoverMovies).toHaveBeenCalledWith(expect.objectContaining({
      certification_country: 'DE',
      'certification.gte': '16',
    }))
  })
  it('wechselt auf tv + date und nutzt discoverTv mit erstem Air-Date-Sort', async () => {
    renderMood()

    fireEvent.click(screen.getByText('Serien'))
    fireEvent.click(screen.getByText('Neueste zuerst'))

    await waitFor(() => {
      const latestConfig = mockUseInfiniteQuery.mock.calls.at(-1)[0]
      expect(latestConfig.queryKey).toEqual(['mood', 'leichte-kost', 'tv', 'date', '', 'lte', 1])
    })

    const config = mockUseInfiniteQuery.mock.calls.at(-1)[0]
    await config.queryFn({ pageParam: 2 })

    expect(mockDiscoverTv).toHaveBeenCalledWith(expect.objectContaining({
      with_genres: '35',
      'vote_average.gte': 6,
      'vote_count.gte': 100,
      sort_by: 'first_air_date.desc',
      page: 2,
    }))
  })

  it('zeigt Loading und Fehlerzustand', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ isLoading: true }))
    const { unmount } = renderMood()
    expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument()
    unmount()

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ error: new Error('boom') }))
    renderMood()
    expect(screen.getByText(/Ergebnisse konnten nicht geladen werden\./)).toBeInTheDocument()
  })

  it('mappt Ergebnisse, filtert invalide Eintraege und setzt Animate fuer Folge-Seiten', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 2,
            results: [
              { id: 1, title: 'A', poster_path: '/a.jpg', overview: 'ok' },
              { id: 2, title: 'No Poster', poster_path: null, overview: 'x' },
            ],
          },
          {
            page: 2,
            total_pages: 2,
            results: [
              { id: 3, title: 'B', poster_path: '/b.jpg', overview: 'ok' },
            ],
          },
        ],
      },
      hasNextPage: true,
    }))

    renderMood(['/mood/leichte-kost?type=tv'])

    expect(screen.getAllByTestId('media-card')).toHaveLength(2)
    expect(mediaCardCalls[0].media.media_type).toBe('tv')
    expect(mediaCardCalls[1].media.media_type).toBe('tv')
    expect(mediaCardCalls[0].animate).toBe(true)
    expect(mediaCardCalls[1].animate).toBe(false)
    expect(mediaCardCalls.every((call) => call.eager === true)).toBe(true)
    expect(mockUseInfiniteScroll).toHaveBeenCalledWith(expect.objectContaining({
      hasNextPage: true,
      isFetchingNextPage: false,
    }))
  })

  it('zeigt Retry-Errorbox fuer Folgefehler und ruft fetchNextPage auf', () => {
    const fetchNextPage = vi.fn()
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 2,
            results: [{ id: 1, title: 'A', poster_path: '/a.jpg', overview: 'ok' }],
          },
        ],
      },
      error: new Error('boom'),
      fetchNextPage,
      isFetchingNextPage: false,
    }))

    renderMood()

    expect(screen.getByText(/Ergebnisse konnten nicht geladen werden\./)).toBeInTheDocument()
    expect(screen.getByText(/Fehler beim Laden weiterer Ergebnisse\./)).toBeInTheDocument()

    fireEvent.click(screen.getByText('retry'))
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('zeigt End-of-list Hinweis wenn mehr als 20 Ergebnisse ohne weitere Seiten', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      title: `Mood ${i + 1}`,
      poster_path: `/${i + 1}.jpg`,
      overview: 'ok',
    }))

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: { pages: [{ page: 1, total_pages: 1, results: many }] },
      hasNextPage: false,
    }))

    renderMood()
    expect(screen.getByText('Keine weiteren Ergebnisse.')).toBeInTheDocument()
  })

  it('zeigt Empty State wenn keine verwertbaren Ergebnisse vorhanden sind', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [{ page: 1, total_pages: 1, results: [{ id: 1, title: 'X', poster_path: null, overview: '' }] }],
      },
    }))

    renderMood()

    expect(screen.getByText('Keine Ergebnisse gefunden')).toBeInTheDocument()
    expect(screen.getByText(/Versuch es mit/)).toBeInTheDocument()
  })

  it('mischt die Startseite neu', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.8) // => 5
    renderMood()

    fireEvent.click(screen.getByText('Mischen'))

    await waitFor(() => {
      const latestConfig = mockUseInfiniteQuery.mock.calls.at(-1)[0]
      expect(latestConfig.queryKey).toEqual(['mood', 'leichte-kost', 'movie', 'popularity', '', 'lte', 5])
      expect(latestConfig.initialPageParam).toBe(5)
    })

    randomSpy.mockRestore()
  })

  it('redirectet bei ungueltigem Mood-Slug zur Startseite', async () => {
    renderMood(['/mood/gibt-es-nicht'])
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Leichte Kost' })).not.toBeInTheDocument()
    })
  })
})




