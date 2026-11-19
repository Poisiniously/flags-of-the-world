// =====================================================================
// Reiter-Navigation + interaktive Weltkarte (Leaflet)
//
// Die Länderformen (GeoJSON) werden online von jsDelivr geladen, die
// Länderdaten kommen aus script.js (items / dataReady). Ein Land auf der
// Karte wird über den ISO-3-Code (cca3) der REST Countries API zugeordnet.
// =====================================================================

const GEOJSON_URL = "https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json";
const GEO_TIMEOUT_MS = 20000;

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
let geoLayer = null;
let geoData = null;
let mapStarted = false;
let colorMode = "continent";

// ISO-3166-1-Zuordnung für die mitgelieferten Offline-Länderdaten.
// Die GeoJSON-Kartendaten verwenden ISO-3-Codes, data.js dagegen ISO-2-Codes.
const ISO3_BY_CODE = {
  "ad": "AND",
  "ae": "ARE",
  "af": "AFG",
  "ag": "ATG",
  "al": "ALB",
  "am": "ARM",
  "ao": "AGO",
  "ar": "ARG",
  "at": "AUT",
  "au": "AUS",
  "az": "AZE",
  "ba": "BIH",
  "bb": "BRB",
  "bd": "BGD",
  "be": "BEL",
  "bf": "BFA",
  "bg": "BGR",
  "bh": "BHR",
  "bi": "BDI",
  "bj": "BEN",
  "bn": "BRN",
  "bo": "BOL",
  "br": "BRA",
  "bs": "BHS",
  "bt": "BTN",
  "bw": "BWA",
  "by": "BLR",
  "bz": "BLZ",
  "ca": "CAN",
  "cd": "COD",
  "cf": "CAF",
  "cg": "COG",
  "ch": "CHE",
  "ci": "CIV",
  "cl": "CHL",
  "cm": "CMR",
  "cn": "CHN",
  "co": "COL",
  "cr": "CRI",
  "cu": "CUB",
  "cv": "CPV",
  "cy": "CYP",
  "cz": "CZE",
  "de": "DEU",
  "dj": "DJI",
  "dk": "DNK",
  "dm": "DMA",
  "do": "DOM",
  "dz": "DZA",
  "ec": "ECU",
  "ee": "EST",
  "eg": "EGY",
  "er": "ERI",
  "es": "ESP",
  "et": "ETH",
  "fi": "FIN",
  "fj": "FJI",
  "fm": "FSM",
  "fr": "FRA",
  "ga": "GAB",
  "gb": "GBR",
  "gd": "GRD",
  "ge": "GEO",
  "gh": "GHA",
  "gm": "GMB",
  "gn": "GIN",
  "gq": "GNQ",
  "gr": "GRC",
  "gt": "GTM",
  "gw": "GNB",
  "gy": "GUY",
  "hn": "HND",
  "hr": "HRV",
  "ht": "HTI",
  "hu": "HUN",
  "id": "IDN",
  "ie": "IRL",
  "il": "ISR",
  "in": "IND",
  "iq": "IRQ",
  "ir": "IRN",
  "is": "ISL",
  "it": "ITA",
  "jm": "JAM",
  "jo": "JOR",
  "jp": "JPN",
  "ke": "KEN",
  "kg": "KGZ",
  "kh": "KHM",
  "ki": "KIR",
  "km": "COM",
  "kn": "KNA",
  "kp": "PRK",
  "kr": "KOR",
  "kw": "KWT",
  "kz": "KAZ",
  "la": "LAO",
  "lb": "LBN",
  "lc": "LCA",
  "li": "LIE",
  "lk": "LKA",
  "lr": "LBR",
  "ls": "LSO",
  "lt": "LTU",
  "lu": "LUX",
  "lv": "LVA",
  "ly": "LBY",
  "ma": "MAR",
  "mc": "MCO",
  "md": "MDA",
  "me": "MNE",
  "mg": "MDG",
  "mh": "MHL",
  "mk": "MKD",
  "ml": "MLI",
  "mm": "MMR",
  "mn": "MNG",
  "mr": "MRT",
  "mt": "MLT",
  "mu": "MUS",
  "mv": "MDV",
  "mw": "MWI",
  "mx": "MEX",
  "my": "MYS",
  "mz": "MOZ",
  "na": "NAM",
  "ne": "NER",
  "ng": "NGA",
  "ni": "NIC",
  "nl": "NLD",
  "no": "NOR",
  "np": "NPL",
  "nr": "NRU",
  "nz": "NZL",
  "om": "OMN",
  "pa": "PAN",
  "pe": "PER",
  "pg": "PNG",
  "ph": "PHL",
  "pk": "PAK",
  "pl": "POL",
  "ps": "PSE",
  "pt": "PRT",
  "pw": "PLW",
  "py": "PRY",
  "qa": "QAT",
  "ro": "ROU",
  "rs": "SRB",
  "ru": "RUS",
  "rw": "RWA",
  "sa": "SAU",
  "sb": "SLB",
  "sc": "SYC",
  "sd": "SDN",
  "se": "SWE",
  "sg": "SGP",
  "si": "SVN",
  "sk": "SVK",
  "sl": "SLE",
  "sm": "SMR",
  "sn": "SEN",
  "so": "SOM",
  "sr": "SUR",
  "ss": "SSD",
  "st": "STP",
  "sv": "SLV",
  "sy": "SYR",
  "sz": "SWZ",
  "td": "TCD",
  "tg": "TGO",
  "th": "THA",
  "tj": "TJK",
  "tl": "TLS",
  "tm": "TKM",
  "tn": "TUN",
  "to": "TON",
  "tr": "TUR",
  "tt": "TTO",
  "tv": "TUV",
  "tw": "TWN",
  "tz": "TZA",
  "ua": "UKR",
  "ug": "UGA",
  "us": "USA",
  "uy": "URY",
  "uz": "UZB",
  "va": "VAT",
  "vc": "VCT",
  "ve": "VEN",
  "vn": "VNM",
  "vu": "VUT",
  "ws": "WSM",
  "ye": "YEM",
  "za": "ZAF",
  "zm": "ZMB",
  "zw": "ZWE",
};

