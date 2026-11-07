import assert from "node:assert/strict";
import { test } from "node:test";

import { createPlaylist, normalizeScreen, sequence } from "./screen.ts";
import { applyRemote, remoteView } from "./screen-remote.ts";

const base = () =>
  normalizeScreen({
    logo: { on: false },
    shuffle: false,
    slides: [
      { id: "a", title: "Static Line" },
      { id: "b", label: "Live", photo: "/foto.jpg" },
      { id: "n", source: "nu" },
    ],
  });

test("snelbediening: alleen de bekende velden, binnen de grenzen", () => {
  const c = applyRemote(base(), {
    standby: true,
    style: "microduck",
    seconds: 999,
    ticker: { on: true, text: "  Merch achterin  ", show: "ja" },
    photos: [{ url: "https://example.com/x.jpg" }],
    format: "9:16",
  });
  assert.equal(c.standby, true);
  assert.equal(c.style, "microduck");
  assert.equal(c.seconds, 60);
  assert.equal(c.ticker.on, true);
  assert.equal(c.ticker.text, "Merch achterin");
  assert.equal(c.ticker.show, true);
  assert.equal(c.format, "auto");
  assert.equal(c.photos.length, 0);
  assert.equal(applyRemote(base(), { style: "roze" }).style, "klassiek");
});

test("snelbediening: minimum en maximum van de ruis schuiven mee", () => {
  const c = applyRemote(base(), { noiseMin: 5 });
  assert.equal(c.noiseMin, 5);
  assert.equal(c.noiseMax, 5);
  const d = applyRemote(c, { noiseMax: 2 });
  assert.equal(d.noiseMin, 2);
  assert.equal(d.noiseMax, 2);
});

test("snelbediening: een beeld uitzetten laat het in de lijst staan maar slaat het over", () => {
  const c = applyRemote(base(), { slides: [{ id: "a", on: false }, { id: "x", on: false }, { id: "b" }] });
  assert.deepEqual(
    c.slides.map((s) => [s.id, s.on]),
    [["a", false], ["b", true], ["n", true]],
  );
  assert.deepEqual(
    sequence(c).map((i) => (i.kind === "slide" ? i.slide.id : "logo")),
    ["b", "n"],
  );
  const shuffled = createPlaylist({ ...c, shuffle: true });
  for (let k = 0; k < 20; k++) {
    const item = shuffled.next();
    assert.ok(item.kind === "slide" && item.slide.id !== "a");
  }
  // Alles uit: dan het wordmark, zoals bij een lege lijst.
  const none = applyRemote(base(), { slides: ["a", "b", "n"].map((id) => ({ id, on: false })) });
  assert.deepEqual(sequence(none), [{ kind: "logo" }]);
});

test("snelbediening: volgende beeld is een nieuwe tijdstempel", () => {
  assert.equal(base().skip, 0);
  assert.equal(applyRemote(base(), { skip: true }, 1234).skip, 1234);
  assert.equal(applyRemote(base(), { skip: "ja" }, 1234).skip, 0);
  assert.equal(normalizeScreen({ skip: -5 }).skip, 0);
});

test("snelbediening: wat de app te zien krijgt", () => {
  const v = remoteView(applyRemote(base(), { slides: [{ id: "b", on: false }] }));
  assert.deepEqual(v.slides, [
    { id: "a", name: "Static Line", kind: "tekst", on: true },
    { id: "b", name: "Live", kind: "foto", on: false },
    { id: "n", name: "Nu speelt", kind: "nu", on: true },
  ]);
  assert.equal("photos" in v, false);
});

test("vaste volgorde: na een wijziging verder na het beeld dat er staat", () => {
  const ids = (list: { next(): { kind: string; slide?: { id: string } } }, n: number) =>
    Array.from({ length: n }, () => {
      const item = list.next();
      return item.kind === "slide" ? item.slide!.id : "logo";
    });
  assert.deepEqual(ids(createPlaylist(base(), Math.random, null), 4), ["a", "b", "n", "a"]);
  assert.deepEqual(ids(createPlaylist(base(), Math.random, "a"), 3), ["b", "n", "a"]);
  assert.deepEqual(ids(createPlaylist(base(), Math.random, "n"), 2), ["a", "b"]);
  // Staat het beeld er niet meer in (uitgezet), dan gewoon vooraan.
  const off = applyRemote(base(), { slides: [{ id: "b", on: false }] });
  assert.deepEqual(ids(createPlaylist(off, Math.random, "b"), 2), ["a", "n"]);
});
