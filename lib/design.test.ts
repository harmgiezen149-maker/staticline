import assert from "node:assert/strict";
import { test } from "node:test";

import { parseDesign, splitHeading } from "./design.ts";

test("ontwerp: alleen bekende waarden, anders klassiek", () => {
  assert.equal(parseDesign("microduck"), "microduck");
  assert.equal(parseDesign("klassiek"), "klassiek");
  assert.equal(parseDesign("roze"), "klassiek");
  assert.equal(parseDesign(undefined), "klassiek");
});

test("kop in twee tonen: het laatste woord apart", () => {
  assert.deepEqual(splitHeading("Alle shows"), ["Alle", "shows"]);
  assert.deepEqual(splitHeading("Over de band"), ["Over de", "band"]);
  assert.deepEqual(splitHeading("Foto's"), ["", "Foto's"]);
  assert.deepEqual(splitHeading("  Blijf op de  hoogte "), ["Blijf op de", "hoogte"]);
});
