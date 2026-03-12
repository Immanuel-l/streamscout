import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

async function loadUseThemeModule(token = 'token-123') {
  vi.resetModules()
  vi.stubEnv('VITE_TMDB_ACCESS_TOKEN', token)
  return import('./useTheme')
}

describe('useTheme', () => {
  let getItemSpy
  let setItemSpy

  beforeEach(() => {
    document.head.innerHTML = ''
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  afterEach(() => {
    getItemSpy?.mockRestore()
    setItemSpy?.mockRestore()
    vi.unstubAllEnvs()
  })

  it('wendet gespeichertes Theme direkt beim Modul-Load an', async () => {
    localStorage.setItem('streamscout-theme', 'light')
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#000000')
    document.head.appendChild(meta)

    await loadUseThemeModule()

    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(meta.getAttribute('content')).toBe('#f5f5f5')
  })

  it('faellt ohne gespeicherten Wert auf dark zurueck', async () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)

    await loadUseThemeModule()

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(meta.getAttribute('content')).toBe('#050505')
  })

  it('faellt bei localStorage-Read-Fehler auf dark zurueck', async () => {
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    await loadUseThemeModule()

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('toggle wechselt Theme, schreibt in localStorage und updated meta', async () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)

    const { useTheme } = await loadUseThemeModule()
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => {
      expect(result.current.theme).toBe('light')
    })
    expect(localStorage.getItem('streamscout-theme')).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(meta.getAttribute('content')).toBe('#f5f5f5')

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => {
      expect(result.current.theme).toBe('dark')
    })
    expect(localStorage.getItem('streamscout-theme')).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(meta.getAttribute('content')).toBe('#050505')
  })

  it('toggle funktioniert auch ohne theme-color meta-tag', async () => {
    const { useTheme } = await loadUseThemeModule()
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => {
      expect(result.current.theme).toBe('light')
    })
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('wirft Fehler weiter wenn localStorage.setItem fehlschlaegt', async () => {
    const { useTheme } = await loadUseThemeModule()
    const { result } = renderHook(() => useTheme())

    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(() => {
      act(() => {
        result.current.toggle()
      })
    }).toThrow('quota exceeded')
  })
})
