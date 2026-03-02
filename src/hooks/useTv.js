import { useQuery } from '@tanstack/react-query'
import { discoverTv, getTvDetails, getTvProviders, getTvSimilar, getTvRecommendations, getTvSeason } from '../api/tv'

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

export function useTvSimilar(id) {
  return useQuery({
    queryKey: ['tv', id, 'similar'],
    queryFn: () => getTvSimilar(id),
    enabled: !!id,
    select: (data) =>
      data.results.map((s) => ({ ...s, media_type: 'tv' })),
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

export function useTvSeason(id, seasonNumber) {
  return useQuery({
    queryKey: ['tv', id, 'season', seasonNumber],
    queryFn: () => getTvSeason(id, seasonNumber),
    enabled: !!id && seasonNumber != null,
  })
}
