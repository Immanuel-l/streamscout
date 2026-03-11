import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Random from './Random'

const mockUseDocumentTitle = vi.fn()
const mockUseGenres = vi.fn()
const mockUseWatchProviders = vi.fn()
const mockDiscoverMovies = vi.fn()
const mockDiscoverTv = vi.fn()

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (...args) => mockUseDocumentTitle(...args),
}))

vi.mock('../hooks/useProviders', () => ({
  useGenres: (...args) => mockUseGenres(...args),
  useWatchProviders: (...args) => mockUseWatchProviders(...args),
}))

vi.mock('../api/movies', () => ({
  discoverMovies: (...args) => mockDiscoverMovies(...args),
}))

vi.mock('../api/tv', () => ({
  discoverTv: (...args) => mockDiscoverTv(...args),
}))

vi.mock('../api/tmdb', () => ({
  posterUrl: (path) => (path ? `https://img.test/poster${path}` : null),
  backdropUrl: (path) => (path ? `https://img.test/backdrop${path}` : null),
}))

vi.mock('../components/common/WatchlistButton', () => ({
  default: () => <button data-testid="watchlist-button">watchlist</button>,
}))

vi.mock('../components/common/ErrorBox', () => ({
  default: ({ message }) => <div data-testid="error-box">{message}</div>,
}))

