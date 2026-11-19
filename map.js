import * as maplibregl from "https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.mjs";

// =====================================================================
// Reiter-Navigation + interaktive Weltkarte (MapLibre GL JS)
//
// Ländergrenzen aus einer einzelnen, vereinfachten Natural-Earth-Datei.
// MapLibre GL JS rendert die GeoJSON-Polygone per WebGL.
// =====================================================================

// Eine einzige, stark vereinfachte GeoJSON-Datei statt ~180 Einzel-Requests.
const GEOJSON_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";

const CONTINENT_COLORS = {
  Europa: "#6c8cff",
  Asien: "#ff7a90",
  Afrika: "#ffb454",
  Nordamerika: "#4cd7a5",
  Südamerika: "#c28bff",
  Ozeanien: "#4cc9f0",
};
const NEUTRAL_FILL = "#2b3263";
const SCALE_COLORS = ["#2f3d8f", "#4358c9", "#6a73ee", "#9a6df2", "#c867ee", "#ff7ad2"];
const SCALES = {
  population: {
    title: "Einwohner",
    bins: [1e6, 1e7, 3e7, 1e8, 3e8],
    labels: ["unter 1 Mio.", "1–10 Mio.", "10–30 Mio.", "30–100 Mio.", "100–300 Mio.", "über 300 Mio."],
  },
  area: {
    title: "Fläche",
    bins: [1e4, 1e5, 5e5, 2e6, 5e6],
    labels: ["unter 10.000 km²", "10.000–100.000 km²", "100.000–500.000 km²", "0,5–2 Mio. km²", "2–5 Mio. km²", "über 5 Mio. km²"],
  },
};

let map = null;
let geoData = null;
let mapStarted = false;
let colorMode = "continent";
let selectedCountry = null;

// ISO-3166-1-Zuordnung für die mitgelieferten Offline-Länderdaten.
// Die GeoJSON-Kartendaten verwenden ISO-3-Codes, data.js dagegen ISO-2-Codes.
const ISO3_BY_CODE = {
  "ad": "AND", "ae": "ARE", "af": "AFG", "ag": "ATG", "al": "ALB",
  "am": "ARM", "ao": "AGO", "ar": "ARG", "at": "AUT", "au": "AUS",
  "az": "AZE", "ba": "BIH", "bb": "BRB", "bd": "BGD", "be": "BEL",
  "bf": "BFA", "bg": "BGR", "bh": "BHR", "bi": "BDI", "bj": "BEN",
  "bn": "BRN", "bo": "BOL", "br": "BRA", "bs": "BHS", "bt": "BTN",
  "bw": "BWA", "by": "BLR", "bz": "BLZ", "ca": "CAN", "cd": "COD",
  "cf": "CAF", "cg": "COG", "ch": "CHE", "ci": "CIV", "cl": "CHL",
  "cm": "CMR", "cn": "CHN", "co": "COL", "cr": "CRI", "cu": "CUB",
  "cv": "CPV", "cy": "CYP", "cz": "CZE", "de": "DEU", "dj": "DJI",
  "dk": "DNK", "dm": "DMA", "do": "DOM", "dz": "DZA", "ec": "ECU",
  "ee": "EST", "eg": "EGY", "er": "ERI", "es": "ESP", "et": "ETH",
  "fi": "FIN", "fj": "FJI", "fm": "FSM", "fr": "FRA", "ga": "GAB",
  "gb": "GBR", "gd": "GRD", "ge": "GEO", "gh": "GHA", "gm": "GMB",
  "gn": "GIN", "gq": "GNQ", "gr": "GRC", "gt": "GTM", "gw": "GNB",
  "gy": "GUY", "hn": "HND", "hr": "HRV", "ht": "HTI", "hu": "HUN",
  "id": "IDN", "ie": "IRL", "il": "ISR", "in": "IND", "iq": "IRQ",
  "ir": "IRN", "is": "ISL", "it": "ITA", "jm": "JAM", "jo": "JOR",
  "jp": "JPN", "ke": "KEN", "kg": "KGZ", "kh": "KHM", "ki": "KIR",
  "km": "COM", "kn": "KNA", "kp": "PRK", "kr": "KOR", "kw": "KWT",
  "kz": "KAZ", "la": "LAO", "lb": "LBN", "lc": "LCA", "li": "LIE",
  "lk": "LKA", "lr": "LBR", "ls": "LSO", "lt": "LTU", "lu": "LUX",
  "lv": "LVA", "ly": "LBY", "ma": "MAR", "mc": "MCO", "md": "MDA",
  "me": "MNE", "mg": "MDG", "mh": "MHL", "mk": "MKD", "ml": "MLI",
  "mm": "MMR", "mn": "MNG", "mr": "MRT", "mt": "MLT", "mu": "MUS",
  "mv": "MDV", "mw": "MWI", "mx": "MEX", "my": "MYS", "mz": "MOZ",
  "na": "NAM", "ne": "NER", "ng": "NGA", "ni": "NIC", "nl": "NLD",
  "no": "NOR", "np": "NPL", "nr": "NRU", "nz": "NZL", "om": "OMN",
  "pa": "PAN", "pe": "PER", "pg": "PNG", "ph": "PHL", "pk": "PAK",
  "pl": "POL", "ps": "PSE", "pt": "PRT", "pw": "PLW", "py": "PRY",
  "qa": "QAT", "ro": "ROU", "rs": "SRB", "ru": "RUS", "rw": "RWA",
  "sa": "SAU", "sb": "SLB", "sc": "SYC", "sd": "SDN", "se": "SWE",
  "sg": "SGP", "si": "SVN", "sk": "SVK", "sl": "SLE", "sm": "SMR",
  "sn": "SEN", "so": "SOM", "sr": "SUR", "ss": "SSD", "st": "STP",
  "sv": "SLV", "sy": "SYR", "sz": "SWZ", "td": "TCD", "tg": "TGO",
  "th": "THA", "tj": "TJK", "tl": "TLS", "tm": "TKM", "tn": "TUN",
  "to": "TON", "tr": "TUR", "tt": "TTO", "tv": "TUV", "tw": "TWN",
  "tz": "TZA", "ua": "UKR", "ug": "UGA", "us": "USA", "uy": "URY",
  "uz": "UZB", "va": "VAT", "vc": "VCT", "ve": "VEN", "vn": "VNM",
  "vu": "VUT", "ws": "WSM", "ye": "YEM", "za": "ZAF", "zm": "ZMB",
  "zw": "ZWE",
};

