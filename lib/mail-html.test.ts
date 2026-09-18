import assert from "node:assert/strict";
import { test } from "node:test";

import { escapeHtml, toHtml } from "./mail-html.ts";

/**
 * In deze mails staat invoer van bezoekers: de naam en het bericht uit het
 * boekingsformulier gaan rechtstreeks de HTML in. Daar horen tests bij.
 */

test("escapeHtml maakt een tag onschadelijk", () => {
  assert.equal(
    escapeHtml('<script>alert("x")</script>'),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
  );
});

test("escapeHtml doet de ampersand als eerste", () => {
  // Andersom zou &lt; nog eens langskomen en &amp;lt; worden.
  assert.equal(escapeHtml("&lt;"), "&amp;lt;");
});

test("een naam met een apostrof breekt niets", () => {
  assert.equal(escapeHtml("D'Angelo"), "D&#39;Angelo");
});

test("toHtml zet elke regel in een alinea", () => {
  const html = toHtml(["Hoi", "Tot ziens"]);
  assert.match(html, /<p [^>]*>Hoi<\/p>/);
  assert.match(html, /<p [^>]*>Tot ziens<\/p>/);
});

test("een lege regel levert geen lege alinea op", () => {
  assert.equal((toHtml(["een", "", "twee"]).match(/<p /g) ?? []).length, 2);
});

test("een adres wordt een link", () => {
  const html = toHtml(["https://www.staticline.nl/nieuwsbrief/bevestigen?token=abc"]);
  assert.match(
    html,
    /<a href="https:\/\/www\.staticline\.nl\/nieuwsbrief\/bevestigen\?token=abc"/,
  );
});

test("een verzonnen adres in een bericht kan niet uit het attribuut breken", () => {
  // Wat een bezoeker ook intikt: linkify draait op al geëscapete tekst, dus er
  // is geen aanhalingsteken meer over om het href mee af te sluiten.
  // Ruwe invoer, precies zoals ze uit het formulier komt: toHtml escapet zelf.
  const html = toHtml(['https://x.nl" onmouseover="alert(1)']);
  assert.match(html, /<a href="https:\/\/x\.nl"/);
  assert.ok(!html.includes('onmouseover="'));
});

test("javascript: wordt geen link", () => {
  const html = toHtml(["javascript:alert(1)"]);
  assert.ok(!html.includes("<a "));
});
