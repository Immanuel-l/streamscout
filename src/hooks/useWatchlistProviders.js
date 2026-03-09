import { useQueries } from '@tanstack/react-query'
import { getMovieProviders } from '../api/movies'
import { getTvProviders } from '../api/tv'
import { ALLOWED_PROVIDER_SET } from '../utils/providers'
import { useMemo } from 'react'

/**
 * Fetches provider data for all items in the watchlist and returns an aggregated map of available providers.
 * 
 * @param {Array} items - List of watchlist items ({ id, media_type })
 * @returns {Object} - { isLoading, providerMap, availableProviders }
 */
export function useWatchlistProviders(items) {
  // We only run queries for items that we have id and type for
  const queries = useQueries({
    queries: (items || []).map((item) => ({
      queryKey: [item.media_type, item.id, 'providers'],
      queryFn: () => item.media_type === 'tv' ? getTvProviders(item.id) : getMovieProviders(item.id),
      staleTime: 6 * 60 * 60 * 1000, // Cache for 6 hours
      enabled: !!item.id && !!item.media_type,
    }))
  })

  // Has all data loaded? (queries can be empty if list is empty)
  const isLoading = queries.length > 0 && queries.some(q => q.isLoading)

  // Memoize the aggregation logic to avoid re-rendering issues
  const { providerMap, availableProviders } = useMemo(() => {
    if (queries.some(q => q.isLoading)) {
      return { providerMap: {}, availableProviders: [] }
    }

    const map = {} // key: `${media_type}-${id}`, value: Set of provider_ids
    const providerCount = {} // id -> count of items
    const providerDetails = {} // id -> provider object { provider_id, provider_name, logo_path }

    items.forEach((item, index) => {
      const queryResult = queries[index]
      if (queryResult && queryResult.data?.flatrate) {
        const key = `${item.media_type}-${item.id}`
        const flatrateProviders = queryResult.data.flatrate.filter(p => ALLOWED_PROVIDER_SET.has(p.provider_id))
        
        const providerIds = new Set(flatrateProviders.map(p => p.provider_id))
        map[key] = providerIds

        flatrateProviders.forEach(p => {
          providerCount[p.provider_id] = (providerCount[p.provider_id] || 0) + 1
          if (!providerDetails[p.provider_id]) {
            providerDetails[p.provider_id] = p
          }
        })
      }
    })

    // Convert aggregated providers into an array sorted by coverage (who has the most movies on this list?)
    const available = Object.keys(providerDetails)
      .map(id => providerDetails[id])
      .sort((a, b) => providerCount[b.provider_id] - providerCount[a.provider_id])

    return { providerMap: map, availableProviders: available }
  }, [items, queries])

  return { isLoading, providerMap, availableProviders }
}