let countryByCode = new Map();
let countryByIso3 = new Map();
let countryByName = new Map();
const featureIdByCode = new Map();
let hoveredFeatureId = null;
let mapInteractionsReady = false;

const viewFlags = document.getElementById("view-flags");
const viewMap = document.getElementById("view-map");
const mapStatusEl = document.getElementById("map-status");
const mapLegendEl = document.getElementById("map-legend");
const mapColorEl = document.getElementById("map-color");
const mapJumpEl = document.getElementById("map-jump");
const mapJumpSuggestions = document.getElementById("map-jump-suggestions");

// ---------- Status ----------
const RETRY_BTN = ' <button type="button" class="retry">Erneut versuchen</button>';

function setMapStatus(content, { warn = false, html = false } = {}) {
  mapStatusEl.className = "status" + (warn ? " warn" : "");
  if (html) mapStatusEl.innerHTML = content;
  else mapStatusEl.textContent = content;
  mapStatusEl.hidden = false;
}

function hideMapStatus() {
  mapStatusEl.hidden = true;
}

// ---------- Zuordnung Karte ↔ Länderdaten ----------
function rebuildLookup() {
  countryByCode = new Map();
  countryByIso3 = new Map();
  countryByName = new Map();
  for (const c of items) {
    countryByCode.set(c.code, c);
    const iso3 = c.iso3 || ISO3_BY_CODE[c.code];
    if (iso3) countryByIso3.set(iso3.toUpperCase(), c);
    countryByName.set(normalize(c.name), c);
  }
}

function countryForFeature(feature) {
  if (!feature) return null;
  const properties = feature.properties || {};
  // Kosovo hat in den Kartendaten keinen ISO-Code.
  if (properties.name === "Kosovo" || properties.ADMIN === "Kosovo") {
    return countryByCode.get("xk") || null;
  }
  // MapLibre kann die Feature-ID je nach GeoJSON-Verarbeitung auslassen.
  const iso3 = String(
    feature.id || properties.iso3 || properties.ADM0_A3 ||
    properties.ISO_A3_EH || properties.ISO_A3 || ""
  ).toUpperCase();
  return countryByIso3.get(iso3) || null;
}

// ---------- Färbung ----------
function binIndex(value, bins) {
  let i = 0;
  while (i < bins.length && value >= bins[i]) i++;
  return i;
}

