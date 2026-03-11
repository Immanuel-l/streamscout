import { useSyncExternalStore, useCallback } from 'react'

const STORAGE_KEY = 'streamscout-theme'

function getTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'light' ? '#f5f5f5' : '#050505')
  }
}

// Apply saved theme immediately on module load (avoid flash)
applyTheme(getTheme())

const listeners = new Set()

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return getTheme()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot)

  const toggle = useCallback(() => {
    const next = getTheme() === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    listeners.forEach((cb) => cb())
  }, [])

  return { theme, toggle }
}
