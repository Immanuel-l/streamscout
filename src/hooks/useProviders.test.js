import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGenres, useWatchProviders } from './useProviders'
import { useQuery } from '@tanstack/react-query'
import * as commonApi from '../api/common'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../api/common', () => ({
  getMovieGenres: vi.fn(),
  getTvGenres: vi.fn(),
  getMovieWatchProviders: vi.fn(),
  getTvWatchProviders: vi.fn(),
}))

describe('useProviders hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQuery.mockImplementation(() => ({ data: undefined, isLoading: false, error: null }))
  })

  it('useGenres nutzt TV- oder Movie-Endpoint passend zum Medientyp', async () => {
    renderHook(() => useGenres('tv'))
    renderHook(() => useGenres('movie'))

    const tvConfig = useQuery.mock.calls[0][0]
    const movieConfig = useQuery.mock.calls[1][0]

    expect(tvConfig.queryKey).toEqual(['genres', 'tv'])
    expect(movieConfig.queryKey).toEqual(['genres', 'movie'])
    expect(tvConfig.staleTime).toBe(24 * 60 * 60 * 1000)
    expect(movieConfig.staleTime).toBe(24 * 60 * 60 * 1000)

    await tvConfig.queryFn()
    await movieConfig.queryFn()

    expect(commonApi.getTvGenres).toHaveBeenCalledTimes(1)
    expect(commonApi.getMovieGenres).toHaveBeenCalledTimes(1)
  })

  it('useWatchProviders nutzt passenden Endpoint fuer tv/movie', async () => {
    renderHook(() => useWatchProviders('tv'))
    renderHook(() => useWatchProviders('movie'))

    const tvConfig = useQuery.mock.calls[0][0]
    const movieConfig = useQuery.mock.calls[1][0]

    expect(tvConfig.queryKey).toEqual(['watchProviders', 'tv'])
    expect(movieConfig.queryKey).toEqual(['watchProviders', 'movie'])
    expect(tvConfig.staleTime).toBe(24 * 60 * 60 * 1000)

    await tvConfig.queryFn()
    await movieConfig.queryFn()

    expect(commonApi.getTvWatchProviders).toHaveBeenCalledTimes(1)
    expect(commonApi.getMovieWatchProviders).toHaveBeenCalledTimes(1)
  })

  it('useWatchProviders select filtert auf erlaubte Provider und sortiert nach display_priority', () => {
    renderHook(() => useWatchProviders('movie'))

    const config = useQuery.mock.calls[0][0]
    const selected = config.select([
      { provider_id: 9999, provider_name: 'Nicht erlaubt', display_priority: 1 },
      { provider_id: 9, provider_name: 'Prime', display_priority: 8 },
      { provider_id: 8, provider_name: 'Netflix', display_priority: 5 },
      { provider_id: 337, provider_name: 'Disney+', display_priority: 20 },
    ])

    expect(selected).toEqual([
      { provider_id: 8, provider_name: 'Netflix', display_priority: 5 },
      { provider_id: 9, provider_name: 'Prime', display_priority: 8 },
      { provider_id: 337, provider_name: 'Disney+', display_priority: 20 },
    ])
  })

  it('useWatchProviders select gibt leeres Array bei leerer Eingabe zurueck', () => {
    renderHook(() => useWatchProviders('tv'))

    const config = useQuery.mock.calls[0][0]
    expect(config.select([])).toEqual([])
  })
})