function colorFor(c) {
  if (colorMode === "continent") return CONTINENT_COLORS[c.continent] || NEUTRAL_FILL;
  const scale = SCALES[colorMode];
  return SCALE_COLORS[binIndex(c[colorMode], scale.bins)];
}

function featureIdForCountry(c) {
  return String(c.iso3 || ISO3_BY_CODE[c.code] || "").toUpperCase();
}

function mapFeatureCollection() {
  return {
    type: "FeatureCollection",
    features: geoData.features.map((feature) => {
      const c = countryForFeature(feature);
      const id = c ? featureIdForCountry(c) : feature.id;
      return {
        ...feature,
        id,
        properties: {
          ...(feature.properties || {}),
          iso3: id,
          fillColor: c ? colorFor(c) : NEUTRAL_FILL,
          hasCountry: Boolean(c),
        },
      };
    }),
  };
}

function renderLegend() {
  mapLegendEl.innerHTML = "";
  let title;
  let entries;
  if (colorMode === "continent") {
    title = "Kontinente";
    entries = CONTINENTS.map((n) => [CONTINENT_COLORS[n], language === "de" ? n : ({Europa:"Europe",Asien:"Asia",Afrika:"Africa",Nordamerika:"North America",Südamerika:"South America",Ozeanien:"Oceania"}[n])]);
  } else {
    title = language === "de" ? SCALES[colorMode].title : (colorMode === "area" ? "Area" : "Population");
    entries = SCALES[colorMode].labels.map((l, i) => [SCALE_COLORS[i], l]);
  }
  entries.push([NEUTRAL_FILL, tr("noData")]);

  const h = document.createElement("strong");
  h.textContent = title;
  mapLegendEl.appendChild(h);

  for (const [color, label] of entries) {
    const row = document.createElement("div");
    row.className = "legend-row";
    const sw = document.createElement("span");
    sw.className = "legend-swatch";
    sw.style.background = color;
    const tx = document.createElement("span");
    tx.textContent = label;
    row.append(sw, tx);
    mapLegendEl.appendChild(row);
  }
}

// ---------- Tooltip & Popup ----------
function tooltipContent(c) {
  const el = document.createElement("div");
  el.className = "tip";
  const img = document.createElement("img");
  img.src = flagUrl(c.code, 80);
  img.alt = "";
  const name = document.createElement("span");
  name.textContent = displayName(c);
  el.append(img, name);
  return el;
}

function showCountrySidebar(c) {
  if (selectedCountry) {
    const oldId = featureIdForCountry(selectedCountry);
    if (oldId && map?.getSource("countries")) map.setFeatureState({ source: "countries", id: oldId }, { selected: false });
  }
  selectedCountry = c;
  const id = featureIdForCountry(c);
  if (id && map?.getSource("countries")) map.setFeatureState({ source: "countries", id }, { selected: true });
  updateSelectedCountryOutline(c);

  const sidebar = document.getElementById("country-sidebar");
  const content = document.getElementById("sidebar-content");
  content.innerHTML = "";
  // Beim Länderwechsel den Inhalt kurz weich einblenden.
  content.classList.remove("country-switch");
  void content.offsetWidth;
  content.classList.add("country-switch");
  const img = document.createElement("img");
  img.className = "sidebar-flag";
  img.src = flagUrl(c.code, 320);
  img.alt = "";
  const title = document.createElement("h2");
  title.textContent = displayName(c);
  const info = document.createElement("dl");
  info.className = "sidebar-info";
  const density = c.area > 0 ? c.population / c.area : 0;
  const rows = [
    [tr("capital"), language === "en" ? (c.capitalEn || c.capital) : c.capital],
    [tr("continent"), continentLabel(c.continent)],
    [tr("domain"), c.tld],
    [tr("area"), formatArea(c.area)],
    [tr("population"), nf.format(c.population)],
    [tr("density"), nf.format(Math.round(density)) + " / km²"],
    [tr("code"), c.code.toUpperCase()]
  ];
  for (const [key, value] of rows) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = key;
    dd.textContent = value;
    info.append(dt, dd);
  }
  content.append(img, title, info);
  sidebar.hidden = false;
  sidebar.style.display = "block";
  sidebar.setAttribute("aria-hidden", "false");
  document.querySelector(".map-wrap")?.classList.add("has-sidebar");
  if (map) requestAnimationFrame(() => map.resize());
}

function updateSelectedCountryOutline(country) {
  const source = map?.getSource("selected-country-outline");
  if (!source) return;
  const feature = country && geoData?.features.find((entry) => countryForFeature(entry)?.code === country.code);
  source.setData({
    type: "FeatureCollection",
    features: feature ? [feature] : [],
  });
}

