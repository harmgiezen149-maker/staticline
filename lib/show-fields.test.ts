import assert from "node:assert/strict";
import { test } from "node:test";

import { showTime, showTitle } from "./show-fields.ts";

test("een eigen naam van de avond komt mee", () => {
  assert.equal(showTitle("LoBandNight", "Loburg", "Wageningen", true), "LoBandNight");
  assert.equal(showTitle("  LoBandNight ", "Loburg", "Wageningen", true), "LoBandNight");
});

test("een titel die alleen de zaal herhaalt, is geen naam", () => {
  assert.equal(showTitle("Loburg", "Loburg", "Wageningen", true), null);
  assert.equal(showTitle("loburg", "Loburg", "Wageningen", true), null);
  assert.equal(showTitle("Loburg, Wageningen", "Loburg", "Wageningen", true), null);
  assert.equal(showTitle("Loburg Wageningen", "Loburg", "Wageningen", true), null);
});

test("kwam de zaal uit de titel, dan is er geen aparte naam", () => {
  assert.equal(showTitle("Loburg, Wageningen", "Loburg", "Wageningen", false), null);
  assert.equal(showTitle("LoBandNight", "LoBandNight", "", false), null);
});

test("geen titel is geen naam", () => {
  assert.equal(showTitle("", "Loburg", "", true), null);
  assert.equal(showTitle(undefined, "Loburg", "", true), null);
});

test("de tijd komt uit het tijdveld, netjes op vijf tekens", () => {
  assert.equal(showTime("20:00"), "20:00");
  assert.equal(showTime("9:30"), "09:30");
  assert.equal(showTime("20.30"), "20:30");
});

test("zonder tijd geen tijd, en geen middernacht", () => {
  assert.equal(showTime(""), null);
  assert.equal(showTime(undefined), null);
  assert.equal(showTime("TBA"), null);
});
