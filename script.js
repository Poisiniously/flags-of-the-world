// =====================================================================
// Flags of the World – Daten kommen live von der REST Countries API.
// data.js dient nur noch als Offline-Fallback und liefert die deutschen
// Hauptstadtnamen (die API kennt Hauptstädte nur auf Englisch).
// =====================================================================

const API_URL =
  "https://restcountries.com/v3.1/all?fields=cca2,cca3,translations,capital,region,subregion,area,population,tld,independent";
const CACHE_KEY = "flags-of-the-world:countries:v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Stunden
const FETCH_TIMEOUT_MS = 10000;

// Reihenfolge der Kontinente (für Filter und Kontinent-Sortierung)
const CONTINENTS = ["Europa", "Asien", "Afrika", "Nordamerika", "Südamerika", "Ozeanien"];


let language = localStorage.getItem("fotw-language") || "de";
const I18N = {
  de: { capital:"Hauptstadt", continent:"Kontinent", domain:"Domain-Endung", area:"Fläche", population:"Einwohner", density:"Bevölkerungsdichte", code:"Ländercode", details:"Mehr Details", countries:"Länder", of:"von", all:"Alle", noData:"ohne Daten", noResults:"Keine Treffer. Versuch einen anderen Suchbegriff oder Filter. 🔎", search:"Land, Hauptstadt oder Domain-Endung suchen …", hint:"Klicke auf ein Land für Flagge und Infos. Mit Mausrad oder Pinch zoomen, mit gedrückter Maustaste verschieben." },
  en: { capital:"Capital", continent:"Continent", domain:"Domain suffix", area:"Area", population:"Population", density:"Population density", code:"Country code", details:"More details", countries:"countries", of:"of", all:"All", noData:"no data", noResults:"No results. Try another search term or filter. 🔎", search:"Search country, capital or domain suffix …", hint:"Click a country to see its flag and information. Zoom with the wheel or pinch; drag to move." }
};
const tr = key => I18N[language][key] || key;
function displayName(c) { return language === "en" ? (new Intl.DisplayNames(["en"], {type:"region"}).of(c.code.toUpperCase()) || c.name) : c.name; }
function continentLabel(value) { return language === "de" ? value : ({Europa:"Europe",Asien:"Asia",Afrika:"Africa",Nordamerika:"North America",Südamerika:"South America",Ozeanien:"Oceania"}[value] || value); }
function applyPreferences() {
  document.documentElement.lang = language;
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
  render(); renderFilters();
  document.dispatchEvent(new CustomEvent("language-changed"));
}
document.getElementById("language-toggle").addEventListener("click", () => {
  language = language === "de" ? "en" : "de";
  localStorage.setItem("fotw-language", language);
  applyPreferences();
});
function setTheme(value) {
  document.documentElement.dataset.theme = value;
  document.getElementById("theme-toggle").textContent = value === "dark" ? "☀️ Light" : "🌙 Dark";
  localStorage.setItem("fotw-theme", value);
}
setTheme(localStorage.getItem("fotw-theme") || "dark");
document.getElementById("theme-toggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

const state = {
  query: "",
  continent: "Alle",
  sort: "name-asc",
};

let items = [];

const collator = new Intl.Collator("de", { sensitivity: "base" });
const nf = new Intl.NumberFormat("de-DE");

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

// Antwort der REST Countries API in unser Format übersetzen
function mapApiCountry(c) {
  const code = String(c.cca2 || "").toLowerCase();
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
    iso3: c.cca3 || null, // wird für die Zuordnung zur Weltkarte gebraucht
    name: (c.translations && c.translations.deu && c.translations.deu.common) ||
          (local && local.name) || code.toUpperCase(),
    capital: (local && local.capital) || (c.capital && c.capital[0]) || "–",
    capitalEn: (c.capital && c.capital[0]) || (local && local.capital) || "–",
    continent,
    area: typeof c.area === "number" ? c.area : local ? local.area : 0,
    population: typeof c.population === "number" ? c.population : local ? local.population : 0,
    tld: (c.tld && c.tld[0]) || fallbackTld(code),
  };
}

// Nur souveräne Staaten (+ Palästina als UN-Beobachterstaat)
function parseApiResponse(data) {
  if (!Array.isArray(data)) throw new Error("Unerwartetes Antwortformat");
  const list = data
    .filter((c) => c.independent !== false || String(c.cca2).toUpperCase() === "PS")
    .map(mapApiCountry)
    .filter(Boolean);
  if (list.length < 150) throw new Error("Zu wenige Länder in der Antwort");
  return list;
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
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (raw && Array.isArray(raw.data) && raw.data.length >= 150) return raw;
  } catch (_) { /* Cache nicht verfügbar */ }
  return null;
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
  } catch (_) { /* z. B. privater Modus */ }
}

