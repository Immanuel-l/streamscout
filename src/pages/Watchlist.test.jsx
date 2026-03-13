import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Watchlist from './Watchlist'

const mockRemove = vi.fn()
const mockMergeItems = vi.fn(() => ({ success: true, count: 1 }))
const mockGenerateShareLink = vi.fn(() => 'https://example.com/watchlist?share=m1')
const mockFetchSharedList = vi.fn(() => Promise.resolve({ success: true, items: [] }))
const mockToast = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}))

vi.mock('../hooks/useWatchlist', () => ({
  SHARE_ITEM_LIMIT: 100,
  useWatchlist: vi.fn(() => ({
    items: [],
    remove: mockRemove,
    mergeItems: mockMergeItems,
    generateShareLink: mockGenerateShareLink,
    fetchSharedList: mockFetchSharedList,
  })),
}))

vi.mock('../hooks/useWatchlistProviders', () => ({
  useWatchlistProviders: vi.fn(() => ({
    isLoading: false,
    providerMap: {},
    availableProviders: [],
  })),
}))

vi.mock('../hooks/useProviders', () => ({
  useGenres: vi.fn(() => ({
    data: [
      { id: 28, name: 'Action' },
      { id: 18, name: 'Drama' },
    ],
  })),
}))

vi.mock('../utils/fskAvailability', () => ({
  getFskAvailabilityQueryOptions: (mediaType, id, enabled = true) => ({
    queryKey: ['mock-fsk', mediaType, id],
    queryFn: () => Promise.resolve({ state: 'unknown', certification: null }),
    enabled,
    staleTime: 0,
    retry: false,
  }),
}))

vi.mock('../components/common/useToast', () => ({
  useToast: vi.fn(() => mockToast),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../components/common/MediaCard', () => ({
  default: ({ media }) => (
    <div data-testid="media-card">{media.title || media.name}</div>
  ),
}))

vi.mock('../components/home/WatchlistRecommendations', () => ({
  default: () => <div data-testid="recommendations" />,
}))

vi.mock('../api/tmdb', () => ({
  IMAGE_BASE: 'https://image.tmdb.org/t/p',
}))

// Import the mock to change return values in individual tests
import { useWatchlist } from '../hooks/useWatchlist'
import { useWatchlistProviders } from '../hooks/useWatchlistProviders'
import { useGenres } from '../hooks/useProviders'

const sampleItems = [
  { id: 1, media_type: 'movie', title: 'Testfilm', poster_path: '/p1.jpg', vote_average: 8.0, release_date: '2024-01-01', genre_ids: [28] },
  { id: 2, media_type: 'tv', name: 'Testserie', poster_path: '/p2.jpg', vote_average: 7.5, first_air_date: '2024-06-01', genre_ids: [18] },
  { id: 3, media_type: 'movie', title: 'Anderer Film', poster_path: '/p3.jpg', vote_average: 6.0, release_date: '2023-05-01', genre_ids: [18] },
]

