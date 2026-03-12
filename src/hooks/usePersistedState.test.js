import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistedState } from './usePersistedState'


let warnSpy

describe('usePersistedState', () => {
  beforeAll(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterAll(() => {
    warnSpy.mockRestore()
  })
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('gibt den Default-Wert zurück wenn nichts gespeichert ist', () => {
    const { result } = renderHook(() => usePersistedState('testKey', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('akzeptiert eine Funktion als Default-Wert', () => {
    const { result } = renderHook(() => usePersistedState('testKey', () => 42))
    expect(result.current[0]).toBe(42)
  })

  it('speichert Werte in sessionStorage', () => {
    const { result } = renderHook(() => usePersistedState('testKey', 'init'))
    act(() => result.current[1]('updated'))

    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(sessionStorage.getItem('testKey'))).toBe('updated')
  })

  it('liest gespeicherte Werte aus sessionStorage', () => {
    sessionStorage.setItem('testKey', JSON.stringify('gespeichert'))

    const { result } = renderHook(() => usePersistedState('testKey', 'default'))
    expect(result.current[0]).toBe('gespeichert')
  })

  it('nutzt Default wenn sessionStorage ungültiges JSON enthält', () => {
    sessionStorage.setItem('testKey', 'kein-json{{{')

    const { result } = renderHook(() => usePersistedState('testKey', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('speichert Objekte korrekt', () => {
    const { result } = renderHook(() => usePersistedState('objKey', {}))
    act(() => result.current[1]({ name: 'Test', count: 3 }))

    expect(result.current[0]).toEqual({ name: 'Test', count: 3 })
    expect(JSON.parse(sessionStorage.getItem('objKey'))).toEqual({ name: 'Test', count: 3 })
  })

  it('speichert Arrays korrekt', () => {
    const { result } = renderHook(() => usePersistedState('arrKey', []))
    act(() => result.current[1]([1, 2, 3]))

    expect(result.current[0]).toEqual([1, 2, 3])
  })
})

