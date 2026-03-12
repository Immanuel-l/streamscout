import { useState, useEffect } from 'react'

export function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored)
    } catch (e) { console.warn(`usePersistedState: Fehler beim Lesen von "${key}":`, e) }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch (e) { console.warn(`usePersistedState: Fehler beim Schreiben von "${key}":`, e) }
  }, [key, value])

  return [value, setValue]
}
