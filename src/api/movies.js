import tmdb from './tmdb'
import { ALLOWED_PROVIDER_STRING } from '../utils/providers'

export const getMovieDetails = (id) =>
  tmdb.get(`/movie/${id}`, { params: { append_to_response: 'keywords' } }).then((res) => res.data)

export const getMovieProviders = (id) =>
  tmdb.get(`/movie/${id}/watch/providers`).then((res) => res.data.results?.DE)

export const getMovieSimilar = (id, page = 1) =>
  tmdb.get(`/movie/${id}/similar`, { params: { page } }).then((res) => res.data)

export const getMovieRecommendations = (id, page = 1) =>
  tmdb.get(`/movie/${id}/recommendations`, { params: { page } }).then((res) => res.data)

export const discoverMovies = (params = {}) =>
  tmdb.get('/discover/movie', { params: { watch_region: 'DE', with_watch_providers: ALLOWED_PROVIDER_STRING, ...params } }).then((res) => res.data)

export const getTrendingMovies = (timeWindow = 'week') =>
  tmdb.get(`/trending/movie/${timeWindow}`).then((res) => res.data)
