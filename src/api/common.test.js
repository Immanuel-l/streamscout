import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  searchMulti,
  searchMovies,
  searchTv,
  searchPerson,
  getTrending,
  getMovieGenres,
  getTvGenres,
  getMovieWatchProviders,
  getTvWatchProviders,
  getPersonDetails,
  getPersonCombinedCredits,
} from './common'
import tmdb from './tmdb'

vi.mock('./tmdb', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('api/common', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searchMulti ruft den Multi-Search Endpoint mit Query/Page auf', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [1] } })

    const result = await searchMulti('matrix', 2)

    expect(tmdb.get).toHaveBeenCalledWith('/search/multi', { params: { query: 'matrix', page: 2 } })
    expect(result).toEqual({ results: [1] })
  })

  it('searchMovies/searchTv/searchPerson nutzen die korrekten Endpoints', async () => {
    tmdb.get.mockResolvedValue({ data: { ok: true } })

    await searchMovies('film', 3)
    await searchTv('serie', 4)
    await searchPerson('person', 5)

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/search/movie', { params: { query: 'film', page: 3 } })
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/search/tv', { params: { query: 'serie', page: 4 } })
    expect(tmdb.get).toHaveBeenNthCalledWith(3, '/search/person', { params: { query: 'person', page: 5 } })
  })

  it('getTrending nutzt default week und optionales timeWindow', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [] } })

    await getTrending()
    await getTrending('day')

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/trending/all/week')
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/trending/all/day')
  })

  it('getMovieGenres/getTvGenres liefern data.genres zurueck', async () => {
    tmdb.get
      .mockResolvedValueOnce({ data: { genres: [{ id: 1 }] } })
      .mockResolvedValueOnce({ data: { genres: [{ id: 2 }] } })

    const movieGenres = await getMovieGenres()
    const tvGenres = await getTvGenres()

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/genre/movie/list')
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/genre/tv/list')
    expect(movieGenres).toEqual([{ id: 1 }])
    expect(tvGenres).toEqual([{ id: 2 }])
  })

  it('Watch-Provider Endpoints nutzen watch_region=DE und liefern results', async () => {
    tmdb.get
      .mockResolvedValueOnce({ data: { results: [{ provider_id: 8 }] } })
      .mockResolvedValueOnce({ data: { results: [{ provider_id: 9 }] } })

    const movieProviders = await getMovieWatchProviders()
    const tvProviders = await getTvWatchProviders()

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/watch/providers/movie', { params: { watch_region: 'DE' } })
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/watch/providers/tv', { params: { watch_region: 'DE' } })
    expect(movieProviders).toEqual([{ provider_id: 8 }])
    expect(tvProviders).toEqual([{ provider_id: 9 }])
  })

  it('Person-Endpunkte liefern data zurueck', async () => {
    tmdb.get
      .mockResolvedValueOnce({ data: { id: 10, name: 'Alex' } })
      .mockResolvedValueOnce({ data: { cast: [], crew: [] } })

    const person = await getPersonDetails(10)
    const credits = await getPersonCombinedCredits(10)

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/person/10')
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/person/10/combined_credits')
    expect(person).toEqual({ id: 10, name: 'Alex' })
    expect(credits).toEqual({ cast: [], crew: [] })
  })
})