let countryByCode = new Map();
let countryByIso3 = new Map();
let countryByName = new Map();
const layerByCode = new Map();

const viewFlags = document.getElementById("view-flags");
const viewMap = document.getElementById("view-map");
const mapStatusEl = document.getElementById("map-status");
const mapLegendEl = document.getElementById("map-legend");
const mapColorEl = document.getElementById("map-color");
const mapJumpEl = document.getElementById("map-jump");
const mapJumpList = document.getElementById("map-jump-list");

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
  // Kosovo hat in den Kartendaten keinen ISO-Code
  if (feature.properties && feature.properties.name === "Kosovo") {
    return countryByCode.get("xk") || null;
  }
  return countryByIso3.get(String(feature.id || "").toUpperCase()) || null;
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

function styleFor(feature) {
  const c = countryForFeature(feature);
  return {
    fillColor: c ? colorFor(c) : NEUTRAL_FILL,
    fillOpacity: c ? 0.85 : 0.5,
    color: "#0f1220",
    weight: 0.7,
  };
}

function renderLegend() {
  mapLegendEl.innerHTML = "";
  let title;
  let entries;
  if (colorMode === "continent") {
    title = "Kontinente";
    entries = CONTINENTS.map((n) => [CONTINENT_COLORS[n], n]);
  } else {
    title = SCALES[colorMode].title;
    entries = SCALES[colorMode].labels.map((l, i) => [SCALE_COLORS[i], l]);
  }
  entries.push([NEUTRAL_FILL, "ohne Daten"]);

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
  name.textContent = c.name;
  el.append(img, name);
  return el;
}