vi.mock('../components/common/Select', () => ({
  default: ({ value, onChange, options }) => (
    <select data-testid="mock-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}))

vi.mock('../components/common/ProviderFilter', () => ({
  default: ({ selected = [], onToggle }) => (
    <div>
      <div data-testid="provider-selected-count">{selected.length}</div>
      <button type="button" onClick={() => onToggle(8)}>toggle-provider-8</button>
    </div>
  ),
}))

const sampleMovie = {
  id: 101,
  media_type: 'movie',
  title: 'Der Zufallsfilm',
  poster_path: '/movie.jpg',
  backdrop_path: '/movie-bg.jpg',
  overview: 'Ein guter Film',
  vote_average: 7.5,
  release_date: '2021-05-02',
  original_language: 'de',
}

const sampleTv = {
  id: 55,
  media_type: 'tv',
  name: 'Die Zufallsserie',
  poster_path: '/tv.jpg',
  backdrop_path: '/tv-bg.jpg',
  overview: 'Eine gute Serie',
  vote_average: 8.2,
  first_air_date: '2022-01-01',
  original_language: 'en',
}

function discoveryResponse(results, overrides = {}) {
  return {
    page: 1,
    total_pages: 1,
    total_results: results.length,
    results,
    ...overrides,
  }
}

function renderRandom(initialEntries = ['/random']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/random" element={<Random />} />
        <Route path="/movie/:id" element={<div data-testid="movie-detail-page" />} />
        <Route path="/tv/:id" element={<div data-testid="tv-detail-page" />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Random Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseGenres.mockReturnValue({ data: [{ id: 28, name: 'Action' }] })
    mockUseWatchProviders.mockReturnValue({ data: [{ provider_id: 8, provider_name: 'Netflix' }] })

    mockDiscoverMovies.mockResolvedValue(discoveryResponse([sampleMovie]))
    mockDiscoverTv.mockResolvedValue(discoveryResponse([sampleTv]))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rendert Standardzustand und Dokumenttitel', () => {
    renderRandom()

    expect(screen.getByRole('heading', { name: 'Zufallsgenerator' })).toBeInTheDocument()
    expect(screen.getByText('Film')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Serie')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/W.hle deine Filter/)).toBeInTheDocument()
    expect(mockUseDocumentTitle).toHaveBeenCalledWith('Zufallsgenerator')
  })

  it('wuerfelt erfolgreich fuer Filme und rendert Ergebniskarte', async () => {
    renderRandom()

    fireEvent.click(screen.getByText('Würfeln!'))

    await waitFor(() => {
      expect(mockDiscoverMovies).toHaveBeenCalledTimes(1)
    })

    expect(mockDiscoverMovies).toHaveBeenCalledWith(expect.objectContaining({
      sort_by: 'popularity.desc',
      'vote_count.gte': 50,
      page: 1,
    }))

    expect(await screen.findByText('Der Zufallsfilm')).toBeInTheDocument()
    expect(screen.getByTestId('watchlist-button')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zur Detailseite' })).toHaveAttribute('href', '/movie/101')
  })

  it('wechselt auf Serien und nutzt discoverTv', async () => {
    renderRandom()

    fireEvent.click(screen.getByText('Serie'))
    fireEvent.click(screen.getByText('Würfeln!'))

    await waitFor(() => {
      expect(mockDiscoverTv).toHaveBeenCalledTimes(1)
    })

    expect(mockUseGenres).toHaveBeenLastCalledWith('tv')
    expect(await screen.findByText('Die Zufallsserie')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zur Detailseite' })).toHaveAttribute('href', '/tv/55')
  })

  it('uebergibt gesetzte Filter an discoverMovies', async () => {
    renderRandom()

    const selects = screen.getAllByTestId('mock-select')
    fireEvent.change(selects[0], { target: { value: '28' } })
    fireEvent.change(selects[1], { target: { value: '7' } })
    fireEvent.change(selects[2], { target: { value: 'de' } })
    fireEvent.change(selects[3], { target: { value: '2010' } })

    fireEvent.click(screen.getByText('toggle-provider-8'))
    expect(screen.getByTestId('provider-selected-count')).toHaveTextContent('1')

    fireEvent.click(screen.getByText('Würfeln!'))

    await waitFor(() => {
      expect(mockDiscoverMovies).toHaveBeenCalledTimes(1)
    })

    expect(mockDiscoverMovies).toHaveBeenCalledWith(expect.objectContaining({
      with_genres: '28',
      'vote_average.gte': '7',
      with_original_language: 'de',
      'primary_release_date.gte': '2010-01-01',
      with_watch_providers: '8',
    }))
  })

  it('zeigt Fehler wenn keine Ergebnisse fuer Filter existieren', async () => {
    mockDiscoverMovies.mockResolvedValue(discoveryResponse([], { total_pages: 0, total_results: 0 }))

    renderRandom()
    fireEvent.click(screen.getByText('Würfeln!'))

    expect(await screen.findByText(/Keine Ergebnisse f.r diese Filter/)).toBeInTheDocument()
  })

  it('nutzt Retry-Loop bei nicht passenden Sprachen und zeigt Fehler', async () => {
    const frenchOnly = discoveryResponse([
      {
        ...sampleMovie,
        id: 201,
        title: 'Film FR',
        original_language: 'fr',
      },
    ], { total_pages: 2, total_results: 10 })

    mockDiscoverMovies.mockResolvedValue(frenchOnly)
    vi.spyOn(Math, 'random').mockReturnValue(0)

    renderRandom()
    fireEvent.click(screen.getByText('Würfeln!'))

    expect(await screen.findByText(/Keine passenden Ergebnisse gefunden/)).toBeInTheDocument()
    expect(mockDiscoverMovies).toHaveBeenCalledTimes(3)
  })

  it('zeigt technischen Fehler wenn API-Call fehlschlaegt', async () => {
    mockDiscoverMovies.mockRejectedValue(new Error('boom'))

    renderRandom()
    fireEvent.click(screen.getByText('Würfeln!'))

    expect(await screen.findByText(/Fehler beim Laden/)).toBeInTheDocument()
  })

  it('zeigt Loading-Zustand waehrend Wuerfeln', async () => {
    mockDiscoverMovies.mockImplementation(() => new Promise(() => {}))

    renderRandom()
    fireEvent.click(screen.getByText('Würfeln!'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /W.rfle/ })).toBeDisabled()
    })
  })

  it('startet bei Klick auf Nochmal einen weiteren Roll', async () => {
    renderRandom()

    fireEvent.click(screen.getByText('Würfeln!'))
    await screen.findByText('Der Zufallsfilm')

    fireEvent.click(screen.getByText('Nochmal'))

    await waitFor(() => {
      expect(mockDiscoverMovies).toHaveBeenCalledTimes(2)
    })
  })
})
