# Design-Richtlinien

> Dieses Dokument definiert die verbindliche Ästhetik für StreamScout.
> Es ergänzt das `frontend-design` Plugin — das Plugin liefert allgemeine Design-Qualität,
> dieses Dokument gibt die projektspezifische Richtung vor. Bei Konflikten gilt diese Datei.

## Grundrichtung

Cinematic, dunkel, immersiv. Premium-Streaming-App Feeling, kein generisches Dashboard.
Denke an die Ästhetik von Netflix, MUBI oder Apple TV+ — nicht an ein Admin-Panel.

**Leitfrage bei jeder Komponente:** Fühlt sich das an wie eine Kino-Erfahrung oder wie ein Formular?

## Theme

- Dark Mode als Standard — kein Light Mode
- Basis: Tiefes Schwarz (#0a0a0a bis #141414) / Dunkelgrau (#1a1a1a bis #262626)
- Markanter Akzent-Farbton (warmes Amber/Gold oder kühles Electric Blue)
- Dominante dunkle Flächen mit punktuellen, scharfen Akzenten — keine gleichmäßig verteilten Farben
- Tailwind Custom Colors und CSS Custom Properties für Konsistenz
- Farbpalette muss über alle Komponenten hinweg kohärent sein

## Typografie

- Keine generischen Fonts (kein Inter, Roboto, Arial, Space Grotesk, System-Fonts)
- Markante, charaktervolle Display-Font für Headlines — sie soll Wiedererkennungswert schaffen
- Gut lesbare Body-Font die zur Display-Font passt (bewusstes Pairing)
- Über Google Fonts einbinden
- Typografie-Hierarchie: Headlines müssen sofort ins Auge fallen, Body-Text muss zurücktreten

## Bilder & Visuelle Tiefe

- TMDB Backdrops und Poster großzügig einsetzen — Bilder sind das Herz der App
- Hero-Sections mit Backdrop-Bildern
- Gradient-Overlays für Textlesbarkeit über Bildern (mehrstufige Gradients, nicht nur ein einfacher Fade)
- Atmosphäre durch Tiefe erzeugen: layered Transparencies, subtile Schatten, Vignetten
- Subtile Grain-/Noise-Texturen für filmisches Feeling wo passend
- Keine flachen Solid-Color-Hintergründe wenn ein Backdrop verfügbar ist

## Motion & Interaktion

- Subtile Hover-Animationen (Scale, Opacity, Glow)
- Staggered Reveals beim Laden von Karten-Grids (animation-delay) — der wichtigste Motion-Moment
- CSS Transitions bevorzugen, Framer Motion nur für komplexere Animationen
- High-Impact Momente priorisieren: ein gut orchestrierter Page-Load mit gestaffelten Reveals wirkt stärker als viele kleine Micro-Interactions
- Hover-States die überraschen: Overlay-Infos, sanftes Leuchten, leichte Perspektiv-Shifts
- Scroll-basierte Effekte sparsam aber gezielt einsetzen

## Layout & Spatial Composition

- Mobile First, Responsive
- Horizontale Scroll-Reihen für Kategorien (wie bei Streaming-Apps)
- Grid-Layouts für Suchergebnisse
- Großzügige Detail-Seiten mit Backdrop als Hero
- Bewusster Umgang mit negativem Raum — großzügig atmen lassen
- Asymmetrische Akzente wo sie Spannung erzeugen (z.B. off-center Hero-Text)
- Überlappende Elemente für Tiefe (z.B. Poster die über den Hero-Bereich ragen)

## Komponenten-Specs

### MediaCard
- Poster mit Hover-Effekt (leichter Scale + Overlay mit Kurzinfo)
- Bewertung als visuelles Element (nicht nur Zahl)
- Funktioniert für Filme und Serien gleichermaßen
- Hover-State soll sich wie ein "Spotlight" anfühlen

### ProviderBadge
- Runde Logos der Streaming-Dienste
- Einheitliche Größe, erkennbar
- Subtiler Glow oder Ring im Akzentfarbton bei Hover

### SearchBar
- Prominent platziert
- Autocomplete-Dropdown mit Poster-Thumbnails
- Soll cinematic wirken, nicht wie ein Standard-Input

### FilterBar
- Chips/Tags für aktive Filter
- Visuell klar welche Filter aktiv sind (Akzentfarbe, nicht nur Bold)
- Smooth Transitions beim Aktivieren/Deaktivieren

### Detail Hero
- Full-Width Backdrop mit mehrstufigem Gradient
- Wichtigste Infos darüber (Titel, Jahr, Bewertung, Genres, Provider)
- Poster-Overlap für Tiefenwirkung
- Ausreichend Breathing Room zwischen den Info-Elementen

## Verbotene Muster

- Keine generische AI-Dashboard Ästhetik
- Keine lila Gradients auf weißem Hintergrund
- Keine Cookie-Cutter Layouts
- Keine überladenen Interfaces
- Keine überstrapazierten Font-Familien (Inter, Roboto, Arial, Space Grotesk, System-Fonts)
- Keine gleichmäßig verteilten, zaghaften Farbpaletten — dominant + Akzent
- Keine flachen, leblosen Hintergründe wo Atmosphäre möglich wäre
- Keine vorhersehbaren Standard-Komponenten ohne kontextspezifischen Charakter