function popupContent(c) {
  const el = document.createElement("div");
  el.className = "popup";

  const img = document.createElement("img");
  img.className = "popup-flag";
  img.src = flagUrl(c.code, 160);
  img.alt = `Flagge von ${c.name}`;

  const h = document.createElement("strong");
  h.textContent = c.name;

  const lines = document.createElement("div");
  lines.className = "popup-lines";
  for (const [k, v] of [
    ["Hauptstadt", c.capital],
    ["Einwohner", `ca. ${nf.format(c.population)}`],
    ["Fläche", formatArea(c.area)],
    ["Domain", c.tld],
  ]) {
    const row = document.createElement("div");
    const key = document.createElement("span");
    key.textContent = k;
    const val = document.createElement("b");
    val.textContent = v;
    row.append(key, val);
    lines.appendChild(row);
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "popup-more";
  btn.textContent = "Mehr Details";
  btn.addEventListener("click", () => openModal(c.code));

  el.append(img, h, lines, btn);
  return el;
}

// ---------- Karte aufbauen ----------
function buildLayer() {
  rebuildLookup();
  if (geoLayer) map.removeLayer(geoLayer);
  layerByCode.clear();

  geoLayer = L.geoJSON(geoData, {
    style: styleFor,
    onEachFeature(feature, layer) {
      const c = countryForFeature(feature);
      if (!c) return;
      layerByCode.set(c.code, layer);

      layer.bindTooltip(() => tooltipContent(c), { sticky: true, direction: "top", className: "map-tooltip" });
      layer.bindPopup(() => popupContent(c), { minWidth: 190, maxWidth: 240 });
      layer.on({
        mouseover() {
          layer.setStyle({ weight: 2, color: "#ffffff", fillOpacity: 1 });
          layer.bringToFront();
        },
        mouseout() {
          geoLayer.resetStyle(layer);
        },
      });
    },
  }).addTo(map);
}

function createMap() {
  map = L.map("map", {
    minZoom: 1.5,
    maxZoom: 7,
    zoomSnap: 0.5,
    worldCopyJump: true,
    maxBounds: [[-85, -200], [85, 200]],
    maxBoundsViscosity: 0.8,
  }).setView([25, 10], 2);
}

function fillJumpList() {
  mapJumpList.innerHTML = "";
  const names = items.map((c) => c.name).sort((a, b) => collator.compare(a, b));
  for (const n of names) {
    const opt = document.createElement("option");
    opt.value = n;
    mapJumpList.appendChild(opt);
  }
}

function jumpTo(name) {
  const c = countryByName.get(normalize(name));
  if (!c || !map) return;
  const layer = layerByCode.get(c.code);
  if (!layer) {
    setMapStatus(`„${c.name}“ ist auf dieser Karte nicht als Fläche enthalten (zu klein oder fehlt in den Kartendaten).`, { warn: true });
    setTimeout(hideMapStatus, 5000);
    return;
  }
  hideMapStatus();
  map.fitBounds(layer.getBounds(), { maxZoom: 5, padding: [40, 40] });
  layer.openPopup(layer.getBounds().getCenter());
}

async function fetchGeo() {
  if (geoData) return geoData;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(GEOJSON_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
      throw new Error("Unerwartetes Kartenformat");
    }
    geoData = data;
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function startMap() {
  if (mapStarted) return;
  mapStarted = true;
  setMapStatus("Lade Karte …");

  try {
    if (typeof L === "undefined") throw new Error("leaflet");
    await dataReady;
    if (!items.some((c) => c.iso3 || ISO3_BY_CODE[c.code])) throw new Error("no-country-codes");
    await fetchGeo();

    if (!map) createMap();
    buildLayer();
    renderLegend();
    fillJumpList();
    hideMapStatus();
    map.invalidateSize();
  } catch (err) {
    console.warn("Karte konnte nicht geladen werden:", err);
    mapStarted = false;
    const msg =
      err.message === "no-country-codes"
        ? "Für die Karte werden die Live-Länderdaten benötigt, die Seite zeigt gerade Offline-Daten."
        : err.message === "leaflet"
        ? "Die Kartenbibliothek (Leaflet) konnte nicht geladen werden."
        : "Die Karte konnte nicht geladen werden.";
    setMapStatus(msg + RETRY_BTN, { warn: true, html: true });
  }
}

// ---------- Ereignisse ----------
mapStatusEl.addEventListener("click", async (e) => {
  if (!e.target.closest(".retry")) return;
  if (!items.some((c) => c.iso3)) await init(true);
  startMap();
});

mapColorEl.addEventListener("change", () => {
  colorMode = mapColorEl.value;
  if (geoLayer) geoLayer.setStyle(styleFor);
  renderLegend();
});

mapJumpEl.addEventListener("change", () => jumpTo(mapJumpEl.value));
mapJumpEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") jumpTo(mapJumpEl.value);
});

// Länderdaten wurden (neu) geladen → Karte aktualisieren
document.addEventListener("countries-updated", () => {
  if (map && geoData) {
    buildLayer();
    renderLegend();
    fillJumpList();
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
    if (map) setTimeout(() => map.invalidateSize(), 0);
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
