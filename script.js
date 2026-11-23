// =====================================================================
// Flags of the World – Daten kommen live von der countries.dev API.
// data.js dient nur noch als Offline-Fallback und liefert die deutschen
// Hauptstadtnamen (die API kennt Hauptstädte nur auf Englisch).
// =====================================================================

const API_URL =
  "https://countries.dev/countries?fields=name,alpha2Code,alpha3Code,capital,region,subregion,area,population,topLevelDomain,independent";
const CACHE_KEY = "flags-of-the-world:countries:v4";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Stunden
const FETCH_TIMEOUT_MS = 10000;

function storageGet(key) {
  try { return localStorage.getItem(key); }
  catch (_) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (_) { return false; }
}

// Reihenfolge der Kontinente (für Filter und Kontinent-Sortierung)
const CONTINENTS = ["Europa", "Asien", "Afrika", "Nordamerika", "Südamerika", "Ozeanien"];


let language = storageGet("fotw-language");
if (language !== "de" && language !== "en") language = "de";
const I18N = {
  de: { capital:"Hauptstadt", continent:"Kontinent", domain:"Domain-Endung", area:"Fläche", population:"Einwohner", density:"Bevölkerungsdichte", code:"Ländercode", details:"Mehr Details", countries:"Länder", of:"von", all:"Alle", noData:"ohne Daten", noResults:"Keine Treffer. Versuch einen anderen Suchbegriff oder Filter. 🔎", search:"Land, Hauptstadt oder Domain-Endung suchen …", hint:"Klicke auf ein Land für Flagge und Infos. Mit Mausrad oder Pinch zoomen, mit gedrückter Maustaste verschieben.", loading:"Lade Länderdaten …", retry:"Erneut versuchen", live:"Live-Daten von countries.dev", cached:"Daten von countries.dev (Stand {time})", stale:"Online-Abruf fehlgeschlagen – zeige gespeicherte Daten vom {time}.", offline:"Online-Abruf fehlgeschlagen – zeige mitgelieferte Offline-Daten.", offlineSource:"Offline-Daten", cachedSource:"Zwischengespeicherte Daten", sort:"Sortieren nach", mapColor:"Einfärben nach", mapJump:"Zu Land springen", mapJumpPlaceholder:"Landesnamen eingeben …", searchLabel:"Suche", continentFilters:"Kontinent-Filter", flags:"Flaggen", map:"Karte", view:"Ansicht", controls:"Suche, Filter und Sortierung", mapSettings:"Karten-Einstellungen", worldMap:"Interaktive Weltkarte", legend:"Legende", close:"Schließen", flagAlt:"Flagge von {name}" },
  en: { capital:"Capital", continent:"Continent", domain:"Domain suffix", area:"Area", population:"Population", density:"Population density", code:"Country code", details:"More details", countries:"countries", of:"of", all:"All", noData:"no data", noResults:"No results. Try another search term or filter. 🔎", search:"Search country, capital or domain suffix …", hint:"Click a country to see its flag and information. Zoom with the wheel or pinch; drag to move.", loading:"Loading country data …", retry:"Try again", live:"Live data from countries.dev", cached:"Data from countries.dev (as of {time})", stale:"Could not reach the API – showing saved data from {time}.", offline:"Could not reach the API – showing bundled offline data.", offlineSource:"Offline data", cachedSource:"Cached data", sort:"Sort by", mapColor:"Color by", mapJump:"Jump to country", mapJumpPlaceholder:"Enter a country name …", searchLabel:"Search", continentFilters:"Filter by continent", flags:"Flags", map:"Map", view:"View", controls:"Search, filters and sorting", mapSettings:"Map settings", worldMap:"Interactive world map", legend:"Legend", close:"Close", flagAlt:"Flag of {name}" }
};
const tr = key => I18N[language][key] || key;
const localized = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), tr(key));
function displayName(c) { return language === "en" ? (new Intl.DisplayNames(["en"], {type:"region"}).of(c.code.toUpperCase()) || c.name) : c.name; }
function continentLabel(value) { return language === "de" ? value : ({Europa:"Europe",Asien:"Asia",Afrika:"Africa",Nordamerika:"North America",Südamerika:"South America",Ozeanien:"Oceania"}[value] || value); }
function applyPreferences() {
  document.documentElement.lang = language;
  collator = new Intl.Collator(language, { sensitivity: "base" });
  nf = new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US");
  document.getElementById("search").placeholder = tr("search");
  document.getElementById("empty").textContent = tr("noResults");
  document.querySelector(".subtitle").textContent = language === "de" ? "Alle Flaggen der Welt mit Ländernamen und Hauptstädten" : "All flags of the world with country names and capitals";
  document.querySelector('label[for="sort"]').textContent = language === "de" ? "Sortieren nach" : "Sort by";
  document.querySelector('label[for="map-color"]').textContent = language === "de" ? "Einfärben nach" : "Color by";
  document.querySelector('label[for="map-jump"]').textContent = language === "de" ? "Zu Land springen" : "Jump to country";
  document.getElementById("map-jump").placeholder = language === "de" ? "Landesnamen eingeben …" : "Enter a country name …";
  document.getElementById("sort").innerHTML = language === "de" ? '<option value="name-asc">Alphabet (A–Z)</option><option value="name-desc">Alphabet (Z–A)</option><option value="continent">Kontinent</option><option value="area-desc">Größe (größte zuerst)</option><option value="area-asc">Größe (kleinste zuerst)</option><option value="pop-desc">Einwohner (meiste zuerst)</option><option value="pop-asc">Einwohner (wenigste zuerst)</option>' : '<option value="name-asc">Alphabetical (A–Z)</option><option value="name-desc">Alphabetical (Z–A)</option><option value="continent">Continent</option><option value="area-desc">Area (largest first)</option><option value="area-asc">Area (smallest first)</option><option value="pop-desc">Population (largest first)</option><option value="pop-asc">Population (smallest first)</option>';
  document.getElementById("map-color").innerHTML = language === "de" ? '<option value="continent">Kontinent</option><option value="population">Einwohnerzahl</option><option value="area">Fläche</option>' : '<option value="continent">Continent</option><option value="population">Population</option><option value="area">Area</option>';
  document.querySelector(".map-hint").textContent = tr("hint");
  document.getElementById("language-toggle").textContent = language === "de" ? "DE / EN" : "EN / DE";
  document.title = language === "de" ? "Flags of the World – Alle Flaggen, Länder & Hauptstädte" : "Flags of the World – Countries, Flags & Capitals";
  document.querySelector('meta[name="description"]').content = language === "de"
    ? "Alle Flaggen der Welt mit Ländernamen und Hauptstädten – durchsuchbar, filterbar und sortierbar, dazu eine interaktive Weltkarte."
    : "Explore the flags, countries and capitals of the world. Search, filter and sort countries or explore them on an interactive world map.";
  document.querySelector(".tabs").setAttribute("aria-label", tr("view"));
  document.getElementById("tab-flags").textContent = `🏳️ ${tr("flags")}`;
  document.getElementById("tab-map").textContent = `🗺️ ${tr("map")}`;
  document.querySelector("#view-flags .controls").setAttribute("aria-label", tr("controls"));
  document.getElementById("search").setAttribute("aria-label", tr("searchLabel"));
  document.getElementById("filters").setAttribute("aria-label", tr("continentFilters"));
  document.getElementById("grid").setAttribute("aria-label", tr("flags"));
  document.querySelector("#view-map .map-toolbar").setAttribute("aria-label", tr("mapSettings"));
  document.getElementById("map").setAttribute("aria-label", tr("worldMap"));
  document.getElementById("map-legend").setAttribute("aria-label", tr("legend"));
  document.getElementById("sidebar-close").setAttribute("aria-label", tr("close"));
  document.getElementById("modal-close").setAttribute("aria-label", tr("close"));
  document.getElementById("footer-description").textContent = language === "de"
    ? "Die Flaggen, Länder und Hauptstädte der Welt – übersichtlich an einem Ort."
    : "Explore the flags, countries and capitals of the world – all in one place.";
  document.getElementById("footer-sources-title").textContent = language === "de" ? "Daten & Quellen" : "Data & sources";
  document.getElementById("footer-country-data").textContent = language === "de" ? " – Länderdaten" : " – country data";
  document.getElementById("footer-flags").textContent = language === "de" ? " – Flaggen" : " – flags";
  document.getElementById("footer-maps").textContent = language === "de" ? " – Kartenbibliothek" : " – mapping library";
  document.getElementById("footer-boundaries").textContent = language === "de" ? " – Ländergrenzen" : " – country boundaries";
  render(); renderFilters();
  document.dispatchEvent(new CustomEvent("language-changed"));
}
document.getElementById("language-toggle").addEventListener("click", () => {
  language = language === "de" ? "en" : "de";
  storageSet("fotw-language", language);
  applyPreferences();
});
function setTheme(value) {
  document.documentElement.dataset.theme = value;
  document.getElementById("theme-toggle").textContent = value === "dark" ? "☀️ Light" : "🌙 Dark";
  storageSet("fotw-theme", value);
}
const savedTheme = storageGet("fotw-theme");
setTheme(savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark");
document.getElementById("theme-toggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

const state = {
  query: "",
  continent: "Alle",
  sort: "name-asc",
};

let items = [];

let collator = new Intl.Collator(language, { sensitivity: "base" });
let nf = new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US");

// Lokale Daten (Fallback + deutsche Hauptstädte), nach Ländercode
const LOCAL = new Map(COUNTRIES.map((c) => [c.code, c]));

// ---------- Hilfsfunktionen ----------

// Suchtext normalisieren: Kleinbuchstaben, ohne Akzente, ß → ss
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function fallbackTld(code) {
  return code === "gb" ? ".uk" : `.${code}`;
}

function withSearchText(c) {
  const englishName = new Intl.DisplayNames(["en"], { type: "region" }).of(c.code.toUpperCase()) || c.name;
  return { ...c, searchText: normalize(`${c.name} ${englishName} ${c.capital} ${c.capitalEn || ""} ${c.code} ${c.tld}`) };
}

// ---------- Daten laden ----------

// Antwort der countries.dev API in unser Format übersetzen
function mapApiCountry(c) {
  const code = String(c.alpha2Code || "").toLowerCase();
  if (!code) return null;
  const local = LOCAL.get(code);

  let continent;
  switch (c.region) {
    case "Europe": continent = "Europa"; break;
    case "Asia": continent = "Asien"; break;
    case "Africa": continent = "Afrika"; break;
    case "Oceania": continent = "Ozeanien"; break;
    case "Americas":
      continent = c.subregion === "South America" ? "Südamerika" : "Nordamerika";
      break;
    default: continent = local ? local.continent : null;
  }
  if (!continent) return null;

  return {
    code,
    iso3: c.alpha3Code || null, // wird für die Zuordnung zur Weltkarte gebraucht
    name: (local && local.name) || c.name || code.toUpperCase(),
    capital: (local && local.capital) || (c.capital && c.capital[0]) || "–",
    capitalEn: (c.capital && c.capital[0]) || (local && local.capital) || "–",
    continent,
    area: typeof c.area === "number" ? c.area : local ? local.area : 0,
    population: typeof c.population === "number" ? c.population : local ? local.population : 0,
    tld: (c.topLevelDomain && c.topLevelDomain[0]) || fallbackTld(code),
  };
}

// Basis sind die mitgelieferten 197 Länder aus data.js. Die API liefert nur die
// aktuellen Werte dazu. So fehlt kein Land (und keins bleibt auf der Karte
// leer), auch wenn die API eins auslässt oder anders kennzeichnet.
function parseApiResponse(data) {
  if (!Array.isArray(data)) throw new Error("Unerwartetes Antwortformat");
  const byCode = new Map();
  for (const c of data) {
    const mapped = mapApiCountry(c);
    if (mapped) byCode.set(mapped.code, mapped);
  }
  if (COUNTRIES.filter((c) => byCode.has(c.code)).length < 150) {
    throw new Error("Zu wenige Länder in der Antwort");
  }
  return COUNTRIES.map((local) => byCode.get(local.code) || { ...local, tld: fallbackTld(local.code) });
}

async function fetchCountries() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseApiResponse(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

function readCache() {
  try {
    const raw = JSON.parse(storageGet(CACHE_KEY));
    const validTimestamp =
      raw && Number.isFinite(raw.time) && raw.time > 0 && raw.time <= Date.now() + 5 * 60 * 1000;
    const validData =
      raw &&
      Array.isArray(raw.data) &&
      raw.data.length >= 150 &&
      raw.data.every((country) =>
        country &&
        typeof country.code === "string" &&
        typeof country.name === "string" &&
        typeof country.capital === "string" &&
        typeof country.continent === "string" &&
        typeof country.tld === "string" &&
        Number.isFinite(country.area) &&
        Number.isFinite(country.population)
      );

    if (validTimestamp && validData) return raw;
  } catch (_) { /* Cache nicht verfügbar oder ungültiges JSON */ }
  return null;
}

function writeCache(data) {
  try {
    storageSet(CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
  } catch (_) { /* z. B. privater Modus */ }
}

function offlineFallback() {
  return COUNTRIES.map((c) => ({ ...c, tld: fallbackTld(c.code) }));
}

// Reihenfolge: frischer Cache → Live-API → alter Cache → mitgelieferte Daten.
// Bei einem erzwungenen Abruf wird der Cache übersprungen, aber nicht vorab gelöscht:
// So bleibt er als Fallback erhalten, falls die API nicht erreichbar ist.
async function loadData(forceReload = false) {
  const cached = readCache();
  if (!forceReload && cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return { list: cached.data, source: "cache", time: cached.time };
  }
  try {
    const list = await fetchCountries();
    writeCache(list);
    return { list, source: "live", time: Date.now() };
  } catch (err) {
    console.warn("Online-Abruf fehlgeschlagen:", err);
    if (cached) return { list: cached.data, source: "stale", time: cached.time };
    return { list: offlineFallback(), source: "offline", time: null };
  }
}

// ---------- Sortierung & Filter ----------

const SORTERS = {
  "name-asc": (a, b) => collator.compare(a.name, b.name),
  "name-desc": (a, b) => collator.compare(b.name, a.name),
  continent: (a, b) =>
    CONTINENTS.indexOf(a.continent) - CONTINENTS.indexOf(b.continent) ||
    collator.compare(a.name, b.name),
  "area-desc": (a, b) => b.area - a.area,
  "area-asc": (a, b) => a.area - b.area,
  "pop-desc": (a, b) => b.population - a.population,
  "pop-asc": (a, b) => a.population - b.population,
};

function getVisible() {
  const q = normalize(state.query);
  return items
    .filter((c) => state.continent === "Alle" || c.continent === state.continent)
    .filter((c) => !q || c.searchText.includes(q))
    .sort(SORTERS[state.sort]);
}

function flagUrl(code, width) {
  return `https://flagcdn.com/w${width}/${code}.png`;
}

function formatArea(km2) {
  const formatter = new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", { maximumFractionDigits: 1 });
  return `${formatter.format(km2 < 1 ? km2 : Math.round(km2))} km²`;
}

// ---------- Rendering ----------
const grid = document.getElementById("grid");
const countEl = document.getElementById("count");
const emptyEl = document.getElementById("empty");
const statusEl = document.getElementById("status");
const sourceEl = document.getElementById("source");

function render() {
  const list = getVisible();

  countEl.textContent =
    list.length === items.length
      ? `${list.length} ${tr("countries")}`
      : `${list.length} ${tr("of")} ${items.length} ${tr("countries")}`;
  emptyEl.hidden = list.length > 0 || items.length === 0;

  grid.replaceChildren();
  const frag = document.createDocumentFragment();

  for (const c of list) {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.dataset.code = c.code;
    const flagBox = document.createElement("div");
    flagBox.className = "flag-box";
    const flag = document.createElement("img");
    flag.loading = "lazy";
    flag.src = flagUrl(c.code, 320);
    flag.srcset = `${flagUrl(c.code, 320)} 1x, ${flagUrl(c.code, 640)} 2x`;
    flag.alt = localized("flagAlt", { name: displayName(c) });
    flagBox.appendChild(flag);

    const body = document.createElement("div");
    body.className = "card-body";
    const title = document.createElement("h3");
    title.textContent = displayName(c);
    const capital = document.createElement("p");
    capital.className = "capital";
    capital.textContent = `${tr("capital")}: ${language === "en" ? (c.capitalEn || c.capital) : c.capital}`;
    const tags = document.createElement("div");
    tags.className = "tags";
    const continent = document.createElement("span");
    continent.className = "continent";
    continent.textContent = continentLabel(c.continent);
    const tld = document.createElement("span");
    tld.className = "tld";
    tld.textContent = c.tld;
    tags.append(continent, tld);
    body.append(title, capital, tags);
    card.append(flagBox, body);
    frag.appendChild(card);
  }
  grid.appendChild(frag);
}

// ---------- Kontinent-Filter ----------
const filtersEl = document.getElementById("filters");

function renderFilters() {
  const counts = { Alle: items.length };
  for (const c of items) counts[c.continent] = (counts[c.continent] || 0) + 1;

  filtersEl.replaceChildren();
  for (const name of ["Alle", ...CONTINENTS]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (state.continent === name ? " active" : "");
    btn.setAttribute("aria-pressed", state.continent === name);
    const label = document.createElement("span");
    label.textContent = name === "Alle" ? tr("all") : continentLabel(name);
    const count = document.createElement("small");
    count.textContent = String(counts[name] || 0);
    btn.append(label, count);
    btn.addEventListener("click", () => {
      state.continent = name;
      renderFilters();
      render();
    });
    filtersEl.appendChild(btn);
  }
}

// ---------- Status / Datenquelle ----------
function formatTime(ts) {
  return new Date(ts).toLocaleString(language === "de" ? "de-DE" : "en-US", { dateStyle: "short", timeStyle: "short" });
}

function setDataStatus(message, { warn = false, retry = false } = {}) {
  statusEl.className = "status" + (warn ? " warn" : "");
  statusEl.replaceChildren();
  const text = document.createElement("span");
  text.textContent = message;
  statusEl.appendChild(text);

  if (retry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "retry";
    button.textContent = tr("retry");
    statusEl.append(" ", button);
  }
  statusEl.hidden = false;
}

function showSource({ source, time }) {
  statusEl.hidden = true;
  statusEl.replaceChildren();

  if (source === "live") {
    sourceEl.textContent = tr("live");
  } else if (source === "cache") {
    sourceEl.textContent = localized("cached", { time: formatTime(time) });
  } else if (source === "stale") {
    setDataStatus(localized("stale", { time: formatTime(time) }), { warn: true, retry: true });
    sourceEl.textContent = tr("cachedSource");
  } else {
    setDataStatus(tr("offline"), { warn: true, retry: true });
    sourceEl.textContent = tr("offlineSource");
  }
}

let dataInitPromise = null;
async function init(forceReload = false) {
  if (dataInitPromise) return dataInitPromise;

  dataInitPromise = (async () => {
    statusEl.className = "status";
    statusEl.textContent = tr("loading");
    statusEl.hidden = false;

    const result = await loadData(forceReload);
    items = result.list.map(withSearchText);
    showSource(result);
    renderFilters();
    render();
    updateSuggestions();
    document.dispatchEvent(new CustomEvent("countries-updated"));
  })();

  try {
    await dataInitPromise;
  } finally {
    dataInitPromise = null;
  }
}

statusEl.addEventListener("click", (e) => {
  if (e.target.closest(".retry")) init(true);
});

// ---------- Suche & Sortierung ----------
let searchTimer;
document.getElementById("search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = e.target.value;
    render();
  }, 120);
});

document.getElementById("sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});

// ---------- Detail-Ansicht ----------
const modal = document.getElementById("modal");
const modalFlag = document.getElementById("modal-flag");
const modalTitle = document.getElementById("modal-title");
const modalInfo = document.getElementById("modal-info");
let lastFocus = null;

function openModal(code) {
  const c = items.find((x) => x.code === code);
  if (!c) return;
  lastFocus = document.activeElement;

  modalFlag.src = flagUrl(c.code, 640);
  modalFlag.alt = localized("flagAlt", { name: displayName(c) });
  modalTitle.textContent = displayName(c);

  const density = c.area > 0 ? c.population / c.area : 0;
  const rows = [
    [tr("capital"), language === "en" ? (c.capitalEn || c.capital) : c.capital],
    [tr("continent"), c.continent],
    [tr("domain"), c.tld],
    [tr("area"), formatArea(c.area)],
    [tr("population"), `${language === "de" ? "ca. " : "approx. "}${nf.format(c.population)}`],
    [tr("density"), `${nf.format(Math.round(density))} / km²`],
    [tr("code"), c.code.toUpperCase()],
  ];
  modalInfo.replaceChildren();
  for (const [k, v] of rows) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = k;
    dd.textContent = v;
    modalInfo.append(dt, dd);
  }

  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.getElementById("modal-close").focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocus?.isConnected) lastFocus.focus();
}

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openModal(card.dataset.code);
});
document.getElementById("modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (modal.hidden) return;
  if (e.key === "Escape") {
    closeModal();
    return;
  }
  if (e.key !== "Tab") return;

  const dialog = modal.querySelector('[role="dialog"]');
  const focusable = Array.from(dialog.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) {
    e.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    e.preventDefault();
    first.focus();
  }
});

