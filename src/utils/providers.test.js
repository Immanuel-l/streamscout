import { describe, it, expect } from 'vitest'
import { ALLOWED_PROVIDER_IDS, ALLOWED_PROVIDER_SET, ALLOWED_PROVIDER_STRING } from './providers'

describe('providers', () => {
  it('enthält die bekannten Streaming-Dienste', () => {
    // Netflix=8, Prime=9, Disney+=337, Crunchyroll=283
    expect(ALLOWED_PROVIDER_IDS).toContain(8)
    expect(ALLOWED_PROVIDER_IDS).toContain(9)
    expect(ALLOWED_PROVIDER_IDS).toContain(337)
    expect(ALLOWED_PROVIDER_IDS).toContain(283)
  })

  it('Set hat gleiche Einträge wie Array', () => {
    expect(ALLOWED_PROVIDER_SET.size).toBe(ALLOWED_PROVIDER_IDS.length)
    for (const id of ALLOWED_PROVIDER_IDS) {
      expect(ALLOWED_PROVIDER_SET.has(id)).toBe(true)
    }
  })

  it('Set erkennt unbekannte Provider als falsch', () => {
    expect(ALLOWED_PROVIDER_SET.has(99999)).toBe(false)
  })

  it('String ist pipe-separiert für TMDB API', () => {
    expect(ALLOWED_PROVIDER_STRING).toBe(ALLOWED_PROVIDER_IDS.join('|'))
    expect(ALLOWED_PROVIDER_STRING).toMatch(/^\d+(\|\d+)*$/)
  })
})
