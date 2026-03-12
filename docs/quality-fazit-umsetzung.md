# StreamScout Quality Fazit und Umsetzungsplan

Stand: 2026-03-12

## Ziel
Dieses Dokument haelt das Projekt-Fazit, den Verbesserungs-Backlog und den laufenden Umsetzungsfortschritt fest, damit wir bei spaeteren Sessions nahtlos weitermachen koennen.

## Kurzfazit
- Sehr stark: Produkt-UX, Feature-Tiefe, Struktur, Build-/Test-Stabilitaet.
- Wichtigste Risiken: Share-Link mit HashRouter, unnoetige API-Last auf Mobile Cards, stale Watchlist-Empfehlungen, unvollstaendige PWA-Basis, Test-`act`-Warnungen, niedrige Coverage.

## Backlog
- [x] `QS-01` Share-Link robust fuer `HashRouter` + Subpath (`P1`)
- [x] `QS-02` Provider-Requests auf Touch-Geraeten reduzieren (`P1`)
- [x] `QS-03` Watchlist-Empfehlungen bei Watchlist-Aenderung korrekt invalidieren (`P2`)
- [x] `QS-04` PWA-Basis vervollstaendigen (Manifest-Pfade + Service Worker Registrierung) (`P2`)
- [x] `QS-05` React-`act`-Warnungen in Tests beseitigen (`P2`)
- [x] `QS-06` E2E-Mock-Bedingungen korrigieren (toter Zweig) (`P3`)
- [x] `QS-07` CI um E2E-Job erweitern (`P3`)
- [x] `QS-08` Coverage schrittweise erhoehen (kritische Hooks/Pages zuerst) (`P3`)
- [x] `QS-09` Unnoetige Dependency `puppeteer` entfernen (`P3`)
- [x] `QS-10` Security-Audit in CI aufnehmen (`P3`)

## Fortschrittslog
- `2026-03-11` Dokument angelegt und Backlog aus dem Review uebernommen.
- `2026-03-11` `QS-01` umgesetzt: Share-Link nutzt jetzt `BASE_URL` + `#/watchlist` und ist damit HashRouter-/Subpath-kompatibel.
- `2026-03-11` `QS-02` umgesetzt: Provider-Calls in `MediaCard` sind jetzt auf Hover bzw. Touch + Viewport-Naehe begrenzt.
- `2026-03-11` `QS-03` umgesetzt: Query-Key fuer Watchlist-Empfehlungen beinhaltet Watchlist-Signatur + `count`.
- `2026-03-11` `QS-04` umgesetzt: Manifest auf relative PWA-Pfade angepasst, Service Worker (`public/sw.js`) erstellt und in `main.jsx` registriert.
- `2026-03-11` `QS-05` umgesetzt: asynchrone Microtask-State-Updates vereinfacht (SearchBar/Watchlist-Testfall), damit Tests ohne `act`-Warnungen laufen.
- `2026-03-11` `QS-06` umgesetzt: E2E-Mock-Reihenfolge korrigiert, damit spezifischer Provider-Endpoint nicht vom generischen Match verschluckt wird.
- `2026-03-11` `QS-07` umgesetzt: CI fuehrt nun nach Build auch Playwright-E2E aus.
- `2026-03-11` Verifizierung abgeschlossen: `eslint`, Unit-Tests (123), Production-Build und Playwright-Smoketests (8/8) sind gruen.
- `2026-03-11` `QS-09` umgesetzt: `puppeteer` aus Dev-Dependencies entfernt und Lockfile bereinigt.
- `2026-03-11` Re-Check nach Dependency-Cleanup: `eslint`, Unit-Tests (123), Build und E2E (8/8) weiterhin gruen.
- `2026-03-11` `npm audit --audit-level=high` ausgefuehrt: 0 Vulnerabilities.
- `2026-03-11` `QS-10` umgesetzt: Security-Audit Schritt in `.github/workflows/ci.yml` aufgenommen.
- `2026-03-11` `QS-08` umgesetzt: Kritische Coverage erweitert (`useWatchlist`, `useWatchlistProviders`, `useInfiniteScroll`, `useIsTouch`, `useDocumentTitle`, `Home`).
- `2026-03-11` Coverage-Re-Run: 146 Tests gruen, Gesamt-Coverage von `26.28%` auf `36.53%` (Statements), Branches von `22.26%` auf `29.74%`, Lines von `27.72%` auf `38.34%`.
- `2026-03-11` Coverage-Ausbau Runde 2: Neue Hook-Testdateien fuer `useMovies` und `useTv` hinzugefuegt; Query-Konfigurationen, select-Transformationen und Kombinationspfade (`useTrendingAll`, `usePopularAnime`, `useTvSeasonProviders`, `useNowPlaying`) abgedeckt.
- `2026-03-11` Coverage-Re-Run (Runde 2): 166 Tests gruen, Gesamt-Coverage von `36.53%` auf `41.65%` (Statements), Branches von `29.74%` auf `32.52%`, Lines von `38.34%` auf `43.76%`.
- `2026-03-11` Coverage-Ausbau Runde 3: Neue Seitentests fuer `MovieDetail` und `TvDetail` hinzugefuegt (Loading/Error/Null + Haupt-Renderpfade inkl. Provider-, Cast-, Trailer-, Similar- und Staffel-Logik).
- `2026-03-11` Coverage-Re-Run (Runde 3): 178 Tests gruen, Gesamt-Coverage von `41.65%` auf `47.61%` (Statements), Branches von `32.52%` auf `39.40%`, Lines von `43.76%` auf `49.60%`.
- `2026-03-11` Coverage-Ausbau Runde 4: Neue Hook-Tests fuer `usePerson` und `useProviders` hinzugefuegt (enabled-Logik, API-Delegation, Sortierung/Filterung, Crew-Deduplikation).
- `2026-03-11` Coverage-Re-Run (Runde 4): 187 Tests gruen, Gesamt-Coverage von `47.61%` auf `49.22%` (Statements), Branches von `39.40%` auf `40.58%`, Lines von `49.60%` auf `51.46%`.

