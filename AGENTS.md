# StreamScout

Film- und Serien-Suchapp mit React + JavaScript + Vite, angebunden an die TMDB API.

## Tech Stack

- React 19 + JavaScript (kein TypeScript, kein PropTypes)
- Vite als Build Tool
- React Router (react-router-dom) für Navigation
- TanStack Query (@tanstack/react-query) für API Calls und Caching
- Axios für HTTP Requests
- Tailwind CSS für Styling (kein separates CSS)

## Wichtige Commands

- `npm run dev` (Dev Server)
- `npm run build` (Production Build)
- `npm run preview` (Build lokal testen)
- `npm test` (Tests ausführen)
- `npm run check` (Lint + Tests + Build — vollständiger CI-Check lokal)
- `npm audit` (Dependency Security Check)

## API

- Base URL: `https://api.themoviedb.org/3`
- Auth: Bearer Token im Header, Token aus `import.meta.env.VITE_TMDB_ACCESS_TOKEN`
- Immer `language=de-DE` und `region=DE` als Query Parameter
- Bilder: `https://image.tmdb.org/t/p/{size}{path}`
- Doku: https://developer.themoviedb.org/reference
- Für Details zu Endpoints siehe `docs/api.md`

## Projektstruktur

```
src/
  api/        -> Axios Instance + API Calls (tmdb.js, movies.js, tv.js, common.js)
  components/ -> UI Komponenten (layout/, common/, search/, discover/, detail/, watchlist/)
  pages/      -> Seitenkomponenten (Home, Search, Discover, Mood, MovieDetail, TvDetail, Watchlist, Random)
  hooks/      -> Custom Hooks (useMovies, useTv, useProviders, useDebounce, useWatchlist)
  utils/      -> Helpers, Constants, Mood-Mappings (moods.js: 10 Stimmungen)
```

## Konventionen

- Funktionale Komponenten, deutsche UI-Texte
- Responsive Design (Mobile First)
- API Calls immer über TanStack Query
- Filme/Serien-Komponenten nutzen generischen "media" Prop mit media_type ("movie"/"tv")
- Keine hardcoded API Tokens, alles über .env
- Externe Links immer mit `rel="noopener noreferrer"`
- Infinity Scroll in Discover + Mood: IntersectionObserver (rootMargin 600px) + useInfiniteQuery, Skeleton-Placeholders inline im Grid, `animate-fade-in` nur für erste Seite (animate={false} für nachgeladene Items)

## Weitere Dokumentation

- `docs/api.md` - Alle TMDB Endpoints und Patterns
- `docs/design.md` - Design-Richtlinien und Komponenten-Specs
- `docs/security.md` - Security-Checkliste und Prüfungen
- `docs/features.md` - Feature-Liste und Beschreibungen

## Custom Commands

- `/project:security-check` - Führt Security-Audit durch
- `/project:design-review` - Prüft UI gegen Design-Richtlinien


## Git Workflow

- Feature Branches: `feature/name` (z.B. feature/search, feature/discover)
- Commits auf Deutsch, kurz und beschreibend
- Husky Git Hooks: pre-commit (Lint), pre-push (Lint + Tests + Build)
- `npm run check` für manuellen vollständigen CI-Check