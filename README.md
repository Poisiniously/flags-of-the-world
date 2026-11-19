# 🌍 Flags of the World

Eine statische Website mit den Flaggen aller 197 Länder inkl. Ländernamen und Hauptstädten.

## Funktionen

- **Suche** nach Ländernamen, Hauptstädten oder Ländercode (ignoriert Groß-/Kleinschreibung, Umlaute und ß)
- **Kontinent-Filter**: Europa, Asien, Afrika, Nordamerika, Südamerika, Ozeanien
- **Sortierung**: Alphabet (A–Z / Z–A), Kontinent, Größe, Einwohnerzahl (jeweils auf- und absteigend)
- **Detailansicht** per Klick: Fläche, Einwohner, Bevölkerungsdichte
- Responsive, Dark Theme, keine Abhängigkeiten, kein Build-Schritt

## Starten

`index.html` im Browser öffnen oder lokal servieren:

```bash
python -m http.server 8000
```

Für GitHub Pages: unter *Settings → Pages* den Branch `main` mit Ordner `/ (root)` auswählen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur |
| `style.css` | Design |
| `script.js` | Suche, Filter, Sortierung, Detailansicht |
| `data.js` | Länderdaten (Code, Name, Hauptstadt, Kontinent, Fläche, Einwohner) |

## Hinweise zu den Daten

- 193 UN-Mitglieder + Vatikanstadt, Palästina, Kosovo und Taiwan = 197 Einträge
- Nordamerika enthält Mittelamerika und die Karibik
- Russland zählt zu Europa, die Türkei, Georgien, Armenien, Aserbaidschan und Kasachstan zu Asien, Zypern zu Europa
- Einwohner- und Flächenzahlen sind gerundete Näherungswerte und können in `data.js` angepasst werden
- Flaggen werden zur Laufzeit von [flagcdn.com](https://flagcdn.com) geladen
