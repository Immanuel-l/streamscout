Führe einen vollständigen Security-Check für das Projekt durch.

Lies zuerst die Checkliste in `docs/security.md` und arbeite dann jeden Punkt ab:

1. Führe `npm audit` aus und berichte über Findings
2. Suche nach hardcoded Secrets mit den grep-Commands aus der Checkliste
3. Prüfe auf XSS-Anfälligkeiten (dangerouslySetInnerHTML, innerHTML)
4. Prüfe ob Authorization Header nur an api.themoviedb.org gesendet wird
5. Erstelle einen Production Build und prüfe ob Secrets im Output landen
6. Prüfe Error Handling in API Calls

Erstelle am Ende einen kurzen Report mit:
- Status jeder Prüfung (bestanden/nicht bestanden)
- Gefundene Probleme mit Schweregrad (low/medium/high/critical)
- Konkrete Vorschläge zum Fixen
