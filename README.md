# 🌍 Flags of the World

An interactive, bilingual directory of **197 countries**. Browse national flags, search country information, sort and filter the directory, or explore countries on an interactive world map.

## Features

### Country directory
- 197 entries with flags, country names, capitals, ISO country codes, and top-level domains.
- Search by country name, capital, ISO alpha-2 code, or top-level domain.
- Search is case-insensitive and normalizes common character variations (for example, accents and `ß`).
- Autocomplete suggestions while typing.
- Filter by continent: Europe, Asia, Africa, North America, South America, and Oceania.
- Sort alphabetically, by continent, area, or population.
- Country detail dialog with capital, continent, domain, area, population, and population density.

### Interactive world map
- Built with [MapLibre GL JS](https://maplibre.org/).
- Color countries by continent, population, or area.
- View a legend for the active color scale.
- Hover over countries to identify them and select them to open a details sidebar.
- Search for a country or overseas territory and jump to its location.
- **Overseas territories** (44, for example French Guiana, Greenland, Puerto Rico, Hong Kong, the Falkland Islands) are drawn with diagonal stripes: one stripe in the territory's own color and one in the color of the state it belongs to. They have their own data (capital, area, population, domain), and the sidebar links to the sovereign state, which in turn lists its territories. The territory data lives in `territories.js`; they are not part of the 197 countries in the directory.
- Supports mouse, touch, and pinch-to-zoom interactions.
- Uses Natural Earth country-boundary data, with additional handling for selected territories and overseas regions.

### Preferences and layout
- German and English interface options.
- Six color themes (dark, light, ocean, forest, sunset, high contrast); the map's ocean color follows the theme.
- Responsive layout for desktop, tablet, and mobile.
- User preferences are stored in the browser's local storage.
- No build step or package installation is required.

## Getting started

The project is a static website. You can run it locally with any static HTTP server.

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Start a local server, for example with Python:

   ```bash
   python -m http.server 8000
   ```

4. Open [http://localhost:8000](http://localhost:8000) in your browser.

Serving the files over HTTP is recommended instead of opening `index.html` directly, because the map uses JavaScript modules and external resources.

## Data sources and dependencies

| Resource | Used for |
|---|---|
| [countries.dev](https://countries.dev/) | Live country data, including names, capitals, regions, area, population, and top-level domains |
| [FlagCDN](https://flagcdn.com/) | Country flag images |
| [Natural Earth](https://www.naturalearthdata.com/) | Country boundary data used by the map |
| [MapLibre GL JS](https://maplibre.org/) | Interactive map rendering |

The map boundary data is loaded from the [Natural Earth Vector repository](https://github.com/nvkelso/natural-earth-vector). MapLibre GL JS and its CSS are loaded from the unpkg CDN.

An internet connection is required for live country data, flag images, the map library, and map boundary data. The bundled country data still allows the directory to display its basic information when the country-data API is unavailable.

## How country data is loaded

The bundled `data.js` file is the baseline dataset and offline fallback. It also supplies localized country names and German capital names. Live values from countries.dev are merged into this baseline by ISO alpha-2 country code.

On initial load, the application uses this order:

1. A valid browser cache younger than 24 hours.
2. A request to countries.dev, with a 10-second timeout.
3. Previously cached data, if the request fails.
4. The bundled `data.js` data if no usable cache is available.

The API response is checked before it is accepted. If fewer than 150 entries can be matched to the bundled country list, the response is treated as invalid and the fallback process is used. Successful live data is cached in local storage.

The map loads its GeoJSON boundary data when the map view is opened. Country records are matched to map features primarily through ISO alpha-3 codes, with additional aliases for selected map features.

## Project structure

| File | Description |
|---|---|
| `index.html` | Main page structure, directory view, map view, and country detail dialog |
| `style.css` | Layout, responsive styles, themes, and component styling |
| `script.js` | Country data loading, caching, language/theme preferences, search, filters, sorting, and country details |
| `map.js` | MapLibre setup, GeoJSON loading, country matching, map coloring, search, and map interactions |
| `data.js` | Bundled country dataset, localized names, and German capital names |

## Data scope and limitations

- The dataset contains 197 entries: the 193 United Nations member states, plus Vatican City, Palestine, Kosovo, and Taiwan.
- Dependent territories are not included as separate directory entries.
- North America includes Central America and the Caribbean.
- Continent assignments are based on the regions returned by countries.dev, with local fallback values where needed.
- Some very small countries, such as Vatican City and Monaco, may not appear as separately selectable areas because of the resolution of the boundary dataset.
- Natural Earth uses its own identifiers for some map features. The application includes aliases and special handling to improve matching, but map coverage may not be identical to the 197 directory entries.
- Country statistics are provided by an external data source and may change over time. Population and area values should be treated as informational rather than as official real-time figures.
- Flag images and map boundaries are external resources; their availability depends on the respective services.

## License and attribution

This project uses third-party data and services. Please refer to the respective providers' websites and licensing terms for countries.dev, FlagCDN, Natural Earth, and MapLibre GL JS. The use of these resources does not imply that their data or assets are owned by this project.
