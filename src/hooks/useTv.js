import { useQuery, useQueries } from '@tanstack/react-query'
import { discoverTv, getTvDetails, getTvProviders, getTvSimilar, getTvRecommendations, getTvSeason, getTvSeasonProviders } from '../api/tv'

export function usePopularTv() {
  return useQuery({
    queryKey: ['popular', 'tv'],
    queryFn: () => discoverTv({ sort_by: 'popularity.desc' }),
    select: (data) =>
      data.results.map((s) => ({ ...s, media_type: 'tv' })),
  })
}

export function useDiscoverTv(params) {
  return useQuery({
    queryKey: ['discover', 'tv', params],
    queryFn: () => discoverTv(params),
    enabled: !!params,
  })
}

export function useTvDetails(id) {
  return useQuery({
    queryKey: ['tv', id],
    queryFn: () => getTvDetails(id),
    enabled: !!id,
  })
}

export function useTvProviders(id) {
  return useQuery({
    queryKey: ['tv', id, 'providers'],
    queryFn: () => getTvProviders(id),
    enabled: !!id,
  })
}

export function useTvSimilar(id, genreIds, keywordIds) {
  const genreString = genreIds?.join('|')
  const keywordString = keywordIds?.length > 0 ? keywordIds.slice(0, 10).join('|') : undefined
  return useQuery({
    queryKey: ['tv', id, 'similar', genreString, keywordString],
    queryFn: () =>
      discoverTv({
        with_genres: genreString,
        ...(keywordString && { with_keywords: keywordString }),
        sort_by: 'popularity.desc',
      }),
    enabled: !!id && !!genreString,
    select: (data) =>
      data.results
        .filter((s) => s.id !== Number(id))
        .map((s) => ({ ...s, media_type: 'tv' })),
  })
}

export function useTvRecommendations(id) {
  return useQuery({
    queryKey: ['tv', id, 'recommendations'],
    queryFn: () => getTvRecommendations(id),
    enabled: !!id,
    select: (data) =>
      data.results.map((s) => ({ ...s, media_type: 'tv' })),
  })
}

export function useTvSeasonProviders(id, seasonNumbers) {
  return useQueries({
    queries: (seasonNumbers ?? []).map((num) => ({
      queryKey: ['tv', id, 'season', num, 'providers'],
      queryFn: () => getTvSeasonProviders(id, num),
      enabled: !!id,
      staleTime: 24 * 60 * 60 * 1000,
    })),
    combine: (results) =>
      results.map((r, i) => ({
        seasonNumber: seasonNumbers[i],
        data: r.data,
        isLoading: r.isLoading,
      })),
  })
}

export function useTvSeason(id, seasonNumber) {
  return useQuery({
    queryKey: ['tv', id, 'season', seasonNumber],
    queryFn: () => getTvSeason(id, seasonNumber),
    enabled: !!id && seasonNumber != null,
  })
}
