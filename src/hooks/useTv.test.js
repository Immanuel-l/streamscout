import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  usePopularTv,
  useTopRatedTv,
  useNewTv,
  useDiscoverTv,
  useTvDetails,
  useTvProviders,
  useTvSimilar,
  useTvRecommendations,
  useTvSeasonProviders,
  useTvSeason,
} from './useTv'
import { useQuery, useQueries } from '@tanstack/react-query'
import * as tvApi from '../api/tv'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueries: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  discoverTv: vi.fn(),
  getTvDetails: vi.fn(),
  getTvProviders: vi.fn(),
  getTvRecommendations: vi.fn(),
  getTvSeason: vi.fn(),
  getTvSeasonProviders: vi.fn(),
}))

function emptyQueryResult() {
  return { data: undefined, isLoading: false, error: null }
}

describe('useTv hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQuery.mockImplementation(() => emptyQueryResult())
    useQueries.mockImplementation(() => [])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('usePopularTv setzt Config und mappt media_type', async () => {
    renderHook(() => usePopularTv())

    const config = useQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['popular', 'tv'])
    expect(config.staleTime).toBe(60 * 60 * 1000)

    await config.queryFn()
    expect(tvApi.discoverTv).toHaveBeenCalledWith({
      sort_by: 'popularity.desc',
      'vote_average.gte': 5.5,
      'vote_count.gte': 50,
    })

    const mapped = config.select({ results: [{ id: 1, name: 'Serie' }] })
    expect(mapped).toEqual([{ id: 1, name: 'Serie', media_type: 'tv' }])
  })

  it('useTopRatedTv und useNewTv verwenden die korrekten Query-Parameter', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-11T11:00:00.000Z'))

    renderHook(() => useTopRatedTv())
    renderHook(() => useNewTv())

    const topConfig = useQuery.mock.calls[0][0]
    const newConfig = useQuery.mock.calls[1][0]

    await topConfig.queryFn()
    expect(tvApi.discoverTv).toHaveBeenCalledWith({
      sort_by: 'vote_average.desc',
      'vote_count.gte': 200,
    })

    await newConfig.queryFn()
    expect(tvApi.discoverTv).toHaveBeenCalledWith({
      sort_by: 'first_air_date.desc',
      'first_air_date.lte': '2026-03-11',
      'vote_count.gte': 5,
    })
  })

  it('useDiscoverTv setzt enabled abhängig von params', () => {
    renderHook(() => useDiscoverTv({ sort_by: 'popularity.desc' }))
    renderHook(() => useDiscoverTv(null))

    expect(useQuery.mock.calls[0][0].enabled).toBe(true)
    expect(useQuery.mock.calls[1][0].enabled).toBe(false)
  })

  it('useTvDetails und useTvProviders setzen enabled anhand id', () => {
    renderHook(() => useTvDetails(10))
    renderHook(() => useTvDetails(0))
    renderHook(() => useTvProviders(11))
    renderHook(() => useTvProviders(undefined))

    expect(useQuery.mock.calls[0][0].enabled).toBe(true)
    expect(useQuery.mock.calls[1][0].enabled).toBe(false)
    expect(useQuery.mock.calls[2][0].enabled).toBe(true)
    expect(useQuery.mock.calls[3][0].enabled).toBe(false)
  })

  it('useTvSimilar erstellt Parameter inkl. begrenzter Keywords und filtert aktuelles Element', async () => {
    renderHook(() => useTvSimilar('99', [16], Array.from({ length: 12 }, (_, i) => i + 1)))

    const config = useQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['tv', '99', 'similar', '16', '1|2|3|4|5|6|7|8|9|10'])
    expect(config.enabled).toBe(true)

    await config.queryFn()
    expect(tvApi.discoverTv).toHaveBeenCalledWith({
      with_genres: '16',
      with_keywords: '1|2|3|4|5|6|7|8|9|10',
      sort_by: 'popularity.desc',
    })

    const selected = config.select({
      results: [
        { id: 99, name: 'Original' },
        { id: 77, name: 'Neu' },
      ],
    })

    expect(selected).toEqual([{ id: 77, name: 'Neu', media_type: 'tv' }])
  })

  it('useTvSimilar deaktiviert Query wenn id/Genres fehlen', () => {
    renderHook(() => useTvSimilar(null, [16], []))
    renderHook(() => useTvSimilar(1, undefined, []))

    expect(useQuery.mock.calls[0][0].enabled).toBe(false)
    expect(useQuery.mock.calls[1][0].enabled).toBe(false)
  })

  it('useTvRecommendations mappt media_type', () => {
    renderHook(() => useTvRecommendations(5))
    const config = useQuery.mock.calls[0][0]

    const selected = config.select({ results: [{ id: 1, name: 'Rec' }] })
    expect(selected).toEqual([{ id: 1, name: 'Rec', media_type: 'tv' }])
  })

  it('useTvSeasonProviders baut queries + combine korrekt', async () => {
    renderHook(() => useTvSeasonProviders(123, [1, 2]))

    const arg = useQueries.mock.calls[0][0]
    expect(arg.queries).toHaveLength(2)
    expect(arg.queries[0].queryKey).toEqual(['tv', 123, 'season', 1, 'providers'])
    expect(arg.queries[1].queryKey).toEqual(['tv', 123, 'season', 2, 'providers'])
    expect(arg.queries[0].enabled).toBe(true)
    expect(arg.queries[0].staleTime).toBe(24 * 60 * 60 * 1000)

    await arg.queries[0].queryFn()
    expect(tvApi.getTvSeasonProviders).toHaveBeenCalledWith(123, 1)

    const combined = arg.combine([
      { data: { flatrate: [] }, isLoading: false },
      { data: undefined, isLoading: true },
    ])

    expect(combined).toEqual([
      { seasonNumber: 1, data: { flatrate: [] }, isLoading: false },
      { seasonNumber: 2, data: undefined, isLoading: true },
    ])
  })

  it('useTvSeason setzt enabled nur mit id und seasonNumber', () => {
    renderHook(() => useTvSeason(1, 2))
    renderHook(() => useTvSeason(1, null))
    renderHook(() => useTvSeason(null, 2))

    expect(useQuery.mock.calls[0][0].enabled).toBe(true)
    expect(useQuery.mock.calls[1][0].enabled).toBe(false)
    expect(useQuery.mock.calls[2][0].enabled).toBe(false)
  })
})