function matchingMapCountries(query) {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return items.filter((country) => {
    const haystack = country.searchText || normalize(
      `${country.name} ${displayName(country)} ${country.capital} ${country.capitalEn || ""} ${country.code} ${country.tld}`
    );
    // Autocomplete should match the beginning of a word, not arbitrary
    // substrings (e.g. "d" must not match Algeria only because of ".dz").
    const words = haystack.split(/\s+/).filter(Boolean);
    return terms.every((term) => words.some((word) => word.startsWith(term)));
  });
}

function updateMapSearchOutlines(matches) {
  const source = map?.getSource("map-search-outlines");
  if (!source || !geoData) return;
  const codes = new Set(matches.map((country) => country.code));
  const features = geoData.features.filter((feature) => {
    const country = countryForFeature(feature);
    return country && codes.has(country.code);
  });
  source.setData({ type: "FeatureCollection", features });
}

function closeMapSuggestions() {
  mapJumpSuggestions.hidden = true;
  mapJumpEl.setAttribute("aria-expanded", "false");
}

function updateMapSuggestions() {
  const query = mapJumpEl.value;
  const matches = matchingMapCountries(query);
  mapJumpSuggestions.replaceChildren();

  if (!normalize(query)) {
    updateMapSearchOutlines([]);
    closeMapSuggestions();
    return;
  }

  // Outline every match, not just the suggestions visible in the dropdown.
  updateMapSearchOutlines(matches);

  for (const country of matches.slice(0, 8)) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "map-suggestion";
    option.setAttribute("role", "option");
    const flag = document.createElement("img");
    flag.src = flagUrl(country.code, 80);
    flag.alt = "";
    const name = document.createElement("span");
    name.textContent = displayName(country);
    const capital = document.createElement("small");
    capital.textContent = country.capital;
    option.append(flag, name, capital);
    option.addEventListener("click", () => {
      mapJumpEl.value = displayName(country);
      closeMapSuggestions();
      updateMapSearchOutlines([country]);
      jumpTo(country.name);
    });
    mapJumpSuggestions.appendChild(option);
  }

  closeMapSuggestions();
  if (matches.length) {
    mapJumpSuggestions.hidden = false;
    mapJumpEl.setAttribute("aria-expanded", "true");
  }
}

function hideCountrySidebar() {
  const sidebar = document.getElementById("country-sidebar");
  sidebar.hidden = true;
  sidebar.style.display = "none";
  sidebar.setAttribute("aria-hidden", "true");
  document.querySelector(".map-wrap")?.classList.remove("has-sidebar");
  if (selectedCountry) {
    const id = featureIdForCountry(selectedCountry);
    if (id && map?.getSource("countries")) map.setFeatureState({ source: "countries", id }, { selected: false });
  }
  selectedCountry = null;
  updateSelectedCountryOutline(null);
  if (map) requestAnimationFrame(() => map.resize());
}

// ---------- MapLibre-Layer ----------
function buildLayer() {
  rebuildLookup();
  featureIdByCode.clear();
  for (const country of items) {
    const id = featureIdForCountry(country);
    if (id) featureIdByCode.set(country.code, id);
  }

  const data = mapFeatureCollection();
  if (!map.getSource("countries")) {
    map.addSource("countries", { type: "geojson", data });
    map.addLayer({
      id: "countries-fill",
      type: "fill",
      source: "countries",
      paint: {
        "fill-color": ["get", "fillColor"],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false], 1,
          ["boolean", ["feature-state", "hover"], false], 1,
          ["get", "hasCountry"], 0.85,
          0.5
        ],
      },
    });
    map.addLayer({
      id: "countries-outline",
      type: "line",
      source: "countries",
      paint: {
        // Ursprüngliche, dezente Ländergrenzen.
        "line-color": "#0f1220",
        "line-opacity": 1,
        "line-width": 0.7,
      },
    });
    // Separate GeoJSON source: die weiße Auswahlkontur ist damit
    // unabhängig von MapLibre Feature-State-IDs zuverlässig sichtbar.
    map.addSource("selected-country-outline", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "countries-selected-outline",
      type: "line",
      source: "selected-country-outline",
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 1,
        "line-width": 2.5,
      },
    });
    map.addSource("map-search-outlines", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "countries-search-outline",
      type: "line",
      source: "map-search-outlines",
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 1,
        "line-width": 2.5,
      },
    });
  } else {
    map.getSource("countries").setData(data);
  }

  if (selectedCountry) {
    const id = featureIdForCountry(selectedCountry);
    if (id) map.setFeatureState({ source: "countries", id }, { selected: true });
    updateSelectedCountryOutline(selectedCountry);
  }

  if (!mapInteractionsReady) {
    // Layer-spezifische Events sind zuverlässiger als eine manuelle
    // queryRenderedFeatures-Abfrage bei jedem Klick.
    map.on("click", "countries-fill", (event) => {
      const feature = event.features?.[0];
      const country = countryForFeature(feature);
      if (country) showCountrySidebar(country);
    });
    map.on("mouseenter", "countries-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "countries-fill", () => {
      map.getCanvas().style.cursor = "";
      if (hoveredFeatureId) {
        map.setFeatureState({ source: "countries", id: hoveredFeatureId }, { hover: false });
        hoveredFeatureId = null;
      }
    });
    map.on("mousemove", "countries-fill", (event) => {
      const feature = event.features?.[0];
      const id = feature?.id != null ? String(feature.id) : null;
      if (hoveredFeatureId && hoveredFeatureId !== id) {
        map.setFeatureState({ source: "countries", id: hoveredFeatureId }, { hover: false });
      }
      hoveredFeatureId = id;
      if (hoveredFeatureId) {
        map.setFeatureState({ source: "countries", id: hoveredFeatureId }, { hover: true });
      }
    });
    mapInteractionsReady = true;
  }
}

