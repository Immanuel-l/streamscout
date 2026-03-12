# Security-Checkliste

## Grundprinzipien

- API Token ausschließlich über Umgebungsvariablen (.env)
- `.env` in `.gitignore`
- Keine sensitiven Daten in localStorage
- Alle User-Inputs sanitizen vor API Calls
- Bilder nur von `image.tmdb.org` laden
- Externe Links mit `rel="noopener noreferrer"`

## Prüfungen

### 1. Dependency Audit

```bash
npm audit
```

Bei "high" oder "critical" sofort fixen mit `npm audit fix`.

### 2. Secret Leak Check

```bash
grep -r "eyJ" src/ --include="*.js" --include="*.jsx"
grep -r "TMDB" src/ --include="*.js" --include="*.jsx" | grep -v "import.meta.env"
grep -r "console.log" src/ --include="*.js" --include="*.jsx" | grep -i "token\|key\|secret\|auth"
```

Kein Treffer = bestanden.

### 3. XSS Prevention

```bash
grep -r "dangerouslySetInnerHTML" src/ --include="*.js" --include="*.jsx"
grep -r "innerHTML" src/ --include="*.js" --include="*.jsx"
```

Kein Treffer = bestanden. Falls doch: Prüfen ob Input sanitized ist.

### 4. API Security

```bash
grep -r "Authorization" src/ --include="*.js" --include="*.jsx"
```

Auth Header darf nur an `api.themoviedb.org` gehen.

### 5. Build Check

```bash
npm run build
grep -r "eyJ" dist/ 2>/dev/null
grep -r "Bearer" dist/ --include="*.js" 2>/dev/null
```

Hinweis: TMDB Read Access Token ist im Frontend sichtbar, das ist bei TMDB akzeptabel (kostenlos, nur Lesezugriff).

### 6. Error Handling

- Error Responses fangen, keine technischen Details an den User
- Rate Limiting beachten (TMDB: ~40 Requests/10 Sekunden)

### 7. API-Last & Rate-Limit Schutz

- Provider-Verfügbarkeit zentral über Queue mit begrenzter Parallelität (4) prüfen
- Bei 429/Netzwerkfehlern kurze Retry-Backoff-Strategie anwenden
- Streambar-Prüfung in der Suche progressiv ausführen (Arbeitsfenster statt Vollscan)
- Watchlist-Empfehlungen durch Kandidatenlimit und frühes Stoppen begrenzen
- Share-Import strikt validieren (`m|t` + Zahl), deduplizieren und auf 100 Einträge deckeln
