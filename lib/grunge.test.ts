import assert from "node:assert/strict";
import { test } from "node:test";

import { PAGE_ARTISTS } from "../content/grunge/types.ts";
import { en } from "../content/grunge/en.ts";
import { nl } from "../content/grunge/nl.ts";
import { richParts, songsFromPage } from "./grunge.ts";

test("cursief tussen sterretjes", () => {
  assert.deepEqual(richParts("In vijf weken: *Ten* en *Nevermind*."), [
    { text: "In vijf weken: ", italic: false },
    { text: "Ten", italic: true },
    { text: " en ", italic: false },
    { text: "Nevermind", italic: true },
    { text: ".", italic: false },
  ]);
  assert.deepEqual(richParts("Geen cursief"), [{ text: "Geen cursief", italic: false }]);
});

test("uit onze set: alleen bands van de pagina, zonder dubbele", () => {
  const setlist = [
    { title: "In Bloom", artist: "Nirvana" },
    { title: "Tomorrow", artist: "Silverchair" },
    { title: "When I Come Around", artist: "Green Day" },
    { title: "Alive", artist: "Pearl Jam" },
    { title: "Alive", artist: "Pearl Jam" },
    { title: "Valerie", artist: "Amy Winehouse" },
    { title: "Something", artist: "Live Wire" },
    { title: "Hunger Strike", artist: "Temple of the Dog" },
    { title: "Stray", artist: "The Melvins" },
    { title: "Duet", artist: "Nirvana feat. Someone" },
  ];
  assert.deepEqual(
    songsFromPage(setlist, PAGE_ARTISTS).map((s) => s.title),
    ["In Bloom", "Tomorrow", "Alive", "Hunger Strike", "Stray", "Duet"],
  );
  assert.equal(songsFromPage(setlist, PAGE_ARTISTS, 2).length, 2);
});

test("beide talen even lang waar de pagina ze naast elkaar zet", () => {
  for (const key of ["traits", "players"] as const) {
    const a = key === "traits" ? nl.spot.traits : nl.spot.bass.players;
    const b = key === "traits" ? en.spot.traits : en.spot.bass.players;
    assert.equal(a.length, b.length, key);
  }
  assert.equal(nl.timeline.years.length, en.timeline.years.length);
  assert.equal(nl.top12.items.length, 12);
  assert.equal(en.top12.items.length, 12);
  assert.equal(nl.versus.rows.length, en.versus.rows.length);
  for (const row of [...nl.versus.rows, ...en.versus.rows]) assert.equal(row.values.length, 3);
});
