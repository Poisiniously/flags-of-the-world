# 🌍 Flags of the World

Website mit den Flaggen aller 197 Länder inkl. Ländernamen, Hauptstädten und Domain-Endungen. Die Daten werden live online geladen.

## Funktionen

- **Live-Daten** von der [REST Countries API](https://restcountries.com) (Einwohner, Fläche, Domain-Endung, deutsche Ländernamen)
- **Suche** nach Land, Hauptstadt, Ländercode oder Domain-Endung (z. B. `.at`), ignoriert Groß-/Kleinschreibung, Umlaute und ß
- **Kontinent-Filter**: Europa, Asien, Afrika, Nordamerika, Südamerika, Ozeanien
- **Sortierung**: Alphabet (A–Z / Z–A), Kontinent, Größe, Einwohnerzahl (jeweils auf- und absteigend)
- **Detailansicht** per Klick: Fläche, Einwohner, Bevölkerungsdichte, Domain-Endung
- Responsive, Dark Theme, keine Abhängigkeiten, kein Build-Schritt

## Wie die Daten geladen werden

1. Frischer Cache im Browser (24 Stunden) → kein Netzwerkabruf
2. Sonst Abruf der REST Countries API (Timeout 10 s)
3. Schlägt das fehl: älterer Cache, und wenn keiner da ist, die mitgelieferten Daten aus `data.js`

Bei einem Fehler erscheint ein Hinweis mit Button „Erneut versuchen".

## Starten

Wegen des API-Abrufs am besten über einen kleinen Webserver öffnen:

```bash
python -m http.server 8000
```

Für GitHub Pages: unter *Settings → Pages* den Branch `main` mit Ordner `/ (root)` auswählen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenstruktur |
| `style.css` | Design |
| `script.js` | Datenabruf, Cache, Suche, Filter, Sortierung, Detailansicht |
| `data.js` | Offline-Fallback und deutsche Hauptstadtnamen (die API liefert Hauptstädte nur auf Englisch) |

## Hinweise zu den Daten

- Angezeigt werden die 193 UN-Mitglieder plus Vatikanstadt, Palästina, Kosovo und Taiwan; abhängige Gebiete werden herausgefiltert
- Nordamerika enthält Mittelamerika und die Karibik
- Die Kontinente richten sich nach der Einteilung der API (z. B. Russland und Zypern in Europa, Türkei und Kaukasus-Staaten in Asien)
- Flaggen werden von [flagcdn.com](https://flagcdn.com) geladen
