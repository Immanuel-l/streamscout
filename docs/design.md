# Design-Richtlinien

## Grundrichtung

Cinematic, dunkel, immersiv. Premium-Streaming-App Feeling, kein generisches Dashboard.

## Theme

- Dark Mode als Standard
- Basis: Tiefes Schwarz/Dunkelgrau
- Markanter Akzent-Farbton (warmes Amber/Gold oder kühles Electric Blue)
- CSS Custom Properties für Konsistenz

## Typografie

- Keine generischen Fonts (kein Inter, Roboto, Arial, System-Fonts)
- Markante Display-Font für Headlines
- Gut lesbare Body-Font
- Über Google Fonts einbinden

## Bilder

- TMDB Backdrops und Poster großzügig einsetzen
- Hero-Sections mit Backdrop-Bildern
- Gradient-Overlays für Textlesbarkeit über Bildern

## Motion

- Subtile Hover-Animationen (Scale, Opacity)
- Staggered Reveals beim Laden von Karten-Grids (animation-delay)
- CSS Transitions bevorzugen
- Framer Motion nur für komplexere Animationen

## Layout

- Mobile First, Responsive
- Horizontale Scroll-Reihen für Kategorien (wie bei Streaming-Apps)
- Grid-Layouts für Suchergebnisse
- Großzügige Detail-Seiten mit Backdrop als Hero

## Komponenten-Specs

### MediaCard
- Poster mit Hover-Effekt (leichter Scale + Overlay mit Kurzinfo)
- Bewertung als visuelles Element (nicht nur Zahl)
- Funktioniert für Filme und Serien gleichermaßen

### ProviderBadge
- Runde Logos der Streaming-Dienste
- Einheitliche Größe, erkennbar

### SearchBar
- Prominent platziert
- Autocomplete-Dropdown mit Poster-Thumbnails

### FilterBar
- Chips/Tags für aktive Filter
- Visuell klar welche Filter aktiv sind

### Detail Hero
- Full-Width Backdrop mit Gradient
- Wichtigste Infos darüber (Titel, Jahr, Bewertung, Genres, Provider)

## Verbotene Muster

- Keine generischen AI-Dashboard Ästhetik
- Keine lila Gradients auf weißem Hintergrund
- Keine Cookie-Cutter Layouts
- Keine überladenen Interfaces
