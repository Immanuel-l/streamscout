import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../components/common/useToast', () => ({
  showGlobalToast: vi.fn(),
}))

import { showGlobalToast } from '../components/common/useToast'

async function loadTmdbModule(tokenValue) {
  vi.resetModules()

  if (tokenValue === undefined) {
    vi.unstubAllEnvs()
  } else {
    vi.stubEnv('VITE_TMDB_ACCESS_TOKEN', tokenValue)
  }

  return import('./tmdb')
}

describe('tmdb api client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('nutzt konstante IMAGE_BASE', async () => {
    const { IMAGE_BASE } = await loadTmdbModule('token-123')
    expect(IMAGE_BASE).toBe('https://image.tmdb.org/t/p')
  })

  it('baut Poster- und Backdrop-URLs korrekt', async () => {
    const { posterUrl, backdropUrl } = await loadTmdbModule('token-123')

    expect(posterUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg')
    expect(posterUrl('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg')
    expect(posterUrl(null)).toBeNull()

    expect(backdropUrl('/bg.jpg')).toBe('https://image.tmdb.org/t/p/w1280/bg.jpg')
    expect(backdropUrl('/bg.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/bg.jpg')
    expect(backdropUrl(undefined)).toBeNull()
  })

  it('wirft in Request-Interceptor ohne Token', async () => {
    const { default: tmdb } = await loadTmdbModule('')
    const requestInterceptor = tmdb.interceptors.request.handlers[0]

    expect(() => requestInterceptor.fulfilled({})).toThrow(
      'VITE_TMDB_ACCESS_TOKEN fehlt. Erstelle eine .env-Datei mit deinem TMDB API Token.'
    )
  })

  it('laesst Requests mit Token durch', async () => {
    const { default: tmdb } = await loadTmdbModule('token-123')
    const requestInterceptor = tmdb.interceptors.request.handlers[0]
    const config = { url: '/movie/1' }

    expect(requestInterceptor.fulfilled(config)).toBe(config)
  })

  it('reicht erfolgreiche Responses unveraendert durch', async () => {
    const { default: tmdb } = await loadTmdbModule('token-123')
    const responseInterceptor = tmdb.interceptors.response.handlers[0]
    const response = { data: { ok: true } }

    expect(responseInterceptor.fulfilled(response)).toBe(response)
  })

  it('zeigt Netzwerk-Toast ohne error.response', async () => {
    const { default: tmdb } = await loadTmdbModule('token-123')
    const responseInterceptor = tmdb.interceptors.response.handlers[0]
    const networkError = new Error('offline')

    await expect(responseInterceptor.rejected(networkError)).rejects.toBe(networkError)
    expect(showGlobalToast).toHaveBeenCalledWith(
      'Keine Internetverbindung. Bitte prüfe dein Netzwerk.',
      'error'
    )
  })

  it('zeigt 401-Toast bei ungueltigem Token', async () => {
    const { default: tmdb } = await loadTmdbModule('token-123')
    const responseInterceptor = tmdb.interceptors.response.handlers[0]
    const error401 = { response: { status: 401 } }

    await expect(responseInterceptor.rejected(error401)).rejects.toBe(error401)
    expect(showGlobalToast).toHaveBeenCalledWith(
      'API-Token ungültig. Bitte prüfe deine TMDB-Zugangsdaten.',
      'error'
    )
  })

  it('zeigt 429-Toast bei Rate-Limit', async () => {
    const { default: tmdb } = await loadTmdbModule('token-123')
    const responseInterceptor = tmdb.interceptors.response.handlers[0]
    const error429 = { response: { status: 429 } }

    await expect(responseInterceptor.rejected(error429)).rejects.toBe(error429)
    expect(showGlobalToast).toHaveBeenCalledWith(
      'Zu viele Anfragen. Bitte warte einen Moment.',
      'error'
    )
  })

  it('zeigt keinen Toast fuer andere HTTP-Fehler', async () => {
    const { default: tmdb } = await loadTmdbModule('token-123')
    const responseInterceptor = tmdb.interceptors.response.handlers[0]
    const error500 = { response: { status: 500 } }

    await expect(responseInterceptor.rejected(error500)).rejects.toBe(error500)
    expect(showGlobalToast).not.toHaveBeenCalled()
  })
})
