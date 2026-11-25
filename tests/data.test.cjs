const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadDataset(file, exportName) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox, { filename: file });
  return sandbox.module.exports[exportName];
}

const countries = loadDataset("data.js", "COUNTRIES");
const territories = loadDataset("territories.js", "TERRITORIES");
const continents = new Set(["Europa", "Asien", "Afrika", "Nordamerika", "Südamerika", "Ozeanien"]);

test("bundled country dataset contains 197 countries", () => {
  assert.equal(countries.length, 197);
});

test("country alpha-2 codes are unique and valid", () => {
  const codes = countries.map((country) => country.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) assert.match(code, /^[a-z]{2}$/);
});

test("every country has complete, valid baseline data", () => {
  for (const country of countries) {
    assert.ok(country.name.trim(), country.code);
    assert.ok(country.capital.trim(), country.code);
    assert.ok(continents.has(country.continent), country.code);
    assert.ok(Number.isFinite(country.area) && country.area >= 0, country.code);
    assert.ok(Number.isFinite(country.population) && country.population >= 0, country.code);
  }
});

test("bundled overseas territory dataset contains 44 territories", () => {
  assert.equal(territories.length, 44);
});

test("territory codes and ISO-3 codes are unique and valid", () => {
  const codes = territories.map((territory) => territory.code);
  const iso3 = territories.map((territory) => territory.iso3);
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(new Set(iso3).size, iso3.length);
  for (const code of codes) assert.match(code, /^[a-z]{2}$/);
  for (const code of iso3) assert.match(code, /^[A-Z]{3}$/);
});

test("every territory references a known sovereign country", () => {
  const countryCodes = new Set(countries.map((country) => country.code));
  for (const territory of territories) {
    assert.ok(countryCodes.has(territory.sovereign), `${territory.code} -> ${territory.sovereign}`);
    assert.ok(territory.names.length > 0, territory.code);
    assert.ok(continents.has(territory.continent), territory.code);
    assert.ok(territory.tld.startsWith("."), territory.code);
    assert.ok(Number.isFinite(territory.area) && territory.area >= 0, territory.code);
    assert.ok(Number.isFinite(territory.population) && territory.population >= 0, territory.code);
  }
});

test("offline support caches the app shell, MapLibre, and Natural Earth map data", () => {
  const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const mapSource = fs.readFileSync(path.join(root, "map.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(serviceWorker, /ne_10m_admin_0_countries\.geojson/);
  assert.match(serviceWorker, /maplibre-gl@6\.19\.0/);
  assert.match(serviceWorker, /cache\.addAll\(APP_ASSETS\)/);
  assert.match(mapSource, /caches\.match\(GEOJSON_URL\)/);
  assert.match(html, /navigator\.serviceWorker\.register\("\.\/sw\.js"\)/);
});

test("README documents all eleven themes and the offline map behavior", () => {
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  for (const theme of ["dark", "light", "ocean", "forest", "sunset", "high contrast", "lavender", "sakura", "paper", "retro", "midnight"]) {
    assert.ok(readme.toLowerCase().includes(theme), `Missing theme documentation: ${theme}`);
  }
  assert.match(readme, /interactive map.*offline|map.*offline.*first successful online visit/i);
});
