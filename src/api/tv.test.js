import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getTvDetails,
  getTvProviders,
  getTvContentRatings,
  getTvSimilar,
  getTvRecommendations,
  getTvSeason,
  getTvSeasonProviders,
  discoverTv,
  getTrendingTv,
} from './tv'
import tmdb from './tmdb'

vi.mock('./tmdb', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('api/tv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getTvDetails ruft den Detail-Endpoint mit append_to_response auf', async () => {
    tmdb.get.mockResolvedValue({ data: { id: 10, name: 'Testserie' } })

    const result = await getTvDetails(10)

    expect(tmdb.get).toHaveBeenCalledWith('/tv/10', {
      params: { append_to_response: 'keywords,credits,videos,content_ratings', include_video_language: 'de,en,null' },
    })
    expect(result).toEqual({ id: 10, name: 'Testserie' })
  })

  it('getTvProviders liefert DE-Provider zurueck', async () => {
    tmdb.get.mockResolvedValue({ data: { results: { DE: { flatrate: [{ provider_id: 337 }] } } } })

    const result = await getTvProviders(5)

    expect(tmdb.get).toHaveBeenCalledWith('/tv/5/watch/providers')
    expect(result).toEqual({ flatrate: [{ provider_id: 337 }] })
  })

  it('getTvProviders liefert undefined wenn kein DE-Eintrag vorhanden', async () => {
    tmdb.get.mockResolvedValue({ data: { results: {} } })

    const result = await getTvProviders(5)

    expect(result).toBeUndefined()
  })

  it('getTvContentRatings liefert results-Array zurueck', async () => {
    const ratings = [{ iso_3166_1: 'DE', rating: '12' }]
    tmdb.get.mockResolvedValue({ data: { results: ratings } })

    const result = await getTvContentRatings(5)

    expect(tmdb.get).toHaveBeenCalledWith('/tv/5/content_ratings')
    expect(result).toEqual(ratings)
  })

  it('getTvSimilar nutzt default page=1 und optionale Page', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [], page: 1 } })

    await getTvSimilar(3)
    await getTvSimilar(3, 4)

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/tv/3/similar', { params: { page: 1 } })
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/tv/3/similar', { params: { page: 4 } })
  })

  it('getTvRecommendations nutzt default page=1 und optionale Page', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [], page: 1 } })

    await getTvRecommendations(8)
    await getTvRecommendations(8, 2)

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/tv/8/recommendations', { params: { page: 1 } })
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/tv/8/recommendations', { params: { page: 2 } })
  })

  it('getTvSeason ruft den Staffel-Endpoint auf', async () => {
    tmdb.get.mockResolvedValue({ data: { season_number: 2, episodes: [] } })

    const result = await getTvSeason(15, 2)

    expect(tmdb.get).toHaveBeenCalledWith('/tv/15/season/2')
    expect(result).toEqual({ season_number: 2, episodes: [] })
  })

  it('getTvSeasonProviders liefert DE-Provider fuer eine Staffel', async () => {
    tmdb.get.mockResolvedValue({ data: { results: { DE: { flatrate: [{ provider_id: 9 }] } } } })

    const result = await getTvSeasonProviders(15, 1)

    expect(tmdb.get).toHaveBeenCalledWith('/tv/15/season/1/watch/providers')
    expect(result).toEqual({ flatrate: [{ provider_id: 9 }] })
  })

  it('getTvSeasonProviders liefert undefined wenn kein DE-Eintrag vorhanden', async () => {
    tmdb.get.mockResolvedValue({ data: { results: {} } })

    const result = await getTvSeasonProviders(15, 1)

    expect(result).toBeUndefined()
  })

  it('discoverTv sendet Standard-Parameter und merged benutzerdefinierte', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [{ id: 1 }] } })

    const result = await discoverTv({ with_genres: '16' })

    expect(tmdb.get).toHaveBeenCalledWith('/discover/tv', {
      params: expect.objectContaining({
        watch_region: 'DE',
        with_watch_monetization_types: 'flatrate',
        with_genres: '16',
      }),
    })
    expect(result).toEqual({ results: [{ id: 1 }] })
  })

  it('discoverTv nutzt Standard-Parameter ohne Extras', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [] } })

    await discoverTv()

    expect(tmdb.get).toHaveBeenCalledWith('/discover/tv', {
      params: expect.objectContaining({
        watch_region: 'DE',
        with_watch_monetization_types: 'flatrate',
      }),
    })
  })

  it('getTrendingTv nutzt default week und optionales timeWindow', async () => {
    tmdb.get.mockResolvedValue({ data: { results: [] } })

    await getTrendingTv()
    await getTrendingTv('day')

    expect(tmdb.get).toHaveBeenNthCalledWith(1, '/trending/tv/week')
    expect(tmdb.get).toHaveBeenNthCalledWith(2, '/trending/tv/day')
  })
})

