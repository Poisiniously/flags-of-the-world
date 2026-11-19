// =====================================================================
// Flags of the World – Daten kommen live von der REST Countries API.
// data.js dient nur noch als Offline-Fallback und liefert die deutschen
// Hauptstadtnamen (die API kennt Hauptstädte nur auf Englisch).
// =====================================================================

const API_URL =
  "https://restcountries.com/v3.1/all?fields=cca2,name,translations,capital,region,subregion,area,population,tld,independent";
const CACHE_KEY = "flags-of-the-world:countries:v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Stunden
const FETCH_TIMEOUT_MS = 10000;

// Reihenfolge der Kontinente (für Filter und Kontinent-Sortierung)
const CONTINENTS = ["Europa", "Asien", "Afrika", "Nordamerika", "Südamerika", "Ozeanien"];

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
  return { ...c, searchText: normalize(`${c.name} ${c.capital} ${c.code} ${c.tld}`) };
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
    name: (c.translations && c.translations.deu && c.translations.deu.common) ||
          (local && local.name) || (c.name && c.name.common) || code.toUpperCase(),
    capital: (local && local.capital) || (c.capital && c.capital[0]) || "–",
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
      ? `${list.length} Länder`
      : `${list.length} von ${items.length} Ländern`;
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
    card.querySelector("h3").textContent = c.name;
    card.querySelector(".capital").textContent = `Hauptstadt: ${c.capital}`;
    card.querySelector(".continent").textContent = c.continent;
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
    btn.innerHTML = `${name}<small>${counts[name] || 0}</small>`;
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
  modalTitle.textContent = c.name;

  const density = c.area > 0 ? c.population / c.area : 0;
  const rows = [
    ["Hauptstadt", c.capital],
    ["Kontinent", c.continent],
    ["Domain-Endung", c.tld],
    ["Fläche", formatArea(c.area)],
    ["Einwohner", `ca. ${nf.format(c.population)}`],
    ["Bevölkerungsdichte", `${nf.format(Math.round(density))} / km²`],
    ["Ländercode", c.code.toUpperCase()],
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
init();
