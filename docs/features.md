# Features

## 1. Startseite
Trending Filme und Serien der Woche als horizontale Scroll-Reihen.

## 2. Suche
Kombinierte Film- und Seriensuche (/search/multi) mit Debounced Input und Autocomplete-Dropdown mit Poster-Thumbnails.

## 3. Discover
Filter nach Genre, Jahr, Bewertung, Streaming-Anbieter. Toggle für Filme/Serien. Nutzt /discover/movie und /discover/tv. Infinity Scroll via IntersectionObserver.

## 4. Detail-Seite Filme
Poster, Backdrop als Hero, Beschreibung, Cast, Bewertung, Laufzeit, Genres, Streaming-Provider für DE, ähnliche Filme.

## 5. Detail-Seite Serien
Wie Filme, plus Staffel-Übersicht, Episoden-Anzahl, Status (laufend/abgeschlossen), Episoden-Liste pro Staffel.

## 6. Streaming-Provider Anzeige
Zeigt für jeden Film/jede Serie an, wo er/sie in Deutschland verfügbar ist (Netflix, Disney+, Amazon etc.) mit Provider-Logos. Aufgeteilt in Abo, Leihen, Kaufen.

## 7. Mood-basierte Suche
10 vordefinierte Stimmungen die auf Genre/Rating-Kombinationen gemappt werden (src/utils/moods.js). Toggle für Filme/Serien, Mischen-Button für zufällige Startseite, Infinity Scroll.
- Leichte Kost, Spannung pur, Zum Heulen schön, Familienabend, Gehirnfutter
- Action & Abenteuer, Sci-Fi & Fantasy, Horror & Grusel, Feel-Good, Historisch

## 8. Zufalls-Generator
Genre wählen, Film oder Serie, optional Mindestbewertung, Button drücken, zufälliges Ergebnis bekommen. Löst das "Paradox of Choice" Problem.

## 9. Watchlist
Filme und Serien merken (localStorage). Getrennt oder kombiniert anzeigbar. Einfaches Hinzufügen/Entfernen über Icon auf der MediaCard.

## 10. Streaming-Provider Filterung
Ergebnisse auf ausgewählte Provider eingegrenzt: Netflix, Amazon Prime Video, Disney+, WOW, Apple TV+, Paramount+, RTL+. Gilt für Home, Suche, Discover, Mood und Zufall.
