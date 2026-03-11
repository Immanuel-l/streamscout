import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Kino from './Kino'

const mockUseDocumentTitle = vi.fn()
const mockUseNowPlaying = vi.fn()
const mediaCardCalls = []

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (...args) => mockUseDocumentTitle(...args),
}))

vi.mock('../hooks/useMovies', () => ({
  useNowPlaying: (...args) => mockUseNowPlaying(...args),
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
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

const moviesDateOrder = [
  { id: 1, title: 'Film A', popularity: 40 },
  { id: 2, title: 'Film B', popularity: 100 },
  { id: 3, title: 'Film C', popularity: 90 },
]

function renderKino(initialEntries = ['/kino']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Kino />
    </MemoryRouter>
  )
}

describe('Kino Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mediaCardCalls.length = 0
    mockUseNowPlaying.mockReturnValue({
      data: { movies: moviesDateOrder },
      isLoading: false,
      error: null,
    })
  })

  it('rendert Header, Zurueck-Link und setzt Dokumenttitel', () => {
    renderKino()

    expect(screen.getByRole('heading', { name: 'Aktuell im Kino' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Zur.ck/i })).toHaveAttribute('href', '/')
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Aktuell im Kino')
  })

  it('zeigt Loading-Skeleton waehrend des Ladens', () => {
    mockUseNowPlaying.mockReturnValue({ data: undefined, isLoading: true, error: null })

    renderKino()
    expect(screen.getByTestId('grid-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('media-card')).not.toBeInTheDocument()
  })

  it('zeigt ErrorBox bei Fehler', () => {
    mockUseNowPlaying.mockReturnValue({ data: { movies: [] }, isLoading: false, error: new Error('boom') })

    renderKino()
    expect(screen.getByTestId('error-box')).toHaveTextContent('Kinofilme konnten nicht geladen werden. Bitte versuch es später nochmal.')
  })

  it('zeigt Empty-State wenn keine Kinofilme verfuegbar sind', () => {
    mockUseNowPlaying.mockReturnValue({ data: { movies: [] }, isLoading: false, error: null })

    renderKino()
    expect(screen.getByText('Keine Kinofilme verfügbar.')).toBeInTheDocument()
  })

  it('sortiert standardmaessig nach empfohlenem Mix', () => {
    renderKino()

    const cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film B')
    expect(cards[1]).toHaveTextContent('Film A')
    expect(cards[2]).toHaveTextContent('Film C')
    expect(mediaCardCalls.every((c) => c.eager === true)).toBe(true)
  })

  it('sortiert per Klick nach Kinostart und Beliebtheit', () => {
    renderKino()

    fireEvent.click(screen.getByText('Beliebtheit'))
    let cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film B')
    expect(cards[1]).toHaveTextContent('Film C')
    expect(cards[2]).toHaveTextContent('Film A')

    fireEvent.click(screen.getByText('Kinostart'))
    cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film A')
    expect(cards[1]).toHaveTextContent('Film B')
    expect(cards[2]).toHaveTextContent('Film C')
  })

  it('initialisiert Sortierung aus URL-Parametern', () => {
    renderKino(['/kino?sort=popularity'])

    const cards = screen.getAllByTestId('media-card')
    expect(cards[0]).toHaveTextContent('Film B')
    expect(cards[1]).toHaveTextContent('Film C')
    expect(cards[2]).toHaveTextContent('Film A')
  })
})
