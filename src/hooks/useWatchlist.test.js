import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWatchlist, SHARE_ITEM_LIMIT } from './useWatchlist'
import * as moviesApi from '../api/movies'
import * as tvApi from '../api/tv'

vi.mock('../api/movies', () => ({
  getMovieDetails: vi.fn(),
}))

vi.mock('../api/tv', () => ({
  getTvDetails: vi.fn(),
}))

const movieA = { id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg' }
const movieB = { id: 2, media_type: 'movie', title: 'Film B', poster_path: '/b.jpg' }
const tvA = { id: 1, media_type: 'tv', name: 'Serie A', poster_path: '/c.jpg' }
let warnSpy
let errorSpy

describe('useWatchlist', () => {
  beforeAll(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('startet mit leerer Liste', () => {
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.items).toEqual([])
  })

  it('fuegt einen Film hinzu', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({
      id: 1,
      media_type: 'movie',
      title: 'Film A',
    })
  })

  it('verhindert Duplikate', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))
    act(() => result.current.add(movieA))

    expect(result.current.items).toHaveLength(1)
  })

  it('unterscheidet Film und Serie mit gleicher ID', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))
    act(() => result.current.add(tvA))

    expect(result.current.items).toHaveLength(2)
  })

  it('entfernt einen Eintrag per ID und media_type', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))
    act(() => result.current.add(movieB))
    act(() => result.current.remove(1, 'movie'))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe(2)
  })

  it('toggle fuegt hinzu wenn nicht vorhanden', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.toggle(movieA))

    expect(result.current.items).toHaveLength(1)
  })

  it('toggle entfernt wenn vorhanden', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))
    act(() => result.current.toggle(movieA))

    expect(result.current.items).toHaveLength(0)
  })

  it('isInWatchlist prueft korrekt', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))

    expect(result.current.isInWatchlist(1, 'movie')).toBe(true)
    expect(result.current.isInWatchlist(1, 'tv')).toBe(false)
    expect(result.current.isInWatchlist(99, 'movie')).toBe(false)
  })

  it('nutzt name-Feld bei Serien als Titel', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(tvA))

    expect(result.current.items[0].title).toBe('Serie A')
  })

  it('persistiert in localStorage', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))

    const stored = JSON.parse(localStorage.getItem('streamscout_watchlist'))
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe(1)
  })

  it('liest existierende Daten aus localStorage', () => {
    localStorage.setItem('streamscout_watchlist', JSON.stringify([
      { id: 5, media_type: 'movie', title: 'Gespeichert', poster_path: '/x.jpg' },
    ]))

    const { result } = renderHook(() => useWatchlist())
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].title).toBe('Gespeichert')
  })

  it('ist robust bei fehlerhaftem LocalStorage-JSON', () => {
    localStorage.setItem('streamscout_watchlist', '{kaputt')
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.items).toEqual([])
  })

  it('synchronisiert ueber das storage-Event', () => {
    const { result } = renderHook(() => useWatchlist())

    act(() => {
      localStorage.setItem('streamscout_watchlist', JSON.stringify([movieA]))
      window.dispatchEvent(new Event('storage'))
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe(1)
  })

  it('mergeItems ignoriert ungueltige und doppelte Eintraege', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))

    let mergeResult
    act(() => {
      mergeResult = result.current.mergeItems([
        movieA,
        { media_type: 'movie' },
        { id: 3, title: 'Ohne Typ' },
        { id: 9, media_type: 'tv', name: 'Neu' },
      ])
    })

    expect(mergeResult).toEqual({ success: true, count: 1 })
    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[0]).toMatchObject({ id: 9, media_type: 'tv', title: 'Neu' })
  })

  it('mergeItems liefert count=0 bei leerer Eingabe', () => {
    const { result } = renderHook(() => useWatchlist())
    let mergeResult

    act(() => {
      mergeResult = result.current.mergeItems([])
    })

    expect(mergeResult).toEqual({ success: true, count: 0 })
  })

  it('erzeugt einen HashRouter-kompatiblen Share-Link', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => result.current.add(movieA))
    act(() => result.current.add(tvA))

    const link = result.current.generateShareLink()
    expect(link).toContain('#/watchlist?share=')

    const encodedShare = link.split('share=')[1]
    const decodedShare = decodeURIComponent(encodedShare)
    expect(decodedShare).toContain('m1')
    expect(decodedShare).toContain('t1')
  })

  it('begrenzt den Share-Link auf 100 Einträge', () => {
    const { result } = renderHook(() => useWatchlist())

    act(() => {
      for (let i = 1; i <= SHARE_ITEM_LIMIT + 1; i += 1) {
        result.current.add({
          id: i,
          media_type: 'movie',
          title: `Film ${i}`,
          poster_path: `/f-${i}.jpg`,
        })
      }
    })

    const link = result.current.generateShareLink()
    const encodedShare = link.split('share=')[1]
    const decodedShare = decodeURIComponent(encodedShare)
    const tokens = decodedShare.split(',').filter(Boolean)

    expect(tokens).toHaveLength(SHARE_ITEM_LIMIT)
    expect(tokens).toContain(`m${SHARE_ITEM_LIMIT + 1}`)
    expect(tokens).not.toContain('m1')
  })

  it('fetchSharedList liefert false bei leerem Share-String', async () => {
    const { result } = renderHook(() => useWatchlist())
    const response = await result.current.fetchSharedList('')

    expect(response).toEqual({
      success: false,
      items: [],
      failedCount: 0,
      invalidCount: 0,
      truncatedCount: 0,
    })
  })

  it('fetchSharedList liefert Fehler bei nicht-string Input', async () => {
    const { result } = renderHook(() => useWatchlist())
    const response = await result.current.fetchSharedList({ kaputt: true })

    expect(response.success).toBe(false)
    expect(response.error).toBe('Ungültiger Teilen-Link')
    expect(response.invalidCount).toBe(0)
    expect(response.truncatedCount).toBe(0)
  })

  it('fetchSharedList zählt ungültige Tokens', async () => {
    const { result } = renderHook(() => useWatchlist())
    const response = await result.current.fetchSharedList('abc,t,mx,mNaN,')

    expect(response).toEqual({
      success: true,
      items: [],
      failedCount: 0,
      invalidCount: 4,
      truncatedCount: 0,
    })
    expect(moviesApi.getMovieDetails).not.toHaveBeenCalled()
    expect(tvApi.getTvDetails).not.toHaveBeenCalled()
  })

  it('fetchSharedList dedupliziert Tokens und begrenzt auf 100 Einträge', async () => {
    moviesApi.getMovieDetails.mockImplementation(async (id) => ({
      title: `Film ${id}`,
      poster_path: `/m-${id}.jpg`,
      vote_average: 6.5,
      release_date: '2025-01-01',
    }))

    const uniquePart = Array.from({ length: 101 }, (_, i) => `m${i + 1}`).join(',')
    const response = await renderHook(() => useWatchlist()).result.current.fetchSharedList(`${uniquePart},m1,m2`)

    expect(response.success).toBe(true)
    expect(response.items).toHaveLength(100)
    expect(response.truncatedCount).toBe(1)
    expect(response.invalidCount).toBe(0)
    expect(moviesApi.getMovieDetails).toHaveBeenCalledTimes(100)
  })

  it('fetchSharedList hydriert Film- und Seriendaten', async () => {
    moviesApi.getMovieDetails.mockResolvedValue({
      title: 'Hydrierter Film',
      poster_path: '/m.jpg',
      vote_average: 8.1,
      release_date: '2025-01-01',
    })
    tvApi.getTvDetails.mockResolvedValue({
      name: 'Hydrierte Serie',
      poster_path: '/t.jpg',
      vote_average: 7.3,
      first_air_date: '2024-06-10',
    })

    const { result } = renderHook(() => useWatchlist())
    const response = await result.current.fetchSharedList('m1,t2')

    expect(response.success).toBe(true)
    expect(response.items).toHaveLength(2)
    expect(response.failedCount).toBe(0)
    expect(response.invalidCount).toBe(0)
    expect(response.truncatedCount).toBe(0)
    expect(response.items[0]).toMatchObject({ id: 1, media_type: 'movie', title: 'Hydrierter Film' })
    expect(response.items[1]).toMatchObject({ id: 2, media_type: 'tv', title: 'Hydrierte Serie' })
    expect(moviesApi.getMovieDetails).toHaveBeenCalledWith(1)
    expect(tvApi.getTvDetails).toHaveBeenCalledWith(2)
  })

  it('fetchSharedList verarbeitet Chunks groesser als 10 Eintraege', async () => {
    moviesApi.getMovieDetails.mockImplementation(async (id) => ({
      title: `Film ${id}`,
      poster_path: `/m-${id}.jpg`,
      vote_average: 6.5,
      release_date: '2025-01-01',
    }))

    const shareString = Array.from({ length: 11 }, (_, i) => `m${i + 1}`).join(',')
    const { result } = renderHook(() => useWatchlist())
    const response = await result.current.fetchSharedList(shareString)

    expect(response.success).toBe(true)
    expect(response.items).toHaveLength(11)
    expect(response.failedCount).toBe(0)
    expect(moviesApi.getMovieDetails).toHaveBeenCalledTimes(11)
  })

  it('fetchSharedList macht bei Einzel-Fehlern weiter', async () => {
    moviesApi.getMovieDetails
      .mockRejectedValueOnce(new Error('Boom'))
      .mockResolvedValueOnce({
        title: 'Nur zweiter Film',
        poster_path: '/ok.jpg',
        vote_average: 7.0,
        release_date: '2024-01-01',
      })

    const { result } = renderHook(() => useWatchlist())
    const response = await result.current.fetchSharedList('m1,m2')

    expect(response.success).toBe(true)
    expect(response.items).toHaveLength(1)
    expect(response.failedCount).toBe(1)
    expect(response.items[0].id).toBe(2)
  })
})


