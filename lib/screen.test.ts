import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_SCREEN, NOT_PLAYING, createPlaylist, glitchTiming, nextShowable, showable, transitionTiming, noiseBrightness, noiseDuration, shuffledRound, normalizeScreen, parseScreen, pickFormat, ratioOf, sequence } from "./screen.ts";
import { bandAt, drawColorNoise } from "./screen-noise.ts";

const BLOB = "https://abc123.public.blob.vercel-storage.com/band-x1.jpg";

test("niets opgeslagen of kapot: de standaard", () => {
  assert.deepEqual(parseScreen(undefined), DEFAULT_SCREEN);
  assert.deepEqual(parseScreen(""), DEFAULT_SCREEN);
  assert.deepEqual(parseScreen("{kapot"), DEFAULT_SCREEN);
});

test("grenzen: tempo, logo, dekking", () => {
  const c = normalizeScreen({
    seconds: 1,
    format: "21:9",
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
  assert.equal(ratioOf("4:3"), 4 / 3);
  assert.equal(pickFormat("4x3", c), "4:3");
});

test("ruis: tijd, helderheid en ruis over het beeld", () => {
  const c = normalizeScreen({
    noiseSeconds: 2.345,
    noiseLevel: 140,
    logo: { noise: 40 },
    slides: [{ title: "A", noise: 25 }, { title: "B", noise: "x" }, { title: "C" }],
  });
  assert.equal(c.noiseMin, 2.3);
  assert.equal(c.noiseMax, 2.3);
  assert.equal(c.noiseLevel, 100);
  assert.equal(c.logo.noise, 40);
  assert.deepEqual(c.slides.map((s) => s.noise), [25, 0, 0]);
  assert.equal(normalizeScreen({ noiseSeconds: 0 }).noiseMin, 0.1);
  assert.equal(normalizeScreen({ noiseSeconds: 99 }).noiseMax, 20);
  assert.equal(normalizeScreen({ noiseMin: 15, noiseMax: 20 }).noiseMax, 20);
  // Een opgeslagen instelling van vóór deze velden krijgt de standaard.
  const old = normalizeScreen({ seconds: 8, slides: [{ title: "A" }] });
  assert.equal(old.noiseMin, 1.4);
  assert.equal(old.noiseMax, 1.4);
  assert.equal(old.noiseLevel, 16);
});

test("helderheid: 16 is de ruis van de startanimatie", () => {
  assert.equal(noiseBrightness(16), 1.01);
  assert.equal(noiseBrightness(0), 0.25);
  assert.equal(noiseBrightness(100), 5);
  assert.equal(noiseBrightness(500), 5);
});

test("ruisduur: willekeurig tussen minimum en maximum", () => {
  const c = normalizeScreen({ noiseMin: 1, noiseMax: 4 });
  assert.equal(noiseDuration(c, () => 0), 1000);
  assert.equal(noiseDuration(c, () => 1), 4000);
  assert.equal(noiseDuration(c, () => 0.5), 2500);
  // Omgedraaid ingevuld: omgewisseld, niet weggegooid.
  const swapped = normalizeScreen({ noiseMin: 6, noiseMax: 2 });
  assert.deepEqual([swapped.noiseMin, swapped.noiseMax], [2, 6]);
  // Alleen een minimum: het maximum is dan hetzelfde.
  const one = normalizeScreen({ noiseMin: 3 });
  assert.deepEqual([one.noiseMin, one.noiseMax], [3, 3]);
});

test("eigen maat: binnen de grenzen, en hulplijnen alleen als ze aan staan", () => {
  const c = normalizeScreen({ format: "eigen", custom: { width: 72.34, height: 5, x: -80, y: "3.5", guides: "ja" } });
  assert.equal(c.format, "eigen");
  assert.deepEqual(c.custom, { width: 72.3, height: 10, x: -50, y: 3.5, guides: false });
  assert.deepEqual(normalizeScreen({}).custom, { width: 100, height: 100, x: 0, y: 0, guides: false });
  assert.equal(pickFormat("eigen", normalizeScreen({})), "eigen");
  assert.equal(ratioOf("eigen"), null);
});

/** Een vaste reeks "willekeurige" getallen, zodat de test elke keer hetzelfde doet. */
function seeded(seed = 7) {
  let x = seed;
  return () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
}

test("hoe vaak: tussen 1 en 5, standaard 1", () => {
  const c = normalizeScreen({ slides: [{ title: "A", weight: 3 }, { title: "B", weight: 9 }, { title: "C" }] });
  assert.deepEqual(c.slides.map((s) => s.weight), [3, 5, 1]);
  assert.equal(c.shuffle, true);
  assert.equal(normalizeScreen({ shuffle: false }).shuffle, false);
});

test("willekeurig: de verhoudingen kloppen en niets komt twee keer achter elkaar", () => {
  const c = normalizeScreen({
    logo: { on: false },
    slides: [{ id: "band", title: "Band", weight: 3 }, { id: "a", title: "A" }, { id: "b", title: "B" }, { id: "c", title: "C" }],
  });
  const list = createPlaylist(c, seeded());
  const seen: string[] = [];
  for (let i = 0; i < 600; i++) {
    const item = list.next();
    assert.equal(item.kind, "slide");
    if (item.kind === "slide") seen.push(item.slide.id);
  }
  const count = (id: string) => seen.filter((s) => s === id).length;
  // 6 per rondje, waarvan 3 de bandinfo: precies de helft.
  assert.equal(count("band"), 300);
  assert.equal(count("a"), 100);
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1], `dubbel op plek ${i}`);
});

