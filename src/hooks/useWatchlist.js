import { useState, useEffect, useCallback } from 'react'
import { getMovieDetails } from '../api/movies'
import { getTvDetails } from '../api/tv'

const STORAGE_KEY = 'streamscout_watchlist'
const SYNC_EVENT = 'watchlist-sync'
export const SHARE_ITEM_LIMIT = 100
const SHARE_TOKEN_PATTERN = /^([mt])(\d+)$/

function readWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch (e) {
    console.warn('useWatchlist: Fehler beim Lesen der Watchlist:', e)
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
    const currentMap = new Set(current.map((m) => `${m.media_type}-${m.id}`))

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
    const shareValue = current
      .slice(0, SHARE_ITEM_LIMIT)
      .map((m) => `${m.media_type === 'tv' ? 't' : 'm'}${m.id}`)
      .join(',')
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
    return `${window.location.origin}${basePath}#/watchlist?share=${encodeURIComponent(shareValue)}`
  }, [])

  const fetchSharedList = useCallback(async (shareString) => {
    let invalidCount = 0
    let truncatedCount = 0

    try {
      if (!shareString) {
        return { success: false, items: [], failedCount: 0, invalidCount: 0, truncatedCount: 0 }
      }

      if (typeof shareString !== 'string') {
        return {
          success: false,
          items: [],
          failedCount: 0,
          invalidCount: 0,
          truncatedCount: 0,
          error: 'Ungültiger Teilen-Link',
        }
      }

      const tokens = shareString
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)

      const deduped = new Set()
      const newEntries = []

      for (const token of tokens) {
        const match = SHARE_TOKEN_PATTERN.exec(token)
        if (!match) {
          invalidCount += 1
          continue
        }

        const [, typeChar, idRaw] = match
        const dedupeKey = `${typeChar}${idRaw}`
        if (deduped.has(dedupeKey)) continue

        deduped.add(dedupeKey)
        newEntries.push({
          id: Number(idRaw),
          media_type: typeChar === 't' ? 'tv' : 'movie',
        })
      }

      const limitedEntries = newEntries.slice(0, SHARE_ITEM_LIMIT)
      truncatedCount = Math.max(newEntries.length - limitedEntries.length, 0)

      if (limitedEntries.length === 0) {
        return {
          success: true,
          items: [],
          failedCount: 0,
          invalidCount,
          truncatedCount,
        }
      }

      // Fetch metadata in chunks of 10 to avoid TMDB rate limits
      const hydrated = []
      const chunkSize = 10
      for (let i = 0; i < limitedEntries.length; i += chunkSize) {
        const chunk = limitedEntries.slice(i, i + chunkSize)
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

      return {
        success: true,
        items: hydrated,
        failedCount: limitedEntries.length - hydrated.length,
        invalidCount,
        truncatedCount,
      }
    } catch (e) {
      console.error('Share fetch error:', e)
      return {
        success: false,
        items: [],
        failedCount: 0,
        invalidCount,
        truncatedCount,
        error: 'Abruf fehlgeschlagen',
      }
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
    fetchSharedList,
  }
}

