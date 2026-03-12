import tmdb from './tmdb'
import { ALLOWED_PROVIDER_STRING } from '../utils/providers'

export const getTvDetails = (id) =>
  tmdb.get(`/tv/${id}`, { params: { append_to_response: 'keywords,credits,videos,content_ratings', include_video_language: 'de,en,null' } }).then((res) => res.data)

export const getTvProviders = (id) =>
  tmdb.get(`/tv/${id}/watch/providers`).then((res) => res.data.results?.DE ?? null)

export const getTvContentRatings = (id) =>
  tmdb.get(`/tv/${id}/content_ratings`).then((res) => res.data.results)

export const getTvSimilar = (id, page = 1) =>
  tmdb.get(`/tv/${id}/similar`, { params: { page } }).then((res) => res.data)

export const getTvRecommendations = (id, page = 1) =>
  tmdb.get(`/tv/${id}/recommendations`, { params: { page } }).then((res) => res.data)

export const getTvSeason = (id, seasonNumber) =>
  tmdb.get(`/tv/${id}/season/${seasonNumber}`).then((res) => res.data)

export const getTvSeasonProviders = (id, seasonNumber) =>
  tmdb.get(`/tv/${id}/season/${seasonNumber}/watch/providers`).then((res) => res.data.results?.DE ?? null)

export const discoverTv = (params = {}) =>
  tmdb.get('/discover/tv', { params: { watch_region: 'DE', with_watch_providers: ALLOWED_PROVIDER_STRING, with_watch_monetization_types: 'flatrate', ...params } }).then((res) => res.data)

export const getTrendingTv = (timeWindow = 'week') =>
  tmdb.get(`/trending/tv/${timeWindow}`).then((res) => res.data)
