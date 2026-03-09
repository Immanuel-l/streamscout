import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { discoverMovies, getMovieDetails, getMovieProviders, getMovieSimilar, getMovieRecommendations, getNowPlayingMovies, getMovieReleaseDates } from '../api/movies'
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
    staleTime: 60 * 60 * 1000, // 1h
  })
}

export function useTopRatedMovies() {
  return useQuery({
    queryKey: ['toprated', 'movies'],
    queryFn: () => discoverMovies({ sort_by: 'vote_average.desc', 'vote_count.gte': 200 }),
    select: (data) =>
      data.results.slice(0, 12).map((m) => ({ ...m, media_type: 'movie' })),
    staleTime: 60 * 60 * 1000, // 1h
  })
}

export function useNewMovies() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['new', 'movies'],
    queryFn: () => discoverMovies({ sort_by: 'primary_release_date.desc', 'release_date.lte': today, 'vote_count.gte': 5 }),
    select: (data) =>
      data.results.slice(0, 12).map((m) => ({ ...m, media_type: 'movie' })),
    staleTime: 60 * 60 * 1000, // 1h
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

export function useNowPlaying() {
  return useQuery({
    queryKey: ['nowPlaying'],
    queryFn: async () => {
      // Fetch first 2 pages to get a good coverage (~40 movies)
      const [p1, p2] = await Promise.all([
        getNowPlayingMovies(1),
        getNowPlayingMovies(2),
      ])
      const movies = [...p1.results, ...p2.results]
      // Deduplizieren (Seite 1 & 2 können Überschneidungen haben)
      const seen = new Set()
      const unique = movies.filter((m) => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })

      // Deutsche Kinostart-Daten parallel holen
      const releaseDates = await Promise.all(
        unique.map((m) =>
          getMovieReleaseDates(m.id)
            .then((results) => {
              const de = results?.find((r) => r.iso_3166_1 === 'DE')
              const theatrical = de?.release_dates?.find((d) => d.type === 3)
              return { id: m.id, deDate: theatrical?.release_date || m.release_date }
            })
            .catch(() => ({ id: m.id, deDate: m.release_date }))
        )
      )
      const dateMap = Object.fromEntries(releaseDates.map((r) => [r.id, r.deDate]))

      return {
        ids: new Set(unique.map((m) => m.id)),
        movies: unique
          .filter((m) => m.poster_path && m.overview)
          .sort((a, b) => (dateMap[b.id] || '').localeCompare(dateMap[a.id] || ''))
          .map((m) => ({ ...m, media_type: 'movie' })),
      }
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours — Kino-Programm ändert sich selten
  })
}

export function usePopularAnime() {
  const animeMovies = useQuery({
    queryKey: ['anime', 'movies'],
    queryFn: () => discoverMovies({ with_genres: '16', with_origin_country: 'JP', sort_by: 'popularity.desc' }),
    select: (data) => data.results.slice(0, 6).map((m) => ({ ...m, media_type: 'movie' })),
    staleTime: 6 * 60 * 60 * 1000, // 6h
  })

  const animeTv = useQuery({
    queryKey: ['anime', 'tv'],
    queryFn: () => discoverTv({ with_genres: '16', with_origin_country: 'JP', sort_by: 'popularity.desc' }),
    select: (data) => data.results.slice(0, 6).map((s) => ({ ...s, media_type: 'tv' })),
    staleTime: 6 * 60 * 60 * 1000, // 6h
  })

  const data = useMemo(() => {
    if (!animeMovies.data || !animeTv.data) return undefined
    return [...animeMovies.data, ...animeTv.data]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 12)
  }, [animeMovies.data, animeTv.data])

  return {
    data,
    isLoading: animeMovies.isLoading || animeTv.isLoading,
    error: animeMovies.error || animeTv.error,
  }
}
