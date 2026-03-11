import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from './useInfiniteScroll'

describe('useInfiniteScroll', () => {
  let observe
  let disconnect
  let callback
  let originalObserver

  beforeEach(() => {
    observe = vi.fn()
    disconnect = vi.fn()
    callback = undefined
    originalObserver = globalThis.IntersectionObserver

    globalThis.IntersectionObserver = function MockIntersectionObserver(cb) {
      callback = cb
      this.observe = observe
      this.disconnect = disconnect
    }
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalObserver
  })

  it('beobachtet das Sentinel mit rootMargin 600px und laedt bei Treffer nach', () => {
    const fetchNextPage = vi.fn()
    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
      })
    )

    act(() => {
      result.current(document.createElement('div'))
    })

    expect(observe).toHaveBeenCalledTimes(1)

    act(() => {
      callback([{ isIntersecting: true }])
    })

    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('laedt nicht nach wenn keine naechste Seite vorhanden oder bereits geladen wird', () => {
    const fetchNextPage = vi.fn()
    const { result, rerender } = renderHook(
      (props) => useInfiniteScroll(props),
      {
        initialProps: {
          fetchNextPage,
          hasNextPage: false,
          isFetchingNextPage: false,
        },
      }
    )

    act(() => {
      result.current(document.createElement('div'))
      callback([{ isIntersecting: true }])
    })

    expect(fetchNextPage).not.toHaveBeenCalled()

    rerender({ fetchNextPage, hasNextPage: true, isFetchingNextPage: true })

    act(() => {
      callback([{ isIntersecting: true }])
    })

    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('trennt alte Observer bei neuem Node und bei Null-Node', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchNextPage: vi.fn(),
        hasNextPage: true,
        isFetchingNextPage: false,
      })
    )

    act(() => {
      result.current(document.createElement('div'))
    })

    act(() => {
      result.current(document.createElement('div'))
    })

    expect(disconnect).toHaveBeenCalledTimes(1)

    act(() => {
      result.current(null)
    })

    expect(disconnect).toHaveBeenCalledTimes(2)
  })
})
