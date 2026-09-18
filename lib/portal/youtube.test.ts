import assert from "node:assert/strict";
import { test } from "node:test";

import { youtubeId } from "./youtube.ts";

const ID = "dQw4w9WgXcQ";

test("het volledige adres", () => {
  assert.equal(youtubeId(`https://www.youtube.com/watch?v=${ID}`), ID);
});

test("een adres met meer parameters erachter", () => {
  assert.equal(youtubeId(`https://www.youtube.com/watch?v=${ID}&t=42s`), ID);
});

test("de korte link", () => {
  assert.equal(youtubeId(`https://youtu.be/${ID}`), ID);
});

test("een embed- en een shortsadres", () => {
  assert.equal(youtubeId(`https://www.youtube.com/embed/${ID}`), ID);
  assert.equal(youtubeId(`https://www.youtube.com/shorts/${ID}`), ID);
});

test("alleen het id", () => {
  assert.equal(youtubeId(ID), ID);
});

test("spaties eromheen maken niet uit", () => {
  assert.equal(youtubeId(`  ${ID}  `), ID);
});

test("een ander domein komt er niet door", () => {
  assert.equal(youtubeId(`https://youtube.com.kwaad.nl/watch?v=${ID}`), null);
  assert.equal(youtubeId(`https://vimeo.com/${ID}`), null);
});

test("javascript: is geen adres om te accepteren", () => {
  assert.equal(youtubeId("javascript:alert(1)"), null);
});

test("rommel levert null op", () => {
  for (const value of ["", "geen link", "https://youtu.be/", "te-kort"]) {
    assert.equal(youtubeId(value), null, JSON.stringify(value));
  }
});
