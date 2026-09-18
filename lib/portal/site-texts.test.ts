import assert from "node:assert/strict";
import { test } from "node:test";

import { dutchText, siteHashKey, siteTextStale } from "./site-texts.ts";
import { hashSource } from "./translation-keys.ts";

const KEY = "hero.subShort";
const CODE_NL = "Rauwe rock uit Ede. Geen omweg.";

test("de database wint van de code, maar leeg telt niet", () => {
  assert.equal(
    dutchText(KEY, { [`${KEY}|nl`]: "Uit de database." }, CODE_NL),
    "Uit de database.",
  );
  assert.equal(dutchText(KEY, { [`${KEY}|nl`]: "   " }, CODE_NL), CODE_NL);
  assert.equal(dutchText(KEY, {}, CODE_NL), CODE_NL);
});

test("zonder Engelse tekst valt er niets te verouderen", () => {
  assert.equal(siteTextStale(KEY, { [`${KEY}|nl`]: "Nieuw." }, CODE_NL), false);
});

test("met de hand ingevuld Engels veroudert niet", () => {
  // Geen bewaarde bronhash: deze tekst is nooit vertaald, dus er is niets om
  // tegen af te zetten.
  assert.equal(
    siteTextStale(KEY, { [`${KEY}|nl`]: "Nieuw.", [`${KEY}|en`]: "New." }, CODE_NL),
    false,
  );
});

test("een vertaling op de huidige Nederlandse tekst is niet verouderd", () => {
  assert.equal(
    siteTextStale(KEY, {
      [`${KEY}|nl`]: "Nieuw.",
      [`${KEY}|en`]: "New.",
      [`${siteHashKey(KEY)}|`]: hashSource("Nieuw."),
    }, CODE_NL),
    false,
  );
});

test("wijzigt het Nederlands, dan is de vertaling verouderd", () => {
  assert.equal(
    siteTextStale(KEY, {
      [`${KEY}|nl`]: "Iets anders.",
      [`${KEY}|en`]: "New.",
      [`${siteHashKey(KEY)}|`]: hashSource("Nieuw."),
    }, CODE_NL),
    true,
  );
});

test("de terugval uit de code telt als brontekst", () => {
  // Niets in de database voor nl: dan geldt content/nl.ts als origineel.
  assert.equal(
    siteTextStale(KEY, {
      [`${KEY}|en`]: "New.",
      [`${siteHashKey(KEY)}|`]: hashSource(CODE_NL),
    }, CODE_NL),
    false,
  );
});
