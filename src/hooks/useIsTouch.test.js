import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('useIsTouch', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  it('liest den initialen matchMedia-Wert und reagiert auf Aenderungen', async () => {
    let listener
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((event, cb) => {
        if (event === 'change') listener = cb
      }),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => mediaQuery),
    })

    const { useIsTouch } = await import('./useIsTouch')
    const { result, unmount } = renderHook(() => useIsTouch())

    expect(result.current).toBe(true)

    act(() => {
      listener({ matches: false })
    })

    expect(result.current).toBe(false)

    unmount()
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listener)
  })

  it('liefert false wenn matchMedia nicht verfuegbar ist', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    })

    const { useIsTouch } = await import('./useIsTouch')
    const { result } = renderHook(() => useIsTouch())

    expect(result.current).toBe(false)
  })
})
