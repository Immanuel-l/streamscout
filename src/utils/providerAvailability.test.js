import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  __resetProviderAvailabilityQueueForTests,
  getProviderAvailabilityQueryOptions,
  resolveProviderAvailability,
} from './providerAvailability'
import * as moviesApi from '../api/movies'

vi.mock('../api/movies', () => ({
  getMovieProviders: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  getTvProviders: vi.fn(),
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

describe('providerAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetProviderAvailabilityQueueForTests()
  })

  it('liefert streamable für erlaubte Flatrate-Provider', async () => {
    moviesApi.getMovieProviders.mockResolvedValue({ flatrate: [{ provider_id: 8 }] })

    const queryClient = createQueryClient()
    const result = await queryClient.fetchQuery(getProviderAvailabilityQueryOptions('movie', 1))

    expect(result).toEqual({ state: 'streamable', isStreamable: true })
  })

  it('liefert not_streamable wenn kein erlaubter Flatrate-Provider vorhanden ist', async () => {
    moviesApi.getMovieProviders.mockResolvedValue({ flatrate: [{ provider_id: 999999 }] })

    const queryClient = createQueryClient()
    const result = await queryClient.fetchQuery(getProviderAvailabilityQueryOptions('movie', 1))

    expect(result).toEqual({ state: 'not_streamable', isStreamable: false })
  })

  it('retryt bei 429 und liefert danach streamable', async () => {
    moviesApi.getMovieProviders
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ flatrate: [{ provider_id: 8 }] })

    const queryClient = createQueryClient()
    const result = await resolveProviderAvailability(queryClient, 'movie', 42)

    expect(result.state).toBe('streamable')
    expect(moviesApi.getMovieProviders).toHaveBeenCalledTimes(2)
  })

  it('liefert unknown bei nicht-retrybarem Fehler', async () => {
    moviesApi.getMovieProviders.mockRejectedValue({ response: { status: 500 } })

    const queryClient = createQueryClient()
    const result = await resolveProviderAvailability(queryClient, 'movie', 77)

    expect(result).toEqual({ state: 'unknown', isStreamable: null })
  })

  it('nutzt React-Query-Cache bei wiederholten Aufrufen', async () => {
    moviesApi.getMovieProviders.mockResolvedValue({ flatrate: [{ provider_id: 8 }] })

    const queryClient = createQueryClient()
    const first = await resolveProviderAvailability(queryClient, 'movie', 12)
    const second = await resolveProviderAvailability(queryClient, 'movie', 12)

    expect(first).toEqual(second)
    expect(moviesApi.getMovieProviders).toHaveBeenCalledTimes(1)
  })

  it('begrenzt parallele Provider-Requests auf maximal vier', async () => {
    let active = 0
    let maxActive = 0

    moviesApi.getMovieProviders.mockImplementation(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 20))
      active -= 1
      return { flatrate: [{ provider_id: 8 }] }
    })

    const queryClient = createQueryClient()

    await Promise.all(
      Array.from({ length: 8 }, (_, i) => resolveProviderAvailability(queryClient, 'movie', i + 1))
    )

    expect(maxActive).toBeLessThanOrEqual(4)
    expect(moviesApi.getMovieProviders).toHaveBeenCalledTimes(8)
  })
})
