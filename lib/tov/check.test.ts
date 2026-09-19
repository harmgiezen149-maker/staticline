import assert from "node:assert/strict";
import { test } from "node:test";

import {
  checkOutput,
  countWords,
  extractTokens,
  findBlocked,
  findInvented,
  hasEmDash,
} from "./check.ts";

const BLOCK = ["unieke", "blijf op de hoogte", "reis"];

test("links, mentions en hashtags komen er los uit", () => {
  const t = extractTokens("Kaartjes: https://loburg.nl/tickets @loburg #grunge #rock");

  assert.deepEqual(t.links, ["https://loburg.nl/tickets"]);
  assert.deepEqual(t.mentions, ["@loburg"]);
  assert.deepEqual(t.hashtags, ["#grunge", "#rock"]);
});

test("een tijd wordt genormaliseerd, zodat 20.00 en 20:00 gelijk tellen", () => {
  assert.deepEqual(extractTokens("Deuren 20.00").times, ["20:00"]);
  assert.deepEqual(extractTokens("Deuren 20:00").times, ["20:00"]);
});

test("een jaartal is geen tijd", () => {
  const t = extractTokens("10 november 2026");
  assert.deepEqual(t.times, []);
  assert.ok(t.numbers.includes("2026"));
});

test("een getal in een link telt niet apart mee", () => {
  const t = extractTokens("https://voorbeeld.nl/2026/tickets");
  assert.deepEqual(t.numbers, []);
});

test("een ontbrekende link is een probleem voor het model", () => {
  const r = checkOutput({
    source: "Kaartjes via https://loburg.nl/tickets",
    output: "Kaartjes via de zaal.",
    maxWords: 60,
    blocklist: BLOCK,
  });

  assert.equal(r.problems.length, 1);
  assert.ok(r.problems[0].includes("https://loburg.nl/tickets"));
});

test("een ongewijzigde hashtag levert geen probleem op", () => {
  const r = checkOutput({
    source: "Repetitie #grunge",
    output: "Oefenruimte. Vier uur. #grunge",
    maxWords: 40,
    blocklist: BLOCK,
  });

  assert.deepEqual(r.problems, []);
});

test("te lang levert zowel een probleem als een melding op", () => {
  const r = checkOutput({
    source: "kort",
    output: "een twee drie vier vijf zes",
    maxWords: 3,
    blocklist: BLOCK,
  });

  assert.equal(r.wordCount, 6);
  assert.ok(r.problems.some((p) => p.includes("limiet is 3")));
  assert.ok(r.flags.some((f) => f.type === "too_long"));
});

test("een verboden woord wordt gevonden, ongeacht hoofdletters", () => {
  const r = checkOutput({
    source: "iets",
    output: "Een Unieke avond.",
    maxWords: 40,
    blocklist: BLOCK,
  });

  assert.ok(r.problems.some((p) => p.includes("unieke")));
});

test("een verboden woord middenin een ander woord telt niet", () => {
  assert.deepEqual(findBlocked("We reisden naar Ede.", ["reis"]), []);
  assert.deepEqual(findBlocked("Een lange reis.", ["reis"]), ["reis"]);
});

test("een verboden zinswending van meerdere woorden wordt gevonden", () => {
  assert.deepEqual(findBlocked("Blijf op de hoogte!", BLOCK), ["blijf op de hoogte"]);
});

test("een gedachtestreepje wordt gezien", () => {
  assert.equal(hasEmDash("Hard — en kort."), true);
  assert.equal(hasEmDash("Hard, en kort."), false);
});

test("een verdwenen getal is een melding en geen probleem", () => {
  // Het model kan er niets mee; de gebruiker moet het weten.
  const r = checkOutput({
    source: "Entree 12 euro.",
    output: "Entree aan de deur.",
    maxWords: 60,
    blocklist: BLOCK,
  });

  assert.deepEqual(r.problems, []);
  assert.ok(r.flags.some((f) => f.type === "missing_info" && f.message.includes("12")));
});

test("woorden tellen zoals een mens ze telt", () => {
  assert.equal(countWords("  Eén   twee\ndrie "), 3);
  assert.equal(countWords(""), 0);
});

test("een verzonnen aanvangstijd is een probleem", () => {
  // Het geval waarvoor findInvented bestaat: de bron noemt geen tijd, het model
  // vult er een in omdat een aankondiging er nu eenmaal een heeft.
  const r = checkOutput({
    source: "AGENDA — KOMEND\n- 10 november 2026 · Loburg, Wageningen · aangekondigd",
    output: "10 november. Loburg, Wageningen. Deur open 20:30.",
    maxWords: 60,
    blocklist: BLOCK,
  });

  assert.ok(r.problems.some((p) => p.includes("20:30")));
  assert.ok(r.flags.some((f) => f.type === "invented"));
});

test("een verzonnen link en mention zijn een probleem", () => {
  const r = checkOutput({
    source: "Loburg, Wageningen.",
    output: "Kaartjes: https://loburg.nl/tickets. Met dank aan @loburg.",
    maxWords: 60,
    blocklist: BLOCK,
  });

  assert.ok(r.problems.some((p) => p.includes("https://loburg.nl/tickets")));
  assert.ok(r.problems.some((p) => p.includes("@loburg")));
});

test("een hashtag die er niet in stond mag er wel bij", () => {
  // Een social post hoort hashtags te krijgen; die staan niet in de agenda.
  const r = checkOutput({
    source: "10 november. Loburg.",
    output: "10 november. Loburg. #staticline",
    maxWords: 40,
    blocklist: BLOCK,
  });

  assert.deepEqual(r.problems, []);
});

test("een getal dat er niet in stond is een melding en geen probleem", () => {
  const r = checkOutput({
    source: "Loburg, Wageningen.",
    output: "4 man op het podium in Loburg, Wageningen.",
    maxWords: 40,
    blocklist: BLOCK,
  });

  assert.deepEqual(r.problems, []);
  assert.ok(r.flags.some((f) => f.type === "missing_info"));
});

test("een voluit geschreven getal wordt niet gezien", () => {
  // De grens van deze controle, expres vastgelegd: `extractTokens` zoekt
  // cijfers. "Vier man" komt er ongemerkt doorheen, "4 man" niet. Dat is de
  // reden dat getallen een melding geven en geen fout — een controle die de
  // helft mist, hoort geen tekst tegen te houden.
  const r = checkOutput({
    source: "Loburg, Wageningen.",
    output: "Vier man op het podium in Loburg, Wageningen.",
    maxWords: 40,
    blocklist: BLOCK,
  });

  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.flags, []);
});

test("findInvented kijkt de andere kant op dan de rest", () => {
  const bron = extractTokens("20:00 https://a.nl");
  const doel = extractTokens("21:00 https://a.nl");

  assert.deepEqual(findInvented(bron, doel).times, ["21:00"]);
  assert.deepEqual(findInvented(bron, doel).links, []);
});
