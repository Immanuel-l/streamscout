import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  __resetFskAvailabilityQueueForTests,
  getFskAvailabilityQueryOptions,
  resolveFskAvailability,
} from './fskAvailability'
import * as moviesApi from '../api/movies'
import * as tvApi from '../api/tv'

vi.mock('../api/movies', () => ({
  getMovieReleaseDates: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  getTvContentRatings: vi.fn(),
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

describe('fskAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetFskAvailabilityQueueForTests()
  })

  it('liefert known mit Film-FSK aus Release-Dates', async () => {
    moviesApi.getMovieReleaseDates.mockResolvedValue([
      {
        iso_3166_1: 'DE',
        release_dates: [{ type: 3, certification: '12' }],
      },
    ])

    const queryClient = createQueryClient()
    const result = await queryClient.fetchQuery(getFskAvailabilityQueryOptions('movie', 1))

    expect(result).toEqual({ state: 'known', certification: '12' })
  })

  it('liefert known mit TV-FSK aus Content-Ratings', async () => {
    tvApi.getTvContentRatings.mockResolvedValue([
      { iso_3166_1: 'US', rating: 'TV-14' },
      { iso_3166_1: 'DE', rating: '16' },
    ])

    const queryClient = createQueryClient()
    const result = await queryClient.fetchQuery(getFskAvailabilityQueryOptions('tv', 5))

    expect(result).toEqual({ state: 'known', certification: '16' })
  })

  it('liefert unknown bei fehlender DE-FSK', async () => {
    moviesApi.getMovieReleaseDates.mockResolvedValue([
      {
        iso_3166_1: 'DE',
        release_dates: [{ type: 3, certification: '' }],
      },
    ])

    const queryClient = createQueryClient()
    const result = await resolveFskAvailability(queryClient, 'movie', 7)

    expect(result).toEqual({ state: 'unknown', certification: null })
  })

  it('retryt bei 429 und liefert danach known', async () => {
    moviesApi.getMovieReleaseDates
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce([
        {
          iso_3166_1: 'DE',
          release_dates: [{ type: 3, certification: '16' }],
        },
      ])

    const queryClient = createQueryClient()
    const result = await resolveFskAvailability(queryClient, 'movie', 42)

    expect(result).toEqual({ state: 'known', certification: '16' })
    expect(moviesApi.getMovieReleaseDates).toHaveBeenCalledTimes(2)
  })

  it('begrenzt parallele FSK-Requests auf maximal vier', async () => {
    let active = 0
    let maxActive = 0

    moviesApi.getMovieReleaseDates.mockImplementation(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 20))
      active -= 1
      return [
        {
          iso_3166_1: 'DE',
          release_dates: [{ type: 3, certification: '12' }],
        },
      ]
    })

    const queryClient = createQueryClient()

    await Promise.all(
      Array.from({ length: 8 }, (_, i) => resolveFskAvailability(queryClient, 'movie', i + 1))
    )

    expect(maxActive).toBeLessThanOrEqual(4)
    expect(moviesApi.getMovieReleaseDates).toHaveBeenCalledTimes(8)
  })
})
