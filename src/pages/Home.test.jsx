import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import { moods } from '../utils/moods'

const mockUseDocumentTitle = vi.fn()
const mockSetKinoSort = vi.fn()
const mockUsePersistedState = vi.fn()

const mockUseNowPlaying = vi.fn()
const mockUsePopularMovies = vi.fn()
const mockUseTopRatedMovies = vi.fn()
const mockUseNewMovies = vi.fn()
const mockUsePopularAnime = vi.fn()
const mockUseTrendingAll = vi.fn()

const mockUsePopularTv = vi.fn()
const mockUseTopRatedTv = vi.fn()
const mockUseNewTv = vi.fn()
const mockGetMovieReleaseDates = vi.fn()
const mockGetTvContentRatings = vi.fn()

vi.mock('../hooks/useDocumentTitle', () => ({
  useDocumentTitle: (title) => mockUseDocumentTitle(title),
}))

vi.mock('../hooks/usePersistedState', () => ({
  usePersistedState: (...args) => mockUsePersistedState(...args),
}))

vi.mock('../hooks/useMovies', () => ({
  useNowPlaying: () => mockUseNowPlaying(),
  usePopularMovies: () => mockUsePopularMovies(),
  useTopRatedMovies: () => mockUseTopRatedMovies(),
  useNewMovies: () => mockUseNewMovies(),
  usePopularAnime: () => mockUsePopularAnime(),
  useTrendingAll: () => mockUseTrendingAll(),
}))

vi.mock('../hooks/useTv', () => ({
  usePopularTv: () => mockUsePopularTv(),
  useTopRatedTv: () => mockUseTopRatedTv(),
  useNewTv: () => mockUseNewTv(),
}))

vi.mock('../api/movies', () => ({
  getMovieReleaseDates: (...args) => mockGetMovieReleaseDates(...args),
}))

vi.mock('../api/tv', () => ({
  getTvContentRatings: (...args) => mockGetTvContentRatings(...args),
}))

vi.mock('../components/common/MediaRow', () => ({
  default: ({ title, items = [], sortBy, onSortChange }) => (
    <section data-testid={`row-${title}`}>
      <h3>{title}</h3>
      <p>{items.map((item) => item.title || item.name).join(' | ')}</p>
      {onSortChange ? (
        <>
          <button type="button" onClick={() => onSortChange('popularity')}>
            Sortiere {title}
          </button>
          <span>{`Sortierung: ${sortBy}`}</span>
        </>
      ) : null}
    </section>
  ),
}))

vi.mock('../components/common/WatchlistButton', () => ({
  default: ({ media }) => <div data-testid="watchlist-button">Watchlist: {media.title || media.name}</div>,
}))

vi.mock('../components/home/WatchlistRecommendations', () => ({
  default: () => <div data-testid="watchlist-recommendations" />,
}))

vi.mock('../api/tmdb', () => ({
  backdropUrl: (path) => `https://image.test${path}`,
}))

const kinoMovies = [
  { id: 1, title: 'Kino A', popularity: 20, release_date: '2026-03-10', media_type: 'movie' },
  { id: 2, title: 'Kino B', popularity: 90, release_date: '2026-03-09', media_type: 'movie' },
  { id: 3, title: 'Kino C', popularity: 40, release_date: '2026-03-08', media_type: 'movie' },
]

const heroMovie = {
  id: 101,
  media_type: 'movie',
  title: 'Hero Film',
  overview: 'Hero Beschreibung',
  backdrop_path: '/hero.jpg',
  vote_average: 8.1,
  release_date: '2025-04-01',
}

const heroSeries = {
  id: 202,
  media_type: 'tv',
  name: 'Hero Serie',
  overview: 'Serien Beschreibung',
  backdrop_path: '/hero-tv.jpg',
  vote_average: 7.4,
  first_air_date: '2024-05-01',
}

function queryResult(data = []) {
  return {
    data,
    isLoading: false,
    error: null,
  }
}

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseDocumentTitle.mockImplementation(() => {})
    mockUsePersistedState.mockReturnValue(['recommended', mockSetKinoSort])

    mockUseNowPlaying.mockReturnValue({ data: { movies: kinoMovies }, isLoading: false, error: null })
    mockGetMovieReleaseDates.mockResolvedValue([{ iso_3166_1: 'DE', release_dates: [{ type: 3, certification: '12' }] }])
    mockGetTvContentRatings.mockResolvedValue([{ iso_3166_1: 'DE', rating: '16' }])
    mockUseTrendingAll.mockReturnValue({ data: [heroMovie], isLoading: false, error: null })

    mockUsePopularMovies.mockReturnValue(queryResult([{ id: 11, title: 'Beliebter Film' }]))
    mockUsePopularTv.mockReturnValue(queryResult([{ id: 12, name: 'Beliebte Serie' }]))
    mockUsePopularAnime.mockReturnValue(queryResult([{ id: 13, name: 'Anime Highlight' }]))
    mockUseTopRatedMovies.mockReturnValue(queryResult([{ id: 14, title: 'Top Film' }]))
    mockUseTopRatedTv.mockReturnValue(queryResult([{ id: 15, name: 'Top Serie' }]))
    mockUseNewMovies.mockReturnValue(queryResult([{ id: 16, title: 'Neuer Film' }]))
    mockUseNewTv.mockReturnValue(queryResult([{ id: 17, name: 'Neue Serie' }]))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rendert Hero, Mood-Bereich und zentrale Reihen', async () => {
    mockUsePersistedState.mockReturnValue(['popularity', mockSetKinoSort])
    mockUseTrendingAll.mockReturnValue({
      data: [
        { id: 999, media_type: 'movie', title: 'Ohne Hero', backdrop_path: null, overview: 'x' },
        heroMovie,
      ],
      isLoading: false,
      error: null,
    })

    renderHome()

    expect(mockUseDocumentTitle).toHaveBeenCalledWith(null)
    expect(screen.getByText('Hero Film')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('FSK 12')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Details ansehen' })).toHaveAttribute('href', '/movie/101')
    expect(screen.getByTestId('watchlist-button')).toHaveTextContent('Watchlist: Hero Film')

    fireEvent.click(screen.getByRole('button', { name: 'Sortiere Aktuell im Kino' }))
    expect(mockSetKinoSort).toHaveBeenCalledWith('popularity')

    expect(screen.getByTestId('watchlist-recommendations')).toBeInTheDocument()
    expect(screen.getByTestId('row-Beliebte Filme')).toBeInTheDocument()
    expect(screen.getByTestId('row-Beliebte Serien')).toBeInTheDocument()

    for (const mood of moods) {
      expect(screen.getByText(mood.title)).toBeInTheDocument()
    }
  })

  it('wechselt Hero-Slides über den Weiter-Button', () => {
    vi.useFakeTimers()
    mockGetMovieReleaseDates.mockImplementation(() => new Promise(() => {}))
    mockGetTvContentRatings.mockImplementation(() => new Promise(() => {}))
    mockUseTrendingAll.mockReturnValue({ data: [heroMovie, heroSeries], isLoading: false, error: null })

    renderHome()

    expect(screen.getByText('Hero Film')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Nächster Slide'))

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText('Hero Serie')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Details ansehen' })).toHaveAttribute('href', '/tv/202')
  })
})
