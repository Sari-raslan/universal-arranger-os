# UAOS PA3X Read-only Parser Architecture 004

Die Architektur trennt Inventar, Klassifikation und spätere Parser strikt von jeder Writer-Ausgabe.

## Datenfluss
Run 003 JSON -> Metadata Loader -> Classifier -> Header Boundary Probe -> Readiness Report.

## Parser-Ansatz
Der nächste Parser darf zunächst nur Metadaten, Größe, Pfad, Hash und die ersten 32 Bytes verwenden. Tieferes Lesen einzelner Dateien bleibt eine neue Owner-Entscheidung.
