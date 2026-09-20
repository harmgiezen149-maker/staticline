import assert from "node:assert/strict";
import { test } from "node:test";

import { parseSpotify } from "./spotify.ts";

const ID = "3WrFJ7ztbogyGnTHbHJFl2";

test("een gewone deellink", () => {
  assert.deepEqual(parseSpotify(`https://open.spotify.com/artist/${ID}`), {
    type: "artist",
    id: ID,
  });
});

test("de sleutel die Spotify erachter plakt telt niet mee", () => {
  assert.deepEqual(parseSpotify(`https://open.spotify.com/artist/${ID}?si=abc123`), {
    type: "artist",
    id: ID,
  });
});

test("de taal in het pad ook niet", () => {
  // Dit is precies de link die een Nederlandse bezoeker kopieert.
  assert.deepEqual(parseSpotify(`https://open.spotify.com/intl-nl/album/${ID}`), {
    type: "album",
    id: ID,
  });
});

test("het soort komt uit de link en niet uit het veld ernaast", () => {
  // Iemand plakt een albumlink terwijl het soort nog op "artist" staat. De link
  // wint, anders levert het een embed op die niet laadt.
  assert.deepEqual(parseSpotify(`https://open.spotify.com/album/${ID}`, "artist"), {
    type: "album",
    id: ID,
  });
});

test("een spotify:-verwijzing", () => {
  assert.deepEqual(parseSpotify(`spotify:playlist:${ID}`), { type: "playlist", id: ID });
});

test("een kaal id blijft werken", () => {
  assert.deepEqual(parseSpotify(ID), { type: "artist", id: ID });
  assert.deepEqual(parseSpotify(ID, "playlist"), { type: "playlist", id: ID });
});

test("onzin levert niets op", () => {
  // Liever geen sectie dan een sectie met "Page not found" erin.
  assert.equal(parseSpotify(""), null);
  assert.equal(parseSpotify("static line"), null);
  assert.equal(parseSpotify("https://open.spotify.com/artist/te-kort"), null);
  assert.equal(parseSpotify("https://example.com/artist/" + ID), null);
});

test("een onbekend soort in een link wordt niet overgenomen", () => {
  assert.equal(parseSpotify(`https://open.spotify.com/onzin/${ID}`), null);
});
