import assert from "node:assert/strict";
import { test } from "node:test";

import { parseId, parseKeys, parseRequest } from "./request.ts";

const LIMITS = { maxInputChars: 4000, maxBriefChars: 600 };

test("zonder stand is het herschrijven", () => {
  // De Band App draaide een versie zonder dit veld; die hoort te blijven werken.
  const r = parseRequest({ text: "Iets." }, LIMITS);

  assert.ok(r.ok);
  assert.equal(r.value.mode, "rewrite");
  assert.equal(r.value.input, "Iets.");
});

test("herschrijven zonder tekst wordt geweigerd", () => {
  const r = parseRequest({ mode: "rewrite", text: "   " }, LIMITS);

  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.error, "geen-tekst");
});

test("schrijven zonder opdracht wordt geweigerd", () => {
  const r = parseRequest({ mode: "brief", notes: "120 man" }, LIMITS);

  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.error, "geen-opdracht");
});

test("een te lange opdracht wordt geweigerd", () => {
  const r = parseRequest({ mode: "brief", brief: "x".repeat(601) }, LIMITS);

  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.error, "opdracht-te-lang");
});

test("aantekeningen mogen zo lang als een brontekst", () => {
  const r = parseRequest(
    { mode: "brief", brief: "Schrijf een verslag.", notes: "x".repeat(3999) },
    LIMITS,
  );

  assert.ok(r.ok);
});

test("een onbekende stand wordt geweigerd", () => {
  const r = parseRequest({ mode: "vertalen", text: "Iets." }, LIMITS);

  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.error, "onbekende-stand");
});

test("de herschrijfstand negeert bronnen en onderwerp", () => {
  // Anders zou een oud scherm een feitenblad kunnen meesturen bij een tekst die
  // zijn eigen bron is, en dan klopt de controle niet meer.
  const r = parseRequest(
    { mode: "rewrite", text: "Iets.", sources: ["band"], subjectId: "3" },
    LIMITS,
  );

  assert.ok(r.ok);
  assert.deepEqual(r.value.keys, []);
  assert.equal(r.value.subjectId, null);
});

test("onbekende bronnen vallen stil weg", () => {
  assert.deepEqual(parseKeys(["band", "agenda", "members"]), ["band", "members"]);
});

test("dezelfde bron telt één keer", () => {
  assert.deepEqual(parseKeys(["band", "band"]), ["band"]);
});

test("een leeg of onzinnig id is geen onderwerp", () => {
  assert.equal(parseId(""), null);
  assert.equal(parseId("nee"), null);
  assert.equal(parseId("0"), null);
  assert.equal(parseId("-3"), null);
  assert.equal(parseId("1.5"), null);
  assert.equal(parseId("12"), 12);
});

test("kort of lang komt zowel als vinkje als als woord binnen", () => {
  const uitForm = parseRequest({ mode: "brief", brief: "Bio.", long: "lang" }, LIMITS);
  const uitJson = parseRequest({ mode: "brief", brief: "Bio.", long: true }, LIMITS);
  const kort = parseRequest({ mode: "brief", brief: "Bio." }, LIMITS);

  assert.equal(uitForm.ok && uitForm.value.long, true);
  assert.equal(uitJson.ok && uitJson.value.long, true);
  assert.equal(kort.ok && kort.value.long, false);
});
