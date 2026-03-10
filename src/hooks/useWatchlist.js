import { useState, useEffect, useCallback } from 'react'
import { getMovieDetails } from '../api/movies'
import { getTvDetails } from '../api/tv'

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
      vote_average: media.vote_average || 0,
      release_date: media.release_date || media.first_air_date || '',
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
        vote_average: media.vote_average || 0,
        release_date: media.release_date || media.first_air_date || '',
      }
      writeWatchlist([entry, ...current])
    }
  }, [])

  const isInWatchlist = useCallback(
    (id, mediaType) => items.some((m) => m.id === id && m.media_type === mediaType),
    [items]
  )

  const mergeItems = useCallback((newItemsArray) => {
    if (!Array.isArray(newItemsArray) || newItemsArray.length === 0) return { success: true, count: 0 }
    
    const current = readWatchlist()
    const currentMap = new Set(current.map(m => `${m.media_type}-${m.id}`))
    
    const added = []
    for (const item of newItemsArray) {
      if (!item.id || !item.media_type) continue
      const key = `${item.media_type}-${item.id}`
      if (!currentMap.has(key)) {
        added.push({
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          vote_average: item.vote_average || 0,
          release_date: item.release_date || item.first_air_date || '',
        })
        currentMap.add(key)
      }
    }
    
    if (added.length > 0) {
      writeWatchlist([...added, ...current])
    }
    return { success: true, count: added.length }
  }, [])

  const generateShareLink = useCallback(() => {
    // Format: "m1234,t5678"
    const current = readWatchlist()
    const hash = current.map(m => `${m.media_type === 'tv' ? 't' : 'm'}${m.id}`).join(',')
    return `${window.location.origin}/watchlist?share=${hash}`
  }, [])

  const fetchSharedList = useCallback(async (shareString) => {
    try {
      if (!shareString) return { success: false, items: [] }
      
      const tokens = shareString.split(',').filter(Boolean)
      const newEntries = []
      
      for (const token of tokens) {
        const typeChar = token.charAt(0)
        const id = parseInt(token.substring(1), 10)
        if (isNaN(id) || !['m', 't'].includes(typeChar)) continue
        
        const media_type = typeChar === 't' ? 'tv' : 'movie'
        newEntries.push({ id, media_type })
      }

      if (newEntries.length === 0) return { success: true, items: [] }

      // Fetch metadata in chunks of 10 to avoid TMDB rate limits
      const hydrated = []
      const chunkSize = 10
      for (let i = 0; i < newEntries.length; i += chunkSize) {
        const chunk = newEntries.slice(i, i + chunkSize)
        const promises = chunk.map(async (entry) => {
          try {
            const data = entry.media_type === 'tv' 
              ? await getTvDetails(entry.id) 
              : await getMovieDetails(entry.id)
            return {
              id: entry.id,
              media_type: entry.media_type,
              title: data.title || data.name,
              poster_path: data.poster_path,
              vote_average: data.vote_average || 0,
              release_date: data.release_date || data.first_air_date || '',
            }
          } catch {
            console.warn(`Failed to fetch details for ${entry.media_type} ${entry.id}`)
            return null
          }
        })
        const results = await Promise.all(promises)
        hydrated.push(...results.filter(Boolean))
      }

      return { success: true, items: hydrated }
    } catch (e) {
      console.error('Share fetch error:', e)
      return { success: false, error: 'Abruf fehlgeschlagen' }
    }
  }, [])

  return { 
    items, 
    add, 
    remove, 
    toggle, 
    isInWatchlist, 
    mergeItems, 
    generateShareLink, 
    fetchSharedList 
  }
}
