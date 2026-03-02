import { useQuery } from '@tanstack/react-query'
import { getMovieGenres, getTvGenres, getMovieWatchProviders, getTvWatchProviders } from '../api/common'

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
        .sort((a, b) => a.display_priority - b.display_priority)
        .slice(0, 15),
  })
}
