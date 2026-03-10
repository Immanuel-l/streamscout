---
description: CI-Check nach Code-Änderungen — immer am Ende jeder Implementierung ausführen
---

# CI-Check Workflow

Nach jeder Code-Änderung (bevor der User committet):

// turbo
1. ESLint über alle geänderten Dateien laufen lassen:
```
npx eslint src/ 2>&1
```

2. Falls Fehler: sofort fixen, dann erneut prüfen.

// turbo
3. Build testen (optional, bei größeren Änderungen):
```
npx vite build 2>&1
```

4. Erst wenn 0 Errors + 0 Warnings: dem User Bescheid geben, dass alles bereit zum Committen ist.