function createMap() {
  map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      sources: {},
      layers: [{ id: "background", type: "background", paint: { "background-color": "#0b1020" } }],
    },
    // Weltansicht automatisch an den verfügbaren Kartenbereich anpassen.
    bounds: [[-180, -80], [180, 80]],
    fitBoundsOptions: { padding: 24, maxZoom: 1.4 },
    minZoom: 0,
    maxZoom: 7,
    maxBounds: [[-180, -85], [180, 85]],
    renderWorldCopies: false,
    // Eine flache, nordausgerichtete Karte: keine Rotation oder Neigung.
    bearing: 0,
    pitch: 0,
    maxPitch: 0,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    touchZoomRotate: true,
    attributionControl: true,
  });
  // Touch-Pinch darf zoomen, aber nicht die Karte drehen.
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  return new Promise((resolve, reject) => {
    map.once("load", resolve);
    map.once("error", (event) => {
      if (!map.isStyleLoaded()) reject(event.error || new Error("MapLibre konnte nicht initialisiert werden"));
    });
  });
}

function jumpTo(name) {
  const country = countryByName.get(normalize(name));
  if (!country || !map || !geoData) return;
  const feature = geoData.features.find((entry) => countryForFeature(entry)?.code === country.code);
  if (!feature) {
    setMapStatus(`„${country.name}“ ist auf dieser Karte nicht als Fläche enthalten (zu klein oder fehlt in den Kartendaten). `, { warn: true });
    setTimeout(hideMapStatus, 5000);
    return;
  }
  const bounds = new maplibregl.LngLatBounds();
  const extend = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      bounds.extend(coords);
      return;
    }
    coords.forEach(extend);
  };
  extend(feature.geometry.coordinates);
  if (bounds.isEmpty()) return;
  hideMapStatus();
  map.fitBounds(bounds, { maxZoom: 5, padding: 40, duration: 900 });
  showCountrySidebar(country);
}

