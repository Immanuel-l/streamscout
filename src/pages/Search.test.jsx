import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Search from './Search'

// Mock hooks
vi.mock('../hooks/useDebounce', () => ({
  useDebounce: vi.fn((val) => val),
}))

vi.mock('../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn(() => vi.fn()),
}))

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}))

// Mock API modules
vi.mock('../api/common', () => ({
  searchMulti: vi.fn(),
  searchMovies: vi.fn(),
  searchTv: vi.fn(),
  searchPerson: vi.fn(),
}))

vi.mock('../api/movies', () => ({
  getMovieProviders: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  getTvProviders: vi.fn(),
}))

// Mock child components
vi.mock('../components/search/SearchBar', () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
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
  default: () => <div data-testid="grid-skeleton" />,
}))

vi.mock('../components/common/ErrorBox', () => ({
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

vi.mock('../components/common/ScrollToTop', () => ({
  default: () => null,
}))

function createWrapper(initialEntries = ['/search']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function renderSearch(initialEntries) {
  const Wrapper = createWrapper(initialEntries)
  return render(<Search />, { wrapper: Wrapper })
}

describe('Search Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('zeigt den initialen Zustand ohne Sucheingabe', () => {
    renderSearch()
    expect(screen.getByText('Suche')).toBeInTheDocument()
    expect(screen.getByText('Finde Filme, Serien und Personen')).toBeInTheDocument()
    expect(screen.getByText('Gib mindestens 2 Zeichen ein, um zu suchen.')).toBeInTheDocument()
  })

  it('zeigt Filter-Controls wenn eine Suche aktiv ist', () => {
    renderSearch(['/search?q=test'])
    expect(screen.getByText('Alle')).toBeInTheDocument()
    expect(screen.getByText('Filme')).toBeInTheDocument()
    expect(screen.getByText('Serien')).toBeInTheDocument()
    expect(screen.getByText('Personen')).toBeInTheDocument()
  })

  it('zeigt Sortier-Optionen bei aktiver Suche', () => {
    renderSearch(['/search?q=test'])
    expect(screen.getByText('Relevanz')).toBeInTheDocument()
    expect(screen.getByText('Bewertung')).toBeInTheDocument()
    expect(screen.getByText('Jahr')).toBeInTheDocument()
  })

  it('zeigt den Streambar-Filter bei aktiver Suche', () => {
    renderSearch(['/search?q=test'])
    expect(screen.getByText('Nur Streambar')).toBeInTheDocument()
  })

  it('versteckt Sortier- und Streambar-Filter bei Personen-Suche', () => {
    renderSearch(['/search?q=test&type=person'])
    expect(screen.queryByText('Relevanz')).not.toBeInTheDocument()
    expect(screen.queryByText('Nur Streambar')).not.toBeInTheDocument()
  })

  it('setzt den Medientyp per aria-pressed', () => {
    renderSearch(['/search?q=test'])
    const alleBtn = screen.getByText('Alle')
    expect(alleBtn).toHaveAttribute('aria-pressed', 'true')
    const filmeBtn = screen.getByText('Filme')
    expect(filmeBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('wechselt den Medientyp per Klick', () => {
    renderSearch(['/search?q=test'])
    const filmeBtn = screen.getByText('Filme')
    fireEvent.click(filmeBtn)
    expect(filmeBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('initialisiert den Suchbegriff aus URL-Parametern', () => {
    renderSearch(['/search?q=matrix'])
    const input = screen.getByTestId('search-bar')
    expect(input).toHaveValue('matrix')
  })

  it('zeigt die Suchleiste', () => {
    renderSearch()
    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
  })
})