function offlineFallback() {
  return COUNTRIES.map((c) => ({ ...c, tld: fallbackTld(c.code) }));
}

// Reihenfolge: frischer Cache → Live-API → alter Cache → mitgelieferte Daten
async function loadData() {
  const cached = readCache();
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
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
  return km2 < 1 ? `${km2.toString().replace(".", ",")} km²` : `${nf.format(Math.round(km2))} km²`;
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

  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const c of list) {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.dataset.code = c.code;
    card.innerHTML = `
      <div class="flag-box">
        <img loading="lazy" src="${flagUrl(c.code, 320)}"
             srcset="${flagUrl(c.code, 320)} 1x, ${flagUrl(c.code, 640)} 2x"
             alt="Flagge von ${c.name}" />
      </div>
      <div class="card-body">
        <h3></h3>
        <p class="capital"></p>
        <div class="tags">
          <span class="continent"></span>
          <span class="tld"></span>
        </div>
      </div>`;
    card.querySelector("h3").textContent = displayName(c);
    card.querySelector(".capital").textContent = `${tr("capital")}: ${language === "en" ? (c.capitalEn || c.capital) : c.capital}`;
    card.querySelector(".continent").textContent = continentLabel(c.continent);
    card.querySelector(".tld").textContent = c.tld;
    frag.appendChild(card);
  }
  grid.appendChild(frag);
}

// ---------- Kontinent-Filter ----------
const filtersEl = document.getElementById("filters");

function renderFilters() {
  const counts = { Alle: items.length };
  for (const c of items) counts[c.continent] = (counts[c.continent] || 0) + 1;

  filtersEl.innerHTML = "";
  for (const name of ["Alle", ...CONTINENTS]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (state.continent === name ? " active" : "");
    btn.setAttribute("aria-pressed", state.continent === name);
    btn.innerHTML = `${name === "Alle" ? tr("all") : name}<small>${counts[name] || 0}</small>`;
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
  return new Date(ts).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function showSource({ source, time }) {
  const retry = '<button type="button" class="retry">Erneut versuchen</button>';
  statusEl.className = "status";
  statusEl.hidden = true;

  if (source === "live") {
    sourceEl.textContent = "Live-Daten von REST Countries";
  } else if (source === "cache") {
    sourceEl.textContent = `Daten von REST Countries (Stand ${formatTime(time)})`;
  } else if (source === "stale") {
    statusEl.className = "status warn";
    statusEl.innerHTML = `Online-Abruf fehlgeschlagen – zeige gespeicherte Daten vom ${formatTime(time)}. ${retry}`;
    statusEl.hidden = false;
    sourceEl.textContent = "Zwischengespeicherte Daten";
  } else {
    statusEl.className = "status warn";
    statusEl.innerHTML = `Online-Abruf fehlgeschlagen – zeige mitgelieferte Offline-Daten. ${retry}`;
    statusEl.hidden = false;
    sourceEl.textContent = "Offline-Daten";
  }
}

async function init(forceReload = false) {
  statusEl.className = "status";
  statusEl.textContent = "Lade Länderdaten …";
  statusEl.hidden = false;
  if (forceReload) {
    try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
  }

  const result = await loadData();
  items = result.list.map(withSearchText);
  showSource(result);
  renderFilters();
  render();
  // Andere Ansichten (z. B. die Karte) können sich damit aktualisieren
  document.dispatchEvent(new CustomEvent("countries-updated"));
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
  modalFlag.alt = `Flagge von ${c.name}`;
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
  modalInfo.innerHTML = "";
  for (const [k, v] of rows) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = k;
    dd.textContent = v;
    modalInfo.append(dt, dd);
  }

  modal.hidden = false;
  document.getElementById("modal-close").focus();
}

function closeModal() {
  modal.hidden = true;
  if (lastFocus) lastFocus.focus();
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
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

// ---------- Start ----------
// dataReady: Promise, auf den die Karte warten kann, bis die Länderdaten da sind
const dataReady = init();
const suggestionBox = document.getElementById("search-suggestions");
const searchInput = document.getElementById("search");
function updateSuggestions() {
  const q = normalize(searchInput.value);
  suggestionBox.innerHTML = "";
  if (!q) { suggestionBox.hidden = true; searchInput.setAttribute("aria-expanded","false"); return; }
  const matches = items.filter(c => normalize(c.name + " " + displayName(c) + " " + c.capital + " " + c.code + " " + c.tld).includes(q)).slice(0,7);
  for (const c of matches) {
    const b = document.createElement("button"); b.type = "button"; b.className = "suggestion"; b.setAttribute("role","option");
    const img = document.createElement("img"); img.src = flagUrl(c.code,80); img.alt = "";
    const name = document.createElement("span"); name.textContent = displayName(c);
    const capital = document.createElement("small"); capital.textContent = c.capital;
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
