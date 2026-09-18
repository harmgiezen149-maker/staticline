import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collect,
  hashSource,
  pick,
  rowsFor,
  statusOf,
  type Stored,
} from "./translation-keys.ts";

const NL = "Rauwe rock uit Ede.";
const EN = "Raw rock from Ede.";

const stored = (text: string, source: string): Stored => ({
  text,
  sourceHash: hashSource(source),
});

test("dezelfde tekst geeft dezelfde hash, spaties eromheen niet meegerekend", () => {
  assert.equal(hashSource(NL), hashSource(`  ${NL}  `));
});

test("een andere tekst geeft een andere hash", () => {
  assert.notEqual(hashSource(NL), hashSource(`${NL} Geen omweg.`));
});

test("zonder vertaling is de status 'ontbreekt'", () => {
  const item = { id: "band.bio", label: "Bandbio", source: NL };
  assert.equal(statusOf(item), "missing");
  assert.equal(statusOf(item, { text: "   ", sourceHash: "x" }), "missing");
});

test("een vertaling op de huidige brontekst is actueel", () => {
  const item = { id: "band.bio", label: "Bandbio", source: NL };
  assert.equal(statusOf(item, stored(EN, NL)), "current");
});

test("wijzigt de brontekst, dan is de vertaling verouderd", () => {
  const item = { id: "band.bio", label: "Bandbio", source: `${NL} Geen omweg.` };
  assert.equal(statusOf(item, stored(EN, NL)), "stale");
});

test("een actuele vertaling wordt getoond", () => {
  assert.equal(pick("band.bio", NL, { "band.bio": stored(EN, NL) }), EN);
});

test("een verouderde vertaling valt terug op het Nederlands", () => {
  const nieuwerNederlands = `${NL} Geen omweg.`;
  assert.equal(
    pick("band.bio", nieuwerNederlands, { "band.bio": stored(EN, NL) }),
    nieuwerNederlands,
  );
});

test("zonder vertaling valt het terug op het Nederlands", () => {
  assert.equal(pick("band.bio", NL, {}), NL);
});

test("tekst en bronhash worden als paar opgeslagen", () => {
  const rows = rowsFor("band.bio", EN, NL);
  assert.deepEqual(rows, [
    { key: "tr:band.bio", locale: "en", value: EN },
    { key: "trsrc:band.bio", locale: "", value: hashSource(NL) },
  ]);
});

test("lege bronteksten worden niet aangeboden om te vertalen", () => {
  const items = collect({
    band: { name: "Static Line", bio: "  ", logoUrl: "" },
    members: [
      { id: 1, name: "Harm", role: "bas", instrument: "", bio: "", photoUrl: null },
    ],
    gigs: [],
    setlistSections: [],
    setlist: [],
    pastGigs: [],
    updatedAt: "",
  });

  assert.deepEqual(
    items.map((item) => item.id),
    ["member.1.role"],
  );
});

test("zonder gegevens uit de Band App valt er niets te vertalen", () => {
  assert.deepEqual(collect(null), []);
});
