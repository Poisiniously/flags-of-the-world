const MAPLIBRE_URL = "https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.mjs";
let maplibregl = null;

// Map data and color scales
const GEOJSON_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";

const CONTINENT_COLORS = {
  Europa: "#173b8f",
  Asien: "#176b3a",
  Nordamerika: "#f2cf32",
  Südamerika: "#ed8428",
  Afrika: "#d93636",
  Ozeanien: "#8746b8",
};
const NEUTRAL_FILL = "#2b3263";
const SCALE_COLORS = ["#2f3d8f", "#4358c9", "#6a73ee", "#9a6df2", "#c867ee", "#ff7ad2"];
const SCALES = {
  population: {
    bins: [1e6, 1e7, 3e7, 1e8, 3e8],
    labels: {
      de: ["unter 1 Mio.", "1–10 Mio.", "10–30 Mio.", "30–100 Mio.", "100–300 Mio.", "über 300 Mio."],
      en: ["Under 1M", "1–10M", "10–30M", "30–100M", "100–300M", "Over 300M"],
    },
  },
  area: {
    bins: [1e4, 1e5, 5e5, 2e6, 5e6],
    labels: {
      de: ["unter 10.000 km²", "10.000–100.000 km²", "100.000–500.000 km²", "0,5–2 Mio. km²", "2–5 Mio. km²", "über 5 Mio. km²"],
      en: ["Under 10,000 km²", "10,000–100,000 km²", "100,000–500,000 km²", "0.5–2M km²", "2–5M km²", "Over 5M km²"],
    },
  },
};

let map = null;
let geoData = null;
let mapStarted = false;
let mapStartPromise = null;
let colorMode = "continent";
let selectedCountry = null;

// Country code lookup
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
let territoryList = [];
let territoryByIso3 = new Map();
let territoryByCode = new Map();
let territoryByName = new Map();
const featureIdByCode = new Map();
let hoveredFeatureId = null;
let mapInteractionsReady = false;

const viewFlags = document.getElementById("view-flags");
const viewMap = document.getElementById("view-map");
const viewQuiz = document.getElementById("view-quiz");
const mapStatusEl = document.getElementById("map-status");
const mapLegendEl = document.getElementById("map-legend");
const mapColorEl = document.getElementById("map-color");
const mapJumpEl = document.getElementById("map-jump");
const mapJumpSuggestions = document.getElementById("map-jump-suggestions");

// Map status and country lookup
function setMapStatus(content, { warn = false, retry = false } = {}) {
  mapStatusEl.className = "status" + (warn ? " warn" : "");
  mapStatusEl.replaceChildren();

  const message = document.createElement("span");
  message.textContent = content;
  mapStatusEl.appendChild(message);

  if (retry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "retry";
    button.textContent = tr("retry");
    mapStatusEl.append(" ", button);
  }

  mapStatusEl.hidden = false;
}

function hideMapStatus() {
  mapStatusEl.hidden = true;
}

// Build indexes for ISO codes, names, and territories to match map features quickly.
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

  territoryByIso3 = new Map();
  territoryByCode = new Map();
  territoryByName = new Map();
  territoryList = (typeof TERRITORIES === "undefined" ? [] : TERRITORIES).map((t) => {
    const sovereign = countryByCode.get(t.sovereign);
    return {
      ...t,
      searchText: normalize(
        `${t.name} ${t.names.join(" ")} ${t.capital} ${t.code} ${t.tld} ` +
        `${sovereign ? sovereign.name + " " + displayName(sovereign) : ""}`
      ),
    };
  });
  for (const t of territoryList) {
    territoryByIso3.set(t.iso3, t);
    territoryByCode.set(t.code, t);
    territoryByName.set(normalize(t.name), t);
    for (const n of t.names) territoryByName.set(normalize(n), t);
    countryByName.set(normalize(t.name), t);
  }
}

function allMapEntries() {
  return [...items, ...territoryList];
}

const GEO_ALIASES = {
  SDS: "SSD",
  SOL: "SOM",
  CYN: "CYP",
  KOS: "XKX",
  PSX: "PSE",
  SAH: "MAR",
  KAB: "KAZ", // Baikonur enclave is shown as part of Kazakhstan
};

