import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getMovieDetails,
  getMovieProviders,
  getMovieSimilar,
  getMovieRecommendations,
  discoverMovies,
  getTrendingMovies,
  getNowPlayingMovies,
  getMovieReleaseDates,
} from './movies'
import tmdb from './tmdb'

vi.mock('./tmdb', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('api/movies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMovieDetails ruft den Detail-Endpoint mit append_to_response auf', async () => {
    tmdb.get.mockResolvedValue({ data: { id: 42, title: 'Test' } })

    const result = await getMovieDetails(42)

    expect(tmdb.get).toHaveBeenCalledWith('/movie/42', {
      params: { append_to_response: 'keywords,release_dates,credits,videos', include_video_language: 'de,en,null' },
    })
    expect(result).toEqual({ id: 42, title: 'Test' })
  })

  it('getMovieProviders liefert DE-Provider zurueck', async () => {
    tmdb.get.mockResolvedValue({ data: { results: { DE: { flatrate: [{ provider_id: 8 }] } } } })

    const result = await getMovieProviders(7)

    expect(tmdb.get).toHaveBeenCalledWith('/movie/7/watch/providers')
    expect(result).toEqual({ flatrate: [{ provider_id: 8 }] })
  })

  it('getMovieProviders liefert undefined wenn kein DE-Eintrag vorhanden', async () => {
    tmdb.get.mockResolvedValue({ data: { results: {} } })

    const result = await getMovieProviders(7)

    expect(result).toBeUndefined()
  })

  it('getMovieSimilar nutzt default page=1 und optionale Page', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [], page: 1 } })

    await getMovieSimilar(5)
    await getMovieSimilar(5, 3)

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/movie/5/similar', { params: { page: 1 } })
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/movie/5/similar', { params: { page: 3 } })
  })

  it('getMovieRecommendations nutzt default page=1 und optionale Page', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [], page: 1 } })

    await getMovieRecommendations(10)
    await getMovieRecommendations(10, 2)

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/movie/10/recommendations', { params: { page: 1 } })
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/movie/10/recommendations', { params: { page: 2 } })
  })

  it('discoverMovies sendet Standard-Parameter und merged benutzerdefinierte', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [{ id: 1 }] } })

    const result = await discoverMovies({ with_genres: '28' })

    expect(tmdb.get).toHaveBeenCalledWith('/discover/movie', {
      params: expect.objectContaining({
        watch_region: 'DE',
        with_watch_monetization_types: 'flatrate',
        with_genres: '28',
      }),
    })
    expect(result).toEqual({ results: [{ id: 1 }] })
  })

  it('discoverMovies nutzt Standard-Parameter ohne Extras', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [] } })

    await discoverMovies()

    expect(tmdb.get).toHaveBeenCalledWith('/discover/movie', {
      params: expect.objectContaining({
        watch_region: 'DE',
        with_watch_monetization_types: 'flatrate',
      }),
    })
  })

  it('getTrendingMovies nutzt default week und optionales timeWindow', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [] } })

    await getTrendingMovies()
    await getTrendingMovies('day')

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/trending/movie/week')
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/trending/movie/day')
  })

  it('getNowPlayingMovies nutzt default page=1 und optionale Page', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [{ id: 100 }] } })

    const result = await getNowPlayingMovies()
    await getNowPlayingMovies(2)

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/movie/now_playing', { params: { page: 1 } })
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/movie/now_playing', { params: { page: 2 } })
    expect(result).toEqual({ results: [{ id: 100 }] })
  })

  it('getMovieReleaseDates liefert results-Array zurueck', async () => {
    const releaseDates = [{ iso_3166_1: 'DE', release_dates: [] }]
    tmdb.get.mockResolvedValue({ data: { results: releaseDates } })

    const result = await getMovieReleaseDates(42)

    expect(tmdb.get).toHaveBeenCalledWith('/movie/42/release_dates')
    expect(result).toEqual(releaseDates)
  })
})
