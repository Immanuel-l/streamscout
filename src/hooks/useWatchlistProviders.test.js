import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWatchlistProviders } from './useWatchlistProviders'
import { useQueries } from '@tanstack/react-query'

vi.mock('@tanstack/react-query', () => ({
  useQueries: vi.fn(),
}))

describe('useWatchlistProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('liefert leere Aggregation fuer leere Listen', () => {
    useQueries.mockReturnValue([])

    const { result } = renderHook(() => useWatchlistProviders([]))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.providerMap).toEqual({})
    expect(result.current.availableProviders).toEqual([])
  })

  it('zeigt waehrend Ladephase keine Providerdaten', () => {
    useQueries.mockReturnValue([{ isLoading: true }])

    const items = [{ id: 1, media_type: 'movie' }]
    const { result } = renderHook(() => useWatchlistProviders(items))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.providerMap).toEqual({})
    expect(result.current.availableProviders).toEqual([])
  })

  it('aggregiert erlaubte Provider und sortiert nach Abdeckung', () => {
    useQueries.mockReturnValue([
      {
        isLoading: false,
        data: {
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' },
            { provider_id: 999, provider_name: 'Nicht erlaubt', logo_path: '/x.png' },
          ],
        },
      },
      {
        isLoading: false,
        data: {
          flatrate: [
            { provider_id: 9, provider_name: 'Prime Video', logo_path: '/p.png' },
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' },
          ],
        },
      },
      { isLoading: false, data: null },
    ])

    const items = [
      { id: 1, media_type: 'movie' },
      { id: 2, media_type: 'tv' },
      { id: 3, media_type: 'movie' },
    ]

    const { result } = renderHook(() => useWatchlistProviders(items))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.providerMap['movie-1']).toEqual(new Set([8]))
    expect(result.current.providerMap['tv-2']).toEqual(new Set([9, 8]))
    expect(result.current.availableProviders.map((p) => p.provider_id)).toEqual([8, 9])
  })

  it('erstellt Query-Config inklusive enabled-Flag pro Item', () => {
    useQueries.mockReturnValue([
      { isLoading: false, data: null },
      { isLoading: false, data: null },
    ])

    const items = [
      { id: 1, media_type: 'movie' },
      { id: null, media_type: 'tv' },
    ]

    renderHook(() => useWatchlistProviders(items))

    const arg = useQueries.mock.calls[0][0]
    expect(arg.queries).toHaveLength(2)
    expect(arg.queries[0].enabled).toBe(true)
    expect(arg.queries[1].enabled).toBe(false)
    expect(arg.queries[0].queryKey).toEqual(['movie', 1, 'providers'])
  })
})
