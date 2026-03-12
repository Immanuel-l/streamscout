import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWatchlist } from './useWatchlist'
import { getMovieRecommendations } from '../api/movies'
import { getTvRecommendations } from '../api/tv'
import { resolveProviderAvailability } from '../utils/providerAvailability'

const RECOMMENDATIONS_PER_SOURCE = 12
const MAX_CANDIDATES_PER_SOURCE = 40
const PROVIDER_CHECK_CHUNK_SIZE = 5

export function useWatchlistRecommendations(count = 2) {
  const { items } = useWatchlist()
  const queryClient = useQueryClient()

  // Random selection + fetching happens inside queryFn (not during render)
  // Query key includes watchlist signature so recommendations refresh after list changes
  const watchlistKey = items.map((item) => `${item.media_type}-${item.id}`).join(',')
  const recommendationsQuery = useQuery({
    queryKey: ['watchlist-recommendations', count, watchlistKey],
    queryFn: async () => {
      const shuffled = [...items].sort(() => 0.5 - Math.random())
      const selectedItems = shuffled.slice(0, Math.min(count, items.length))

      const promises = selectedItems.map(async (item) => {
        try {
          const fetcher = item.media_type === 'tv' ? getTvRecommendations : getMovieRecommendations
          const res = await fetcher(item.id)
          const allRecs = (res.results || [])
            .filter((media) => media.poster_path && media.overview)
            .slice(0, MAX_CANDIDATES_PER_SOURCE)

          const streamableRecs = []
          let unknownCount = 0
          let checkedCount = 0

          for (let i = 0; i < allRecs.length; i += PROVIDER_CHECK_CHUNK_SIZE) {
            if (streamableRecs.length >= RECOMMENDATIONS_PER_SOURCE) break

            const chunk = allRecs.slice(i, i + PROVIDER_CHECK_CHUNK_SIZE)
            const chunkResults = await Promise.all(
              chunk.map(async (rec) => {
                const availability = await resolveProviderAvailability(queryClient, item.media_type, rec.id)
                if (availability.state === 'unknown') {
                  unknownCount += 1
                  checkedCount += 1
                  return null
                }

                checkedCount += 1
                return availability.isStreamable ? { ...rec, media_type: item.media_type } : null
              })
            )

            streamableRecs.push(...chunkResults.filter(Boolean))
          }

          return {
            sourceItem: item,
            recommendations: streamableRecs.slice(0, RECOMMENDATIONS_PER_SOURCE),
            unknownCount,
            checkedCount,
          }
        } catch {
          return null
        }
      })

      const results = await Promise.all(promises)
      return results.filter((entry) => entry !== null && entry.recommendations.length > 0)
    },
    enabled: items.length > 0,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  })

  return {
    data: recommendationsQuery.data || [],
    isLoading: recommendationsQuery.isLoading,
    error: recommendationsQuery.error,
    refresh: () => recommendationsQuery.refetch(),
  }
}
