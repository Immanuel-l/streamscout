const APP_SHELL_CACHE = 'streamscout-shell-v2'
const TMDB_CACHE = 'streamscout-tmdb-v1'
const TMDB_ORIGIN = 'https://api.themoviedb.org'
const IS_LOCALHOST = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_SHELL_CACHE && key !== TMDB_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function createOfflineTmdbResponse() {
  return new Response(
    JSON.stringify({
      status_code: 503,
      status_message: 'Keine Verbindung. Zwischengespeicherte TMDB-Daten nicht verfügbar.',
      success: false,
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Cache TMDB API responses (network first, fallback to cache when offline)
  if (!IS_LOCALHOST && url.origin === TMDB_ORIGIN && url.pathname.startsWith('/3/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(TMDB_CACHE).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(async () => (await caches.match(event.request)) || createOfflineTmdbResponse())
    )
    return
  }

  if (url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(async () => (await caches.match('./index.html')) || (await caches.match('./')))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response
        const copy = response.clone()
        caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, copy))
        return response
      })
    })
  )
})

