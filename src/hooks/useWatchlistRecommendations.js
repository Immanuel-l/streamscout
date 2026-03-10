import { useQuery } from '@tanstack/react-query'
import { useWatchlist } from './useWatchlist'
import { getMovieRecommendations, getMovieProviders } from '../api/movies'
import { getTvRecommendations, getTvProviders } from '../api/tv'
import { ALLOWED_PROVIDER_SET } from '../utils/providers'

export function useWatchlistRecommendations(count = 2) {
  const { items } = useWatchlist()

  // Random selection + fetching happens inside queryFn (not during render)
  // Static query key + high staleTime prevents re-picking on every add/remove
  const recommendationsQuery = useQuery({
    queryKey: ['watchlist-recommendations'],
    queryFn: async () => {
      const shuffled = [...items].sort(() => 0.5 - Math.random())
      const selectedItems = shuffled.slice(0, Math.min(count, items.length))

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

          return {
            sourceItem: item,
            recommendations: streamableRecs.slice(0, 12)
          }
        } catch (error) {
          console.error(`Failed to fetch recommendations for ${item.title || item.name}`, error)
          return null
        }
      })

      const results = await Promise.all(promises)
      return results.filter(r => r !== null && r.recommendations.length > 0)
    },
    enabled: items.length > 0,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  })

  return {
    data: recommendationsQuery.data || [],
    isLoading: recommendationsQuery.isLoading,
    error: recommendationsQuery.error,
    refresh: () => recommendationsQuery.refetch()
  }
}
