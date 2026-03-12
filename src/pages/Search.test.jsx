import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Search from './Search'

const mockUseDebounce = vi.fn((val) => val)
const mockUseInfiniteScroll = vi.fn(() => vi.fn())
const mockUseDocumentTitle = vi.fn()

const mockSearchMulti = vi.fn()
const mockSearchMovies = vi.fn()
const mockSearchTv = vi.fn()
const mockSearchPerson = vi.fn()


const mockUseInfiniteQuery = vi.fn()
const mockUseQueries = vi.fn()

vi.mock('../hooks/useDebounce', () => ({
  useDebounce: (...args) => mockUseDebounce(...args),
}))

vi.mock('../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: (...args) => mockUseInfiniteScroll(...args),
}))

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (...args) => mockUseDocumentTitle(...args),
}))

vi.mock('../api/common', () => ({
  searchMulti: (...args) => mockSearchMulti(...args),
  searchMovies: (...args) => mockSearchMovies(...args),
  searchTv: (...args) => mockSearchTv(...args),
  searchPerson: (...args) => mockSearchPerson(...args),
}))


vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: (...args) => mockUseInfiniteQuery(...args),
  useQueries: (...args) => mockUseQueries(...args),
}))

vi.mock('../components/search/SearchBar', () => ({
  default: ({ value, onChange, suggestions = [], history = [], onHistorySelect, onHistoryRemove, onHistoryClear }) => (
    <div>
      <input
        data-testid="search-bar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div data-testid="suggestion-count">{suggestions.length}</div>
      <div data-testid="history-count">{history.length}</div>
      <button onClick={() => onHistorySelect?.('picked')} type="button">history-select</button>
      <button onClick={() => onHistoryRemove?.('old')} type="button">history-remove</button>
      <button onClick={() => onHistoryClear?.()} type="button">history-clear</button>
    </div>
  ),
}))

vi.mock('../components/common/MediaCard', () => ({
  default: ({ media }) => (
    <div data-testid="media-card">{media.title || media.name}</div>
  ),
}))

vi.mock('../components/search/PersonCard', () => ({
  default: ({ person }) => (
    <div data-testid="person-card">{person.name}</div>
  ),
}))

