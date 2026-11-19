// Reihenfolge der Kontinente (für Filter und Kontinent-Sortierung)
const CONTINENTS = ["Europa", "Asien", "Afrika", "Nordamerika", "Südamerika", "Ozeanien"];

const state = {
  query: "",
  continent: "Alle",
  sort: "name-asc",
};

const collator = new Intl.Collator("de", { sensitivity: "base" });
const nf = new Intl.NumberFormat("de-DE");

// Suchtext normalisieren: Kleinbuchstaben, ohne Akzente, ß → ss
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Suchindex vorbereiten
const items = COUNTRIES.map((c) => ({
  ...c,
  searchText: normalize(`${c.name} ${c.capital} ${c.code}`),
}));

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

function render() {
  const list = getVisible();

  countEl.textContent =
    list.length === items.length
      ? `${list.length} Länder`
      : `${list.length} von ${items.length} Ländern`;
  emptyEl.hidden = list.length > 0;

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
        <span class="continent"></span>
      </div>`;
    card.querySelector("h3").textContent = c.name;
    card.querySelector(".capital").textContent = `Hauptstadt: ${c.capital}`;
    card.querySelector(".continent").textContent = c.continent;
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
    btn.innerHTML = `${name}<small>${counts[name]}</small>`;
    btn.addEventListener("click", () => {
      state.continent = name;
      renderFilters();
      render();
    });
    filtersEl.appendChild(btn);
  }
}

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

  const density = c.population / c.area;
  const rows = [
    ["Hauptstadt", c.capital],
    ["Kontinent", c.continent],
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
renderFilters();
render();