// Natural Earth draws the leased Baikonur area as a separate circle inside Kazakhstan.
function isBaikonur(feature) {
  const p = (feature && feature.properties) || {};
  return p.ADM0_A3 === "KAB" || p.ADMIN === "Baikonur" || p.NAME === "Baikonur" || p.name === "Baikonur";
}

function countryForFeature(feature) {
  if (!feature) return null;
  const properties = feature.properties || {};
  if (properties.name === "Kosovo" || properties.ADMIN === "Kosovo") {
    return countryByCode.get("xk") || null;
  }
  const candidates = [
    feature.id, properties.iso3, properties.ADM0_A3, properties.ISO_A3_EH, properties.ISO_A3,
  ];
  for (const value of candidates) {
    const raw = String(value || "").toUpperCase();
    const c = countryByIso3.get(raw) || countryByIso3.get(GEO_ALIASES[raw] || "");
    if (c) return c;
  }
  for (const value of candidates) {
    const t = territoryByIso3.get(String(value || "").toUpperCase());
    if (t) return t;
  }
  for (const value of [properties.ISO_A2, properties.ISO_A2_EH]) {
    const t = territoryByCode.get(String(value || "").toLowerCase());
    if (t) return t;
  }
  for (const value of [properties.ADMIN, properties.NAME, properties.NAME_EN, properties.name]) {
    const t = value ? territoryByName.get(normalize(String(value))) : null;
    if (t) return t;
  }
  return null;
}

function featureIdsForCountry(country) {
  if (!country) return [];
  const baseId = featureIdForCountry(country);
  const splitFeatures = geoData?.features.filter((feature) =>
    countryForFeature(feature)?.code === country.code && feature.properties?.continentOverride
  ) || [];
  if (splitFeatures.length) {
    return splitFeatures.map((feature) => {
      const continent = feature.properties.continentOverride;
      return `${baseId}-${continent === "Europa" ? "EU" : "AS"}`;
    });
  }
  return [baseId];
}

function featureForCountry(country) {
  if (!country || !geoData) return null;
  const matches = geoData.features.filter((feature) => countryForFeature(feature)?.code === country.code);
  if (!matches.length) return null;
  // Merge all continent-split pieces so search zooming and the selected outline
  // always cover the complete country (for example Russia and Türkiye).
  if (matches.some((feature) => feature.properties?.continentOverride)) {
    const coordinates = matches.flatMap((feature) => {
      const geometry = feature.geometry;
      if (geometry?.type === "Polygon") return [geometry.coordinates];
      if (geometry?.type === "MultiPolygon") return geometry.coordinates;
      return [];
    });
    return {
      ...matches[0],
      geometry: { type: "MultiPolygon", coordinates },
    };
  }
  const iso3 = String(country.iso3 || ISO3_BY_CODE[country.code] || "").toUpperCase();
  return matches.find((feature) => {
    const properties = feature.properties || {};
    return [properties.ADM0_A3, properties.ISO_A3_EH, properties.ISO_A3]
      .some((value) => String(value || "").toUpperCase() === iso3);
  }) || matches[0];
}

// Country colors and territory stripes
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

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function darken(hex, amount = 0.45) {
  const [r, g, b] = hexToRgb(hex);
  const mix = (v, target) => Math.round(v * (1 - amount) + target * amount);
  return "#" + [mix(r, 11), mix(g, 16), mix(b, 32)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function stripeColors(territory) {
  const own = colorFor(territory);
  const sovereign = countryByCode.get(territory.sovereign);
  let other = sovereign ? colorFor(sovereign) : NEUTRAL_FILL;
  if (other.toLowerCase() === own.toLowerCase()) other = darken(own);
  return [own, other];
}

const STRIPE_TILE = 12;

// Create a reusable image tile for the striped fill used by overseas territories.
function ensureStripeImage(colorA, colorB) {
  const name = `stripe-${colorA.slice(1)}-${colorB.slice(1)}`;
  if (!map || map.hasImage(name)) return name;
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const data = new Uint8Array(STRIPE_TILE * STRIPE_TILE * 4);
  for (let y = 0; y < STRIPE_TILE; y++) {
    for (let x = 0; x < STRIPE_TILE; x++) {
      const color = (x + y) % STRIPE_TILE < STRIPE_TILE / 2 ? a : b;
      const i = (y * STRIPE_TILE + x) * 4;
      data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2]; data[i + 3] = 255;
    }
  }
  map.addImage(name, { width: STRIPE_TILE, height: STRIPE_TILE, data });
  return name;
}

function featureIdForCountry(c) {
  return String(c.iso3 || ISO3_BY_CODE[c.code] || "").toUpperCase();
}

function polygonOuterRingArea(polygon) {
  const ring = polygon?.[0] || [];
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2);
}

