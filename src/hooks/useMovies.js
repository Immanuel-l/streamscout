import { useQuery } from '@tanstack/react-query'
import { discoverMovies, getMovieDetails, getMovieProviders, getMovieSimilar, getMovieRecommendations } from '../api/movies'

export function usePopularMovies() {
  return useQuery({
    queryKey: ['popular', 'movies'],
    queryFn: () => discoverMovies({ sort_by: 'popularity.desc' }),
    select: (data) =>
      data.results.map((m) => ({ ...m, media_type: 'movie' })),
  })
}

export function useDiscoverMovies(params) {
  return useQuery({
    queryKey: ['discover', 'movies', params],
    queryFn: () => discoverMovies(params),
    enabled: !!params,
  })
}

export function useMovieDetails(id) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
    enabled: !!id,
  })
}

export function useMovieProviders(id) {
  return useQuery({
    queryKey: ['movie', id, 'providers'],
    queryFn: () => getMovieProviders(id),
    enabled: !!id,
  })
}

export function useMovieSimilar(id) {
  return useQuery({
    queryKey: ['movie', id, 'similar'],
    queryFn: () => getMovieSimilar(id),
    enabled: !!id,
    select: (data) =>
      data.results.map((m) => ({ ...m, media_type: 'movie' })),
  })
}

export function useMovieRecommendations(id) {
  return useQuery({
    queryKey: ['movie', id, 'recommendations'],
    queryFn: () => getMovieRecommendations(id),
    enabled: !!id,
    select: (data) =>
      data.results.map((m) => ({ ...m, media_type: 'movie' })),
  })
}
