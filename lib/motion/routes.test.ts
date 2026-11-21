import assert from "node:assert/strict";
import { test } from "node:test";

import { MENU_PATHS, channelFor, channelLabel, classifyLink, localeOfPath, stripLocale } from "./routes.ts";

const HOME = "https://www.staticline.nl/";
const AGENDA = "https://www.staticline.nl/agenda";

test("een andere pagina in dezelfde taal krijgt de banden", () => {
  assert.equal(classifyLink({ href: "/agenda", current: HOME }), "band");
  assert.equal(classifyLink({ href: "/en/band", current: "https://www.staticline.nl/en" }), "band");
});

test("dezelfde pagina in de andere taal is de taalwissel", () => {
  assert.equal(classifyLink({ href: "/en/agenda", current: AGENDA }), "lang");
  assert.equal(classifyLink({ href: "/", current: "https://www.staticline.nl/en" }), "lang");
});

test("een andere pagina in de andere taal krijgt niets", () => {
  assert.equal(classifyLink({ href: "/en/band", current: AGENDA }), "none");
});

test("het besloten deel heeft een eigen root layout en krijgt geen overgang", () => {
  assert.equal(classifyLink({ href: "/beheer", current: HOME }), "none");
  assert.equal(classifyLink({ href: "/beheer/boekingen", current: HOME }), "none");
});

test("mailto, andere sites, nieuwe tabbladen en modifiers krijgen niets", () => {
  assert.equal(classifyLink({ href: "mailto:boekingen@staticline.nl", current: HOME }), "none");
  assert.equal(classifyLink({ href: "https://loburg.nl/tickets", current: HOME }), "none");
  assert.equal(classifyLink({ href: "/agenda", current: HOME, target: "_blank" }), "none");
  assert.equal(classifyLink({ href: "/agenda", current: HOME, modified: true }), "none");
  assert.equal(classifyLink({ href: "/assets/og.jpg", current: HOME }), "none");
});

test("een anker op dezelfde pagina is scrollen, geen paginawissel", () => {
  assert.equal(classifyLink({ href: "/#shows", current: HOME }), "none");
  assert.equal(classifyLink({ href: "#shows", current: AGENDA }), "none");
  assert.equal(classifyLink({ href: "/agenda?jaar=2026", current: AGENDA }), "none");
});

test("een anker op een andere pagina is wél een paginawissel", () => {
  assert.equal(classifyLink({ href: "/band#lid-4", current: HOME }), "band");
});

test("taal en pad uit een adres", () => {
  assert.equal(localeOfPath("/en"), "en");
  assert.equal(localeOfPath("/en/agenda"), "en");
  // Een Nederlands pad dat toevallig met "en" begint, is geen Engels.
  assert.equal(localeOfPath("/enquete"), "nl");
  assert.equal(stripLocale("/en"), "/");
  assert.equal(stripLocale("/en/agenda"), "/agenda");
  assert.equal(stripLocale("/agenda"), "/agenda");
});

test("kanalen hebben het nummer uit het menu, in beide talen", () => {
  // Het menu: 01 Shows, 02 Muziek, 03 Video, 04 Foto's, 05 Band.
  MENU_PATHS.forEach((path, i) => {
    assert.equal(channelFor(path), i + 1, path);
    assert.equal(channelFor(`/en${path}`), i + 1, `/en${path}`);
  });
  assert.equal(channelFor("/muziek"), 2);
  assert.equal(channelLabel("/muziek", "MUZIEK"), "CH 02 · MUZIEK");
  assert.equal(channelLabel("/agenda", "SHOWS"), "CH 01 · SHOWS");
});

test("de homepage is kanaal 00, Boeken komt na het menu", () => {
  assert.equal(channelFor("/"), 0);
  assert.equal(channelFor("/en"), 0);
  assert.equal(channelFor("/boeken"), 6);
  assert.equal(channelFor("/agenda/iets"), 1);
});