// ---------- Start ----------
// dataReady: Promise, auf den die Karte warten kann, bis die Länderdaten da sind
const dataReady = init();
const suggestionBox = document.getElementById("search-suggestions");
const searchInput = document.getElementById("search");
function updateSuggestions() {
  const q = normalize(searchInput.value);
  suggestionBox.replaceChildren();
  if (!q) { suggestionBox.hidden = true; searchInput.setAttribute("aria-expanded","false"); return; }
  const matches = items.filter(c => normalize(c.name + " " + displayName(c) + " " + c.capital + " " + (c.capitalEn || "") + " " + c.code + " " + c.tld).includes(q)).slice(0,7);
  for (const c of matches) {
    const b = document.createElement("button"); b.type = "button"; b.className = "suggestion"; b.setAttribute("role","option");
    const img = document.createElement("img"); img.src = flagUrl(c.code,80); img.alt = "";
    const name = document.createElement("span"); name.textContent = displayName(c);
    const capital = document.createElement("small"); capital.textContent = language === "en" ? (c.capitalEn || c.capital) : c.capital;
    b.append(img,name,capital);
    b.addEventListener("click", () => { searchInput.value = displayName(c); state.query = normalize(c.name); state.continent = "Alle"; suggestionBox.hidden = true; renderFilters(); render(); });
    suggestionBox.appendChild(b);
  }
  suggestionBox.hidden = matches.length === 0;
  searchInput.setAttribute("aria-expanded", matches.length ? "true" : "false");
}
searchInput.addEventListener("input", updateSuggestions);
document.addEventListener("click", e => { if (!e.target.closest(".search-wrap")) suggestionBox.hidden = true; });
applyPreferences();
