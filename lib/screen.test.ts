import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_SCREEN, noiseBrightness, normalizeScreen, parseScreen, pickFormat, ratioOf, sequence } from "./screen.ts";

const BLOB = "https://abc123.public.blob.vercel-storage.com/band-x1.jpg";

test("niets opgeslagen of kapot: de standaard", () => {
  assert.deepEqual(parseScreen(undefined), DEFAULT_SCREEN);
  assert.deepEqual(parseScreen(""), DEFAULT_SCREEN);
  assert.deepEqual(parseScreen("{kapot"), DEFAULT_SCREEN);
});

test("grenzen: tempo, logo, dekking", () => {
  const c = normalizeScreen({
    seconds: 1,
    format: "4:3",
    logo: { on: "ja", every: 99 },
    slides: [{ title: "A", opacity: 150 }, { title: "B", opacity: -5 }, { title: "C", opacity: "35" }],
  });
  assert.equal(c.seconds, 3);
  assert.equal(c.format, "auto");
  assert.deepEqual(c.logo, { on: true, every: 20, noise: 0 });
  assert.deepEqual(c.slides.map((s) => s.opacity), [100, 0, 35]);
  assert.equal(normalizeScreen({ seconds: 600 }).seconds, 60);
});

test("foto's: alleen de eigen opslag of de site zelf", () => {
  const c = normalizeScreen({
    photos: [{ url: BLOB }, { url: BLOB }, { url: "https://evil.example/x.jpg" }, { url: "/assets/foto.jpg" }, { url: "//evil.example/x" }],
    slides: [
      { title: "Met foto", photo: BLOB },
      { title: "Vreemde foto", photo: "javascript:alert(1)" },
      { title: "", photo: "https://evil.example/x.jpg" },
      { title: "", photo: "/assets/foto.jpg" },
    ],
  });
  assert.deepEqual(c.photos.map((p) => p.url), [BLOB, "/assets/foto.jpg"]);
  assert.deepEqual(c.slides.map((s) => [s.title, s.photo]), [
    ["Met foto", BLOB],
    ["Vreemde foto", ""],
    ["", "/assets/foto.jpg"],
  ]);
});

test("ids blijven uniek", () => {
  const c = normalizeScreen({ slides: [{ id: "a", title: "1" }, { id: "a", title: "2" }, { title: "3" }] });
  assert.equal(new Set(c.slides.map((s) => s.id)).size, 3);
});

test("volgorde: logo na elke n beelden", () => {
  const c = normalizeScreen({ logo: { on: true, every: 2 }, slides: ["A", "B", "C", "D", "E"].map((title) => ({ title })) });
  assert.deepEqual(
    sequence(c).map((i) => (i.kind === "logo" ? "L" : i.slide.title)).join(""),
    "ABLCDLE",
  );
});

test("volgorde: minder beelden dan n, logo uit, of helemaal niets", () => {
  const few = normalizeScreen({ logo: { on: true, every: 5 }, slides: [{ title: "A" }, { title: "B" }] });
  assert.deepEqual(sequence(few).map((i) => i.kind), ["slide", "slide", "logo"]);
  const off = normalizeScreen({ logo: { on: false, every: 1 }, slides: [{ title: "A" }] });
  assert.deepEqual(sequence(off).map((i) => i.kind), ["slide"]);
  assert.deepEqual(sequence(normalizeScreen({ logo: { on: false } })).map((i) => i.kind), ["logo"]);
});

test("formaat: het adres wint van de instelling", () => {
  const c = normalizeScreen({ format: "16:9" });
  assert.equal(pickFormat("9:16", c), "9:16");
  assert.equal(pickFormat("9x16", c), "9:16");
  assert.equal(pickFormat("onzin", c), "16:9");
  assert.equal(pickFormat(undefined, c), "16:9");
  assert.equal(ratioOf("auto"), null);
  assert.equal(ratioOf("1:1"), 1);
});

test("ruis: tijd, helderheid en ruis over het beeld", () => {
  const c = normalizeScreen({
    noiseSeconds: 2.345,
    noiseLevel: 140,
    logo: { noise: 40 },
    slides: [{ title: "A", noise: 25 }, { title: "B", noise: "x" }, { title: "C" }],
  });
  assert.equal(c.noiseSeconds, 2.3);
  assert.equal(c.noiseLevel, 100);
  assert.equal(c.logo.noise, 40);
  assert.deepEqual(c.slides.map((s) => s.noise), [25, 0, 0]);
  assert.equal(normalizeScreen({ noiseSeconds: 0 }).noiseSeconds, 0.5);
  assert.equal(normalizeScreen({ noiseSeconds: 99 }).noiseSeconds, 10);
  // Een opgeslagen instelling van vóór deze velden krijgt de standaard.
  const old = normalizeScreen({ seconds: 8, slides: [{ title: "A" }] });
  assert.equal(old.noiseSeconds, 1.4);
  assert.equal(old.noiseLevel, 16);
});

test("helderheid: 16 is de ruis van de startanimatie", () => {
  assert.equal(noiseBrightness(16), 1.01);
  assert.equal(noiseBrightness(0), 0.25);
  assert.equal(noiseBrightness(100), 5);
  assert.equal(noiseBrightness(500), 5);
});
