# Fortschritt

## Erledigt

- [x] Schritt 1: Grundgerüst (Routing, Tailwind, API Layer)
- [x] Schritt 2: Layout (Header, Footer, Dark Theme)
- [x] Schritt 3: Home / Trending
- [x] Schritt 4: Suche
- [x] Schritt 5: Film-Detailseite
- [x] Schritt 6: Serien-Detailseite
- [x] Schritt 7: Discover
- [x] Schritt 8: Watchlist
- [x] Schritt 9: Zufalls-Generator
- [x] Schritt 10: Mood-Suche
- [x] Schritt 11: Feinschliff
- [x] Schritt 12: Provider-Filterung (Netflix, Prime, Disney+ etc.)
- [x] Schritt 13: MediaCard-Verbesserung (Sichtbarkeit, Provider-Anzeige, klickbar in Detailansicht)
- [x] Schritt 14: Ähnliche Filme/Serien besser gefiltert
- [x] Schritt 15: Staffel-Streaming-Verfügbarkeit
- [x] Schritt 16: Homepage überarbeitet
- [x] Schritt 17: Mood-Bereich erweitert (Genre-Fix, 5 neue Moods, Mischen-Button)
- [x] Schritt 18: Infinity Scroll bei Moods + Discover
- [x] Schritt 19: MediaCard: Film/Serie-Badge oben links (wie bei der Suche) überall anzeigen
- [x] Schritt 20: Filme im Kino auch in der MoveDetail auch kennzeichnen
- [x] Schritt 21: Mood: Kurze Beschreibung anzeigen, wonach gefiltert wird
- [x] Schritt 21: Suche überarbeitet
- [x] Schritt 22: Kinofilm-Section / Anime-Section (Crunchyroll)
- [x] Schritt 23: Filter einstellungen auch nach einen klick gespeichert
- [x] Schritt 24: Moods: jetzt mit Filtern
- [x] Schritt 25: Suche Verbessert
- [x] Schritt 26: Filter und States Verbessert
- [x] Schritt 27: API-Last reduziert
- [x] Schritt 28: Tests und CI hinzugefügt
- [x] Schritt 29: Loading und Error Handling poliert
- [x] Schritt 30: SEO, PWA und Präsentation nach außen
- [x] Schritt 31: PWA Icons und Social-Preview-Bilder hinzugefügt
- [x] Schritt 32: Watchlist Cards verbessert
- [x] Schritt 33: Watchlist jetzt durch link teilbar und importierbar
- [x] Schritt 34: Watchlist mit Provider Filterung
- [x] Schritt 35: Crunchyroll zu den Providern hinzugefügt
- [x] Schritt 36: Personalisierte Watchlist-Empfehlungen auf der Startseite und Watchlist-Seite (nur streambare Inhalte)
- [x] Schritt 37: Streaming-Provider auf mobilen Geräten
- [x] Schritt 38: Design Überarbeitung
- [x] Schritt 39: useInfiniteScroll Duplikate entfernt, Env-Validierung, Accessibility-Verbesserungen, API-Error-Handling
- [x] Schritt 40: README.md verbessert
- [x] Schritt 41: CI Pipeline Fix
- [x] Schritt 42: Bug Fixes und Verbesserungen
- [x] Schritt 43: E2E-Tests mit Playwright, erweiterte Unit Tests und Coverage-Reports

## Aktueller Stand

### Seiten (12)
- Home (Trending, Populär, Top-Rated, Neu, Mood-Shortcuts, Anime, Watchlist-Empfehlungen)
- Search (Multi-Suche: Filme, Serien, Personen + Suchverlauf + Provider-Filter)
- Discover (Genre, Jahr, Bewertung, Sortierung, Provider-Filter + Infinity Scroll)
- Mood (10 Stimmungen mit Filtern und Sortierung + Infinity Scroll)
- Kino (Aktuell im Kino laufende Filme)
- Anime (Anime-Filme und -Serien)
- Random (Zufallsgenerator mit Genre, Bewertung, Sprache, Ära, Provider)
- MovieDetail (Backdrop-Hero, Cast, Trailer, Provider, ähnliche Filme, „Im Kino"-Badge)
- TvDetail (wie MovieDetail + Staffelübersicht mit staffelspezifischen Providern)
- PersonDetail (Biografie, Filmografie, Cast- und Crew-Credits)
- Watchlist (Tabs, Provider-Filter, Teilen/Importieren per Link, Empfehlungen)
- NotFound (404-Seite)

### Hooks (12)
- useMovies, useTv, usePerson (Daten-Fetching)
- useProviders, useWatchlistProviders (Provider-Daten)
- useWatchlist (Watchlist-Verwaltung mit localStorage + Teilen/Import)
- useWatchlistRecommendations (Personalisierte Empfehlungen)
- useInfiniteScroll (IntersectionObserver, 600px rootMargin)
- useDebounce (300ms Input-Debouncing)
- usePersistedState (Session Storage Persistenz)
- useDocumentTitle (Dynamischer Seitentitel)
- useIsTouch (Touch-Device-Erkennung)

### Komponenten (28)
- Layout: Header (Skip-to-Content, Mobile-Menü), Footer (TMDB/JustWatch-Attribution), Layout
- Common: MediaCard, MediaRow, SearchBar, ProviderFilter, Select, WatchlistButton, ErrorBox, ErrorBoundary, Toast, PageLoader, GridSkeleton, ScrollToTop
- Detail: RatingRing, CastList, TrailerSection, ProviderList, DetailSkeleton
- Search: SearchBar, PersonCard
- Home: WatchlistRecommendations

### Testing
- 57 Unit-Test-Dateien mit 361 Tests (Vitest + Testing Library)
- 14 E2E Smoke/A11y/Flow-Tests (Playwright)
- Coverage-Reports (v8, HTML-Output)

### Infrastruktur
- CI/CD: GitHub Actions (Lint → Test → Build → Deploy auf GitHub Pages)
- Git Hooks: Husky (Pre-commit: Lint, Pre-push: `npm run check:ci`)
- PWA: Manifest, Icons (192px, 512px maskable), Social-Preview-Bilder
- Accessibility: Skip-to-Content, ARIA-Labels, Keyboard-Shortcuts ("/", Escape)
- Code Splitting: Lazy-Loading aller Seiten
- Caching: TanStack Query (30min staleTime)

## Offen

- Keine offenen Aufgaben