// Join Natural Earth geometry with country data and calculate each feature's fill style.
function mapFeatureCollection() {
  const kazakhstanFeatures = geoData.features.filter(
    (feature) => countryForFeature(feature)?.code === "kz"
  );
  const kazakhstanAreas = kazakhstanFeatures.flatMap((feature) => {
    const geometry = feature.geometry;
    if (geometry?.type === "Polygon") return [polygonOuterRingArea(geometry.coordinates)];
    if (geometry?.type === "MultiPolygon") return geometry.coordinates.map(polygonOuterRingArea);
    return [];
  });
  const largestKazakhstanArea = Math.max(0, ...kazakhstanAreas);
  const minimumKazakhstanArea = largestKazakhstanArea * 0.001;

  return {
    type: "FeatureCollection",
    features: geoData.features
      .filter((feature) => {
        if (countryForFeature(feature)?.code !== "kz") return true;
        const geometry = feature.geometry;
        if (geometry?.type === "Polygon") {
          return polygonOuterRingArea(geometry.coordinates) >= minimumKazakhstanArea;
        }
        if (geometry?.type === "MultiPolygon") {
          return geometry.coordinates.some((polygon) => polygonOuterRingArea(polygon) >= minimumKazakhstanArea);
        }
        return true;
      })
      .map((feature) => {
      const c = countryForFeature(feature);
      const id = c ? featureIdForCountry(c) : feature.id;
      const geometry = c?.code === "kz" && feature.geometry
        ? feature.geometry.type === "Polygon"
          ? { ...feature.geometry, coordinates: feature.geometry.coordinates.slice(0, 1) }
          : feature.geometry.type === "MultiPolygon"
            ? {
                ...feature.geometry,
                coordinates: feature.geometry.coordinates.map((polygon) => polygon.slice(0, 1)),
              }
            : feature.geometry
        : feature.geometry;
      return {
        ...feature,
        ...(geometry ? { geometry } : {}),
        // Split-country pieces need unique IDs for reliable feature-state selection.
        id: c && feature.properties?.continentOverride
          ? `${id}-${feature.properties.continentOverride === "Europa" ? "EU" : "AS"}`
          : id,
        properties: {
          ...(feature.properties || {}),
          iso3: id,
          fillColor: c
            ? (colorMode === "continent" && feature.properties?.continentOverride
                ? CONTINENT_COLORS[feature.properties.continentOverride]
                : colorFor(c))
            : NEUTRAL_FILL,
          hasCountry: Boolean(c),
          isTerritory: Boolean(c?.isTerritory),
          stripeImage: c?.isTerritory ? ensureStripeImage(...stripeColors(c)) : "",
        },
      };
    }),
  };
}

// Map legend and country details
function renderLegend() {
  mapLegendEl.replaceChildren();
  let title;
  let entries;
  if (colorMode === "continent") {
    title = language === "de" ? "Kontinente" : "Continents";
    entries = CONTINENTS.map((n) => [CONTINENT_COLORS[n], language === "de" ? n : ({Europa:"Europe",Asien:"Asia",Afrika:"Africa",Nordamerika:"North America",Südamerika:"South America",Ozeanien:"Oceania"}[n])]);
  } else {
    title = language === "de" ? (colorMode === "area" ? "Fläche" : "Einwohner") : (colorMode === "area" ? "Area" : "Population");
    entries = SCALES[colorMode].labels[language].map((l, i) => [SCALE_COLORS[i], l]);
  }
  entries.push([NEUTRAL_FILL, tr("noData")]);
  if (territoryList.length) {
    const [a, b] = colorMode === "continent"
      ? [CONTINENT_COLORS.Südamerika, CONTINENT_COLORS.Europa]
      : [SCALE_COLORS[1], SCALE_COLORS[4]];
    entries.push([`repeating-linear-gradient(45deg, ${a} 0 3px, ${b} 3px 6px)`, tr("territoryLegend")]);
  }

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

function territoryBadge(sovereign) {
  const badge = document.createElement("div");
  badge.className = "territory-badge";
  const dot = document.createElement("span");
  dot.className = "territory-dot";
  const text = document.createElement("span");
  text.textContent = tr("territoryOf") + " ";
  const link = document.createElement("button");
  link.type = "button";
  link.className = "territory-link";
  link.textContent = displayName(sovereign);
  link.addEventListener("click", () => jumpTo(sovereign.name));
  badge.append(dot, text, link);
  return badge;
}

function territoryChips(list) {
  const box = document.createElement("div");
  box.className = "territory-list";
  const heading = document.createElement("h3");
  heading.textContent = `${tr("territories")} (${list.length})`;
  const chips = document.createElement("div");
  chips.className = "territory-chips";
  for (const t of [...list].sort((a, b) => collator.compare(displayName(a), displayName(b)))) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "territory-chip";
    const flag = document.createElement("img");
    flag.src = flagUrl(t.code, 40);
    flag.alt = "";
    flag.addEventListener("error", () => { flag.style.display = "none"; });
    const label = document.createElement("span");
    label.textContent = displayName(t);
    chip.append(flag, label);
    chip.addEventListener("click", () => jumpTo(t.name));
    chips.appendChild(chip);
  }
  box.append(heading, chips);
  return box;
}