test("willekeurig: het logo na elke n beelden", () => {
  const c = normalizeScreen({ logo: { on: true, every: 2 }, slides: [{ title: "A" }, { title: "B" }, { title: "C" }] });
  const list = createPlaylist(c, seeded(3));
  const kinds = Array.from({ length: 9 }, () => list.next().kind);
  assert.deepEqual(kinds, ["slide", "slide", "logo", "slide", "slide", "logo", "slide", "slide", "logo"]);
});

test("vaste volgorde: gewoon de lijst in een lus", () => {
  const c = normalizeScreen({ shuffle: false, logo: { on: false }, slides: [{ title: "A", weight: 5 }, { title: "B" }] });
  const list = createPlaylist(c);
  assert.deepEqual(
    Array.from({ length: 5 }, () => {
      const i = list.next();
      return i.kind === "slide" ? i.slide.title : "L";
    }),
    ["A", "B", "A", "B", "A"],
  );
});

test("een rondje begint niet met het beeld waar het vorige mee eindigde", () => {
  const slides = normalizeScreen({ slides: [{ id: "a", title: "A" }, { id: "b", title: "B" }] }).slides;
  for (let s = 1; s < 30; s++) assert.notEqual(shuffledRound(slides, seeded(s), "a")[0].id, "a");
});

test("geen beelden: dan het logo", () => {
  const list = createPlaylist(normalizeScreen({ slides: [] }));
  assert.equal(list.next().kind, "logo");
});

test("glitches: standaard aan, 0 is uit, nooit sneller dan om de ruim een seconde", () => {
  assert.equal(normalizeScreen({}).glitch, 40);
  assert.equal(normalizeScreen({ glitch: 0 }).glitch, 0);
  assert.equal(normalizeScreen({ glitch: 250 }).glitch, 100);
  assert.equal(glitchTiming(0).on, false);
  const max = glitchTiming(100);
  assert.ok(max.pause[0] >= 1000);
  assert.ok(max.duration[1] < max.pause[0]);
  assert.ok(glitchTiming(80).shift > glitchTiming(20).shift);
});

