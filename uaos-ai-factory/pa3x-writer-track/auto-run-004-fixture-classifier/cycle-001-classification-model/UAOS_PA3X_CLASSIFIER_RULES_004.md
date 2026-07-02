# UAOS PA3X Classifier Rules 004

## Reihenfolge
1. Pfadrolle prüfen: SET, STYLE, PAD, PERFORM, GLOBAL, SONGBOOK.
2. Dateiendung prüfen.
3. Header-Signatur `KORF` nur als Container-Hinweis verwenden.
4. Unbekannte Dateien als `unknown` markieren.

## Grenzen
- Es werden keine proprietären Inhalte dekodiert.
- Es werden keine Samples extrahiert oder kopiert.
- Es werden keine nativen Keyboard-Dateien erzeugt.
