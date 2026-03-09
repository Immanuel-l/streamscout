import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useWatchlist } from './useWatchlist'
import { getMovieRecommendations, getMovieProviders } from '../api/movies'
import { getTvRecommendations, getTvProviders } from '../api/tv'
import { ALLOWED_PROVIDER_SET } from '../utils/providers'

export function useWatchlistRecommendations(count = 2) {
  const { items } = useWatchlist()
  const [selectedItems, setSelectedItems] = useState([])

  // Pick random items when the hook mounts or when the watchlist changes significantly
  useEffect(() => {
    if (items.length === 0) {
      setSelectedItems([])
      return
    }

    // Mix up the items array
    const shuffled = [...items].sort(() => 0.5 - Math.random())
    // Make sure we have enough items, taking up to `count` items
    const selected = shuffled.slice(0, Math.min(count, items.length))
    setSelectedItems(selected)
  }, [items, count])

  // Fetch recommendations for the selected items
  const recommendationsQuery = useQuery({
    queryKey: ['watchlist-recommendations', selectedItems.map(i => `${i.media_type}-${i.id}`).join(',')],
    queryFn: async () => {
      if (selectedItems.length === 0) return []

      const promises = selectedItems.map(async (item) => {
        try {
          const fetcher = item.media_type === 'tv' ? getTvRecommendations : getMovieRecommendations
          const providerFetcher = item.media_type === 'tv' ? getTvProviders : getMovieProviders
          const res = await fetcher(item.id)
          const allRecs = res.results?.filter(m => m.poster_path && m.overview) || []
          
          const streamableRecs = []
          const chunkSize = 5
          for (let i = 0; i < allRecs.length; i += chunkSize) {
            if (streamableRecs.length >= 12) break
            
            const chunk = allRecs.slice(i, i + chunkSize)
            const chunkResults = await Promise.all(
              chunk.map(async (rec) => {
                try {
                  const providers = await providerFetcher(rec.id)
                  const isStreamable = providers?.flatrate?.some(p => ALLOWED_PROVIDER_SET.has(p.provider_id))
                  return isStreamable ? { ...rec, media_type: item.media_type } : null
                } catch {
                  return null
                }
              })
            )
            streamableRecs.push(...chunkResults.filter(Boolean))
          }

          const recommendations = streamableRecs.slice(0, 12)

          return {
            sourceItem: item,
            recommendations
          }
        } catch (error) {
          console.error(`Failed to fetch recommendations for ${item.title || item.name}`, error)
          return null
        }
      })

      const results = await Promise.all(promises)
      // Filter out failed requests or items with 0 recommendations
      return results.filter(r => r !== null && r.recommendations.length > 0)
    },
    enabled: selectedItems.length > 0,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  })

  return {
    data: recommendationsQuery.data || [],
    isLoading: recommendationsQuery.isLoading,
    error: recommendationsQuery.error,
    refreshDelay: () => setSelectedItems(prev => [...prev]) // trigger rerender/repick mechanism if needed
  }
}