// Keep the selected country synchronized between the sidebar, map highlight, and search.
function showCountrySidebar(c) {
  if (selectedCountry && map?.getSource("countries")) {
    for (const id of featureIdsForCountry(selectedCountry)) {
      map.setFeatureState({ source: "countries", id }, { selected: false });
    }
  }
  selectedCountry = c;
  if (map?.getSource("countries")) {
    for (const id of featureIdsForCountry(c)) {
      map.setFeatureState({ source: "countries", id }, { selected: true });
    }
  }
  updateSelectedCountryOutline(c);

  const sidebar = document.getElementById("country-sidebar");
  const content = document.getElementById("sidebar-content");
  content.replaceChildren();
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
  img.addEventListener("error", () => { img.style.display = "none"; });
  content.append(img, title);
  if (c.isTerritory) {
    const sovereign = countryByCode.get(c.sovereign);
    if (sovereign) content.append(territoryBadge(sovereign));
  }
  content.append(info);
  const ownTerritories = territoryList.filter((t) => t.sovereign === c.code);
  if (ownTerritories.length) content.append(territoryChips(ownTerritories));
  sidebar.hidden = false;
  sidebar.style.display = "block";
  sidebar.setAttribute("aria-hidden", "false");
  document.querySelector(".map-wrap")?.classList.add("has-sidebar");
  if (map) requestAnimationFrame(() => map.resize());
}

// Country selection and search
function updateSelectedCountryOutline(country) {
  const source = map?.getSource("selected-country-outline");
  if (!source) return;

  const feature = country ? featureForCountry(country) : null;
  let features = feature ? [feature] : [];

  features = features.map((entry) => {
    const geometry = entry.geometry;
    if (geometry?.type === "Polygon") {
      return { ...entry, geometry: { ...geometry, coordinates: geometry.coordinates.slice(0, 1) } };
    }
    if (geometry?.type === "MultiPolygon") {
      return {
        ...entry,
        geometry: {
          ...geometry,
          coordinates: geometry.coordinates.map((polygon) => polygon.slice(0, 1)),
        },
      };
    }
    return entry;
  });

  source.setData(outlineCollection({ type: "FeatureCollection", features }));
}