vi.mock('../components/common/GridSkeleton', () => ({
  default: ({ count }) => <div data-testid="grid-skeleton">{count}</div>,
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
  default: () => null,
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

function renderSearch(initialEntries = ['/search']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Search />
    </MemoryRouter>
  )
}

describe('Search Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    localStorage.clear()
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState())
    mockUseQueries.mockReturnValue([])
  })

  it('zeigt den initialen Zustand ohne aktive Suche', () => {
    renderSearch()

    expect(screen.getByText('Finde Filme, Serien und Personen')).toBeInTheDocument()
    expect(screen.getByText('Gib mindestens 2 Zeichen ein, um zu suchen.')).toBeInTheDocument()
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Suche')
  })

  it('konfiguriert useInfiniteQuery korrekt und nutzt media-spezifische Search-Funktion', async () => {
    renderSearch(['/search?q=test&type=tv'])

    const config = mockUseInfiniteQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['search', 'test', 'tv'])
    expect(config.initialPageParam).toBe(1)
    expect(config.retry).toBe(1)
    expect(config.enabled).toBe(true)

    expect(config.getNextPageParam({ page: 1, total_pages: 2 })).toBe(2)
    expect(config.getNextPageParam({ page: 2, total_pages: 2 })).toBeUndefined()
    expect(config.getNextPageParam({ page: 500, total_pages: 999 })).toBeUndefined()

    await config.queryFn({ pageParam: 3 })
    expect(mockSearchTv).toHaveBeenCalledWith('test', 3)
  })

  it('zeigt Medienergebnisse, Suggestions und Ergebniszaehler mit Plus bei hasNextPage', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 10,
            results: [
              { id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg', overview: 'ok' },
              { id: 2, media_type: 'tv', name: 'Serie B', poster_path: '/b.jpg', overview: 'ok' },
              { id: 3, media_type: 'person', name: 'Person C', profile_path: '/p.jpg' },
              { id: 4, media_type: 'movie', title: 'Ohne Poster', poster_path: null, overview: 'x' },
            ],
          },
        ],
      },
      hasNextPage: true,
    }))

    renderSearch(['/search?q=test'])

    expect(screen.getAllByTestId('media-card')).toHaveLength(2)
    expect(screen.getByText('2+ Ergebnisse')).toBeInTheDocument()
    expect(screen.getByTestId('suggestion-count')).toHaveTextContent('3')

    const queryConfig = mockUseQueries.mock.calls[0][0]
    expect(queryConfig.queries).toHaveLength(0)
  })

  it('wechselt auf Personen-Suche und blendet Medienfilter aus', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 1,
            results: [
              { id: 10, media_type: 'person', name: 'Alice', profile_path: '/a.jpg' },
              { id: 11, media_type: 'person', name: 'Bob', profile_path: '/b.jpg' },
            ],
          },
        ],
      },
    }))

    renderSearch(['/search?q=test&type=movie&sort=year&streamable=true'])

    fireEvent.click(screen.getByText('Personen'))

    expect(screen.getAllByTestId('person-card')).toHaveLength(2)
    expect(screen.queryByText('Nur Streambar')).not.toBeInTheDocument()
    expect(screen.queryByText('Bewertung')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Filme'))
    expect(screen.getByText('Nur Streambar')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Relevanz')).toHaveAttribute('aria-pressed', 'true')
  })

  it('zeigt Skeleton wenn Provider bei aktivem Streamable-Filter noch nicht aufgeloest sind', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 1,
            results: [
              { id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg', overview: 'ok' },
            ],
          },
        ],
      },
    }))
    mockUseQueries.mockReturnValue([{ isLoading: true, isSuccess: false, isError: false }])

    renderSearch(['/search?q=test&streamable=true'])

    expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument()
  })

  it('zeigt Provider-Prueftext bei teilweise geladenen Provider-Queries', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 1,
            results: [
              { id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg', overview: 'ok' },
              { id: 2, media_type: 'movie', title: 'Film B', poster_path: '/b.jpg', overview: 'ok' },
            ],
          },
        ],
      },
    }))
    mockUseQueries.mockReturnValue([
      { isLoading: false, isSuccess: true, isError: false, data: { state: 'streamable', isStreamable: true } },
      { isLoading: true, isSuccess: false, isError: false },
    ])

    renderSearch(['/search?q=test&streamable=true'])

    expect(screen.getByText('Streaming-Verfügbarkeit wird geprüft…')).toBeInTheDocument()
    expect(screen.getAllByTestId('media-card')).toHaveLength(1)
  })

  it('zeigt Hinweis wenn alles vom Streamable-Filter herausgefiltert wird', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 1,
            results: [
              { id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg', overview: 'ok' },
            ],
          },
        ],
      },
    }))
    mockUseQueries.mockReturnValue([
      { isLoading: false, isSuccess: true, isError: false, data: { state: 'not_streamable', isStreamable: false } },
    ])

    renderSearch(['/search?q=test&streamable=true'])

    expect(screen.getByText('Keine streambare Ergebnisse')).toBeInTheDocument()
  })

  it('sortiert Ergebnisse nach Bewertung und Jahr', () => {
    const mixedData = {
      pages: [
        {
          page: 1,
          total_pages: 1,
          results: [
            { id: 1, media_type: 'movie', title: 'Hohe Wertung', poster_path: '/a.jpg', overview: 'ok', vote_average: 9, release_date: '2020-01-01' },
            { id: 2, media_type: 'movie', title: 'Neuer Film', poster_path: '/b.jpg', overview: 'ok', vote_average: 6, release_date: '2024-01-01' },
          ],
        },
      ],
    }

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ data: mixedData }))
    renderSearch(['/search?q=test&sort=rating'])
    expect(screen.getAllByTestId('media-card')[0]).toHaveTextContent('Hohe Wertung')

    cleanup()

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ data: mixedData }))
    renderSearch(['/search?q=test&sort=year'])
    expect(screen.getAllByTestId('media-card')[0]).toHaveTextContent('Neuer Film')
  })

  it('zeigt No-Results-Hinweis wenn keine verwertbaren Ergebnisse vorhanden sind', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          { page: 1, total_pages: 1, results: [{ id: 1, media_type: 'person', name: 'X', profile_path: null }] },
        ],
      },
    }))

    renderSearch(['/search?q=test'])

    expect(screen.getByText(/Keine Ergebnisse für/)).toBeInTheDocument()
  })

  it('zeigt Fehlerboxen und Retry bei Folgefehlern', () => {
    const fetchNextPage = vi.fn()
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          { page: 1, total_pages: 2, results: [{ id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg', overview: 'ok' }] },
        ],
      },
      error: new Error('boom'),
      fetchNextPage,
    }))

    renderSearch(['/search?q=test'])

    expect(screen.getByText('Suche fehlgeschlagen. Bitte versuch es später nochmal.')).toBeInTheDocument()
    expect(screen.getByText('Fehler beim Laden weiterer Ergebnisse.')).toBeInTheDocument()

    fireEvent.click(screen.getByText('retry'))
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('zeigt Ende-Hinweis bei vielen Ergebnissen ohne weitere Seiten', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      media_type: 'movie',
      title: `Film ${i + 1}`,
      poster_path: `/p-${i + 1}.jpg`,
      overview: 'ok',
    }))

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: { pages: [{ page: 1, total_pages: 1, results: many }] },
      hasNextPage: false,
    }))

    renderSearch(['/search?q=test'])

    expect(screen.getByText('21 Ergebnisse')).toBeInTheDocument()
    expect(screen.getByText('Keine weiteren Ergebnisse.')).toBeInTheDocument()
  })

  it('persistiert Suchverlauf und verarbeitet Verlauf-Callbacks', async () => {
    localStorage.setItem('streamscout-search-history', JSON.stringify(['old']))

    const stableData = {
      pages: [
        {
          page: 1,
          total_pages: 1,
          results: [{ id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg', overview: 'ok' }],
        },
      ],
    }

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({ data: stableData }))

    renderSearch(['/search?q=%20matrix%20'])

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('streamscout-search-history'))).toEqual(['matrix', 'old'])
    })

    expect(screen.getByTestId('history-count')).toHaveTextContent('2')

    fireEvent.click(screen.getByText('history-remove'))
    expect(JSON.parse(localStorage.getItem('streamscout-search-history'))).toEqual(['matrix'])

    fireEvent.click(screen.getByText('history-select'))
    expect(screen.getByTestId('search-bar')).toHaveValue('picked')

    fireEvent.click(screen.getByText('history-clear'))
    expect(localStorage.getItem('streamscout-search-history')).toBeNull()
  })

  it('zeigt Hinweis bei unbekannter Streambarkeit', () => {
    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 1,
            results: [
              { id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg', overview: 'ok' },
            ],
          },
        ],
      },
    }))

    mockUseQueries.mockReturnValue([
      { isLoading: false, isSuccess: true, isError: false, data: { state: 'unknown', isStreamable: null } },
    ])

    renderSearch(['/search?q=test&streamable=true'])

    expect(screen.getByText('Bei 1 Treffern konnte die Streaming-Verfügbarkeit nicht geprüft werden.')).toBeInTheDocument()
    expect(screen.getByText('Keine streambare Ergebnisse')).toBeInTheDocument()
  })

  it('prüft bei "Nur Streambar" initial nur das erste Arbeitsfenster', () => {
    const manyResults = Array.from({ length: 80 }, (_, i) => ({
      id: i + 1,
      media_type: 'movie',
      title: `Film ${i + 1}`,
      poster_path: `/p-${i + 1}.jpg`,
      overview: 'ok',
    }))

    mockUseInfiniteQuery.mockReturnValue(buildInfiniteState({
      data: {
        pages: [
          {
            page: 1,
            total_pages: 1,
            results: manyResults,
          },
        ],
      },
    }))

    mockUseQueries.mockReturnValue(
      Array.from({ length: 60 }, () => ({
        isLoading: false,
        isSuccess: true,
        isError: false,
        data: { state: 'streamable', isStreamable: true },
      }))
    )

    renderSearch(['/search?q=test&streamable=true'])

    const queryConfig = mockUseQueries.mock.calls[0][0]
    expect(queryConfig.queries).toHaveLength(60)
    expect(screen.getByText('Aktuell werden die ersten 60 Treffer auf Streambarkeit geprüft. Beim Weiter-Scrollen werden weitere geprüft.')).toBeInTheDocument()
  })
})



