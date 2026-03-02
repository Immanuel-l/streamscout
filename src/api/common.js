import tmdb from './tmdb'

export const searchMulti = (query, page = 1) =>
  tmdb.get('/search/multi', { params: { query, page } }).then((res) => res.data)

export const searchMovies = (query, page = 1) =>
  tmdb.get('/search/movie', { params: { query, page } }).then((res) => res.data)

export const searchTv = (query, page = 1) =>
  tmdb.get('/search/tv', { params: { query, page } }).then((res) => res.data)

export const getTrending = (timeWindow = 'week') =>
  tmdb.get(`/trending/all/${timeWindow}`).then((res) => res.data)

export const getMovieGenres = () =>
  tmdb.get('/genre/movie/list').then((res) => res.data.genres)

export const getTvGenres = () =>
  tmdb.get('/genre/tv/list').then((res) => res.data.genres)

export const getMovieWatchProviders = () =>
  tmdb.get('/watch/providers/movie', { params: { watch_region: 'DE' } }).then((res) => res.data.results)

export const getTvWatchProviders = () =>
  tmdb.get('/watch/providers/tv', { params: { watch_region: 'DE' } }).then((res) => res.data.results)
