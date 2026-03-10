import axios from 'axios'
import { showGlobalToast } from '../components/common/useToast'

if (!import.meta.env.VITE_TMDB_ACCESS_TOKEN) {
  throw new Error(
    'VITE_TMDB_ACCESS_TOKEN fehlt. Erstelle eine .env-Datei mit deinem TMDB API Token.'
  )
}

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

// Centralized error handling
tmdb.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      showGlobalToast('Keine Internetverbindung. Bitte prüfe dein Netzwerk.', 'error')
    } else if (error.response.status === 401) {
      showGlobalToast('API-Token ungültig. Bitte prüfe deine TMDB-Zugangsdaten.', 'error')
    } else if (error.response.status === 429) {
      showGlobalToast('Zu viele Anfragen. Bitte warte einen Moment.', 'error')
    }
    return Promise.reject(error)
  }
)

export const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const posterUrl = (path, size = 'w500') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null

export const backdropUrl = (path, size = 'w1280') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null

export default tmdb