function renderWatchlist(initialEntries = ['/watchlist']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Watchlist />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Watchlist Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn()
    }
    useWatchlist.mockReturnValue({
      items: [],
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    useWatchlistProviders.mockReturnValue({
      isLoading: false,
      providerMap: {},
      availableProviders: [],
    })
    useGenres.mockReturnValue({
      data: [
        { id: 28, name: 'Action' },
        { id: 18, name: 'Drama' },
      ],
    })
  })

  it('zeigt den leeren Zustand', () => {
    renderWatchlist()
    expect(screen.getByText('Merkliste')).toBeInTheDocument()
    expect(screen.getByText('Deine Merkliste ist leer')).toBeInTheDocument()
    expect(screen.getByText('Entdecken')).toBeInTheDocument()
  })

  it('zeigt den Entdecken-Link im leeren Zustand', () => {
    renderWatchlist()
    const link = screen.getByText('Entdecken')
    expect(link.closest('a')).toHaveAttribute('href', '/discover')
  })

  it('zeigt Einträge wenn Watchlist gefüllt ist', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    expect(screen.getByText('3 Einträge')).toBeInTheDocument()
    expect(screen.getAllByTestId('media-card')).toHaveLength(3)
  })

  it('zeigt Tabs für Alle, Filme und Serien', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    // Tabs include counts
    expect(screen.getByRole('button', { name: /^Alle \(/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Filme \(/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Serien \(/ })).toBeInTheDocument()
  })

  it('filtert nach Medientyp', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    // Filter to Serien only
    const serienBtn = screen.getByText(/^Serien/)
    fireEvent.click(serienBtn)
    expect(screen.getAllByTestId('media-card')).toHaveLength(1)
  })

  it('zeigt im All-Tab bei Anbieterfilter einen neutralen Empty-Text', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    useWatchlistProviders.mockReturnValue({
      isLoading: false,
      providerMap: {},
      availableProviders: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' }],
    })

    renderWatchlist()
    fireEvent.click(screen.getByRole('button', { name: 'Weitere Filter anzeigen' }))
    fireEvent.click(screen.getByLabelText('Netflix aktivieren'))

    expect(screen.getByText('Keine Einträge für die gewählten Anbieter.')).toBeInTheDocument()
    expect(screen.queryByText(/Keine Serien auf der Merkliste/)).not.toBeInTheDocument()
  })

  it('zeigt FSK-Filter in den erweiterten Listenfiltern', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })

    renderWatchlist()
    fireEvent.click(screen.getByRole('button', { name: 'Weitere Filter anzeigen' }))

    expect(screen.getByRole('combobox', { name: 'FSK' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('combobox', { name: 'FSK' }))
    fireEvent.click(screen.getByRole('option', { name: 'FSK 12' }))

    expect(screen.getByText('Bis FSK')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Genau FSK')).toBeInTheDocument()
    expect(screen.getByText('Ab FSK')).toBeInTheDocument()
  })

  it('zeigt Sortier-Optionen', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    expect(screen.getByRole('button', { name: 'Zuletzt hinzugefügt' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bewertung' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'A–Z' })).toBeInTheDocument()
  })

  it('zeigt den Link-teilen-Button bei gefüllter Liste', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    expect(screen.getByText('Link teilen')).toBeInTheDocument()
  })

  it('zeigt beim Teilen einen Hinweis wenn mehr als 100 Einträge vorhanden sind', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const manyItems = Array.from({ length: 101 }, (_, i) => ({
      id: i + 1,
      media_type: 'movie',
      title: `Film ${i + 1}`,
      poster_path: '/p.jpg',
    }))

    useWatchlist.mockReturnValue({
      items: manyItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })

    renderWatchlist()
    fireEvent.click(screen.getByText('Link teilen'))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith('Link kopiert! Du kannst ihn jetzt teilen.', 'success')
    })

    expect(mockToast).toHaveBeenCalledWith(
      'Hinweis: Im Link wurden nur die ersten 100 Einträge berücksichtigt.',
      'warning'
    )
  })

  it('zeigt Empfehlungen bei gefüllter Liste', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    expect(screen.getByTestId('recommendations')).toBeInTheDocument()
  })

  it('zeigt "1 Eintrag" bei einzelnem Item', () => {
    useWatchlist.mockReturnValue({
      items: [sampleItems[0]],
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    expect(screen.getByText('1 Eintrag')).toBeInTheDocument()
  })

  it('ruft remove auf beim Klick auf den Entfernen-Button', () => {
    useWatchlist.mockReturnValue({
      items: [sampleItems[0]],
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    const removeBtn = screen.getByTitle('Von Merkliste entfernen')
    fireEvent.click(removeBtn)
    expect(mockRemove).toHaveBeenCalledWith(1, 'movie')
  })

  it('zeigt geteilte Merkliste im Shared View', async () => {
    renderWatchlist(['/watchlist?share=m1,t2'])
    expect(screen.getByText('Geteilte Merkliste')).toBeInTheDocument()
    await waitFor(() => expect(mockFetchSharedList).toHaveBeenCalledWith('m1,t2'))
  })

  it('zeigt Warnungen für ungültige oder abgeschnittene Share-Einträge', async () => {
    mockFetchSharedList.mockResolvedValueOnce({
      success: true,
      items: [{ id: 1, media_type: 'movie', title: 'Testfilm', poster_path: '/p.jpg' }],
      failedCount: 1,
      invalidCount: 2,
      truncatedCount: 3,
    })

    renderWatchlist(['/watchlist?share=m1,m2'])

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.stringContaining('Einige konnten nicht abgerufen werden.'),
        'warning'
      )
    })

    const warningMessage = mockToast.mock.calls[0][0]
    expect(warningMessage).toContain('2 Link-Einträge waren ungültig')
    expect(warningMessage).toContain('3 Einträge wurden wegen des Limits von 100 nicht importiert.')
  })
  it('zeigt Fehler-Toast wenn Link-Kopieren scheitert', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard blocked'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })

    renderWatchlist()
    fireEvent.click(screen.getByText('Link teilen'))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith('Fehler beim Kopieren des Links', 'error')
    })
  })

  it('zeigt Fehler-Toast wenn eine geteilte Liste nicht geladen werden kann', async () => {
    mockFetchSharedList.mockResolvedValueOnce({
      success: false,
      error: 'Geteilte Liste konnte nicht geladen werden.',
    })

    renderWatchlist(['/watchlist?share=m1'])

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith('Geteilte Liste konnte nicht geladen werden.', 'error')
    })
  })
})




