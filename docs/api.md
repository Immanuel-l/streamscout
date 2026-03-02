# TMDB API Referenz

## Authentifizierung

Bearer Token (API Read Access Token) im Authorization Header:

```js
const options = {
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`,
  },
};
```

## Endpoints

### Suche
- `GET /search/movie?query={q}&language=de-DE` (Filmsuche)
- `GET /search/tv?query={q}&language=de-DE` (Seriensuche)
- `GET /search/multi?query={q}&language=de-DE` (Kombiniert)

### Discover (Filtern)
- `GET /discover/movie` (Filme nach Genre, Jahr, Bewertung, Provider filtern)
- `GET /discover/tv` (Serien nach Genre, Jahr, Bewertung, Provider filtern)
- Wichtige Parameter: `with_genres`, `primary_release_year`, `vote_average.gte`, `with_watch_providers`, `watch_region=DE`

### Trending
- `GET /trending/movie/week`
- `GET /trending/tv/week`
- `GET /trending/all/week`

### Details
- `GET /movie/{id}?language=de-DE` (Film-Details)
- `GET /tv/{id}?language=de-DE` (Serien-Details inkl. Staffeln)
- `GET /tv/{id}/season/{season_number}?language=de-DE` (Staffel mit Episoden)

### Streaming-Verfügbarkeit
- `GET /movie/{id}/watch/providers` (Film)
- `GET /tv/{id}/watch/providers` (Serie)
- `GET /tv/{id}/season/{season_number}/watch/providers` (Staffel)
- Ergebnis filtern nach `results.DE`
- Aufgeteilt in: `flatrate` (Abo), `rent` (Leihen), `buy` (Kaufen)
- Daten stammen von JustWatch

### Genres
- `GET /genre/movie/list?language=de-DE`
- `GET /genre/tv/list?language=de-DE`

### Ähnliche Inhalte
- `GET /movie/{id}/similar`
- `GET /movie/{id}/recommendations`
- `GET /tv/{id}/similar`
- `GET /tv/{id}/recommendations`

### Provider-Liste
- `GET /watch/providers/movie?watch_region=DE`
- `GET /watch/providers/tv?watch_region=DE`

## Bilder

Base URL: `https://image.tmdb.org/t/p/{size}{path}`

Poster-Größen: w185, w342, w500, w780, original
Backdrop-Größen: w780, w1280, original