function matchingMapCountries(query) {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/[\s-]+/).filter(Boolean);
  return allMapEntries().filter((country) => {
    const haystack = country.searchText || normalize(
      `${country.name} ${displayName(country)} ${country.capital} ${country.capitalEn || ""} ${country.code} ${country.tld}`
    );
    const words = haystack.split(/[\s-]+/).filter(Boolean);
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
  source.setData(outlineCollection({ type: "FeatureCollection", features }));
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
    capital.textContent = language === "en" ? (country.capitalEn || country.capital) : country.capital;
    if (country.isTerritory) {
      const sovereign = countryByCode.get(country.sovereign);
      if (sovereign) capital.textContent += ` · ${displayName(sovereign)}`;
      flag.addEventListener("error", () => { flag.style.display = "none"; });
    }
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
  if (selectedCountry && map?.getSource("countries")) {
    for (const id of featureIdsForCountry(selectedCountry)) {
      map.setFeatureState({ source: "countries", id }, { selected: false });
    }
  }
  selectedCountry = null;
  updateSelectedCountryOutline(null);
  if (map) requestAnimationFrame(() => map.resize());
}

// MapLibre layers and initialization
// Rebuild map sources and layers when country data or display settings change.
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
      filter: ["!=", ["get", "isTerritory"], true],
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
      id: "territories-fill",
      type: "fill",
      source: "countries",
      filter: ["==", ["get", "isTerritory"], true],
      paint: {
        "fill-pattern": ["get", "stripeImage"],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false], 1,
          ["boolean", ["feature-state", "hover"], false], 1,
          0.9
        ],
      },
    });
    map.addSource("country-outlines", { type: "geojson", data: outlineData(data) });
    map.addLayer({
      id: "countries-outline",
      type: "line",
      source: "country-outlines",
      paint: {
        "line-color": "#0f1220",
        "line-opacity": 1,
        "line-width": 0.7,
      },
    });
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
    for (const id of featureIdsForCountry(selectedCountry)) {
      map.setFeatureState({ source: "countries", id }, { selected: true });
    }
    updateSelectedCountryOutline(selectedCountry);
  }

  if (!mapInteractionsReady) {
    for (const layerId of ["countries-fill", "territories-fill"]) {
      map.on("click", layerId, (event) => {
        const feature = event.features?.[0];
        const country = countryForFeature(feature);
        if (country) showCountrySidebar(country);
      });
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
        if (hoveredFeatureId) {
          map.setFeatureState({ source: "countries", id: hoveredFeatureId }, { hover: false });
          hoveredFeatureId = null;
        }
      });
      map.on("mousemove", layerId, (event) => {
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
    }
    mapInteractionsReady = true;
  }
}

// Ocean color comes from the active theme.
function oceanColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--map-ocean").trim() || "#91B8CE";
}

document.addEventListener("theme-changed", () => {
  if (map && map.getLayer("background")) map.setPaintProperty("background", "background-color", oceanColor());
});

function createMap() {
  const instance = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      projection: { type: "globe" },
      sources: {},
      layers: [
        { id: "background", type: "background", paint: { "background-color": oceanColor() } },
      ],
    },
    // Start slightly closer than a full-world fit.
    center: [10, 20],
    zoom: 1.8,
    minZoom: 0,
    maxZoom: 7,
    renderWorldCopies: true,
    // Reduce the globe's post-drag momentum for slower, more controlled rotation.
    dragPan: { inertia: 0.12 },
    bearing: 0,
    pitch: 0,
    maxPitch: 0,
    dragRotate: true,
    pitchWithRotate: false,
    touchPitch: false,
    touchZoomRotate: true,
    attributionControl: true,
  });
  map = instance;
  instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  return new Promise((resolve, reject) => {
    instance.once("load", () => resolve(instance));
    instance.once("error", (event) => {
      if (!instance.isStyleLoaded()) {
        reject(event.error || new Error(language === "de" ? "MapLibre konnte nicht initialisiert werden" : "MapLibre could not be initialized"));
      }
    });
  });
}

