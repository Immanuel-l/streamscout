import tmdb from './tmdb'

export const getTvDetails = (id) =>
  tmdb.get(`/tv/${id}`).then((res) => res.data)

export const getTvProviders = (id) =>
  tmdb.get(`/tv/${id}/watch/providers`).then((res) => res.data.results?.DE)

export const getTvSimilar = (id, page = 1) =>
  tmdb.get(`/tv/${id}/similar`, { params: { page } }).then((res) => res.data)

export const getTvRecommendations = (id, page = 1) =>
  tmdb.get(`/tv/${id}/recommendations`, { params: { page } }).then((res) => res.data)

export const getTvSeason = (id, seasonNumber) =>
  tmdb.get(`/tv/${id}/season/${seasonNumber}`).then((res) => res.data)

export const discoverTv = (params = {}) =>
  tmdb.get('/discover/tv', { params: { watch_region: 'DE', ...params } }).then((res) => res.data)

export const getTrendingTv = (timeWindow = 'week') =>
  tmdb.get(`/trending/tv/${timeWindow}`).then((res) => res.data)
