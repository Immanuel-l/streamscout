import { useQuery } from '@tanstack/react-query'
import { getMovieGenres, getTvGenres, getMovieWatchProviders, getTvWatchProviders } from '../api/common'
import { ALLOWED_PROVIDER_SET } from '../utils/providers'

export function useGenres(mediaType) {
  return useQuery({
    queryKey: ['genres', mediaType],
    queryFn: () => (mediaType === 'tv' ? getTvGenres() : getMovieGenres()),
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useWatchProviders(mediaType) {
  return useQuery({
    queryKey: ['watchProviders', mediaType],
    queryFn: () => (mediaType === 'tv' ? getTvWatchProviders() : getMovieWatchProviders()),
    staleTime: 24 * 60 * 60 * 1000,
    select: (data) =>
      data
        .filter((p) => ALLOWED_PROVIDER_SET.has(p.provider_id))
        .sort((a, b) => a.display_priority - b.display_priority),
  })
}
