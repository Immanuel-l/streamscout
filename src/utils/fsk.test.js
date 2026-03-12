import { describe, it, expect } from 'vitest'
import {
  normalizeFskCertification,
  normalizeFskFilterMode,
  formatFskLabel,
  setMovieFskFilterParams,
  matchesFskFilter,
  getMovieFskCertificationFromReleaseDates,
  getMovieFskLabelFromReleaseDates,
  getTvFskCertificationFromContentRatings,
  getTvFskLabelFromContentRatings,
} from './fsk'

describe('utils/fsk', () => {
  it('normalisiert gueltige Altersfreigaben', () => {
    expect(normalizeFskCertification('12')).toBe('12')
    expect(normalizeFskCertification('FSK 16')).toBe('16')
    expect(normalizeFskCertification('ab 6 Jahren')).toBe('6')
  })

  it('verwirft ungueltige oder unbekannte Werte', () => {
    expect(normalizeFskCertification('')).toBeNull()
    expect(normalizeFskCertification('NR')).toBeNull()
    expect(normalizeFskCertification('14')).toBeNull()
    expect(normalizeFskCertification(undefined)).toBeNull()
  })

  it('normalisiert ungueltige Modi auf lte', () => {
    expect(normalizeFskFilterMode('eq')).toBe('eq')
    expect(normalizeFskFilterMode('gte')).toBe('gte')
    expect(normalizeFskFilterMode('invalid')).toBe('lte')
  })

  it('formatiert FSK-Labels', () => {
    expect(formatFskLabel('18')).toBe('FSK 18')
    expect(formatFskLabel('kein rating')).toBeNull()
  })

  it('setzt Film-Discover-Parameter je nach FSK-Modus', () => {
    const lte = setMovieFskFilterParams({}, '12', 'lte')
    const eq = setMovieFskFilterParams({}, '12', 'eq')
    const gte = setMovieFskFilterParams({}, '12', 'gte')

    expect(lte).toEqual({ certification_country: 'DE', 'certification.lte': '12' })
    expect(eq).toEqual({ certification_country: 'DE', certification: '12' })
    expect(gte).toEqual({ certification_country: 'DE', 'certification.gte': '12' })
  })

  it('vergleicht FSK-Werte korrekt je Modus', () => {
    expect(matchesFskFilter('12', '16', 'lte')).toBe(true)
    expect(matchesFskFilter('16', '16', 'eq')).toBe(true)
    expect(matchesFskFilter('12', '16', 'eq')).toBe(false)
    expect(matchesFskFilter('18', '16', 'gte')).toBe(true)
    expect(matchesFskFilter(null, '16', 'gte')).toBe(false)
  })

  it('nimmt bei Filmen priorisiert Kino-Releases fuer DE', () => {
    const results = [
      {
        iso_3166_1: 'DE',
        release_dates: [
          { type: 4, certification: '16' },
          { type: 3, certification: '12' },
        ],
      },
    ]

    expect(getMovieFskCertificationFromReleaseDates(results)).toBe('12')
    expect(getMovieFskLabelFromReleaseDates(results)).toBe('FSK 12')
  })

  it('liest TV-FSK aus DE content_ratings', () => {
    const results = [
      { iso_3166_1: 'US', rating: 'TV-14' },
      { iso_3166_1: 'DE', rating: '16' },
    ]

    expect(getTvFskCertificationFromContentRatings(results)).toBe('16')
    expect(getTvFskLabelFromContentRatings(results)).toBe('FSK 16')
  })
})
