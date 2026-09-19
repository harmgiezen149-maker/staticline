import assert from "node:assert/strict";
import { test } from "node:test";

import { buildFactsheet, isSourceKey } from "./factsheet.ts";

test("een leeg feitenblad zegt dat het leeg is", () => {
  const f = buildFactsheet({});

  assert.equal(f.empty, true);
  assert.equal(f.text, "");
  assert.deepEqual(f.sections, []);
});

test("alleen aangeleverde bronnen komen erin", () => {
  const f = buildFactsheet({
    band: { name: "Static Line", city: "Ede" },
  });

  assert.deepEqual(f.sections, ["BAND"]);
  assert.ok(f.text.includes("naam: Static Line"));
  assert.ok(f.text.includes("plaats: Ede"));
  assert.ok(!f.text.includes("AGENDA"));
});

test("een lege bron levert geen leeg kopje op", () => {
  // Een aangevinkte bron waar niets in staat — bijvoorbeeld een agenda die nog
  // leeg is — hoort geen kopje op te leveren waar niets onder staat.
  const f = buildFactsheet({ upcoming: [], members: [], band: { name: "Static Line" } });

  assert.deepEqual(f.sections, ["BAND"]);
});

test("een show komt als één regel met alles erin", () => {
  const f = buildFactsheet({
    upcoming: [
      {
        id: 1,
        when: "10 november 2026 · 20:00",
        venue: "Loburg",
        city: "Wageningen",
        status: "aangekondigd",
        ticketUrl: null,
      },
    ],
  });

  assert.ok(f.text.includes("10 november 2026 · 20:00 · Loburg, Wageningen · aangekondigd"));
});

test("het onderwerp staat vooraan", () => {
  const f = buildFactsheet({
    band: { name: "Static Line" },
    subject: { label: "Lid", lines: ["naam: Harm Giezen", "instrument: bas"] },
  });

  assert.equal(f.sections[0], "ONDERWERP — LID");
  assert.ok(f.text.indexOf("Harm Giezen") < f.text.indexOf("Static Line"));
});

test("het aantal nummers staat er als feit bij", () => {
  // "negentien nummers" hoort in een bio te kunnen; zonder deze regel zou het
  // model moeten tellen, en een geteld getal is een verzonnen getal.
  const f = buildFactsheet({
    setlist: [
      { title: "Song A", artist: "Band A" },
      { title: "Song B", artist: "Band B" },
    ],
  });

  assert.ok(f.text.includes("aantal nummers: 2"));
});

test("aantekeningen worden per regel opgenomen", () => {
  const f = buildFactsheet({ notes: "120 man\nsnaar gebroken in nummer drie" });

  assert.deepEqual(f.sections, ["AANTEKENINGEN VAN DE SCHRIJVER"]);
  assert.ok(f.text.includes("- 120 man"));
  assert.ok(f.text.includes("- snaar gebroken in nummer drie"));
});

test("hetzelfde feitenblad ziet er twee keer hetzelfde uit", () => {
  // De prompt hoort niet te veranderen als er inhoudelijk niets verandert.
  const bron = {
    band: { name: "Static Line", bio: "Vier man uit Ede." },
    members: [{ id: 1, name: "Harm Giezen", instrument: "bas" }],
  };

  assert.equal(buildFactsheet(bron).text, buildFactsheet(bron).text);
});

test("onbekende bronsleutels worden herkend als onbekend", () => {
  assert.equal(isSourceKey("band"), true);
  assert.equal(isSourceKey("agenda"), false);
});
