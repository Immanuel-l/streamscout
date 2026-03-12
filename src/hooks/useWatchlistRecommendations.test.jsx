import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWatchlistRecommendations } from './useWatchlistRecommendations'
import { useWatchlist } from './useWatchlist'
import * as moviesApi from '../api/movies'
import * as tvApi from '../api/tv'
import { resolveProviderAvailability } from '../utils/providerAvailability'

vi.mock('./useWatchlist', () => ({
  useWatchlist: vi.fn(),
}))

vi.mock('../api/movies', () => ({
  getMovieRecommendations: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  getTvRecommendations: vi.fn(),
}))

vi.mock('../utils/providerAvailability', () => ({
  resolveProviderAvailability: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useWatchlistRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveProviderAvailability.mockResolvedValue({ state: 'streamable', isStreamable: true })
  })

  it('gibt ein leeres Array zurück, wenn die Watchlist leer ist', () => {
    useWatchlist.mockReturnValue({ items: [] })

    const { result } = renderHook(() => useWatchlistRecommendations(), {
      wrapper: createWrapper(),
    })

    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('limitiert die Anzahl der Quell-Items basierend auf dem count Parameter', async () => {
    useWatchlist.mockReturnValue({
      items: [
        { id: 1, media_type: 'movie', title: 'Movie 1' },
        { id: 2, media_type: 'movie', title: 'Movie 2' },
        { id: 3, media_type: 'tv', name: 'TV 1' },
      ],
    })

    moviesApi.getMovieRecommendations.mockResolvedValue({ results: [{ id: 10, title: 'Rec 1', poster_path: '/p.jpg', overview: 'desc' }] })
    tvApi.getTvRecommendations.mockResolvedValue({ results: [{ id: 20, name: 'Rec 2', poster_path: '/p.jpg', overview: 'desc' }] })

    const { result } = renderHook(() => useWatchlistRecommendations(2), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data.length).toBeLessThanOrEqual(2)
  })

  it('holt Film- und Serien-Empfehlungen korrekterweise', async () => {
    useWatchlist.mockReturnValue({
      items: [
        { id: 100, media_type: 'movie', title: 'Matrix' },
        { id: 200, media_type: 'tv', name: 'Breaking Bad' },
      ],
    })

    moviesApi.getMovieRecommendations.mockResolvedValue({
      results: [
        { id: 101, title: 'Inception', poster_path: '/p1.jpg', overview: 'desc 1' },
      ],
    })

    tvApi.getTvRecommendations.mockResolvedValue({
      results: [
        { id: 201, name: 'Better Call Saul', poster_path: '/p2.jpg', overview: 'desc 2' },
      ],
    })

    const { result } = renderHook(() => useWatchlistRecommendations(2), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const data = result.current.data
    expect(data.length).toBe(2)

    const movieRes = data.find((d) => d.sourceItem.media_type === 'movie')
    const tvRes = data.find((d) => d.sourceItem.media_type === 'tv')

    expect(movieRes.sourceItem.id).toBe(100)
    expect(movieRes.recommendations[0].title).toBe('Inception')

    expect(tvRes.sourceItem.id).toBe(200)
    expect(tvRes.recommendations[0].name).toBe('Better Call Saul')
    expect(resolveProviderAvailability).toHaveBeenCalled()
  })

  it('filtert Empfehlungen ohne Poster oder Beschreibung heraus', async () => {
    useWatchlist.mockReturnValue({
      items: [
        { id: 1, media_type: 'movie', title: 'Movie 1' },
      ],
    })

    moviesApi.getMovieRecommendations.mockResolvedValue({
      results: [
        { id: 2, title: 'Valid Rec', poster_path: '/p.jpg', overview: 'desc' },
        { id: 3, title: 'No Poster Rec', poster_path: null, overview: 'desc' },
        { id: 4, title: 'No Overview Rec', poster_path: '/p.jpg', overview: '' },
      ],
    })

    const { result } = renderHook(() => useWatchlistRecommendations(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data[0].recommendations.length).toBe(1)
    expect(result.current.data[0].recommendations[0].id).toBe(2)
  })

  it('filtert nicht-streambare Empfehlungen heraus', async () => {
    useWatchlist.mockReturnValue({
      items: [
        { id: 1, media_type: 'movie', title: 'Movie 1' },
      ],
    })

    moviesApi.getMovieRecommendations.mockResolvedValue({
      results: [
        { id: 2, title: 'Streamable Rec', poster_path: '/p.jpg', overview: 'desc' },
        { id: 3, title: 'Not Streamable Rec', poster_path: '/p.jpg', overview: 'desc' },
      ],
    })

    resolveProviderAvailability.mockImplementation(async (_queryClient, _type, id) => {
      if (id === 2) return { state: 'streamable', isStreamable: true }
      return { state: 'not_streamable', isStreamable: false }
    })

    const { result } = renderHook(() => useWatchlistRecommendations(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data[0].recommendations).toHaveLength(1)
    expect(result.current.data[0].recommendations[0].id).toBe(2)
  })

  it('zählt unbekannte Provider-Prüfungen als unknownCount', async () => {
    useWatchlist.mockReturnValue({
      items: [{ id: 1, media_type: 'movie', title: 'Movie 1' }],
    })

    moviesApi.getMovieRecommendations.mockResolvedValue({
      results: [
        { id: 11, title: 'A', poster_path: '/a.jpg', overview: 'desc' },
        { id: 12, title: 'B', poster_path: '/b.jpg', overview: 'desc' },
      ],
    })

    resolveProviderAvailability.mockImplementation(async (_queryClient, _type, id) => {
      if (id === 11) return { state: 'unknown', isStreamable: null }
      return { state: 'streamable', isStreamable: true }
    })

    const { result } = renderHook(() => useWatchlistRecommendations(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data[0].recommendations).toHaveLength(1)
    expect(result.current.data[0].unknownCount).toBe(1)
  })

  it('prüft pro Quell-Item höchstens 40 Kandidaten', async () => {
    useWatchlist.mockReturnValue({
      items: [{ id: 1, media_type: 'movie', title: 'Movie 1' }],
    })

    const manyCandidates = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Rec ${i + 1}`,
      poster_path: `/p-${i + 1}.jpg`,
      overview: 'desc',
    }))

    moviesApi.getMovieRecommendations.mockResolvedValue({ results: manyCandidates })
    resolveProviderAvailability.mockResolvedValue({ state: 'not_streamable', isStreamable: false })

    const { result } = renderHook(() => useWatchlistRecommendations(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(resolveProviderAvailability).toHaveBeenCalledTimes(40)
    expect(result.current.data).toEqual([])
  })
})
