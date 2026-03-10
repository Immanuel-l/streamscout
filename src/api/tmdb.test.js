import { describe, it, expect } from 'vitest'
import { posterUrl, backdropUrl, IMAGE_BASE } from './tmdb'

describe('IMAGE_BASE', () => {
  it('zeigt auf die TMDB Image CDN', () => {
    expect(IMAGE_BASE).toBe('https://image.tmdb.org/t/p')
  })
})

describe('posterUrl', () => {
  it('baut eine vollständige Poster-URL', () => {
    expect(posterUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg')
  })

  it('nutzt die angegebene Größe', () => {
    expect(posterUrl('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg')
  })

  it('gibt null zurück wenn kein Pfad vorhanden', () => {
    expect(posterUrl(null)).toBeNull()
    expect(posterUrl(undefined)).toBeNull()
    expect(posterUrl('')).toBeNull()
  })
})

describe('backdropUrl', () => {
  it('baut eine vollständige Backdrop-URL mit w1280 Default', () => {
    expect(backdropUrl('/bg.jpg')).toBe('https://image.tmdb.org/t/p/w1280/bg.jpg')
  })

  it('nutzt die angegebene Größe', () => {
    expect(backdropUrl('/bg.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/bg.jpg')
  })

  it('gibt null zurück wenn kein Pfad vorhanden', () => {
    expect(backdropUrl(null)).toBeNull()
    expect(backdropUrl(undefined)).toBeNull()
  })
})
