/**
 * Einfache i18n-Utility für StreamScout.
 * Aktuell nur Deutsch — dient als Grundlage für spätere Mehrsprachigkeit.
 */

const de = {
  // Search
  'search.placeholder': 'Film, Serie oder Person suchen...',
  'search.clear': 'Suche leeren',
  'search.history.title': 'Zuletzt gesucht',
  'search.history.clear': 'Löschen',

  // Navigation
  'nav.home': 'Home',
  'nav.search': 'Suche',
  'nav.discover': 'Entdecken',
  'nav.random': 'Zufall',
  'nav.watchlist': 'Merkliste',
  'nav.skip': 'Zum Inhalt springen',

  // Theme
  'theme.light': 'Helles Design aktivieren',
  'theme.dark': 'Dunkles Design aktivieren',

  // Media types
  'media.movie': 'Film',
  'media.tv': 'Serie',
  'media.person': 'Person',

  // Watchlist
  'watchlist.empty': 'Deine Merkliste ist leer',
  'watchlist.add': 'Zur Merkliste hinzufügen',
  'watchlist.remove': 'Von Merkliste entfernen',
  'watchlist.share': 'Link teilen',

  // Toast
  'toast.added': 'Zur Merkliste hinzugefügt',
  'toast.removed': 'Von Merkliste entfernt',
  'toast.linkCopied': 'Link kopiert! Du kannst ihn jetzt teilen.',
  'toast.copyError': 'Fehler beim Kopieren des Links',

  // Discover
  'discover.title': 'Entdecken',
  'discover.movies': 'Filme',
  'discover.tv': 'Serien',
  'discover.genre': 'Genre',
  'discover.year': 'Jahr',
  'discover.allYears': 'Alle Jahre',
  'discover.rating': 'Mindestbewertung',
  'discover.fsk': 'FSK',
  'discover.fsk.all': 'Alle',
  'discover.resetFilters': 'Filter zurücksetzen',
  'discover.noResults': 'Keine Ergebnisse',
  'discover.noResultsHint': 'Versuch andere Filter-Kombinationen.',

  // Common
  'common.scrollLeft': 'Zurück scrollen',
  'common.scrollRight': 'Weiter scrollen',
  'common.loading': 'Wird geladen...',
  'common.error': 'Etwas ist schiefgelaufen.',
  'common.retry': 'Erneut versuchen',
}

const translations = { de }

let currentLocale = 'de'

/**
 * Übersetzt einen Schlüssel in den aktuellen Sprachtext.
 * Unterstützt Platzhalter: t('key', { count: 5 }) → ersetzt {count} durch 5.
 */
export function t(key, params) {
  const dict = translations[currentLocale] || translations.de
  let text = dict[key] || key

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }

  return text
}

/**
 * Setzt die aktive Sprache.
 */
export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale
  }
}

/**
 * Gibt die aktive Sprache zurück.
 */
export function getLocale() {
  return currentLocale
}