test("soort ruis: standaard kleur, met een eigen helderheidsschaal", () => {
  assert.equal(normalizeScreen({}).noiseStyle, "kleur");
  assert.equal(normalizeScreen({ noiseStyle: "zwart-wit" }).noiseStyle, "zwart-wit");
  assert.equal(normalizeScreen({ noiseStyle: "regenboog" }).noiseStyle, "kleur");
  assert.equal(noiseBrightness(16), 1.01);
  assert.ok(noiseBrightness(100, "kleur") < 2);
  assert.ok(Math.abs(noiseBrightness(60, "kleur") - 1) < 0.05);
});

test("kleurenruis: vult elk punt, ondoorzichtig, met banden", () => {
  const w = 64;
  const h = 32;
  const buffer = new Uint32Array(w * h);
  drawColorNoise(buffer, w, h, 1.5);
  for (const px of buffer) assert.equal(px >>> 24, 0xff);
  const bands = Array.from({ length: w }, (_, x) => bandAt(x, w, 1.5));
  assert.ok(Math.max(...bands) - Math.min(...bands) > 0.4);
  for (const b of bands) assert.ok(b >= 0.25 && b <= 1.1);
});

test("snelheid van de wissel: van rustig tot een flits", () => {
  assert.equal(normalizeScreen({}).speed, 70);
  assert.equal(normalizeScreen({ speed: 140 }).speed, 100);
  const calm = transitionTiming(0);
  assert.equal(calm.collapse, 520);
  assert.equal(calm.open, 1000);
  const flash = transitionTiming(100);
  const total = (t: typeof calm) => t.close + t.settle + t.collapse * 2 + t.gap + t.open;
  assert.ok(total(flash) < 400, `flits duurt ${total(flash)} ms`);
  assert.ok(total(calm) > 2000);
  assert.ok(flash.collapse >= 30 && flash.fade >= 30);
  assert.equal(normalizeScreen({ noiseMin: 0.1, noiseMax: 0.1 }).noiseMin, 0.1);
});

test("tekst in de ruis: standaard aan, alleen expliciet uit", () => {
  assert.equal(normalizeScreen({}).readout, true);
  assert.equal(normalizeScreen({ readout: false }).readout, false);
  assert.equal(normalizeScreen({ readout: "nee" }).readout, true);
});

test("zwarte overgang: standaard aan, alleen expliciet uit", () => {
  assert.equal(normalizeScreen({}).bands, true);
  assert.equal(normalizeScreen({ bands: false }).bands, false);
  assert.equal(normalizeScreen({ bands: 0 }).bands, true);
});

test("nu speelt: een beeld zonder tekst blijft staan, en wordt overgeslagen als er niets speelt", () => {
  const c = normalizeScreen({
    slides: [
      { id: "a", title: "Static Line" },
      { id: "nu", source: "nu", label: "", weight: 3 },
      { id: "leeg" },
    ],
  });
  assert.deepEqual(c.slides.map((s) => s.id), ["a", "nu"]);
  assert.equal(c.slides[1].source, "nu");
  assert.equal(c.slides[1].cover, true);
  assert.equal(normalizeScreen({ slides: [{ title: "x", source: "iets" }] }).slides[0].source, "");

  const nu = { kind: "slide" as const, slide: c.slides[1] };
  const playing = { live: true, title: "Valerie", artist: "Amy Winehouse", coverUrl: "" };
  assert.equal(showable(nu, NOT_PLAYING), false);
  assert.equal(showable(nu, playing), true);
  assert.equal(showable({ kind: "slide", slide: c.slides[0] }, NOT_PLAYING), true);

  // Niets speelt: het nu-speelt-beeld komt nooit voorbij.
  const list = createPlaylist(c, Math.random, null);
  for (let k = 0; k < 50; k++) {
    const item = nextShowable(list, NOT_PLAYING);
    assert.ok(item.kind === "logo" || item.slide.id === "a");
  }
  // Alleen een nu-speelt-beeld en geen logo: dan het wordmark in plaats van eindeloos zoeken.
  const only = normalizeScreen({ logo: { on: false }, slides: [{ id: "nu", source: "nu" }] });
  assert.deepEqual(nextShowable(createPlaylist(only, Math.random, null), NOT_PLAYING), { kind: "logo" });
});
