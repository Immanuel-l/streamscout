import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'streamscout_watchlist'
const SYNC_EVENT = 'watchlist-sync'

function readWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function writeWatchlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(SYNC_EVENT))
}

export function useWatchlist() {
  const [items, setItems] = useState(readWatchlist)

  useEffect(() => {
    const sync = () => setItems(readWatchlist())
    window.addEventListener(SYNC_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SYNC_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const add = useCallback((media) => {
    const entry = {
      id: media.id,
      media_type: media.media_type,
      title: media.title || media.name,
      poster_path: media.poster_path,
    }
    const current = readWatchlist()
    if (current.some((m) => m.id === entry.id && m.media_type === entry.media_type)) return
    writeWatchlist([entry, ...current])
  }, [])

  const remove = useCallback((id, mediaType) => {
    const current = readWatchlist()
    writeWatchlist(current.filter((m) => !(m.id === id && m.media_type === mediaType)))
  }, [])

  const toggle = useCallback((media) => {
    const mediaType = media.media_type
    const current = readWatchlist()
    const exists = current.some((m) => m.id === media.id && m.media_type === mediaType)
    if (exists) {
      writeWatchlist(current.filter((m) => !(m.id === media.id && m.media_type === mediaType)))
    } else {
      const entry = {
        id: media.id,
        media_type: mediaType,
        title: media.title || media.name,
        poster_path: media.poster_path,
      }
      writeWatchlist([entry, ...current])
    }
  }, [])

  const isInWatchlist = useCallback(
    (id, mediaType) => items.some((m) => m.id === id && m.media_type === mediaType),
    [items]
  )

  return { items, add, remove, toggle, isInWatchlist }
}
