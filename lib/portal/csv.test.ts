import assert from "node:assert/strict";
import { test } from "node:test";

import { csvField, toCsv } from "./csv.ts";

test("gewone tekst blijft zoals hij is", () => {
  assert.equal(csvField("harm@voorbeeld.nl"), "harm@voorbeeld.nl");
});

test("een komma zet het veld tussen aanhalingstekens", () => {
  assert.equal(csvField("Giezen, Harm"), '"Giezen, Harm"');
});

test("een aanhalingsteken wordt verdubbeld", () => {
  assert.equal(csvField('hij zei "ja"'), '"hij zei ""ja"""');
});

test("een regelovergang zet het veld tussen aanhalingstekens", () => {
  assert.equal(csvField("regel een\nregel twee"), '"regel een\nregel twee"');
});

test("een veld dat als formule gelezen kan worden, wordt tekst", () => {
  for (const start of ["=", "+", "-", "@"]) {
    const field = csvField(`${start}HYPERLINK("http://kwaad.nl")`);
    assert.ok(field.startsWith(`"'${start}`), `${start} niet afgeschermd: ${field}`);
  }
});

test("een tab of een regelovergang vooraan telt ook als risico", () => {
  assert.ok(csvField("\t=1+1").includes("'\t"));
});

test("rijen worden met CRLF gescheiden", () => {
  assert.equal(toCsv([["a", "b"], ["c", "d"]]), "a,b\r\nc,d");
});
