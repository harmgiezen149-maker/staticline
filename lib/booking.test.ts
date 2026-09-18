import test from "node:test";
import assert from "node:assert/strict";

import { bookingToText, looksLikeEmail, readBooking } from "./booking.ts";

/**
 * Tests voor het opschonen van een binnenkomende aanvraag.
 *
 * Dit is de enige route op de site waar iemand van buiten tekst naar binnen
 * stuurt. Wat hier doorheen glipt, belandt in de app van de band en in hun
 * pushmeldingen.
 */

test("naam en e-mail zijn het enige dat echt moet", () => {
  const result = readBooking({ name: "Zaal De Vorstin", email: "boeker@vorstin.nl" });
  assert.ok("data" in result);
  assert.equal(result.data.name, "Zaal De Vorstin");
  assert.equal(result.data.email, "boeker@vorstin.nl");
});

test("zonder naam of geldig adres komt er niets door", () => {
  assert.deepEqual(readBooking({ email: "a@b.nl" }), { error: "no-name" });
  assert.deepEqual(readBooking({ name: "Jan" }), { error: "no-email" });
  assert.deepEqual(readBooking({ name: "Jan", email: "geen adres" }), {
    error: "no-email",
  });
});

test("het verborgen veld verraadt een bot", () => {
  assert.deepEqual(
    readBooking({ name: "Jan", email: "a@b.nl", website: "http://spam" }),
    { error: "bot" },
  );
});

test("de e-mailcontrole is ruim genoeg voor echte adressen", () => {
  assert.ok(looksLikeEmail("boeking+zaal@static-line.nl"));
  assert.ok(looksLikeEmail("a@b.co"));
  assert.ok(!looksLikeEmail("a@b"));
  assert.ok(!looksLikeEmail("a b@c.nl"));
  assert.ok(!looksLikeEmail(""));
});

test("bij een algemene vraag gaan de boekingsvelden niet mee", () => {
  // Iemand vult het boekingsformulier half in en wisselt dan naar "vraag". Wat
  // hij niet meer ziet staan, hoort ook niet verstuurd te worden.
  const result = readBooking({
    kind: "question",
    name: "Jan",
    email: "a@b.nl",
    date: "14 maart",
    budget: "350",
    parking: "yes",
    message: "Spelen jullie ook akoestisch?",
  });

  assert.ok("data" in result);
  assert.equal(result.data.kind, "question");
  assert.equal(result.data.date, "");
  assert.equal(result.data.budget, "");
  assert.equal(result.data.parking, "unknown");
  // Het bericht zelf blijft wel staan — dat is de vraag.
  assert.equal(result.data.message, "Spelen jullie ook akoestisch?");
});

test("een onbekende keuze wordt onbekend, niet ja", () => {
  const result = readBooking({
    kind: "booking",
    name: "Jan",
    email: "a@b.nl",
    parking: "misschien",
    pa: "ja hoor",
  });
  assert.ok("data" in result);
  assert.equal(result.data.parking, "unknown");
  assert.equal(result.data.pa, "unknown");
});

test("de PA kent ook 'in te huren'", () => {
  const result = readBooking({
    kind: "booking",
    name: "Jan",
    email: "a@b.nl",
    pa: "rent",
  });
  assert.ok("data" in result);
  assert.equal(result.data.pa, "rent");
});

test("te lange invoer wordt afgekapt in plaats van geweigerd", () => {
  const result = readBooking({
    name: "x".repeat(400),
    email: "a@b.nl",
    kind: "booking",
    message: "y".repeat(5000),
  });
  assert.ok("data" in result);
  assert.equal(result.data.name.length, 120);
  assert.equal(result.data.message.length, 2000);
});

test("het bericht bevat alleen wat is ingevuld", () => {
  const result = readBooking({
    kind: "booking",
    name: "Jan",
    email: "a@b.nl",
    date: "14 maart",
    budget: "350",
    parking: "yes",
    message: "Graag twee sets.",
  });
  assert.ok("data" in result);

  const text = bookingToText(result.data);
  assert.match(text, /Datum: 14 maart/);
  assert.match(text, /Budget: 350/);
  assert.match(text, /Parkeergelegenheid: ja/);
  assert.match(text, /Graag twee sets\./);
  // Niet ingevuld is geen informatie en hoort er niet als lege regel in te staan.
  assert.ok(!text.includes("Locatie"));
  assert.ok(!text.includes("Backstage"));
});

test("een lege aanvraag levert een leeg bericht op", () => {
  const result = readBooking({ kind: "question", name: "Jan", email: "a@b.nl" });
  assert.ok("data" in result);
  assert.equal(bookingToText(result.data), "");
});
