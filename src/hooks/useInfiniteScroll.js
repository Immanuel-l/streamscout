import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook für Infinite Scroll mit IntersectionObserver.
 * Gibt eine Callback-Ref zurück, die an ein Sentinel-Element gebunden wird.
 *
 * @param {{ fetchNextPage: Function, hasNextPage: boolean, isFetchingNextPage: boolean }} options
 * @returns {Function} sentinelRef — Callback-Ref für das Sentinel-Element
 */
export function useInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage }) {
  // Stable refs so the observer callback always sees latest values
  const fetchRef = useRef(fetchNextPage)
  const hasNextRef = useRef(hasNextPage)
  const isFetchingRef = useRef(isFetchingNextPage)
  useEffect(() => {
    fetchRef.current = fetchNextPage
    hasNextRef.current = hasNextPage
    isFetchingRef.current = isFetchingNextPage
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Callback ref — sets up/tears down observer when sentinel enters/leaves DOM
  const observerRef = useRef(null)
  const sentinelRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextRef.current && !isFetchingRef.current) {
            fetchRef.current()
          }
        },
        { rootMargin: '600px' }
      )
      observer.observe(node)
      observerRef.current = observer
    }
  }, [])

  return sentinelRef
}
