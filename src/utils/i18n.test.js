import { describe, it, expect, beforeEach } from 'vitest'
import { t, setLocale, getLocale } from './i18n'

describe('utils/i18n', () => {
  beforeEach(() => {
    setLocale('de')
  })

  it('liefert bekannte Übersetzungen', () => {
    expect(t('discover.title')).toBe('Entdecken')
    expect(t('nav.search')).toBe('Suche')
  })

  it('liefert den Key zurück, wenn keine Übersetzung vorhanden ist', () => {
    expect(t('unknown.key')).toBe('unknown.key')
  })

  it('ersetzt Platzhalter in Texten', () => {
    expect(t('common.error', { code: 500 })).toBe('Etwas ist schiefgelaufen.')
  })

  it('ignoriert unbekannte Sprachen', () => {
    setLocale('fr')
    expect(getLocale()).toBe('de')
  })
})
