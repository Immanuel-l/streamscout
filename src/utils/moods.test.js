import { describe, it, expect } from 'vitest'
import { moods, getMoodBySlug } from './moods'

describe('moods', () => {
  it('enthält 10 Stimmungen', () => {
    expect(moods).toHaveLength(10)
  })

  it('jede Stimmung hat die erwartete Struktur', () => {
    for (const mood of moods) {
      expect(mood).toHaveProperty('slug')
      expect(mood).toHaveProperty('title')
      expect(mood).toHaveProperty('description')
      expect(mood).toHaveProperty('icon')
      expect(mood).toHaveProperty('movie')
      expect(mood).toHaveProperty('tv')
      expect(typeof mood.slug).toBe('string')
      expect(mood.slug.length).toBeGreaterThan(0)
    }
  })

  it('Slugs sind eindeutig', () => {
    const slugs = moods.map((m) => m.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('Movie- und TV-Filter enthalten vote_count.gte', () => {
    for (const mood of moods) {
      expect(mood.movie['vote_count.gte']).toBeGreaterThan(0)
      expect(mood.tv['vote_count.gte']).toBeGreaterThan(0)
    }
  })
})

describe('getMoodBySlug', () => {
  it('findet eine Stimmung per Slug', () => {
    const mood = getMoodBySlug('leichte-kost')
    expect(mood).toBeDefined()
    expect(mood.title).toBe('Leichte Kost')
  })

  it('gibt undefined für unbekannten Slug', () => {
    expect(getMoodBySlug('gibts-nicht')).toBeUndefined()
  })

  it('findet alle Stimmungen korrekt', () => {
    for (const mood of moods) {
      expect(getMoodBySlug(mood.slug)).toBe(mood)
    }
  })
})
