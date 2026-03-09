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

## Offen

Merkliste Cards passen nicht zum restlichen Projekt

 Was noch fehlt für eine vollständig installierbare PWA:
  - PNG Icons (192x192 + 512x512) — Chrome verlangt PNGs für den Install-Prompt. Du kannst die aus dem SVG generieren (z.B. auf realfavicongenerator.net oder mit sharp in Node)
  - og:image / twitter:image — Ein Screenshot oder Social-Preview-Bild. Ohne das zeigen Social-Media-Plattformen nur Text beim Teilen
  - Service Worker — Für Offline-Caching (vite-plugin-pwa), wobei das bei einer 100% API-abhängigen App wenig Mehrwert bringt

  Soll ich die PNG-Icons generieren (braucht eine zusätzliche npm-Dependency wie sharp) oder lieber die README mit Screenshots/Feature-Highlights aufhübschen?