import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWatchlist } from './useWatchlist'

const movieA = { id: 1, media_type: 'movie', title: 'Film A', poster_path: '/a.jpg' }
const movieB = { id: 2, media_type: 'movie', title: 'Film B', poster_path: '/b.jpg' }
const tvA = { id: 1, media_type: 'tv', name: 'Serie A', poster_path: '/c.jpg' }

describe('useWatchlist', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('startet mit leerer Liste', () => {
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.items).toEqual([])
  })

  it('fügt einen Film hinzu', () => {
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

  it('toggle fügt hinzu wenn nicht vorhanden', () => {
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

  it('isInWatchlist prüft korrekt', () => {
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
      { id: 5, media_type: 'movie', title: 'Gespeichert', poster_path: '/x.jpg' }
    ]))

    const { result } = renderHook(() => useWatchlist())
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].title).toBe('Gespeichert')
  })
})
