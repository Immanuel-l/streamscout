import axios from 'axios'

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    language: 'de-DE',
    region: 'DE',
  },
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`,
  },
})

export const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const posterUrl = (path, size = 'w500') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null

export const backdropUrl = (path, size = 'w1280') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null

export default tmdb
