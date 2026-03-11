import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useTrendingAll,
  usePopularMovies,
  useTopRatedMovies,
  useNewMovies,
  useDiscoverMovies,
  useMovieDetails,
  useMovieProviders,
  useMovieSimilar,
  useMovieRecommendations,
  useNowPlaying,
  usePopularAnime,
} from './useMovies'
import { useQuery } from '@tanstack/react-query'
import * as moviesApi from '../api/movies'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../api/movies', () => ({
  discoverMovies: vi.fn(),
  getMovieDetails: vi.fn(),
  getMovieProviders: vi.fn(),
  getMovieRecommendations: vi.fn(),
  getNowPlayingMovies: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  discoverTv: vi.fn(),
}))

function createEmptyQueryResult() {
  return { data: undefined, isLoading: false, error: null }
}

describe('useMovies hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQuery.mockImplementation(() => createEmptyQueryResult())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('usePopularMovies setzt Query-Konfiguration und mappt media_type', async () => {
    renderHook(() => usePopularMovies())

    const config = useQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['popular', 'movies'])
    expect(config.staleTime).toBe(60 * 60 * 1000)

    await config.queryFn()
    expect(moviesApi.discoverMovies).toHaveBeenCalledWith({
      sort_by: 'popularity.desc',
      'vote_average.gte': 5.5,
      'vote_count.gte': 50,
    })

    const mapped = config.select({ results: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] })
    expect(mapped).toEqual([
      { id: 1, title: 'A', media_type: 'movie' },
      { id: 2, title: 'B', media_type: 'movie' },
    ])
  })

  it('useTopRatedMovies und useNewMovies nutzen passende Discover-Parameter', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-11T10:00:00.000Z'))

    renderHook(() => useTopRatedMovies())
    renderHook(() => useNewMovies())

    const topRatedConfig = useQuery.mock.calls[0][0]
    const newConfig = useQuery.mock.calls[1][0]

    await topRatedConfig.queryFn()
    expect(moviesApi.discoverMovies).toHaveBeenCalledWith({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 200,
    })

    await newConfig.queryFn()
    expect(moviesApi.discoverMovies).toHaveBeenCalledWith({
      sort_by: 'primary_release_date.desc',
      'release_date.lte': '2026-03-11',
      'vote_count.gte': 5,
    })
  })

  it('useDiscoverMovies setzt enabled korrekt', () => {
    renderHook(() => useDiscoverMovies({ sort_by: 'popularity.desc' }))
    renderHook(() => useDiscoverMovies(null))

    const enabledConfig = useQuery.mock.calls[0][0]
    const disabledConfig = useQuery.mock.calls[1][0]

    expect(enabledConfig.queryKey).toEqual(['discover', 'movies', { sort_by: 'popularity.desc' }])
    expect(enabledConfig.enabled).toBe(true)
    expect(disabledConfig.enabled).toBe(false)
  })

  it('useMovieDetails und useMovieProviders setzen enabled anhand id', () => {
    renderHook(() => useMovieDetails(123))
    renderHook(() => useMovieDetails(0))
    renderHook(() => useMovieProviders(456))
    renderHook(() => useMovieProviders(undefined))

    expect(useQuery.mock.calls[0][0].enabled).toBe(true)
    expect(useQuery.mock.calls[1][0].enabled).toBe(false)
    expect(useQuery.mock.calls[2][0].enabled).toBe(true)
    expect(useQuery.mock.calls[3][0].enabled).toBe(false)
  })

  it('useMovieSimilar bildet Query-Key, QueryFn und select korrekt ab', async () => {
    renderHook(() => useMovieSimilar('42', [18, 53], [1, 2, 3]))

    const config = useQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['movie', '42', 'similar', '18|53', '1|2|3'])
    expect(config.enabled).toBe(true)

    await config.queryFn()
    expect(moviesApi.discoverMovies).toHaveBeenCalledWith({
      with_genres: '18|53',
      with_keywords: '1|2|3',
      sort_by: 'popularity.desc',
    })

    const selected = config.select({
      results: [
        { id: 42, title: 'Original' },
        { id: 50, title: 'Neu' },
      ],
    })

    expect(selected).toEqual([{ id: 50, title: 'Neu', media_type: 'movie' }])
  })

  it('useMovieSimilar deaktiviert Query ohne Genres und begrenzt Keywords auf 10', async () => {
    renderHook(() => useMovieSimilar(1, undefined, Array.from({ length: 12 }, (_, i) => i + 1)))
    const noGenreConfig = useQuery.mock.calls[0][0]
    expect(noGenreConfig.enabled).toBe(false)

    renderHook(() => useMovieSimilar(1, [12], Array.from({ length: 12 }, (_, i) => i + 1)))
    const withGenreConfig = useQuery.mock.calls[1][0]
    await withGenreConfig.queryFn()
    expect(moviesApi.discoverMovies).toHaveBeenCalledWith({
      with_genres: '12',
      with_keywords: '1|2|3|4|5|6|7|8|9|10',
      sort_by: 'popularity.desc',
    })
  })

  it('useMovieRecommendations mappt media_type', () => {
    renderHook(() => useMovieRecommendations(7))
    const config = useQuery.mock.calls[0][0]

    const selected = config.select({ results: [{ id: 9, title: 'Rec' }] })
    expect(selected).toEqual([{ id: 9, title: 'Rec', media_type: 'movie' }])
    expect(config.enabled).toBe(true)
  })

  it('useNowPlaying dedupliziert, filtert und sortiert Ergebnisse', async () => {
    moviesApi.getNowPlayingMovies
      .mockResolvedValueOnce({
        results: [
          { id: 1, title: 'A', poster_path: '/a.jpg', overview: 'desc', release_date: '2026-03-10' },
          { id: 2, title: 'B', poster_path: null, overview: 'desc', release_date: '2026-03-09' },
        ],
      })
      .mockResolvedValueOnce({
        results: [
          { id: 1, title: 'A duplicate', poster_path: '/a.jpg', overview: 'desc', release_date: '2026-03-10' },
          { id: 3, title: 'C', poster_path: '/c.jpg', overview: 'ok', release_date: '2026-03-11' },
        ],
      })

    renderHook(() => useNowPlaying())
    const config = useQuery.mock.calls[0][0]

    const value = await config.queryFn()

    expect(moviesApi.getNowPlayingMovies).toHaveBeenCalledWith(1)
    expect(moviesApi.getNowPlayingMovies).toHaveBeenCalledWith(2)
    expect(Array.from(value.ids)).toEqual([1, 2, 3])
    expect(value.movies).toEqual([
      { id: 3, title: 'C', poster_path: '/c.jpg', overview: 'ok', release_date: '2026-03-11', media_type: 'movie' },
      { id: 1, title: 'A', poster_path: '/a.jpg', overview: 'desc', release_date: '2026-03-10', media_type: 'movie' },
    ])
    expect(config.staleTime).toBe(6 * 60 * 60 * 1000)
  })

  it('useTrendingAll kombiniert Film- und TV-Daten abwechselnd und gibt loading/error weiter', () => {
    useQuery.mockImplementation((config) => {
      if (config.queryKey[1] === 'movies') {
        return {
          data: [{ id: 1, title: 'M1' }, { id: 2, title: 'M2' }],
          isLoading: false,
          error: null,
        }
      }
      return {
        data: [{ id: 10, name: 'T1' }],
        isLoading: true,
        error: new Error('tv fail'),
      }
    })

    const { result } = renderHook(() => useTrendingAll())

    expect(result.current.data).toEqual([
      { id: 1, title: 'M1' },
      { id: 10, name: 'T1' },
      { id: 2, title: 'M2' },
    ])
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('useTrendingAll gibt undefined zurueck wenn eine Seite noch keine Daten hat', () => {
    useQuery.mockImplementation((config) => {
      if (config.queryKey[1] === 'movies') return { data: undefined, isLoading: true, error: null }
      return { data: [{ id: 10 }], isLoading: false, error: null }
    })

    const { result } = renderHook(() => useTrendingAll())
    expect(result.current.data).toBeUndefined()
  })

  it('usePopularAnime merged und sortiert beide Quellen', () => {
    useQuery.mockImplementation((config) => {
      if (config.queryKey[1] === 'movies') {
        return {
          data: [{ id: 1, title: 'Anime Film', popularity: 50 }],
          isLoading: false,
          error: null,
        }
      }
      return {
        data: [{ id: 2, name: 'Anime Serie', popularity: 90 }],
        isLoading: false,
        error: null,
      }
    })

    const { result } = renderHook(() => usePopularAnime())

    expect(result.current.data).toEqual([
      { id: 2, name: 'Anime Serie', popularity: 90 },
      { id: 1, title: 'Anime Film', popularity: 50 },
    ])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})

