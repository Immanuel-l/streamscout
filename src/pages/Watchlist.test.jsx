import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
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

const sampleItems = [
  { id: 1, media_type: 'movie', title: 'Testfilm', poster_path: '/p1.jpg', vote_average: 8.0, release_date: '2024-01-01' },
  { id: 2, media_type: 'tv', name: 'Testserie', poster_path: '/p2.jpg', vote_average: 7.5, first_air_date: '2024-06-01' },
  { id: 3, media_type: 'movie', title: 'Anderer Film', poster_path: '/p3.jpg', vote_average: 6.0, release_date: '2023-05-01' },
]

function renderWatchlist(initialEntries = ['/watchlist']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Watchlist />
    </MemoryRouter>
  )
}

describe('Watchlist Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWatchlist.mockReturnValue({
      items: [],
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
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
    expect(screen.getByText(/^Alle/)).toBeInTheDocument()
    expect(screen.getByText(/^Filme/)).toBeInTheDocument()
    expect(screen.getByText(/^Serien/)).toBeInTheDocument()
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

  it('zeigt Sortier-Optionen', () => {
    useWatchlist.mockReturnValue({
      items: sampleItems,
      remove: mockRemove,
      mergeItems: mockMergeItems,
      generateShareLink: mockGenerateShareLink,
      fetchSharedList: mockFetchSharedList,
    })
    renderWatchlist()
    expect(screen.getByText('Zuletzt hinzugefügt')).toBeInTheDocument()
    expect(screen.getByText('Bewertung')).toBeInTheDocument()
    expect(screen.getByText('A–Z')).toBeInTheDocument()
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
})
