import { useSyncExternalStore } from 'react'

const query = typeof window !== 'undefined'
  ? window.matchMedia('(hover: none) and (pointer: coarse)')
  : null

let snapshot = query?.matches ?? false

function subscribe(callback) {
  if (!query) return () => {}
  const handler = (e) => { snapshot = e.matches; callback() }
  query.addEventListener('change', handler)
  return () => query.removeEventListener('change', handler)
}

function getSnapshot() { return snapshot }
function getServerSnapshot() { return false }

export function useIsTouch() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
