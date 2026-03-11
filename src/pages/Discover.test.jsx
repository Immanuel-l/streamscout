import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Discover from './Discover'

// Mock hooks
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

// Mock API modules
vi.mock('../api/movies', () => ({
  discoverMovies: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  discoverTv: vi.fn(),
}))

// Mock child components
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

describe('Discover Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('zeigt die Überschrift "Entdecken"', () => {
    renderDiscover()
    expect(screen.getByText('Entdecken')).toBeInTheDocument()
  })

  it('zeigt Medientyp-Toggle für Filme und Serien', () => {
    renderDiscover()
    expect(screen.getByText('Filme')).toBeInTheDocument()
    expect(screen.getByText('Serien')).toBeInTheDocument()
  })

  it('hat Filme standardmäßig ausgewählt', () => {
    renderDiscover()
    const filmeBtn = screen.getByText('Filme')
    expect(filmeBtn).toHaveAttribute('aria-pressed', 'true')
    const serienBtn = screen.getByText('Serien')
    expect(serienBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('wechselt den Medientyp per Klick', () => {
    renderDiscover()
    const serienBtn = screen.getByText('Serien')
    fireEvent.click(serienBtn)
    expect(serienBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('zeigt Sortier-Optionen', () => {
    renderDiscover()
    expect(screen.getByText('Beliebtheit')).toBeInTheDocument()
    expect(screen.getByText('Bewertung')).toBeInTheDocument()
    expect(screen.getByText('Erscheinungsdatum')).toBeInTheDocument()
  })

  it('hat Beliebtheit als Standard-Sortierung', () => {
    renderDiscover()
    expect(screen.getByText('Beliebtheit')).toHaveAttribute('aria-pressed', 'true')
  })

  it('wechselt die Sortierung per Klick', () => {
    renderDiscover()
    const ratingBtn = screen.getByText('Bewertung')
    fireEvent.click(ratingBtn)
    expect(ratingBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('zeigt Genre-Buttons', () => {
    renderDiscover()
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Komödie')).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })

  it('toggled Genre-Auswahl per Klick', () => {
    renderDiscover()
    const actionBtn = screen.getByText('Action')
    expect(actionBtn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(actionBtn)
    expect(actionBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('zeigt Jahr- und Bewertungs-Select', () => {
    renderDiscover()
    expect(screen.getByTestId('select-Alle Jahre')).toBeInTheDocument()
    expect(screen.getByTestId('select-Alle')).toBeInTheDocument()
  })

  it('zeigt Provider-Filter', () => {
    renderDiscover()
    expect(screen.getByTestId('provider-filter')).toBeInTheDocument()
  })

  it('zeigt "Filter zurücksetzen" wenn Filter aktiv sind', () => {
    renderDiscover()
    // Click a genre to activate filters
    fireEvent.click(screen.getByText('Action'))
    expect(screen.getByText('Filter zurücksetzen')).toBeInTheDocument()
  })

  it('versteckt "Filter zurücksetzen" im Standard-Zustand', () => {
    renderDiscover()
    expect(screen.queryByText('Filter zurücksetzen')).not.toBeInTheDocument()
  })

  it('setzt Filter per "Filter zurücksetzen" zurück', () => {
    renderDiscover()
    // Activate a genre filter
    fireEvent.click(screen.getByText('Action'))
    expect(screen.getByText('Action')).toHaveAttribute('aria-pressed', 'true')
    // Reset
    fireEvent.click(screen.getByText('Filter zurücksetzen'))
    expect(screen.getByText('Action')).toHaveAttribute('aria-pressed', 'false')
  })

  it('initialisiert Medientyp aus URL-Parametern', () => {
    renderDiscover(['/discover?type=tv'])
    expect(screen.getByText('Serien')).toHaveAttribute('aria-pressed', 'true')
  })

  it('initialisiert Sortierung aus URL-Parametern', () => {
    renderDiscover(['/discover?sort=rating'])
    expect(screen.getByText('Bewertung')).toHaveAttribute('aria-pressed', 'true')
  })
})
