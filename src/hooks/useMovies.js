import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { discoverMovies, getMovieDetails, getMovieProviders, getMovieSimilar, getMovieRecommendations } from '../api/movies'
import { discoverTv } from '../api/tv'

export function useTrendingAll() {
  const movies = useQuery({
    queryKey: ['trending', 'movies'],
    queryFn: () => discoverMovies({ sort_by: 'popularity.desc' }),
    select: (data) => data.results.slice(0, 6).map((m) => ({ ...m, media_type: 'movie' })),
  })

  const tv = useQuery({
    queryKey: ['trending', 'tv'],
    queryFn: () => discoverTv({ sort_by: 'popularity.desc' }),
    select: (data) => data.results.slice(0, 6).map((s) => ({ ...s, media_type: 'tv' })),
  })

  const data = useMemo(() => {
    if (!movies.data || !tv.data) return undefined
    const combined = []
    const max = Math.max(movies.data.length, tv.data.length)
    for (let i = 0; i < max; i++) {
      if (movies.data[i]) combined.push(movies.data[i])
      if (tv.data[i]) combined.push(tv.data[i])
    }
    return combined.slice(0, 12)
  }, [movies.data, tv.data])

  return {
    data,
    isLoading: movies.isLoading || tv.isLoading,
    error: movies.error || tv.error,
  }
}

export function usePopularMovies() {
  return useQuery({
    queryKey: ['popular', 'movies'],
    queryFn: () => discoverMovies({ sort_by: 'popularity.desc', 'vote_average.gte': 5.5, 'vote_count.gte': 50 }),
    select: (data) =>
      data.results.slice(0, 12).map((m) => ({ ...m, media_type: 'movie' })),
  })
}

export function useTopRatedMovies() {
  return useQuery({
    queryKey: ['toprated', 'movies'],
    queryFn: () => discoverMovies({ sort_by: 'vote_average.desc', 'vote_count.gte': 200 }),
    select: (data) =>
      data.results.slice(0, 12).map((m) => ({ ...m, media_type: 'movie' })),
  })
}

export function useNewMovies() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['new', 'movies'],
    queryFn: () => discoverMovies({ sort_by: 'primary_release_date.desc', 'release_date.lte': today, 'vote_count.gte': 5 }),
    select: (data) =>
      data.results.slice(0, 12).map((m) => ({ ...m, media_type: 'movie' })),
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

export function useMovieSimilar(id, genreIds, keywordIds) {
  const genreString = genreIds?.join('|')
  const keywordString = keywordIds?.length > 0 ? keywordIds.slice(0, 10).join('|') : undefined
  return useQuery({
    queryKey: ['movie', id, 'similar', genreString, keywordString],
    queryFn: () =>
      discoverMovies({
        with_genres: genreString,
        ...(keywordString && { with_keywords: keywordString }),
        sort_by: 'popularity.desc',
      }),
    enabled: !!id && !!genreString,
    select: (data) =>
      data.results
        .filter((m) => m.id !== Number(id))
        .map((m) => ({ ...m, media_type: 'movie' })),
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
