import assert from "node:assert/strict";
import { test } from "node:test";

import { applyOverrides, flattenCopy, getPath } from "./copy-paths.ts";

const COPY = {
  meta: { title: "Static Line", description: "Rauwe rock" },
  hero: { sub: "Rauwe, opgefokte rock uit Ede.", subShort: "Rauwe rock." },
  photos: { heading: "Foto's", placeholders: ["live shot", "bandportret"] },
  booking: { fields: { budget: "Budget", roomSize: "Grootte van de ruimte" } },
};

test("elke tekst krijgt zijn puntpad", () => {
  const paths = flattenCopy(COPY).map((r) => r.path);

  assert.ok(paths.includes("hero.sub"));
  assert.ok(paths.includes("photos.heading"));
  // Ook twee niveaus diep.
  assert.ok(paths.includes("booking.fields.roomSize"));
});

test("meta blijft erbuiten", () => {
  // Die staat in de metadata van de root layout en wordt bij het bouwen
  // vastgelegd; aanpasbaar maken zou elke pagina dynamisch maken.
  const paths = flattenCopy(COPY).map((r) => r.path);
  assert.ok(!paths.some((p) => p.startsWith("meta.")));
});

test("lijsten worden overgeslagen", () => {
  const paths = flattenCopy(COPY).map((r) => r.path);
  assert.ok(!paths.some((p) => p.startsWith("photos.placeholders")));
});

test("de tekst komt mee, zodat het formulier kan tonen wat er nu staat", () => {
  const rij = flattenCopy(COPY).find((r) => r.path === "hero.subShort");
  assert.equal(rij?.text, "Rauwe rock.");
});

test("een pad opzoeken", () => {
  assert.equal(getPath(COPY, "booking.fields.budget"), "Budget");
  assert.equal(getPath(COPY, "hero.bestaatniet"), undefined);
  // Een pad dat op een object uitkomt is geen tekst.
  assert.equal(getPath(COPY, "booking.fields"), undefined);
});

test("een aangepaste tekst wint van die uit de code", () => {
  const uit = applyOverrides(COPY, { "hero.sub": "Iets anders" });
  assert.equal(uit.hero.sub, "Iets anders");
  // En de rest blijft staan.
  assert.equal(uit.hero.subShort, COPY.hero.subShort);
});

test("het origineel blijft ongemoeid", () => {
  // Dit is geen netheid maar noodzaak: content/nl.ts wordt door elk verzoek
  // gedeeld. Ter plekke aanpassen zou de tekst van de ene bezoeker bij de
  // volgende laten staan.
  const voor = COPY.hero.sub;
  applyOverrides(COPY, { "hero.sub": "Iets anders" });
  assert.equal(COPY.hero.sub, voor);
});

test("een leeg veld maakt niets leeg", () => {
  // Leeg betekent "gebruik wat er in de code staat". Zo kan het beheerscherm
  // nooit een pagina leeg maken.
  const uit = applyOverrides(COPY, { "hero.sub": "   " });
  assert.equal(uit.hero.sub, COPY.hero.sub);
});

test("een pad dat niet meer bestaat maakt geen nieuw veld aan", () => {
  const uit = applyOverrides(COPY, { "hero.verdwenen": "spookje" });
  assert.equal((uit.hero as Record<string, unknown>).verdwenen, undefined);
});

test("zonder aanpassingen komt hetzelfde object terug", () => {
  assert.equal(applyOverrides(COPY, {}), COPY);
});
