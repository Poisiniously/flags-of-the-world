# 🌍 Flags of the World

An interactive directory of flags and country information for 197 countries. Browse flags, search for countries, compare basic statistics, or explore the world map.

## Features

- **197 countries** with their flags, names, capitals, country codes, and top-level domains.
- **Live country data** from the [REST Countries API](https://restcountries.com), including population and area.
- **Search and autocomplete** by country name, capital, country code, or top-level domain (for example, `.at`). Search is case-insensitive and handles common accent and character variations.
- **Search suggestions** show up to the first seven matching results.
- **Continent filters** for Europe, Asia, Africa, North America, South America, and Oceania.
- **Sorting** by name, continent, area, and population, in ascending or descending order.
- **Country details** including capital, continent, top-level domain, area, population, and population density.
- **Interactive world map**:
  - Color countries by continent, population, or area.
  - Use the map legend to understand the selected color scale.
  - Hover over countries on desktop to see their flag and name.
  - Select a country to open its information in the map sidebar.
  - Search for a country and jump directly to its map location.
  - Touch interaction is supported on mobile devices and tablets.
- **English and German** language support.
- **Light and dark themes** with a theme toggle.
- **Responsive layout** for desktop, tablets, and mobile devices.
- No build step required. Leaflet is loaded from a CDN.

## Data sources

- Country information: [REST Countries API](https://restcountries.com)
- Flag images: [FlagCDN](https://flagcdn.com)
- Map boundaries: [world.geo.json](https://github.com/johan/world.geo.json), delivered through [jsDelivr](https://www.jsdelivr.com/)

## How country data is loaded

The application uses the following fallback sequence:

1. A fresh browser cache (valid for 24 hours).
2. A request to the REST Countries API (with a 10-second timeout).
3. Previously cached data, if the request fails.
4. The bundled data in `data.js`, if no usable cache is available.

If loading fails, the page displays an error message with a retry button.

The interactive map also downloads its GeoJSON boundary data when the map tab is opened. It requires the map data and country data to be available.

## Run locally

Because the application loads data and map resources online, it is best opened through a local web server instead of directly as a `file://` page.

With Python installed, run this command in the project directory:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## GitHub Pages

To publish the project with GitHub Pages:

1. Open the repository's **Settings**.
2. Go to **Pages**.
3. Select the `main` branch and the `/(root)` folder as the deployment source.
4. Save the settings.

## Project structure

| File | Description |
|---|---|
| `index.html` | Main page structure and interface |
| `style.css` | Layout, responsive styles, and themes |
| `script.js` | Country data loading, caching, search, filters, sorting, and country details |
| `map.js` | Map initialization, country selection, sidebar, and map interactions |
| `data.js` | Bundled fallback data and German capital names |

## Data notes and limitations

- The directory includes the 193 United Nations member states, plus Vatican City, Palestine, Kosovo, and Taiwan.
- Dependent territories are excluded.
- North America includes Central America and the Caribbean.
- Continent assignments follow the categories provided by the REST Countries API. For example, Russia and Cyprus are assigned to Europe, while Turkey and the Caucasus countries are assigned to Asia.
- Some very small countries, such as Vatican City and Monaco, are not represented as separate areas in the simplified map boundary data. They may therefore be unavailable for selection on the map.
- The map uses external GeoJSON data and needs an internet connection to load.