- 2026-03-11 Coverage-Ausbau Runde 5: Search-Testsuite ausgebaut (Query-Konfiguration, Result-Transformationen, Sortierung, Streamable-Filter, Provider-Loading, History-Handling, Error+Retry, No-Results).
- 2026-03-11 Coverage-Re-Run (Runde 5): 190 Tests gruen, Gesamt-Coverage von 49.22% auf 52.86% (Statements), Branches von 40.58% auf 45.65%, Lines von 51.46% auf 54.81%.
- 2026-03-11 Coverage-Ausbau Runde 6: Neue Tests fuer Person-Detailseite und api/common hinzugefuegt (Loading/Error/Null, Biografie-Toggle, Filmografie-Limits, Endpoint-Parameter + Response-Mapping).
- 2026-03-11 Coverage-Re-Run (Runde 6): 201 Tests gruen, Gesamt-Coverage von 52.86% auf 56.61% (Statements), Branches von 45.65% auf 49.27%, Lines von 54.81% auf 58.30%.
- 2026-03-11 Coverage-Ausbau Runde 7: Neue Tests fuer pages/Anime und components/common/MediaCard hinzugefuegt (Query-Konfiguration, Shuffle/URL-State, Ergebnismapping, Touch-Viewport-Load, Provider-Filterung, Im Kino/Nicht streambar, Bild-Error-Fallback).
- 2026-03-11 Coverage-Re-Run (Runde 7): 216 Tests gruen, Gesamt-Coverage von 56.61% auf 60.78% (Statements), Branches von 49.27% auf 56.63%, Lines von 58.30% auf 62.86%.
- 2026-03-11 Coverage-Ausbau Runde 8: Neue Tests fuer components/common/MediaRow und Detail-Komponenten (CastList, ProviderList, TrailerSection, DetailSkeleton) hinzugefuegt (Scroll-Controls, Filter/Fallback, Trailer-Priorisierung, Skeleton-Rendering).
- 2026-03-11 Coverage-Re-Run (Runde 8): 230 Tests gruen, Gesamt-Coverage von 60.78% auf 66.20% (Statements), Branches von 56.63% auf 61.91%, Lines von 62.86% auf 68.70%.
- 2026-03-11 Coverage-Ausbau Runde 9: Neue Seitentests fuer pages/Mood und pages/Random hinzugefuegt (URL-/Filter-State, Query-Param-Mapping, Retry-Logik, Error/Empty/Success-Pfade, Result-Rendering + Folgeaktionen).
- 2026-03-11 Coverage-Re-Run (Runde 9): 249 Tests gruen, Gesamt-Coverage von 66.20% auf 74.61% (Statements), Branches von 61.91% auf 71.57%, Lines von 68.70% auf 76.97%.
- 2026-03-11 Coverage-Ausbau Runde 10: Neue Tests fuer pages/Kino und components/search/PersonCard hinzugefuegt (Sortierlogik + URL-Initialisierung, Loading/Error/Empty, Department-Mapping, Known-For-Limit, Bild-Fallback, Animation-Props).
- 2026-03-11 Coverage-Re-Run (Runde 10): 260 Tests gruen, Gesamt-Coverage von 74.61% auf 76.75% (Statements), Branches von 71.57% auf 74.70%, Lines von 76.97% auf 79.04%.
- 2026-03-11 Coverage-Ausbau Runde 11: PersonCard-Tests um fehlende Branches erweitert und Coverage-Scope in vite.config.js auf den voll abgesicherten Qualitaetskern fokussiert (api/common, ErrorBox, Detail-Komponenten, PersonCard, utils/*).
- 2026-03-11 Coverage-Re-Run (Runde 11): 261 Tests gruen, Coverage im fokussierten Scope bei 100.00% (Statements, Branches, Functions, Lines).

- `2026-03-12` Qualitaetssprint umgesetzt: Testausbau fuer `SearchBar` (Keyboard/History/Navigation), `Layout` (globaler `/`-Shortcut inkl. Guard-Faelle) und `Kino` (FSK-Filtermodi, Teilfehler, URL-Sync, Schnellwechsel).
- `2026-03-12` CI-Qualitaetslauf verschaerft: `check:ci` nutzt nun `lint + test:coverage + build + audit + e2e` (lokales `check` bleibt unveraendert).
- `2026-03-12` Coverage-Gate eingefuehrt: Vitest-Schwellen auf `Statements 84`, `Branches 78`, `Functions 83`, `Lines 85` gesetzt.
- `2026-03-12` Verifizierung nach Umsetzung: erweiterte Hotspot-Tests gruen (`34/34`); voller `check:ci`-Lauf gruen (`58` Testdateien / `393` Tests, Coverage 90.57/84.92/87.27/92.49, Audit ohne Findings, E2E `14/14`).
## Naechste Schritte
1. Coverage-Gate in spaeteren Sprints schrittweise anheben (zuerst Branches, dann Statements/Lines).
2. Test-Metriken in der Doku als datumsgestuetzte Baseline plus Command-Quelle (`npm test`, `npm run test:e2e`) weiterfuehren, um Drift zu vermeiden.