// Fit the map to a country's geometry and open its information panel.
function jumpTo(name) {
  const country = countryByName.get(normalize(name));
  if (!country || !map || !geoData) return;
  const feature = featureForCountry(country);
  if (!feature) {
    const message = language === "de"
      ? `„${displayName(country)}“ ist auf dieser Karte nicht als Fläche enthalten (zu klein oder fehlt in den Kartendaten).`
      : `${displayName(country)} is not shown as a selectable area on this map (it may be too small or missing from the map data).`;
    setMapStatus(message, { warn: true });
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
  map.fitBounds(bounds, { maxZoom: country.isTerritory ? 7 : 5, padding: 40, duration: 900 });
  showCountrySidebar(country);
}

// Geographic adjustments for map boundaries
const OVERSEAS_PARTS = {
  FRA: [
    { code: "gf", bbox: [-55, 2, -51, 6] },
    { code: "gp", bbox: [-62, 15.8, -61, 16.6] },
    { code: "mq", bbox: [-61.3, 14.3, -60.7, 15] },
    { code: "mf", bbox: [-63.2, 18, -62.9, 18.2] },
    { code: "bl", bbox: [-63, 17.8, -62.7, 17.99] },
    { code: "re", bbox: [54, -22, 56, -20] },
    { code: "yt", bbox: [44, -14, 46, -12] },
  ],
};

// Clip a polygon ring at a meridian; this prevents geometry crossing map boundaries.
function clipRingAtLongitude(ring, longitude, keepWest) {
  if (!Array.isArray(ring) || ring.length < 4) return [];
  const inside = ([x]) => keepWest ? x <= longitude : x >= longitude;
  const intersection = (a, b) => {
    const t = (longitude - a[0]) / (b[0] - a[0]);
    return [longitude, a[1] + t * (b[1] - a[1])];
  };
  const input = ring.slice(0, -1);
  const output = [];
  let previous = input[input.length - 1];
  let previousInside = inside(previous);
  for (const current of input) {
    const currentInside = inside(current);
    if (currentInside) {
      if (!previousInside) output.push(intersection(previous, current));
      output.push(current);
    } else if (previousInside) {
      output.push(intersection(previous, current));
    }
    previous = current;
    previousInside = currentInside;
  }
  if (output.length < 3) return [];
  output.push(output[0]);
  return output;
}

function splitCountryByLongitude(feature, longitude, westContinent, eastContinent) {
  const west = [];
  const east = [];
  for (const polygon of feature.geometry.coordinates) {
    const outerRing = polygon[0] || [];
    if (outerRing.length && outerRing.every(([x]) => x < -90)) {
      east.push(polygon);
      continue;
    }
    const westRings = polygon.map((ring) => clipRingAtLongitude(ring, longitude, true)).filter((ring) => ring.length);
    const eastRings = polygon.map((ring) => clipRingAtLongitude(ring, longitude, false)).filter((ring) => ring.length);
    if (westRings.length) west.push(westRings);
    if (eastRings.length) east.push(eastRings);
  }
  return [
    ...(west.length ? [{ ...feature, geometry: { type: "MultiPolygon", coordinates: west }, properties: { ...feature.properties, continentOverride: westContinent } }] : []),
    ...(east.length ? [{ ...feature, geometry: { type: "MultiPolygon", coordinates: east }, properties: { ...feature.properties, continentOverride: eastContinent } }] : []),
  ];
}

// Separate selected overseas regions and split Russia/Türkiye at their Europe–Asia boundary.
function splitOverseasParts(features) {
  const main = [];
  const extra = [];
  for (const feature of features) {
    if (feature.id === "RUS" && feature.geometry?.type === "MultiPolygon") {
      extra.push(...splitCountryByLongitude(feature, 60, "Europa", "Asien"));
      continue;
    }
    if (feature.id === "TUR" && feature.geometry?.type === "MultiPolygon") {
      extra.push(...splitCountryByLongitude(feature, 29, "Europa", "Asien"));
      continue;
    }
    const rules = typeof TERRITORIES === "undefined" ? null : OVERSEAS_PARTS[feature.id];
    if (!rules || !feature.geometry || feature.geometry.type !== "MultiPolygon") {
      main.push(feature);
      continue;
    }
    const keep = [];
    const groups = new Map();
    for (const polygon of feature.geometry.coordinates) {
      const ring = polygon[0] || [];
      const xs = ring.map((pt) => pt[0]);
      const ys = ring.map((pt) => pt[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const rule = rules.find((r) => cx >= r.bbox[0] && cx <= r.bbox[2] && cy >= r.bbox[1] && cy <= r.bbox[3]);
      if (!rule) keep.push(polygon);
      else (groups.get(rule) || groups.set(rule, []).get(rule)).push(polygon);
    }
    const parts = [];
    for (const [rule, polygons] of groups) {
      const t = TERRITORIES.find((x) => x.code === rule.code);
      if (!t) {
        keep.push(...polygons);
        continue;
      }
      parts.push({
        ...feature,
        id: t.iso3,
        geometry: { type: "MultiPolygon", coordinates: polygons },
        properties: {
          ...feature.properties,
          ADMIN: t.name, name: t.name,
          ADM0_A3: t.iso3, ISO_A3: t.iso3, ISO_A3_EH: t.iso3, ISO_A2: t.code.toUpperCase(),
        },
      });
    }
    if (keep.length) main.push({ ...feature, geometry: { type: "MultiPolygon", coordinates: keep } });
    extra.push(...parts);
  }
  return [...main, ...extra];
}

// Shift the map date line
const DATE_LINE = -169;
const DATE_LINE_SHIFT = DATE_LINE + 180;
const SEAM_X = 180 - DATE_LINE_SHIFT;

function shiftRingX(ring, dx) {
  return ring.map(([x, ...rest]) => [x + dx, ...rest]);
}

function rotatePolygon(polygon) {
  const outer = polygon[0] || [];
  if (!outer.length) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const [x] of outer) {
    if (x < min) min = x;
    if (x > max) max = x;
  }
  const eastShift = -DATE_LINE_SHIFT;
  const westShift = 360 - DATE_LINE_SHIFT;
  if (min >= DATE_LINE) return [polygon.map((r) => shiftRingX(r, eastShift))];
  if (max <= DATE_LINE) return [polygon.map((r) => shiftRingX(r, westShift))];
  const parts = [];
  for (const [keepWest, shift] of [[false, eastShift], [true, westShift]]) {
    const outerClip = clipRingAtLongitude(outer, DATE_LINE, keepWest);
    if (!outerClip.length) continue;
    const holes = polygon.slice(1).map((r) => clipRingAtLongitude(r, DATE_LINE, keepWest)).filter((r) => r.length);
    parts.push([outerClip, ...holes].map((r) => shiftRingX(r, shift)));
  }
  return parts;
}

// Shift polygon coordinates so the map's date line does not cut through the chosen center.
function rotateWorld(features) {
  return features.map((feature) => {
    const g = feature.geometry;
    if (!g) return feature;
    if (g.type === "Polygon") {
      const parts = rotatePolygon(g.coordinates);
      return {
        ...feature,
        geometry: parts.length === 1 ? { type: "Polygon", coordinates: parts[0] } : { type: "MultiPolygon", coordinates: parts },
      };
    }
    if (g.type === "MultiPolygon") {
      return { ...feature, geometry: { type: "MultiPolygon", coordinates: g.coordinates.flatMap(rotatePolygon) } };
    }
    return feature;
  });
}

// Build boundary lines while omitting the artificial seam created by the date-line shift.
function outlineCollection(collection) {
  const isSeam = (a, b) => Math.abs(a[0] - SEAM_X) < 1e-6 && Math.abs(b[0] - SEAM_X) < 1e-6;
  const features = [];
  for (const feature of collection.features) {
    const g = feature.geometry;
    if (!g || isBaikonur(feature)) continue; // no outline circle around Baikonur
    const polygons = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    const lines = [];
    for (const polygon of polygons) {
      for (const ring of polygon) {
        let line = [];
        for (let i = 0; i < ring.length; i++) {
          const point = ring[i];
          if (!line.length) { line.push(point); continue; }
          if (isSeam(ring[i - 1], point)) {
            if (line.length > 1) lines.push(line);
            line = [point];
          } else {
            line.push(point);
          }
        }
        if (line.length > 1) lines.push(line);
      }
    }
    if (lines.length) features.push({ type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: lines } });
  }
  return { type: "FeatureCollection", features };
}

// Natural Earth cuts the Baikonur circle out of Kazakhstan; close that hole so the area is plain Kazakhstan.
function fillKazakhstanHole(features) {
  for (let i = features.length - 1; i >= 0; i--) {
    if (isBaikonur(features[i])) { features.splice(i, 1); continue; }
    const f = features[i];
    if (f.properties && f.properties.ADM0_A3 === "KAZ" && f.geometry) {
      const g = f.geometry;
      if (g.type === "Polygon") g.coordinates = [g.coordinates[0]];
      else if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map((p) => [p[0]]);
    }
  }
}

let outlineCache = null;
function outlineData(collection) {
  if (!outlineCache) outlineCache = outlineCollection(collection);
  return outlineCache;
}

// Load map data
// Download and normalize Natural Earth GeoJSON, then apply the map-specific geometry fixes.
async function fetchGeo() {
  if (geoData) return geoData;

  let response;
  try {
    response = await fetch(GEOJSON_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(language === "de" ? `Kartendaten: HTTP ${response.status}` : `Map data: HTTP ${response.status}`);
    if ("caches" in window) {
      caches.open("fotw-map-data-v1")
        .then((cache) => cache.put(GEOJSON_URL, response.clone()))
        .catch((error) => console.warn("Map data could not be cached:", error));
    }
  } catch (networkError) {
    const cachedResponse = "caches" in window ? await caches.match(GEOJSON_URL).catch(() => null) : null;
    if (!cachedResponse) throw networkError;
    response = cachedResponse;
    console.info("Natural Earth: using cached map boundaries (offline fallback).");
  }

  const raw = await response.json();
  if (!raw || raw.type !== "FeatureCollection" || !Array.isArray(raw.features)) {
    throw new Error(language === "de" ? "Ungültiges GeoJSON-Format" : "Invalid GeoJSON format");
  }

  const features = raw.features
    .filter((feature) => feature && feature.geometry)
    .map((feature) => {
      const properties = feature.properties || {};
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

  if (features.length < 150) throw new Error(language === "de" ? "Zu wenige Ländergrenzen geladen" : "Not enough country boundaries were loaded");
  fillKazakhstanHole(features);
  geoData = { type: "FeatureCollection", features: rotateWorld(splitOverseasParts(features)) };
  outlineCache = null;
  console.info(`Natural Earth: ${features.length} Ländergrenzen geladen`);
  return geoData;
}

// Initialize the map only when needed and reuse any initialization already in progress.
async function startMap() {
  if (mapStarted) return;
  if (mapStartPromise) return mapStartPromise;

  mapStartPromise = Promise.resolve().then(async () => {
    setMapStatus(language === "de" ? "Lade Karte …" : "Loading map …");

    try {
      if (!maplibregl) {
        try {
          maplibregl = await import(MAPLIBRE_URL);
        } catch (error) {
          throw new Error("maplibre", { cause: error });
        }
      }
      if (!map) await createMap();
      await Promise.all([dataReady, fetchGeo()]);
      if (!items.some((c) => c.iso3 || ISO3_BY_CODE[c.code])) throw new Error("no-country-codes");
      buildLayer();
      renderLegend();
      updateMapSuggestions();
      map.resize();
      mapStarted = true;
      hideMapStatus();
    } catch (err) {
      console.warn(language === "de" ? "Karte konnte nicht geladen werden:" : "Could not load map:", err);
      mapStarted = false;

      if (map) {
        try { map.remove(); } catch (removeError) {
          console.warn("Fehlerhafte Karteninstanz konnte nicht entfernt werden:", removeError);
        }
      }
      map = null;
      mapInteractionsReady = false;
      hoveredFeatureId = null;
      featureIdByCode.clear();

      const msg =
        err.message === "no-country-codes"
          ? (language === "de" ? "Die ISO-Ländercodes für die Kartenzuordnung konnten nicht ermittelt werden." : "Could not determine ISO country codes for the map.")
          : err.message === "maplibre"
          ? (language === "de" ? "Die Kartenbibliothek (MapLibre GL JS) konnte nicht geladen werden." : "The map library (MapLibre GL JS) could not be loaded.")
          : (language === "de" ? "Die Karte konnte nicht geladen werden." : "The map could not be loaded.");
      const detail = err && err.message ? ` (${err.message})` : "";
      setMapStatus(msg + detail, { warn: true, retry: true });
    }
  }).finally(() => {
    mapStartPromise = null;
  });

  return mapStartPromise;
}

// Map interactions and view navigation
document.getElementById("sidebar-close")?.addEventListener("click", hideCountrySidebar);
mapStatusEl.addEventListener("click", async (e) => {
  const retryButton = e.target.closest(".retry");
  if (!retryButton) return;

  retryButton.disabled = true;
  retryButton.textContent = language === "de" ? "Wird erneut versucht …" : "Retrying …";
  await startMap();
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
    const exact = allMapEntries().find((country) =>
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
  viewQuiz.hidden = name !== "quiz";

  if (name === "map") {
    startMap();
    if (map) setTimeout(() => map.resize(), 0);
  }
  if (updateHash) {
    try {
      history.replaceState(null, "", name === "map" ? "#karte" : name === "quiz" ? "#quiz" : location.pathname + location.search);
    } catch (_) {  }
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

window.addEventListener("hashchange", () => showView(location.hash === "#karte" ? "map" : location.hash === "#quiz" ? "quiz" : "flags", false));
if (location.hash === "#karte") showView("map", false);
else if (location.hash === "#quiz") showView("quiz", false);