async function fetchGeo() {
  if (geoData) return geoData;

  const response = await fetch(GEOJSON_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Kartendaten: HTTP ${response.status}`);

  const raw = await response.json();
  if (!raw || raw.type !== "FeatureCollection" || !Array.isArray(raw.features)) {
    throw new Error("Ungültiges GeoJSON-Format");
  }

  const features = raw.features
    .filter((feature) => feature && feature.geometry)
    .map((feature) => {
      const properties = feature.properties || {};
      // Einige Natural-Earth-Features führen in ADM0_A3 den Platzhalter
      // "-99", obwohl ISO_A3_EH einen gültigen ISO-Code enthält.
      const iso3 = [
        properties.ADM0_A3,
        properties.ISO_A3_EH,
        properties.ISO_A3,
        properties.SOV_A3,
      ]
        .map((value) => String(value || "").toUpperCase())
        .find((value) => /^[A-Z]{3}$/.test(value)) || "";

      return {
        ...feature,
        id: /^[A-Z]{3}$/.test(iso3) ? iso3 : undefined,
        properties: {
          ...properties,
          name: properties.ADMIN || properties.NAME || properties.NAME_EN || iso3,
        },
      };
    });

  if (features.length < 150) throw new Error("Zu wenige Ländergrenzen geladen");
  geoData = { type: "FeatureCollection", features };
  console.info(`Natural Earth: ${features.length} Ländergrenzen geladen`);
  return geoData;
}

async function startMap() {
  if (mapStarted) return;
  mapStarted = true;
  setMapStatus("Lade Karte …");

  try {
    if (typeof maplibregl === "undefined") throw new Error("maplibre");
    // Die Karte sofort initialisieren; Länder- und Geodaten parallel laden.
    if (!map) await createMap();
    await Promise.all([dataReady, fetchGeo()]);
    if (!items.some((c) => c.iso3 || ISO3_BY_CODE[c.code])) throw new Error("no-country-codes");
    buildLayer();
    renderLegend();
    updateMapSuggestions();
    hideMapStatus();
    map.resize();
  } catch (err) {
    console.warn("Karte konnte nicht geladen werden:", err);
    mapStarted = false;
    const msg =
      err.message === "no-country-codes"
        ? "Die ISO-Ländercodes für die Kartenzuordnung konnten nicht ermittelt werden."
        : err.message === "maplibre"
        ? "Die Kartenbibliothek (MapLibre GL JS) konnte nicht geladen werden."
        : "Die Karte konnte nicht geladen werden.";
    const detail = err && err.message ? ` (${err.message})` : "";
    setMapStatus(msg + detail + RETRY_BTN, { warn: true, html: true });
  }
}

// ---------- Ereignisse ----------
document.getElementById("sidebar-close")?.addEventListener("click", hideCountrySidebar);
mapStatusEl.addEventListener("click", async (e) => {
  if (!e.target.closest(".retry")) return;
  if (!items.some((c) => c.iso3)) await init(true);
  startMap();
});

mapColorEl.addEventListener("change", () => {
  colorMode = mapColorEl.value;
  if (map && map.getSource("countries")) buildLayer();
  renderLegend();
});

mapJumpEl.addEventListener("input", updateMapSuggestions);
mapJumpEl.addEventListener("focus", updateMapSuggestions);
mapJumpEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const exact = items.find((country) =>
      normalize(displayName(country)) === normalize(mapJumpEl.value) ||
      normalize(country.name) === normalize(mapJumpEl.value)
    );
    const firstMatch = matchingMapCountries(mapJumpEl.value)[0];
    const country = exact || firstMatch;
    if (country) {
      event.preventDefault();
      mapJumpEl.value = displayName(country);
      closeMapSuggestions();
      updateMapSearchOutlines([country]);
      jumpTo(country.name);
    }
  } else if (event.key === "Escape") {
    closeMapSuggestions();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".map-field-grow")) closeMapSuggestions();
});

// Länderdaten wurden (neu) geladen → Karte aktualisieren
document.addEventListener("language-changed", () => {
  if (map && geoData && map.isStyleLoaded()) {
    buildLayer();
    renderLegend();
    
    updateMapSuggestions();
  }
  if (selectedCountry) showCountrySidebar(selectedCountry);
});
document.addEventListener("countries-updated", () => {
  if (map && geoData && map.isStyleLoaded()) {
    buildLayer();
    renderLegend();
    updateMapSuggestions();
  }
});

// ---------- Reiter ----------
const tabButtons = Array.from(document.querySelectorAll(".tab"));

function showView(name, updateHash = true) {
  for (const t of tabButtons) {
    const active = t.dataset.view === name;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
    t.tabIndex = active ? 0 : -1;
  }
  viewFlags.hidden = name !== "flags";
  viewMap.hidden = name !== "map";

  if (name === "map") {
    startMap();
    if (map) setTimeout(() => map.resize(), 0);
  }
  if (updateHash) {
    try {
      history.replaceState(null, "", name === "map" ? "#karte" : location.pathname + location.search);
    } catch (_) { /* z. B. bei file:// */ }
  }
}

for (const t of tabButtons) {
  t.addEventListener("click", () => showView(t.dataset.view));
  t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabButtons.indexOf(t);
    const next = tabButtons[(i + (e.key === "ArrowRight" ? 1 : -1) + tabButtons.length) % tabButtons.length];
    next.focus();
    showView(next.dataset.view);
  });
}

window.addEventListener("hashchange", () => showView(location.hash === "#karte" ? "map" : "flags", false));
if (location.hash === "#karte") showView("map", false);
