import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePersonDetails, usePersonCredits } from './usePerson'
import { useQuery } from '@tanstack/react-query'
import * as commonApi from '../api/common'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../api/common', () => ({
  getPersonDetails: vi.fn(),
  getPersonCombinedCredits: vi.fn(),
}))

describe('usePerson hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQuery.mockImplementation(() => ({ data: undefined, isLoading: false, error: null }))
  })

  it('usePersonDetails setzt Query-Key und enabled korrekt', async () => {
    renderHook(() => usePersonDetails(12))
    renderHook(() => usePersonDetails(0))

    const enabledConfig = useQuery.mock.calls[0][0]
    const disabledConfig = useQuery.mock.calls[1][0]

    expect(enabledConfig.queryKey).toEqual(['person', 12])
    expect(enabledConfig.enabled).toBe(true)
    await enabledConfig.queryFn()
    expect(commonApi.getPersonDetails).toHaveBeenCalledWith(12)

    expect(disabledConfig.enabled).toBe(false)
  })

  it('usePersonCredits setzt Query-Key, enabled und QueryFn korrekt', async () => {
    renderHook(() => usePersonCredits(99))

    const config = useQuery.mock.calls[0][0]
    expect(config.queryKey).toEqual(['person', 99, 'credits'])
    expect(config.enabled).toBe(true)

    await config.queryFn()
    expect(commonApi.getPersonCombinedCredits).toHaveBeenCalledWith(99)
  })

  it('usePersonCredits select filtert/sortiert Cast und setzt media_type Default', () => {
    renderHook(() => usePersonCredits(5))

    const config = useQuery.mock.calls[0][0]
    const selected = config.select({
      cast: [
        { id: 1, name: 'Kein Poster', popularity: 20, poster_path: null },
        { id: 2, name: 'Serie', popularity: 5, poster_path: '/a.jpg', media_type: 'tv' },
        { id: 3, name: 'Film', popularity: 10, poster_path: '/b.jpg' },
      ],
      crew: [],
    })

    expect(selected.cast).toEqual([
      { id: 3, name: 'Film', popularity: 10, poster_path: '/b.jpg', media_type: 'movie' },
      { id: 2, name: 'Serie', popularity: 5, poster_path: '/a.jpg', media_type: 'tv' },
    ])
  })

  it('usePersonCredits select dedupliziert Crew nach id/media_type', () => {
    renderHook(() => usePersonCredits(5))

    const config = useQuery.mock.calls[0][0]
    const selected = config.select({
      cast: [],
      crew: [
        { id: 10, title: 'A', popularity: 9, poster_path: '/a.jpg', media_type: 'movie' },
        { id: 10, title: 'A Duplikat', popularity: 8, poster_path: '/b.jpg', media_type: 'movie' },
        { id: 10, name: 'B', popularity: 7, poster_path: '/c.jpg', media_type: 'tv' },
        { id: 20, name: 'Ohne Poster', popularity: 100, poster_path: null, media_type: 'tv' },
      ],
    })

    expect(selected.crew).toEqual([
      { id: 10, title: 'A', popularity: 9, poster_path: '/a.jpg', media_type: 'movie' },
      { id: 10, name: 'B', popularity: 7, poster_path: '/c.jpg', media_type: 'tv' },
    ])
  })

  it('usePersonCredits select ist robust bei fehlenden Arrays', () => {
    renderHook(() => usePersonCredits(5))

    const config = useQuery.mock.calls[0][0]
    const selected = config.select({})

    expect(selected).toEqual({ cast: [], crew: [] })
  })
})
