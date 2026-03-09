import { useState, useEffect } from 'react'

export function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored)
    } catch { /* ignore */ }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch { /* ignore */ }
  }, [key, value])

  return [value, setValue]
}
