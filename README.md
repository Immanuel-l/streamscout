# StreamScout

<p align="center">
  <img src="public/favicon.svg" alt="StreamScout Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>Filme & Serien entdecken — cineastisch, schnell, auf Deutsch.</strong>
</p>

<p align="center">
  <a href="https://immanuel-l.github.io/streamscout/">Live Demo</a> · <a href="#-installation">Installation</a> · <a href="#-features">Features</a>
</p>

<p align="center">
  <a href="https://github.com/Immanuel-l/streamscout/actions/workflows/ci.yml"><img src="https://github.com/Immanuel-l/streamscout/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/Immanuel-l/streamscout/actions/workflows/deploy.yml"><img src="https://github.com/Immanuel-l/streamscout/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
</p>

---

![StreamScout Home](docs/screenshot-home-new.png)

> Cineastisches Design statt Dashboard-Optik: Dunkle Backdrops, Gradient-Overlays und Film-Atmosphäre — inspiriert von Netflix, MUBI und Apple TV+. Installierbar als Progressive Web App.

## ✨ Features

| Feature | Beschreibung |
|---|---|
| 🔍 **Suche** | Film-, Serien- und Personensuche mit Autocomplete, Suchverlauf, Sortierung und optionalem „Nur streambar“-Filter |
| 🎭 **Mood-Suche** | 10 Stimmungen (z.B. „Spannung pur", „Feel-Good", „Gehirnfutter") mit Filter- und Sortieroptionen |
| 🧭 **Discover** | Entdecke Filme und Serien nach Genre, Jahr, Bewertung, Sortierung und Streaming-Anbieter |
| 🎲 **Zufalls-Generator** | Genre, Bewertung, Sprache und Ära wählen — überraschen lassen |
| 📋 **Watchlist** | Filme und Serien merken, per Link teilen und importieren (inkl. Deduplizierung, Validierung und Import-Limit) |
| 💡 **Watchlist-Empfehlungen** | Personalisierte Film- & Serien-Tipps basierend auf deiner Watchlist (nur streambare Inhalte) |
| 📺 **Streaming-Provider** | Sieh auf einen Blick, wo Filme/Serien in Deutschland streambar sind (Abo, Leihen, Kaufen) |
| 🎬 **Detail-Seiten** | Backdrop-Hero, Cast, Trailer, Staffelübersichten mit staffelspezifischen Providern |
| 🧑 **Personen-Profile** | Biografie, Filmografie und Credits für Schauspieler und Crew |
| 🎞️ **Kino** | Aktuell im Kino laufende Filme mit „Im Kino"-Badge |
| 🇯🇵 **Anime** | Anime-Filme und -Serien entdecken (Genre Animation + japanischer Ursprung) |
| 📱 **PWA** | Installierbar als Progressive Web App auf allen Geräten |
| ♾️ **Infinity Scroll** | Nahtloses Nachladen in Discover, Mood und Suche |
| ⌨️ **Tastaturkürzel** | „/" zum Suchen, Escape zum Schließen, Skip-to-Content für Screenreader |
| ♿ **Barrierefreiheit** | Semantisches HTML, ARIA-Labels, Skip-to-Content, Keyboard-Navigation |

## 🛠️ Tech Stack

- [React 19](https://react.dev/) + JavaScript
- [Vite 7](https://vite.dev/) als Build Tool
- [React Router 7](https://reactrouter.com/) für Navigation
- [TanStack Query 5](https://tanstack.com/query) für API Calls und Caching
- [Axios](https://axios-http.com/) für HTTP Requests
- [Tailwind CSS 4](https://tailwindcss.com/) für Styling
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) für Unit Tests
- [Playwright](https://playwright.dev/) für E2E Tests
- [ESLint 9](https://eslint.org/) für Linting
- [Husky](https://typicode.github.io/husky/) für Git Hooks

## 🚀 Installation

### Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 22.x, siehe `.nvmrc`)
- [Git](https://git-scm.com/)
- Ein kostenloser [TMDB Account](https://www.themoviedb.org/signup)

### 1. Repository klonen

```bash
git clone https://github.com/Immanuel-l/streamscout.git
cd streamscout
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. TMDB API-Zugang (Read Access Token) besorgen

1. Erstelle einen kostenlosen Account auf [themoviedb.org](https://www.themoviedb.org/signup)
2. Gehe zu den [API-Einstellungen](https://www.themoviedb.org/settings/api)
3. Erzeuge den **API Read Access Token** (v4)
4. Kopiere den **API Read Access Token**

### 4. Umgebungsvariablen anlegen

Erstelle eine `.env` Datei im Projektverzeichnis:

```bash
VITE_TMDB_ACCESS_TOKEN=dein_api_read_access_token_hier
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft dann unter [http://localhost:5173](http://localhost:5173).

## 📋 Weitere Commands

| Command                | Beschreibung                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Entwicklungsserver starten                    |
| `npm run build`        | Production Build erstellen                    |
| `npm run preview`      | Production Build lokal testen                 |
| `npm run lint`         | Code-Linting ausführen                        |
| `npm test`             | Unit Tests ausführen (Vitest)                 |
| `npm run test:watch`   | Unit Tests im Watch-Modus                     |
| `npm run test:coverage`| Unit Tests mit Coverage-Report (HTML)         |
| `npm run test:e2e`     | E2E Smoke Tests ausführen (Playwright)        |
| `npm run check`        | Lint + Tests + Build (schneller lokaler Check) |
| `npm run check:ci`     | Node-Version + Lint + Coverage + Build + Audit + E2E |
| `npm audit`            | Dependency Security Check                     |

## 📁 Projektstruktur

```
src/
  api/          – Axios Instance + API Calls (tmdb.js, movies.js, tv.js, common.js)
  components/
    layout/     – Header, Footer, Layout-Wrapper
    common/     – MediaCard, MediaRow, SearchBar, ProviderFilter, Toast, ErrorBox, …
    detail/     – RatingRing, CastList, TrailerSection, ProviderList, DetailSkeleton
    search/     – SearchBar, PersonCard
    home/       – WatchlistRecommendations
  pages/        – Home, Search, Discover, Mood, Kino, Anime, Random,
                  MovieDetail, TvDetail, PersonDetail, Watchlist, NotFound
  hooks/        – useMovies, useTv, usePerson, useProviders, useWatchlist,
                  useWatchlistProviders, useWatchlistRecommendations,
                  useInfiniteScroll, useDebounce, usePersistedState,
                  useDocumentTitle, useIsTouch
  utils/        – Helpers, Constants, Mood-Mappings (10 Stimmungen)
  test/         – Test-Setup (Vitest + Testing Library)
e2e/            – Playwright Smoke Tests (15 Tests)
public/         – PWA-Manifest, Icons, Social-Preview-Bilder
.github/        – CI/CD Workflows (Lint, Test, Build, Deploy)
```

## 🧪 Testing

**Unit Tests** (Vitest + Testing Library): Stand 12.03.2026: 59 Test-Dateien mit 401 Tests (vor dem Qualitätssprint: 366 Tests).

```bash
npm test                 # Tests einmalig ausführen
npm run test:coverage    # Mit Coverage-Report
```

**E2E Tests** (Playwright): Stand 12.03.2026: 15 Smoke/A11y-/Flow-Tests fuer Navigation, Suche, Discover, Presets und Watchlist.

```bash
npm run test:e2e         # Playwright Tests (startet Preview-Server automatisch)
```

## 🔒 Code-Qualität

- **Husky Git Hooks**: Pre-commit (Lint), Pre-push (`npm run check:ci` mit Node-Version, Lint, Coverage-Gate, Build, Audit, E2E)
- **ESLint 9**: React Hooks und React Refresh Plugins
- **CI Pipeline**: Automatische Prüfung bei jedem Push und PR auf `master`
- `npm run check:ci` für denselben Gate-Flow wie in GitHub Actions

## 🚢 Deployment

Die App wird automatisch via GitHub Actions auf [GitHub Pages](https://immanuel-l.github.io/streamscout/) deployed. Bei jedem Push auf `master` läuft die CI-Pipeline (Lint, Tests, Build) und anschließend das Deployment.

Für das Deployment wird der `VITE_TMDB_ACCESS_TOKEN` als GitHub Secret benötigt.

## 📄 Lizenz & Attribution

Dieses Projekt nutzt Daten von [The Movie Database (TMDB)](https://www.themoviedb.org/) und [JustWatch](https://www.justwatch.com/) (Streaming-Verfügbarkeit). TMDB und JustWatch sind nicht verantwortlich für die Inhalte dieser App.






