import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWatchlistRecommendations } from './useWatchlistRecommendations'
import { useWatchlist } from './useWatchlist'
import * as moviesApi from '../api/movies'
import * as tvApi from '../api/tv'

vi.mock('./useWatchlist', () => ({
  useWatchlist: vi.fn(),
}))

vi.mock('../api/movies', () => ({
  getMovieRecommendations: vi.fn(),
  getMovieProviders: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  getTvRecommendations: vi.fn(),
  getTvProviders: vi.fn(),
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
    moviesApi.getMovieProviders.mockResolvedValue({ flatrate: [{ provider_id: 8 }] }) // Netflix = allowed
    tvApi.getTvProviders.mockResolvedValue({ flatrate: [{ provider_id: 8 }] }) // Netflix = allowed
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
    
    // Die Hook sollte maximal 2 Elemente ausgewählt haben
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
        { id: 101, title: 'Inception', poster_path: '/p1.jpg', overview: 'desc 1' }
      ] 
    })
    
    tvApi.getTvRecommendations.mockResolvedValue({ 
      results: [
        { id: 201, name: 'Better Call Saul', poster_path: '/p2.jpg', overview: 'desc 2' }
      ] 
    })

    const { result } = renderHook(() => useWatchlistRecommendations(2), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    const data = result.current.data
    expect(data.length).toBe(2)
    
    const movieRes = data.find(d => d.sourceItem.media_type === 'movie')
    const tvRes = data.find(d => d.sourceItem.media_type === 'tv')

    expect(movieRes.sourceItem.id).toBe(100)
    expect(movieRes.recommendations[0].title).toBe('Inception')
    
    expect(tvRes.sourceItem.id).toBe(200)
    expect(tvRes.recommendations[0].name).toBe('Better Call Saul')
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
      ] 
    })

    const { result } = renderHook(() => useWatchlistRecommendations(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    expect(result.current.data[0].recommendations.length).toBe(1)
    expect(result.current.data[0].recommendations[0].id).toBe(2)
  })

  it('filtert Empfehlungen heraus, die nicht bei den erlaubten Providern verfügbar sind', async () => {
    useWatchlist.mockReturnValue({
      items: [
        { id: 1, media_type: 'movie', title: 'Movie 1' },
      ],
    })

    moviesApi.getMovieRecommendations.mockResolvedValue({ 
      results: [
        { id: 2, title: 'Streamable Rec', poster_path: '/p.jpg', overview: 'desc' },
        { id: 3, title: 'Not Streamable Rec', poster_path: '/p.jpg', overview: 'desc' },
      ] 
    })

    // ID 2 gets flatrate with allowed ID 8, ID 3 gets flatrate with unallowed ID 99999
    moviesApi.getMovieProviders.mockImplementation(async (id) => {
      if (id === 2) return { flatrate: [{ provider_id: 8 }] } // Allowed (Netflix)
      if (id === 3) return { flatrate: [{ provider_id: 99999 }] } // Not Allowed
      return null
    })

    const { result } = renderHook(() => useWatchlistRecommendations(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    
    expect(result.current.data[0].recommendations.length).toBe(1)
    expect(result.current.data[0].recommendations[0].id).toBe(2)
  })
})
