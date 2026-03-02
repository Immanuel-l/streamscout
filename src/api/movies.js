import tmdb from './tmdb'

export const getMovieDetails = (id) =>
  tmdb.get(`/movie/${id}`).then((res) => res.data)

export const getMovieProviders = (id) =>
  tmdb.get(`/movie/${id}/watch/providers`).then((res) => res.data.results?.DE)

export const getMovieSimilar = (id, page = 1) =>
  tmdb.get(`/movie/${id}/similar`, { params: { page } }).then((res) => res.data)

export const getMovieRecommendations = (id, page = 1) =>
  tmdb.get(`/movie/${id}/recommendations`, { params: { page } }).then((res) => res.data)

export const discoverMovies = (params = {}) =>
  tmdb.get('/discover/movie', { params: { watch_region: 'DE', ...params } }).then((res) => res.data)

export const getTrendingMovies = (timeWindow = 'week') =>
  tmdb.get(`/trending/movie/${timeWindow}`).then((res) => res.data)
