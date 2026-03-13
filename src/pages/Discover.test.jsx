import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Discover from './Discover'
import { discoverMovies } from '../api/movies'
import { discoverTv } from '../api/tv'

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}))

vi.mock('../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn(() => vi.fn()),
}))

vi.mock('../hooks/useProviders', () => ({
  useGenres: vi.fn(() => ({
    data: [
      { id: 28, name: 'Action' },
      { id: 35, name: 'Komödie' },
      { id: 18, name: 'Drama' },
    ],
  })),
  useWatchProviders: vi.fn(() => ({
    data: [
      { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg', display_priority: 1 },
    ],
  })),
}))

vi.mock('../api/movies', () => ({
  discoverMovies: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  discoverTv: vi.fn(),
}))

vi.mock('../components/common/MediaCard', () => ({
  default: ({ media }) => (
    <div data-testid="media-card">{media.title || media.name}</div>
  ),
}))

vi.mock('../components/common/GridSkeleton', () => ({
  default: () => <div data-testid="grid-skeleton" />,
}))

vi.mock('../components/common/ErrorBox', () => ({
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

vi.mock('../components/common/Select', () => ({
  default: ({ value, onChange, options, placeholder }) => (
    <select
      data-testid={`select-${placeholder}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}))

vi.mock('../components/common/ProviderFilter', () => ({
  default: ({ providers }) => (
    providers ? <div data-testid="provider-filter">{providers.length} Anbieter</div> : null
  ),
}))

vi.mock('../components/common/ScrollToTop', () => ({
  default: () => null,
}))

function createWrapper(initialEntries = ['/discover']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function renderDiscover(initialEntries) {
  const Wrapper = createWrapper(initialEntries)
  return render(<Discover />, { wrapper: Wrapper })
}

function openAdvancedFilters() {
  const openButton = screen.queryByRole('button', { name: 'Weitere Filter anzeigen' })
  if (openButton) fireEvent.click(openButton)
}

describe('Discover Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    discoverMovies.mockResolvedValue({ page: 1, total_pages: 1, results: [] })
    discoverTv.mockResolvedValue({ page: 1, total_pages: 1, results: [] })
  })

  it('rendert Grundstruktur mit Standardauswahl', () => {
    renderDiscover()

    expect(screen.getByText('Entdecken')).toBeInTheDocument()
    expect(screen.getByText('Filme')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Beliebtheit')).toHaveAttribute('aria-pressed', 'true')
  })

  it('wechselt Medientyp und Sortierung per Klick', () => {
    renderDiscover()

    fireEvent.click(screen.getByText('Serien'))
    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByText('Bewertung'))
    expect(screen.getByText('Bewertung')).toHaveAttribute('aria-pressed', 'true')
  })

  it('zeigt erweiterte Filter, erlaubt Genre-Toggle und Reset', () => {
    renderDiscover()
    openAdvancedFilters()

    const actionButton = screen.getByText('Action')
    expect(actionButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(actionButton)
    expect(actionButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Filter zurücksetzen')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Filter zurücksetzen'))
    expect(actionButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('zeigt den Provider-Filter in den erweiterten Filtern', () => {
    renderDiscover()
    openAdvancedFilters()

    expect(screen.getByTestId('provider-filter')).toBeInTheDocument()
  })

  it('liest type und sort aus URL-Parametern', () => {
    renderDiscover(['/discover?type=tv&sort=rating'])

    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Bewertung')).toHaveAttribute('aria-pressed', 'true')
  })
})
