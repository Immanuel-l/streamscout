import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('gibt den initialen Wert sofort zurück', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('aktualisiert den Wert nach dem Delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'ab' })
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('ab')
  })

  it('setzt den Timer bei Änderung zurück', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'ab' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a')

    // Neuer Wert setzt Timer zurück
    rerender({ value: 'abc' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a') // Noch nicht 300ms seit letzter Änderung

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('abc')
  })

  it('nutzt Default-Delay von 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'x' } }
    )

    rerender({ value: 'y' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('x')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('y')
  })
})
