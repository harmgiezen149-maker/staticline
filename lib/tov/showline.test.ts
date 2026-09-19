import assert from "node:assert/strict";
import { test } from "node:test";

import { formatShowDateLong, formatTime } from "../i18n.ts";
import { buildFactsheet } from "./factsheet.ts";

/**
 * De tijdzoneval, vastgelegd.
 *
 * De Band App bewaart de kloktijd van de band als UTC-onderdelen, bewust zonder
 * zomertijd: 20:00 in de zaal staat als `20:00Z` in de database. Formatteren met
 * `Europe/Amsterdam` zet elke show in de zomer een uur verkeerd — en in het
 * feitenblad is dat erger dan op een pagina, want dit is wat het model als
 * waarheid aanneemt en wat de controle als "waar" accepteert.
 *
 * lib/tov/sources.ts gebruikt hiervoor de helpers uit lib/i18n.ts. Deze test
 * bewijst dat die helpers op UTC formatteren, zodat een latere `toLocaleString`
 * met een tijdzone erbij hier stukloopt in plaats van stil een uur te schuiven.
 */

// Zomertijd: in Europe/Amsterdam is dit 22:00, in UTC 20:00.
const ZOMERSHOW = "2026-07-11T20:00:00.000Z";
// Wintertijd: een uur verschil, waar het dus níet opvalt.
const WINTERSHOW = "2026-11-10T20:00:00.000Z";

test("een zomershow houdt de kloktijd van de zaal", () => {
  assert.equal(formatTime(ZOMERSHOW), "20:00");
});

test("een wintershow houdt de kloktijd van de zaal", () => {
  assert.equal(formatTime(WINTERSHOW), "20:00");
});

test("de datum schuift niet over een middernachtgrens", () => {
  // 23:30Z op 10 november is in Amsterdam al 11 november. In het feitenblad
  // hoort het de tiende te blijven — dat is de dag die op de poster staat.
  assert.ok(formatShowDateLong("2026-11-10T23:30:00.000Z", "nl").includes("10"));
});

test("de showregel in het feitenblad draagt die tijd ongewijzigd door", () => {
  const f = buildFactsheet({
    upcoming: [
      {
        id: 1,
        when: [formatShowDateLong(ZOMERSHOW, "nl"), formatTime(ZOMERSHOW)].join(" · "),
        venue: "Loburg",
        city: "Wageningen",
        status: "aangekondigd",
      },
    ],
  });

  assert.ok(f.text.includes("20:00"));
  assert.ok(!f.text.includes("22:00"));
});
